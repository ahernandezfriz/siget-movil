// controllers/patientController.js
const pool = require('../db');

// @desc    Registrar un nuevo paciente y su primer registro académico
// @route   POST /api/patients
// @access  Private
const createPatientAndFirstRecord = async (req, res) => {
    // Datos para la tabla Pacientes (la ficha)
    const { nombre_completo, rut, fecha_nacimiento, nombre_apoderado, telefono_apoderado, email_apoderado } = req.body;
    // Datos para la tabla Registros_Academicos (el historial del año)
    const { año, curso, diagnostico } = req.body;

    const profesional_id = req.user.id;

    if (!nombre_completo || !rut || !año || !curso) {
        return res.status(400).json({ error: 'Nombre, RUT, año y curso son obligatorios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Crear la ficha del paciente (o encontrarla si ya existe por RUT)
        let paciente;
        const existingPatient = await client.query('SELECT * FROM Pacientes WHERE rut = $1', [rut]);

        if (existingPatient.rows.length > 0) {
            paciente = existingPatient.rows[0];
        } else {
            const newPatientQuery = `
                INSERT INTO Pacientes (nombre_completo, rut, fecha_nacimiento, nombre_apoderado, telefono_apoderado, email_apoderado, profesional_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
            `;
            const newPatient = await client.query(newPatientQuery, [nombre_completo, rut, fecha_nacimiento, nombre_apoderado, telefono_apoderado, email_apoderado, profesional_id]);
            paciente = newPatient.rows[0];
        }

        // 2. Crear el registro académico para el año especificado
        const newRecordQuery = `
            INSERT INTO Registros_Academicos (paciente_id, profesional_id, año, curso, diagnostico)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const newRecord = await client.query(newRecordQuery, [paciente.id, profesional_id, año, curso, diagnostico]);

        await client.query('COMMIT');
        res.status(201).json({
            paciente: paciente,
            registro: newRecord.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear paciente y registro:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        client.release();
    }
};

// @desc    Obtener todos mis pacientes del AÑO ACTUAL
// @route   GET /api/patients
// @access  Private
const getMyCurrentPatients = async (req, res) => {
    const profesional_id = req.user.id;
    // La variable currentYear ya no es necesaria en esta consulta.

    try {
        const query = `
            SELECT DISTINCT ON (p.id)
                p.id,
                p.nombre_completo,
                p.rut,
                ra.curso,
                ra.año
            FROM Pacientes p
            JOIN Registros_Academicos ra ON p.id = ra.paciente_id
            WHERE p.profesional_id = $1
            ORDER BY p.id, ra.año DESC;
        `;

        // --- INICIO DE LA CORRECCIÓN ---
        // Ahora solo pasamos un parámetro, que corresponde al $1 en la consulta.
        const patients = await pool.query(query, [profesional_id]);
        // --- FIN DE LA CORRECCIÓN ---

        res.status(200).json(patients.rows);
    } catch (err) {
        console.error('Error al obtener pacientes:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// @desc    Obtener la ficha completa y el historial de un paciente
// @route   GET /api/patients/:id
// @access  Private
const getPatientHistory = async (req, res) => {
    const { id } = req.params;
    const profesional_id = req.user.id;

    try {
        const patientQuery = 'SELECT * FROM Pacientes WHERE id = $1';
        const recordsQuery = 'SELECT * FROM Registros_Academicos WHERE paciente_id = $1 ORDER BY año DESC';

        const patientRes = await pool.query(patientQuery, [id]);
        if (patientRes.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado.' });
        }

        const recordsRes = await pool.query(recordsQuery, [id]);

        res.status(200).json({
            ficha_paciente: patientRes.rows[0],
            historial_academico: recordsRes.rows
        });

    } catch (err) {
        console.error('Error al obtener historial del paciente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};



// @desc    Actualizar los detalles de la ficha de un paciente
// @route   PUT /api/patients/:id
// @access  Private
const updatePatientDetails = async (req, res) => {
    const { id: patientId } = req.params;
    const profesional_id = req.user.id;
    const {
        nombre_completo,
        rut,
        fecha_nacimiento,
        nombre_apoderado,
        telefono_apoderado,
        email_apoderado
    } = req.body;

    if (!nombre_completo || !rut) {
        return res.status(400).json({ error: 'Nombre completo y RUT son obligatorios.' });
    }

    try {
        const query = `
            UPDATE Pacientes
            SET nombre_completo = $1, rut = $2, fecha_nacimiento = $3,
                nombre_apoderado = $4, telefono_apoderado = $5, email_apoderado = $6
            WHERE id = $7 AND profesional_id = $8
            RETURNING *;
        `;

        const result = await pool.query(query, [
            nombre_completo, rut, fecha_nacimiento, nombre_apoderado,
            telefono_apoderado, email_apoderado, patientId, profesional_id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado o no autorizado para editar.' });
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        // Reincorporamos el manejo de error específico para RUT duplicado
        if (err.code === '23505' && err.constraint === 'pacientes_rut_key') {
            return res.status(409).json({ error: 'El RUT ya está en uso por otro paciente.' });
        }
        console.error('Error al actualizar paciente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};



// @desc    Eliminar un paciente Y TODO SU HISTORIAL
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res) => {
    const { id } = req.params;
    try {
        // Gracias a "ON DELETE CASCADE", al eliminar al paciente,
        // PostgreSQL eliminará automáticamente todos sus registros académicos.
        const deletedPatient = await pool.query('DELETE FROM Pacientes WHERE id = $1 RETURNING *;', [id]);
        if (deletedPatient.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado.' });
        }
        res.status(200).json({ message: `Paciente '${deletedPatient.rows[0].nombre_completo}' y todo su historial han sido eliminados.` });
    } catch (err) {
        console.error('Error al eliminar paciente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};


// @desc    Añadir un nuevo registro académico a un paciente existente
// @route   POST /api/patients/:id/records
// @access  Private
const addAcademicRecord = async (req, res) => {
    const { id: patientId } = req.params; // ID del paciente desde la URL
    const { año, curso, diagnostico } = req.body;
    const profesional_id = req.user.id; // ID del profesional desde el token

    if (!año || !curso) {
        return res.status(400).json({ error: 'Año y curso son obligatorios.' });
    }

    try {
        // Opcional: Verificar si ya existe un registro para ese paciente en ese año
        const existingRecord = await pool.query(
            'SELECT id FROM Registros_Academicos WHERE paciente_id = $1 AND año = $2',
            [patientId, año]
        );

        if (existingRecord.rows.length > 0) {
            return res.status(409).json({ error: `Ya existe un registro para este paciente en el año ${año}.` });
        }

        const query = `
            INSERT INTO Registros_Academicos (paciente_id, profesional_id, año, curso, diagnostico)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const newRecord = await pool.query(query, [patientId, profesional_id, año, curso, diagnostico]);

        res.status(201).json(newRecord.rows[0]);

    } catch (err) {
        console.error('Error al añadir registro académico:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Y aquí irían las funciones para actualizar y eliminar, que podemos añadir a continuación.

module.exports = {
    createPatientAndFirstRecord,
    getMyCurrentPatients,
    getPatientHistory,
    updatePatientDetails, 
    deletePatient, 
    addAcademicRecord,    
};
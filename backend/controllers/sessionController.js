// controllers/sessionController.js
const pool = require('../db');

const puppeteer = require('puppeteer'); //PDF

// @desc    Crear una nueva sesión con sus actividades
// @route   POST /api/records/:recordId/sessions
// @access  Private
const createSessionWithActivities = async (req, res) => {
    const { recordId } = req.params;
    const { fecha_sesion, observaciones, actividades } = req.body;

    if (!fecha_sesion || !actividades || !Array.isArray(actividades) || actividades.length === 0) {
        return res.status(400).json({ error: 'Fecha y al menos una actividad son obligatorias.' });
    }

    const client = await pool.connect();
    try {
        // --- INICIO DE LA CORRECCIÓN ---
        // VERIFICACIÓN DE AUTORIZACIÓN: Este bloque faltaba.
        // Comprueba que el registro académico pertenece al profesional logueado.
        const recordCheck = await client.query(
            'SELECT id FROM Registros_Academicos WHERE id = $1 AND profesional_id = $2',
            [recordId, req.user.id]
        );

        if (recordCheck.rows.length === 0) {
            // Si no devuelve filas, el registro no existe o no es tuyo.
            return res.status(404).json({ error: 'Registro académico no encontrado o no autorizado.' });
        }
        // --- FIN DE LA CORRECCIÓN ---

        await client.query('BEGIN');

        // 1. Insertar la sesión "contenedor"
        const sesionQuery = `
            INSERT INTO Sesiones (registro_id, fecha_sesion, observaciones)
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const newSession = await client.query(sesionQuery, [recordId, fecha_sesion, observaciones]);
        const sesionId = newSession.rows[0].id;

        // 2. Insertar todas las actividades
        const actividadesInsertQuery = `
            INSERT INTO Actividades (sesion_id, descripcion_actividad, evaluacion)
            SELECT $1, d.descripcion_actividad, d.evaluacion
            FROM json_to_recordset($2) AS d(descripcion_actividad TEXT, evaluacion INTEGER);
        `;
        await client.query(actividadesInsertQuery, [sesionId, JSON.stringify(actividades)]);

        // 3. Obtener el resultado completo para devolverlo
        const finalResult = await client.query(
            `SELECT s.*,
                (SELECT json_agg(a.*) FROM Actividades a WHERE a.sesion_id = s.id) as actividades
             FROM Sesiones s WHERE s.id = $1`, [sesionId]
        );

        await client.query('COMMIT');
        res.status(201).json(finalResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear la sesión:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        client.release();
    }
};

// El resto del archivo (getSessionsForRecord, deleteSession) permanece igual...
// @desc    Obtener todas las sesiones (con sus actividades) de un registro
// @route   GET /api/records/:recordId/sessions
// @access  Private
const getSessionsForRecord = async (req, res) => {
    const { recordId } = req.params;
    const profesional_id = req.user.id;
    try {
        // <-- CORRECCIÓN DE SEGURIDAD: Comprobar que el registro pertenece al profesional
        const recordCheck = await pool.query('SELECT id FROM Registros_Academicos WHERE id = $1 AND profesional_id = $2', [recordId, profesional_id]);
        if (recordCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Registro académico no encontrado o no autorizado.' });
        }
        // Fin de la corrección

        const query = `
            SELECT s.*,
                (SELECT json_agg(a.*) FROM Actividades a WHERE a.sesion_id = s.id) as actividades
            FROM Sesiones s
            WHERE s.registro_id = $1
            ORDER BY s.fecha_sesion DESC;
        `;
        const sessions = await pool.query(query, [recordId]);
        res.status(200).json(sessions.rows);
    } catch (err) {
        console.error('Error al obtener sesiones:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// @desc    Eliminar una sesión completa y todas sus actividades
// @route   DELETE /api/sessions/:sessionId
// @access  Private
const deleteSession = async (req, res) => {
    const { sessionId } = req.params;
    const profesional_id = req.user.id;
    try {
        // <-- CORRECCIÓN DE SEGURIDAD: Añadimos un JOIN para verificar el profesional_id
        const deleteQuery = `
            DELETE FROM Sesiones s
            WHERE s.id = $1 AND EXISTS (
                SELECT 1 FROM Registros_Academicos ra
                WHERE ra.id = s.registro_id AND ra.profesional_id = $2
            )
            RETURNING *;
        `;
        const result = await pool.query(deleteQuery, [sessionId, profesional_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada.' });
        }
        res.status(200).json({ message: 'Sesión y sus actividades han sido eliminadas.' });
    } catch (err) {
        console.error('Error al eliminar la sesión:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// @desc    Actualizar una sesión completa (incluyendo sus actividades)
// @route   PUT /api/sessions/:sessionId
// @access  Private
const updateSessionWithActivities = async (req, res) => {
    const { sessionId } = req.params;
    const { fecha_sesion, observaciones, actividades } = req.body;
    const profesional_id = req.user.id;

    if (!fecha_sesion || !actividades || !Array.isArray(actividades)) {
        return res.status(400).json({ error: 'Fecha y un array de actividades son obligatorios.' });
    }

    const client = await pool.connect();
    try {
        // <-- CORRECCIÓN DE SEGURIDAD: Verificar la pertenencia antes de hacer nada
        const recordCheck = await client.query(
            `SELECT 1 FROM Sesiones s
             JOIN Registros_Academicos ra ON s.registro_id = ra.id
             WHERE s.id = $1 AND ra.profesional_id = $2`,
            [sessionId, profesional_id]
        );
        if (recordCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada.' });
        }
        // Fin de la corrección

        await client.query('BEGIN');

        const sesionQuery = `
            UPDATE Sesiones SET
                fecha_sesion = $1,
                observaciones = $2
            WHERE id = $3 RETURNING *;
        `;
        await client.query(sesionQuery, [fecha_sesion, observaciones, sessionId]);

        await client.query('DELETE FROM Actividades WHERE sesion_id = $1', [sessionId]);

        if (actividades.length > 0) {
            const actividadesInsertQuery = `
                INSERT INTO Actividades (sesion_id, descripcion_actividad, evaluacion)
                SELECT $1, d.descripcion_actividad, d.evaluacion
                FROM json_to_recordset($2) AS d(descripcion_actividad TEXT, evaluacion INTEGER);
            `;
            await client.query(actividadesInsertQuery, [sessionId, JSON.stringify(actividades)]);
        }

        const finalResult = await client.query(
            `SELECT s.*,
                (SELECT json_agg(a.*) FROM Actividades a WHERE a.sesion_id = s.id) as actividades
             FROM Sesiones s WHERE s.id = $1`, [sessionId]
        );

        await client.query('COMMIT');
        res.status(200).json(finalResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar la sesión:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        client.release();
    }
};



// @desc    Exportar una sesión específica a PDF
// @route   GET /api/sessions/:sessionId/pdf
// @access  Private
const exportSessionToPdf = async (req, res) => {
    const { sessionId } = req.params;
    const profesional_id = req.user.id;
    
    // --- PUNTOS DE CONTROL ---
    console.log(`\n[PDF Sesión #${sessionId}] 1. Iniciando proceso de exportación.`);

    try {
        const query = `
            SELECT s.*,
                   p.nombre_completo as paciente_nombre, p.rut as paciente_rut,
                   pr.nombre_completo as profesional_nombre
            FROM Sesiones s
            JOIN Registros_Academicos ra ON s.registro_id = ra.id
            JOIN Pacientes p ON ra.paciente_id = p.id
            JOIN Profesionales pr ON ra.profesional_id = pr.id
            WHERE s.id = $1 AND ra.profesional_id = $2;
        `;
        const sessionResult = await pool.query(query, [sessionId, profesional_id]);

        if (sessionResult.rows.length === 0) {
            console.log(`[PDF Sesión #${sessionId}] Error: Sesión no encontrada o no autorizada.`);
            return res.status(404).json({ error: 'Sesión no encontrada o no autorizada.' });
        }
        const sessionData = sessionResult.rows[0];

        const activitiesResult = await pool.query('SELECT * FROM Actividades WHERE sesion_id = $1', [sessionId]);
        const activitiesData = activitiesResult.rows;

        console.log(`[PDF Sesión #${sessionId}] 2. Datos obtenidos de la base de datos.`);

        // ... (la lógica del HTML no cambia) ...
        const fechaFormateada = new Date(sessionData.fecha_sesion).toLocaleDateString('es-CL');
        let activitiesHtml = '';
        activitiesData.forEach(act => {
            activitiesHtml += `<tr><td>${act.descripcion_actividad}</td><td>${act.evaluacion}/5</td></tr>`;
        });
        const htmlContent = `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Sesión</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
                .container { width: 90%; margin: auto; }
                h1 { color: #4a4a4a; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #777; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Reporte de Sesión Individual</h1>
                <p><strong>Paciente:</strong> ${sessionData.paciente_nombre} (${sessionData.paciente_rut})</p>
                <p><strong>Profesional:</strong> ${sessionData.profesional_nombre}</p>
                <p><strong>Fecha de la Sesión:</strong> ${fechaFormateada}</p>
                <h2>Actividades Realizadas</h2>
                <table>
                    <thead><tr><th>Actividad</th><th>Evaluación</th></tr></thead>
                    <tbody>${activitiesHtml}</tbody>
                </table>
                <h2>Observaciones</h2>
                <p>${sessionData.observaciones || 'Sin observaciones.'}</p>
            </div>
            <div class="footer">Reporte generado por SIGET Móvil &copy; ${new Date().getFullYear()}</div>
        </body>
        </html>`; // El HTML largo va aquí, no es necesario copiarlo de nuevo

        console.log(`[PDF Sesión #${sessionId}] 3. Contenido HTML generado. A punto de lanzar Puppeteer...`);
        
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        console.log(`[PDF Sesión #${sessionId}] 4. Puppeteer lanzado. Creando nueva página...`);
        
        const page = await browser.newPage();
        console.log(`[PDF Sesión #${sessionId}] 5. Página creada. Estableciendo contenido...`);
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        console.log(`[PDF Sesión #${sessionId}] 6. Contenido establecido. Generando buffer del PDF...`);
        
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        console.log(`[PDF Sesión #${sessionId}] 7. PDF generado. Enviando respuesta al cliente...`);
        
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="reporte-sesion-${sessionId}.pdf"`
        });
        res.send(pdfBuffer);
        console.log(`[PDF Sesión #${sessionId}] 8. ¡Proceso completado exitosamente!`);

    } catch (err) {
        console.error(`[PDF Sesión #${sessionId}] ❌ ERROR ATRAPADO:`, err);
        res.status(500).json({ error: 'Error interno al generar el PDF.' });
    }
};


module.exports = {
    createSessionWithActivities,
    getSessionsForRecord,
    deleteSession,
    updateSessionWithActivities,
    exportSessionToPdf 
};
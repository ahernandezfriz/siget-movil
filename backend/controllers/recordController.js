// controllers/recordController.js
const pool = require('../db');
const puppeteer = require('puppeteer'); // Para PDF

// @desc    Actualizar un registro académico específico (curso, diagnóstico, etc.)
// @route   PUT /api/records/:id
// @access  Private
const updateAcademicRecord = async (req, res) => {
    const { id } = req.params; // ID del registro, no del paciente
    const { año, curso, diagnostico } = req.body;
    const profesional_id = req.user.id;

    try {
        const query = `
            UPDATE Registros_Academicos SET
                año = COALESCE($1, año),
                curso = COALESCE($2, curso),
                diagnostico = COALESCE($3, diagnostico)
            WHERE id = $4 AND profesional_id = $5
            RETURNING *;
        `;
        const updatedRecord = await pool.query(query, [año, curso, diagnostico, id, profesional_id]);
        if (updatedRecord.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado o no pertenece a este profesional.' });
        }
        res.status(200).json(updatedRecord.rows[0]);
    } catch (err) {
        console.error('Error al actualizar registro:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// @desc    Eliminar un registro académico específico
// @route   DELETE /api/records/:id
// @access  Private
const deleteAcademicRecord = async (req, res) => {
    const { id } = req.params; // ID del registro
    const profesional_id = req.user.id;
    try {
        const query = 'DELETE FROM Registros_Academicos WHERE id = $1 AND profesional_id = $2 RETURNING *;';
        const deletedRecord = await pool.query(query, [id, profesional_id]);
        if (deletedRecord.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado o no pertenece a este profesional.' });
        }
        res.status(200).json({ message: `Registro del año ${deletedRecord.rows[0].año} eliminado.` });
    } catch (err) {
        console.error('Error al eliminar registro:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};


// @desc    Exportar un registro académico completo (consolidado) a PDF
// @route   GET /api/records/:id/pdf
// @access  Private
const exportRecordToPdf = async (req, res) => {
    const { id: recordId } = req.params;
    const profesional_id = req.user.id;

    try {
        // 1. Obtener datos del registro, paciente y profesional
        const recordQuery = `
            SELECT ra.año, ra.curso, ra.diagnostico,
                   p.nombre_completo as paciente_nombre, p.rut as paciente_rut,
                   pr.nombre_completo as profesional_nombre
            FROM Registros_Academicos ra
            JOIN Pacientes p ON ra.paciente_id = p.id
            JOIN Profesionales pr ON ra.profesional_id = pr.id
            WHERE ra.id = $1 AND ra.profesional_id = $2;
        `;
        const recordResult = await pool.query(recordQuery, [recordId, profesional_id]);
        if (recordResult.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado o no autorizado.' });
        }
        const recordData = recordResult.rows[0];

        // 2. Obtener TODAS las sesiones y sus actividades para este registro
        const sessionsQuery = `
            SELECT s.id, s.fecha_sesion, s.observaciones,
                   (SELECT json_agg(act.*) FROM Actividades act WHERE act.sesion_id = s.id) as actividades
            FROM Sesiones s
            WHERE s.registro_id = $1
            ORDER BY s.fecha_sesion ASC;
        `;
        const sessionsResult = await pool.query(sessionsQuery, [recordId]);
        const sessionsData = sessionsResult.rows;

        // 3. Construir el HTML dinámicamente
        let sessionsHtml = '';
        sessionsData.forEach(session => {
            let activitiesHtml = '';
            if (session.actividades) {
                session.actividades.forEach(act => {
                    activitiesHtml += `<tr><td>${act.descripcion_actividad}</td><td>${act.evaluacion}/5</td></tr>`;
                });
            } else {
                activitiesHtml = `<tr><td colspan="2">No hay actividades registradas.</td></tr>`;
            }

            sessionsHtml += `
                <div class="session-block">
                    <h4>Sesión del ${new Date(session.fecha_sesion).toLocaleDateString('es-CL')}</h4>
                    <p><strong>Observaciones:</strong> ${session.observaciones || 'N/A'}</p>
                    <table>
                        <thead><tr><th>Actividad</th><th>Evaluación</th></tr></thead>
                        <tbody>${activitiesHtml}</tbody>
                    </table>
                </div>
            `;
        });

        const htmlContent = `
            <!DOCTYPE html><html><head><title>Reporte Consolidado</title><style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
                .container { width: 90%; margin: auto; }
                h1 { color: #4a4a4a; border-bottom: 2px solid #4a90e2; padding-bottom: 10px; }
                .session-block { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #777; }
            </style></head><body>
                <div class="container">
                    <h1>Reporte Consolidado</h1>
                    <p><strong>Paciente:</strong> ${recordData.paciente_nombre} (${recordData.paciente_rut})</p>
                    <p><strong>Profesional:</strong> ${recordData.profesional_nombre}</p>
                    <p><strong>Período Académico:</strong> ${recordData.año} (${recordData.curso})</p>
                    <hr>
                    ${sessionsHtml || '<p>No hay sesiones registradas en este período.</p>'}
                </div>
                <div class="footer">Reporte generado por SIGET Móvil &copy; ${new Date().getFullYear()}</div>
            </body></html>
        `;

        // 4. Generar y enviar el PDF
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="consolidado-${recordId}.pdf"`
        });
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Error al generar el PDF consolidado:', err);
        res.status(500).json({ error: 'Error interno al generar el PDF.' });
    }
};

module.exports = {
    updateAcademicRecord,
    deleteAcademicRecord,
    exportRecordToPdf
};
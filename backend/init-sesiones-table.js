const pool = require('./db');

async function initializeTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("-> Eliminando tabla 'Sesiones' antigua si existe...");
        await client.query('DROP TABLE IF EXISTS Sesiones CASCADE;');
        console.log("✅ Tabla antigua eliminada.");

        console.log("-> Creando nueva tabla 'Sesiones' (contenedor)...");
        const createSesionesTable = `
            CREATE TABLE Sesiones (
                id SERIAL PRIMARY KEY,
                registro_id INTEGER NOT NULL REFERENCES Registros_Academicos(id) ON DELETE CASCADE,
                fecha_sesion TIMESTAMP NOT NULL,
                observaciones TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(createSesionesTable);
        console.log("✅ Tabla 'Sesiones' creada.");

        console.log("-> Creando tabla 'Actividades' (evaluables)...");
        const createActividadesTable = `
            CREATE TABLE Actividades (
                id SERIAL PRIMARY KEY,
                sesion_id INTEGER NOT NULL REFERENCES Sesiones(id) ON DELETE CASCADE,
                descripcion_actividad TEXT NOT NULL,
                evaluacion INTEGER CHECK (evaluacion >= 1 AND evaluacion <= 5)
            );
        `;
        await client.query(createActividadesTable);
        console.log("✅ Tabla 'Actividades' creada.");

        await client.query('COMMIT');
        console.log("\n¡Estructura de Sesiones y Actividades inicializada correctamente!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Error durante la inicialización:", err);
    } finally {
        client.release();
        pool.end();
    }
}

initializeTables();
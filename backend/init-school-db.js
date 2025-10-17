const pool = require('./db');

const dropOldTableIfExists = 'DROP TABLE IF EXISTS Pacientes CASCADE;';

const createPacientesTable = `
  CREATE TABLE Pacientes (
      id SERIAL PRIMARY KEY,
      nombre_completo VARCHAR(255) NOT NULL,
      rut VARCHAR(12) NOT NULL UNIQUE,
      fecha_nacimiento DATE,
      nombre_apoderado VARCHAR(255),
      telefono_apoderado VARCHAR(20),
      email_apoderado VARCHAR(255),
      profesional_id INTEGER NOT NULL REFERENCES Profesionales(id),
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createRegistrosTable = `
  CREATE TABLE Registros_Academicos (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER NOT NULL REFERENCES Pacientes(id) ON DELETE CASCADE,
      profesional_id INTEGER NOT NULL REFERENCES Profesionales(id),
      año INTEGER NOT NULL,
      curso VARCHAR(100) NOT NULL,
      diagnostico TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciar transacción

    console.log("-> Eliminando tabla 'Pacientes' antigua si existe...");
    await client.query(dropOldTableIfExists);
    console.log("✅ Tabla antigua eliminada.");

    console.log("-> Creando tabla 'Pacientes' (Ficha Personal)...");
    await client.query(createPacientesTable);
    console.log("✅ Tabla 'Pacientes' creada exitosamente.");

    console.log("-> Creando tabla 'Registros_Academicos' (Historial)...");
    await client.query(createRegistrosTable);
    console.log("✅ Tabla 'Registros_Academicos' creada exitosamente.");

    await client.query('COMMIT'); // Finalizar transacción
    console.log("\n¡Base de datos escolar inicializada correctamente!");
  } catch (err) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    console.error("❌ Error durante la inicialización de la base de datos:", err);
  } finally {
    client.release();
    pool.end();
  }
}

initializeDatabase();
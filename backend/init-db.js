const pool = require('./db');

const createTableQuery = `
  CREATE TABLE Profesionales (
      id SERIAL PRIMARY KEY,
      nombre_completo VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      especialidad VARCHAR(100),
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createTableQuery)
  .then(res => {
    console.log("✅ Tabla 'Profesionales' creada exitosamente.");
    pool.end(); // Cierra la conexión
  })
  .catch(err => {
    console.error("❌ Error al crear la tabla:", err);
    pool.end(); // Cierra la conexión
  });
// Cargar las variables de entorno del archivo .env
require('dotenv').config();

// Importar la librería 'pg'
const { Pool } = require('pg');

// Crear un "pool" de conexiones a la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exportar el pool para que pueda ser usado en otras partes de la aplicación
module.exports = pool;
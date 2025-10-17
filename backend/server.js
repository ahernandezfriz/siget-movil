// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors'); 

// Importaciones de rutas
const authRoutes = require('./routes/authRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const patientRoutes = require('./routes/patientRoutes');
const recordRoutes = require('./routes/recordRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// --- MIDDLEWARE ---
// cors() DEBE ser de los primeros.
app.use(cors()); 
app.use(express.json());

// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/sessions', sessionRoutes);

app.get('/', (req, res) => {
  res.send('¡API de SIGET Móvil funcionando!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
const pool = require('../db'); // Importamos nuestro conector a la BD
const bcrypt = require('bcrypt'); // Importamos bcrypt para hashear contraseñas
const jwt = require('jsonwebtoken'); // <-- 1. Importar la librería

// Función para registrar un nuevo profesional
const register = async (req, res) => {
  // 1. Extraer los datos del cuerpo de la petición (request body)
  const { nombre_completo, email, password, especialidad } = req.body;

  // Validación básica
  if (!nombre_completo || !email || !password) {
    return res.status(400).json({ error: 'Nombre completo, email y contraseña son obligatorios.' });
  }

  try {
    // 2. Hashear la contraseña para almacenarla de forma segura
    const saltRounds = 10; // Número de rondas de salting
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Crear la consulta SQL para insertar el nuevo usuario
    const insertQuery = `
      INSERT INTO Profesionales (nombre_completo, email, password_hash, especialidad)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, fecha_creacion;
    `;

    // 4. Ejecutar la consulta en la base de datos
    const newUser = await pool.query(insertQuery, [nombre_completo, email, password_hash, especialidad]);

    // 5. Enviar una respuesta exitosa al cliente
    console.log('✅ Profesional registrado exitosamente:', newUser.rows[0]);
    res.status(201).json({
      message: 'Profesional registrado exitosamente.',
      user: newUser.rows[0]
    });

  } catch (err) {
    // Manejo de errores (ej. email duplicado)
    if (err.code === '23505') { // Código de error de PostgreSQL para violación de unicidad
      return res.status(409).json({ error: 'El correo electrónico ya está en uso.' });
    }

    console.error('❌ Error al registrar al profesional:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};



/*
    Función para iniciar sesión de un profesional
    =========================================================
*/
const login = async (req, res) => {
    // 1. Extraer email y password del cuerpo de la petición
    const { email, password } = req.body;
  
    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }
  
    try {
        // 2. Buscar al profesional por su email en la base de datos
        const findUserQuery = 'SELECT * FROM Profesionales WHERE email = $1';
        const result = await pool.query(findUserQuery, [email]);
        
        // Si no se encuentra ningún usuario con ese email
        if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas.' }); // Usamos un mensaje genérico por seguridad
        }

        const professional = result.rows[0];

        // 3. Comparar la contraseña enviada con el hash almacenado en la BD
        const isMatch = await bcrypt.compare(password, professional.password_hash);



        // Si las contraseñas no coinciden
        if (!isMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas.' }); // Mensaje genérico
        }

        // 4. Si las credenciales son correctas, crear el "payload" del token
        const payload = {
            user: {
            id: professional.id,
            email: professional.email,
            nombre: professional.nombre_completo,
            especialidad: professional.especialidad
            }
        };

            // 5. Firmar el token usando el secreto del .env
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '12h' } // El token expirará en 1 hora
        );


            // 6. Enviar el token al cliente
        res.status(200).json({
            message: 'Login exitoso.',
            token: token // <-- Enviamos el token generado
        });

    } catch (err) {
        console.error('❌ Error en el login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Exportamos la función para poder usarla en las rutas
module.exports = {
  register,
  login,
};
// src/components/LoginScreen.jsx
import React, { useState } from 'react'; // 1. Importar useState
import { useNavigate } from 'react-router-dom'; // 1. Importar useNavigate
import { jwtDecode } from 'jwt-decode'; 
import './LoginScreen.css';

function LoginScreen() {
    // 2. Crear "estados" para guardar lo que el usuario escribe
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Estado para el mensaje de error
    const navigate = useNavigate(); // 2. Inicializar el hook de navegación

    // 3. Función que se ejecuta cuando el usuario presiona "Acceder"
    const handleSubmit = async (event) => {
        event.preventDefault(); // Evita que la página se recargue
        setError(''); // Limpia cualquier error anterior

        try {
            // 4. Enviar los datos a la API del backend
            const response = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // 5. Manejar la respuesta de la API
            if (!response.ok) {
                // Si la respuesta es un error (ej: 401 Credenciales inválidas)
                throw new Error(data.error || 'Algo salió mal');
            }

            const token = data.token;
            const decodedToken = jwtDecode(token); // 2. Decodificar el token

            // 3. Guardar el token en el localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(decodedToken.user));

            // 4. Redirigir al usuario al dashboard
            navigate('/dashboard');

            // ¡Login exitoso!
            console.log('Login exitoso:', data);
            //alert('¡Inicio de sesión exitoso!');
            // Aquí es donde guardaríamos el token y navegaríamos a otra página
            // localStorage.setItem('token', data.token);

        } catch (err) {
            // Si hubo un error en la petición o en la respuesta
            setError(err.message); // Muestra el mensaje de error
            console.error('Error en el login:', err);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Iniciar Sesión</h1>
                {/* 6. Conectar el formulario a la función handleSubmit */}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        {/* 7. Conectar los inputs a sus estados */}
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Acceder</button>
                </form>
                {/* 8. Mostrar el mensaje de error si existe */}
                {error && <p className="error-message" style={{ display: 'block' }}>{error}</p>}
            </div>
        </div>
    );
}

export default LoginScreen;
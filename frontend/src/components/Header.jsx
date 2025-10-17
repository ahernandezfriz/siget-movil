// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // Cargar los datos del usuario desde localStorage cuando el componente se monta
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) {
        return null; // No mostrar nada si no hay usuario (ej. en la página de login)
    }

    return (
        <header className="main-header">
            <div className="header-content">
                <Link to="/dashboard" className="logo">SIGET Móvil</Link>
                <div className="user-menu">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="user-menu-button">
                        {user.nombre} ▼
                    </button>
                    {menuOpen && (
                        <div className="user-menu-dropdown">
                            <Link to="/profile" className="menu-item">Mi Perfil</Link>
                            <button onClick={handleLogout} className="menu-item logout-button">Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
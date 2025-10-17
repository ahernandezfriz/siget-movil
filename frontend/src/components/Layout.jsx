// src/components/Layout.jsx
// La clave aquí es el componente <Outlet />, que actúa como un marcador de posición donde React Router renderizará la página actual (Dashboard, PatientDetail, etc.).
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

function Layout() {
    return (
        <div className="app-layout">
            <Header />
            <main className="app-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
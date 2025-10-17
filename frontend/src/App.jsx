// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import PatientDetail from './components/PatientDetail';
import Layout from './components/Layout'; // <-- Importar Layout

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* La ruta de Login queda fuera del Layout */}
                <Route path="/" element={<LoginScreen />} />

                {/* Ruta "padre" que protege y aplica el Layout a todas sus rutas "hijas" */}
                <Route
                    path="/"
                    element={<PrivateRoute><Layout /></PrivateRoute>}
                >
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="patient/:id" element={<PatientDetail />} />
                    {/* Próximamente: <Route path="profile" element={<ProfileScreen />} /> */}
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
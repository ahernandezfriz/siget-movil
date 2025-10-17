// src/components/Dashboard.jsx
import React, { useState, useEffect,useCallback } from 'react';
import { Link } from 'react-router-dom';
import NewPatientForm from './NewPatientForm'; // Formulario registrar paciente

function Dashboard() {
    // Estado para guardar la lista de pacientes que viene de la API
    const [patients, setPatients] = useState([]);
    // Estado para manejar mensajes de carga o error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);

    // useEffect se ejecuta después de que el componente se renderiza en la pantalla
    const fetchPatients = useCallback(async () => {
        setLoading(true); // Se puede poner aquí para que se active al refrescar
            try {
                // 1. Obtener el token guardado en localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No se encontró el token de autenticación.');
                }

                // 2. Hacer la petición a la API, incluyendo el token en las cabeceras
                const response = await fetch('http://localhost:4000/api/patients', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Error al obtener los datos de los pacientes.');
                }

                const data = await response.json();
                setPatients(data); // Guardar los pacientes en el estado

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // Marcar que la carga ha terminado
            }
    }, []); // El array vacío [] asegura que esto se ejecute solo una vez

    // Un único useEffect llama a la función cuando el componente se monta.
    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handlePatientCreated = () => {
        setIsFormVisible(false); // Cierra el modal
        fetchPatients(); // Vuelve a cargar la lista de pacientes
    };



    // Lógica para mostrar contenido basado en el estado de carga
    let content;
    if (loading) {
        content = <p>Cargando pacientes...</p>;
    } else if (error) {
        content = <p style={{ color: 'red' }}>{error}</p>;
    } else if (patients.length === 0) {
        content = <p>No tienes pacientes registrados para este año.</p>;
    } else {
        content = (
            <table>
                <thead>
                    <tr>
                        <th>Nombre Completo</th>
                        <th>RUT</th>
                        <th>Curso</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(patient => (
                        <tr key={patient.id}>
                            <td>
                                {/* 2. Convertir el nombre en un enlace */}
                                <Link to={`/patient/${patient.id}`}>
                                    {patient.nombre_completo}
                                </Link></td>
                            <td>{patient.rut}</td>
                            <td>{patient.curso}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Renderizado condicional del modal */}
            {isFormVisible && (
                <NewPatientForm
                    onPatientCreated={handlePatientCreated}
                    onCancel={() => setIsFormVisible(false)}
                />
            )}
            <main>
                <div className="main-header-titulo">
                    <h2>Mis Pacientes (Año Actual)</h2>
                    <button onClick={() => setIsFormVisible(true)} className="add-patient-btn">
                        + Registrar Paciente
                    </button>
                </div>
                {content}
            </main>
        </div>
    );
}

export default Dashboard;
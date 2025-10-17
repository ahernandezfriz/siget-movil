// src/components/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react'; // 1. Añadimos useMemo
import { Link } from 'react-router-dom';
import NewPatientForm from './NewPatientForm';
import SearchBar from './ui/SearchBar'; // 2. Importamos nuestro nuevo componente

function Dashboard() {
    // 3. Renombramos los estados para mayor claridad
    const [allPatients, setAllPatients] = useState([]); // La lista original de la API
    const [searchTerm, setSearchTerm] = useState(''); // El texto del buscador
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);

    // La función para buscar datos no cambia, solo el nombre del estado que actualiza
    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No autenticado');
                
                const response = await fetch('http://localhost:4000/api/patients', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Error al obtener los datos.');

                const data = await response.json();
                setAllPatients(data); // Guardamos la lista completa
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const handlePatientCreated = () => {
        setIsFormVisible(false);
        // FIXME: Deberíamos recargar la lista aquí, lo dejaremos para después por simplicidad.
        // fetchPatients(); // Esto funcionaría
        window.location.reload(); // Solución simple por ahora
    };

    // 4. Lógica de filtrado con useMemo para eficiencia
    // Esto solo se recalculará si allPatients o searchTerm cambian.
    const filteredPatients = useMemo(() => {
        if (!searchTerm) {
            return allPatients;
        }
        return allPatients.filter(patient =>
            patient.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.rut.includes(searchTerm)
        );
    }, [allPatients, searchTerm]);

    // ... (El JSX para la tabla es casi el mismo, solo cambia la variable que mapea)

    return (
        <div className="dashboard-container">
            {isFormVisible && (
                <NewPatientForm
                    onPatientCreated={handlePatientCreated}
                    onCancel={() => setIsFormVisible(false)}
                />
            )}
            
            <main>
                <div className="content-header">
                    <h2>Mis Pacientes (Año Actual)</h2>
                    <button onClick={() => setIsFormVisible(true)} className="add-patient-btn">
                        + Registrar Paciente
                    </button>
                </div>

                {/* 5. Añadimos el componente de búsqueda */}
                <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Buscar por nombre o RUT..."
                />

                {/* 6. Renderizamos el contenido basado en la lista FILTRADA */}
                {loading && <p>Cargando pacientes...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    filteredPatients.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>RUT</th>
                                    <th>Curso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map(patient => (
                                    <tr key={patient.id}>
                                        <td><Link to={`/patient/${patient.id}`}>{patient.nombre_completo}</Link></td>
                                        <td>{patient.rut}</td>
                                        <td>{patient.curso}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>{searchTerm ? 'No se encontraron pacientes.' : 'No tienes pacientes registrados.'}</p>
                    )
                )}
            </main>
        </div>
    );
}

export default Dashboard;
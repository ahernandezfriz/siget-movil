// src/components/PatientDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import NewSessionForm from './NewSessionForm';
import NewRecordForm from './NewRecordForm';
import { downloadPdf } from '../utils/downloadHelper';
import EditPatientForm from './EditPatientForm';
import EditSessionForm from './EditSessionForm';

function PatientDetail() {
    const { id } = useParams();
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formVisibleForRecord, setFormVisibleForRecord] = useState(null);
    const [isRecordFormVisible, setIsRecordFormVisible] = useState(false);
    const [isEditFormVisible, setIsEditFormVisible] = useState(false);
    const [editingSession, setEditingSession] = useState(null);


    // 1. Mueve useCallback al nivel superior del componente, no dentro de useEffect.
    const fetchPatientDetail = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No autorizado.');

            const patientResponse = await fetch(`http://localhost:4000/api/patients/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!patientResponse.ok) throw new Error('No se pudo cargar la información del paciente.');
            const initialData = await patientResponse.json();

            const historialCompleto = await Promise.all(
                initialData.historial_academico.map(async (record) => {
                    const sessionsResponse = await fetch(`http://localhost:4000/api/records/${record.id}/sessions`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!sessionsResponse.ok) {
                        console.error(`Error al obtener sesiones para el registro ${record.id}`);
                        return { ...record, sesiones: [] };
                    }
                    const sesiones = await sessionsResponse.json();
                    return { ...record, sesiones };
                })
            );

            setPatientData({
                ficha_paciente: initialData.ficha_paciente,
                historial_academico: historialCompleto,
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]); // La función solo se volverá a crear si el 'id' de la URL cambia.

    // 2. Usa un solo useEffect para llamar a la función.
    useEffect(() => {
        fetchPatientDetail();
    }, [fetchPatientDetail]); // Este efecto se ejecuta cuando la página carga y si el 'id' cambia.

    const handleSessionCreated = () => {
        setFormVisibleForRecord(null);
        fetchPatientDetail(); // Ahora esto funciona correctamente.
    };

    const handleRecordCreated = () => {
        setIsRecordFormVisible(false); // Cierra el formulario
        fetchPatientDetail(); // Refresca los datos
    };

    const handlePatientUpdated = () => {
        setIsEditFormVisible(false); // Cierra el modal
        fetchPatientDetail(); // Refresca los datos de la página
    };

    const handleEditSession = (session) => {
        // 3. Al hacer clic en editar, guardamos la sesión completa en el estado
        console.log("Datos de la sesión al hacer clic en Editar:", session);
        setEditingSession(session);
    };
    const handleSessionUpdated = () => {
        setEditingSession(null); // Cierra el modal de edición
        fetchPatientDetail(); // Refresca los datos para mostrar los cambios
    };



    const handleDeleteSession = async (sessionIdToDelete) => {
        // 1. Mostrar un diálogo de confirmación
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer.')) {
            return; // Si el usuario cancela, no hacer nada
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/sessions/${sessionIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'No se pudo eliminar la sesión.');
            }

            // 2. Si la eliminación fue exitosa, refrescar los datos
            alert('Sesión eliminada exitosamente.');
            fetchPatientDetail(); // Vuelve a cargar toda la información del paciente

        } catch (err) {
            console.error('Error al eliminar la sesión:', err);
            alert(`Error: ${err.message}`);
        }
    };

   

    if (loading) return <p>Cargando detalles del paciente...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!patientData) return <p>No se encontraron datos para este paciente.</p>;

    const { ficha_paciente, historial_academico } = patientData;

    // El JSX para mostrar los datos ya estaba perfecto.
    return (
        <div className="detail-container">
            <Link to="/dashboard" className="back-link">&larr; Volver al Dashboard</Link>
            
            <div className="patient-card">
                
                <div className="patient-card-header"> {/* 3. Nuevo div para alinear el botón */}
                    <h2>{ficha_paciente.nombre_completo}</h2>
                    <button onClick={() => setIsEditFormVisible(true)} className="edit-btn">Editar Ficha</button>
                </div>
                
                {/*<h2>{ficha_paciente.nombre_completo}</h2>*/}
                <p><strong>RUT:</strong> {ficha_paciente.rut}</p>
                <p><strong>Fecha de Nacimiento:</strong> {new Date(ficha_paciente.fecha_nacimiento).toLocaleDateString('es-CL')}</p>
                <hr />
                <p><strong>Apoderado:</strong> {ficha_paciente.nombre_apoderado}</p>
                <p><strong>Email Apoderado:</strong> {ficha_paciente.email_apoderado}</p>
                <p><strong>Teléfono Apoderado:</strong> {ficha_paciente.telefono_apoderado}</p>
               
            </div>

            {/* 4. Renderizar el modal de edición */}
            {isEditFormVisible && (
                <EditPatientForm
                    patient={ficha_paciente}
                    onPatientUpdated={handlePatientUpdated}
                    onCancel={() => setIsEditFormVisible(false)}
                />
            )}

            {/* Sección para añadir un nuevo registro académico (Ahora está aquí) */}
            <div className="add-record-section">
                <button onClick={() => setIsRecordFormVisible(true)} className="add-record-btn">
                    + Añadir Registro Académico
                </button>
            </div>

            <div className="record-header">
                <h3>Historial Académico y Sesiones</h3>
            </div>
           
            {historial_academico.map(record => (
                <div key={record.id} className="record-card">
                    
                    

                    {/* 4. Renderizar el nuevo formulario modal */}
                    {isRecordFormVisible && (
                        <NewRecordForm
                            patientId={id}
                            onRecordCreated={handleRecordCreated}
                            onCancel={() => setIsRecordFormVisible(false)}
                        />
                    )}

                    {/* Renderizar el modal de edición si hay una sesión seleccionada */}
                    {editingSession && (
                        <EditSessionForm
                            sessionToEdit={editingSession}
                            onSessionUpdated={handleSessionUpdated}
                            onCancel={() => setEditingSession(null)}
                        />
                    )}

                    <h4>Año {record.año} - {record.curso}</h4>
                    <div className="header-buttons"> {/* 2. Contenedor para los botones */}
                            {/* Botón para el PDF Consolidado */}
                            <button 
                                onClick={() => downloadPdf(`http://localhost:4000/api/records/${record.id}/pdf`, `consolidado-${record.id}.pdf`)}
                                className="download-btn"
                            >
                                Descargar Consolidado
                            </button>
                            <button onClick={() => setFormVisibleForRecord(record.id)} className="add-session-btn">
                                + Nueva Sesión
                            </button>
                        </div>

                    {/*<button onClick={() => setFormVisibleForRecord(record.id)} className="add-session-btn">
                        + Nueva Sesión
                </button>*/}

                    
                    <p><strong>Diagnóstico:</strong> {record.diagnostico || 'No especificado'}</p>
                    
                    {record.sesiones && record.sesiones.length > 0 ? (
                        record.sesiones.map(sesion => (
                            <div key={sesion.id} className="session-card">
                                {/* 2. Modificar la cabecera de la sesión */}
                                <div className="session-header">
                                    <h5>Sesión del {new Date(sesion.fecha_sesion).toLocaleDateString('es-CL')}</h5>
                                    
                                    {/* Contenedor para los nuevos enlaces de acción */}
                                    <div className="session-actions">
                                        <button 
                                            onClick={() => handleEditSession(sesion)}
                                            className="action-link"
                                        >
                                            Editar
                                        </button>
                                        <span>|</span>
                                        <button 
                                            onClick={() => handleDeleteSession(sesion.id)}
                                            className="action-link delete"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                                {/*<h5>Sesión del {new Date(sesion.fecha_sesion).toLocaleDateString('es-CL')}</h5>*/}
                                <p><strong>Observaciones:</strong> {sesion.observaciones || 'Sin observaciones.'}</p>
                                
                                <h6>Actividades:</h6>
                                <ul className="activities-list">
                                    {sesion.actividades && sesion.actividades.length > 0 ? (
                                        sesion.actividades.map(actividad => (
                                            <li key={actividad.id}>
                                                <span>{actividad.descripcion_actividad}</span>
                                                <span className="evaluation-badge">Evaluación: {actividad.evaluacion}/5</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li>No hay actividades registradas para esta sesión.</li>
                                    )}
                                </ul>
                                <hr />
                                {/* Botón para el PDF de Sesión Individual */}
                                <button 
                                        onClick={() => downloadPdf(`http://localhost:4000/api/sessions/${sesion.id}/pdf`, `sesion-${sesion.id}.pdf`)}
                                        className="download-btn"
                                    >
                                        Descargar Sesión
                                    </button>
                            </div>
                        ))
                    ) : (
                        <p>No hay sesiones registradas para este período.</p>
                    )}
                    
                    {formVisibleForRecord === record.id && (
                        <NewSessionForm
                            recordId={record.id}
                            onSessionCreated={handleSessionCreated}
                            onCancel={() => setFormVisibleForRecord(null)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default PatientDetail;
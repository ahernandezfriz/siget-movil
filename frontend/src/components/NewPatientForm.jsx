// src/components/NewPatientForm.jsx
import React, { useState } from 'react';

function NewPatientForm({ onPatientCreated, onCancel }) {
    // Estados para todos los campos del formulario
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [rut, setRut] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [nombreApoderado, setNombreApoderado] = useState('');
    const [telefonoApoderado, setTelefonoApoderado] = useState('');
    const [emailApoderado, setEmailApoderado] = useState('');
    const [año, setAño] = useState(new Date().getFullYear());
    const [curso, setCurso] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:4000/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre_completo: nombreCompleto,
                    rut,
                    fecha_nacimiento: fechaNacimiento,
                    nombre_apoderado: nombreApoderado,
                    telefono_apoderado: telefonoApoderado,
                    email_apoderado: emailApoderado,
                    año,
                    curso,
                    diagnostico,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'No se pudo registrar al paciente.');
            }

            onPatientCreated(); // Llama a la función del Dashboard para refrescar y cerrar

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Registrar Nuevo Paciente</h2>
                <form onSubmit={handleSubmit}>
                    {/* Usaremos un grid para organizar el formulario */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre Completo del Paciente</label>
                            <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>RUT del Paciente</label>
                            <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Fecha de Nacimiento</label>
                            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Nombre del Apoderado</label>
                            <input type="text" value={nombreApoderado} onChange={(e) => setNombreApoderado(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono del Apoderado</label>
                            <input type="text" value={telefonoApoderado} onChange={(e) => setTelefonoApoderado(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Email del Apoderado</label>
                            <input type="email" value={emailApoderado} onChange={(e) => setEmailApoderado(e.target.value)} />
                        </div>
                    </div>
                    
                    <hr className="form-divider" />
                    <h4>Primer Registro Académico</h4>

                    <div className="form-grid">
                         <div className="form-group">
                            <label>Año</label>
                            <input type="number" value={año} onChange={(e) => setAño(e.target.value)} required />
                        </div>
                         <div className="form-group">
                            <label>Curso</label>
                            <input type="text" placeholder="Ej: 1A Básico" value={curso} onChange={(e) => setCurso(e.target.value)} required />
                        </div>
                        <div className="form-group full-width">
                            <label>Diagnóstico (opcional)</label>
                            <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
                        </div>
                    </div>

                    {error && <p className="error-message" style={{ display: 'block' }}>{error}</p>}

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-btn">Cancelar</button>
                        <button type="submit" className="submit-btn">Registrar Paciente</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewPatientForm;
// src/components/EditPatientForm.jsx
import React, { useState } from 'react';

function EditPatientForm({ patient, onPatientUpdated, onCancel }) {
    // Inicializamos el estado con los datos del paciente que recibimos
    const [nombreCompleto, setNombreCompleto] = useState(patient.nombre_completo);
    const [rut, setRut] = useState(patient.rut);
    const [fechaNacimiento, setFechaNacimiento] = useState(
        patient.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toISOString().split('T')[0] : ''
    );
    const [nombreApoderado, setNombreApoderado] = useState(patient.nombre_apoderado);
    const [telefonoApoderado, setTelefonoApoderado] = useState(patient.telefono_apoderado);
    const [emailApoderado, setEmailApoderado] = useState(patient.email_apoderado);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/patients/${patient.id}`, {
                method: 'PUT',
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
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'No se pudo actualizar la ficha del paciente.');
            }

            onPatientUpdated(); // Llama a la función del padre para refrescar y cerrar
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Editar Ficha del Paciente</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre Completo del Paciente</label>
                            <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required />
                        </div>
                        {/* ... (repite la estructura para los otros campos) ... */}
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
                    {error && <p className="error-message" style={{ display: 'block' }}>{error}</p>}
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-btn">Cancelar</button>
                        <button type="submit" className="submit-btn">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditPatientForm;
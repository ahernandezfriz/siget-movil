// src/components/NewRecordForm.jsx
import React, { useState } from 'react';

function NewRecordForm({ patientId, onRecordCreated, onCancel }) {
    const [año, setAño] = useState(new Date().getFullYear());
    const [curso, setCurso] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/patients/${patientId}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ año, curso, diagnostico }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'No se pudo crear el registro.');
            }

            onRecordCreated(); // Llama a la función del padre para refrescar y cerrar

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Añadir Registro Académico</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Año</label>
                        <input type="number" value={año} onChange={(e) => setAño(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Curso</label>
                        <input type="text" placeholder="Ej: 3B Básico" value={curso} onChange={(e) => setCurso(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Diagnóstico (opcional)</label>
                        <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
                    </div>

                    {error && <p className="error-message" style={{ display: 'block' }}>{error}</p>}

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="cancel-btn">Cancelar</button>
                        <button type="submit" className="submit-btn">Guardar Registro</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewRecordForm;
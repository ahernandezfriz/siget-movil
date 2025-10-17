// src/components/EditSessionForm.jsx
import React, { useState } from 'react';

function EditSessionForm({ sessionToEdit, onSessionUpdated, onCancel }) {
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Verificamos si sessionToEdit.fecha_sesion existe ANTES de usarlo.
    // Si existe, lo formateamos. Si no, usamos una cadena vacía como valor por defecto.
    const [fecha, setFecha] = useState(
        sessionToEdit.fecha_sesion
            ? new Date(sessionToEdit.fecha_sesion).toISOString().split('T')[0]
            : ''
    );
    // --- FIN DE LA CORRECCIÓN ---

    const [observaciones, setObservaciones] = useState(sessionToEdit.observaciones || '');
    const [actividades, setActividades] = useState(sessionToEdit.actividades || []);
    const [error, setError] = useState('');

    const handleActivityChange = (index, value) => {
        const newActivities = [...actividades];
        newActivities[index].descripcion_actividad = value;
        setActividades(newActivities);
    };
    const handleEvaluationChange = (index, value) => {
        const newActivities = [...actividades];
        newActivities[index].evaluacion = parseInt(value, 10);
        setActividades(newActivities);
    };
    const addActivity = () => {
        setActividades([...actividades, { descripcion_actividad: '', evaluacion: 3 }]);
    };
    const removeActivity = (index) => {
        const newActivities = actividades.filter((_, i) => i !== index);
        setActividades(newActivities);
    };
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/sessions/${sessionToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fecha_sesion: fecha,
                    observaciones: observaciones,
                    actividades: actividades
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'No se pudo actualizar la sesión.');
            }
            
            onSessionUpdated();

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Editar Sesión del {sessionToEdit.fecha_sesion ? new Date(sessionToEdit.fecha_sesion).toLocaleDateString('es-CL') : 'Sin Fecha'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Fecha de la Sesión</label>
                        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Observaciones Generales</label>
                        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Actividades</label>
                        {actividades.map((act, index) => (
                            <div key={index} className="activity-row">
                                <input
                                    type="text"
                                    placeholder={`Actividad #${index + 1}`}
                                    value={act.descripcion_actividad || ''}
                                    onChange={(e) => handleActivityChange(index, e.target.value)}
                                    required
                                />
                                <select value={act.evaluacion} onChange={(e) => handleEvaluationChange(index, e.target.value)}>
                                    {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num}/5</option>)}
                                </select>
                                <button type="button" onClick={() => removeActivity(index)} className="remove-btn">-</button>
                            </div>
                        ))}
                        <button type="button" onClick={addActivity} className="add-btn">+ Añadir Actividad</button>
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

export default EditSessionForm;
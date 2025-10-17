// src/utils/downloadHelper.js
export const downloadPdf = async (url, filename) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor.');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        console.error('Error al descargar el PDF:', error);
        alert('No se pudo descargar el archivo. Revise la consola para más detalles.');
    }
};
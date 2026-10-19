/**
 * Archivo: api.js
 * Propósito: Centralizar llamadas HTTP adaptándose al entorno (Local vs Producción)
 */

// Si existe la variable de entorno la usa (Producción), sino usa localhost (Desarrollo local)
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ==========================================
// SERVICIOS DE AUTENTICACIÓN
// ==========================================

/**
 * Registra una cuenta nueva (reclutador o candidato).
 */
export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Error al registrar la cuenta");
  }
  return data;
}

/**
 * Inicia sesión y devuelve el token JWT firmado junto con el perfil.
 */
export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Credenciales incorrectas");
  }
  return data;
}

// ==========================================
// SERVICIOS DE EMPLEOS (JOBS)
// ==========================================

export async function getJobs() {
  const response = await fetch(`${API_URL}/jobs`);
  if (!response.ok) throw new Error("Error al obtener los empleos");
  return response.json();
}

export async function getJobById(jobId) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`);
  if (!response.ok) throw new Error("Error al obtener el detalle del empleo");
  return response.json();
}

/**
 * Crear empleo: requiere token JWT de un reclutador en la cabecera Authorization.
 */
export async function createJob(jobData, token) {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Autenticación Bearer Token
    },
    body: JSON.stringify(jobData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Error al publicar el empleo");
  }
  return data;
}

/**
 * Eliminar empleo: requiere token JWT del reclutador dueño de la oferta.
 */
export async function deleteJob(jobId, token) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al eliminar la oferta laboral");
  }
  return true;
}

// ==========================================
// SERVICIOS DE POSTULACIÓN
// ==========================================

/**
 * Envía una postulación utilizando FormData para admitir archivos PDF.
 */
export async function applyToJob(jobId, formDataPayload) {
  // Nota: Al usar FormData, NO se define manualmente 'Content-Type'
  // El navegador añade automáticamente 'multipart/form-data' con su boundary.
  const response = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: "POST",
    body: formDataPayload,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al enviar la postulación");
  }

  return await response.json();
}

/**
 * Descarga el archivo CSV de postulantes adjuntando el token JWT.
 */
export async function downloadApplicationsCSV(jobId, token) {
  const response = await fetch(`${API_URL}/jobs/${jobId}/applications/csv`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error al descargar el reporte CSV");
  }

  // Convertir respuesta a Blob para iniciar la descarga en el navegador
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `candidatos_vacante_${jobId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
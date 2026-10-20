/**
 * Archivo: api.js
 * Propósito: Centralizar llamadas HTTP adaptándose al entorno (Local vs Producción),
 * incluyendo autenticación, verificación de correo y endpoints de administración.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function extractErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const firstMsg = data.detail[0]?.msg || fallbackMessage;
    return firstMsg.replace(/^Value error,\s*/i, "");
  }
  return fallbackMessage;
}

// ==========================================
// SERVICIOS DE AUTENTICACIÓN Y VERIFICACIÓN
// ==========================================

/**
 * Registra una cuenta nueva (reclutador o candidato) con validación OWASP.
 */
export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Error al registrar la cuenta"));
  }
  return data;
}

/**
 * Confirma el correo electrónico mediante el token enviado.
 */
export async function verifyEmailToken(token) {
  const response = await fetch(
    `${API_URL}/auth/verify?token=${encodeURIComponent(token)}`
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Token de verificación inválido o expirado")
    );
  }
  return data;
}

/**
 * Solicita el reenvío del enlace de confirmación de correo.
 */
export async function resendVerificationEmail(email) {
  const response = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "No se pudo reenviar el correo de verificación")
    );
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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Credenciales incorrectas"));
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
 * Crear empleo: requiere token JWT de un reclutador o admin en la cabecera Authorization.
 */
export async function createJob(jobData, token) {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Error al publicar el empleo"));
  }
  return data;
}

/**
 * Eliminar empleo: requiere token JWT del reclutador dueño de la oferta o de un admin.
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
    throw new Error(
      extractErrorMessage(errorData, "Error al eliminar la oferta laboral")
    );
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
  const response = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: "POST",
    body: formDataPayload,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(errorData, "Error al enviar la postulación")
    );
  }

  return await response.json();
}

/**
 * Descarga el archivo CSV de postulantes adjuntando el token JWT.
 */
export async function downloadApplicationsCSV(jobId, token) {
  const response = await fetch(`${API_URL}/jobs/${jobId}/applications/csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(errorData, "Error al descargar el reporte CSV")
    );
  }

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

// ==========================================
// SERVICIOS DE ADMINISTRACIÓN (ROL 'admin')
// ==========================================

export async function getAdminStats(token) {
  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Error al obtener estadísticas de admin")
    );
  }
  return data;
}

export async function getAdminUsers(token) {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Error al obtener la lista de usuarios")
    );
  }
  return data;
}

export async function updateUserRole(userId, role, token) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Error al actualizar el rol del usuario")
    );
  }
  return data;
}

export async function verifyUserByAdmin(userId, token) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(data, "Error al verificar manualmente al usuario")
    );
  }
  return data;
}

export async function deleteUserByAdmin(userId, token) {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, "Error al eliminar el usuario"));
  }
  return true;
}

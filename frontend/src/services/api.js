const API_URL = "http://127.0.0.1:8000";

export async function getJobs() {
  const response = await fetch(`${API_URL}/jobs`);
  if (!response.ok) throw new Error("Error al obtener empleos");
  return response.json();
}

export async function createJob(jobData) {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  if (!response.ok) throw new Error("Error al publicar el empleo");
  return response.json();
}

export async function applyToJob(jobId, candidateData) {
  const response = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(candidateData),
  });
  if (!response.ok) throw new Error("Error al enviar la postulación");
  return response.json();
}

// Nueva función: eliminar oferta laboral
export async function deleteJob(jobId) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar la oferta laboral");
  return true;
}
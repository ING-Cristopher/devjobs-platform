const API_URL = "http://127.0.0.1:8000";

// Obtener todas las ofertas laborales
export async function getJobs() {
  const response = await fetch(`${API_URL}/jobs`);
  if (!response.ok) {
    throw new Error("Error al obtener los empleos");
  }
  return response.json();
}

// Crear una nueva oferta laboral
export async function createJob(jobData) {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    throw new Error("Error al publicar el empleo");
  }
  return response.json();
}
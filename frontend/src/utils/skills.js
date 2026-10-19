/**
 * Archivo: skills.js
 * Propósito: Utilidades para extraer habilidades de cada vacante (sin romper el esquema
 * del backend), calcular el porcentaje de compatibilidad y asignar colores de marca.
 */

export const BASE_SKILLS = [
  ".NET",
  "AWS",
  "C#",
  "CSS",
  "Docker",
  "Git",
  "Linux",
  "Power BI",
  "Python",
  "React",
  "Redes",
  "SIEM",
  "SQL",
  "Seguridad",
  "TypeScript",
];

const EXTRA_KNOWN_SKILLS = [
  "JavaScript",
  "Node.js",
  "FastAPI",
  "Java",
  "Tailwind",
  "PostgreSQL",
  "MongoDB",
  "Next.js",
  "Angular",
  "Vue",
  "Kubernetes",
];

const BRAND_COLORS = ["#ffb627", "#7ee0c3", "#ff8f7a", "#a9b8ff"];

/**
 * Devuelve un color pastel consistente de la paleta Chamba para cada vacante.
 */
export function getJobColor(job) {
  if (job?.col) return job.col;
  const seed = job?.id || (job?.company ? job.company.charCodeAt(0) : 0);
  return BRAND_COLORS[Math.abs(seed) % BRAND_COLORS.length];
}

/**
 * Extrae las habilidades de una vacante a partir de su título y descripción,
 * compatible 100% con el esquema actual del backend (title, company, location, job_type, description, salary).
 */
export function getJobSkills(job) {
  if (!job) return [];
  if (Array.isArray(job.s) && job.s.length > 0) return job.s;
  if (Array.isArray(job.skills) && job.skills.length > 0) return job.skills;

  const text = `${job.title || ""} ${job.description || ""}`;
  const lower = text.toLowerCase();
  const found = new Set();

  // 1. Si la descripción incluye una línea "Habilidades: X, Y, Z"
  const skillsLineMatch = (job.description || "").match(
    /(?:habilidades|skills|tecnologías|requisitos)\s*:\s*([^\n]+)/i
  );
  if (skillsLineMatch && skillsLineMatch[1]) {
    skillsLineMatch[1]
      .split(/[,·•|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 20)
      .forEach((s) => {
        const canonical = [...BASE_SKILLS, ...EXTRA_KNOWN_SKILLS].find(
          (k) => k.toLowerCase() === s.toLowerCase()
        );
        found.add(canonical || s);
      });
  }

  // 2. Detectar habilidades conocidas en título y descripción
  [...BASE_SKILLS, ...EXTRA_KNOWN_SKILLS].forEach((skill) => {
    const skLower = skill.toLowerCase();
    if (skLower === "c#") {
      if (lower.includes("c#") || lower.includes("csharp")) found.add("C#");
    } else if (skLower === ".net") {
      if (lower.includes(".net") || lower.includes("dotnet")) found.add(".NET");
    } else {
      const escaped = skLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-záéíóúñ0-9])${escaped}([^a-záéíóúñ0-9]|$)`, "i");
      if (regex.test(lower)) {
        found.add(skill);
      }
    }
  });

  // 3. Fallback inteligente según el título si la vacante no menciona tags explícitos
  if (found.size === 0) {
    if (lower.includes("front") || lower.includes("ui") || lower.includes("web")) {
      ["React", "TypeScript", "CSS", "Git"].forEach((s) => found.add(s));
    } else if (lower.includes("back") || lower.includes("api")) {
      ["Python", "SQL", "Docker", "Git"].forEach((s) => found.add(s));
    } else if (lower.includes("datos") || lower.includes("data") || lower.includes("bi")) {
      ["SQL", "Python", "Power BI"].forEach((s) => found.add(s));
    } else if (lower.includes("devops") || lower.includes("cloud") || lower.includes("infra")) {
      ["Docker", "Linux", "AWS", "Git", "Redes"].forEach((s) => found.add(s));
    } else if (lower.includes("seguridad") || lower.includes("cyber") || lower.includes("ciber")) {
      ["Seguridad", "Redes", "Linux", "SIEM"].forEach((s) => found.add(s));
    } else if (lower.includes("qa") || lower.includes("test")) {
      ["Python", "SQL", "Git", "TypeScript"].forEach((s) => found.add(s));
    } else if (lower.includes("soporte") || lower.includes("ti") || lower.includes("redes")) {
      ["Redes", "Linux", "Seguridad"].forEach((s) => found.add(s));
    } else {
      ["React", "SQL", "Git", "TypeScript"].forEach((s) => found.add(s));
    }
  }

  return Array.from(found);
}

/**
 * Calcula el porcentaje de compatibilidad (0 a 100) entre la vacante y las habilidades seleccionadas.
 */
export function getMatchScore(job, selectedSkills) {
  if (!selectedSkills || selectedSkills.size === 0) return 0;
  const jobSkills = getJobSkills(job);
  if (jobSkills.length === 0) return 0;
  const matched = jobSkills.filter((s) => selectedSkills.has(s)).length;
  return Math.round((100 * matched) / jobSkills.length);
}


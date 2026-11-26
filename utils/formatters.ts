/**
 * Reusable formatting utilities for TopPlaced AI
 * Ensures clean typography, human-readable roles, and candidate names.
 */

const ACRONYMS = new Set([
  "QA", "SDET", "AI", "ML", "HR", "UI", "UX", "API", "SQL", "AWS", "GCP", "CI", "CD", "IT", "CS", "DBA"
]);

/**
 * Converts raw snake_case or SCREAMING_SNAKE_CASE role names into clean, readable titles.
 * e.g. "FRONTEND_DEVELOPER" -> "Frontend Developer"
 *      "AI_ML_RESEARCHER" -> "AI ML Researcher"
 *      "SENIOR_QA_ENGINEER" -> "Senior QA Engineer"
 */
export function formatRoleName(role?: string | null): string {
  if (!role || typeof role !== "string") return "General Interview";

  const cleaned = role.trim();
  if (!cleaned) return "General Interview";

  // Replace underscores and hyphens with single space
  const words = cleaned.replace(/[-_]+/g, " ").split(/\s+/);

  const formatted = words.map((w) => {
    const upper = w.toUpperCase();
    if (ACRONYMS.has(upper)) {
      return upper;
    }
    // Title case
    return upper.charAt(0) + upper.slice(1).toLowerCase();
  });

  return formatted.join(" ");
}

/**
 * Formats candidate name nicely, preventing generic "user" or "Anonymous" when real info is available.
 */
export function formatCandidateName(
  fullName?: string | null,
  email?: string | null,
  fallback = "Candidate"
): string {
  if (fullName && typeof fullName === "string") {
    const trimmed = fullName.trim();
    if (trimmed && trimmed.toLowerCase() !== "user" && trimmed.toLowerCase() !== "anonymous") {
      return trimmed;
    }
  }

  if (email && typeof email === "string") {
    const prefix = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    if (prefix) {
      return prefix
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }

  return fallback;
}

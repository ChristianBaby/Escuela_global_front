export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Muy débil", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Débil", color: "bg-orange-400" };
  if (score === 3) return { score: 3, label: "Regular", color: "bg-yellow-400" };
  if (score === 4) return { score: 4, label: "Fuerte", color: "bg-green-500" };
  return { score: 5, label: "Muy fuerte", color: "bg-emerald-500" };
}

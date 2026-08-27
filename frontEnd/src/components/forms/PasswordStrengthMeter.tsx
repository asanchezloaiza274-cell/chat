import { cn } from "../../utils/cn";

function getStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

const COLORS = ["bg-danger", "bg-danger", "bg-warning", "bg-accent", "bg-success"];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 bg-surface-active", i < score && COLORS[score])}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </div>
  );
}

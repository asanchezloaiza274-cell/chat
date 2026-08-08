import { useState, forwardRef } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "../ui/Input";

interface PasswordInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label = "Password", value, onChange, error, autoComplete = "current-password", placeholder = "••••••••" }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        error={error}
        leftIcon={<Lock size={16} />}
        rightElement={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:text-ink"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";

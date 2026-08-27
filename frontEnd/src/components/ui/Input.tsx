import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightElement, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={cn(
              "h-10 w-full border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-9",
              rightElement && "pr-10",
              error && "border-danger focus:border-danger",
              className,
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightElement}</span>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

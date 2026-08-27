import { cn } from "../../utils/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5.5 w-10 shrink-0 items-center border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "border-accent bg-accent" : "border-border-strong bg-surface-active",
      )}
    >
      <span
        className={cn(
          "inline-block h-[15px] w-[15px] transform bg-white transition-transform",
          checked ? "translate-x-[21px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

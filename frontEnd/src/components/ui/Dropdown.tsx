import { useRef, useState, type ReactNode } from "react";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { cn } from "../../utils/cn";

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: (DropdownItem | "separator")[];
  align?: "left" | "right";
  placement?: "top" | "bottom";
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", placement = "bottom", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={cn(
            "shadow-elevated-sm animate-rise-in absolute z-40 min-w-[190px] rounded-2xl border border-border-strong bg-panel p-1.5",
            placement === "bottom" ? "top-full mt-1.5 origin-top" : "bottom-full mb-1.5 origin-bottom",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) =>
            item === "separator" ? (
              <div key={i} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  item.danger
                    ? "text-danger hover:bg-danger-soft"
                    : "text-ink hover:bg-surface-hover",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsRow } from "../../components/settings/SettingsRow";
import { SegmentedControl } from "../../components/settings/SegmentedControl";
import { useToast } from "../../context/ToastContext";
import { cn } from "../../utils/cn";

type Theme = "dark" | "light" | "system";
type Density = "comfortable" | "compact";

export default function AppearanceSettings() {
  const { showToast } = useToast();
  const [theme, setTheme] = useState<Theme>("dark");
  const [density, setDensity] = useState<Density>("comfortable");

  function handleThemeChange(value: Theme) {
    if (value !== "dark") {
      showToast("Light theme is coming soon", "info");
      return;
    }
    setTheme(value);
  }

  const themeOptions: { value: Theme; label: string; icon: typeof Moon }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div>
      <SettingsSection title="Theme" description="Loop currently supports a refined dark theme.">
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={cn(
                "flex flex-col items-center gap-2 border px-3 py-4 transition-colors",
                theme === value ? "border-accent bg-accent-soft text-accent" : "border-border text-ink-muted hover:bg-surface-hover",
              )}
            >
              <Icon size={18} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Density" description="Adjust the spacing of messages and lists.">
        <SettingsRow label="Layout density">
          <SegmentedControl
            value={density}
            onChange={setDensity}
            options={[
              { label: "Comfortable", value: "comfortable" },
              { label: "Compact", value: "compact" },
            ]}
          />
        </SettingsRow>

        <div className="border border-border bg-surface p-3">
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-faint">Preview</p>
          <div className={cn("flex flex-col", density === "compact" ? "gap-1" : "gap-3")}>
            <div className="max-w-[70%] self-start border-l-2 border-transparent bg-panel px-3 py-2 text-sm text-ink">
              Hey! Are we still on for later?
            </div>
            <div className="max-w-[70%] self-end border-l-2 border-accent bg-accent px-3 py-2 text-sm text-accent-ink">
              Yes, absolutely!
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

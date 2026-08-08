import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsRow } from "../../components/settings/SettingsRow";
import { Switch } from "../../components/ui/Switch";
import { SegmentedControl } from "../../components/settings/SegmentedControl";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import type { Visibility } from "../../types";

const options: { label: string; value: Visibility }[] = [
  { label: "Everyone", value: "everyone" },
  { label: "Contacts", value: "contacts" },
  { label: "Nobody", value: "nobody" },
];

export default function PrivacySettings() {
  const { currentUser, updateSettings } = useChat();
  const { showToast } = useToast();

  async function handleChange(update: Partial<typeof currentUser>) {
    try {
      await updateSettings(update);
    } catch {
      showToast("Couldn't save your preference", "error");
    }
  }

  return (
    <div>
      <SettingsSection title="Privacy" description="Control what others can see about you.">
        <SettingsRow label="Show online status" description="Let others see when you're active">
          <Switch
            checked={!!currentUser.showOnlineStatus}
            onChange={(v) => handleChange({ showOnlineStatus: v })}
            label="Show online status"
          />
        </SettingsRow>
        <SettingsRow label="Last seen" description="Who can see when you were last online">
          <SegmentedControl
            value={currentUser.lastSeenVisibility ?? "everyone"}
            onChange={(v) => handleChange({ lastSeenVisibility: v })}
            options={options}
          />
        </SettingsRow>
        <SettingsRow label="Profile photo" description="Who can see your profile photo">
          <SegmentedControl
            value={currentUser.profilePhotoVisibility ?? "everyone"}
            onChange={(v) => handleChange({ profilePhotoVisibility: v })}
            options={options}
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

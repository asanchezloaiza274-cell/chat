import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsRow } from "../../components/settings/SettingsRow";
import { Switch } from "../../components/ui/Switch";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import type { User } from "../../types";

export default function NotificationsSettings() {
  const { currentUser, updateSettings } = useChat();
  const { showToast } = useToast();

  async function handleChange(key: keyof User, value: boolean) {
    try {
      await updateSettings({ [key]: value });
    } catch {
      showToast("Couldn't save your preference", "error");
    }
  }

  return (
    <div>
      <SettingsSection title="Notifications" description="Choose what you want to be notified about.">
        <SettingsRow label="Messages" description="Get notified about new messages">
          <Switch
            checked={!!currentUser.notifyMessages}
            onChange={(v) => handleChange("notifyMessages", v)}
            label="Messages"
          />
        </SettingsRow>
        <SettingsRow label="Sounds" description="Play a sound for incoming messages">
          <Switch
            checked={!!currentUser.notifySounds}
            onChange={(v) => handleChange("notifySounds", v)}
            label="Sounds"
          />
        </SettingsRow>
        <SettingsRow label="Mentions" description="Get notified when someone mentions you">
          <Switch
            checked={!!currentUser.notifyMentions}
            onChange={(v) => handleChange("notifyMentions", v)}
            label="Mentions"
          />
        </SettingsRow>
        <SettingsRow label="Desktop notifications" description="Show notifications on your desktop">
          <Switch
            checked={!!currentUser.notifyDesktop}
            onChange={(v) => handleChange("notifyDesktop", v)}
            label="Desktop notifications"
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

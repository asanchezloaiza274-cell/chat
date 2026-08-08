import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsRow } from "../../components/settings/SettingsRow";
import { Switch } from "../../components/ui/Switch";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import { isNotificationSupported, requestNotificationPermission } from "../../utils/notifications";
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

  async function handleDesktopToggle(value: boolean) {
    if (!value) {
      await handleChange("notifyDesktop", false);
      return;
    }

    if (!isNotificationSupported()) {
      showToast("Your browser doesn't support desktop notifications", "error");
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      showToast("Enable notifications for this site in your browser settings", "error");
      return;
    }

    await handleChange("notifyDesktop", true);
    new Notification("Desktop notifications enabled", {
      body: "You'll be notified here when new messages arrive.",
      icon: "/favicon.svg",
    });
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
        <SettingsRow
          label="Desktop notifications"
          description="Show a system notification when a new message arrives"
        >
          <Switch checked={!!currentUser.notifyDesktop} onChange={handleDesktopToggle} label="Desktop notifications" />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

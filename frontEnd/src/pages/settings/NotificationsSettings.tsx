import { useState } from "react";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsRow } from "../../components/settings/SettingsRow";
import { Switch } from "../../components/ui/Switch";

export default function NotificationsSettings() {
  const [messages, setMessages] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [desktop, setDesktop] = useState(false);

  return (
    <div>
      <SettingsSection title="Notifications" description="Choose what you want to be notified about.">
        <SettingsRow label="Messages" description="Get notified about new messages">
          <Switch checked={messages} onChange={setMessages} label="Messages" />
        </SettingsRow>
        <SettingsRow label="Sounds" description="Play a sound for incoming messages">
          <Switch checked={sounds} onChange={setSounds} label="Sounds" />
        </SettingsRow>
        <SettingsRow label="Mentions" description="Get notified when someone mentions you">
          <Switch checked={mentions} onChange={setMentions} label="Mentions" />
        </SettingsRow>
        <SettingsRow label="Desktop notifications" description="Show notifications on your desktop">
          <Switch checked={desktop} onChange={setDesktop} label="Desktop notifications" />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

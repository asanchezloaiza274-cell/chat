import { useState } from "react";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsRow } from "../../components/settings/SettingsRow";
import { Switch } from "../../components/ui/Switch";
import { SegmentedControl } from "../../components/settings/SegmentedControl";

type Visibility = "everyone" | "contacts" | "nobody";

export default function PrivacySettings() {
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [lastSeen, setLastSeen] = useState<Visibility>("everyone");
  const [profilePhoto, setProfilePhoto] = useState<Visibility>("everyone");

  const options: { label: string; value: Visibility }[] = [
    { label: "Everyone", value: "everyone" },
    { label: "Contacts", value: "contacts" },
    { label: "Nobody", value: "nobody" },
  ];

  return (
    <div>
      <SettingsSection title="Privacy" description="Control what others can see about you.">
        <SettingsRow label="Show online status" description="Let others see when you're active">
          <Switch checked={showOnlineStatus} onChange={setShowOnlineStatus} label="Show online status" />
        </SettingsRow>
        <SettingsRow label="Last seen" description="Who can see when you were last online">
          <SegmentedControl value={lastSeen} onChange={setLastSeen} options={options} />
        </SettingsRow>
        <SettingsRow label="Profile photo" description="Who can see your profile photo">
          <SegmentedControl value={profilePhoto} onChange={setProfilePhoto} options={options} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

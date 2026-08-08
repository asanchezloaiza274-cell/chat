import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";

export default function AccountSettings() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useChat();
  const { showToast } = useToast();
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email ?? "");

  function handleSave() {
    updateCurrentUser({ name: name.trim(), username: username.trim(), email: email.trim() });
    showToast("Account updated", "success");
  }

  return (
    <div>
      <SettingsSection title="Profile" description="This information is visible to your contacts.">
        <div className="flex items-center gap-3">
          <Avatar name={currentUser.name} size="lg" />
          <Button variant="secondary" size="sm" onClick={() => navigate("/profile/edit")}>
            Edit profile
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Account details">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}

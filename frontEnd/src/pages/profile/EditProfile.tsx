import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, User } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useChat();
  const { showToast } = useToast();
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    updateCurrentUser({ name: name.trim(), username: username.trim(), bio: bio.trim() });
    setIsSaving(false);
    showToast("Profile updated", "success");
    navigate("/profile");
  }

  return (
    <PageLayout title="Edit profile" backTo="/profile">
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-6 py-8">
        <div className="mb-6 flex flex-col items-center">
          <Avatar name={name || currentUser.name} size="xl" />
          <p className="mt-2 text-xs text-ink-faint">Your avatar is generated from your initials</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Full name" leftIcon={<User size={16} />} value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Username"
            leftIcon={<AtSign size={16} />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Textarea
            label="Bio"
            rows={3}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a little about yourself"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}

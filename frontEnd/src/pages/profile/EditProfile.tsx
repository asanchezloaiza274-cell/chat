import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, Camera, User } from "lucide-react";
import { PageLayout } from "../../layouts/PageLayout";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { useChat } from "../../context/ChatContext";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../lib/api";

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useChat();
  const { showToast } = useToast();
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentUser.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await updateCurrentUser({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        avatarFile: avatarFile ?? undefined,
      });
      showToast("Profile updated", "success");
      navigate("/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageLayout title="Edit profile" backTo="/profile">
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-6 py-8">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <Avatar name={name || currentUser.name} size="xl" imageUrl={avatarPreview} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change avatar"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-panel bg-accent text-accent-ink hover:bg-accent-hover"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            {avatarPreview ? "Click the camera to change your photo" : "Your avatar is generated from your initials"}
          </p>
        </div>

        {error && <p className="mb-4 text-center text-sm text-danger">{error}</p>}

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

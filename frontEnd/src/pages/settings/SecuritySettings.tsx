import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Laptop, Smartphone, LogOut, Trash2 } from "lucide-react";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/forms/PasswordInput";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const SESSIONS = [
  { id: "s1", device: "MacBook Pro", location: "Bogotá, Colombia", icon: Laptop, current: true },
  { id: "s2", device: "iPhone 15", location: "Bogotá, Colombia", icon: Smartphone, current: false },
];

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessions, setSessions] = useState(SESSIONS);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleUpdatePassword() {
    if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
      showToast("Please check your password fields", "error");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password updated", "success");
  }

  return (
    <div>
      <SettingsSection title="Change password">
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <PasswordInput label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
        <PasswordInput
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleUpdatePassword}>
            Update password
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Active sessions" description="Devices currently signed in to your account.">
        <div className="flex flex-col gap-2">
          {sessions.map(({ id, device, location, icon: Icon, current }) => (
            <div key={id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-3">
              <Icon size={18} className="shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  {device} {current && <span className="ml-1 text-xs font-medium text-success">This device</span>}
                </p>
                <p className="text-xs text-ink-muted">{location}</p>
              </div>
              {!current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSessions((prev) => prev.filter((s) => s.id !== id));
                    showToast("Session signed out", "success");
                  }}
                >
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Danger zone">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-left text-sm text-ink hover:bg-surface-hover"
          >
            <LogOut size={16} />
            Log out of this account
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-3 rounded-lg border border-danger/30 px-3 py-3 text-left text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 size={16} />
            Delete account
          </button>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
        title="Log out?"
        description="You'll need to sign in again to access your conversations."
        confirmLabel="Log out"
        danger
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
        title="Delete account?"
        description="This will permanently delete your account and all of your data. This action cannot be undone."
        confirmLabel="Delete account"
        danger
      />
    </div>
  );
}

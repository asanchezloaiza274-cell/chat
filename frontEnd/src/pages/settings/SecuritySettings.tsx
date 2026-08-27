import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Laptop, Smartphone, LogOut, Trash2 } from "lucide-react";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/forms/PasswordInput";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError, getRefreshToken } from "../../lib/api";
import { decodeJwtPayload } from "../../lib/jwt";

interface Session {
  id: string;
  device: string;
  ip_address: string | null;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}

function deviceIcon(device: string) {
  return /iphone|android|mobile/i.test(device) ? Smartphone : Laptop;
}

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      const refresh = getRefreshToken();
      const jti = refresh ? decodeJwtPayload<{ jti?: string }>(refresh)?.jti : undefined;
      try {
        const data = await api.get<Session[]>(`/api/users/me/sessions/${jti ? `?current=${jti}` : ""}`);
        setSessions(data);
      } catch {
        showToast("Couldn't load active sessions", "error");
      }
    }
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdatePassword() {
    if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
      showToast("Please check your password fields", "error");
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.post("/api/auth/change-password/", { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleSignOutSession(id: string) {
    try {
      await api.delete(`/api/users/me/sessions/${id}/`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast("Session signed out", "success");
    } catch {
      showToast("Couldn't sign out that session", "error");
    }
  }

  async function handleDeleteAccount() {
    try {
      await api.delete("/api/users/me/");
      await logout();
      navigate("/login");
    } catch {
      showToast("Couldn't delete your account", "error");
    }
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
          <Button size="sm" isLoading={isChangingPassword} onClick={handleUpdatePassword}>
            Update password
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Active sessions" description="Devices currently signed in to your account.">
        <div className="flex flex-col gap-2">
          {sessions.map((session) => {
            const Icon = deviceIcon(session.device);
            return (
              <div key={session.id} className="flex items-center gap-3 border border-border px-3 py-3">
                <Icon size={18} className="shrink-0 text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    {session.device}{" "}
                    {session.is_current && <span className="ml-1 text-xs font-medium text-success">This device</span>}
                  </p>
                  <p className="text-xs text-ink-muted">{session.ip_address ?? "Unknown location"}</p>
                </div>
                {!session.is_current && (
                  <Button variant="ghost" size="sm" onClick={() => handleSignOutSession(session.id)}>
                    Sign out
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection title="Danger zone">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 border border-border px-3 py-3 text-left text-sm text-ink hover:bg-surface-hover"
          >
            <LogOut size={16} />
            Log out of this account
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-3 border border-danger/30 px-3 py-3 text-left text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 size={16} />
            Delete account
          </button>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          await logout();
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
        onConfirm={handleDeleteAccount}
        title="Delete account?"
        description="This will permanently delete your account and all of your data. This action cannot be undone."
        confirmLabel="Delete account"
        danger
      />
    </div>
  );
}

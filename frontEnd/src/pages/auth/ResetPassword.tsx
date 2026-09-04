import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/forms/PasswordInput";
import { PasswordStrengthMeter } from "../../components/forms/PasswordStrengthMeter";
import { api, ApiError } from "../../lib/api";

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (!uid || !token) {
      setError("This reset link is invalid");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(
        "/api/auth/password-reset/confirm/",
        { uid, token, new_password: password },
        { auth: false },
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This reset link is invalid or has expired");
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-success/30 bg-success-soft text-success">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-sm text-ink-muted">Your password has been changed. You can now sign in.</p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
            Back to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-sm bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        <div>
          <PasswordInput label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordStrengthMeter password={password} />
        </div>
        <PasswordInput
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" isLoading={isLoading} className="mt-1 w-full">
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

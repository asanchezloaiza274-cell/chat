import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, AlertCircle } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/forms/PasswordInput";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to Loop">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="Email or username"
          type="text"
          placeholder="you@example.com or username"
          autoComplete="username"
          leftIcon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong bg-surface text-accent accent-accent"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" isLoading={isLoading} className="mt-1 w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

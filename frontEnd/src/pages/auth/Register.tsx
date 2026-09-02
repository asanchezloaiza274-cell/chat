import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, AtSign, AlertCircle } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PasswordInput } from "../../components/forms/PasswordInput";
import { PasswordStrengthMeter } from "../../components/forms/PasswordStrengthMeter";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms of Service to continue");
      return;
    }

    setIsLoading(true);
    try {
      await register(fullName, username, email, password);
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start chatting in a few seconds">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="Full name"
          placeholder="Alejandro Sánchez"
          leftIcon={<User size={16} />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Username"
          placeholder="alejandro"
          leftIcon={<AtSign size={16} />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordStrengthMeter password={password} />
        </div>
        <PasswordInput
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 border-border-strong bg-surface text-accent accent-accent"
          />
          <span>
            I agree to the <span className="font-medium text-ink">Terms of Service</span> and{" "}
            <span className="font-medium text-ink">Privacy Policy</span>
          </span>
        </label>

        <Button type="submit" size="lg" isLoading={isLoading} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

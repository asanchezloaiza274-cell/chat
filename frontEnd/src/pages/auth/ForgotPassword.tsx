import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, MailCheck, ArrowLeft } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/auth/password-reset/", { email }, { auth: false });
      setSubmitted(true);
    } catch {
      setError("Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-success/30 bg-success-soft text-success">
            <MailCheck size={22} />
          </div>
          <p className="text-sm text-ink-muted">
            We sent a password reset link to <span className="font-medium text-ink">{email}</span>. Check your
            inbox and follow the instructions.
          </p>
          <Link
            to="/login"
            className="mt-6 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 border-l-2 border-danger bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
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
        <Button type="submit" size="lg" isLoading={isLoading} className="mt-1 w-full">
          Send reset link
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} />
        Back to login
      </Link>
    </AuthLayout>
  );
}

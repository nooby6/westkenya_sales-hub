import * as React from "react";
import { Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignIn2Props {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  footer?: React.ReactNode;
  onForgotPassword?: () => void;
}

const SignIn2: React.FC<SignIn2Props> = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting,
  error,
  title = "Sign in with email",
  subtitle = "Access your dashboard with your work credentials.",
  submitLabel = "Sign In",
  footer,
  onForgotPassword,
}) => {
  return (
    <form onSubmit={onSubmit} className="w-full space-y-5">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className={cn(
              "w-full h-11 rounded-md border border-input bg-background pl-10 pr-3 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className={cn(
              "w-full h-11 rounded-md border border-input bg-background pl-10 pr-3 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {onForgotPassword && (
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium",
          "transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        )}
      >
        {isSubmitting ? "Signing in..." : submitLabel}
      </button>

      {footer}
    </form>
  );
};

export { SignIn2 };

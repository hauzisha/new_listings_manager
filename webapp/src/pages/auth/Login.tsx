import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { authClient } from "@/lib/auth-client";
import { api, setSessionToken } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LoginFormValues {
  email: string;
  password: string;
}

interface UserStatusResponse {
  isApproved: boolean;
  role: "ADMIN" | "AGENT" | "PROMOTER";
}

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  AGENT: "/dashboard/agent",
  PROMOTER: "/dashboard/promoter",
};

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ mode: "onBlur" });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Store session token for API calls
      const token = result.data?.token;
      if (token) {
        setSessionToken(token);
        localStorage.setItem("session_token", token);
      }

      // Check user status
      const status = await api.get<UserStatusResponse>("/api/auth/user-status");

      if (!status.isApproved) {
        await authClient.signOut();
        setSessionToken(null);
        localStorage.removeItem("session_token");
        setErrorMessage("Your account is pending admin approval.");
        setIsLoading(false);
        return;
      }

      const route = ROLE_ROUTES[status.role] ?? "/login";
      navigate(route, { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Invalid email or password";
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={cn(
              "auth-input h-11 transition-shadow duration-200",
              errors.email ? "border-destructive" : ""
            )}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email ? (
            <p className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email.message}
            </p>
          ) : null}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                "auth-input h-11 pr-11 transition-shadow duration-200",
                errors.password ? "border-destructive" : ""
              )}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {/* Error message */}
        {errorMessage ? (
          <div className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-destructive text-sm">{errorMessage}</p>
          </div>
        ) : null}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-8 pt-6 border-t border-border space-y-3">
        <p className="text-muted-foreground text-xs text-center font-sans uppercase tracking-wider">
          New to Hauzisha?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/signup/agent"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all px-4 py-3 text-sm font-medium text-foreground group"
          >
            <span>Sign up as Agent</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link
            to="/signup/promoter"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all px-4 py-3 text-sm font-medium text-foreground group"
          >
            <span>Sign up as Promoter</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

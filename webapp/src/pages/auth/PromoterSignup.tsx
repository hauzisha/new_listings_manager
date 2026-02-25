import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PromoterSignupFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function PromoterSignup() {
  const [searchParams] = useSearchParams();
  const viaParam = searchParams.get("via") ?? undefined;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PromoterSignupFormValues>({ mode: "onBlur" });

  const passwordValue = watch("password");

  const onSubmit = async (values: PromoterSignupFormValues) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await api.post("/api/auth/register", {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: "PROMOTER",
        viaCode: viaParam ?? undefined,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Become a Promoter"
      subtitle="Earn by promoting properties"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center text-center py-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5 animate-in zoom-in-50 duration-500 delay-100">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Account Created!
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Your account is pending admin approval. You'll be notified once approved.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
          >
            Back to Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Promoter info box */}
          <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3.5 mb-1">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              <span className="font-semibold text-foreground">Share property links.</span>{" "}
              Get paid when deals close.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Wanjiru"
              autoComplete="name"
              className={cn(
                "auth-input h-11 transition-shadow duration-200",
                errors.name ? "border-destructive" : ""
              )}
              {...register("name", { required: "Full name is required" })}
            />
            {errors.name ? (
              <p className="text-destructive text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name.message}
              </p>
            ) : null}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
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

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0712 345 678"
              autoComplete="tel"
              className={cn(
                "auth-input h-11 transition-shadow duration-200",
                errors.phone ? "border-destructive" : ""
              )}
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^(\+?254|0)[17]\d{8}$/,
                  message: "Enter a valid Kenyan phone number",
                },
              })}
            />
            {errors.phone ? (
              <p className="text-destructive text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone.message}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">e.g. 0712 345 678 or +254712345678</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(
                  "auth-input h-11 pr-11 transition-shadow duration-200",
                  errors.confirmPassword ? "border-destructive" : ""
                )}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) =>
                    val === passwordValue || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="text-destructive text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {/* Error message */}
          {errorMessage ? (
            <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold gap-2 mt-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Promoter Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Footer links */}
      {!isSuccess ? (
        <div className="mt-7 pt-5 border-t border-border space-y-2 text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-muted-foreground text-sm">
            <Link
              to="/signup/agent"
              className="text-muted-foreground hover:text-primary transition-colors text-xs"
            >
              Sign up as an Agent instead
            </Link>
          </p>
        </div>
      ) : null}
    </AuthLayout>
  );
}

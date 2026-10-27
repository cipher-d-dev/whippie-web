"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/lib/auth/context";
import { ApiError, applyApiErrors } from "@/lib/api/client";
import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid official email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isAuthenticated, isLoading, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: () => {
      toast.success("Welcome back!");
      router.replace("/dashboard");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        applyApiErrors(err, (field, error) =>
          form.setError(field as keyof LoginFormValues, error)
        );
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Authentication failed. Please verify your credentials."
      );
    },
  });

  // Redirect staff users to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== "INTERN") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirecting state
  if (isAuthenticated && user?.role !== "INTERN") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Authenticated as INTERN — Wrong Portal
  if (isAuthenticated && user?.role === "INTERN") {
    return (
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Staff Portal Restricted
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            You are currently signed in as an intern (
            <span className="font-semibold text-foreground">{user?.email}</span>).
            This portal is exclusively reserved for HR Administrators and Station Supervisors.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl"
          onClick={() => logout()}
        >
          Sign out & switch account
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      {/* Mobile brand header (visible on smaller screens) */}
      <div className="flex flex-col items-center lg:hidden space-y-2 text-center mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <WhippieLogo size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Whippie HR</h1>
          <p className="text-xs text-muted-foreground">DAAR Communications Administration</p>
        </div>
      </div>

      {/* Header section */}
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your official work credentials to access the administrative dashboard.
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm">
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Work Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="name@daarcomms.tv"
                autoComplete="email"
                disabled={mutation.isPending}
                className="h-10 rounded-lg pl-10 text-sm"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={mutation.isPending}
                className="h-10 rounded-lg pl-10 pr-10 text-sm"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-10 rounded-lg text-sm font-medium mt-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Subtle footnote */}
      <p className="text-center text-xs text-muted-foreground">
        DAAR Communications Plc &middot; For authorized staff and supervisors
      </p>
    </div>
  );
}

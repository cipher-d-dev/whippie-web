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
  Building2,
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
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Staff Portal Access Restricted
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            You are logged in as{" "}
            <span className="font-semibold text-foreground">{user?.email}</span>.
            This dashboard is dedicated to HR Administrators and Supervisors.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl"
          onClick={() => logout()}
        >
          Sign out and switch account
        </Button>
      </div>
    );
  }

  // Form Render
  return (
    <div className="w-full max-w-[420px] space-y-7">
      {/* Mobile Top Brand Header */}
      <div className="flex flex-col items-center lg:hidden space-y-2 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
          <WhippieLogo size={36} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Whippie HR</h1>
        <p className="text-xs text-muted-foreground">DAAR Communications Staff Portal</p>
      </div>

      {/* Main Title & Subtitle */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground text-xs font-medium mb-3">
          <Building2 className="h-3.5 w-3.5" />
          <span>Internal HR Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Please enter your credentials to access staff operations.
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm">
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
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
                className="h-11 rounded-xl border-input/80 pl-10 text-sm placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-1 focus-visible:ring-primary"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={mutation.isPending}
                className="h-11 rounded-xl border-input/80 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 transition-colors focus-visible:ring-1 focus-visible:ring-primary"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25 cursor-pointer mt-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating…
              </>
            ) : (
              <>
                Sign in to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Security notice footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Authorized Personnel & Supervisor Access Only</span>
      </div>
    </div>
  );
}

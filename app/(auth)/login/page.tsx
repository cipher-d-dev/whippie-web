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
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
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
          : "Authentication failed. Please check your credentials."
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
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirecting state
  if (isAuthenticated && user?.role !== "INTERN") {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Authenticated as INTERN — Wrong Portal
  if (isAuthenticated && user?.role === "INTERN") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Staff Portal Restricted
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are signed in as an intern (
            <span className="font-medium text-foreground">{user?.email}</span>).
            This portal is reserved for HR administrators and supervisors.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full h-10 rounded-lg text-sm"
          onClick={() => logout()}
        >
          Sign out & switch account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-card border border-border/70 shadow-sm p-2.5">
          <WhippieLogo size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Whippie HR
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            DAAR Communications Plc &middot; Staff & Supervisors
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-7 shadow-sm">
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Official Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@daarcomms.tv"
              autoComplete="email"
              disabled={mutation.isPending}
              className="h-10 text-sm rounded-lg"
              {...form.register("email")}
            />
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
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={mutation.isPending}
                className="h-10 text-sm rounded-lg pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors p-1"
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
            className="w-full h-10 rounded-lg text-sm font-medium mt-1 cursor-pointer transition-colors"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Subtle Support Note */}
      <p className="text-center text-xs text-muted-foreground/80 leading-relaxed px-4">
        Need assistance accessing your staff account? Contact IT Administration or DAAR HR.
      </p>
    </div>
  );
}

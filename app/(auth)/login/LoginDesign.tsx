"use client";

import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { ApiError, applyApiErrors } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const loginSchema = z.object({
  email: z.string().email("Enter a valid official email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputCls = (err?: boolean) =>
  cn(
    "w-full rounded-2xl border bg-muted/40 pl-10 pr-4 py-3 text-sm font-medium outline-none",
    "placeholder:text-muted-foreground/40 transition-all duration-150",
    err
      ? "border-destructive/50 bg-destructive/5"
      : "border-transparent hover:border-border focus:border-primary/60 focus:bg-background focus:ring-2 focus:ring-primary/15"
  );

export function HRLoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

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
        err instanceof ApiError ? err.message : "Authentication failed."
      );
    },
  });

  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || mutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + heading */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <WhippieLogo size={44} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              HR Portal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage your interns
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            noValidate
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold text-foreground"
              >
                Official Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@daarcomms.tv"
                  disabled={busy}
                  className={inputCls(!!errors.email)}
                  {...form.register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-semibold text-foreground"
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-primary hover:underline underline-offset-4"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={busy}
                  className={cn(inputCls(!!errors.password), "pr-11")}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              {errors.password && (
                <p className="text-[11px] font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="group w-full h-11 rounded-2xl text-[15px] font-bold"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Whippie HR Portal · Restricted Access
        </p>
      </div>
    </div>
  );
}

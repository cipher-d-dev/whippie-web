"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, XCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, ApiError, applyApiErrors } from "@/lib/api/client";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (pw) => /[a-zA-Z]/.test(pw) && /\d/.test(pw),
        "Password must contain at least one letter and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const inputCls = (err?: boolean) =>
  cn(
    "w-full rounded-2xl border bg-muted/40 pl-10 pr-11 py-3 text-sm font-medium outline-none",
    "placeholder:text-muted-foreground/40 transition-all duration-150",
    err
      ? "border-destructive/50 bg-destructive/5"
      : "border-transparent hover:border-border focus:border-primary/60 focus:bg-background focus:ring-2 focus:ring-primary/15"
  );

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      apiPost<{ success: boolean; message: string }>("/api/v1/auth/reset-password", {
        token,
        password: values.password,
      }),
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        applyApiErrors(err, (field, error) =>
          form.setError(field as keyof ResetPasswordFormValues, error)
        );
      }
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reset password."
      );
    },
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Missing Token</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Invalid or missing password reset link. Please request a new password reset.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Request New Reset Link</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">Password Reset</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-11 rounded-2xl text-sm font-semibold"
          >
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || mutation.isPending;

  return (
    <form
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      noValidate
      className="space-y-4"
    >
      <div className="mb-2">
        <h2 className="text-base font-bold text-foreground">Set New Password</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose a secure new password for your account.
        </p>
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[13px] font-semibold text-foreground"
        >
          New Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={busy}
            className={inputCls(!!errors.password)}
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

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="block text-[13px] font-semibold text-foreground"
        >
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={busy}
            className={inputCls(!!errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-[11px] font-medium text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="group w-full h-12 rounded-2xl text-[15px] font-bold shadow-md shadow-primary/20 cursor-pointer"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>Reset Password</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

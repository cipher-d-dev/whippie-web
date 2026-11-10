"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost, ApiError, applyApiErrors } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid official email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const inputCls = (err?: boolean) =>
  cn(
    "w-full rounded-2xl border bg-muted/40 pl-10 pr-4 py-3 text-sm font-medium outline-none",
    "placeholder:text-muted-foreground/40 transition-all duration-150",
    err
      ? "border-destructive/50 bg-destructive/5"
      : "border-transparent hover:border-border focus:border-primary/60 focus:bg-background focus:ring-2 focus:ring-primary/15"
  );

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      apiPost<{ success: boolean; message: string }>("/api/v1/auth/forgot-password", values),
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
      toast.success("Reset link sent if the account exists.");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        applyApiErrors(err, (field, error) =>
          form.setError(field as keyof ForgotPasswordFormValues, error)
        );
      }
      toast.error(
        err instanceof ApiError ? err.message : "Failed to request password reset."
      );
    },
  });

  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || mutation.isPending;

  if (submittedEmail) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">Check your email</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an account exists for <span className="font-semibold text-foreground">{submittedEmail}</span>, we&apos;ve sent a password reset link to your inbox.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      noValidate
      className="space-y-4"
    >
      <div className="mb-2">
        <h2 className="text-base font-bold text-foreground">Forgot Password</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter your registered email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

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
            placeholder="cindymaxuduma@gmail.com"
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
            <span>Send Reset Link</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>

      {/* Back to login */}
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

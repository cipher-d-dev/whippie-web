"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
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
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Enter a valid official email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputCls = (err?: boolean) =>
  cn(
    "h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-[15px] outline-none",
    "placeholder:text-muted-foreground transition-[border-color,box-shadow]",
    err
      ? "border-danger focus:ring-[3px] focus:ring-danger/20"
      : "border-input focus:border-primary focus:ring-[3px] focus:ring-ring/20"
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
    <form
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      noValidate
      className="space-y-5"
    >
      <div className="mb-2 space-y-2">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-foreground">Sign in</h1>
        <p className="text-[15px] text-muted-foreground">For HR and supervisors at DAAR Communications.</p>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[13px] font-medium text-secondary-foreground"
        >
          Work email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <p className="text-xs font-medium text-danger-foreground">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[13px] font-medium text-secondary-foreground"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-primary hover:underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
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
          <p className="text-xs font-medium text-danger-foreground">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="h-11 w-full text-[15px]"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span>Sign in</span>
        )}
      </Button>
      <p className="text-[13px] text-muted-foreground">Interns sign in on the Whippie Intern app.</p>
    </form>
  );
}

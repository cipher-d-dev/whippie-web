"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

import { useAuth } from "@/lib/auth/context";
import { ApiError, applyApiErrors } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: () => {
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
          : "Something went wrong. Please try again."
      );
    },
  });

  return (
    <div className="w-full max-w-sm animate-fade-up">
      {/* Mobile brand mark (hidden on lg where left panel shows) */}
      <div className="mb-8 flex flex-col items-center lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <span className="text-xl font-black text-primary-foreground">W</span>
        </div>
        <h1 className="mt-3 text-xl font-black text-foreground">Whippe</h1>
        <p className="text-xs text-muted-foreground">DAAR Communications</p>
      </div>

      {/* Heading */}
      <div className="mb-8 animate-fade-up delay-50">
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your staff account to continue
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-5"
        noValidate
      >
        {/* Email */}
        <div className="animate-fade-up delay-100 space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@daarcomms.tv"
              autoComplete="email"
              disabled={mutation.isPending}
              className="h-11 rounded-xl border-border/60 pl-10 text-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs font-medium text-destructive animate-fade-in">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="animate-fade-up delay-150 space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={mutation.isPending}
              className="h-11 rounded-xl border-border/60 pl-10 text-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs font-medium text-destructive animate-fade-in">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="animate-fade-up delay-200 pt-1">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="group h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/25 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Footer note */}
      <p className="animate-fade-up delay-300 mt-8 text-center text-xs text-muted-foreground leading-relaxed">
        Access is restricted to DAAR Communications staff.
        <br />
        Contact HR if you need an account.
      </p>
    </div>
  );
}

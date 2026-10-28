"use client";

import { WhippieLogo } from "@/components/shared/WhippieLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { ApiError, applyApiErrors } from "@/lib/api/client";
import { useRouter } from "next/navigation";

// Design system for HR login page (overrides) – see design-system/whippie-hr/pages/login.md

const loginSchema = z.object({
  email: z.string().email("Enter a valid official email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function HRLoginPage() {
  const { login, isLoading, logout, user, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: () => {
      toast.success("Welcome back!");
      router.replace('/dashboard');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        applyApiErrors(err, (field, error) => form.setError(field as keyof LoginFormValues, error));
      }
      toast.error(err instanceof ApiError ? err.message : "Authentication failed.");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Hero section – per design overrides */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Whippie HR</h1>
            <p className="text-lg text-gray-600 mb-6">
              Empower your staff portal with secure authentication and streamlined HR workflows.
            </p>
            <Button variant="default" asChild>
              <a href="/contact" className="inline-flex items-center">
                Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="flex-1 flex justify-center">
            {/* Placeholder for hero illustration or video */}
            <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">[Hero Media]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Login form section – retains existing functionality */}
      <section className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-3">
            <WhippieLogo size={48} />
            <h2 className="text-2xl font-semibold text-gray-800">HR Sign In</h2>
          </div>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Official Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@daarcomms.tv"
                disabled={mutation.isPending}
                className="h-10"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={mutation.isPending}
                  className="h-10 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              Sign In
            </Button>
          </form>
        </div>
      </section>

      {/* Solutions by Role – placeholder section as per design overrides */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Solutions for HR</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Recruitment", desc: "Streamlined candidate tracking and onboarding.", icon: "UserCheck" },
              { title: "Attendance", desc: "Real‑time check‑in/out and reports.", icon: "CalendarDays" },
              { title: "Performance", desc: "Evaluations and growth plans.", icon: "Star" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm text-center">
                {/* Simple icon placeholder */}
                <div className="flex justify-center mb-4 text-primary">
                  <span className="text-3xl">🔹</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with contact sales CTA */}
      <footer className="py-8 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <Button variant="outline" asChild>
            <a href="/contact" className="inline-flex items-center">
              Get in touch <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-4 text-sm text-gray-500">© {new Date().getFullYear()} Whippie HR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

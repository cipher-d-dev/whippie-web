"use client";

import { useAuth } from "@/lib/auth/context";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { changePassword, getAvatarUploadInfo, uploadAvatarFile, updateUserAvatar } from "@/features/users/api";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

// ─── Password schema ──────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .refine(
        (pw) => /[a-zA-Z]/.test(pw) && /\d/.test(pw),
        "Must contain at least one letter and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Separator />
      {children}
    </div>
  );
}

// ─── Profile section ──────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be under 5MB.");
      return;
    }
    setUploading(true);
    try {
      const info = await getAvatarUploadInfo();
      await uploadAvatarFile(info, file);
      const avatarUrl = `${info.endpoint}/storage/buckets/${info.bucketId}/files/${info.fileId}/view?project=${info.projectId}`;
      await updateUserAvatar(avatarUrl);
      await refreshUser();
      toast.success("Profile photo updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Section
      icon={User}
      title="Profile"
      description="Your account identity and display information."
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          onClick={() => fileInputRef.current?.click()}
          title="Click to change profile picture"
          className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-bold text-primary hover:ring-2 hover:ring-primary/40 transition-all select-none"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={`${user?.firstName} ${user?.lastName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </div>

        {/* Info */}
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
            {user?.role?.toLowerCase().replace("_", " ")}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click your avatar above to upload a new profile photo (max 5MB, PNG/JPG/WEBP).
      </p>
    </Section>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated successfully.");
      reset();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.message.toLowerCase().includes("current password")) {
          setError("currentPassword", { message: err.message });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Failed to update password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwField = (
    id: "currentPassword" | "newPassword" | "confirmPassword",
    label: string,
    show: boolean,
    setShow: (v: boolean) => void,
    autocomplete: string,
    placeholder: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autocomplete}
          disabled={isSubmitting}
          className="h-9 text-sm pr-10"
          {...register(id)}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {errors[id] && (
        <p className="text-[11px] text-destructive">{errors[id]?.message}</p>
      )}
    </div>
  );

  return (
    <Section
      icon={Lock}
      title="Password & Security"
      description="Update your login credentials and keep your account secure."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {pwField("currentPassword", "Current Password", showCurrent, setShowCurrent, "current-password", "Enter current password")}
        {pwField("newPassword", "New Password", showNew, setShowNew, "new-password", "At least 8 chars + number")}
        {pwField("confirmPassword", "Confirm New Password", showConfirm, setShowConfirm, "new-password", "Re-type new password")}

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={isSubmitting} className="gap-1.5 rounded-xl">
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
            ) : (
              <><KeyRound className="h-4 w-4" /> Save Password</>
            )}
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─── Appearance section ───────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Section
      icon={Palette}
      title="Appearance"
      description="Customize how the HR portal looks and feels."
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
            theme === "light"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
        >
          <Sun className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-semibold">Light</span>
          {theme === "light" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
            theme === "dark"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
        >
          <Moon className="h-5 w-5 text-blue-500" />
          <span className="text-xs font-semibold">Dark</span>
          {theme === "dark" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
        </button>

        <button
          onClick={() => setTheme("system")}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
            theme === "system"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          )}
        >
          <div className="flex gap-0.5">
            <Sun className="h-4 w-4 text-amber-400" />
            <Moon className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-xs font-semibold">System</span>
          {theme === "system" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
        </button>
      </div>
    </Section>
  );
}

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection() {
  const [emailNotifs, setEmailNotifs] = useState(true);

  return (
    <Section
      icon={Bell}
      title="Notifications"
      description="Control what alerts and emails you receive."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Email Notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive email alerts for approvals, rejections, and important updates.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={emailNotifs}
            onClick={() => setEmailNotifs((v) => !v)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              emailNotifs ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200",
                emailNotifs ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-700/30 px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug">
            In-app notifications are always enabled. Manage your notification history from the Notifications page.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ─── Account / Danger section ─────────────────────────────────────────────────

function AccountSection() {
  const { user } = useAuth();

  return (
    <Section
      icon={Shield}
      title="Account Information"
      description="Your account details and status."
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">First Name</p>
            <p className="mt-0.5 font-medium text-foreground">{user?.firstName}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Last Name</p>
            <p className="mt-0.5 font-medium text-foreground">{user?.lastName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email Address</p>
            <p className="mt-0.5 font-medium text-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
            <p className="mt-0.5 font-medium text-foreground capitalize">
              {user?.role?.toLowerCase().replace("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              {user?.status ?? "Active"}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-1">
          To update your name or email address, please contact your system administrator.
        </p>
      </div>
    </Section>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your profile, security, and preferences.
        </p>
      </div>

      <ProfileSection />
      <PasswordSection />
      <AppearanceSection />
      <NotificationsSection />
      <AccountSection />
    </div>
  );
}

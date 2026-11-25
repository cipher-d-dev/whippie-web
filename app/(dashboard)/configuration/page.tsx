"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/shared/PageHeader";
import { DepartmentsManager } from "@/features/configuration/DepartmentsManager";
import { StipendManager } from "@/features/configuration/StipendManager";
import { FaceCheckManager } from "@/features/configuration/FaceCheckManager";
import { LabelsManager } from "@/features/configuration/LabelsManager";
import { HrTeam } from "@/features/configuration/HrTeam";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "departments", label: "Departments" },
  { key: "labels", label: "Labels & stations" },
  { key: "stipends", label: "Stipends" },
  { key: "face", label: "Check-in" },
  { key: "team", label: "HR team" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function ConfigurationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("departments");

  // Open a tab from the address (?tab=team) and keep it there when switching.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (TABS.some((x) => x.key === t)) setTab(t as Tab);
  }, []);
  const choose = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", `?tab=${t}`);
  };

  useEffect(() => {
    if (user && user.role !== "HR") router.replace("/dashboard");
  }, [user, router]);
  if (user && user.role !== "HR") return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description="Names and lists used across Whippie. Changes show in both the staff portal and the intern app straight away."
      />
      <div role="tablist" aria-label="Configuration sections" className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => choose(t.key)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="max-w-3xl">
        {tab === "departments" && <DepartmentsManager />}
        {tab === "stipends" && <StipendManager />}
        {tab === "face" && <FaceCheckManager />}
        {tab === "labels" && <LabelsManager />}
        {tab === "team" && <HrTeam />}
      </div>
    </div>
  );
}

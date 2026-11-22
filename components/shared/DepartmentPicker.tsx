"use client";

import { Check } from "lucide-react";
import type { DepartmentObject } from "@/types";
import { cn } from "@/lib/utils/cn";

/** Pick one or more departments. The first one picked is the main department. */
export function DepartmentPicker({
  departments, value, onChange, id,
}: {
  departments: DepartmentObject[];
  value: string[];
  onChange: (ids: string[]) => void;
  id?: string;
}) {
  const sorted = [...departments].sort((a, b) => a.name.localeCompare(b.name));
  const toggle = (d: string) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  return (
    <div id={id} role="group" className="max-h-56 overflow-y-auto rounded-lg border">
      {sorted.map((d) => {
        const on = value.includes(d._id);
        return (
          <button
            key={d._id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(d._id)}
            className="flex w-full items-center gap-2.5 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
          >
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
              {on && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            {d.subsidiary && <span className="shrink-0 text-xs text-muted-foreground">{d.subsidiary}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** "News, Camera unit" from a supervisor's departments (falls back to the single one). */
export function supervisorDepartments(sv: { department?: { name: string } | null; departments?: { name: string }[] }) {
  const list = sv.departments?.length ? sv.departments : sv.department ? [sv.department] : [];
  return list.map((d) => d.name).join(", ");
}

"use client";

import { useAllowance } from "./allowance";
import { useUpdateIntern } from "./hooks";
import { Section } from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InternObject } from "@/types";

/** HR: is this person on payroll (paid the monthly allowance)? */
export function AllowancePanel({ intern }: { intern: InternObject }) {
  const allowance = useAllowance()(intern);
  const update = useUpdateIntern(intern._id);
  const value = typeof intern.receivesAllowance === "boolean" ? (intern.receivesAllowance ? "yes" : "no") : "default";

  return (
    <Section title="Allowance" bodyClassName="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{allowance.label}</p>
        <p className="text-xs text-muted-foreground">{allowance.detail}. Only people on allowance appear on Stipends.</p>
      </div>
      <Select
        value={value}
        disabled={update.isPending}
        onValueChange={(v) => update.mutate({ receivesAllowance: v === "default" ? null : v === "yes" })}
      >
        <SelectTrigger className="h-9 w-[190px]" aria-label="Allowance"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default for their type</SelectItem>
          <SelectItem value="yes">On allowance</SelectItem>
          <SelectItem value="no">No allowance (e.g. SIWES)</SelectItem>
        </SelectContent>
      </Select>
    </Section>
  );
}

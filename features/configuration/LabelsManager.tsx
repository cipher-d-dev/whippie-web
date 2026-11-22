"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/features/settings/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/shared/PageHeader";

/** Wording used across both apps: what each kind of intern is called, and the list of stations. */
export function LabelsManager() {
  const { settings, isLoading } = useSettings();
  const save = useUpdateSettings();
  const [internship, setInternship] = useState("");
  const [nysc, setNysc] = useState("");
  const [stations, setStations] = useState<string[]>([]);
  const [newStation, setNewStation] = useState("");

  useEffect(() => {
    setInternship(settings.labels.INTERNSHIP);
    setNysc(settings.labels.NYSC_IT);
    setStations(settings.stations);
  }, [settings]);

  const labelsDirty = internship !== settings.labels.INTERNSHIP || nysc !== settings.labels.NYSC_IT;
  const stationsDirty = stations.join("\n") !== settings.stations.join("\n");

  const move = (i: number, d: -1 | 1) => {
    const next = [...stations];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setStations(next);
  };
  const add = () => {
    const s = newStation.trim();
    if (!s || stations.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    setStations([...stations, s]);
    setNewStation("");
  };

  return (
    <div className="space-y-6">
      <Section
        title="What interns are called"
        description="Shown on lists, profiles, filters and in the intern app."
        bodyClassName="p-5"
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); save.mutate({ labels: { INTERNSHIP: internship.trim(), NYSC_IT: nysc.trim() } }); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="lbl-internship">Students on industrial training (SIWES / IT)</Label>
            <Input id="lbl-internship" value={internship} onChange={(e) => setInternship(e.target.value)} maxLength={40} disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lbl-nysc">NYSC members</Label>
            <Input id="lbl-nysc" value={nysc} onChange={(e) => setNysc(e.target.value)} maxLength={40} disabled={isLoading} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!labelsDirty || !internship.trim() || !nysc.trim() || save.isPending}>
              {save.isPending ? "Saving…" : "Save names"}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        title="Stations"
        description="Offered when you add or edit a department. Departments are grouped in this order."
        bodyClassName="p-0"
      >
        <ul className="divide-y">
          {stations.map((s, i) => (
            <li key={s} className="flex items-center gap-2 px-5 py-2.5">
              <span className="flex-1 text-sm">{s}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${s} up`}><ArrowUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === stations.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${s} down`}><ArrowDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-danger-foreground" disabled={stations.length === 1} onClick={() => setStations(stations.filter((x) => x !== s))} aria-label={`Remove ${s}`}><X className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
          <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <Label htmlFor="new-station" className="sr-only">New station</Label>
            <Input id="new-station" value={newStation} onChange={(e) => setNewStation(e.target.value)} placeholder="Add a station" maxLength={60} className="h-9 max-w-xs" />
            <Button type="submit" variant="outline" size="sm" disabled={!newStation.trim()}><Plus /> Add</Button>
          </form>
          <Button size="sm" disabled={!stationsDirty || save.isPending} onClick={() => save.mutate({ stations })}>
            {save.isPending ? "Saving…" : "Save stations"}
          </Button>
        </div>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">
          Removing a station here doesn&apos;t change departments already in it. Rename those departments&apos; station on the Departments tab.
        </p>
      </Section>
    </div>
  );
}

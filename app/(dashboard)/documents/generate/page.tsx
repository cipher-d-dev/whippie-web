"use client";

import { useState } from "react";
import Link from "next/link";
import { useInterns, useIntern } from "@/features/interns/hooks";
import {
  FileText,
  Printer,
  ChevronLeft,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InternObject } from "@/types";

// ─── Document Types ───────────────────────────────────────────────────────────

export type LetterTemplateType =
  | "ACCEPTANCE_LETTER"
  | "IT_COMPLETION_LETTER"
  | "NYSC_INTERNAL_POSTING"
  | "NYSC_MONTHLY_CLEARANCE"
  | "NYSC_FINAL_CLEARANCE";

interface TemplateConfig {
  label: string;
  category: "STUDENT" | "NYSC";
  description: string;
}

const TEMPLATES: Record<LetterTemplateType, TemplateConfig> = {
  ACCEPTANCE_LETTER: {
    label: "Student Acceptance Letter",
    category: "STUDENT",
    description: "Official Letter of Acceptance for IT / SIWES students to submit to their institution.",
  },
  IT_COMPLETION_LETTER: {
    label: "IT Completion Letter",
    category: "STUDENT",
    description: "Official confirmation of completed industrial training, department, and conduct.",
  },
  NYSC_INTERNAL_POSTING: {
    label: "NYSC Internal Posting Memo",
    category: "NYSC",
    description: "Internal memo posting a corps member to a specific operational unit/department.",
  },
  NYSC_MONTHLY_CLEARANCE: {
    label: "NYSC Monthly Clearance Letter",
    category: "NYSC",
    description: "Addressed to NYSC State Coordinator authorizing the member's monthly allowance.",
  },
  NYSC_FINAL_CLEARANCE: {
    label: "NYSC Final Clearance Letter",
    category: "NYSC",
    description: "Final clearance letter confirming completed service year & recommending discharge.",
  },
};

// ─── Format date helper ───────────────────────────────────────────────────────

function fmtDate(iso?: string | Date): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "ST"
      : day === 2 || day === 22
      ? "ND"
      : day === 3 || day === 23
      ? "RD"
      : "TH";
  const month = d.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}${suffix} ${month}, ${year}.`;
}

function fmtDateSimple(iso?: string | Date): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Physical Letterhead Wrapper ──────────────────────────────────────────────
// Accurately calibrated for pre-printed company stationery paper:
// Top margin: 38mm (reserves space for pre-printed corporate banner & logos)
// Bottom margin: 34mm (reserves space for pre-printed registered office footer)
// Left & Right: 25mm

function PhysicalLetterheadPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-a4-page mx-auto bg-white text-gray-900 shadow-xl rounded-sm p-[38mm_25mm_34mm_25mm] font-comic leading-relaxed relative min-h-[1122px] max-w-[794px] border border-gray-200">
      {/* On-screen visual guide showing where physical letterhead will sit */}
      <div className="no-print absolute top-3 left-6 right-6 border border-dashed border-primary/20 rounded p-2 text-center text-[11px] text-primary/70 bg-primary/5 select-none">
        [ Physical Letterhead Area &bull; Pre-printed DAAR Communications Banner sits here ]
      </div>

      {/* Actual document text */}
      <div className="document-body pt-4">{children}</div>

      {/* On-screen footer guide */}
      <div className="no-print absolute bottom-3 left-6 right-6 border border-dashed border-gray-300 rounded p-1.5 text-center text-[10px] text-gray-400 select-none">
        [ Physical Pre-printed Registered Office Footer Area ]
      </div>
    </div>
  );
}

// ─── 1. Student Acceptance Letter Template ────────────────────────────────────

function StudentAcceptanceLetter({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const startDateStr = intern.startDate ? fmtDateSimple(intern.startDate) : "Wednesday 1st July, 2026";
  const endDateStr = intern.endDate ? fmtDateSimple(intern.endDate) : "Thursday 31st December, 2026";

  return (
    <PhysicalLetterheadPage>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-left font-bold text-sm tracking-wide">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5 font-bold leading-tight">
          <p>THE COORDINATOR,</p>
          <p>INTERNSHIP UNIT / SIWES,</p>
          <p className="uppercase">{intern.institution || "LAGOS STATE UNIVERSITY"},</p>
          <p>NIGERIA.</p>
        </div>

        <p className="font-medium">Dear Sir/Ma,</p>

        {/* Title */}
        <div className="text-center py-1">
          <h2 className="text-base font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
            LETTER OF ACCEPTANCE
          </h2>
        </div>

        {/* Body text */}
        <p className="text-justify leading-7">
          We write to inform you that, <span className="font-bold">{internName}</span> has been
          accepted to undergo Industrial Training with <span className="font-bold">DAAR Communications PLC, Lagos</span>,
          from <span className="font-semibold">{startDateStr}</span> to{" "}
          <span className="font-semibold">{endDateStr}</span>.
        </p>

        <p className="text-justify leading-7">
          We shall do our best to have them fully engaged so that they can acquire all the necessary work
          experience and professional exposure.
        </p>

        <p className="font-bold">Yours Faithfully,</p>

        {/* Signoff block */}
        <div className="pt-10 space-y-1 text-xs">
          <p className="font-bold">FOR: DAAR COMMUNICATIONS PLC</p>
          <div className="h-12" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-bold text-gray-700 uppercase">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 2. IT / SIWES Completion Letter Template ─────────────────────────────────

function ITCompletionLetter({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const startDateStr = intern.startDate ? fmtDate(intern.startDate).replace(".", "") : "15TH JULY, 2026";
  const endDateStr = intern.endDate ? fmtDate(intern.endDate).replace(".", "") : "15TH OCTOBER, 2026";
  const departmentName = intern.department?.name ? `${intern.department.name} department` : "Operations department";

  return (
    <PhysicalLetterheadPage>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-left font-bold text-sm tracking-wide">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5 font-bold leading-tight">
          <p>THE COORDINATOR,</p>
          <p>SIWES / INDUSTRIAL TRAINING UNIT,</p>
          <p className="uppercase">{intern.institution || "LEAD CITY UNIVERSITY"},</p>
          <p>NIGERIA.</p>
        </div>

        <p className="font-medium">Dear Sir/Ma,</p>

        {/* Title */}
        <div className="text-center py-1">
          <h2 className="text-base font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
            COMPLETION OF INDUSTRIAL TRAINING
          </h2>
        </div>

        {/* Body text */}
        <p className="text-justify leading-7">
          This is to certify that the above named intern, <span className="font-bold">{internName}</span>, a
          student in your Institution from the Department of{" "}
          <span className="font-bold">{intern.course || "Mass Communication & Media Technology"}</span>, has
          successfully completed their Industrial Training from {departmentName} in{" "}
          <span className="font-bold">DAAR Communications PLC, Lagos</span> from{" "}
          <span className="font-semibold">{startDateStr}</span> to{" "}
          <span className="font-semibold">{endDateStr}</span>.
        </p>

        <p className="text-justify leading-7">
          During their stay, they were hardworking, punctual, and resourceful.
        </p>

        <p className="font-bold">Yours Faithfully,</p>

        {/* Signoff block */}
        <div className="pt-10 space-y-1 text-xs">
          <p className="font-bold">FOR: DAAR COMMUNICATIONS PLC</p>
          <div className="h-12" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-bold text-gray-700 uppercase">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 3. NYSC Internal Posting Memo Template ───────────────────────────────────

function NYSCInternalPostingTemplate({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const startDateStr = intern.startDate ? fmtDateSimple(intern.startDate) : "Monday 17th November, 2025";
  const endDateStr = intern.endDate ? fmtDateSimple(intern.endDate) : "Tuesday 17th November, 2026";
  const departmentName = intern.department?.name ? `${intern.department.name.toUpperCase()} (RAYPOWER / AIT)` : "ONLINE UNIT (RAYPOWER)";

  return (
    <PhysicalLetterheadPage>
      <div className="space-y-6 text-[14px]">
        {/* Internal Memo Header */}
        <div className="text-center border-b-2 border-gray-900 pb-2 mb-4">
          <h2 className="text-2xl font-bold tracking-widest uppercase">INTERNAL MEMO</h2>
        </div>

        {/* Memo Meta */}
        <div className="grid grid-cols-6 gap-y-2 border-b border-gray-300 pb-4 text-xs font-bold leading-normal">
          <div className="col-span-1">TO:</div>
          <div className="col-span-5 uppercase">{departmentName}</div>

          <div className="col-span-1">FROM:</div>
          <div className="col-span-5">HEAD ADMIN / HRD</div>

          <div className="col-span-1">DATE:</div>
          <div className="col-span-5">{customDate || fmtDate(new Date())}</div>

          <div className="col-span-1">SUBJECT:</div>
          <div className="col-span-5 uppercase">POSTING OF A CORPS MEMBER</div>
        </div>

        {/* Body */}
        <p className="text-justify leading-7 pt-2">
          We are pleased to inform you that, <span className="font-bold">{internName}</span> is hereby
          posted to the <span className="font-bold">{departmentName}</span> for his/her National Youth Service
          Corps (NYSC), from <span className="font-semibold">{startDateStr}</span> to{" "}
          <span className="font-semibold">{endDateStr}</span>.
        </p>

        <p className="text-justify leading-7">
          During the period of his/her assignment, he/she would abide with the rules and regulations of the
          Organisation and work to the actualization of the common goal of the department and the Organisation.
        </p>

        <p className="text-justify leading-7">
          Kindly give him/her the necessary orientation that he/she needs to settle down and operate efficiently.
        </p>

        <p className="pt-2 font-bold">Thank You,</p>

        {/* Signoff */}
        <div className="pt-8 space-y-1 text-xs">
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">Cindy Chinyere Uduma</p>
          <p className="font-bold text-gray-700">HEAD ADMIN / HRD</p>
          <p className="text-gray-500 pt-4 font-bold text-[11px]">Cc: GMRS, ADMIN/HRD OFFICER</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 4. NYSC Monthly Clearance Letter Template ────────────────────────────────

function NYSCMonthlyClearanceTemplate({
  intern,
  customDate,
  clearanceMonth,
}: {
  intern: InternObject;
  customDate: string;
  clearanceMonth: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const month = clearanceMonth.toUpperCase() || "JANUARY 2026";
  const currentMonth = "DECEMBER 2025";

  return (
    <PhysicalLetterheadPage>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-left font-bold text-sm tracking-wide">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5 font-bold leading-tight uppercase">
          <p>THE STATE COORDINATOR,</p>
          <p>N.Y.S.C. SECRETARIAT,</p>
          <p>SURULERE, LAGOS.</p>
        </div>

        <p className="font-medium">Dear Sir/Madam</p>

        {/* Title */}
        <div className="text-center py-1">
          <h2 className="text-base font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
            CLEARANCE FOR THE MONTH OF {month}
          </h2>
        </div>

        {/* Body text */}
        <p className="text-justify leading-7">
          This is to inform you that, <span className="font-bold">{internName}</span> is a Corp Member
          with <span className="font-bold">DAAR Communications PLC</span>. He/She has performed his/her duty
          diligently in the month of <span className="font-bold">{currentMonth}</span>.
        </p>

        <p className="text-justify leading-7">
          Kindly pay his/her allowance for the month of <span className="font-bold">{currentMonth}</span>.
        </p>

        <p className="font-bold">Yours faithfully,</p>

        {/* Signoff block */}
        <div className="pt-10 space-y-1 text-xs">
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-bold text-gray-700 uppercase">HEAD ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 5. NYSC Final Clearance Letter Template ──────────────────────────────────

function NYSCFinalClearanceTemplate({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;

  return (
    <PhysicalLetterheadPage>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-left font-bold text-sm tracking-wide">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5 font-bold leading-tight">
          <p>The State Coordinator,</p>
          <p>National Youth Service Corps,</p>
          <p>Babs Animashaun Street,</p>
          <p>Surulere, Lagos.</p>
        </div>

        <p className="font-medium">Dear Sir/Madam,</p>

        {/* Title */}
        <div className="text-center py-1">
          <h2 className="text-base font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
            FINAL CLEARANCE LETTER
          </h2>
        </div>

        {/* Body text */}
        <p className="text-justify leading-7">
          This is to certify that <span className="font-bold">{internName}</span>, a National Youth Corp Member
          serving at <span className="font-bold">DAAR Communications PLC</span> has satisfactorily done his/her
          job for the duration of his/her service year and he/she is <span className="font-bold">not indebted</span> to
          the organization.
        </p>

        <p className="text-justify leading-7">
          We therefore recommend his/her discharge from the NYSC programme.
        </p>

        <p className="font-bold">Yours Faithfully,</p>

        {/* Signoff block */}
        <div className="pt-10 space-y-1 text-xs">
          <p className="font-bold">For: DAAR COMMUNICATIONS PLC</p>
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-bold text-gray-700 uppercase">HEAD ADMIN. / HUMAN RESOURCES DEVELOPMENT, LAGOS</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── Main Document Generation Page ────────────────────────────────────────────

export default function DocumentGenerationPage() {
  const { data: internsData, isLoading: loadingInterns } = useInterns({ limit: 100 });
  const interns = internsData?.data ?? [];

  const [selectedInternId, setSelectedInternId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplateType>("ACCEPTANCE_LETTER");
  const [customDate, setCustomDate] = useState<string>("");
  const [clearanceMonth, setClearanceMonth] = useState<string>("January 2026");

  const { data: singleInternData } = useIntern(selectedInternId);
  const intern = singleInternData?.data?.intern ?? interns.find((i) => i._id === selectedInternId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/documents"
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back to Documents
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Official Letterhead Document Generator
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Format and print clean template letters directly onto company pre-printed letterhead paper.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            disabled={!intern}
            className="gap-2 rounded-xl shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print onto Letterhead Paper / Save PDF
          </Button>
        </div>
      </div>

      {/* Info notice explaining physical letterhead workflow */}
      <div className="no-print flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-800/40 px-4 py-3 text-xs text-blue-900 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="font-semibold">Calibrated for Office Letterhead Stationery</p>
          <p className="text-blue-800/80 dark:text-blue-300/80 mt-0.5">
            This template is formatted in the official company font (Comic Sans MS) with exact top and bottom clearance. Load your company's pre-printed physical letterhead sheets into the printer tray and print directly.
          </p>
        </div>
      </div>

      {/* Control Panel (Hidden during Print) */}
      <Card className="no-print border-border/60 shadow-sm bg-card">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Select Intern */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Select Intern / NYSC Corper</Label>
              <Select value={selectedInternId} onValueChange={setSelectedInternId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder={loadingInterns ? "Loading interns…" : "Choose intern..."} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {interns.map((i) => (
                    <SelectItem key={i._id} value={i._id} className="text-xs">
                      {i.firstName} {i.lastName} &bull; {i.internshipType === "NYSC_IT" ? "NYSC" : "IT"} ({i.department?.name ?? "General"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Select Template */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Document Template</Label>
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as LetterTemplateType)}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCEPTANCE_LETTER">Student Acceptance Letter</SelectItem>
                  <SelectItem value="IT_COMPLETION_LETTER">IT Completion Letter</SelectItem>
                  <SelectItem value="NYSC_INTERNAL_POSTING">NYSC Internal Posting Memo</SelectItem>
                  <SelectItem value="NYSC_MONTHLY_CLEARANCE">NYSC Monthly Clearance Letter</SelectItem>
                  <SelectItem value="NYSC_FINAL_CLEARANCE">NYSC Final Clearance Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Letter Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Custom Date (Optional)</Label>
              <Input
                placeholder="e.g. 23RD DECEMBER, 2025."
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Conditional extra controls for Monthly Clearance */}
          {selectedTemplate === "NYSC_MONTHLY_CLEARANCE" && (
            <div className="mt-4 pt-3 border-t border-border/40 max-w-xs">
              <Label className="text-xs font-semibold">Clearance Month</Label>
              <Input
                placeholder="e.g. JANUARY 2026"
                value={clearanceMonth}
                onChange={(e) => setClearanceMonth(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document View Area */}
      {intern ? (
        <div className="pb-12 animate-fade-up">
          {selectedTemplate === "ACCEPTANCE_LETTER" && (
            <StudentAcceptanceLetter intern={intern} customDate={customDate} />
          )}
          {selectedTemplate === "IT_COMPLETION_LETTER" && (
            <ITCompletionLetter intern={intern} customDate={customDate} />
          )}
          {selectedTemplate === "NYSC_INTERNAL_POSTING" && (
            <NYSCInternalPostingTemplate intern={intern} customDate={customDate} />
          )}
          {selectedTemplate === "NYSC_MONTHLY_CLEARANCE" && (
            <NYSCMonthlyClearanceTemplate
              intern={intern}
              customDate={customDate}
              clearanceMonth={clearanceMonth}
            />
          )}
          {selectedTemplate === "NYSC_FINAL_CLEARANCE" && (
            <NYSCFinalClearanceTemplate intern={intern} customDate={customDate} />
          )}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/20">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">Select an intern to view &amp; print document</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Choose an intern from the dropdown above to auto-fill their official records into the template.
          </p>
        </div>
      )}
    </div>
  );
}

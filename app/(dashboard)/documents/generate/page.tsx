"use client";

import { useState } from "react";
import Link from "next/link";
import { useInterns, useIntern } from "@/features/interns/hooks";
import {
  FileText,
  Printer,
  ChevronLeft,
  Building2,
  Calendar,
  Sparkles,
  Award,
  Send,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  | "NYSC_FINAL_CLEARANCE"
  | "INTERN_RECORD";

interface TemplateConfig {
  label: string;
  category: "STUDENT" | "NYSC" | "GENERAL";
  description: string;
  refCode: string;
}

const TEMPLATES: Record<LetterTemplateType, TemplateConfig> = {
  ACCEPTANCE_LETTER: {
    label: "Student Acceptance Letter",
    category: "STUDENT",
    description: "Official Letter of Acceptance for IT / SIWES students onto company letterhead.",
    refCode: "DAAR/HRD/IT/ACC",
  },
  IT_COMPLETION_LETTER: {
    label: "IT Completion Letter",
    category: "STUDENT",
    description: "Official confirmation of completed industrial training, department, and conduct.",
    refCode: "DAAR/HRD/IT/COMP",
  },
  NYSC_INTERNAL_POSTING: {
    label: "NYSC Internal Posting Memo",
    category: "NYSC",
    description: "Internal memo posting a corps member to a specific operational unit/department.",
    refCode: "DAAR/HRD/NYSC/POST",
  },
  NYSC_MONTHLY_CLEARANCE: {
    label: "NYSC Monthly Clearance Letter",
    category: "NYSC",
    description: "Addressed to NYSC State Coordinator authorizing the member's monthly allowance.",
    refCode: "DAAR/HRD/NYSC/MC",
  },
  NYSC_FINAL_CLEARANCE: {
    label: "NYSC Final Clearance Letter",
    category: "NYSC",
    description: "Final clearance letter confirming completed service year & recommending discharge.",
    refCode: "DAAR/HRD/NYSC/FC",
  },
  INTERN_RECORD: {
    label: "Intern Profile Record",
    category: "GENERAL",
    description: "Comprehensive institutional record summary of personal, academic and placement data.",
    refCode: "DAAR/HRD/REC",
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
  return `${day}${suffix} ${month}, ${year}`;
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

// ─── Company Letterhead Wrapper ───────────────────────────────────────────────

function LetterheadWrapper({
  children,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <div className="print-sheet mx-auto max-w-[800px] bg-white text-gray-900 shadow-xl rounded-sm p-10 font-serif leading-relaxed relative min-h-[1050px] flex flex-col justify-between border border-gray-200">
      <div>
        {/* Official Header */}
        {!hideHeader && (
          <div className="border-b border-gray-200 pb-4 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/letterhead-header.png"
              alt="DAAR Communications Plc Letterhead"
              className="w-full h-auto object-contain max-h-[140px]"
            />
          </div>
        )}

        {/* Document Content */}
        <div className="px-3">{children}</div>
      </div>

      {/* Official Footer */}
      <div className="border-t border-gray-200 pt-3 mt-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/letterhead-footer.png"
          alt="DAAR Communications Registered Office Footer"
          className="w-full h-auto object-contain max-h-[80px]"
        />
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
    <LetterheadWrapper>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-right font-sans font-bold text-xs tracking-wider">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5">
          <p className="font-bold">THE COORDINATOR,</p>
          <p className="font-bold">INTERNSHIP UNIT / SIWES,</p>
          <p className="font-bold uppercase">{intern.institution || "LAGOS STATE UNIVERSITY"},</p>
          <p className="font-bold">NIGERIA.</p>
        </div>

        <p>Dear Sir/Ma,</p>

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
          <span className="font-semibold">{endDateStr}</span> in the{" "}
          <span className="font-semibold">{intern.department?.name ?? "Assigned"}</span> department.
        </p>

        <p className="text-justify leading-7">
          We shall do our best to have them fully engaged so that they can acquire all the necessary practical
          work experience, professional ethics, and operational exposure.
        </p>

        <p>Yours Faithfully,</p>

        {/* Signoff block */}
        <div className="pt-8 space-y-1 text-xs">
          <p className="font-bold">FOR: DAAR COMMUNICATIONS PLC</p>
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-medium text-gray-700">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </LetterheadWrapper>
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
  const startDateStr = intern.startDate ? fmtDate(intern.startDate) : "15th July, 2026";
  const endDateStr = intern.endDate ? fmtDate(intern.endDate) : "15th October, 2026";

  return (
    <LetterheadWrapper>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-right font-sans font-bold text-xs tracking-wider">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5">
          <p className="font-bold">THE COORDINATOR,</p>
          <p className="font-bold">SIWES / INDUSTRIAL TRAINING UNIT,</p>
          <p className="font-bold uppercase">{intern.institution || "LEAD CITY UNIVERSITY"},</p>
          <p className="font-bold">NIGERIA.</p>
        </div>

        <p>Dear Sir/Ma,</p>

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
          successfully completed their Industrial Training program in the{" "}
          <span className="font-bold">{intern.department?.name ?? "Operations"}</span> department at{" "}
          <span className="font-bold">DAAR Communications PLC, Lagos</span> from{" "}
          <span className="font-semibold">{startDateStr}</span> to{" "}
          <span className="font-semibold">{endDateStr}</span>.
        </p>

        <p className="text-justify leading-7">
          During their stay with us, they were hardworking, disciplined, punctual, and resourceful in executing assigned
          operational tasks and responsibilities.
        </p>

        <p>Yours Faithfully,</p>

        {/* Signoff block */}
        <div className="pt-8 space-y-1 text-xs">
          <p className="font-bold">FOR: DAAR COMMUNICATIONS PLC</p>
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-medium text-gray-700">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </LetterheadWrapper>
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
    <LetterheadWrapper hideHeader={false}>
      <div className="space-y-6 text-[14px]">
        {/* Internal Memo Title */}
        <div className="text-center border-b-2 border-gray-900 pb-2 mb-4">
          <h2 className="text-xl font-bold tracking-widest uppercase">INTERNAL MEMO</h2>
        </div>

        {/* Memo Meta */}
        <div className="grid grid-cols-6 gap-y-2 border-b border-gray-300 pb-4 font-sans text-xs">
          <div className="font-bold col-span-1">TO:</div>
          <div className="col-span-5 font-bold uppercase">{departmentName}</div>

          <div className="font-bold col-span-1">FROM:</div>
          <div className="col-span-5 font-semibold">HEAD ADMIN / HRD</div>

          <div className="font-bold col-span-1">DATE:</div>
          <div className="col-span-5">{customDate || fmtDate(new Date())}</div>

          <div className="font-bold col-span-1">SUBJECT:</div>
          <div className="col-span-5 font-bold uppercase text-primary">POSTING OF A CORPS MEMBER</div>
        </div>

        {/* Body */}
        <p className="text-justify leading-7 pt-2">
          We are pleased to inform you that, <span className="font-bold">{internName}</span> is hereby
          posted to the <span className="font-bold">{departmentName}</span> for his/her National Youth Service
          Corps (NYSC) primary assignment, from <span className="font-semibold">{startDateStr}</span> to{" "}
          <span className="font-semibold">{endDateStr}</span>.
        </p>

        <p className="text-justify leading-7">
          During the period of their assignment, they are expected to abide strictly with the rules, operational
          protocols, and regulations of the Organisation and work towards the actualization of the common goals
          of the department and the Organisation.
        </p>

        <p className="text-justify leading-7">
          Kindly accord them the necessary orientation, facilities, and guidance needed to settle down and operate
          efficiently.
        </p>

        <p className="pt-2">Thank You.</p>

        {/* Signoff */}
        <div className="pt-8 space-y-1 text-xs">
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">Cindy Chinyere Uduma</p>
          <p className="text-gray-600">Head, Admin / Human Resources Development</p>
          <p className="text-gray-500 pt-3 italic font-sans text-[11px]">Cc: GMRS, ADMIN/HRD OFFICER, SUPERVISOR</p>
        </div>
      </div>
    </LetterheadWrapper>
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
  const month = clearanceMonth.toUpperCase() || "DECEMBER 2025";

  return (
    <LetterheadWrapper>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-right font-sans font-bold text-xs tracking-wider">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5">
          <p className="font-bold">THE STATE COORDINATOR,</p>
          <p className="font-bold">N.Y.S.C. SECRETARIAT,</p>
          <p className="font-bold">BABS ANIMASHAUN STREET, SURULERE, LAGOS.</p>
        </div>

        <p>Dear Sir/Madam,</p>

        {/* Title */}
        <div className="text-center py-1">
          <h2 className="text-base font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
            CLEARANCE FOR THE MONTH OF {month}
          </h2>
        </div>

        {/* Body text */}
        <p className="text-justify leading-7">
          This is to inform you that, <span className="font-bold">{internName}</span> is a serving Corps
          Member with <span className="font-bold">DAAR Communications PLC</span>.
        </p>

        <p className="text-justify leading-7">
          They have performed their duties diligently, punctually, and satisfactorily in the month of{" "}
          <span className="font-bold">{month}</span>.
        </p>

        <p className="text-justify leading-7">
          Kindly process and pay their monthly allowance for the month of{" "}
          <span className="font-bold">{month}</span> accordingly.
        </p>

        <p>Yours faithfully,</p>

        {/* Signoff block */}
        <div className="pt-8 space-y-1 text-xs">
          <p className="font-bold">FOR: DAAR COMMUNICATIONS PLC</p>
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-medium text-gray-700">HEAD ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </LetterheadWrapper>
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
    <LetterheadWrapper>
      <div className="space-y-6 text-[14px]">
        {/* Date */}
        <div className="text-right font-sans font-bold text-xs tracking-wider">
          {customDate || fmtDate(new Date())}
        </div>

        {/* Recipient */}
        <div className="space-y-0.5">
          <p className="font-bold">THE STATE COORDINATOR,</p>
          <p className="font-bold">NATIONAL YOUTH SERVICE CORPS,</p>
          <p className="font-bold">BABS ANIMASHAUN STREET, SURULERE, LAGOS.</p>
        </div>

        <p>Dear Sir/Madam,</p>

        {/* Title */}
        <div className="text-center py-1">
          <h2 className="text-base font-bold tracking-wide uppercase underline decoration-1 underline-offset-4">
            FINAL CLEARANCE LETTER
          </h2>
        </div>

        {/* Body text */}
        <p className="text-justify leading-7">
          This is to certify that <span className="font-bold">{internName}</span>, a National Youth Corps Member
          serving at <span className="font-bold">DAAR Communications PLC</span>, has satisfactorily done their job
          for the entire duration of their service year and is <span className="font-bold">not indebted</span> to the organization in
          any capacity.
        </p>

        <p className="text-justify leading-7">
          We therefore recommend their full discharge from the National Youth Service Corps programme.
        </p>

        <p>Yours Faithfully,</p>

        {/* Signoff block */}
        <div className="pt-8 space-y-1 text-xs">
          <p className="font-bold">FOR: DAAR COMMUNICATIONS PLC</p>
          <div className="h-10" />
          <p className="font-bold text-sm tracking-wide">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-medium text-gray-700">HEAD ADMIN. / HUMAN RESOURCES DEVELOPMENT, LAGOS</p>
        </div>
      </div>
    </LetterheadWrapper>
  );
}

// ─── 6. Comprehensive Intern Profile Record ───────────────────────────────────

function InternRecordTemplate({ intern }: { intern: InternObject }) {
  return (
    <LetterheadWrapper>
      <div className="space-y-6 text-[13px]">
        <div className="text-center border-b pb-2">
          <h2 className="text-lg font-bold tracking-wider uppercase">OFFICIAL INTERN PROFILE RECORD</h2>
          <p className="text-xs text-gray-500 font-sans">DAAR Communications PLC &bull; HR Management System</p>
        </div>

        <div className="bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-2 gap-4 font-sans text-xs">
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Full Name</p>
            <p className="font-bold text-sm text-gray-900">{intern.firstName} {intern.lastName}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Program Type</p>
            <p className="font-semibold text-gray-900">{intern.internshipType === "NYSC_IT" ? "NYSC Corper" : "Industrial Training (IT)"}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Institution / University</p>
            <p className="font-semibold text-gray-900">{intern.institution}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Course of Study</p>
            <p className="font-semibold text-gray-900">{intern.course}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Department Assigned</p>
            <p className="font-semibold text-gray-900">{intern.department?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Supervisor</p>
            <p className="font-semibold text-gray-900">
              {intern.supervisor && typeof intern.supervisor !== "string"
                ? `${intern.supervisor.firstName} ${intern.supervisor.lastName}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Commencement Date</p>
            <p className="font-semibold text-gray-900">{fmtDate(intern.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-[10px] font-bold">Expected / Actual End Date</p>
            <p className="font-semibold text-gray-900">{fmtDate(intern.endDate)}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="font-bold text-xs uppercase tracking-wide">Current Status &amp; Verification</p>
          <div className="border border-gray-200 rounded p-3 text-xs flex justify-between items-center">
            <span>Administrative Status: <strong>{intern.status}</strong></span>
            <span>Recorded at: {new Date(intern.createdAt).toLocaleDateString("en-GB")}</span>
          </div>
        </div>
      </div>
    </LetterheadWrapper>
  );
}

// ─── Main Document Generation Page ────────────────────────────────────────────

export default function DocumentGenerationPage() {
  const { data: internsData, isLoading: loadingInterns } = useInterns({ limit: 100 });
  const interns = internsData?.data ?? [];

  const [selectedInternId, setSelectedInternId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplateType>("ACCEPTANCE_LETTER");
  const [customDate, setCustomDate] = useState<string>("");
  const [clearanceMonth, setClearanceMonth] = useState<string>("December 2025");

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
            Official Company Document Generator
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate and print authenticated DAAR Communications letterhead documents for interns and NYSC personnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            disabled={!intern}
            className="gap-2 rounded-xl shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Document / Save as PDF
          </Button>
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
                  <SelectItem value="INTERN_RECORD">Intern Profile Record</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Letter Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Custom Letter Date (Optional)</Label>
              <Input
                placeholder="e.g. 15TH OCTOBER, 2026"
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
                placeholder="e.g. December 2025"
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
          {selectedTemplate === "INTERN_RECORD" && (
            <InternRecordTemplate intern={intern} />
          )}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/20">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">Select an intern to generate document</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Choose an intern from the dropdown above to load their official records into the authentic DAAR Communications letterhead template.
          </p>
        </div>
      )}
    </div>
  );
}

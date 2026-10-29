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
    description: "Exact replica of official Acceptance Letter for IT / SIWES students.",
  },
  IT_COMPLETION_LETTER: {
    label: "IT Completion Letter",
    category: "STUDENT",
    description: "Exact replica of official Completion of Industrial Training Letter.",
  },
  NYSC_INTERNAL_POSTING: {
    label: "NYSC Internal Posting Memo",
    category: "NYSC",
    description: "Exact replica of official Internal Memo for posting a Corps Member.",
  },
  NYSC_MONTHLY_CLEARANCE: {
    label: "NYSC Monthly Clearance Letter",
    category: "NYSC",
    description: "Exact replica of official Monthly NYSC Allowance Clearance Letter.",
  },
  NYSC_FINAL_CLEARANCE: {
    label: "NYSC Final Clearance Letter",
    category: "NYSC",
    description: "Exact replica of official Final Clearance and Discharge Recommendation.",
  },
};

// ─── Format date helpers matching company conventions ─────────────────────────

function fmtDateWithSup(dInput?: string | Date): { dayNum: string; daySuffix: string; rest: string } {
  const d = dInput ? new Date(dInput) : new Date();
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
  return {
    dayNum: String(day),
    daySuffix: suffix,
    rest: `${month}, ${year}.`,
  };
}

function fmtDatePlain(dInput?: string | Date): string {
  const d = dInput ? new Date(dInput) : new Date();
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
      ? "nd"
      : day === 3 || day === 23
      ? "rd"
      : "th";
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${day}${suffix} ${month}, ${year}`;
}

function fmtDateWithDay(dInput?: string | Date): string {
  const d = dInput ? new Date(dInput) : new Date();
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
      ? "nd"
      : day === 3 || day === 23
      ? "rd"
      : "th";
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${weekday} ${day}${suffix} ${month}, ${year}`;
}

// ─── Physical Letterhead Wrapper ──────────────────────────────────────────────
// Exact physical calibration:
// Left margin: 72pt (1 inch / 25.4mm)
// Right margin: 72pt (1 inch / 25.4mm)
// Top margin: 100pt (~35mm) to clear the physical DAAR header
// Bottom margin: 80pt (~28mm) to clear the physical DAAR footer

function PhysicalLetterheadPage({
  children,
  fontFamilyClass = "font-comic",
}: {
  children: React.ReactNode;
  fontFamilyClass?: string;
}) {
  return (
    <div
      className={`print-a4-page mx-auto bg-white text-black shadow-xl rounded-sm p-[35mm_25.4mm_28mm_25.4mm] ${fontFamilyClass} leading-[1.6] relative min-h-[1122px] max-w-[794px] border border-gray-200 select-text`}
      style={{ boxSizing: "border-box" }}
    >
      {/* Visual guide (hidden when printed) */}
      <div className="no-print absolute top-3 left-6 right-6 border border-dashed border-primary/25 rounded py-1.5 px-3 text-center text-[11px] text-primary/80 bg-primary/5 select-none font-sans">
        [ Physical Letterhead Area &bull; Company banner &amp; logo pre-printed on physical paper sits above this line ]
      </div>

      {/* Actual document body text */}
      <div className="document-body">{children}</div>

      {/* Footer guide (hidden when printed) */}
      <div className="no-print absolute bottom-3 left-6 right-6 border border-dashed border-gray-300 rounded py-1 px-3 text-center text-[10px] text-gray-400 select-none font-sans">
        [ Physical Registered Office Address Footer Area &bull; Pre-printed on paper ]
      </div>
    </div>
  );
}

// ─── 1. Student Acceptance Letter Template (Exact Replica of Lucy Letter) ─────

function StudentAcceptanceLetter({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const startDateStr = intern.startDate ? fmtDateWithDay(intern.startDate) : "Wednesday 1st July, 2026";
  const endDateStr = intern.endDate ? fmtDateWithDay(intern.endDate) : "Thursday 31st December, 2026";
  const dateObj = fmtDateWithSup();

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[14px] text-black">
        {/* Date — Left aligned */}
        <div className="mb-6">
          {customDate ? (
            <span className="font-bold">{customDate}</span>
          ) : (
            <span className="font-bold">
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </span>
          )}
        </div>

        {/* Recipient Block — Left aligned, NO underlines */}
        <div className="mb-6 font-bold leading-tight uppercase">
          <p>THE COORDINATOR,</p>
          <p>INTERNSHIP UNIT,</p>
          <p>{intern.institution || "LAGOS STATE UNIVERSITY."},</p>
          <p>OJO, LAGOS STATE.</p>
        </div>

        {/* Salutation */}
        <p className="mb-6 font-normal">Dear Sir/Ma,</p>

        {/* Title — Center aligned, bold, NO underline (matches original scan) */}
        <div className="text-center mb-6">
          <h2 className="text-[15px] font-bold uppercase tracking-wide">
            LETTER OF ACCEPTANCE
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-5 leading-[1.75]">
          We write to inform you that, <span className="font-bold">{internName}</span> has been
          accepted to undergo a six month Industrial Training with <span className="font-bold">DAAR
          Communications PLC, Lagos</span>, from {startDateStr} to {endDateStr}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.75]">
          We shall do our best to have her fully engaged so that she can acquire all the necessary work experience.
        </p>

        {/* Signoff */}
        <p className="mb-14 font-normal">Yours Faithfully,</p>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[14px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-normal text-[13px] uppercase">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 2. IT / SIWES Completion Letter Template (Exact Replica of IT Completion) ─

function ITCompletionLetter({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const startDateStr = intern.startDate ? fmtDatePlain(intern.startDate) : "15th July, 2026";
  const endDateStr = intern.endDate ? fmtDatePlain(intern.endDate) : "15th October, 2026";
  const departmentName = intern.department?.name ? `${intern.department.name} department` : "Marketing department";
  const dateObj = fmtDateWithSup();

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[14px] text-black">
        {/* Date — Left aligned */}
        <div className="mb-6">
          {customDate ? (
            <span className="font-bold">{customDate}</span>
          ) : (
            <span className="font-bold">
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </span>
          )}
        </div>

        {/* Recipient Block — Left aligned, NO underlines */}
        <div className="mb-6 font-bold leading-tight uppercase">
          <p>THE CORDINATOR,</p>
          <p>SIWES UNIT,</p>
          <p>{intern.institution || "LEAD CITY UNIVERSITY,"}</p>
          <p>TOLL GATE IBADAN,</p>
          <p>OYO STATE.</p>
        </div>

        {/* Salutation */}
        <p className="mb-6 font-normal">Dear Sir/Ma,</p>

        {/* Title — Center aligned, bold, NO underline (matches original scan) */}
        <div className="text-center mb-6">
          <h2 className="text-[15px] font-bold uppercase tracking-wide">
            COMPLETION OF INDUSTRIAL TRAINING
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-5 leading-[1.75]">
          This is to certify that the above named intern, <span className="font-bold">{internName}</span> a
          student in your Institution from the Department of {intern.course || "Mass communication and Media technology"} has
          successfully completed her three (3) month Industrial Training from {departmentName} in <span className="font-bold">DAAR
          Communications PLC, Lagos</span> from {startDateStr} to {endDateStr}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.75]">
          During her stay, she was hard working and resourceful.
        </p>

        {/* Signoff */}
        <p className="mb-14 font-normal">Yours Faithfully</p>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[14px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-normal text-[13px] uppercase">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 3. NYSC Internal Posting Memo (Exact Replica of NYSC INTERNAL POSTING) ───

function NYSCInternalPostingTemplate({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const startDateStr = intern.startDate ? fmtDateWithDay(intern.startDate) : "Monday 17th November, 2025";
  const endDateStr = intern.endDate ? fmtDateWithDay(intern.endDate) : "Tuesday 17th November, 2026";
  const departmentName = intern.department?.name ? `${intern.department.name.toUpperCase()} (RAYPOWER)` : "ONLINE UNIT (RAYPOWER)";
  const dateObj = fmtDateWithSup();

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[14px] text-black">
        {/* Title — Left aligned, 24pt, bold, NO line underneath (matches original file) */}
        <h1 className="text-[24px] font-bold uppercase tracking-wider mb-8">
          INTERNAL MEMO
        </h1>

        {/* Memo Meta Block — Left aligned, bold, Comic Sans 14pt */}
        <div className="space-y-1.5 mb-8 font-bold leading-relaxed text-[14px]">
          <p>TO: {departmentName}</p>
          <p>FROM: HEAD ADMIN/HRD</p>
          <p>
            DATE:{" "}
            {customDate ? (
              customDate
            ) : (
              <>
                {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
              </>
            )}
          </p>
          <p>SUBJECT: POSTING OF A CORPS MEMBER</p>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-5 leading-[1.75]">
          We are pleased to inform you that, <span className="font-bold">{internName}</span> is
          hereby posted to the <span className="font-bold">{departmentName}</span> for his
          NYSC, from {startDateStr} to {endDateStr}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-5 leading-[1.75]">
          During the period of his assignment, he would abide with the rules and regulations of the
          Organisation and work to the actualization of the common goal of the department and the Organisation.
        </p>

        {/* Paragraph 3 */}
        <p className="text-justify mb-8 leading-[1.75]">
          Kindly give him the necessary orientation that he needs to settle down and operate efficiently.
        </p>

        {/* Signoff */}
        <p className="font-bold mb-4">Thank You,</p>
        <p className="font-bold mb-10">Cindy Chinyere Uduma</p>

        {/* Copies */}
        <p className="text-[11px] text-black">Cc: GMRS, ADMIN/HRD OFFICER</p>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 4. NYSC Monthly Clearance Letter (Exact Replica of NYSC MONTHLY CLEARANCE) ─

function NYSCMonthlyClearanceTemplate({
  intern,
  customDate,
  clearanceMonth,
  servingMonth,
}: {
  intern: InternObject;
  customDate: string;
  clearanceMonth: string;
  servingMonth: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const forMonth = clearanceMonth.toUpperCase() || "JANUARY 2026";
  const dutyMonth = servingMonth.toUpperCase() || "DECEMBER 2025";
  const stateCode = "LA/25A/14362"; // Can be configured or stored on intern profile
  const dateObj = fmtDateWithSup();

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[14px] text-black">
        {/* Date — Left aligned, 14pt bold with superscript */}
        <div className="mb-6 font-bold text-[14px]">
          {customDate ? (
            customDate
          ) : (
            <>
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </>
          )}
        </div>

        {/* Recipient Block — Left aligned, bold, NO underlines */}
        <div className="mb-6 font-bold leading-tight uppercase">
          <p>THE STATE COORDINATOR,</p>
          <p>N.Y.S.C. SECRETARIAT,</p>
          <p>SURULERE, LAGOS.</p>
        </div>

        {/* Salutation — Normal weight */}
        <p className="mb-6 font-normal">Dear Sir/Madam</p>

        {/* Title — Center indented (x=119.5), bold, NO underline */}
        <div className="text-center mb-6">
          <h2 className="text-[14px] font-bold uppercase tracking-wide inline-block">
            CLEARANCE FOR THE MONTH OF {forMonth}
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-5 leading-[1.75]">
          This is to inform you that, <span className="font-bold">{internName}</span> with
          state code <span className="font-bold">{stateCode}</span> is a Corp Member with DAAR
          Communications PLC. He has performed his duty diligently in the
          month of <span className="font-bold">{dutyMonth}</span>.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.75]">
          Kindly pay his allowance for the month of <span className="font-bold">{dutyMonth}</span>.
        </p>

        {/* Signoff */}
        <p className="mb-14 font-normal">Yours faithfully,</p>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[14px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-normal text-[14px] uppercase">HEAD ADMIN. /HUMAN RESOURCES DEVELOPMENT</p>
        </div>
      </div>
    </PhysicalLetterheadPage>
  );
}

// ─── 5. NYSC Final Clearance Letter (Exact Replica of NYSC FINAL CLEARANCE) ────

function NYSCFinalClearanceTemplate({
  intern,
  customDate,
}: {
  intern: InternObject;
  customDate: string;
}) {
  const internName = `${intern.lastName.toUpperCase()}, ${intern.firstName.toUpperCase()}`;
  const callUpNumber = "NYSC/CUO/2025/182518";
  const stateCode = "LA/25B/0739";
  const dateObj = fmtDateWithSup();

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-serif">
      <div className="text-[14px] text-black font-serif">
        {/* Date — Left aligned, 14pt bold with superscript */}
        <div className="mb-6 font-bold text-[14px]">
          {customDate ? (
            customDate
          ) : (
            <>
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </>
          )}
        </div>

        {/* Recipient Block — Left aligned, bold, Title Case (matches original) */}
        <div className="mb-6 font-bold leading-tight">
          <p>The State Coordinator,</p>
          <p>National Youth Service Corps,</p>
          <p>Babs Animashaun Street,</p>
          <p>Surulere, Lagos.</p>
        </div>

        {/* Salutation */}
        <p className="mb-6 font-normal">Dear Sir/Madam,</p>

        {/* Title — Center aligned, bold, NO underline (matches original PDF) */}
        <div className="text-center mb-6">
          <h2 className="text-[14px] font-bold uppercase tracking-wide inline-block">
            FINAL CLEARANCE LETTER
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-5 leading-[1.75]">
          This is to certify that <span className="font-bold">{internName}</span>, a National Youth Corp
          Member serving at DAAR Communications PLC with call up number{" "}
          <span className="font-bold">{callUpNumber}</span>, and state code{" "}
          <span className="font-bold">{stateCode}</span> has satisfactorily done his job for the
          duration of his service year and he is not indebted to the organization.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.75]">
          We therefore recommend his discharge from the NYSC programme.
        </p>

        {/* Signoff */}
        <div className="mb-14 space-y-1">
          <p className="font-bold">Yours Faithfully,</p>
          <p className="font-bold">For: DAAR COMMUNICATIONS PLC</p>
        </div>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[14px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-bold text-[13px] uppercase">HEAD ADMIN./ HUMAN RESOURCES DEVELOPMENT, LAGOS</p>
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
  const [clearanceMonth, setClearanceMonth] = useState<string>("JANUARY 2026");
  const [servingMonth, setServingMonth] = useState<string>("DECEMBER 2025");

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
            Exact replicas of DAAR Communications official templates for printing directly onto physical letterhead stationery.
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

      {/* Info notice explaining physical letterhead calibration */}
      <div className="no-print flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-800/40 px-4 py-3 text-xs text-blue-900 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="font-semibold">Calibrated Exact Replica</p>
          <p className="text-blue-800/80 dark:text-blue-300/80 mt-0.5">
            All template text alignments, font weights, line breaks, and margins match the original company reference documents. No artificial lines or underlines are added.
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
                placeholder="Leave blank to use current date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Conditional extra controls for Monthly Clearance */}
          {selectedTemplate === "NYSC_MONTHLY_CLEARANCE" && (
            <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Clearance For Month</Label>
                <Input
                  placeholder="e.g. JANUARY 2026"
                  value={clearanceMonth}
                  onChange={(e) => setClearanceMonth(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Diligently Served Month</Label>
                <Input
                  placeholder="e.g. DECEMBER 2025"
                  value={servingMonth}
                  onChange={(e) => setServingMonth(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
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
              servingMonth={servingMonth}
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

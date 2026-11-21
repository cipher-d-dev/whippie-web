"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { useInterns, useIntern } from "@/features/interns/hooks";
import {
  FileText,
  Printer,
  Download,
  ChevronLeft,
  Sparkles,
  Info,
  Loader2,
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

// ─── Dynamic Duration & Pronoun Helpers ────────────────────────────────────────

const NUMBER_WORDS: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
};

function getDurationInMonths(startDate?: string | Date, endDate?: string | Date): {
  months: number;
  text: string;
  article: string;
  numWithParens: string;
} {
  if (!startDate || !endDate) {
    return { months: 6, text: "six", article: "a", numWithParens: "six (6)" };
  }
  const s = new Date(startDate);
  const e = new Date(endDate);
  const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  let approxMonths = Math.round(diffDays / 30);
  if (approxMonths < 1) approxMonths = 1;
  const word = NUMBER_WORDS[approxMonths] || String(approxMonths);
  // Correct English grammar: "an" before vowel sounds (eight, eleven), "a" before consonants (one, two, three, four, five, six, seven, nine, ten, twelve)
  const startsWithVowel = word.startsWith("e") || word.startsWith("a") || word.startsWith("o") || word.startsWith("i") || word.startsWith("u");
  const article = startsWithVowel ? "an" : "a";
  return {
    months: approxMonths,
    text: word,
    article,
    numWithParens: `${word} (${approxMonths})`,
  };
}

function getPronouns(gender?: string) {
  const isMale = gender === "MALE";
  return {
    heShe: isMale ? "he" : "she",
    HeShe: isMale ? "He" : "She",
    himHer: isMale ? "him" : "her",
    HimHer: isMale ? "Him" : "Her",
    hisHer: isMale ? "his" : "her",
    HisHer: isMale ? "His" : "Her",
  };
}

function getInternFullName(intern: InternObject): string {
  const last = (intern.lastName ?? "").trim().toUpperCase();
  const first = (intern.firstName ?? "").trim().toUpperCase();
  const middle = (intern.middleName ?? "").trim().toUpperCase();
  if (middle) {
    return `${last}, ${first} ${middle}`;
  }
  return `${last}, ${first}`;
}

// ─── Physical Letterhead Wrapper ──────────────────────────────────────────────
// Exact physical calibration based on DAAR Communications letterhead stationery:
// - Physical banner ends at 72.5mm (~2.85 inches) from top of paper.
// - Date line starts at ~80mm (approx 4.5 to 5 cm below the banner/logo, or 3.15 inches from paper top).
// - Left & Right margins: 25.4mm (1 inch)
// - Top clearance padding: 80mm
// - Bottom clearance padding: 35mm (clears registered office address footer)

function PhysicalLetterheadPage({
  children,
  fontFamilyClass = "font-comic",
}: {
  children: React.ReactNode;
  fontFamilyClass?: string;
}) {
  return (
    <div
      className={`letterhead-print-page bg-white shadow-2xl mx-auto rounded-sm relative text-black ${fontFamilyClass}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        padding: "92mm 20mm 30mm 20mm",
      }}
    >
      {/* Visual Header Guide (hidden when printed / exported) */}
      <div
        data-html2canvas-ignore="true"
        className="no-print absolute top-3 left-6 right-6 border border-dashed border-gray-300 rounded py-2 px-3 text-center text-[10px] text-gray-400 select-none font-sans"
      >
        [ Physical Letterhead Area &bull; ~8.5cm reserved for DAAR Communications banner &amp; logo pre-printed on stationery ]
      </div>

      {/* Actual printable letter body */}
      <div className="letterhead-content leading-relaxed">{children}</div>

      {/* Footer guide (hidden when printed / exported) */}
      <div
        data-html2canvas-ignore="true"
        className="no-print absolute bottom-3 left-6 right-6 border border-dashed border-gray-300 rounded py-1 px-3 text-center text-[10px] text-gray-400 select-none font-sans"
      >
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
  const internName = getInternFullName(intern);
  const startDateStr = intern.startDate ? fmtDateWithDay(intern.startDate) : "Wednesday 1st July, 2026";
  const endDateStr = intern.endDate ? fmtDateWithDay(intern.endDate) : "Thursday 31st December, 2026";
  // Rule 1: The date at top is the intern's exit / end date (or custom date)
  const exitDate = intern.endDate ? new Date(intern.endDate) : new Date();
  const dateObj = fmtDateWithSup(exitDate);

  // Rule 2: Dynamic location & duration
  const institutionLocation = intern.institutionLocation?.toUpperCase() || "OJO, LAGOS STATE.";
  const duration = getDurationInMonths(intern.startDate, intern.endDate);

  // Rule 3: Dynamic pronouns based on sex
  const p = getPronouns(intern.gender);

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[16px] text-black leading-[1.85]">
        {/* Date — Left aligned (Date of exit / completion) */}
        <div className="mb-6 font-bold">
          {customDate ? (
            customDate
          ) : (
            <>
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </>
          )}
        </div>

        {/* Recipient Block — Left aligned, normal weight (not bold), uppercase */}
        <div className="mb-6 font-normal leading-snug uppercase">
          <p>THE COORDINATOR,</p>
          <p>INTERNSHIP UNIT,</p>
          <p>{intern.institution || "LAGOS STATE UNIVERSITY."},</p>
          <p>{institutionLocation}</p>
        </div>

        {/* Salutation */}
        <p className="mb-6 font-normal">Dear Sir/Ma,</p>

        {/* Title — Left aligned, bold, NO underline (matches original template placement) */}
        <div className="mb-6 text-left">
          <h2 className="text-[17px] font-bold uppercase tracking-wide">
            LETTER OF ACCEPTANCE
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-6 leading-[1.85]">
          We write to inform you that, <span className="font-bold">{internName}</span> has been
          accepted to undergo {duration.article} {duration.text} month Industrial Training with <span className="font-bold">DAAR
          Communications PLC, Lagos</span>, from {startDateStr} to {endDateStr}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.85]">
          We shall do our best to have {p.himHer} fully engaged so that {p.heShe} can acquire all the necessary work experience.
        </p>

        {/* Signoff */}
        <p className="mb-28 font-normal">Yours Faithfully,</p>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[16px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-normal text-[15px] uppercase">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
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
  const internName = getInternFullName(intern);
  const startDateStr = intern.startDate ? fmtDatePlain(intern.startDate) : "15th July, 2026";
  const endDateStr = intern.endDate ? fmtDatePlain(intern.endDate) : "15th October, 2026";
  const departmentName = intern.department?.name ? `${intern.department.name} department` : "Marketing department";

  // Rule 1: The date at top is the intern's exit / end date (or custom date)
  const exitDate = intern.endDate ? new Date(intern.endDate) : new Date();
  const dateObj = fmtDateWithSup(exitDate);

  // Rule 2: Dynamic location & duration
  const institutionLocation = intern.institutionLocation?.toUpperCase() || "TOLL GATE IBADAN, OYO STATE.";
  const duration = getDurationInMonths(intern.startDate, intern.endDate);

  // Rule 3: Dynamic pronouns
  const p = getPronouns(intern.gender);

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[16px] text-black leading-[1.85]">
        {/* Date — Left aligned */}
        <div className="mb-6 font-bold">
          {customDate ? (
            customDate
          ) : (
            <>
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </>
          )}
        </div>

        {/* Recipient Block — Left aligned, normal weight (not bold), uppercase */}
        <div className="mb-6 font-normal leading-snug uppercase">
          <p>THE CORDINATOR,</p>
          <p>SIWES UNIT,</p>
          <p>{intern.institution || "LEAD CITY UNIVERSITY,"}</p>
          <p>{institutionLocation}</p>
        </div>

        {/* Salutation */}
        <p className="mb-6 font-normal">Dear Sir/Ma,</p>

        {/* Title — Left aligned, bold, NO underline */}
        <div className="mb-6 text-left">
          <h2 className="text-[17px] font-bold uppercase tracking-wide">
            COMPLETION OF INDUSTRIAL TRAINING
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-6 leading-[1.85]">
          This is to certify that the above named intern, <span className="font-bold">{internName}</span> a
          student in your Institution from the Department of {intern.course || "Mass communication and Media technology"} has
          successfully completed {p.hisHer} <span className="font-bold">{duration.numWithParens} month</span> Industrial Training from {departmentName} in <span className="font-bold">DAAR
          Communications PLC, Lagos</span> from {startDateStr} to {endDateStr}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.85]">
          During {p.hisHer} stay, {p.heShe} was hard working and resourceful.
        </p>

        {/* Signoff — 50-55mm blank space for stamp and signature */}
        <p className="mb-28 font-normal">Yours Faithfully</p>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[16px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-normal text-[15px] uppercase">HEAD, ADMIN. / HUMAN RESOURCES DEVELOPMENT</p>
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
  const internName = getInternFullName(intern);
  const startDateStr = intern.startDate ? fmtDateWithDay(intern.startDate) : "Monday 17th November, 2025";
  const endDateStr = intern.endDate ? fmtDateWithDay(intern.endDate) : "Tuesday 17th November, 2026";
  const departmentName = intern.department?.name ? `${intern.department.name.toUpperCase()} (RAYPOWER)` : "ONLINE UNIT (RAYPOWER)";

  // Exit date for memo or current posting date
  const exitDate = intern.endDate ? new Date(intern.endDate) : new Date();
  const dateObj = fmtDateWithSup(exitDate);

  // Dynamic pronouns
  const p = getPronouns(intern.gender);

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[16px] text-black leading-[1.85]">
        {/* Title — Left aligned, 24pt, bold, NO line underneath (matches original file) */}
        <h1 className="text-[24px] font-bold uppercase tracking-wider mb-8 text-left">
          INTERNAL MEMO
        </h1>

        {/* Memo Meta Block — Left aligned, bold, Comic Sans 15pt */}
        <div className="space-y-2 mb-8 font-bold leading-relaxed text-[15px]">
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
        <p className="text-justify mb-6 leading-[1.85]">
          We are pleased to inform you that, <span className="font-bold">{internName}</span> is
          hereby posted to the <span className="font-bold">{departmentName}</span> for {p.hisHer}
          {" "}NYSC, from {startDateStr} to {endDateStr}.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-6 leading-[1.85]">
          During the period of {p.hisHer} assignment, {p.heShe} would abide with the rules and regulations of the
          Organisation and work to the actualization of the common goal of the department and the Organisation.
        </p>

        {/* Paragraph 3 */}
        <p className="text-justify mb-8 leading-[1.85]">
          Kindly give {p.himHer} the necessary orientation that {p.heShe} needs to settle down and operate efficiently.
        </p>

        {/* Signoff */}
        <p className="font-bold mb-4">Thank You,</p>
        <p className="font-bold mb-14">Cindy Chinyere Uduma</p>

        {/* Copies */}
        <p className="text-[13px] text-black">Cc: GMRS, ADMIN/HRD OFFICER</p>
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
  const internName = getInternFullName(intern);
  const forMonth = clearanceMonth.toUpperCase() || "JANUARY 2026";
  const dutyMonth = servingMonth.toUpperCase() || "DECEMBER 2025";
  const stateCode = intern.stateCode || "LA/25A/14362";

  // Rule 1: The date at top is the intern's exit / end date (or custom date)
  const exitDate = intern.endDate ? new Date(intern.endDate) : new Date();
  const dateObj = fmtDateWithSup(exitDate);

  // Rule 3: Dynamic pronouns
  const p = getPronouns(intern.gender);

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-comic">
      <div className="text-[16px] text-black leading-[1.85]">
        {/* Date — Left aligned, bold with superscript */}
        <div className="mb-6 font-bold text-[16px]">
          {customDate ? (
            customDate
          ) : (
            <>
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </>
          )}
        </div>

        {/* Recipient Block — Left aligned, normal weight (not bold), uppercase */}
        <div className="mb-6 font-normal leading-snug uppercase">
          <p>THE STATE COORDINATOR,</p>
          <p>N.Y.S.C. SECRETARIAT,</p>
          <p>SURULERE, LAGOS.</p>
        </div>

        {/* Salutation — Normal weight */}
        <p className="mb-6 font-normal">Dear Sir/Madam</p>

        {/* Title — Left aligned, bold, NO underline */}
        <div className="mb-6 text-left">
          <h2 className="text-[17px] font-bold uppercase tracking-wide inline-block">
            CLEARANCE FOR THE MONTH OF {forMonth}
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-6 leading-[1.85]">
          This is to inform you that, <span className="font-bold">{internName}</span> with
          state code <span className="font-bold">{stateCode}</span> is a Corp Member with DAAR
          Communications PLC. {p.HeShe} has performed {p.hisHer} duty diligently in the
          month of <span className="font-bold">{dutyMonth}</span>.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.85]">
          Kindly pay {p.hisHer} allowance for the month of <span className="font-bold">{dutyMonth}</span>.
        </p>

        {/* Signoff — 50-55mm blank space for stamp and signature */}
        <p className="mb-28 font-normal">Yours faithfully,</p>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[16px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-normal text-[15px] uppercase">HEAD ADMIN. /HUMAN RESOURCES DEVELOPMENT</p>
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
  const internName = getInternFullName(intern);
  const callUpNumber = intern.callUpNumber || "NYSC/CUO/2025/182518";
  const stateCode = intern.stateCode || "LA/25B/0739";

  // Rule 1: The date at top is the intern's exit / end date (or custom date)
  const exitDate = intern.endDate ? new Date(intern.endDate) : new Date();
  const dateObj = fmtDateWithSup(exitDate);

  // Rule 3: Dynamic pronouns
  const p = getPronouns(intern.gender);

  return (
    <PhysicalLetterheadPage fontFamilyClass="font-serif">
      <div className="text-[16px] text-black font-serif leading-[1.85]">
        {/* Date — Left aligned, bold with superscript */}
        <div className="mb-6 font-bold text-[16px]">
          {customDate ? (
            customDate
          ) : (
            <>
              {dateObj.dayNum}<sup>{dateObj.daySuffix}</sup> {dateObj.rest}
            </>
          )}
        </div>

        {/* Recipient Block — Left aligned, normal weight (not bold), Title Case */}
        <div className="mb-6 font-normal leading-snug">
          <p>The State Coordinator,</p>
          <p>National Youth Service Corps,</p>
          <p>Babs Animashaun Street,</p>
          <p>Surulere, Lagos.</p>
        </div>

        {/* Salutation */}
        <p className="mb-6 font-normal">Dear Sir/Madam,</p>

        {/* Title — Left aligned, bold, NO underline */}
        <div className="mb-6 text-left">
          <h2 className="text-[17px] font-bold uppercase tracking-wide inline-block">
            FINAL CLEARANCE LETTER
          </h2>
        </div>

        {/* Paragraph 1 */}
        <p className="text-justify mb-6 leading-[1.85]">
          This is to certify that <span className="font-bold">{internName}</span>, a National Youth Corp
          Member serving at DAAR Communications PLC with call up number{" "}
          <span className="font-bold">{callUpNumber}</span>, and state code{" "}
          <span className="font-bold">{stateCode}</span> has satisfactorily done {p.hisHer} job for the
          duration of {p.hisHer} service year and {p.heShe} is not indebted to the organization.
        </p>

        {/* Paragraph 2 */}
        <p className="text-justify mb-8 leading-[1.85]">
          We therefore recommend {p.hisHer} discharge from the NYSC programme.
        </p>

        {/* Signoff — 50-55mm blank space for stamp and signature */}
        <div className="mb-28 space-y-1">
          <p className="font-bold">Yours Faithfully,</p>
          <p className="font-bold">For: DAAR COMMUNICATIONS PLC</p>
        </div>

        {/* Signatory details */}
        <div className="space-y-1">
          <p className="font-bold text-[16px]">CINDY CHINYERE UDUMA (08037184458)</p>
          <p className="font-bold text-[15px] uppercase">HEAD ADMIN./ HUMAN RESOURCES DEVELOPMENT, LAGOS</p>
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const printComponentRef = useRef<HTMLDivElement>(null);

  const { data: singleInternData } = useIntern(selectedInternId);
  const intern = singleInternData?.data?.intern ?? interns.find((i) => i._id === selectedInternId);

  // 1. Direct isolated iframe printing (react-to-print)
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: intern
      ? `${intern.lastName}_${intern.firstName}_${selectedTemplate}`
      : "Official_Document",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: black !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .letterhead-print-page {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          width: 210mm !important;
          max-width: 210mm !important;
          min-height: 297mm !important;
          height: 297mm !important;
          max-height: 297mm !important;
          padding-top: 92mm !important;
          padding-bottom: 30mm !important;
          padding-left: 20mm !important;
          padding-right: 20mm !important;
          margin: 0 auto !important;
          box-sizing: border-box !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  // 2. Direct client-side PDF download file generation (html2pdf.js)
  const handleDownloadPdf = async () => {
    if (!printComponentRef.current || !intern) return;
    try {
      setIsExportingPdf(true);
      toast.info("Generating PDF file...");
      const html2pdf = (await import("html2pdf.js")).default;
      const element = printComponentRef.current.querySelector(".letterhead-print-page") as HTMLElement || printComponentRef.current;
      
      const filename = `${intern.lastName}_${intern.firstName}_${selectedTemplate}.pdf`.replace(/\s+/g, "_");
      const opt = {
        margin: 0,
        filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          ignoreElements: (element: Element) =>
            element.classList?.contains("no-print") ||
            element.getAttribute("data-html2canvas-ignore") === "true",
        },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to generate PDF. You can also use the Print button to Save as PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── Layout only below this line: the templates, print and PDF handlers above are unchanged. ──
  const templateGroups: { label: string; category: "STUDENT" | "NYSC" }[] = [
    { label: "Students (IT / SIWES)", category: "STUDENT" },
    { label: "NYSC corps members", category: "NYSC" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Documents
          </Link>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-foreground">Generate a letter</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Exact replicas of DAAR Communications&apos; official templates, for printing straight onto letterhead stationery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadPdf} disabled={!intern || isExportingPdf} variant="outline">
            {isExportingPdf ? <Loader2 className="animate-spin" /> : <Download />}
            Download PDF
          </Button>
          <Button onClick={() => handlePrint()} disabled={!intern}>
            <Printer />
            Print on letterhead
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="no-print">
        <CardContent className="space-y-5 p-5">
          <fieldset className="space-y-3">
            <legend className="mb-3 text-[13px] font-medium text-foreground">Template</legend>
            <div className="grid gap-4 lg:grid-cols-2">
              {templateGroups.map((group) => (
                <div key={group.category} className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {(Object.keys(TEMPLATES) as LetterTemplateType[])
                      .filter((key) => TEMPLATES[key].category === group.category)
                      .map((key) => {
                        const on = selectedTemplate === key;
                        return (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                              on ? "border-primary bg-accent/50 ring-[3px] ring-ring/15" : "hover:border-input"
                            }`}
                          >
                            <input
                              type="radio"
                              name="letter-template"
                              value={key}
                              checked={on}
                              onChange={() => setSelectedTemplate(key)}
                              className="mt-0.5 accent-[hsl(var(--primary))]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{TEMPLATES[key].label}</span>
                              <span className="block text-xs text-muted-foreground">{TEMPLATES[key].description}</span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 border-t pt-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5 md:col-span-1 xl:col-span-2">
              <Label htmlFor="letter-intern" className="text-[13px]">Intern or corps member</Label>
              <Select value={selectedInternId} onValueChange={setSelectedInternId}>
                <SelectTrigger id="letter-intern">
                  <SelectValue placeholder={loadingInterns ? "Loading interns…" : "Choose who the letter is for"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {interns.map((i) => (
                    <SelectItem key={i._id} value={i._id}>
                      {i.firstName} {i.lastName} · {i.internshipType === "NYSC_IT" ? "NYSC" : "IT"} ({i.department?.name ?? "General"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="letter-date" className="text-[13px]">Letter date <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input
                id="letter-date"
                placeholder="Leave blank to use the exit date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          </div>

          {selectedTemplate === "NYSC_MONTHLY_CLEARANCE" && (
            <div className="grid max-w-xl gap-4 rounded-xl bg-muted/60 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="clearance-month" className="text-[13px]">Clearance for month</Label>
                <Input
                  id="clearance-month"
                  placeholder="e.g. JANUARY 2026"
                  value={clearanceMonth}
                  onChange={(e) => setClearanceMonth(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serving-month" className="text-[13px]">Diligently served month</Label>
                <Input
                  id="serving-month"
                  placeholder="e.g. DECEMBER 2025"
                  value={servingMonth}
                  onChange={(e) => setServingMonth(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Text alignment, weights, line breaks and margins match the company reference documents. The dashed guides on the preview mark the pre-printed letterhead and footer; they don&apos;t print.
          </p>
        </CardContent>
      </Card>

      {/* Preview */}
      {intern ? (
        <div className="-mx-4 overflow-x-auto bg-muted/70 px-4 py-8 lg:mx-0 lg:rounded-xl">
          <p className="no-print mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Preview · A4</span>
            <span>{TEMPLATES[selectedTemplate].label}</span>
          </p>
        <div ref={printComponentRef} className="pb-12 print:p-0 print:m-0 animate-fade-up">
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
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Choose who the letter is for</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Their details from Whippie fill the template automatically.
          </p>
        </div>
      )}
    </div>
  );
}

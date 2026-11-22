import { redirect } from "next/navigation";

// The onboarding page was a document checklist. Papers are handled offline now,
// so people still setting up are on the Interns list (status: Onboarding).
export default function OnboardingRedirect() {
  redirect("/interns?status=ONBOARDING");
}

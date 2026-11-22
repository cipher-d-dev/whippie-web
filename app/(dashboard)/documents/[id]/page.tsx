import { redirect } from "next/navigation";

// Physical papers are handled offline; Documents is the letter generator only.
export default function DocumentsRedirect() {
  redirect("/documents/generate");
}

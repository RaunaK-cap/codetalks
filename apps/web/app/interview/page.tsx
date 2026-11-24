import { redirect } from "next/navigation";

/* Old placeholder route. The app now lives at /dashboard. */
export default function InterviewRedirect() {
  redirect("/dashboard");
}

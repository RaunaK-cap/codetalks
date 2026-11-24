import type { Metadata } from "next";
import { PageHeader } from "@/components/app/card";
import { SettingsForm } from "@/components/app/settings-form";

export const metadata: Metadata = { title: "Settings · CodeTalk" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your account on this browser." />
      <SettingsForm />
    </>
  );
}

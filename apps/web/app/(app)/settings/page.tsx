import type { Metadata } from "next";
import { Card, CardHead, PageHeader } from "@/components/app/card";
import { SettingsForm } from "@/components/app/settings-form";

export const metadata: Metadata = { title: "Settings · CodeTalk" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Account, interview defaults, and your data." />
      <SettingsForm />
      <Card className="mt-3 border-destructive/20">
        <CardHead
          title="Delete everything"
          hint="Removes your sources, interviews, transcripts, and reports. This cannot be undone."
        />
        <div className="p-5">
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-full border border-destructive/30 px-3.5 font-mono text-[0.75rem] text-destructive transition-colors hover:bg-destructive/5"
          >
            Delete my data
          </button>
        </div>
      </Card>
    </>
  );
}

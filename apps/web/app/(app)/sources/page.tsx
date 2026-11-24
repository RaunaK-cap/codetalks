import type { Metadata } from "next";
import { ExternalLink, Trash2 } from "lucide-react";
import { Card, CardHead, PageHeader } from "@/components/app/card";
import { GithubConnect } from "@/components/app/github-connect";
import { Dropzone } from "@/components/app/dropzone";
import { SourceIcon } from "@/components/app/score";
import { Button } from "@/components/ui/button";
import { formatDate, sources } from "@/lib/mock";

export const metadata: Metadata = { title: "Sources · CodeTalk" };

function Status({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] px-2 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
      <span className={on ? "size-1.5 rounded-full bg-live" : "size-1.5 rounded-full border border-black/30"} />
      {label}
    </span>
  );
}

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        title="Sources"
        description="What your interviews are built from. We only read public data you give us."
      />

      <GithubConnect />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHead title="Resume" hint="PDF, up to 5 MB. Parsed in memory, the file is not stored." action={<Status on={sources.resume.uploaded} label="Added" />} />
          <div className="p-5">
            <div className="flex items-center gap-3 rounded-xl border border-black/[0.07] p-3">
              <span className="grid size-9 place-items-center rounded-lg bg-black/[0.04]">
                <SourceIcon kind="resume" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] font-medium">{sources.resume.file}</span>
                <span className="block font-mono text-[0.6875rem] text-muted-foreground">
                  {sources.resume.pages} pages · added {formatDate(sources.resume.uploadedAt)}
                </span>
              </span>
              <Button variant="ghost" size="icon" aria-label="Remove resume">
                <Trash2 />
              </Button>
            </div>
            <div className="mt-3">
              <Dropzone label="Replace resume" hint="Drop a PDF or click to choose" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="LinkedIn" hint="We never scrape LinkedIn. Upload its own PDF export." action={<Status on={false} label="Not added" />} />
          <div className="p-5">
            <Dropzone label="Add LinkedIn PDF" hint="Drop Profile.pdf or click to choose" />
            <ol className="mt-4 space-y-1.5 font-mono text-[0.6875rem] text-muted-foreground">
              <li>1. Open your LinkedIn profile</li>
              <li>2. Click More → Save to PDF</li>
              <li>3. Drop the file here</li>
            </ol>
            <a
              href="https://www.linkedin.com/in/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 font-mono text-[0.6875rem] text-foreground underline decoration-black/25 underline-offset-4"
            >
              Open LinkedIn <ExternalLink className="size-3" />
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}

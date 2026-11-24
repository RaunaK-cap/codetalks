"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { CandidateView, LinkedinProfile } from "@repo/contracts";
import { Card, CardHead, MonoLabel } from "@/components/app/card";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_FILES = 4;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

function ProfileSummary({ profile }: { profile: LinkedinProfile }) {
  const empty =
    !profile.name && !profile.headline && profile.experience.length === 0 && profile.education.length === 0;
  if (empty) {
    return (
      <p className="rounded-xl border border-dashed border-black/[0.12] p-4 font-mono text-[0.6875rem] text-muted-foreground">
        No profile details were found in those screenshots. Try clearer screenshots of your profile page.
      </p>
    );
  }
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-[0.9375rem] font-medium">{profile.name ?? "Name not found"}</p>
        {profile.headline && <p className="text-[0.8125rem] text-muted-foreground">{profile.headline}</p>}
        {profile.location && <MonoLabel className="mt-1">{profile.location}</MonoLabel>}
      </div>
      {profile.about && <p className="text-[0.8125rem] leading-relaxed text-foreground/80">{profile.about}</p>}
      {profile.experience.length > 0 && (
        <div>
          <MonoLabel>Experience</MonoLabel>
          <ul className="mt-2 divide-y divide-black/[0.05]">
            {profile.experience.map((x, i) => (
              <li key={i} className="py-2">
                <p className="text-[0.8125rem] font-medium">
                  {x.title} · {x.company}
                </p>
                {(x.start || x.end) && (
                  <MonoLabel>
                    {x.start ?? "?"} – {x.end ?? "?"}
                  </MonoLabel>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {profile.education.length > 0 && (
        <div>
          <MonoLabel>Education</MonoLabel>
          <ul className="mt-2 space-y-1">
            {profile.education.map((e, i) => (
              <li key={i} className="text-[0.8125rem]">
                {e.school}
                {e.degree && <span className="text-muted-foreground"> · {e.degree}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {profile.skills.length > 0 && (
        <div>
          <MonoLabel>Skills</MonoLabel>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <li key={s} className="rounded-full border border-black/[0.08] px-2.5 py-0.5 font-mono text-[0.6875rem]">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function LinkedinUpload({
  candidate,
  onChange,
}: {
  candidate: CandidateView | undefined;
  onChange: (c: CandidateView) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const picked = [...list];
    const bad = picked.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      setError(`${bad.name}: use PNG, JPEG, or WebP under 5 MB.`);
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...picked].slice(0, MAX_FILES));
  };

  const analyze = async () => {
    if (!candidate || !files.length) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api.uploadLinkedin(candidate.id, files);
      onChange(next);
      setFiles([]);
      setReplacing(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const saved = candidate?.linkedin;
  const showUploader = !saved || replacing;

  return (
    <Card className="mt-3">
      <CardHead
        title="LinkedIn"
        hint="Optional. Upload screenshots of your profile; we read them, we never scrape LinkedIn."
        action={
          saved && !replacing ? (
            <Button variant="outline" size="sm" onClick={() => setReplacing(true)}>
              Replace
            </Button>
          ) : undefined
        }
      />
      <div className="p-5">
        {!candidate ? (
          <p className="font-mono text-[0.6875rem] text-muted-foreground">Connect GitHub first.</p>
        ) : showUploader ? (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                add(e.dataTransfer.files);
              }}
              className="rounded-xl border border-dashed border-black/15 p-4"
            >
              {files.length === 0 ? (
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="flex w-full flex-col items-center gap-2 py-6 text-center"
                >
                  <span className="grid size-8 place-items-center rounded-full border border-black/10 bg-white">
                    <ImagePlus className="size-3.5" />
                  </span>
                  <span className="text-[0.8125rem] font-medium">Add up to 4 screenshots</span>
                  <span className="font-mono text-[0.6875rem] text-muted-foreground">
                    Top of profile, About, Experience, Education
                  </span>
                </button>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {previews.map((src, i) => (
                    <li key={src} className="relative overflow-hidden rounded-lg border border-black/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Screenshot ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove screenshot ${i + 1}`}
                        onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-white/90 shadow"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                  {files.length < MAX_FILES && (
                    <li>
                      <button
                        type="button"
                        onClick={() => input.current?.click()}
                        className="grid aspect-[4/3] w-full place-items-center rounded-lg border border-dashed border-black/15 text-muted-foreground hover:text-foreground"
                        aria-label="Add another screenshot"
                      >
                        <ImagePlus className="size-4" />
                      </button>
                    </li>
                  )}
                </ul>
              )}
              <input
                ref={input}
                type="file"
                accept={TYPES.join(",")}
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  add(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={analyze} disabled={busy || files.length === 0}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                {busy ? "Reading screenshots…" : "Analyze"}
              </Button>
              {replacing && (
                <Button variant="ghost" onClick={() => (setReplacing(false), setFiles([]))} disabled={busy}>
                  Cancel
                </Button>
              )}
            </div>
            <p className={cn("mt-2 font-mono text-[0.6875rem]", error ? "text-destructive" : "text-muted-foreground")}>
              {error ?? "Screenshots are read once and not stored. Only the extracted text is saved."}
            </p>
          </>
        ) : (
          <ProfileSummary profile={saved!} />
        )}
      </div>
    </Card>
  );
}

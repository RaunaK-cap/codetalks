"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/* PDF drop target. Demo only: it shows the picked file name and does not upload yet. */
export function Dropzone({ label, hint }: { label: string; hint: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) setFile(f.name);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
        over ? "border-foreground/40 bg-black/[0.03]" : "border-black/15 hover:border-black/25 hover:bg-black/[0.015]",
      )}
    >
      <span className="grid size-8 place-items-center rounded-full border border-black/10 bg-white">
        <Upload className="size-3.5" />
      </span>
      <span className="text-[0.8125rem] font-medium">{file ?? label}</span>
      <span className="font-mono text-[0.6875rem] text-muted-foreground">{file ? "Ready to parse" : hint}</span>
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
      />
    </button>
  );
}

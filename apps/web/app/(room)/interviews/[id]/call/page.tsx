import type { Metadata } from "next";
import { CallRoom } from "@/components/app/call-room";
import { getInterview } from "@/lib/mock";

export const metadata: Metadata = { title: "Live interview · CodeTalk" };

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interview = getInterview(id);
  return <CallRoom id={interview.id} title={interview.title} role={interview.role} />;
}

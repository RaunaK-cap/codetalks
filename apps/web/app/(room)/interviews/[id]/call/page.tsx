import type { Metadata } from "next";
import { CallRoom } from "@/components/app/call-room";

export const metadata: Metadata = { title: "Live interview · CodeTalk" };

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CallRoom id={id} />;
}

import type { Metadata } from "next";
import { ReportView } from "@/components/app/report-view";

export const metadata: Metadata = { title: "Report · CodeTalk" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportView id={id} />;
}

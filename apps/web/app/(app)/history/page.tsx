import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/card";
import { HistoryList } from "@/components/app/history-list";
import { buttonVariants } from "@/components/ui/button";
import { interviews } from "@/lib/mock";

export const metadata: Metadata = { title: "History · CodeTalk" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        title="History"
        description={`${interviews.length} interviews · every report is saved`}
        actions={
          <Link href="/interviews/new" className={buttonVariants({ shape: "soft" })}>
            <Plus /> New interview
          </Link>
        }
      />
      <HistoryList />
    </>
  );
}

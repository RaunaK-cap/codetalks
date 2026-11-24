import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/card";
import { HistoryList } from "@/components/app/history-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "History · CodeTalk" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        title="History"
        description="Every interview and its report"
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

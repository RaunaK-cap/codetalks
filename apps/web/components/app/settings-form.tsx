"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardHead } from "@/components/app/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROLES, user } from "@/lib/mock";

const ROLE_ITEMS = ROLES.map((r) => ({ value: r, label: r }));

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-[0.8125rem] font-medium">{title}</p>
        <p className="mt-0.5 font-mono text-[0.6875rem] text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsForm() {
  const [saved, setSaved] = useState(false);
  const [role, setRole] = useState<string | null>("Backend");

  return (
    <>
      <Card className="mt-8">
        <CardHead title="Profile" />
        <form
          className="grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="s-name">Name</Label>
            <Input id="s-name" defaultValue={user.name} autoComplete="name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" type="email" placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">
              {saved ? (
                <>
                  <Check /> Saved
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-3">
        <CardHead title="Interview defaults" />
        <div className="divide-y divide-black/[0.05] px-5 pb-1">
          <Row title="Default role" hint="Used when you start from the dashboard">
            <Select items={ROLE_ITEMS} value={role} onValueChange={(v) => setRole(v as string)}>
              <SelectTrigger aria-label="Default role" className="h-8 w-36 rounded-full border-black/10 bg-white px-3.5 font-mono text-[0.75rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_ITEMS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="font-mono text-[0.75rem]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row title="Keep call recordings" hint="Audio is stored with the transcript. Off keeps text only.">
            <Switch defaultChecked aria-label="Keep call recordings" />
          </Row>
          <Row title="Email me the report" hint="Send a link when scoring finishes">
            <Switch aria-label="Email me the report" />
          </Row>
          <Row title="Interviewer pushes back" hint="Follow up when an answer is vague">
            <Switch defaultChecked aria-label="Interviewer pushes back" />
          </Row>
        </div>
      </Card>
    </>
  );
}

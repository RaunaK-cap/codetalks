import type { Metadata } from "next";
import { AuthForm, type AuthMode } from "@/components/auth/auth-form";
import { Halftone } from "@/components/halftone";
import { ModeToggle } from "@/components/mode-toggle";

export const metadata: Metadata = {
  title: "Sign in · CodeTalk",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const { mode, next } = await searchParams;
  const initial: AuthMode = mode === "signup" ? "signup" : "signin";

  return (
    <div className="relative flex min-h-dvh bg-background">
      <ModeToggle className="absolute top-4 right-4 z-10 bg-background/70 backdrop-blur" />
      <div className="flex w-full flex-1">
        <div className="grid w-full flex-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* On phones the halftone becomes a short banner above the form. */}
          <div className="relative order-first h-28 md:order-last md:h-auto">
            <Halftone
              variant="cloud"
              cell={8}
              className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
            />
          </div>
          <div className="flex items-center justify-center px-6 pt-2 pb-10 sm:px-12 md:py-12">
            <AuthForm initial={initial} next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}

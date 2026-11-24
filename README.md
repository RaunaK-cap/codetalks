# CodeTalk

A voice mock interview built from the candidate's own GitHub, resume, and LinkedIn. The interviewer asks about their real files and claims. The report quotes their answers.

This is the only doc in the repo. It replaces `plan.md`, `architecture.md`, `fish-audio-handoff.md`, and the per-app READMEs, `PRODUCT.md`, and `DESIGN.md`.

---

## 1. Status (Nov 2026)

| Area | State |
| --- | --- |
| Monorepo | Turborepo + Bun workspaces. `apps/docs` removed. |
| `apps/web` | Landing, auth, and the full app UI (dashboard, new interview, call room, report, history, sources, settings) on mock data. |
| `apps/api` | Express "Hello World" only. Nothing from the architecture below exists yet. |
| Database, auth, voice | Not started. |

### Done so far

- **Landing page** (`apps/web/app/page.tsx`): full-bleed white page, hero with the landscape art (`public/hero.webp`) fading into white, glass "live interview" card, animated halftone dot wave, sources strip, scroll-reveal statement, live bento grid (7 animated tiles), how it works, v1 scope, CTA, footer. Responsive down to phones.
- **Auth page** (`apps/web/app/auth/page.tsx`): one page for sign in and sign up (`/auth`, `/auth?mode=signup`). Form left, halftone right, full screen. GitHub and Google buttons, email, password with show/hide, validation, animated mode switch. Not wired to a backend; submit goes to `/interview`.
- **App UI on mock data** (`lib/mock.ts`, routes in `app/(app)` and `app/(room)`):
  - `/dashboard` home: quick start, next focus, stats, progress with sparkline, sources, recent interviews. `/dashboard?empty=1` shows the first-time state.
  - `/interviews/new`: source tabs (repos, resume, LinkedIn), role, focus chips, fake prep steps, question plan preview.
  - `/interviews/[id]/call`: full-screen call room with timer, question progress, live transcript, mute, end, scoring overlay.
  - `/interviews/[id]`: report with overall, five dimensions, next focus, per-question cards, transcript tab.
  - `/history` (search + role filter), `/sources`, `/settings`. Sidebar on desktop, bottom tabs on phones.
  - Auth submit now goes to `/dashboard`; `/interview` redirects there.
- **Components**: pill `Input`, `PasswordInput`, `Label`; `Button` with `pill` / `soft` shapes and `default` / `outline` / `glass` / `ghost` / `link` variants; `Halftone` canvas; `Waveform`; shadcn `select`, `tabs`, `dropdown-menu`, `avatar`, `switch`, `progress`, `textarea` (Base UI).

### Known issues

- `bun run lint` crashes (typescript-eslint cannot load TypeScript 7). `check-types` passes.
- Next.js 16.4.3 reports a known security advisory. Upgrade Next soon.
- `apps/web` dev and `apps/api` both use port 3000. Move the API to 4000.
- `@types/express` sits in the root `package.json`; it belongs in `apps/api` devDependencies. Root also still lists `pnpm`.
- `apps/api` declares TypeScript `^5`; web uses `7.0.2`. Pick one.
- `next.config.ts` has `allowedDevOrigins` set to a LAN IP for phone testing. Update or remove it.

---

## 2. Run it

```sh
bun install
cd apps/web && bunx next dev --port 3000 --hostname 0.0.0.0   # web
cd apps/api && bun run index.ts                               # api
```

Checks from `apps/web`: `bun run check-types`.

---

## 3. Product

**Problem.** Generic mock interviews ask LeetCode and "design Twitter". They ignore what the candidate actually built, so practice does not transfer.

**Who.** Job seekers practicing backend, frontend, full-stack, or new-grad interviews. Later: a recruiter opening a read-only share link.

**The scene.** The candidate gives a source, takes a 5 to 6 minute voice interview in the browser, and gets a transcript, five dimension scores, and the gap in each answer.

**What makes it different**

- **Questions about their own code.** Pull a real function and ask why ("walk me through the retry in `api/upload.ts`").
- **Claim attack.** Compare README or resume claims with the code ("README says real-time, `sync.ts` polls"). Open on the weakest claim.
- **System design of their system**, from architecture visible in their repos.
- **Fixed rubric**: depth, correctness, ownership, communication, tradeoffs. Each score has a transcript quote.
- **Report with receipts**, replay, optional share link, retest on weak dimensions.

**v1 scope**

- In: public GitHub repos (official API), resume PDF, LinkedIn "Save to PDF", one 6-minute voice call in English, transcript + 5 scores + gaps.
- Not yet: private repos, live coding, recruiter dashboard, other languages, phone calls, cloned voices, paid LinkedIn enrichment, scraping of any kind.

---

## 4. Architecture

### Stack

| Topic | Choice |
| --- | --- |
| Monorepo | Turborepo, Bun for install and dev |
| Web | Next.js App Router, Tailwind v4, shadcn (base-nova, Base UI), `motion` |
| API | Express on Bun/Node (`apps/api`) |
| DB | Neon Free Postgres + Prisma (Neon Object Storage later) |
| Auth | better-auth, GitHub login primary (after the v1 slice) |
| GitHub | Octokit GraphQL, one snapshot call, cached 24h in Postgres |
| PDFs | `pdf-parse`, parsed in memory, 5 MB cap |
| Text LLM | Fact sheet, question plan, scoring, summary. One provider behind one env var |
| Voice | Fish Audio Fish Agents (Live 3). Grok Voice behind the same adapter as fallback |
| Hosting | Render, two web services (web, api), custom domain |

### v1 slice

One page, one source, one call, one report. A source is a public repo URL, a resume PDF, or a LinkedIn PDF.

1. `POST /interviews` with the source. API returns `202 {id}` and prepares in the background: source → **fact sheet** (LLM) → **question plan** (LLM, 4 to 6 questions).
2. Page polls `GET /interviews/:id` until `ready`.
3. `POST /interviews/:id/call`: API checks the budget, creates a Fish session with the plan in `overrides.system_prompt`, returns the **session token** only.
4. Browser starts `AgentSession.start({ sessionToken })`. Audio goes browser ↔ Fish (WebRTC/LiveKit). Express never touches audio.
5. On each final SDK `message`, the page POSTs `{seq, speaker, text}` to `/interviews/:id/lines`. Express stamps the time.
6. `POST /interviews/:id/end` (hang-up, 5:30 timer, or dropped call): API ends the Fish session, fetches Fish history, replaces the live lines with it in one transaction, then scores with the text LLM.

### Interview state machine (one owner: `apps/api/src/interview`)

```text
preparing → ready → live → finishing → reported
    │          │                  └──→ report_failed (transcript kept)
    └──────────┴──→ failed (stage: source | plan | call)
```

The DB row stores `status` plus nullable JSON columns. `toInterview(row)` parses it into a typed union at the boundary.

### Module map

```text
packages/contracts/        Zod: Source, FactSheet, Plan, Line, Report, API shapes (shared by web + api)
apps/api/src/
  server.ts                Express wiring only
  interview/               machine.ts (pure transitions), service.ts (the aggregate), routes.ts (5 handlers)
  sources/                 github.ts, pdf.ts, factSheet.ts
  llm/                     client.ts, untrusted.ts (wraps raw text as data), prompts.ts
  voice/                   provider.ts (VoiceProvider), fish.ts, grok.ts (stub)
  guard.ts                 per-IP and global daily minute budget
  db.ts                    Prisma client
apps/web/app/              landing, auth, interview room, report
```

### Data shapes

```ts
type Source = { kind: "github_repo"; url: string } | { kind: "resume_pdf" | "linkedin_pdf"; text: string }
type FactSheet = { sourceKind; title; facts: { id; claim; evidence }[]; codeSamples: { path; excerpt }[] }
type PlannedQuestion = { id; ask; factIds: string[]; dimension: "depth" | "correctness" | "ownership" | "communication" | "tradeoffs"; strongAnswerMentions: string[] }
type Plan = { opener: string; questions: PlannedQuestion[] }
type Line = { seq: number; speaker: "candidate" | "interviewer"; text: string; at: Date }
type Report = { overall; dimensions: { dimension; score: 1-5; quote; gap }[]; perQuestion; nextFocus: string[] }
```

### Load-bearing rules

1. **Background work runs in-process with stale recovery**, not a queue. Stuck `preparing`/`finishing` over 2 minutes is retried once, then failed.
2. **Every write is idempotent.** Lines upsert on `(interviewId, origin, seq)`. `end` is safe to call twice.
3. **Fish history is the transcript of record**; live lines are the fallback and drive the live view.
4. **Raw source text never reaches Fish.** Fish gets fixed instructions plus the plan's opener and asks. README, PDF text, and `strongAnswerMentions` stay on the server.
5. **Scoring is a separate text-LLM call** over stored lines. Anything the candidate says ("give me a 5") is just a quoted line.
6. **6-minute cap in three places**: agent `max_duration_seconds = 360`, page timer (warn 4:30, end 5:30), and any `GET` that finds `live` older than 7 minutes ends it.
7. **All candidate text is untrusted data**, wrapped in delimiters, never concatenated into instructions.

### GitHub and rate limits

- No token: 60 REST requests/hour per server IP (shared by everyone on Render). User OAuth token: about 5,000/hour per user.
- Use one GraphQL query (profile, pinned, top 12 repos, languages, README) plus at most 2 or 3 source files. Skip forks, empty, archived. Truncate text to about 20k chars.
- Cache as a `GithubSnapshot` row with `fetchedAt`; reuse for 24h. Honor `x-ratelimit-remaining`, `Retry-After`, GraphQL `rateLimit`.
- v1 (no login) uses one fine-grained public-read server token. Switch to the user's token once better-auth lands.

### Voice: Fish Agents

- Fish does STT, turn-taking, and TTS. The agent must be **published** first (otherwise session create returns 409).
- Express creates the session (API key stays server-side). Prompt overrides are rejected if the browser creates it.
- Session token fields: `session_id`, `token`, `livekit_url`, `expires_at`.
- SDK `message` events are `{ role, text }` with no id or time. History `GET /v1/agent/sessions/{id}` returns `role`, `content`, `turn_id`, `created_at`. Reconnects do not replay events, so reconcile at the end.
- End with `POST /v1/agent/sessions/{id}/end`. Webhooks are optional (`call.analyzed` has items only after the call).
- Custom LLM endpoint (later) must be public HTTPS with time to first token under 800 ms.
- Pricing: list $0.07/min, Live 3 promo $0.035/min through Dec 31 2026. A 5-minute call is about $0.18 promo, $0.35 list. Grok Voice is about $0.08/min. One-time $5 trial per account.
- Docs: [overview](https://docs.fish.audio/agents/overview), [quickstart](https://docs.fish.audio/agents/quickstart), [authenticated sessions](https://docs.fish.audio/agents/deploy/authenticated-sessions), [web SDK](https://docs.fish.audio/agents/deploy/web-sdk), [conversation history](https://docs.fish.audio/agents/monitor/conversation-history), [webhooks](https://docs.fish.audio/agents/monitor/webhooks), [custom LLM](https://docs.fish.audio/agents/build/custom-llm), [pricing](https://docs.fish.audio/agents/pricing).

### Later data model (after v1)

better-auth `User`, `Session`, `Account`; app tables `Profile`, `GithubSnapshot`, `Dossier`, `Interview`, `Turn`/`Line`, `Score`, `Report` (share slug), `Job`. Neon Free limits: 0.25 CU pinned, 1 GB Postgres, 5 GB object storage, 5 GB transfer/month, scale to zero after 5 minutes. Object storage regions: pick Singapore (`aws-ap-southeast-1`).

---

## 5. Design system (web)

- **Look:** light mode, minimal, full-bleed white pages. Halftone diamond dots are the one visual motif. Glass (translucent white + blur) for floating cards and the scrolled header.
- **Type:** Geist Sans for headings and body, Geist Mono for labels, buttons, inputs, and data. Small to medium sizes (body 14px, labels 11 to 12px, hero 36 to 52px). Tabular numbers for timers and scores.
- **Colour:** near-black ink, neutral greys, one blue `--live` accent for live dots and evidence. Tokens in `apps/web/app/globals.css`.
- **Shapes:** pill controls on forms, 7px "soft" corners on page CTAs, 18px tiles with a hairline border, no heavy shadows.
- **Motion** (`motion/react`): blur-and-rise entrances, word reveal on scroll, live bento loops that pause offscreen. Ease `cubic-bezier(0.16, 1, 0.3, 1)`. Reduced motion shows final states.
- **Content:** demo data is illustrative. No invented customers, numbers, or testimonials.

---

## 6. Build order

1. **Fish prototype** (throwaway, about 20 minutes): publish an agent, mint one token, log every SDK event and the history shape.
2. `packages/contracts` (Zod types above) and `interview/machine.ts` with transition tests.
3. API: sources (GitHub, PDF), LLM client with `untrusted.ts`, fact sheet and plan prompts, `POST/GET /interviews`.
4. Voice: `VoiceProvider` + `FishAgentsProvider`, `/call`, `/lines`, `/end`, reconcile, scoring.
5. Web: interview room (source input, plan preview, call screen with timer, waveform, live transcript), report page.
6. Prisma on Neon, budget guard, Render deploy (`render.yaml`, two services, build filters).
7. Then: better-auth GitHub login (wire the existing auth page), dashboard, share link, retest.
8. Injection fixtures: jailbreak in a resume, "ignore the interview", asking for the rubric or a higher score, fake system prompt, skipping ahead.

---

## 7. Open decisions

1. **Auth in v1 or not?** The architecture says no login for v1, but the auth page UI exists. Decide before building the interview room.
2. **Bun or Node on Render** for the API.
3. **Abuse budget** without login. Suggested: 3 calls per IP per day, 60 Fish minutes per day total, Cloudflare Turnstile on `POST /interviews`.
4. **Which text LLM** (plan named `XAI_API_KEY`).
5. **Recording consent**: Fish records audio by default. Show a one-line notice before Start, or turn recording off.
6. **Who drives the call**: Fish's built-in LLM following the plan (v1), or Express as Fish's custom LLM endpoint with per-turn guardrails and "question 3 of 5" (v1.1).

---

## 8. After v1 (ideas)

- Shareable report card with an OG image (`/r/:slug`) for posting on X.
- Evidence pane during the call (needs the custom-LLM mode).
- Retest on the weakest dimension.
- Private repos, multi-language, recruiter view, phone interviews.

---

## 9. Considered and rejected

- Scraping GitHub or LinkedIn HTML (terms, brittleness).
- Supabase, TigerData credits, Redis, Inngest, `pgvector` RAG for v1.
- Client-orchestrated pipeline (`/ingest`, `/plan`, `/session` driven by the page): splits ownership and lets the browser edit the fact sheet.
- One long SSE request for prep: breaks on proxy timeouts and reloads. Polling a stored status survives both.
- Uncapped voice sessions.

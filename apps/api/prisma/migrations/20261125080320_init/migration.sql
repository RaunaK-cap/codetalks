-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "github" JSONB NOT NULL,
    "linkedin" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "repos" TEXT[],
    "status" TEXT NOT NULL,
    "step" TEXT,
    "factSheet" JSONB,
    "plan" JSONB,
    "providerSessionId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "report" JSONB,
    "failure" JSONB,
    "clientIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Line" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_githubLogin_key" ON "Candidate"("githubLogin");

-- CreateIndex
CREATE INDEX "Interview_candidateId_createdAt_idx" ON "Interview"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "Interview_status_updatedAt_idx" ON "Interview"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Line_interviewId_origin_seq_key" ON "Line"("interviewId", "origin", "seq");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

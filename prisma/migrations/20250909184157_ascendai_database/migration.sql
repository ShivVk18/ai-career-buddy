-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bio" TEXT,
    "experience" INTEGER,
    "skills" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizScore" DOUBLE PRECISION NOT NULL,
    "questions" JSONB[],
    "category" TEXT NOT NULL,
    "improvementTip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "templateId" TEXT,
    "customCSS" TEXT,
    "colorScheme" TEXT,
    "fontFamily" TEXT,
    "atsScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResumeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "cssStyles" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "colorSchemes" JSONB[],
    "fontOptions" TEXT[],
    "layoutVariations" JSONB[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResumeVersion" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobDescription" TEXT,
    "tailoredContent" TEXT NOT NULL,
    "atsScore" DOUBLE PRECISION,
    "matchPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoverLetter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobDescription" TEXT,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CareerPath" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "steps" JSONB[],
    "milestones" JSONB[],
    "resources" JSONB[],
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "timeline" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkillGapAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "companyName" TEXT,
    "userSkills" TEXT[],
    "requiredSkills" TEXT[],
    "matchedSkills" TEXT[],
    "missingSkills" TEXT[],
    "matchPercentage" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "learningPaths" JSONB[],
    "prioritySkills" TEXT[],
    "timeToAcquire" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillGapAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MockInterview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questions" JSONB[],
    "responses" JSONB[],
    "overallScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "technicalScore" DOUBLE PRECISION,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "aiTips" TEXT[],
    "duration" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "duration" INTEGER NOT NULL,
    "performanceScore" DOUBLE PRECISION NOT NULL,
    "feedback" JSONB NOT NULL,
    "recording" TEXT,
    "transcript" TEXT,
    "emotionAnalysis" JSONB,
    "speechAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NetworkConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT,
    "linkedin" TEXT,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "strength" INTEGER NOT NULL,
    "lastContact" TIMESTAMP(3),
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "tags" TEXT[],
    "purpose" TEXT,
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CareerGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "targetDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "milestones" JSONB[],
    "actions" JSONB[],
    "targetValue" TEXT,
    "currentValue" TEXT,
    "notes" TEXT,
    "lessons" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IndustryInsight" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "salaryRanges" JSONB[],
    "growthRate" DOUBLE PRECISION NOT NULL,
    "demandLevel" TEXT NOT NULL,
    "topSkills" TEXT[],
    "marketOutlook" TEXT NOT NULL,
    "keyTrends" TEXT[],
    "recommendedSkills" TEXT[],
    "jobAvailability" JSONB[],
    "hiringTrends" JSONB[],
    "remoteWorkPercentage" DOUBLE PRECISION,
    "hybridWorkTrends" JSONB[],
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextUpdate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "public"."User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Assessment_userId_idx" ON "public"."Assessment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_userId_key" ON "public"."Resume"("userId");

-- CreateIndex
CREATE INDEX "ResumeTemplate_category_style_idx" ON "public"."ResumeTemplate"("category", "style");

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_idx" ON "public"."ResumeVersion"("resumeId");

-- CreateIndex
CREATE INDEX "CoverLetter_userId_idx" ON "public"."CoverLetter"("userId");

-- CreateIndex
CREATE INDEX "CareerPath_userId_status_idx" ON "public"."CareerPath"("userId", "status");

-- CreateIndex
CREATE INDEX "SkillGapAnalysis_userId_idx" ON "public"."SkillGapAnalysis"("userId");

-- CreateIndex
CREATE INDEX "MockInterview_userId_status_idx" ON "public"."MockInterview"("userId", "status");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_type_idx" ON "public"."PracticeSession"("userId", "type");

-- CreateIndex
CREATE INDEX "NetworkConnection_userId_idx" ON "public"."NetworkConnection"("userId");

-- CreateIndex
CREATE INDEX "CareerGoal_userId_status_idx" ON "public"."CareerGoal"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryInsight_industry_key" ON "public"."IndustryInsight"("industry");

-- CreateIndex
CREATE INDEX "IndustryInsight_industry_idx" ON "public"."IndustryInsight"("industry");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_industry_fkey" FOREIGN KEY ("industry") REFERENCES "public"."IndustryInsight"("industry") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resume" ADD CONSTRAINT "Resume_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ResumeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoverLetter" ADD CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CareerPath" ADD CONSTRAINT "CareerPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkillGapAnalysis" ADD CONSTRAINT "SkillGapAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MockInterview" ADD CONSTRAINT "MockInterview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NetworkConnection" ADD CONSTRAINT "NetworkConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CareerGoal" ADD CONSTRAINT "CareerGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

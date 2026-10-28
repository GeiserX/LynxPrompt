-- CreateEnum
CREATE TYPE "TemplateTier" AS ENUM ('SHORT', 'INTERMEDIATE', 'LONG', 'SUPERLONG');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('LICENSE', 'FUNDING', 'CURSORRULES', 'CURSOR_RULES', 'CURSOR_MDC', 'CLAUDE_MD', 'COPILOT_INSTRUCTIONS', 'WINDSURF_RULES', 'GEMINI_MD', 'AGENTS_MD', 'CLINE_RULES', 'CODEX_MD', 'ZED_INSTRUCTIONS', 'VOID_CONFIG', 'TRAE_RULES', 'IDX_CONFIG', 'ROO_RULES', 'CONTINUE_CONFIG', 'CODY_CONFIG', 'TABNINE_CONFIG', 'AMAZONQ_RULES', 'AUGMENT_RULES', 'KILOCODE_RULES', 'JUNIE_GUIDELINES', 'KIRO_STEERING', 'AIDER_MD', 'GOOSEHINTS', 'WARP_MD', 'OPENCODE_JSON', 'OPENHANDS_MD', 'CURSOR_COMMAND', 'CLAUDE_COMMAND', 'WINDSURF_WORKFLOW', 'COPILOT_PROMPT', 'CONTINUE_PROMPT', 'OPENCODE_COMMAND', 'GITIGNORE', 'README', 'CONTRIBUTING', 'CODE_OF_CONDUCT', 'SECURITY', 'DOCKERFILE', 'DOCKER_COMPOSE', 'GITHUB_ACTIONS', 'GITLAB_CI', 'EDITORCONFIG', 'PRETTIER', 'ESLINT', 'PRE_COMMIT', 'CUSTOM');

-- CreateTable
CREATE TABLE "SystemTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TemplateType" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "tier" "TemplateTier" NOT NULL DEFAULT 'INTERMEDIATE',
    "targetPlatform" TEXT,
    "compatibleWith" TEXT[],
    "tags" TEXT[],
    "category" TEXT,
    "difficulty" TEXT,
    "sensitiveFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WizardStep" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WizardStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "configFile" TEXT NOT NULL,
    "configPath" TEXT NOT NULL DEFAULT '',
    "website" TEXT,
    "docsUrl" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "templateStructure" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "suggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Framework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "suggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedInstance" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "publicBlueprintCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemTemplate_type_idx" ON "SystemTemplate"("type");

-- CreateIndex
CREATE INDEX "SystemTemplate_tier_idx" ON "SystemTemplate"("tier");

-- CreateIndex
CREATE INDEX "SystemTemplate_targetPlatform_idx" ON "SystemTemplate"("targetPlatform");

-- CreateIndex
CREATE INDEX "SystemTemplate_category_idx" ON "SystemTemplate"("category");

-- CreateIndex
CREATE INDEX "SystemTemplate_downloads_idx" ON "SystemTemplate"("downloads");

-- CreateIndex
CREATE INDEX "SystemTemplate_favorites_idx" ON "SystemTemplate"("favorites");

-- CreateIndex
CREATE UNIQUE INDEX "WizardStep_order_key" ON "WizardStep"("order");

-- CreateIndex
CREATE INDEX "WizardStep_isActive_idx" ON "WizardStep"("isActive");

-- CreateIndex
CREATE INDEX "DecisionRule_category_idx" ON "DecisionRule"("category");

-- CreateIndex
CREATE INDEX "DecisionRule_isActive_idx" ON "DecisionRule"("isActive");

-- CreateIndex
CREATE INDEX "DecisionRule_priority_idx" ON "DecisionRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "AIPlatform_name_key" ON "AIPlatform"("name");

-- CreateIndex
CREATE INDEX "AIPlatform_isActive_idx" ON "AIPlatform"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE INDEX "Language_isPopular_idx" ON "Language"("isPopular");

-- CreateIndex
CREATE INDEX "Framework_languageId_idx" ON "Framework"("languageId");

-- CreateIndex
CREATE INDEX "Framework_isPopular_idx" ON "Framework"("isPopular");

-- CreateIndex
CREATE UNIQUE INDEX "Framework_name_languageId_key" ON "Framework"("name", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "FederatedInstance_domain_key" ON "FederatedInstance"("domain");

-- CreateIndex
CREATE INDEX "FederatedInstance_verified_idx" ON "FederatedInstance"("verified");

-- CreateIndex
CREATE INDEX "FederatedInstance_lastSeenAt_idx" ON "FederatedInstance"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "Framework" ADD CONSTRAINT "Framework_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

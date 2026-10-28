-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'TEAMS');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SSOProvider" AS ENUM ('SAML', 'OIDC', 'LDAP');

-- CreateEnum
CREATE TYPE "BlueprintVisibility" AS ENUM ('PRIVATE', 'TEAM', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ApiTokenRole" AS ENUM ('BLUEPRINTS_FULL', 'BLUEPRINTS_READONLY', 'PROFILE_FULL', 'FULL');

-- CreateEnum
CREATE TYPE "CliSessionStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TemplateTier" AS ENUM ('SHORT', 'INTERMEDIATE', 'LONG', 'SUPERLONG');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('LICENSE', 'FUNDING', 'CURSORRULES', 'CURSOR_RULES', 'CURSOR_MDC', 'CLAUDE_MD', 'COPILOT_INSTRUCTIONS', 'WINDSURF_RULES', 'GEMINI_MD', 'AGENTS_MD', 'CLINE_RULES', 'CODEX_MD', 'ZED_INSTRUCTIONS', 'VOID_CONFIG', 'TRAE_RULES', 'IDX_CONFIG', 'ROO_RULES', 'CONTINUE_CONFIG', 'CODY_CONFIG', 'TABNINE_CONFIG', 'AMAZONQ_RULES', 'AUGMENT_RULES', 'KILOCODE_RULES', 'JUNIE_GUIDELINES', 'KIRO_STEERING', 'AIDER_MD', 'GOOSEHINTS', 'WARP_MD', 'OPENCODE_JSON', 'OPENHANDS_MD', 'CURSOR_COMMAND', 'CLAUDE_COMMAND', 'WINDSURF_WORKFLOW', 'COPILOT_PROMPT', 'CONTINUE_PROMPT', 'OPENCODE_COMMAND', 'GITIGNORE', 'README', 'CONTRIBUTING', 'CODE_OF_CONDUCT', 'SECURITY', 'DOCKERFILE', 'DOCKER_COMPOSE', 'GITHUB_ACTIONS', 'GITLAB_CI', 'EDITORCONFIG', 'PRETTIER', 'ESLINT', 'PRE_COMMIT', 'CUSTOM');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "providerEmail" TEXT,
    "providerUsername" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "passkeyVerified" BOOLEAN NOT NULL DEFAULT false,
    "passkeyVerifiedAt" TIMESTAMP(3),
    "deviceHash" TEXT,
    "deviceName" TEXT,
    "ipHash" TEXT,
    "isNewDevice" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    "persona" TEXT,
    "skillLevel" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "showJobTitle" BOOLEAN NOT NULL DEFAULT false,
    "showSkillLevel" BOOLEAN NOT NULL DEFAULT false,
    "socialGithub" TEXT,
    "socialTwitter" TEXT,
    "socialLinkedin" TEXT,
    "socialWebsite" TEXT,
    "socialYoutube" TEXT,
    "socialBluesky" TEXT,
    "socialMastodon" TEXT,
    "socialDiscord" TEXT,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "aiTokensUsedThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "aiUsageResetAt" TIMESTAMP(3),
    "aiLastRequestAt" TIMESTAMP(3),
    "aiRequestsThisMinute" INTEGER NOT NULL DEFAULT 0,
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "privacyAcceptedAt" TIMESTAMP(3),
    "privacyVersion" TEXT,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "maxSeats" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "isActiveThisCycle" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSSOConfig" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "provider" "SSOProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "allowedDomains" TEXT[],
    "verifiedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainVerificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "TeamSSOConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "credentialPublicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT[],
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "KnownDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "ipHash" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnownDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WizardDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WizardDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hierarchy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repositoryRoot" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TemplateType" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "visibility" "BlueprintVisibility" NOT NULL DEFAULT 'PRIVATE',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "publishedVersion" INTEGER,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "tier" "TemplateTier" NOT NULL DEFAULT 'INTERMEDIATE',
    "targetPlatform" TEXT,
    "compatibleWith" TEXT[],
    "tags" TEXT[],
    "category" TEXT,
    "difficulty" TEXT,
    "sensitiveFields" JSONB,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "showcaseUrl" TEXT,
    "hierarchyId" TEXT,
    "repositoryPath" TEXT,
    "parentId" TEXT,
    "contentChecksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "changelog" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "UserTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastFourChars" TEXT NOT NULL,
    "role" "ApiTokenRole" NOT NULL DEFAULT 'BLUEPRINTS_FULL',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CliSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "CliSessionStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "apiTokenId" TEXT,
    "token" TEXT,
    "codeChallenge" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CliSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "persona" TEXT,
    "languages" TEXT[],
    "frameworks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateDownload" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "templateId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "platform" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_deviceHash_idx" ON "Session"("deviceHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_slug_idx" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_lastActiveAt_idx" ON "TeamMember"("lastActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_teamId_idx" ON "TeamInvitation"("teamId");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");

-- CreateIndex
CREATE INDEX "TeamInvitation_token_idx" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_status_idx" ON "TeamInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSSOConfig_teamId_key" ON "TeamSSOConfig"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE INDEX "Authenticator_userId_idx" ON "Authenticator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "KnownDevice_userId_idx" ON "KnownDevice"("userId");

-- CreateIndex
CREATE INDEX "KnownDevice_deviceHash_idx" ON "KnownDevice"("deviceHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnownDevice_userId_deviceHash_key" ON "KnownDevice"("userId", "deviceHash");

-- CreateIndex
CREATE INDEX "WizardDraft_userId_idx" ON "WizardDraft"("userId");

-- CreateIndex
CREATE INDEX "WizardDraft_updatedAt_idx" ON "WizardDraft"("updatedAt");

-- CreateIndex
CREATE INDEX "Preference_userId_idx" ON "Preference"("userId");

-- CreateIndex
CREATE INDEX "Preference_category_idx" ON "Preference"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_category_key_key" ON "Preference"("userId", "category", "key");

-- CreateIndex
CREATE INDEX "Hierarchy_userId_idx" ON "Hierarchy"("userId");

-- CreateIndex
CREATE INDEX "Hierarchy_repositoryRoot_idx" ON "Hierarchy"("repositoryRoot");

-- CreateIndex
CREATE UNIQUE INDEX "Hierarchy_userId_repositoryRoot_key" ON "Hierarchy"("userId", "repositoryRoot");

-- CreateIndex
CREATE INDEX "UserTemplate_userId_idx" ON "UserTemplate"("userId");

-- CreateIndex
CREATE INDEX "UserTemplate_type_idx" ON "UserTemplate"("type");

-- CreateIndex
CREATE INDEX "UserTemplate_isPublic_idx" ON "UserTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "UserTemplate_visibility_idx" ON "UserTemplate"("visibility");

-- CreateIndex
CREATE INDEX "UserTemplate_teamId_idx" ON "UserTemplate"("teamId");

-- CreateIndex
CREATE INDEX "UserTemplate_tier_idx" ON "UserTemplate"("tier");

-- CreateIndex
CREATE INDEX "UserTemplate_downloads_idx" ON "UserTemplate"("downloads");

-- CreateIndex
CREATE INDEX "UserTemplate_favorites_idx" ON "UserTemplate"("favorites");

-- CreateIndex
CREATE INDEX "UserTemplate_currentVersion_idx" ON "UserTemplate"("currentVersion");

-- CreateIndex
CREATE INDEX "UserTemplate_hierarchyId_idx" ON "UserTemplate"("hierarchyId");

-- CreateIndex
CREATE INDEX "UserTemplate_parentId_idx" ON "UserTemplate"("parentId");

-- CreateIndex
CREATE INDEX "UserTemplateVersion_templateId_idx" ON "UserTemplateVersion"("templateId");

-- CreateIndex
CREATE INDEX "UserTemplateVersion_isPublished_idx" ON "UserTemplateVersion"("isPublished");

-- CreateIndex
CREATE INDEX "UserTemplateVersion_createdAt_idx" ON "UserTemplateVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTemplateVersion_templateId_version_key" ON "UserTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");

-- CreateIndex
CREATE INDEX "ApiToken_tokenHash_idx" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_expiresAt_idx" ON "ApiToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CliSession_sessionId_key" ON "CliSession"("sessionId");

-- CreateIndex
CREATE INDEX "CliSession_sessionId_idx" ON "CliSession"("sessionId");

-- CreateIndex
CREATE INDEX "CliSession_expiresAt_idx" ON "CliSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_persona_idx" ON "Project"("persona");

-- CreateIndex
CREATE INDEX "TemplateFavorite_templateId_templateType_idx" ON "TemplateFavorite"("templateId", "templateType");

-- CreateIndex
CREATE INDEX "TemplateFavorite_userId_idx" ON "TemplateFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFavorite_userId_templateId_templateType_key" ON "TemplateFavorite"("userId", "templateId", "templateType");

-- CreateIndex
CREATE INDEX "TemplateDownload_templateId_templateType_idx" ON "TemplateDownload"("templateId", "templateType");

-- CreateIndex
CREATE INDEX "TemplateDownload_templateId_ipHash_createdAt_idx" ON "TemplateDownload"("templateId", "ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "TemplateDownload_userId_idx" ON "TemplateDownload"("userId");

-- CreateIndex
CREATE INDEX "TemplateDownload_createdAt_idx" ON "TemplateDownload"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedFile_projectId_idx" ON "GeneratedFile"("projectId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSSOConfig" ADD CONSTRAINT "TeamSSOConfig_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnownDevice" ADD CONSTRAINT "KnownDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WizardDraft" ADD CONSTRAINT "WizardDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hierarchy" ADD CONSTRAINT "Hierarchy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTemplate" ADD CONSTRAINT "UserTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTemplate" ADD CONSTRAINT "UserTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTemplate" ADD CONSTRAINT "UserTemplate_hierarchyId_fkey" FOREIGN KEY ("hierarchyId") REFERENCES "Hierarchy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTemplate" ADD CONSTRAINT "UserTemplate_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "UserTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTemplateVersion" ADD CONSTRAINT "UserTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "UserTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CliSession" ADD CONSTRAINT "CliSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CliSession" ADD CONSTRAINT "CliSession_apiTokenId_fkey" FOREIGN KEY ("apiTokenId") REFERENCES "ApiToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateFavorite" ADD CONSTRAINT "TemplateFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateDownload" ADD CONSTRAINT "TemplateDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedFile" ADD CONSTRAINT "GeneratedFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

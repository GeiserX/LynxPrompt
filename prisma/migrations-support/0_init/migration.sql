-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "SupportCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportPost" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userImage" TEXT,
    "userPlan" TEXT NOT NULL DEFAULT 'FREE',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'OPEN',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportPostTag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportPostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportVote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userImage" TEXT,
    "userRole" TEXT NOT NULL DEFAULT 'USER',
    "userPlan" TEXT NOT NULL DEFAULT 'FREE',
    "content" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportCategory_name_key" ON "SupportCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupportCategory_slug_key" ON "SupportCategory"("slug");

-- CreateIndex
CREATE INDEX "SupportCategory_isActive_idx" ON "SupportCategory"("isActive");

-- CreateIndex
CREATE INDEX "SupportCategory_order_idx" ON "SupportCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTag_name_key" ON "SupportTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTag_slug_key" ON "SupportTag"("slug");

-- CreateIndex
CREATE INDEX "SupportTag_isActive_idx" ON "SupportTag"("isActive");

-- CreateIndex
CREATE INDEX "SupportPost_categoryId_idx" ON "SupportPost"("categoryId");

-- CreateIndex
CREATE INDEX "SupportPost_userId_idx" ON "SupportPost"("userId");

-- CreateIndex
CREATE INDEX "SupportPost_status_idx" ON "SupportPost"("status");

-- CreateIndex
CREATE INDEX "SupportPost_isPinned_idx" ON "SupportPost"("isPinned");

-- CreateIndex
CREATE INDEX "SupportPost_voteCount_idx" ON "SupportPost"("voteCount");

-- CreateIndex
CREATE INDEX "SupportPost_createdAt_idx" ON "SupportPost"("createdAt");

-- CreateIndex
CREATE INDEX "SupportPostTag_postId_idx" ON "SupportPostTag"("postId");

-- CreateIndex
CREATE INDEX "SupportPostTag_tagId_idx" ON "SupportPostTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportPostTag_postId_tagId_key" ON "SupportPostTag"("postId", "tagId");

-- CreateIndex
CREATE INDEX "SupportVote_postId_idx" ON "SupportVote"("postId");

-- CreateIndex
CREATE INDEX "SupportVote_userId_idx" ON "SupportVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportVote_postId_userId_key" ON "SupportVote"("postId", "userId");

-- CreateIndex
CREATE INDEX "SupportComment_postId_idx" ON "SupportComment"("postId");

-- CreateIndex
CREATE INDEX "SupportComment_parentId_idx" ON "SupportComment"("parentId");

-- CreateIndex
CREATE INDEX "SupportComment_userId_idx" ON "SupportComment"("userId");

-- CreateIndex
CREATE INDEX "SupportComment_createdAt_idx" ON "SupportComment"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportPost" ADD CONSTRAINT "SupportPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SupportCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportPostTag" ADD CONSTRAINT "SupportPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SupportPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportPostTag" ADD CONSTRAINT "SupportPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "SupportTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportVote" ADD CONSTRAINT "SupportVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SupportPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportComment" ADD CONSTRAINT "SupportComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SupportPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportComment" ADD CONSTRAINT "SupportComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SupportComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

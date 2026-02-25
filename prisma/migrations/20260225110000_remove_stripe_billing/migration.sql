-- Remove TeamBillingRecord table
DROP TABLE IF EXISTS "TeamBillingRecord";

-- Remove Stripe subscription fields from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionStatus";
ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionInterval";
ALTER TABLE "User" DROP COLUMN IF EXISTS "currentPeriodEnd";
ALTER TABLE "User" DROP COLUMN IF EXISTS "cancelAtPeriodEnd";

-- Remove indexes on dropped User columns
DROP INDEX IF EXISTS "User_stripeCustomerId_key";
DROP INDEX IF EXISTS "User_stripeSubscriptionId_key";

-- Remove Stripe subscription fields from Team
ALTER TABLE "Team" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "subscriptionInterval";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "billingCycleStart";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "aiUsageLimitPerUser";

-- Remove indexes on dropped Team columns
DROP INDEX IF EXISTS "Team_stripeCustomerId_key";
DROP INDEX IF EXISTS "Team_stripeSubscriptionId_key";

-- Migrate any users with removed plan tiers to FREE
UPDATE "User" SET "subscriptionPlan" = 'FREE' WHERE "subscriptionPlan" NOT IN ('FREE', 'TEAMS');

-- Note: PostgreSQL enum value removal requires creating a new type.
-- Prisma handles this automatically with prisma migrate deploy.
-- The FREE and TEAMS values are kept for backwards compatibility.

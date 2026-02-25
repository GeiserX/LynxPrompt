-- Remove TeamBillingRecord table
DROP TABLE IF EXISTS "TeamBillingRecord";

-- Remove Stripe subscription fields from User (safe for fresh installs)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') THEN
    ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";
    ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeSubscriptionId";
    ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionStatus";
    ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionInterval";
    ALTER TABLE "User" DROP COLUMN IF EXISTS "currentPeriodEnd";
    ALTER TABLE "User" DROP COLUMN IF EXISTS "cancelAtPeriodEnd";
    UPDATE "User" SET "subscriptionPlan" = 'FREE' WHERE "subscriptionPlan" NOT IN ('FREE', 'TEAMS');
  END IF;
END $$;

DROP INDEX IF EXISTS "User_stripeCustomerId_key";
DROP INDEX IF EXISTS "User_stripeSubscriptionId_key";

-- Remove Stripe subscription fields from Team (safe for fresh installs)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Team') THEN
    ALTER TABLE "Team" DROP COLUMN IF EXISTS "stripeCustomerId";
    ALTER TABLE "Team" DROP COLUMN IF EXISTS "stripeSubscriptionId";
    ALTER TABLE "Team" DROP COLUMN IF EXISTS "subscriptionInterval";
    ALTER TABLE "Team" DROP COLUMN IF EXISTS "billingCycleStart";
    ALTER TABLE "Team" DROP COLUMN IF EXISTS "aiUsageLimitPerUser";
  END IF;
END $$;

DROP INDEX IF EXISTS "Team_stripeCustomerId_key";
DROP INDEX IF EXISTS "Team_stripeSubscriptionId_key";

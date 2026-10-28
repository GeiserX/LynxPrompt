-- Data only: no schema change.
--
-- Before app 2.1.47, making a blueprint private through the v1 API kept its
-- team id. Since 2.1.47 the read rule ignores a team id on a private
-- blueprint and every write path drops it, so the rows left behind only hold
-- a stale team link. This clears it.
UPDATE "UserTemplate" SET "teamId" = NULL WHERE "visibility" = 'PRIVATE' AND "teamId" IS NOT NULL;

-- Data only: no schema change.
--
-- Until app 2.1.45 every view of a blueprint page added one to its download
-- count, and the favorites API accepted any templateType, so one user could
-- add to a favorite count several times. Both counters are recounted here from
-- the rows that record each download and each favorite. Every download counted
-- since the downloads table exists left one row, so the row count is the true
-- number.

-- Favorites of anything but a system template or a user blueprint point at
-- nothing the app can show.
DELETE FROM "TemplateFavorite" WHERE "templateType" NOT IN ('system', 'user');

-- Older rows may carry the id with its API prefix (bp_, usr_, sys_). A user
-- counts once per blueprint, whichever form their rows use.
UPDATE "UserTemplate" t
SET "favorites" = (
  SELECT COUNT(DISTINCT f."userId")
  FROM "TemplateFavorite" f
  WHERE f."templateType" = 'user'
    AND regexp_replace(f."templateId", '^(sys_|bp_|usr_)', '') = t."id"
),
"downloads" = (
  SELECT COUNT(*)
  FROM "TemplateDownload" d
  WHERE d."templateType" = 'user'
    AND regexp_replace(d."templateId", '^(sys_|bp_|usr_)', '') = t."id"
);

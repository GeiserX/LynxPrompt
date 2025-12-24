SELECT id, email, name, role, "displayName", persona, "skillLevel", "profileCompleted" FROM "User" WHERE email LIKE '%acsdesk%' OR role = 'SUPERADMIN' LIMIT 5;



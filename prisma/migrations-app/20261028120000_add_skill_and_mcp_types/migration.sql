-- AlterEnum
-- Agent Skills and MCP server definitions as blueprint types. Postgres 12
-- and later add several enum values in one migration.
ALTER TYPE "TemplateType" ADD VALUE 'AGENT_SKILL';
ALTER TYPE "TemplateType" ADD VALUE 'MCP_CONFIG';

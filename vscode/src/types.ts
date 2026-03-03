export type BlueprintType =
  | "AGENTS_MD"
  | "CLAUDE_MD"
  | "CURSOR_RULES"
  | "COPILOT_INSTRUCTIONS"
  | "WINDSURF_RULES"
  | "CLINE_RULES"
  | "AIDER_RULES"
  | "CONTINUE_RULES"
  | "CODEX_RULES"
  | "CUSTOM";

export type BlueprintTier = "SHORT" | "INTERMEDIATE" | "LONG" | "SUPERLONG";

export type BlueprintVisibility = "PRIVATE" | "TEAM" | "PUBLIC";

export interface Blueprint {
  id: string;
  name: string;
  description: string | null;
  type: BlueprintType;
  tier: BlueprintTier;
  category: string | null;
  tags: string[];
  visibility: BlueprintVisibility;
  downloads: number;
  favorites: number;
  content: string;
  content_checksum: string;
  created_at: string;
  updated_at: string;
}

export interface BlueprintListItem {
  id: string;
  name: string;
  description: string | null;
  type: BlueprintType;
  tier: BlueprintTier;
  category: string | null;
  tags: string[];
  visibility: BlueprintVisibility;
  downloads: number;
  favorites: number;
  content_checksum: string;
  created_at: string;
  updated_at: string;
}

export interface BlueprintListResponse {
  blueprints: BlueprintListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateBlueprintRequest {
  name: string;
  description?: string;
  type: BlueprintType;
  tier?: BlueprintTier;
  category?: string;
  tags?: string[];
  visibility?: BlueprintVisibility;
  content: string;
}

export interface UpdateBlueprintRequest {
  name?: string;
  description?: string;
  type?: BlueprintType;
  tier?: BlueprintTier;
  category?: string;
  tags?: string[];
  visibility?: BlueprintVisibility;
  content?: string;
}

export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface DeviceAuthInitResponse {
  session_id: string;
  auth_url: string;
  expires_at: string;
}

export interface DeviceAuthPollResponse {
  status: "pending" | "completed" | "expired";
  token?: string;
}

export interface HierarchyListItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface LocalConfigFile {
  absolutePath: string;
  relativePath: string;
  type: BlueprintType;
  linkedBlueprintId?: string;
  status: "synced" | "modified" | "untracked";
}

export interface LinkMapping {
  localPath: string;
  blueprintId: string;
  lastChecksum: string;
}

export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type SearchType =
  | "email"
  | "username"
  | "ip"
  | "password"
  | "hash"
  | "name"
  | "domain";

export interface LeakRecord {
  id: string;
  database: string;
  database_label: string;
  breach_date: string | null;
  provider: string;
  severity: string;
  has_password: boolean;
  email: string | null;
  username: string | null;
  password: string | null;
  hash: string | null;
  name: string | null;
  ip: string | null;
  fields: Record<string, unknown>;
}

export interface EnrichmentItem {
  source: string;
  kind: string;
  title: string;
  summary: string;
  data: Record<string, unknown>;
}

export interface SearchResponse {
  terms: string[];
  type: SearchType;
  wildcard: boolean;
  total: number;
  database_count: number;
  took_ms: number;
  records: LeakRecord[];
  enrichment: EnrichmentItem[];
  snusbase_configured: boolean;
  query_id: string | null;
}

export interface SearchHistoryItem {
  id: string;
  term: string;
  term_type: string;
  result_count: number;
  created_at: string;
}

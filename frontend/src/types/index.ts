export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "analyst";
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface ConnectionStatus {
  id: string;
  success: boolean;
  status: "Active" | "Inactive";
  error?: string;
  last_checked?: string;
}

export interface CreateConnectionPayload {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TestConnectionPayload {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TestResult {
  success: boolean;
  message?: string;
}

export interface Permission {
  id: string;
  analyst_id: string;
  database_connection_id: string;
  created_at: string;
}

export interface SchemaInfo {
  tables: TableInfo[];
  views: ViewInfo[];
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  default_value: string | null;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  is_unique: boolean;
}

export interface ViewInfo {
  name: string;
  schema: string;
}

export interface QueryRequest {
  database_connection_id: string;
  sql?: string;
  question?: string;
}

export interface QueryResult {
  status: "success" | "error";
  column_names: string[];
  rows: unknown[][];
  row_count: number;
  execution_time: number;
  error?: string;
  sql?: string;
  corrected_sql?: string;
  correction_attempts?: number;
  original_error?: string;
  friendly_error?: string;
}

export interface QueryHistoryItem {
  id: string;
  user_id: string;
  username: string;
  question: string;
  generated_sql: string;
  database_name: string;
  execution_time: number;
  row_count: number;
  status: string;
  error_message: string | null;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  status: string;
  timestamp: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: "admin" | "analyst";
}

export interface UpdateUserPayload {
  username: string;
  email: string;
  role: "admin" | "analyst";
  is_active: boolean;
}

export interface AssignPermissionPayload {
  analyst_id: string;
  database_connection_id: string;
}

export interface AssignDatabasesPayload {
  database_ids: string[];
}

export interface VisColumn {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  primary_key: boolean;
  foreign_key: boolean;
}

export interface VisTable {
  name: string;
  schema_name: string;
  columns: VisColumn[];
  row_count: number;
}

export interface Relationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  relationship: string;
}

export interface SchemaVisualization {
  tables: VisTable[];
  relationships: Relationship[];
}

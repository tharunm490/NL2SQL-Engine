import type { SchemaVisualization } from "@/types";

const SCHEMA_PREFIX = "schema:";

function isValidSchema(data: unknown): data is SchemaVisualization {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as Record<string, unknown>).tables) &&
    Array.isArray((data as Record<string, unknown>).relationships)
  );
}

export function getSchema(databaseId: string): SchemaVisualization | null {
  try {
    const raw = sessionStorage.getItem(SCHEMA_PREFIX + databaseId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidSchema(parsed)) {
        console.log(`Frontend Schema Cache HIT for ${databaseId}`);
        return parsed;
      }
      console.warn(`Frontend Schema Cache invalid for ${databaseId}, removing`);
      sessionStorage.removeItem(SCHEMA_PREFIX + databaseId);
    }
    console.log(`Frontend Schema Cache MISS for ${databaseId}`);
    return null;
  } catch {
    console.warn("Failed to read schema cache for", databaseId);
    return null;
  }
}

export function setSchema(databaseId: string, schema: SchemaVisualization): void {
  try {
    sessionStorage.setItem(SCHEMA_PREFIX + databaseId, JSON.stringify(schema));
    console.log(`Frontend Schema Cache Stored for ${databaseId}`);
  } catch {
    console.warn("Failed to store schema cache for", databaseId);
  }
}

export function removeSchema(databaseId: string): void {
  try {
    sessionStorage.removeItem(SCHEMA_PREFIX + databaseId);
    console.log(`Frontend Schema Cache Removed for ${databaseId}`);
  } catch {
    console.warn("Failed to remove schema cache for", databaseId);
  }
}

export function clearAllSchemas(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SCHEMA_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
    if (keys.length > 0) {
      console.log(`Frontend Schema Cache Cleared (${keys.length} entries)`);
    }
  } catch {
    console.warn("Failed to clear schema cache");
  }
}

/**
 * Minimal DB sandbox stub: only allows read operations, no writes.
 */
export interface DbClient {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}

export function createReadOnlyDbClient(execute: (sql: string, params?: unknown[]) => Promise<unknown>): DbClient {
  return {
    async query(sql: string, _params?: unknown[]) {
      if (!/^\\s*select/i.test(sql)) {
        throw new Error("DB sandbox: write operations are not allowed");
      }
      // Basic quota: limit length
      if (sql.length > 5000) {
        throw new Error("DB sandbox: query too large");
      }
      return execute(sql, _params);
    },
  };
}

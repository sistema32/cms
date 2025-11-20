import { type Config } from "drizzle-kit";

export type DatabaseType = "sqlite" | "postgresql" | "mysql";

export const getDbType = (): DatabaseType => {
    const type = Deno.env.get("DATABASE_TYPE");
    if (type === "sqlite" || type === "postgresql" || type === "mysql") {
        return type;
    }

    const url = Deno.env.get("DATABASE_URL");
    if (url?.startsWith("postgres://") || url?.startsWith("postgresql://")) {
        return "postgresql";
    }
    if (url?.startsWith("mysql://")) {
        return "mysql";
    }
    if (url?.startsWith("file:") || url?.startsWith("libsql:") || url?.includes(".db") || url?.includes(".sqlite")) {
        return "sqlite";
    }

    // Default to sqlite for development if not specified
    return "sqlite";
};

export const getDrizzleConfig = (): Config => {
    const dbType = getDbType();
    const dbUrl = Deno.env.get("DATABASE_URL")!;
    const authToken = Deno.env.get("DATABASE_AUTH_TOKEN");

    const common = {
        schema: "./src/db/schema.ts",
        out: "./src/db/migrations",
        verbose: true,
        strict: true,
    } satisfies Partial<Config>;

    if (dbType === "postgresql") {
        return {
            ...common,
            dialect: "postgresql",
            dbCredentials: {
                url: dbUrl,
            },
        };
    }

    if (dbType === "mysql") {
        return {
            ...common,
            dialect: "mysql",
            dbCredentials: {
                url: dbUrl,
            },
        };
    }

    // SQLite / Turso
    return {
        ...common,
        dialect: "turso",
        dbCredentials: {
            url: dbUrl || "file:local.db",
            authToken: authToken,
        },
    };
};

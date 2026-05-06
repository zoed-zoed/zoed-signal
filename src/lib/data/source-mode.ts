import { hasSupabaseServerConfig } from "@/lib/supabase/server";

export class DataSourceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataSourceConfigurationError";
  }
}

export function isLocalMockDataEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ZOED_ALLOW_LOCAL_DATA === "true";
}

export function getDataSourceMode(): "supabase" | "local-mock" {
  if (hasSupabaseServerConfig()) {
    return "supabase";
  }

  if (isLocalMockDataEnabled()) {
    return "local-mock";
  }

  throw new DataSourceConfigurationError(
    "Supabase is required for this environment. Local JSON is only available for explicit development mock mode.",
  );
}

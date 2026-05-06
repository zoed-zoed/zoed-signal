export function logDataWarning(scope: string, message: string, error?: unknown) {
  if (error instanceof Error) {
    console.warn(`[${scope}] ${message}: ${error.message}`);
    return;
  }

  console.warn(`[${scope}] ${message}`);
}

export function filterValidItems<T>(scope: string, items: unknown[], sanitize: (item: unknown) => T | null): T[] {
  const validItems: T[] = [];

  for (const item of items) {
    const nextItem = sanitize(item);
    if (nextItem) {
      validItems.push(nextItem);
      continue;
    }

    logDataWarning(scope, "Skipped invalid record while reading data source");
  }

  return validItems;
}

// lib/log.ts
export function logInfo(msg: string, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[INFO]", msg, meta ?? "");
  }
}

export function logWarn(msg: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.warn("[WARN]", msg, meta ?? "");
}

export function logError(msg: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error("[ERROR]", msg, meta ?? "");
}

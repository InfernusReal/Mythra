type LogContext = Record<string, unknown>;

function formatContext(context: LogContext): LogContext {
  return Object.keys(context).length > 0 ? context : {};
}

export function logInfo(message: string, context: LogContext = {}): void {
  console.log(message, formatContext(context));
}

export function logWarn(message: string, context: LogContext = {}): void {
  console.warn(message, formatContext(context));
}

export function logError(message: string, context: LogContext = {}): void {
  console.error(message, formatContext(context));
}

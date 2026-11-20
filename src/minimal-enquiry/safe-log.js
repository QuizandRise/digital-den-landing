/**
 * Minimal safe logging: never log names, emails, briefs, URLs, or tokens.
 * @param {string} level
 * @param {string} event
 * @param {Record<string, string | number | boolean | undefined>} [meta]
 */
export function safeLog(level, event, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else console.log(line);
}

export class RequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new RequestError("Expected a JSON object.");
  return value as Record<string, unknown>;
}
export function text(
  value: unknown,
  label: string,
  max = 500,
  optional = false,
): string {
  if (optional && (value === undefined || value === null)) return "";
  if (
    typeof value !== "string" ||
    (!optional && !value.trim()) ||
    value.length > max
  ) {
    throw new RequestError(
      `${label} must be ${optional ? "text" : "non-empty text"} of at most ${max} characters.`,
    );
  }
  return value.trim();
}
export function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean")
    throw new RequestError(`${label} must be true or false.`);
  return value;
}
export const statuses = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "HOT",
  "WON",
  "LOST",
] as const;
export function status(value: unknown) {
  if (!statuses.includes(value as (typeof statuses)[number]))
    throw new RequestError("Invalid lead status.");
  return value as (typeof statuses)[number];
}
export function leadFields(input: Record<string, unknown>) {
  const email = text(input.email, "Email", 254, true).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new RequestError("Enter a valid email address.");
  return {
    name: text(input.name, "Name", 200),
    email: email || null,
    phone: text(input.phone, "Phone", 80, true) || null,
    source: text(input.source, "Source", 200, true) || null,
    notes: text(input.notes, "Context", 5000, true) || null,
    status: status(input.status ?? "NEW"),
    unsubscribed:
      input.unsubscribed === undefined
        ? false
        : bool(input.unsubscribed, "Opt out"),
  };
}

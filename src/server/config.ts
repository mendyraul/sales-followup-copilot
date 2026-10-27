export const isDemo = () => process.env.APP_MODE === "demo";
export function appUrl() {
  return (process.env.APP_URL || "http://127.0.0.1:3116").replace(/\/$/, "");
}
export function authSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Set BETTER_AUTH_SECRET to at least 32 random characters.");
  return secret;
}

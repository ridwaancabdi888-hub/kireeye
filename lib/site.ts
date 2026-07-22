const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

export const SITE_URL = (
  configuredUrl?.startsWith("https://")
    ? configuredUrl
    : "https://kireeye-x2oq-ruddy.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Kireeye";

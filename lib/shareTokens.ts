import { createHmac, randomBytes } from "crypto";

// Falls back to a fixed dev secret when unset so the demo works with zero
// config. Set SHARE_LINK_SECRET for real use — anyone with this default
// could forge share tokens.
const SECRET = process.env.SHARE_LINK_SECRET || "demo-insecure-share-secret";

// Raw token goes in the URL once; only the HMAC hash is stored.
export function newShareToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashShareToken(token) };
}

export function hashShareToken(token: string) {
  return createHmac("sha256", SECRET)
    .update(token)
    .digest("hex");
}

/**
 * Web Push for Cloudflare Workers using only WebCrypto (no Node crypto):
 * RFC 8291 payload encryption (aes128gcm, RFC 8188) and RFC 8292 VAPID auth.
 */

const subtle = crypto.subtle;
const enc = new TextEncoder();

type Bytes = Uint8Array<ArrayBuffer>;

export function b64urlEncode(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(value: string): Bytes {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) {
    out.set(p, i);
    i += p.length;
  }
  return out;
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, bytes: number): Promise<Bytes> {
  const key = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

export type PushKeys = { p256dh: string; auth: string };

/** Encrypts one message for one browser subscription. Returns the request body. */
export async function encryptPayload(keys: PushKeys, message: string): Promise<Bytes> {
  const uaPublic = b64urlDecode(keys.p256dh);
  const authSecret = b64urlDecode(keys.auth);
  const server = (await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const asPublic = new Uint8Array(await subtle.exportKey("raw", server.publicKey));
  const uaKey = await subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: "ECDH", public: uaKey }, server.privateKey, 256));

  const ikm = await hkdf(authSecret, ecdh, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, concat(enc.encode("Content-Encoding: aes128gcm\0")), 16);
  const nonce = await hkdf(salt, ikm, concat(enc.encode("Content-Encoding: nonce\0")), 12);

  const key = await subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const plaintext = concat(enc.encode(message), new Uint8Array([2])); // single, final record
  const ciphertext = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, plaintext));

  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  return concat(header, asPublic, ciphertext);
}

/** `Authorization` header value for the push service that owns `endpoint`. */
export async function vapidAuthorization(input: {
  endpoint: string;
  publicKey: string; // base64url raw P-256 point (65 bytes)
  privateKey: string; // base64url private scalar d
  subject: string; // mailto: or https: contact
  nowSeconds?: number;
}) {
  const pub = b64urlDecode(input.publicKey);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: b64urlEncode(pub.slice(1, 33)),
    y: b64urlEncode(pub.slice(33, 65)),
    d: input.privateKey,
    ext: true,
  };
  const key = await subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlEncode(enc.encode(JSON.stringify({ aud: new URL(input.endpoint).origin, exp: now + 12 * 3600, sub: input.subject })));
  const signature = new Uint8Array(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${header}.${claims}`)));
  return `vapid t=${header}.${claims}.${b64urlEncode(signature)}, k=${input.publicKey}`;
}

export type PushResult = "sent" | "gone" | "failed";

/** Sends one encrypted message. "gone" means the subscription expired and should be deleted. */
export async function sendWebPush(
  subscription: PushKeys & { endpoint: string },
  message: string,
  vapid: { publicKey: string; privateKey: string; subject: string }
): Promise<PushResult> {
  try {
    const body = await encryptPayload(subscription, message);
    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: await vapidAuthorization({ endpoint: subscription.endpoint, ...vapid }),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high",
      },
      body,
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

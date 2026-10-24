import { describe, expect, it } from "bun:test";
import { b64urlDecode, b64urlEncode, encryptPayload, vapidAuthorization } from "./webpush";

const subtle = crypto.subtle;

async function browserKeys() {
  const pair = (await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const pub = new Uint8Array(await subtle.exportKey("raw", pair.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { pair, p256dh: b64urlEncode(pub), auth: b64urlEncode(auth), pub, authBytes: auth };
}

/** What the browser does on receipt (RFC 8291 / RFC 8188), used only to check our encryption. */
async function decrypt(body: Uint8Array, ua: Awaited<ReturnType<typeof browserKeys>>) {
  const salt = body.slice(0, 16);
  const idlen = body[20]!;
  const asPublic = body.slice(21, 21 + idlen);
  const ciphertext = body.slice(21 + idlen);
  const asKey = await subtle.importKey("raw", asPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: "ECDH", public: asKey }, ua.pair.privateKey, 256));
  const keyInfo = new Uint8Array([...new TextEncoder().encode("WebPush: info\0"), ...ua.pub, ...asPublic]);
  const ikmKey = await subtle.importKey("raw", ecdh, "HKDF", false, ["deriveBits"]);
  const ikm = new Uint8Array(await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: ua.authBytes, info: keyInfo }, ikmKey, 256));
  const prk = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const enc = (s: string) => new TextEncoder().encode(s);
  const cek = await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc("Content-Encoding: aes128gcm\0") }, prk, 128);
  const nonce = await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc("Content-Encoding: nonce\0") }, prk, 96);
  const key = await subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ciphertext));
  expect(plain[plain.length - 1]).toBe(2); // last-record delimiter
  return new TextDecoder().decode(plain.slice(0, -1));
}

describe("web push encryption", () => {
  it("round-trips a payload the browser can decrypt", async () => {
    const ua = await browserKeys();
    const message = JSON.stringify({ title: "New order", body: "#1042 · 2 thalis", url: "/merchant-panel/x/orders" });
    const body = await encryptPayload({ p256dh: ua.p256dh, auth: ua.auth }, message);
    expect(new DataView(body.buffer, body.byteOffset).getUint32(16)).toBe(4096);
    expect(await decrypt(body, ua)).toBe(message);
  });

  it("uses a fresh salt and key every time", async () => {
    const ua = await browserKeys();
    const a = await encryptPayload({ p256dh: ua.p256dh, auth: ua.auth }, "x");
    const b = await encryptPayload({ p256dh: ua.p256dh, auth: ua.auth }, "x");
    expect(b64urlEncode(a.slice(0, 16))).not.toBe(b64urlEncode(b.slice(0, 16)));
  });
});

describe("VAPID authorization", () => {
  it("signs an ES256 JWT for the push service origin that verifies with the public key", async () => {
    const pair = (await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const jwk = await subtle.exportKey("jwk", pair.privateKey);
    const publicKey = b64urlEncode(new Uint8Array(await subtle.exportKey("raw", pair.publicKey)));
    const now = 1_800_000_000;
    const header = await vapidAuthorization({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      publicKey,
      privateKey: jwk.d!,
      subject: "mailto:alerts@notifications.ruxs.in",
      nowSeconds: now,
    });
    const [, token, k] = header.match(/^vapid t=([^,]+), k=(.+)$/)!;
    expect(k).toBe(publicKey);
    const [h, p, s] = token!.split(".");
    const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(p!)));
    expect(claims.aud).toBe("https://fcm.googleapis.com");
    expect(claims.exp).toBe(now + 12 * 3600);
    const ok = await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, b64urlDecode(s!), new TextEncoder().encode(`${h}.${p}`));
    expect(ok).toBe(true);
  });
});

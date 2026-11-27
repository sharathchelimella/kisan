import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, digest) =>
      error ? reject(error) : resolve(digest),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = await derive(password, salt);
  return `${salt}:${digest.toString("hex")}`;
}

export async function checkPassword(password: string, stored?: string) {
  const [salt, expected] = (
    stored ?? `${"0".repeat(32)}:${"0".repeat(128)}`
  ).split(":");
  const digest = await derive(password, salt);
  const matches = timingSafeEqual(digest, Buffer.from(expected, "hex"));
  return Boolean(stored) && matches;
}

export function sessionDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function issueRegistrationCode(
  email: string,
  secret: string,
  expires: number,
) {
  const signature = createHmac("sha256", secret)
    .update(JSON.stringify([email, expires]))
    .digest("hex");
  return `${expires}.${signature}`;
}

export function verifyRegistrationCode(
  email: string,
  code: string,
  secret: string,
) {
  if (!/^\d{10}\.[a-f0-9]{64}$/.test(code)) return false;
  const expires = Number(code.split(".")[0]);
  if (expires <= Math.floor(Date.now() / 1000)) return false;
  const expected = issueRegistrationCode(email, secret, expires);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(code));
}

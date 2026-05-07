const MIN_SECRET_LENGTH = 32;

export function getRequiredJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required. Refusing to start without an explicit signing secret.");
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`);
  }
  return secret;
}

export function getJwtSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getRequiredJwtSecret());
}

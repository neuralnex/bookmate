import dotenv from 'dotenv';

dotenv.config();

function parseOrigin(u: string): string {
  try {
    return new URL(u.trim()).origin;
  } catch {
    return '';
  }
}

const monnifyReturnRaw = process.env.MONNIFY_RETURN_URL;

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    /** Must be set in `.env`; no credential-less default. */
    url: (process.env.DATABASE_URL || '').trim(),
  },
  jwt: {
    /** Must be set in `.env`; never use a baked-in fallback. */
    secret: (process.env.JWT_SECRET || '').trim(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  monnify: {
    apiKey: (process.env.MONNIFY_API_KEY || '').trim(),
    secretKey: (process.env.MONNIFY_SECRET_KEY || '').trim(),
    contractCode: (process.env.MONNIFY_CONTRACT_CODE || '').trim(),
    baseUrl: (process.env.MONNIFY_BASE_URL || '').trim().replace(/\/+$/, ''),
    callbackUrl: (process.env.MONNIFY_CALLBACK_URL || '').trim(),
    /** Fallback redirectUrl for Monnify when no per-order URL is supplied. */
    returnUrl: (monnifyReturnRaw || '').trim(),
  },
  /** Used to build HTTPS redirect URLs (Monnify) that forward into the Expo app (`APP_DEEP_LINK_SCHEME`). */
  app: {
    deepLinkScheme: (process.env.APP_DEEP_LINK_SCHEME || 'fubooks').trim() || 'fubooks',
    publicWebOrigin:
      (process.env.PUBLIC_WEB_BASE_URL || '').trim().replace(/\/+$/, '') ||
      parseOrigin((monnifyReturnRaw || '').trim()) ||
      '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

/** Fail fast so the app never runs with placeholder or missing secrets. */
export function assertRequiredEnv(): void {
  const missing: string[] = [];
  if (!config.database.url) missing.push('DATABASE_URL');
  if (!config.jwt.secret) missing.push('JWT_SECRET');
  if (missing.length) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}. Set them in .env (see .env.example).`
    );
    process.exit(1);
  }
}

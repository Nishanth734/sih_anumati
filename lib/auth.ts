import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const BCRYPT_SALT_ROUNDS = 12;

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || "anumati_production_super_secret_jwt_key_32_bytes_min!";
  return new TextEncoder().encode(secret);
};

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "entrepreneur" | "officer";
  sector: "Boiler" | "Pollution" | "FactoryLicense";
  employeeId?: string;
  pan?: string;
  companyName?: string;
}

export const COOKIE_NAME = "anumati_session";

/**
 * Hash raw password using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare plain password against hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Sign JWT session token using Jose HS256 algorithm
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Helper to retrieve current user session from request cookies or Next.js cookies store
 */
export async function getCurrentUserSession(req?: any): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    if (req && typeof req.cookies?.get === "function") {
      const cookieObj = req.cookies.get(COOKIE_NAME);
      token = typeof cookieObj === "string" ? cookieObj : cookieObj?.value;
    } else {
      try {
        const cookieStore = cookies();
        if (cookieStore && typeof cookieStore.get === "function") {
          const cookieObj = cookieStore.get(COOKIE_NAME);
          token = typeof cookieObj === "string" ? cookieObj : cookieObj?.value;
        }
      } catch {
        // Fallback for non-RSC contexts
      }
    }

    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

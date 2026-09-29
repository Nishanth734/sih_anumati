import { z } from "zod";

export const IndustrySectorEnum = z.enum(["Boiler", "Pollution", "FactoryLicense"]);
export type IndustrySector = z.infer<typeof IndustrySectorEnum>;

export const UserRoleEnum = z.enum(["entrepreneur", "officer"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PHONE_REGEX = /^(?:\+91|0)?[6-9]\d{9}$/;
export const GSTIN_FORMAT_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/i;

/**
 * Validates 15-character Indian GSTIN using Modulus 36 Checksum algorithm
 */
export function isValidGSTINChecksum(gstin: string): boolean {
  const cleanGstin = gstin.trim().toUpperCase();
  if (!GSTIN_FORMAT_REGEX.test(cleanGstin)) {
    return false;
  }

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const char = cleanGstin[i];
    const val = chars.indexOf(char);
    if (val === -1) return false;

    const factor = i % 2 === 0 ? 1 : 2;
    const product = val * factor;

    const quotient = Math.floor(product / 36);
    const remainder = product % 36;
    sum += quotient + remainder;
  }

  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;
  const expectedCheckChar = chars[checkCodePoint];

  return cleanGstin[14] === expectedCheckChar;
}

/**
 * Validates if string is a valid GSTIN (with checksum) or Udyam Registration Number
 */
export function isValidGSTINOrUdyam(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;

  if (UDYAM_REGEX.test(trimmed)) {
    return true;
  }

  return isValidGSTINChecksum(trimmed);
}

export const EntrepreneurProfileSchema = z.object({
  companyName: z.string().min(2, "Company / Business name must be at least 2 characters"),
  pan: z.string().regex(PAN_REGEX, "Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)"),
  gstin: z.string().refine(
    (val) => isValidGSTINOrUdyam(val),
    {
      message: "Invalid GSTIN or Udyam number. Enter a valid 15-digit GSTIN (with valid checksum) or Udyam number (e.g. UDYAM-MH-01-0012345)",
    }
  ),
  registeredAddress: z.string().min(5, "Registered address must be at least 5 characters"),
  sector: IndustrySectorEnum,
  phone: z.string().regex(PHONE_REGEX, "Invalid Indian phone number format (e.g. 9876543210 or +919876543210)"),
  email: z.string().email("Invalid email address format"),
});

export type EntrepreneurProfileInput = z.infer<typeof EntrepreneurProfileSchema>;

export const EntrepreneurSignupSchema = z.object({
  role: z.literal("entrepreneur"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  sector: IndustrySectorEnum,
  pan: z.string().regex(PAN_REGEX, "Invalid PAN format. Example: ABCDE1234F"),
  companyName: z.string().min(2, "Company / Unit name is required"),
  businessAddress: z.string().min(5, "Business address must be at least 5 characters"),
});

export const OfficerSignupSchema = z.object({
  role: z.literal("officer"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid official email address format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  sector: IndustrySectorEnum,
  employeeId: z.string().min(3, "Employee ID must be at least 3 characters (e.g. GOV-OFF-101)"),
});

export const SignupSchema = z.discriminatedUnion("role", [
  EntrepreneurSignupSchema,
  OfficerSignupSchema,
]);

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ApplicationStatusEnum = z.enum([
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ADDITIONAL_INFO_REQUIRED",
]);

export const CreateApplicationSchema = z.object({
  title: z.string().min(3, "Application title must be at least 3 characters"),
  sector: IndustrySectorEnum,
  description: z.string().min(10, "Description must be at least 10 characters"),
  estimatedBudget: z.number().positive("Estimated budget must be a positive number"),
  plantLocation: z.string().min(5, "Plant location address is required"),
});

export type EntrepreneurSignupInput = z.infer<typeof EntrepreneurSignupSchema>;
export type OfficerSignupInput = z.infer<typeof OfficerSignupSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

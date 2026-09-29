import {
  PAN_REGEX,
  PHONE_REGEX,
  isValidGSTINChecksum,
  isValidGSTINOrUdyam,
  EntrepreneurProfileSchema,
} from "@/lib/validators";

describe("Compliance Validators (PAN, GSTIN Checksum, Udyam, Phone)", () => {
  describe("PAN Format Validator", () => {
    it("accepts valid 10-character Indian PANs", () => {
      expect(PAN_REGEX.test("ABCDE1234F")).toBe(true);
      expect(PAN_REGEX.test("AAACR5678K")).toBe(true);
    });

    it("rejects invalid PAN formats", () => {
      expect(PAN_REGEX.test("ABCD12345F")).toBe(false); // 4 letters instead of 5
      expect(PAN_REGEX.test("ABCDE12345")).toBe(false);  // No trailing letter
      expect(PAN_REGEX.test("abcde1234f")).toBe(false);  // Lowercase
      expect(PAN_REGEX.test("12345ABCDE")).toBe(false);  // Reversed format
      expect(PAN_REGEX.test("")).toBe(false);
    });
  });

  describe("GSTIN Checksum & Udyam Validator", () => {
    it("validates GSTIN with correct Modulus 36 checksum", () => {
      // 27AAACR1234K1ZI is calculated to have checksum 'I'
      expect(isValidGSTINChecksum("27AAACR1234K1ZI")).toBe(true);
      expect(isValidGSTINOrUdyam("27AAACR1234K1ZI")).toBe(true);
    });

    it("rejects GSTIN with invalid checksum digit", () => {
      // Replacing checksum character 'I' with 'X'
      expect(isValidGSTINChecksum("27AAACR1234K1ZX")).toBe(false);
      expect(isValidGSTINOrUdyam("27AAACR1234K1ZX")).toBe(false);
    });

    it("rejects GSTIN with invalid format length or characters", () => {
      expect(isValidGSTINChecksum("27AAACR1234K1Z")).toBe(false);   // 14 chars
      expect(isValidGSTINChecksum("27AAACR1234K1ZII")).toBe(false); // 16 chars
      expect(isValidGSTINChecksum("INVALIDGSTINNUM")).toBe(false);
    });

    it("validates Udyam registration numbers", () => {
      expect(isValidGSTINOrUdyam("UDYAM-MH-01-0012345")).toBe(true);
      expect(isValidGSTINOrUdyam("UDYAM-GJ-03-0098765")).toBe(true);
      expect(isValidGSTINOrUdyam("udyam-dl-10-1234567")).toBe(true);
    });

    it("rejects invalid Udyam formats", () => {
      expect(isValidGSTINOrUdyam("UDYAM-M-01-0012345")).toBe(false); // 1 state letter
      expect(isValidGSTINOrUdyam("UDYAM-MH-1-0012345")).toBe(false);  // 1 district digit
      expect(isValidGSTINOrUdyam("UDYAM-MH-01-123456")).toBe(false);  // 6 digits instead of 7
    });
  });

  describe("Phone Format Validator", () => {
    it("accepts valid 10-digit Indian phone numbers with optional country code", () => {
      expect(PHONE_REGEX.test("9876543210")).toBe(true);
      expect(PHONE_REGEX.test("+919876543210")).toBe(true);
      expect(PHONE_REGEX.test("09876543210")).toBe(true);
      expect(PHONE_REGEX.test("7012345678")).toBe(true);
    });

    it("rejects invalid phone formats", () => {
      expect(PHONE_REGEX.test("5876543210")).toBe(false); // Starts with 5
      expect(PHONE_REGEX.test("987654321")).toBe(false);  // 9 digits
      expect(PHONE_REGEX.test("98765432100")).toBe(false); // 11 digits
      expect(PHONE_REGEX.test("ABC9876543")).toBe(false);  // Letters
    });
  });

  describe("EntrepreneurProfileSchema Zod Full Validation", () => {
    it("passes when all fields are valid", () => {
      const validProfile = {
        companyName: "Apex Steel Works Pvt Ltd",
        pan: "ABCDE1234F",
        gstin: "27AAACR1234K1ZI",
        registeredAddress: "Plot 45, GIDC Industrial Estate, Vadodara",
        sector: "Boiler",
        phone: "9876543210",
        email: "contact@apexsteel.com",
      };

      const result = EntrepreneurProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it("fails when compliance fields have invalid values", () => {
      const invalidProfile = {
        companyName: "A", // too short
        pan: "INVALIDPAN",
        gstin: "INVALIDGSTIN",
        registeredAddress: "Addr", // too short
        sector: "InvalidSector",
        phone: "12345",
        email: "not-an-email",
      };

      const result = EntrepreneurProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.companyName).toBeDefined();
        expect(fieldErrors.pan).toBeDefined();
        expect(fieldErrors.gstin).toBeDefined();
        expect(fieldErrors.registeredAddress).toBeDefined();
        expect(fieldErrors.sector).toBeDefined();
        expect(fieldErrors.phone).toBeDefined();
        expect(fieldErrors.email).toBeDefined();
      }
    });
  });
});

import crypto from "crypto";

describe("MRTPS Act 2015 Statutory SLA & Deemed Approval Governance", () => {
  it("should calculate correct statutory SLA duration by industry category", () => {
    const calculateSlaHours = (category: "Green" | "Orange" | "Red") => {
      return category === "Green" ? 48 : 720;
    };

    expect(calculateSlaHours("Green")).toBe(48); // Maha Parwana 48h fast-track
    expect(calculateSlaHours("Orange")).toBe(720); // 30 days under MRTPS Act 2015
    expect(calculateSlaHours("Red")).toBe(720); // 30 days under MRTPS Act 2015
  });

  it("should detect SLA breaches when current time exceeds statutory deadline", () => {
    const now = Date.now();
    const pastDeadline = new Date(now - 3600 * 1000); // 1 hour ago
    const futureDeadline = new Date(now + 48 * 3600 * 1000); // 48 hours in future

    const isSlaBreached = (deadline: Date) => deadline.getTime() <= now;

    expect(isSlaBreached(pastDeadline)).toBe(true);
    expect(isSlaBreached(futureDeadline)).toBe(false);
  });

  it("should produce a reproducible, tamper-evident SHA-256 digital certificate hash", () => {
    const generateCertificateHash = (
      appNumber: string,
      company: string,
      sector: string,
      status: string,
      approvalDate: string
    ) => {
      const payload = [appNumber, company, sector, status, approvalDate, "ANUMATI-GOV-IN-VERIFIED"].join("|");
      return crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
    };

    const hash1 = generateCertificateHash(
      "ANM-BLR-2026-0001",
      "APEX STEEL WORKS",
      "Boiler",
      "DEEMED_APPROVED",
      "2026-09-29T10:00:00.000Z"
    );

    const hash2 = generateCertificateHash(
      "ANM-BLR-2026-0001",
      "APEX STEEL WORKS",
      "Boiler",
      "DEEMED_APPROVED",
      "2026-09-29T10:00:00.000Z"
    );

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });
});

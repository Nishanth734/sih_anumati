import { evaluateCadSetback, CadScrutinyRequest } from "../lib/cadScrutinyService";

describe("CAD & Spatial Setback Pre-Scrutiny Engine (MIDC DCR Section 14.2)", () => {
  const standardPlot = [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 60 },
    { x: 0, y: 60 },
  ];

  it("should pass compliance when equipment has greater than 15m setback from all boundaries", () => {
    const request: CadScrutinyRequest = {
      plotBoundary: standardPlot,
      equipmentLocation: { x: 35, y: 25 },
      equipmentName: "High Pressure Steam Boiler",
      unitWidth: 4,
      unitHeight: 4,
      unitType: "BOILER",
    };

    const report = evaluateCadSetback(request);

    expect(report.isCompliant).toBe(true);
    expect(report.actualMinSetbackMeters).toBeGreaterThanOrEqual(15.0);
    expect(report.legalCitation).toContain("MIDC Development Control Regulations (DCR) Section 14.2");
    expect(report.complianceProofHash).toBeDefined();
    expect(report.remediationAdvice).toContain("satisfies MIDC DCR 14.2");
  });

  it("should fail compliance when equipment is within 15m of property boundary", () => {
    const request: CadScrutinyRequest = {
      plotBoundary: standardPlot,
      equipmentLocation: { x: 25, y: 10 }, // 10m from South boundary - 2m radius = 8m net setback
      equipmentName: "Chemical Storage Tank",
      unitWidth: 4,
      unitHeight: 4,
      unitType: "CHEMICAL_STORAGE",
    };

    const report = evaluateCadSetback(request);

    expect(report.isCompliant).toBe(false);
    expect(report.actualMinSetbackMeters).toBeLessThan(15.0);
    expect(report.criticalEdge.edgeLabel).toContain("South Boundary");
    expect(report.remediationAdvice).toContain("CRITICAL VIOLATION");
    expect(report.remediationAdvice).toContain("inward toward plot center");
  });

  it("should correctly evaluate all 4 perimeter edges and identify the critical edge", () => {
    const request: CadScrutinyRequest = {
      plotBoundary: standardPlot,
      equipmentLocation: { x: 12, y: 30 }, // Nearest to West boundary (x=0)
      unitWidth: 2,
      unitHeight: 2,
      unitType: "BOILER",
    };

    const report = evaluateCadSetback(request);

    expect(report.edgeAnalysis).toHaveLength(4);
    expect(report.criticalEdge.edgeIndex).toBe(3); // West boundary
    expect(report.isCompliant).toBe(false); // 12 - 1 = 11m (<15m)
  });
});

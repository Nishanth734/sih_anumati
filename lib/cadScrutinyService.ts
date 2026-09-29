import crypto from "crypto";

export interface Point2D {
  x: number;
  y: number;
}

export interface CadScrutinyRequest {
  plotBoundary: Point2D[]; // Polygon vertices in meters (clockwise or counter-clockwise)
  equipmentLocation: Point2D; // (x, y) coordinates of boiler / hazardous unit
  equipmentName?: string;
  unitWidth?: number; // meters
  unitHeight?: number; // meters
  unitType?: "BOILER" | "CHEMICAL_STORAGE" | "TRANSFORMER" | "EFFLUENT_TANK";
}

export interface SetbackEdgeAnalysis {
  edgeIndex: number;
  edgeLabel: string;
  startPoint: Point2D;
  endPoint: Point2D;
  distanceToEdge: number; // in meters
  isCompliant: boolean;
}

export interface CadScrutinyReport {
  timestamp: string;
  complianceProofHash: string;
  statutoryThresholdMeters: number;
  actualMinSetbackMeters: number;
  isCompliant: boolean;
  legalCitation: string;
  unitType: string;
  equipmentLocation: Point2D;
  edgeAnalysis: SetbackEdgeAnalysis[];
  criticalEdge: SetbackEdgeAnalysis;
  remediationAdvice: string;
}

/**
 * Calculates perpendicular Euclidean distance from a point P to a line segment AB.
 */
function distancePointToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  // Projection parameter t
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.hypot(p.x - projX, p.y - projY);
}

const EDGE_LABELS = ["South Boundary", "East Boundary", "North Boundary", "West Boundary"];

/**
 * Evaluates geometric setback compliance according to MIDC DCR Section 14.2 & NBC 2016.
 */
export function evaluateCadSetback(data: CadScrutinyRequest): CadScrutinyReport {
  const statutoryThreshold = 15.0; // 15 meters statutory minimum
  const { plotBoundary, equipmentLocation, unitWidth = 4, unitHeight = 4 } = data;

  if (!plotBoundary || plotBoundary.length < 3) {
    throw new Error("Invalid plot geometry: At least 3 boundary vertices required.");
  }

  // Account for equipment physical footprint (half-width / half-height margin)
  const equipmentRadius = Math.max(unitWidth, unitHeight) / 2;

  let minDistance = Infinity;
  let criticalEdgeIndex = 0;
  const edgeAnalyses: SetbackEdgeAnalysis[] = [];

  for (let i = 0; i < plotBoundary.length; i++) {
    const a = plotBoundary[i];
    const b = plotBoundary[(i + 1) % plotBoundary.length];

    const rawDist = distancePointToSegment(equipmentLocation, a, b);
    // Net setback is distance from outer edge of equipment to property boundary
    const netSetback = Math.max(0, parseFloat((rawDist - equipmentRadius).toFixed(2)));

    const isEdgeCompliant = netSetback >= statutoryThreshold;
    const edgeLabel = EDGE_LABELS[i] || `Boundary Segment ${i + 1}`;

    const analysis: SetbackEdgeAnalysis = {
      edgeIndex: i,
      edgeLabel,
      startPoint: a,
      endPoint: b,
      distanceToEdge: netSetback,
      isCompliant: isEdgeCompliant,
    };

    edgeAnalyses.push(analysis);

    if (netSetback < minDistance) {
      minDistance = netSetback;
      criticalEdgeIndex = i;
    }
  }

  const isCompliant = minDistance >= statutoryThreshold;
  const criticalEdge = edgeAnalyses[criticalEdgeIndex];

  // Actionable remediation
  let remediationAdvice = "Layout satisfies MIDC DCR 14.2 perimeter setback criteria.";
  if (!isCompliant) {
    const shortfall = (statutoryThreshold - minDistance).toFixed(2);
    remediationAdvice = `CRITICAL VIOLATION: Equipment is only ${minDistance}m from ${criticalEdge.edgeLabel} (Deficit of ${shortfall}m). Relocate the ${data.equipmentName || "equipment"} at least ${shortfall}m inward toward plot center to achieve the mandatory 15.0m buffer.`;
  }

  // Cryptographic audit hash
  const hashPayload = [
    JSON.stringify(plotBoundary),
    JSON.stringify(equipmentLocation),
    minDistance,
    isCompliant,
    "MIDC-DCR-14.2-VERIFIED",
  ].join(":");

  const complianceProofHash = crypto
    .createHash("sha256")
    .update(hashPayload)
    .digest("hex")
    .toUpperCase();

  return {
    timestamp: new Date().toISOString(),
    complianceProofHash,
    statutoryThresholdMeters: statutoryThreshold,
    actualMinSetbackMeters: minDistance,
    isCompliant,
    legalCitation:
      "MIDC Development Control Regulations (DCR) Section 14.2 & National Building Code (NBC) 2016 Part 4 (Life and Fire Safety Distance Buffer)",
    unitType: data.unitType || "BOILER",
    equipmentLocation,
    edgeAnalysis: edgeAnalyses,
    criticalEdge,
    remediationAdvice,
  };
}

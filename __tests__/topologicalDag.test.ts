import { computeTopologicalTiers, STATUTORY_CLEARANCE_NODES } from "../lib/topologicalService";

describe("Topological Approval DAG & Kahn's Algorithm", () => {
  it("should have valid prerequisite references across all statutory clearance nodes", () => {
    const allNodeIds = new Set(STATUTORY_CLEARANCE_NODES.map((n) => n.id));
    for (const node of STATUTORY_CLEARANCE_NODES) {
      for (const prereq of node.prerequisites) {
        expect(allNodeIds.has(prereq)).toBe(true);
      }
    }
  });

  it("should compute valid topological tiers with Tier 0 containing only nodes with zero prerequisites", () => {
    const tiers = computeTopologicalTiers("Orange", ["LAND_ALLOTMENT"]);
    expect(tiers.length).toBeGreaterThan(1);

    // Foundational Tier 0 should only contain nodes with 0 in-degree
    for (const node of tiers[0]) {
      expect(node.prerequisites.length).toBe(0);
      expect(node.tier).toBe(0);
    }
  });

  it("should dynamically unlock ready nodes when prerequisites are approved", () => {
    // With only LAND_ALLOTMENT approved:
    const tiers1 = computeTopologicalTiers("Orange", ["LAND_ALLOTMENT"]);
    const allNodes1 = tiers1.flat();

    const landNode = allNodes1.find((n) => n.id === "LAND_ALLOTMENT");
    const fireNode = allNodes1.find((n) => n.id === "FIRE_NOC");
    const boilerNode = allNodes1.find((n) => n.id === "BOILER_REG");

    expect(landNode?.status).toBe("APPROVED");
    expect(fireNode?.status).toBe("READY"); // Prereq (LAND_ALLOTMENT) is satisfied
    expect(boilerNode?.status).toBe("LOCKED"); // Prereq (FACTORY_PLAN) is not yet satisfied
  });

  it("should fast-track Green category by omitting complex EIA/CTE requirements", () => {
    const greenTiers = computeTopologicalTiers("Green", ["LAND_ALLOTMENT"]);
    const greenNodes = greenTiers.flat();

    // SPCB Consent to Establish (CTE) is exempted for Green category
    const hasCte = greenNodes.some((n) => n.id === "POLLUTION_CTE");
    expect(hasCte).toBe(false);

    // Red category must include CTE
    const redTiers = computeTopologicalTiers("Red", ["LAND_ALLOTMENT"]);
    const redNodes = redTiers.flat();
    const hasRedCte = redNodes.some((n) => n.id === "POLLUTION_CTE");
    expect(hasRedCte).toBe(true);
  });
});

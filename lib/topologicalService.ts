export interface DAGNode {
  id: string;
  code: string;
  title: string;
  department: string;
  statutoryAct: string;
  categoryApplicability: ("Green" | "Orange" | "Red")[];
  estimatedDays: number;
  prerequisites: string[]; // List of node IDs that must be approved first
  description: string;
}

export interface ComputedTierNode extends DAGNode {
  tier: number;
  inDegree: number;
  status: "LOCKED" | "READY" | "IN_PROGRESS" | "APPROVED";
}

export const STATUTORY_CLEARANCE_NODES: DAGNode[] = [
  {
    id: "LAND_ALLOTMENT",
    code: "MIDC-01",
    title: "Industrial Plot Allotment / Possession",
    department: "State Industrial Development Corp (MIDC)",
    statutoryAct: "State Industrial Development Act, 1961",
    categoryApplicability: ["Green", "Orange", "Red"],
    estimatedDays: 7,
    prerequisites: [],
    description: "Legal boundary possession, lease deed execution, and physical plot coordinates confirmation.",
  },
  {
    id: "FIRE_NOC",
    code: "FIRE-02",
    title: "Provisional Fire Safety & Evacuation NOC",
    department: "Directorate of Fire & Emergency Services",
    statutoryAct: "National Building Code (NBC) 2016 Part 4",
    categoryApplicability: ["Orange", "Red"],
    estimatedDays: 14,
    prerequisites: ["LAND_ALLOTMENT"],
    description: "Inspection of high-pressure hydrants, peripheral access roads (min. 6m), and hazardous containment.",
  },
  {
    id: "POLLUTION_CTE",
    code: "SPCB-03",
    title: "Consent to Establish (CTE)",
    department: "State Pollution Control Board (SPCB)",
    statutoryAct: "Water Act 1974 & Air Act 1981",
    categoryApplicability: ["Orange", "Red"],
    estimatedDays: 21,
    prerequisites: ["LAND_ALLOTMENT"],
    description: "Evaluation of Effluent Treatment Plant (ETP) capacity and air scrubber chimney emission norms.",
  },
  {
    id: "FACTORY_PLAN",
    code: "DISH-04",
    title: "Factory Building Plan & Machinery Layout",
    department: "Directorate of Industrial Safety & Health (DISH)",
    statutoryAct: "Factories Act, 1948 (Section 6)",
    categoryApplicability: ["Green", "Orange", "Red"],
    estimatedDays: 10,
    prerequisites: ["LAND_ALLOTMENT", "FIRE_NOC"],
    description: "Structural stability certification, worker ventilation standards, and machine hazard guarding layout.",
  },
  {
    id: "BOILER_REG",
    code: "BLR-05",
    title: "Boiler Erection & Hydrostatic Pressure Clearance",
    department: "Inspectorate of Steam Boilers",
    statutoryAct: "Indian Boilers Act, 1923 (Section 7)",
    categoryApplicability: ["Orange", "Red"],
    estimatedDays: 15,
    prerequisites: ["FACTORY_PLAN"],
    description: "Hydrostatic pressure testing at 1.5x MAWP and certified safety relief valve calibration inspection.",
  },
  {
    id: "POLLUTION_CTO",
    code: "SPCB-06",
    title: "Consent to Operate (CTO)",
    department: "State Pollution Control Board (SPCB)",
    statutoryAct: "Environment (Protection) Act, 1986",
    categoryApplicability: ["Orange", "Red"],
    estimatedDays: 14,
    prerequisites: ["POLLUTION_CTE", "FACTORY_PLAN", "BOILER_REG"],
    description: "Final operational validation of continuous emission monitoring systems (CEMS) before commercial production.",
  },
  {
    id: "COMMERCIAL_LICENSE",
    code: "COMM-07",
    title: "Consolidated Commercial Factory License",
    department: "Ministry of Commerce & Industries",
    statutoryAct: "Maha Parwana Initiative & Industries Gazette",
    categoryApplicability: ["Green", "Orange", "Red"],
    estimatedDays: 5,
    prerequisites: ["FACTORY_PLAN"],
    description: "Final single-window consolidated operational clearance enabling industrial dispatch and power tariff subsidy.",
  },
];

/**
 * Computes topological tiers using Kahn's Algorithm.
 * Filters nodes based on industry environmental category (Green, Orange, Red).
 */
export function computeTopologicalTiers(
  category: "Green" | "Orange" | "Red" = "Orange",
  approvedNodeIds: string[] = ["LAND_ALLOTMENT"]
): ComputedTierNode[][] {
  // 1. Filter nodes applicable for selected category
  const activeNodes = STATUTORY_CLEARANCE_NODES.filter((node) =>
    node.categoryApplicability.includes(category)
  );

  const activeNodeIds = new Set(activeNodes.map((n) => n.id));

  // 2. Adjust prerequisites to only include active nodes
  const sanitizedNodes: DAGNode[] = activeNodes.map((node) => ({
    ...node,
    prerequisites: node.prerequisites.filter((pre) => activeNodeIds.has(pre)),
  }));

  // 3. Kahn's Algorithm: calculate in-degrees
  const inDegreeMap = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  sanitizedNodes.forEach((node) => {
    inDegreeMap.set(node.id, node.prerequisites.length);
    adjacencyList.set(node.id, []);
  });

  sanitizedNodes.forEach((node) => {
    node.prerequisites.forEach((preId) => {
      adjacencyList.get(preId)?.push(node.id);
    });
  });

  // 4. Group into tiers
  const nodeMap = new Map<string, DAGNode>(sanitizedNodes.map((n) => [n.id, n]));
  const tiers: ComputedTierNode[][] = [];
  let currentQueue = sanitizedNodes.filter((node) => (inDegreeMap.get(node.id) || 0) === 0);

  const inDegreeTracker = new Map(inDegreeMap);
  let currentTierIndex = 0;

  while (currentQueue.length > 0) {
    const nextQueue: DAGNode[] = [];
    const currentTierNodes: ComputedTierNode[] = [];

    currentQueue.forEach((node) => {
      const isApproved = approvedNodeIds.includes(node.id);
      const allPrereqsMet = node.prerequisites.every((pid) => approvedNodeIds.includes(pid));

      let status: ComputedTierNode["status"] = "LOCKED";
      if (isApproved) {
        status = "APPROVED";
      } else if (allPrereqsMet) {
        status = "READY";
      } else {
        status = "LOCKED";
      }

      currentTierNodes.push({
        ...node,
        tier: currentTierIndex,
        inDegree: inDegreeMap.get(node.id) || 0,
        status,
      });

      // Decrement in-degree for dependents
      const dependents = adjacencyList.get(node.id) || [];
      dependents.forEach((depId) => {
        const remaining = (inDegreeTracker.get(depId) || 1) - 1;
        inDegreeTracker.set(depId, remaining);
        if (remaining === 0) {
          const depNode = nodeMap.get(depId);
          if (depNode) nextQueue.push(depNode);
        }
      });
    });

    tiers.push(currentTierNodes);
    currentQueue = nextQueue;
    currentTierIndex++;
  }

  return tiers;
}

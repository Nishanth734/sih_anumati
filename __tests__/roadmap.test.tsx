import React from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import RoadmapStepper from "@/components/RoadmapStepper";

const mockFetch = jest.fn();
global.fetch = mockFetch;
window.fetch = mockFetch;

describe("RoadmapStepper Component", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("fetches and renders ordered roadmap steps with ARIA list roles", async () => {
    const mockRoadmapResponse = {
      success: true,
      data: {
        sector: "Boiler",
        title: "High Pressure Steam Boiler Operating & Safety Clearance Roadmap",
        description: "Statutory 4-stage sequential approval workflow under Indian Boilers Act 1923.",
        orderedSteps: [
          {
            stepNumber: 1,
            stepCode: "SITE_CLEARANCE",
            title: "Stage 1: Factory Site & Boiler Layout Clearance",
            description: "Preliminary site inspection and distance safety clearance.",
            department: "Directorate of Steam Boilers",
            requiredDocuments: ["Approved Factory Site Layout Plan", "Land Lease Deed"],
            estimatedProcessingTime: "5 - 7 Working Days",
          },
          {
            stepNumber: 2,
            stepCode: "DESIGN_REGISTRATION",
            title: "Stage 2: Boiler Design Registration & Pressure Vessel Audit",
            description: "Verification of boiler drawings and material certificates.",
            department: "Chief Inspectorate of Boilers",
            requiredDocuments: ["Manufacturer Form II & III Certificates"],
            estimatedProcessingTime: "7 - 10 Working Days",
          },
        ],
        userProgress: {
          completedStepNumbers: [1],
          currentStepNumber: 2,
          totalSteps: 2,
          applicationsCount: 1,
          activeApplicationStatus: "UNDER_REVIEW",
        },
      },
    };

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoadmapResponse),
      })
    );

    render(<RoadmapStepper initialSector="Boiler" userPrimarySector="Boiler" />);

    // Verify loading indicator first or wait for render
    await waitFor(() => {
      expect(screen.getByText("High Pressure Steam Boiler Operating & Safety Clearance Roadmap")).toBeInTheDocument();
    });

    // Verify ARIA list and listitem roles
    const list = screen.getByRole("list", { name: /Industrial Clearance Roadmap Steps/i });
    expect(list).toBeInTheDocument();

    const listItems = within(list).getAllByRole("listitem", { hidden: true }).filter((item) => item.parentElement === list);
    expect(listItems.length).toBe(2);

    // Verify Completed and Active badges
    expect(screen.getByText("Step Cleared")).toBeInTheDocument();
    expect(screen.getByText("Active Step")).toBeInTheDocument();

    // Verify aria-current="step" on active step
    const currentStepItem = listItems[1];
    expect(currentStepItem).toHaveAttribute("aria-current", "step");
  });

  it("handles unconfigured sector gracefully by rendering clear notification banner", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: null,
            sector: "UnconfiguredSector",
            message: "No roadmap configured for this sector yet.",
          }),
      })
    );

    render(<RoadmapStepper initialSector="Boiler" />);

    await waitFor(() => {
      expect(screen.getByText("Roadmap Not Configured Yet")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /View Default Sector Roadmap/i })).toBeInTheDocument();
    });
  });

  it("toggles step details accordion and aria-expanded attribute on click", async () => {
    const mockRoadmapResponse = {
      success: true,
      data: {
        sector: "Pollution",
        title: "State Pollution Control Board Clearance Roadmap",
        description: "Mandatory environmental clearances.",
        orderedSteps: [
          {
            stepNumber: 1,
            stepCode: "CTE_CLEARANCE",
            title: "Stage 1: Consent to Establish (CTE)",
            description: "Initial sanction for industrial setup.",
            department: "State Pollution Control Board",
            requiredDocuments: ["Project Report Copy", "ETP Layout Diagram"],
            estimatedProcessingTime: "10 - 15 Working Days",
          },
        ],
        userProgress: {
          completedStepNumbers: [],
          currentStepNumber: 1,
          totalSteps: 1,
          applicationsCount: 0,
          activeApplicationStatus: null,
        },
      },
    };

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoadmapResponse),
      })
    );

    render(<RoadmapStepper initialSector="Pollution" />);

    await waitFor(() => {
      expect(screen.getByText("Stage 1: Consent to Establish (CTE)")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole("button", { name: /Stage 1: Consent to Establish/i });
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

    // Click to collapse
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Mandatory Statutory Documents")).not.toBeInTheDocument();
  });
});

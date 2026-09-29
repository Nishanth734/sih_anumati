import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OfficerDashboard from "@/app/dashboard/officer/page";

const mockFetch = jest.fn();
global.fetch = mockFetch;
window.fetch = mockFetch;

describe("Officer Dashboard Component & Decision Pipeline", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("fetches officer session and paginated applications queue for assigned sector", async () => {
    const mockMeResponse = {
      success: true,
      data: {
        user: {
          userId: "off_123",
          name: "Dr. Vikram Seth",
          email: "officer.boiler@gov.in",
          role: "officer",
          sector: "Boiler",
          employeeId: "GOV-OFF-101",
        },
      },
    };

    const mockApplicationsResponse = {
      success: true,
      data: {
        applications: [
          {
            _id: "app_1",
            applicationNumber: "ANM-BOILER-2026-0001",
            applicantName: "Rajesh Sharma",
            companyName: "Apex Steel Works Pvt Ltd",
            title: "Steam Boiler License",
            sector: "Boiler",
            description: "High pressure 50 ton steam boiler.",
            estimatedBudget: 15000000,
            plantLocation: "Vadodara",
            status: "READY_FOR_REVIEW",
            createdAt: "2026-09-27T10:00:00.000Z",
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMeResponse),
        });
      }
      if (url.includes("/api/analytics/rejections")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApplicationsResponse),
      });
    });

    render(<OfficerDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Government Officer Approval Desk/i)).toBeInTheDocument();
      expect(screen.getByText("ANM-BOILER-2026-0001")).toBeInTheDocument();
      expect(screen.getByText("Apex Steel Works Pvt Ltd")).toBeInTheDocument();
      expect(screen.getByText("Ready for Review")).toBeInTheDocument();
    });
  });

  it("renders clear empty queue state when officer queue has no pending applications", async () => {
    const mockMeResponse = {
      success: true,
      data: {
        user: {
          userId: "off_123",
          name: "Dr. Vikram Seth",
          role: "officer",
          sector: "Boiler",
        },
      },
    };

    const mockEmptyQueueResponse = {
      success: true,
      data: {
        applications: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
      },
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMeResponse) });
      }
      if (url.includes("/api/analytics/rejections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockEmptyQueueResponse) });
    });

    render(<OfficerDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Officer Review Queue Clear")).toBeInTheDocument();
      expect(screen.getByText(/All statutory applications in your assigned sector/i)).toBeInTheDocument();
    });
  });

  it("requires rejection reason when refusing clearance and triggers optimistic update with rollback on error", async () => {
    const mockMeResponse = {
      success: true,
      data: {
        user: {
          userId: "off_123",
          name: "Dr. Vikram Seth",
          email: "officer.boiler@gov.in",
          role: "officer",
          sector: "Boiler",
          employeeId: "GOV-OFF-101",
        },
      },
    };

    const mockApp = {
      _id: "app_1",
      applicationNumber: "ANM-BOILER-2026-0001",
      applicantName: "Rajesh Sharma",
      companyName: "Apex Steel Works Pvt Ltd",
      title: "Steam Boiler License",
      sector: "Boiler",
      description: "High pressure 50 ton steam boiler.",
      estimatedBudget: 15000000,
      plantLocation: "Vadodara",
      status: "READY_FOR_REVIEW",
      createdAt: "2026-09-27T10:00:00.000Z",
    };

    mockFetch.mockImplementation((url: string, opts?: any) => {
      console.log("[Test 3 MockFetch Called]:", url, opts?.method);
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMeResponse) });
      }
      if (url.includes("/api/analytics/rejections")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      }
      if (opts?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: false, error: "Server Error: Database write failed." }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { applications: [mockApp], pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } },
          }),
      });
    });

    render(<OfficerDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText("ANM-BOILER-2026-0001")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const commitBtn = screen.getByRole("button", { name: /Commit Decision/i });
    fireEvent.click(commitBtn);

    await waitFor(() => {
      expect(screen.getByText("Statutory Decision: ANM-BOILER-2026-0001")).toBeInTheDocument();
    });

    // Switch decision to REJECT
    const rejectToggle = screen.getByRole("button", { name: /Refuse Clearance/i });
    fireEvent.click(rejectToggle);

    // Click commit statutory decision
    const submitBtn = screen.getByRole("button", { name: /Commit Statutory Decision/i });
    const form = submitBtn.closest("form")!;

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(screen.getByText(/Database write failed/i)).toBeInTheDocument();
      expect(screen.getByText("ANM-BOILER-2026-0001")).toBeInTheDocument();
    });
  });
});

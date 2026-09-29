import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import EntrepreneurProfileForm from "@/components/EntrepreneurProfileForm";

const mockFetch = jest.fn();
global.fetch = mockFetch;
window.fetch = mockFetch;

describe("EntrepreneurProfileForm Component", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("handles empty-profile case gracefully by displaying guidance banner", () => {
    render(<EntrepreneurProfileForm initialProfile={null} />);

    expect(screen.getByText(/Welcome! Setup your Industrial Profile/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save & Verify Profile/i })).toBeDisabled();
  });

  it("populates initial profile data and keeps save button enabled when valid", async () => {
    const validProfile = {
      companyName: "Apex Steel Works Pvt Ltd",
      pan: "ABCDE1234F",
      gstin: "UDYAM-MH-01-0012345",
      registeredAddress: "Plot 45, GIDC Industrial Complex",
      sector: "Boiler" as const,
      phone: "9876543210",
      email: "contact@apexsteel.com",
    };

    render(<EntrepreneurProfileForm initialProfile={validProfile} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Apex Steel Works Pvt Ltd")).toBeInTheDocument();
      expect(screen.getByDisplayValue("ABCDE1234F")).toBeInTheDocument();
      expect(screen.getByDisplayValue("UDYAM-MH-01-0012345")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save & Verify Profile/i })).not.toBeDisabled();
    });
  });

  it("displays inline validation errors and disables submit button for invalid GSTIN", async () => {
    const invalidGstinProfile = {
      companyName: "Apex Steel Works",
      pan: "ABCDE1234F",
      gstin: "INVALIDGSTIN123", // invalid
      registeredAddress: "Plot 45, GIDC Industrial Complex",
      sector: "Boiler" as const,
      phone: "9876543210",
      email: "contact@apexsteel.com",
    };

    render(<EntrepreneurProfileForm initialProfile={invalidGstinProfile} />);

    const gstinInput = screen.getByPlaceholderText(/27AAACR1234K1ZI or UDYAM-MH-01-0012345/i);
    fireEvent.blur(gstinInput);

    await waitFor(() => {
      expect(screen.getByText(/Invalid GSTIN or Udyam number/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save & Verify Profile/i })).toBeDisabled();
    });
  });

  it("performs optimistic UI update and rolls back with error toast when API fails", async () => {
    const initialProfile = {
      companyName: "Original Steel Corp",
      pan: "ABCDE1234F",
      gstin: "UDYAM-MH-01-0012345",
      registeredAddress: "Original Factory Address, Vadodara",
      sector: "Boiler" as const,
      phone: "9876543210",
      email: "info@originalsteel.com",
    };

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: "Server Error: Database write timeout.",
          }),
      })
    );

    render(<EntrepreneurProfileForm initialProfile={initialProfile} />);

    const companyInput = screen.getByPlaceholderText(/Apex Steel Works Pvt Ltd/i);

    await act(async () => {
      fireEvent.change(companyInput, { target: { value: "Updated Steel Corp" } });
    });

    expect(companyInput).toHaveValue("Updated Steel Corp");

    const submitBtn = screen.getByRole("button", { name: /Save & Verify Profile/i });
    await act(async () => {
      fireEvent.click(submitBtn);
      fireEvent.submit(submitBtn.closest("form")!);
    });

    // Verify optimistic rollback and error toast display
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
        })
      );
      expect(screen.getByText("State Restored")).toBeInTheDocument();
      expect(screen.getByText("Server Error: Database write timeout.")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Original Steel Corp")).toBeInTheDocument();
    });
  });
});

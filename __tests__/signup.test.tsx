import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupForm from "@/components/SignupForm";

global.fetch = jest.fn();

describe("SignupForm Component", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders entrepreneur form fields by default and allows role switching", () => {
    render(<SignupForm />);

    expect(screen.getByText(/ANUMATI Industrial Portal Registration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business PAN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company \/ Firm Name/i)).toBeInTheDocument();

    // Switch to Officer role
    const officerBtn = screen.getByRole("button", { name: /Government Officer/i });
    fireEvent.click(officerBtn);

    expect(screen.getByLabelText(/Government Officer Employee ID/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Business PAN/i)).not.toBeInTheDocument();
  });

  it("submits entrepreneur signup form and handles successful registration", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user456",
            name: "Rajesh Sharma",
            email: "rajesh@steel.com",
            role: "entrepreneur",
            sector: "Boiler",
          },
        },
      }),
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Rajesh Sharma" },
    });
    fireEvent.change(screen.getByLabelText(/Official Email Address/i), {
      target: { value: "rajesh@steel.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password \(Min 8 chars\)/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Business PAN/i), {
      target: { value: "ABCDE1234F" },
    });
    fireEvent.change(screen.getByLabelText(/Company \/ Firm Name/i), {
      target: { value: "Apex Steel Works" },
    });
    fireEvent.change(screen.getByLabelText(/Registered Factory \/ Unit Address/i), {
      target: { value: "Plot 45, GIDC Industrial Complex" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Complete Registration/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "entrepreneur",
            name: "Rajesh Sharma",
            email: "rajesh@steel.com",
            password: "Password123!",
            sector: "Boiler",
            pan: "ABCDE1234F",
            companyName: "Apex Steel Works",
            businessAddress: "Plot 45, GIDC Industrial Complex",
          }),
        })
      );
    });
  });

  it("displays field-level validation errors returned from API", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Validation failed. Please check the input fields.",
        code: "VALIDATION_ERROR",
        details: {
          pan: "Invalid PAN format. Example: ABCDE1234F",
        },
      }),
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/Official Email Address/i), { target: { value: "user@test.com" } });
    fireEvent.change(screen.getByLabelText(/Password \(Min 8 chars\)/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/Business PAN/i), { target: { value: "INVALIDPAN" } });
    fireEvent.change(screen.getByLabelText(/Company \/ Firm Name/i), { target: { value: "Test Co" } });
    fireEvent.change(screen.getByLabelText(/Registered Factory \/ Unit Address/i), { target: { value: "Test Address" } });

    fireEvent.click(screen.getByRole("button", { name: /Complete Registration/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid PAN format. Example: ABCDE1234F")).toBeInTheDocument();
    });
  });
});

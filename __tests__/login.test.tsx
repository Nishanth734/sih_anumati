import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "@/components/LoginForm";

// Mock fetch API globally
global.fetch = jest.fn();

describe("LoginForm Component", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders login form fields correctly", () => {
    render(<LoginForm />);

    expect(screen.getByText(/ANUMATI Secure Portal Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In to Dashboard/i })).toBeInTheDocument();
  });

  it("submits login data and handles successful entrepreneur authentication", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          user: {
            id: "user123",
            name: "Test Entrepreneur",
            email: "test@entrepreneur.com",
            role: "entrepreneur",
            sector: "Boiler",
          },
        },
      }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "test@entrepreneur.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In to Dashboard/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@entrepreneur.com",
            password: "Password123!",
          }),
        })
      );
    });
  });

  it("displays error message on failed login response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Invalid email address or password.",
      }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "wrong@email.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "WrongPass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In to Dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email address or password.")).toBeInTheDocument();
    });
  });
});

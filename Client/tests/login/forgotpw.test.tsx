import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import ForgotPasswordPage from "@/app/forgot-password/page";

// Suppress console.error and console.warn
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Mock the useRouter hook from Next.js
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next/link", () => {
  return ({ children }: { children: React.ReactNode }) => children;
});

// Mock the ForgotPassword function
const mockForgotPassword = jest.fn();
jest.mock('@/loader/loader', () => ({
  ForgotPassword: mockForgotPassword,
}));

describe("ForgotPasswordPage", () => {
  it("renders the Forgot Password page correctly", async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });

    // Check if the header is displayed
    expect(screen.getByText(/Mot de passe oublié \?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Saisissez votre email pour recevoir un lien de réinitialisation/i)
    ).toBeInTheDocument();

    // Check if the ForgotPasswordForm is displayed
    expect(screen.getByRole("form")).toBeInTheDocument();

    // Check if the login link is displayed
    expect(screen.getByText(/Vous vous souvenez de votre mot de passe \?/i)).toBeInTheDocument();
    expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
  });

  it("shows an error when an invalid email is inputted", async () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/Adresse email/i);
    const form = screen.getByRole("form");

    // Input an invalid email
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    });

    await act(async () => {
      fireEvent.submit(form);
    });

    // Check if the error message is displayed
    expect(screen.getByText(/Veuillez saisir une adresse email valide/i)).toBeInTheDocument();
  });

  it("navigates to the login page when the 'Retour à la connexion' link is clicked", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    await act(async () => {
      render(<ForgotPasswordPage />);
    });

    const loginLink = screen.getByText(/Retour à la connexion/i);
    await act(async () => {
      fireEvent.click(loginLink);
    });

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("navigates to the login page after successful password reset", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    // Mock ForgotPassword to simulate success
    mockForgotPassword.mockResolvedValueOnce({ success: true });

    jest.useFakeTimers(); // Use fake timers to control setTimeout

    await act(async () => {
      render(<ForgotPasswordPage />);
    });

    // Populate the email field with a valid email
    const emailInput = screen.getByLabelText(/Adresse email/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@test.fr" } });
    });

    // Simulate a successful password reset
    const forgotPasswordForm = screen.getByRole("form");
    await act(async () => {
      fireEvent.submit(forgotPasswordForm);
    });

    // Check if the mockForgotPassword was called
    expect(mockForgotPassword).toHaveBeenCalledWith("test@test.fr");

    // Fast-forward the timers to simulate the redirection delay
    jest.runAllTimers();

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/login");

    jest.useRealTimers(); // Restore real timers
  });

  it("displays an error message when the server returns an error", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    // Mock ForgotPassword to simulate a server error
    mockForgotPassword.mockResolvedValueOnce({
      success: false,
      error: "Erreur de connexion au serveur",
    });

    await act(async () => {
      render(<ForgotPasswordPage />);
    });

    // Simulate a server error during form submission
    const emailInput = screen.getByLabelText(/Adresse email/i);
    const forgotPasswordForm = screen.getByRole("form");

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });

    await act(async () => {
      fireEvent.submit(forgotPasswordForm);
    });

    // Check if the error message is displayed
    expect(screen.getByText(/Erreur de connexion au serveur/i)).toBeInTheDocument();
  });
});

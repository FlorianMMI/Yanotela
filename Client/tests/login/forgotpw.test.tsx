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
jest.mock('@/loader/loader', () => ({
  ForgotPassword: jest.fn(),
}));

// Get the mocked function
import { ForgotPassword } from '@/loader/loader';
const mockForgotPassword = ForgotPassword as jest.MockedFunction<typeof ForgotPassword>;

// Reset mocks before each test
beforeEach(() => {
  mockForgotPassword.mockReset();
});

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

  it("shows an error when email field is empty", async () => {
  render(<ForgotPasswordPage />);
  
  const form = screen.getByRole("form");
  
  // Soumettre sans rien taper
  await act(async () => {
    fireEvent.submit(form);
  });
  
  expect(screen.getByText(/Veuillez saisir votre adresse email/i)).toBeInTheDocument();
});

it("displays connection error when API throws exception", async () => {
  // Mock pour simuler une exception
  mockForgotPassword.mockRejectedValueOnce(new Error('Network error'));
  
  render(<ForgotPasswordPage />);
  
  const emailInput = screen.getByLabelText(/Adresse email/i);
  const form = screen.getByRole("form");
  
  await act(async () => {
    fireEvent.change(emailInput, { target: { value: "test@test.fr" } });
    fireEvent.submit(form);
  });
  
  expect(screen.getByText(/Erreur de connexion au serveur/i)).toBeInTheDocument();
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

  it("handles successful password reset without onSuccess callback", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    // Mock ForgotPassword to simulate success
    mockForgotPassword.mockResolvedValueOnce({ success: true });

    await act(async () => {
      // Render without onSuccess callback to test the branch where onSuccess is undefined
      render(<ForgotPasswordPage />);
    });

    // Populate the email field with a valid email
    const emailInput = screen.getByLabelText(/Adresse email/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@test.fr" } });
    });

    // Submit the form
    const forgotPasswordForm = screen.getByRole("form");
    await act(async () => {
      fireEvent.submit(forgotPasswordForm);
    });

    // Check if the success message is displayed
    expect(screen.getByText(/Un lien de réinitialisation a été envoyé/i)).toBeInTheDocument();
    
    // Verify that mockForgotPassword was called
    expect(mockForgotPassword).toHaveBeenCalledWith("test@test.fr");
  });

  it("calls onSuccess callback after timeout on successful reset", async () => {
    const mockOnSuccess = jest.fn();

    // Mock ForgotPassword to simulate success
    mockForgotPassword.mockResolvedValueOnce({ success: true });

    jest.useFakeTimers();

    // Import the component directly to test with onSuccess prop
    const ForgotPasswordForm = require('@/components/auth/ForgotPasswordForm').default;

    await act(async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
    });

    // Populate the email field with a valid email
    const emailInput = screen.getByLabelText(/Adresse email/i);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@test.fr" } });
    });

    // Submit the form
    const forgotPasswordForm = screen.getByRole("form");
    await act(async () => {
      fireEvent.submit(forgotPasswordForm);
    });

    // Verify that onSuccess is not called immediately
    expect(mockOnSuccess).not.toHaveBeenCalled();

    // Fast-forward time by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Verify that onSuccess is called after the timeout
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("handles form submission with empty email field", async () => {
    await act(async () => {
      render(<ForgotPasswordPage />);
    });

    // Submit the form without entering an email
    const forgotPasswordForm = screen.getByRole("form");
    await act(async () => {
      fireEvent.submit(forgotPasswordForm);
    });

    // Check if the validation error message is displayed
    expect(screen.getByText(/Veuillez saisir votre adresse email/i)).toBeInTheDocument();
  });
});

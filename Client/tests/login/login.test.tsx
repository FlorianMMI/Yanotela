import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Login from "@/app/login/page";

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
jest.mock('@/loader/loader', () => ({
  Login: jest.fn().mockResolvedValue({ success: true }),
}));

describe("Login Page", () => {
  it("renders the Login page correctly", async () => {
    await act(async () => {
      render(<Login />);
    });

    // Check if the welcome message is displayed
    expect(screen.getByText(/Quel plaisir de vous revoir !/i)).toBeInTheDocument();
    expect(screen.getByText(/Connectez-vous à votre compte Yanotela/i)).toBeInTheDocument();

    // Check if the login form is displayed
    expect(screen.getByRole("form")).toBeInTheDocument();

    // Check if the register link is displayed
    expect(screen.getByText(/Vous n'avez pas de compte/i)).toBeInTheDocument();
    expect(screen.getByText(/Inscrivez-vous/i)).toBeInTheDocument();
  });

  it("navigates to the register page when the 'Inscrivez-vous' link is clicked", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    await act(async () => {
      render(<Login />);
    });

    const registerLink = screen.getByText(/Inscrivez-vous/i);
    await act(async () => {
      fireEvent.click(registerLink);
    });

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/register");
  });

  it("navigates to the forgot password page when the 'Mot de passe oublié' button is clicked", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    await act(async () => {
      render(<Login />);
    });

    const forgotPasswordButton = screen.getByText(/Mot de passe oublié/i);
    await act(async () => {
      fireEvent.click(forgotPasswordButton);
    });

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/forgot-password");
  });

  it("navigates to the notes page on successful login", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    await act(async () => {
      render(<Login />);
    });

    // Simulate a successful login
    const loginForm = screen.getByRole("form");
    await act(async () => {
      fireEvent.submit(loginForm);
    });

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/notes");
  });
});

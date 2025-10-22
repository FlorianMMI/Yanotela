import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Register from "@/app/register/page";

// Mock the useRouter hook from Next.js
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Register Page", () => {
  it("renders the Register page correctly", () => {
    render(<Register />);

    // Check if the welcome message is displayed
    expect(screen.getByText(/Bienvenue à bord 👋/i)).toBeInTheDocument();

    // Check if the buttons are displayed
    expect(screen.getByText(/S'inscrire avec un mail/i)).toBeInTheDocument();
    expect(screen.getByText(/S'inscrire avec Google/i)).toBeInTheDocument();

    // Check if the login prompt is displayed
    expect(screen.getByText(/Vous avez déjà un compte/i)).toBeInTheDocument();
    expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument();
  });

  it("navigates to the register form page when the 'S'inscrire avec un mail' button is clicked", () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    render(<Register />);

    const mailButton = screen.getByText(/S'inscrire avec un mail/i);
    fireEvent.click(mailButton);

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/register/form");
  });

  it("navigates to the login page when the 'Connectez-vous' button is clicked", () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    render(<Register />);

    const loginButton = screen.getByText(/Connectez-vous/i);
    fireEvent.click(loginButton);

    // Check if the router's push method was called with the correct path
    expect(push).toHaveBeenCalledWith("/login");
  });
});

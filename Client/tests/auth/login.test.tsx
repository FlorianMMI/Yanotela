import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import LoginPage from "@/app/login/page";

// Suppress console.error and console.warn
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Mock the useRouter hook from Next.js
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    refresh: mockRefresh
  })),
}));

// Mock the Login function
jest.mock('@/loader/loader', () => ({
  Login: jest.fn(),
}));

// Import après les mocks
import { Login } from '@/loader/loader';
const mockLogin = Login as jest.MockedFunction<typeof Login>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Icon component
jest.mock('@/ui/Icon', () => {
  return function MockIcon({ name, className, size }: { name: string; className?: string; size?: number }) {
    return <div data-testid={`icon-${name}`} className={className} style={{ width: size, height: size }} />;
  };
});

describe("Login Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({ success: true });
    // Mock fetch par défaut pour l'auth check
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ authenticated: false })
    } as Response);
  });

  describe("LoginForm Component", () => {
    it("renders correctly with default props", async () => {
      await act(async () => {
        render(<LoginForm />);
      });

      expect(screen.getByText(/Quel plaisir de vous revoir !/i)).toBeInTheDocument();
      expect(screen.getByRole("form")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Votre mail ou pseudonyme/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Votre mot de passe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    });

    it("renders correctly in sidebar mode", async () => {
      await act(async () => {
        render(<LoginForm isInSidebar={true} />);
      });

      expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
      expect(screen.queryByText(/Se connecter avec Google/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Pas de compte ?/i)).toBeInTheDocument();
      expect(screen.queryByText(/Veuillez indiquer votre adresse/i)).not.toBeInTheDocument();
    });

    it("renders Google login button when not in sidebar", async () => {
      await act(async () => {
        render(<LoginForm isInSidebar={false} />);
      });

      expect(screen.getByText(/Se connecter avec Google/i)).toBeInTheDocument();
      expect(screen.getByText('ou')).toBeInTheDocument();
      expect(screen.getByText(/Vous n'avez pas de Compte ?/i)).toBeInTheDocument();
    });

    it("toggles password visibility when eye icon is clicked", async () => {
      await act(async () => {
        render(<LoginForm />);
      });

      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);
      const toggleButton = screen.getByLabelText(/Afficher le mot de passe/i);

      expect(passwordInput).toHaveAttribute('type', 'password');

      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/Cacher le mot de passe/i)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it("calls onSuccess callback when provided on successful login", async () => {
      const mockOnSuccess = jest.fn();
      mockLogin.mockResolvedValueOnce({ success: true });

      await act(async () => {
        render(<LoginForm onSuccess={mockOnSuccess} />);
      });

      const form = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("navigates to /notes when no onSuccess callback is provided", async () => {
      mockLogin.mockResolvedValueOnce({ success: true });

      await act(async () => {
        render(<LoginForm />);
      });

      const form = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/notes');
      });
    });

    it("displays error message when login fails", async () => {
      mockLogin.mockResolvedValueOnce({ 
        success: false, 
        error: 'Identifiants incorrects' 
      });

      await act(async () => {
        render(<LoginForm />);
      });

      const form = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
      });
    });

    it("displays default error message when login fails without specific error", async () => {
      mockLogin.mockResolvedValueOnce({ 
        success: false
      });

      await act(async () => {
        render(<LoginForm />);
      });

      const form = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
      });
    });

    it("displays server error when login throws an exception", async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<LoginForm />);
      });

      const form = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion au serveur')).toBeInTheDocument();
      });
    });

    it("shows loading state during form submission", async () => {
      mockLogin.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

      await act(async () => {
        render(<LoginForm />);
      });

      const form = screen.getByRole("form");
      const submitButton = screen.getByRole('button', { name: 'Se connecter' });
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      expect(submitButton).toHaveTextContent('Se connecter');
      expect(submitButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
      });

      expect(submitButton).toHaveTextContent('Connexion...');
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Se connecter');
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 200 });
    });

    it("calls custom switch callbacks when provided", async () => {
      const mockSwitchToRegister = jest.fn();
      const mockSwitchToForgot = jest.fn();

      await act(async () => {
        render(
          <LoginForm 
            onSwitchToRegister={mockSwitchToRegister}
            onSwitchToForgot={mockSwitchToForgot}
          />
        );
      });

      const registerButton = screen.getByText(/Inscrivez-vous/i);
      const forgotButton = screen.getByText(/Mot de passe oublié/i);

      await act(async () => {
        fireEvent.click(registerButton);
      });
      expect(mockSwitchToRegister).toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(forgotButton);
      });
      expect(mockSwitchToForgot).toHaveBeenCalled();
    });

    it("navigates to default routes when no custom callbacks provided", async () => {
      await act(async () => {
        render(<LoginForm />);
      });

      const registerButton = screen.getByText(/Inscrivez-vous/i);
      const forgotButton = screen.getByText(/Mot de passe oublié/i);

      await act(async () => {
        fireEvent.click(registerButton);
      });
      expect(mockPush).toHaveBeenCalledWith('/register');

      await act(async () => {
        fireEvent.click(forgotButton);
      });
      expect(mockPush).toHaveBeenCalledWith('/forgot-password');
    });

    it("hides optional elements when props are false", async () => {
      await act(async () => {
        render(
          <LoginForm 
            showTitle={false}
            showRegisterLink={false}
            showForgotLink={false}
          />
        );
      });

      expect(screen.queryByText(/Quel plaisir de vous revoir !/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Inscrivez-vous/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mot de passe oublié/i)).not.toBeInTheDocument();
    });

    it("applies custom className", async () => {
      const { container } = await act(async () => {
        return render(<LoginForm className="custom-class" />);
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it("clears error when form is resubmitted", async () => {
      mockLogin.mockResolvedValueOnce({ success: false, error: 'First error' });

      await act(async () => {
        render(<LoginForm />);
      });

      const form = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      // First submission with error
      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission should clear error initially
      mockLogin.mockResolvedValueOnce({ success: true });
      
      await act(async () => {
        fireEvent.submit(form);
      });

      // Error should be cleared immediately when form is submitted
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  describe("Login Page", () => {
    it("renders the Login page correctly", async () => {
      await act(async () => {
        render(<LoginPage />);
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
      await act(async () => {
        render(<LoginPage />);
      });

      // Wait for component to load
      await screen.findByRole("form");

      const registerLink = screen.getByText(/Inscrivez-vous/i);
      await act(async () => {
        fireEvent.click(registerLink);
      });

      // Check if the router's push method was called with the correct path
      expect(mockPush).toHaveBeenCalledWith("/register");
    });

    it("navigates to the forgot password page when the 'Mot de passe oublié' button is clicked", async () => {
      await act(async () => {
        render(<LoginPage />);
      });

      // Wait for component to load
      await screen.findByRole("form");

      const forgotPasswordButton = screen.getByText(/Mot de passe oublié/i);
      await act(async () => {
        fireEvent.click(forgotPasswordButton);
      });

      // Check if the router's push method was called with the correct path
      expect(mockPush).toHaveBeenCalledWith("/forgot-password");
    });

    it("navigates to the notes page on successful login and calls refresh", async () => {
      mockLogin.mockResolvedValueOnce({ success: true });

      await act(async () => {
        render(<LoginPage />);
      });

      // Wait for component to load
      await screen.findByRole("form");

      // Simulate a successful login by submitting the form
      const loginForm = screen.getByRole("form");
      const identifiantInput = screen.getByPlaceholderText(/Votre mail ou pseudonyme/i);
      const passwordInput = screen.getByPlaceholderText(/Votre mot de passe/i);

      await act(async () => {
        fireEvent.change(identifiantInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.submit(loginForm);
      });

      // Wait for navigation to occur
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/notes");
      });
      
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows Google login button in full mode", async () => {
      await act(async () => {
        render(<LoginPage />);
      });

      expect(screen.getByText(/Se connecter avec Google/i)).toBeInTheDocument();
      expect(screen.getByText('ou')).toBeInTheDocument();
    });

    it("redirects when user is already authenticated", async () => {
      // Mock successful auth check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true })
      } as Response);

      await act(async () => {
        render(<LoginPage />);
      });

      // Should redirect to /
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it("handles auth check error gracefully", async () => {
      // Mock fetch error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<LoginPage />);
      });

      // Wait for component to load after error
      await screen.findByRole("form");

      // Should still show login form
      expect(screen.getByRole("form")).toBeInTheDocument();
      // Should not redirect
      expect(mockPush).not.toHaveBeenCalledWith('/');
    });

    it("displays loading spinner during auth check", async () => {
      // Mock a delayed response to test loading state
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: false,
          json: async () => ({ authenticated: false })
        } as Response), 100))
      );

      await act(async () => {
        render(<LoginPage />);
      });

      // Should show loading spinner initially (check by class since no role is set)
      expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole("form")).toBeInTheDocument();
      });
    });
  });
});
import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import ReturnButton from "@/ui/returnButton";

// Mock the useRouter hook from Next.js
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    back: mockBack
  })),
}));

// Mock Icon component
jest.mock('@/ui/Icon', () => {
  return function MockIcon({ name, className, size }: { name: string; className?: string; size?: number }) {
    return <div data-testid={`icon-${name}`} className={className} style={{ width: size, height: size }} />;
  };
});

describe("ReturnButton Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<ReturnButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('self-start', 'p-0', 'h-8', 'cursor-pointer');
    
    const icon = screen.getByTestId('icon-arrow-ss-barre');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('hover:scale-75', 'transition-transform', 'duration-200');
    expect(icon).toHaveStyle({ width: '32px', height: '32px' });
  });

  it("calls router.back() when clicked", () => {
    render(<ReturnButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("has correct icon name", () => {
    render(<ReturnButton />);
    
    const icon = screen.getByTestId('icon-arrow-ss-barre');
    expect(icon).toBeInTheDocument();
  });
});
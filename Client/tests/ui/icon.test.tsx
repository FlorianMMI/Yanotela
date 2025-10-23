import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Icon from '../../src/ui/Icon';

// Suppress console.error and console.warn
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Icon Component', () => {
  it('renders an empty div when no SVG content is loaded', () => {
    render(<Icon name="nonexistent-icon" />);
    const iconElement = screen.getByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '20px', height: '20px' });
  });

  it('renders the SVG content when a valid icon name is provided', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>'
          ),
      })
    ) as jest.Mock;

    render(<Icon name="mail" size={40} />);
    const iconElement = await screen.findByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '40px', height: '40px' });
    expect(iconElement.innerHTML).toContain('<svg');
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Fetch error'))) as jest.Mock;

    render(<Icon name="error-icon" />);
    const iconElement = screen.getByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '20px', height: '20px' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Icon from '../../src/ui/Icon';

// Suppress console.error and console.warn
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Clean up fetch mocks before each test
beforeEach(() => {
  jest.restoreAllMocks();
});

describe('Icon Component', () => {
  it('renders an empty div when no SVG content is loaded', async () => {
    // Mock fetch to simulate a failed request
    global.fetch = jest.fn(() => Promise.reject(new Error('Icon not found'))) as jest.Mock;
    
    render(<Icon name="nonexistent-icon" />);
    const iconElement = screen.getByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '20px', height: '20px' });
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(iconElement.innerHTML).toBe('');
    });
  });

  it('renders the SVG content when a valid icon name is provided', async () => {
    const mockSvgContent = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg width="800px" height="800px" viewBox="0 -3.5 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"><title>mail</title><desc>Created with Sketch Beta.</desc><defs></defs><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"><g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-414.000000, -261.000000)" fill="currentColor"><path d="M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z" id="mail" sketch:type="MSShapeGroup"></path></g></g></svg>';
    
    // Extract the specific path data for verification
    const expectedPathData = "M430,275.916 L426.684,273.167 L415.115,285.01 L444.591,285.01 L433.235,273.147 L430,275.916 L430,275.916 Z M434.89,271.89 L445.892,283.329 C445.955,283.107 446,282.877 446,282.634 L446,262.862 L434.89,271.89 L434.89,271.89 Z M414,262.816 L414,282.634 C414,282.877 414.045,283.107 414.108,283.329 L425.147,271.927 L414,262.816 L414,262.816 Z M445,261 L415,261 L430,273.019 L445,261 L445,261 Z";
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockSvgContent),
      })
    ) as jest.Mock;

    render(<Icon name="mail" size={40} />);
    const iconElement = screen.getByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '40px', height: '40px' });
        
    // Wait for the SVG content to be loaded and rendered
    await waitFor(() => {
      expect(iconElement.innerHTML).toContain('<svg');
    });

    // Verify that the specific path data is present in the rendered SVG
    await waitFor(() => {
      expect(iconElement.innerHTML).toContain(expectedPathData);
    });
    
    // Verify that the SVG has been properly sized
    await waitFor(() => {
      expect(iconElement.innerHTML).toContain('width="40"');
      expect(iconElement.innerHTML).toContain('height="40"');
    });
    
    // Verify the fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('/mail.svg');
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Fetch error'))) as jest.Mock;

    render(<Icon name="error-icon" />);
    const iconElement = screen.getByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '20px', height: '20px' });
    
    // Wait for the error handling to complete
    await waitFor(() => {
      expect(iconElement.innerHTML).toBe('');
    });
  });

  it('handles non-ok HTTP responses gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      })
    ) as jest.Mock;

    render(<Icon name="missing-icon" />);
    const iconElement = screen.getByRole('img', { hidden: true });
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveStyle({ width: '20px', height: '20px' });
    
    // Wait for the response handling to complete
    await waitFor(() => {
      expect(iconElement.innerHTML).toBe('');
    });
  });
});

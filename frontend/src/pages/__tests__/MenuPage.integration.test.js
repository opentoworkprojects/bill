/**
 * Integration tests for MenuPage optimistic updates
 * Tests the complete flow of optimistic updates with API integration
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';
import MenuPage from '../MenuPage';
import { apiWithRetry } from '../../utils/apiClient';

// Mock CSS imports
jest.mock('@/App.css', () => ({}), { virtual: true });

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>,
  Navigate: () => <div>Navigate</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }))
}));

// Mock @vercel/analytics
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null
}));

// Mock dependencies
jest.mock('sonner');
jest.mock('../../utils/apiClient');
jest.mock('../../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/BulkUpload', () => () => <div>BulkUpload</div>);
jest.mock('../../components/TrialBanner', () => () => <div>TrialBanner</div>);
jest.mock('../../components/ValidationAlert', () => () => <div>ValidationAlert</div>);

describe('MenuPage Integration Tests - Optimistic Updates', () => {
  const mockUser = { role: 'admin', id: 1 };
  
  beforeEach(() => {
    jest.clearAllMocks();
    toast.success = jest.fn();
    toast.error = jest.fn();
    toast.info = jest.fn();
    localStorage.clear();
  });

  describe('Create Item Flow', () => {
    test('create → success flow shows optimistic item then confirms', async () => {
      // Mock initial fetch
      apiWithRetry.mockResolvedValueOnce({
        data: []
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Open dialog
      const addButton = screen.getByTestId('add-menu-button');
      fireEvent.click(addButton);

      // Fill form
      const nameInput = screen.getByTestId('menu-name-input');
      const categoryInput = screen.getByTestId('menu-category-input');
      const priceInput = screen.getByTestId('menu-price-input');

      fireEvent.change(nameInput, { target: { value: 'Test Pizza' } });
      fireEvent.change(categoryInput, { target: { value: 'Main Course' } });
      fireEvent.change(priceInput, { target: { value: '299' } });

      // Mock create API call
      apiWithRetry.mockResolvedValueOnce({
        data: {
          id: 'server-id-123',
          name: 'Test Pizza',
          category: 'Main Course',
          price: 299,
          available: true,
          preparation_time: 15,
          created_at: new Date().toISOString()
        }
      });

      // Mock fetch after create
      apiWithRetry.mockResolvedValueOnce({
        data: [{
          id: 'server-id-123',
          name: 'Test Pizza',
          category: 'Main Course',
          price: 299,
          available: true
        }]
      });

      // Submit form
      const saveButton = screen.getByTestId('save-menu-button');
      fireEvent.click(saveButton);

      // Should show optimistic item immediately with pending indicator
      await waitFor(() => {
        expect(screen.getByText('Test Pizza')).toBeInTheDocument();
      });

      // Should show pending indicator
      expect(screen.getByText(/Creating.../i)).toBeInTheDocument();

      // Wait for API call to complete
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Menu item created successfully!');
      });

      // Pending indicator should be gone
      await waitFor(() => {
        expect(screen.queryByText(/Creating.../i)).not.toBeInTheDocument();
      });
    });

    test('create → failure → rollback flow removes optimistic item', async () => {
      // Mock initial fetch
      apiWithRetry.mockResolvedValueOnce({
        data: []
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Open dialog and fill form
      fireEvent.click(screen.getByTestId('add-menu-button'));
      fireEvent.change(screen.getByTestId('menu-name-input'), { target: { value: 'Test Pizza' } });
      fireEvent.change(screen.getByTestId('menu-category-input'), { target: { value: 'Main Course' } });
      fireEvent.change(screen.getByTestId('menu-price-input'), { target: { value: '299' } });

      // Mock create API call to fail
      apiWithRetry.mockRejectedValueOnce({
        response: { data: { detail: 'Server error' } }
      });

      // Submit form
      fireEvent.click(screen.getByTestId('save-menu-button'));

      // Should show optimistic item briefly
      await waitFor(() => {
        expect(screen.getByText('Test Pizza')).toBeInTheDocument();
      });

      // Wait for rollback
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Server error',
          expect.objectContaining({
            action: expect.objectContaining({
              label: 'Retry'
            })
          })
        );
      });

      // Optimistic item should be removed
      await waitFor(() => {
        expect(screen.queryByText('Test Pizza')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Item Flow', () => {
    test('delete → success flow removes item immediately', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Pizza',
        category: 'Main Course',
        price: 299,
        available: true
      };

      // Mock initial fetch
      apiWithRetry.mockResolvedValueOnce({
        data: [mockItem]
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });

      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      // Mock delete API call
      apiWithRetry.mockResolvedValueOnce({});

      // Mock fetch after delete
      apiWithRetry.mockResolvedValueOnce({
        data: []
      });

      // Click delete button
      const deleteButton = screen.getByTestId('delete-menu-item-1');
      fireEvent.click(deleteButton);

      // Item should be removed immediately
      await waitFor(() => {
        expect(screen.queryByText('Pizza')).not.toBeInTheDocument();
      });

      // Should show undo toast
      expect(toast.success).toHaveBeenCalledWith(
        'Item deleted',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Undo'
          })
        })
      );

      // Wait for final confirmation
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Menu item deleted successfully!');
      }, { timeout: 4000 });
    });

    test('delete → failure → restore flow brings item back', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Pizza',
        category: 'Main Course',
        price: 299,
        available: true
      };

      // Mock initial fetch
      apiWithRetry.mockResolvedValueOnce({
        data: [mockItem]
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => true);

      // Mock delete API call to fail
      apiWithRetry.mockRejectedValueOnce({
        response: { data: { detail: 'Cannot delete' } }
      });

      // Click delete
      fireEvent.click(screen.getByTestId('delete-menu-item-1'));

      // Item removed optimistically
      await waitFor(() => {
        expect(screen.queryByText('Pizza')).not.toBeInTheDocument();
      });

      // Wait for rollback
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      }, { timeout: 4000 });

      // Item should be restored
      await waitFor(() => {
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle Availability Flow', () => {
    test('toggle → success flow updates immediately', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Pizza',
        category: 'Main Course',
        price: 299,
        available: true
      };

      apiWithRetry.mockResolvedValueOnce({
        data: [mockItem]
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
      });

      // Mock toggle API call
      apiWithRetry.mockResolvedValueOnce({
        data: { ...mockItem, available: false }
      });

      // Mock fetch after toggle
      apiWithRetry.mockResolvedValueOnce({
        data: [{ ...mockItem, available: false }]
      });

      // Find and click availability toggle button
      const card = screen.getByTestId('menu-item-item-1');
      const toggleButton = within(card).getAllByRole('button')[0]; // First button is availability toggle
      fireEvent.click(toggleButton);

      // Should update immediately
      await waitFor(() => {
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
      });

      // Should show success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('unavailable'));
      });
    });

    test('toggle → failure → revert flow restores original state', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Pizza',
        category: 'Main Course',
        price: 299,
        available: true
      };

      apiWithRetry.mockResolvedValueOnce({
        data: [mockItem]
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
      });

      // Mock toggle API call to fail
      apiWithRetry.mockRejectedValueOnce({
        response: { data: { detail: 'Update failed' } }
      });

      // Click toggle
      const card = screen.getByTestId('menu-item-item-1');
      const toggleButton = within(card).getAllByRole('button')[0];
      fireEvent.click(toggleButton);

      // Should update optimistically
      await waitFor(() => {
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
      });

      // Wait for rollback
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Should revert to original state
      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle Popularity Flow', () => {
    test('toggle popularity → success flow', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Pizza',
        category: 'Main Course',
        price: 299,
        available: true,
        is_popular: false
      };

      apiWithRetry.mockResolvedValueOnce({
        data: [mockItem]
      });

      render(<MenuPage user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });

      // Mock toggle API call
      apiWithRetry.mockResolvedValueOnce({
        data: { ...mockItem, is_popular: true }
      });

      // Mock fetch after toggle
      apiWithRetry.mockResolvedValueOnce({
        data: [{ ...mockItem, is_popular: true }]
      });

      // Click popularity toggle (second button)
      const card = screen.getByTestId('menu-item-item-1');
      const buttons = within(card).getAllByRole('button');
      const popularityButton = buttons[1]; // Second button is popularity toggle
      fireEvent.click(popularityButton);

      // Should show success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('marked as popular'));
      });
    });
  });
});

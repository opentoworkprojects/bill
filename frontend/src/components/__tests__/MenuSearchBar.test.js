import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuSearchBar from '../MenuSearchBar';

// Mock menu items for testing
const mockMenuItems = [
  {
    id: '1',
    name: 'Cheese Burger',
    category: 'burgers',
    price: 150,
    description: 'Delicious cheese burger with fries',
    available: true
  },
  {
    id: '2',
    name: 'Veggie Pizza',
    category: 'pizza',
    price: 250,
    description: 'Fresh vegetable pizza',
    available: true
  },
  {
    id: '3',
    name: 'Chicken Wings',
    category: 'appetizers',
    price: 180,
    description: 'Spicy chicken wings',
    available: false
  },
  {
    id: '4',
    name: 'Caesar Salad',
    category: 'salads',
    price: 120,
    description: 'Classic caesar salad',
    available: true
  }
];

describe('MenuSearchBar Component', () => {
  let mockOnAddItem;
  let mockOnSearchChange;

  beforeEach(() => {
    mockOnAddItem = jest.fn();
    mockOnSearchChange = jest.fn();
  });

  test('renders search input with placeholder', () => {
    render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByTestId('menu-search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search menu items'));
  });

  test('calls onSearchChange when typing in search input', () => {
    render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByTestId('menu-search-input');
    fireEvent.change(searchInput, { target: { value: 'burger' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('burger');
  });

  test('displays filtered results after debounce delay', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    // Update with search query
    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="burger"
        onSearchChange={mockOnSearchChange}
      />
    );

    // Wait for debounce (100ms) and dropdown to appear
    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    }, { timeout: 200 });

    // Should show Cheese Burger
    expect(screen.getByText('Cheese Burger')).toBeInTheDocument();
    expect(screen.getByText('burgers')).toBeInTheDocument();
  });

  test('filters items by name, category, and description', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    // Search by name
    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="pizza"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Veggie Pizza')).toBeInTheDocument();
    });

    // Search by category
    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="salads"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
    });
  });

  test('shows no results message when no items match', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="nonexistent"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('no-results-message')).toBeInTheDocument();
      expect(screen.getByText('No menu items found')).toBeInTheDocument();
    });
  });

  test('calls onAddItem when clicking on a search result', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="burger"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    });

    const firstResult = screen.getByTestId('search-result-0');
    fireEvent.click(firstResult);

    expect(mockOnAddItem).toHaveBeenCalledWith(mockMenuItems[0]);
  });

  test('clears search when clear button is clicked', () => {
    render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="burger"
        onSearchChange={mockOnSearchChange}
      />
    );

    const clearButton = screen.getByTestId('clear-search-button');
    fireEvent.click(clearButton);

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  test('handles keyboard navigation - ArrowDown', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="e"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('menu-search-input');
    
    // Press ArrowDown to select next item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    // First item should have selected styling
    const firstResult = screen.getByTestId('search-result-0');
    expect(firstResult).toHaveClass('bg-violet-100');
  });

  test('handles keyboard navigation - Enter to select', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="burger"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('menu-search-input');
    
    // Press Enter to select first item
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnAddItem).toHaveBeenCalledWith(mockMenuItems[0]);
  });

  test('handles keyboard navigation - Escape to clear', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="burger"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('menu-search-input');
    
    // Press Escape to clear search
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  test('displays unavailable badge for unavailable items', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="chicken"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chicken Wings')).toBeInTheDocument();
    });

    expect(screen.getByText('Currently Unavailable')).toBeInTheDocument();
  });

  test('displays price for each item', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="burger"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('₹150.00')).toBeInTheDocument();
    });
  });

  test('case-insensitive search', async () => {
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    // Search with uppercase
    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="BURGER"
        onSearchChange={mockOnSearchChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cheese Burger')).toBeInTheDocument();
    });
  });

  test('handles empty menu items array', () => {
    render(
      <MenuSearchBar
        menuItems={[]}
        onAddItem={mockOnAddItem}
        searchQuery="test"
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByTestId('menu-search-input');
    expect(searchInput).toBeInTheDocument();
  });

  test('debounces search query correctly', async () => {
    jest.useFakeTimers();
    
    const { rerender } = render(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );

    // Type quickly
    rerender(
      <MenuSearchBar
        menuItems={mockMenuItems}
        onAddItem={mockOnAddItem}
        searchQuery="b"
        onSearchChange={mockOnSearchChange}
      />
    );

    // Dropdown should not appear immediately
    expect(screen.queryByTestId('search-dropdown')).not.toBeInTheDocument();

    // Fast forward 100ms (debounce delay)
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});

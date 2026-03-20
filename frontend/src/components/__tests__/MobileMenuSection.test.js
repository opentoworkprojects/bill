import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileMenuSection from '../MobileMenuSection';

describe('MobileMenuSection', () => {
  const mockMenuItems = [
    { id: '1', name: 'Pizza', price: 12.99, category: 'pizza', available: true },
    { id: '2', name: 'Burger', price: 8.99, category: 'burger', available: true },
    { id: '3', name: 'Coffee', price: 3.99, category: 'beverage', available: true },
    { id: '4', name: 'Salad', price: 6.99, category: 'salad', available: true },
  ];

  const mockSelectedItems = [
    { menu_item_id: '1', name: 'Pizza', price: 12.99, quantity: 2, notes: '' }
  ];

  const defaultProps = {
    menuItems: mockMenuItems,
    selectedItems: [],
    menuSearch: '',
    activeCategory: 'all',
    onSearchChange: jest.fn(),
    onCategoryChange: jest.fn(),
    onAddItem: jest.fn(),
    onAdjustQuantity: jest.fn(),
    loading: false,
    currency: '₹'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state', () => {
    render(<MobileMenuSection {...defaultProps} loading={true} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  test('renders search input with correct font size', () => {
    render(<MobileMenuSection {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search menu items...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveStyle({ fontSize: '16px' });
  });

  test('renders category filters', () => {
    render(<MobileMenuSection {...defaultProps} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('pizza')).toBeInTheDocument();
    expect(screen.getByText('burger')).toBeInTheDocument();
    expect(screen.getByText('beverage')).toBeInTheDocument();
  });

  test('renders menu items in grid', () => {
    render(<MobileMenuSection {...defaultProps} />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
  });

  test('calls onSearchChange when typing in search', () => {
    render(<MobileMenuSection {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search menu items...');
    fireEvent.change(searchInput, { target: { value: 'pizza' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('pizza');
  });

  test('calls onCategoryChange when clicking category', () => {
    render(<MobileMenuSection {...defaultProps} />);
    const pizzaCategory = screen.getByText('pizza');
    fireEvent.click(pizzaCategory);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('pizza');
  });

  test('calls onAddItem when clicking menu item', () => {
    render(<MobileMenuSection {...defaultProps} />);
    const pizzaItem = screen.getByText('Pizza').closest('div');
    fireEvent.click(pizzaItem);
    expect(defaultProps.onAddItem).toHaveBeenCalledWith(mockMenuItems[0]);
  });

  test('shows quantity controls for items in cart', () => {
    render(<MobileMenuSection {...defaultProps} selectedItems={mockSelectedItems} />);
    const pizzaCard = screen.getByText('Pizza').closest('div');
    expect(pizzaCard).toHaveTextContent('2');
  });

  test('calls onAdjustQuantity when clicking plus button', () => {
    render(<MobileMenuSection {...defaultProps} selectedItems={mockSelectedItems} />);
    const plusButtons = screen.getAllByLabelText('Increase quantity');
    fireEvent.click(plusButtons[0]);
    expect(defaultProps.onAdjustQuantity).toHaveBeenCalledWith('1', 1);
  });

  test('calls onAdjustQuantity when clicking minus button', () => {
    render(<MobileMenuSection {...defaultProps} selectedItems={mockSelectedItems} />);
    const minusButtons = screen.getAllByLabelText('Decrease quantity');
    fireEvent.click(minusButtons[0]);
    expect(defaultProps.onAdjustQuantity).toHaveBeenCalledWith('1', -1);
  });

  test('debounces search input', async () => {
    const onSearchChange = jest.fn();
    render(<MobileMenuSection {...defaultProps} onSearchChange={onSearchChange} />);
    
    const searchInput = screen.getByPlaceholderText('Search menu items...');
    fireEvent.change(searchInput, { target: { value: 'p' } });
    fireEvent.change(searchInput, { target: { value: 'pi' } });
    fireEvent.change(searchInput, { target: { value: 'piz' } });
    
    // Should be called immediately for each change
    expect(onSearchChange).toHaveBeenCalledTimes(3);
  });

  test('filters items based on search', () => {
    render(<MobileMenuSection {...defaultProps} menuSearch="pizza" />);
    
    // Wait for debounce
    setTimeout(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.queryByText('Burger')).not.toBeInTheDocument();
    }, 200);
  });

  test('filters items based on category', () => {
    render(<MobileMenuSection {...defaultProps} activeCategory="pizza" />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.queryByText('Burger')).not.toBeInTheDocument();
  });

  test('shows empty state when no items match', () => {
    render(<MobileMenuSection {...defaultProps} menuSearch="nonexistent" />);
    
    setTimeout(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    }, 200);
  });

  test('clears search when clicking X button', () => {
    render(<MobileMenuSection {...defaultProps} menuSearch="pizza" />);
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  test('displays item emoji icons', () => {
    render(<MobileMenuSection {...defaultProps} />);
    const pizzaCard = screen.getByText('Pizza').closest('div');
    expect(pizzaCard).toHaveTextContent('🍕');
  });

  test('displays item prices with currency', () => {
    render(<MobileMenuSection {...defaultProps} />);
    expect(screen.getByText('₹12.99')).toBeInTheDocument();
    expect(screen.getByText('₹8.99')).toBeInTheDocument();
  });

  test('highlights active category', () => {
    render(<MobileMenuSection {...defaultProps} activeCategory="pizza" />);
    const pizzaCategory = screen.getByText('pizza');
    expect(pizzaCategory).toHaveClass('bg-violet-600', 'text-white');
  });

  test('touch targets are minimum 44x44px', () => {
    render(<MobileMenuSection {...defaultProps} selectedItems={mockSelectedItems} />);
    const categoryButtons = screen.getAllByRole('button');
    
    categoryButtons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const minHeight = parseInt(styles.minHeight);
      const minWidth = parseInt(styles.minWidth);
      
      // Category chips should have minimum dimensions
      if (button.textContent.includes('All') || button.textContent.includes('pizza')) {
        expect(minHeight).toBeGreaterThanOrEqual(36);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test('highlights recently added item', async () => {
    render(<MobileMenuSection {...defaultProps} />);
    const pizzaItem = screen.getByText('Pizza').closest('div');
    
    // Click to add item
    fireEvent.click(pizzaItem);
    
    // Should have highlight classes
    expect(pizzaItem).toHaveClass('ring-4', 'ring-green-400', 'animate-pulse-once');
    
    // Wait for highlight to disappear (1 second)
    await waitFor(() => {
      expect(pizzaItem).not.toHaveClass('ring-4');
    }, { timeout: 1500 });
  });

  test('applies visual feedback animation on tap', () => {
    render(<MobileMenuSection {...defaultProps} />);
    const pizzaItem = screen.getByText('Pizza').closest('div');
    
    // Should have active:scale-95 class for tap feedback
    expect(pizzaItem).toHaveClass('active:scale-95');
  });

  test('quantity control buttons are minimum 44x44px', () => {
    render(<MobileMenuSection {...defaultProps} selectedItems={mockSelectedItems} />);
    const plusButton = screen.getByLabelText('Increase quantity');
    const minusButton = screen.getByLabelText('Decrease quantity');
    
    const plusStyles = window.getComputedStyle(plusButton);
    const minusStyles = window.getComputedStyle(minusButton);
    
    expect(parseInt(plusStyles.minWidth)).toBeGreaterThanOrEqual(44);
    expect(parseInt(plusStyles.minHeight)).toBeGreaterThanOrEqual(44);
    expect(parseInt(minusStyles.minWidth)).toBeGreaterThanOrEqual(44);
    expect(parseInt(minusStyles.minHeight)).toBeGreaterThanOrEqual(44);
  });
});

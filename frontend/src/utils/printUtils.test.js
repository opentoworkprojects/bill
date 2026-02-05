// Test file for printUtils.js
import { printThermal, manualPrintReceipt } from './printUtils';

// Mock toast to avoid errors in tests
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('printUtils', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock user data in localStorage
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({
          business_settings: {
            print_customization: {
              paper_width: '80mm',
              font_size: 'medium',
              auto_print: false
            }
          }
        });
      }
      return null;
    });
  });

  test('printThermal with forceDialog=false should not trigger print dialogs', () => {
    // Mock window.open to detect if print dialog is triggered
    const mockOpen = jest.fn();
    global.window.open = mockOpen;
    
    // Mock Electron API as not available
    global.window.electronAPI = undefined;
    
    // Mock Bluetooth as not connected
    global.navigator.bluetooth = undefined;
    
    // Mock Web Serial as not available
    global.navigator.serial = undefined;
    
    const htmlContent = '<div>Test Receipt</div>';
    
    // Call printThermal with forceDialog=false
    const result = printThermal(htmlContent, '80mm', false);
    
    // Should not open any print windows
    expect(mockOpen).not.toHaveBeenCalled();
    
    // Should return true (silent print preparation)
    expect(result).toBe(true);
  });

  test('manualPrintReceipt should use silent printing', async () => {
    // Mock window.open to detect if print dialog is triggered
    const mockOpen = jest.fn();
    global.window.open = mockOpen;
    
    // Mock Electron API as not available
    global.window.electronAPI = undefined;
    
    const mockOrder = {
      id: 'test-123',
      order_number: 'TEST001',
      table_number: 1,
      items: [
        { name: 'Test Item', quantity: 1, price: 100 }
      ],
      subtotal: 100,
      tax: 10,
      total: 110,
      created_at: new Date().toISOString()
    };
    
    // Call manualPrintReceipt
    const result = await manualPrintReceipt(mockOrder);
    
    // Should not open any print windows (no dialogs)
    expect(mockOpen).not.toHaveBeenCalled();
    
    // Should return true (silent print preparation)
    expect(result).toBe(true);
  });

  test('printThermal with forceDialog=true should trigger print dialog', () => {
    // Mock window.open to simulate print dialog
    const mockOpen = jest.fn().mockReturnValue({
      document: {
        write: jest.fn(),
        close: jest.fn()
      }
    });
    global.window.open = mockOpen;
    
    const htmlContent = '<div>Test Receipt</div>';
    
    // Call printThermal with forceDialog=true
    const result = printThermal(htmlContent, '80mm', true);
    
    // Should open a print window
    expect(mockOpen).toHaveBeenCalledWith('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
    
    // Should return true
    expect(result).toBe(true);
  });
});
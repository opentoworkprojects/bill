/**
 * Menu Search Utility Functions
 * 
 * Pure functions for filtering and searching menu items.
 * These functions are extracted for testability and reusability.
 */

/**
 * Filters menu items based on a search query
 * 
 * @param {Array} menuItems - Array of menu item objects
 * @param {string} query - Search query string
 * @returns {Array} Filtered array of menu items
 */
export const filterMenuItems = (menuItems, query) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  return menuItems.filter(item => {
    const nameMatch = item.name && item.name.toLowerCase().includes(normalizedQuery);
    const categoryMatch = item.category && item.category.toLowerCase().includes(normalizedQuery);
    const descriptionMatch = item.description && item.description.toLowerCase().includes(normalizedQuery);

    return nameMatch || categoryMatch || descriptionMatch;
  });
};

/**
 * Validates that a menu item has all required fields
 * 
 * @param {Object} item - Menu item object
 * @returns {boolean} True if item has all required fields
 */
export const hasRequiredFields = (item) => {
  return (
    item &&
    typeof item.name === 'string' &&
    item.name.length > 0 &&
    typeof item.category === 'string' &&
    item.category.length > 0 &&
    typeof item.price === 'number' &&
    !isNaN(item.price)
  );
};

/**
 * Validates that all items in an array have required fields
 * 
 * @param {Array} items - Array of menu items
 * @returns {boolean} True if all items have required fields
 */
export const allItemsHaveRequiredFields = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return true; // Empty array is valid
  }

  return items.every(hasRequiredFields);
};

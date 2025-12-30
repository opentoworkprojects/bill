import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { ChefHat, Search, Leaf, Drumstick, Star, Clock, Phone } from 'lucide-react';

const PublicMenuPage = () => {
  const { orgId } = useParams();
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchMenu();
  }, [orgId]);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/public/view-menu/${orgId}`);
      setMenuData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuData?.items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = menuData?.categories ? Object.keys(menuData.categories) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Menu Not Available</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {menuData.logo_url ? (
              <img src={menuData.logo_url} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{menuData.restaurant_name}</h1>
              {menuData.tagline && <p className="text-sm text-gray-500">{menuData.tagline}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {selectedCategory === 'all' ? (
          // Show all categories
          categories.map(category => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-1 bg-orange-500 rounded"></span>
                {category}
                <span className="text-sm font-normal text-gray-500">
                  ({menuData.categories[category]?.length || 0} items)
                </span>
              </h2>
              <div className="grid gap-4">
                {menuData.categories[category]?.filter(item => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(item => (
                  <MenuItem key={item.id} item={item} currency={menuData.currency_symbol} />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Show filtered items
          <div className="grid gap-4">
            {filteredItems.map(item => (
              <MenuItem key={item.id} item={item} currency={menuData.currency_symbol} />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No items found for "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-orange-600">BillByteKOT</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ item, currency }) => {
  const isVeg = item.is_veg !== false; // Default to veg if not specified
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Item Image */}
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-8 h-8 text-orange-400" />
          </div>
        )}
        
        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Veg/Non-veg indicator */}
              <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                isVeg ? 'border-green-600' : 'border-red-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
              </span>
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
            </div>
            {item.is_bestseller && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Bestseller
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-gray-900">
              {currency}{item.price}
            </span>
            {item.prep_time && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.prep_time} min
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMenuPage;

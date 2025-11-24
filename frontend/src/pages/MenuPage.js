import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Upload, X } from 'lucide-react';

const MenuPage = ({ user }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image_url: '',
    available: true,
    preparation_time: 15
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data);
      setFilteredItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch menu items');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ ...formData, image_url: response.data.image_url });
      setImagePreview(response.data.image_url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API}/menu/${editingItem.id}`, formData);
        toast.success('Menu item updated!');
      } else {
        await axios.post(`${API}/menu`, formData);
        toast.success('Menu item created!');
      }
      setDialogOpen(false);
      fetchMenuItems();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API}/menu/${id}`);
      toast.success('Menu item deleted!');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      description: '',
      image_url: '',
      available: true,
      preparation_time: 15
    });
    setEditingItem(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      image_url: item.image_url || '',
      available: item.available,
      preparation_time: item.preparation_time || 15
    });
    setImagePreview(item.image_url || '');
    setDialogOpen(true);
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="menu-page">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Menu Management</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant menu items</p>
          </div>
          {['admin', 'cashier'].includes(user?.role) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600" data-testid="add-menu-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="menu-dialog">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="menu-name-input"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        data-testid="menu-category-input"
                      />
                    </div>
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        data-testid="menu-price-input"
                      />
                    </div>
                    <div>
                      <Label>Prep Time (mins)</Label>
                      <Input
                        type="number"
                        value={formData.preparation_time}
                        onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="menu-description-input"
                    />
                  </div>
                  <div>
                    <Label>Menu Image</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('');
                              setFormData({ ...formData, image_url: '' });
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Or enter image URL below (optional)</p>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="available" className="cursor-pointer">Available</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600" data-testid="save-menu-button">
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="menu-search-input"
            />
          </div>
        </div>

        {categories.map((category) => {
          const categoryItems = filteredItems.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4 capitalize">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryItems.map((item) => (
                  <Card key={item.id} className={`card-hover border-0 shadow-lg ${!item.available ? 'opacity-60' : ''}`} data-testid={`menu-item-${item.id}`}>
                    {item.image_url && (
                      <div className="h-40 overflow-hidden rounded-t-lg">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                        </div>
                        <span className="text-lg font-bold text-violet-600">₹{item.price}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.description && <p className="text-sm text-gray-600 mb-3">{item.description}</p>}
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                        {['admin', 'cashier'].includes(user?.role) && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)} data-testid={`edit-menu-${item.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user?.role === 'admin' && (
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(item.id)} data-testid={`delete-menu-${item.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No menu items found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MenuPage;

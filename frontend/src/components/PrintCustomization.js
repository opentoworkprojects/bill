import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { 
  Printer, 
  Settings, 
  Maximize2, 
  Type, 
  AlignCenter, 
  Layout,
  Eye,
  Save,
  RotateCcw,
  Palette,
  FileText,
  Hash,
  Smartphone,
  Monitor
} from 'lucide-react';

const PrintCustomization = ({ businessSettings, onUpdate }) => {
  const [customization, setCustomization] = useState({
    paper_width: businessSettings?.print_settings?.paper_width || '80mm',
    font_size: businessSettings?.print_settings?.font_size || 'medium',
    header_style: businessSettings?.print_settings?.header_style || 'centered',
    show_logo: businessSettings?.print_settings?.show_logo ?? true,
    show_address: businessSettings?.print_settings?.show_address ?? true,
    show_phone: businessSettings?.print_settings?.show_phone ?? true,
    show_email: businessSettings?.print_settings?.show_email ?? false,
    show_website: businessSettings?.print_settings?.show_website ?? false,
    show_gstin: businessSettings?.print_settings?.show_gstin ?? true,
    show_fssai: businessSettings?.print_settings?.show_fssai ?? false,
    show_tagline: businessSettings?.print_settings?.show_tagline ?? true,
    show_customer_name: businessSettings?.print_settings?.show_customer_name ?? true,
    show_waiter_name: businessSettings?.print_settings?.show_waiter_name ?? true,
    show_table_number: businessSettings?.print_settings?.show_table_number ?? true,
    show_order_time: businessSettings?.print_settings?.show_order_time ?? true,
    show_item_notes: businessSettings?.print_settings?.show_item_notes ?? true,
    border_style: businessSettings?.print_settings?.border_style || 'single',
    separator_style: businessSettings?.print_settings?.separator_style || 'dashes',
    footer_style: businessSettings?.print_settings?.footer_style || 'simple',
    qr_code_enabled: businessSettings?.print_settings?.qr_code_enabled ?? false,
    auto_print: businessSettings?.print_settings?.auto_print ?? false,
    print_copies: businessSettings?.print_settings?.print_copies || 1,
    kot_auto_print: businessSettings?.print_settings?.kot_auto_print ?? true,
    kot_font_size: businessSettings?.print_settings?.kot_font_size || 'large',
    kot_show_time: businessSettings?.print_settings?.kot_show_time ?? true,
    kot_highlight_notes: businessSettings?.print_settings?.kot_highlight_notes ?? true,
  });

  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('receipt');

  useEffect(() => {
    generatePreview();
  }, [customization, activeTab]);

  const generatePreview = () => {
    if (activeTab === 'receipt') {
      setPreviewContent(generateReceiptPreview());
    } else {
      setPreviewContent(generateKOTPreview());
    }
  };

  const generateReceiptPreview = () => {
    const width = customization.paper_width === '58mm' ? 32 : 48;
    const sep = customization.separator_style === 'dashes' ? '-'.repeat(width) : 
                customization.separator_style === 'dots' ? '.'.repeat(width) :
                customization.separator_style === 'equals' ? '='.repeat(width) : 
                '─'.repeat(width);
    
    const doubleSep = customization.border_style === 'double' ? '═'.repeat(width) : sep;
    
    const restaurantName = businessSettings?.restaurant_name || 'Your Restaurant';
    const centeredName = restaurantName.length <= width ? 
      restaurantName.padStart((width + restaurantName.length) / 2).padEnd(width) : 
      restaurantName.substring(0, width);

    let preview = '';
    
    // Header
    preview += doubleSep + '\n';
    preview += centeredName + '\n';
    
    if (customization.show_tagline && businessSettings?.tagline) {
      const tagline = businessSettings.tagline;
      preview += tagline.padStart((width + tagline.length) / 2).padEnd(width) + '\n';
    }
    
    preview += doubleSep + '\n';
    
    if (customization.show_address && businessSettings?.address) {
      preview += businessSettings.address.substring(0, width) + '\n';
    }
    if (customization.show_phone && businessSettings?.phone) {
      preview += `Phone: ${businessSettings.phone}\n`;
    }
    if (customization.show_email && businessSettings?.email) {
      preview += `Email: ${businessSettings.email}\n`;
    }
    if (customization.show_website && businessSettings?.website) {
      preview += `Web: ${businessSettings.website}\n`;
    }
    if (customization.show_gstin && businessSettings?.gstin) {
      preview += `GSTIN: ${businessSettings.gstin}\n`;
    }
    if (customization.show_fssai && businessSettings?.fssai) {
      preview += `FSSAI: ${businessSettings.fssai}\n`;
    }
    
    preview += sep + '\n';
    
    // Order details
    preview += `Bill #: ABC12345\n`;
    if (customization.show_table_number) preview += `Table: 5\n`;
    if (customization.show_waiter_name) preview += `Server: John Doe\n`;
    if (customization.show_customer_name) preview += `Customer: Guest\n`;
    if (customization.show_order_time) preview += `Date: ${new Date().toLocaleString()}\n`;
    
    preview += sep + '\n';
    preview += 'ITEMS:\n';
    preview += sep + '\n';
    
    // Sample items
    const items = [
      { qty: 2, name: 'Butter Chicken', price: 350 },
      { qty: 1, name: 'Garlic Naan', price: 60 },
      { qty: 2, name: 'Jeera Rice', price: 120 },
    ];
    
    items.forEach(item => {
      const itemLine = `${item.qty}x ${item.name}`;
      const priceLine = `₹${(item.qty * item.price).toFixed(2)}`;
      const spaces = width - itemLine.length - priceLine.length;
      preview += itemLine + ' '.repeat(Math.max(1, spaces)) + priceLine + '\n';
    });
    
    if (customization.show_item_notes) {
      preview += `   Note: Extra spicy\n`;
    }
    
    preview += sep + '\n';
    
    // Totals
    const subtotal = 880;
    const tax = 44;
    const total = 924;
    
    preview += `Subtotal:${' '.repeat(width - 18)}₹${subtotal.toFixed(2)}\n`;
    preview += `Tax (5%):${' '.repeat(width - 17)}₹${tax.toFixed(2)}\n`;
    preview += doubleSep + '\n';
    preview += `TOTAL:${' '.repeat(width - 15)}₹${total.toFixed(2)}\n`;
    preview += doubleSep + '\n';
    
    // Footer
    const footer = businessSettings?.footer_message || 'Thank you for dining with us!';
    preview += '\n' + footer.padStart((width + footer.length) / 2).padEnd(width) + '\n';
    
    if (customization.qr_code_enabled) {
      preview += '\n[QR Code for Payment/Feedback]\n';
    }
    
    preview += doubleSep + '\n';
    
    return preview;
  };

  const generateKOTPreview = () => {
    const width = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(width);
    const dash = '-'.repeat(width);
    
    let preview = '';
    
    preview += sep + '\n';
    preview += '*** KITCHEN ORDER TICKET ***'.padStart((width + 28) / 2).padEnd(width) + '\n';
    preview += sep + '\n\n';
    
    preview += `ORDER #: KOT-001234\n`;
    preview += `TABLE: 5\n`;
    preview += `SERVER: John Doe\n`;
    if (customization.kot_show_time) {
      preview += `TIME: ${new Date().toLocaleTimeString()}\n`;
    }
    preview += `PRIORITY: NORMAL\n`;
    
    preview += '\n' + dash + '\n';
    preview += 'ITEMS TO PREPARE:\n';
    preview += dash + '\n\n';
    
    // Sample KOT items with large font simulation
    const items = [
      { qty: 2, name: 'BUTTER CHICKEN', notes: 'Extra spicy' },
      { qty: 1, name: 'GARLIC NAAN', notes: '' },
      { qty: 2, name: 'JEERA RICE', notes: 'Less salt' },
    ];
    
    items.forEach((item, idx) => {
      if (customization.kot_font_size === 'large') {
        preview += `>>> ${item.qty}x ${item.name} <<<\n`;
      } else {
        preview += `${item.qty}x ${item.name}\n`;
      }
      if (customization.kot_highlight_notes && item.notes) {
        preview += `    *** ${item.notes} ***\n`;
      }
      if (idx < items.length - 1) preview += '\n';
    });
    
    preview += '\n' + dash + '\n';
    preview += `TOTAL ITEMS: ${items.reduce((sum, i) => sum + i.qty, 0)}\n`;
    preview += sep + '\n';
    
    return preview;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedSettings = {
        ...businessSettings,
        print_settings: customization
      };
      
      await axios.put(`${API}/business/settings`, updatedSettings);
      toast.success('Print settings saved successfully!');
      if (onUpdate) onUpdate(updatedSettings);
    } catch (error) {
      toast.error('Failed to save print settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCustomization({
      paper_width: '80mm',
      font_size: 'medium',
      header_style: 'centered',
      show_logo: true,
      show_address: true,
      show_phone: true,
      show_email: false,
      show_website: false,
      show_gstin: true,
      show_fssai: false,
      show_tagline: true,
      show_customer_name: true,
      show_waiter_name: true,
      show_table_number: true,
      show_order_time: true,
      show_item_notes: true,
      border_style: 'single',
      separator_style: 'dashes',
      footer_style: 'simple',
      qr_code_enabled: false,
      auto_print: false,
      print_copies: 1,
      kot_auto_print: true,
      kot_font_size: 'large',
      kot_show_time: true,
      kot_highlight_notes: true,
    });
    toast.info('Settings reset to defaults');
  };

  const ToggleSwitch = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'receipt' 
              ? 'bg-white shadow text-violet-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Receipt Settings
        </button>
        <button
          onClick={() => setActiveTab('kot')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'kot' 
              ? 'bg-white shadow text-violet-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Printer className="w-4 h-4" />
          KOT Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          {activeTab === 'receipt' ? (
            <>
              {/* Paper & Font Settings */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-violet-600" />
                    Paper & Font
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Paper Width</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['58mm', '80mm'].map(width => (
                        <button
                          key={width}
                          onClick={() => setCustomization({...customization, paper_width: width})}
                          className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                            customization.paper_width === width 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {width === '58mm' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          {width}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Font Size</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => setCustomization({...customization, font_size: size})}
                          className={`p-2 border-2 rounded-lg capitalize transition-all ${
                            customization.font_size === size 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Border Style</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['single', 'double'].map(style => (
                        <button
                          key={style}
                          onClick={() => setCustomization({...customization, border_style: style})}
                          className={`p-2 border-2 rounded-lg capitalize transition-all ${
                            customization.border_style === style 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {style === 'single' ? '─────' : '═════'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Separator Style</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { id: 'dashes', label: '- - -' },
                        { id: 'dots', label: '...' },
                        { id: 'equals', label: '===' },
                        { id: 'line', label: '───' },
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setCustomization({...customization, separator_style: style.id})}
                          className={`p-2 border-2 rounded-lg text-xs transition-all ${
                            customization.separator_style === style.id 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Header Content */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layout className="w-5 h-5 text-violet-600" />
                    Header Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <ToggleSwitch 
                    label="Show Logo" 
                    checked={customization.show_logo}
                    onChange={(v) => setCustomization({...customization, show_logo: v})}
                  />
                  <ToggleSwitch 
                    label="Show Tagline" 
                    checked={customization.show_tagline}
                    onChange={(v) => setCustomization({...customization, show_tagline: v})}
                  />
                  <ToggleSwitch 
                    label="Show Address" 
                    checked={customization.show_address}
                    onChange={(v) => setCustomization({...customization, show_address: v})}
                  />
                  <ToggleSwitch 
                    label="Show Phone" 
                    checked={customization.show_phone}
                    onChange={(v) => setCustomization({...customization, show_phone: v})}
                  />
                  <ToggleSwitch 
                    label="Show Email" 
                    checked={customization.show_email}
                    onChange={(v) => setCustomization({...customization, show_email: v})}
                  />
                  <ToggleSwitch 
                    label="Show Website" 
                    checked={customization.show_website}
                    onChange={(v) => setCustomization({...customization, show_website: v})}
                  />
                  <ToggleSwitch 
                    label="Show GSTIN" 
                    checked={customization.show_gstin}
                    onChange={(v) => setCustomization({...customization, show_gstin: v})}
                  />
                  <ToggleSwitch 
                    label="Show FSSAI" 
                    checked={customization.show_fssai}
                    onChange={(v) => setCustomization({...customization, show_fssai: v})}
                  />
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5 text-violet-600" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <ToggleSwitch 
                    label="Show Table Number" 
                    checked={customization.show_table_number}
                    onChange={(v) => setCustomization({...customization, show_table_number: v})}
                  />
                  <ToggleSwitch 
                    label="Show Waiter Name" 
                    checked={customization.show_waiter_name}
                    onChange={(v) => setCustomization({...customization, show_waiter_name: v})}
                  />
                  <ToggleSwitch 
                    label="Show Customer Name" 
                    checked={customization.show_customer_name}
                    onChange={(v) => setCustomization({...customization, show_customer_name: v})}
                  />
                  <ToggleSwitch 
                    label="Show Order Time" 
                    checked={customization.show_order_time}
                    onChange={(v) => setCustomization({...customization, show_order_time: v})}
                  />
                  <ToggleSwitch 
                    label="Show Item Notes" 
                    checked={customization.show_item_notes}
                    onChange={(v) => setCustomization({...customization, show_item_notes: v})}
                  />
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-600" />
                    Advanced Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ToggleSwitch 
                    label="QR Code on Receipt" 
                    checked={customization.qr_code_enabled}
                    onChange={(v) => setCustomization({...customization, qr_code_enabled: v})}
                    description="Add QR code for payment/feedback"
                  />
                  <ToggleSwitch 
                    label="Auto Print After Payment" 
                    checked={customization.auto_print}
                    onChange={(v) => setCustomization({...customization, auto_print: v})}
                    description="Automatically print receipt after payment"
                  />
                  <div>
                    <Label>Print Copies</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setCustomization({...customization, print_copies: Math.max(1, customization.print_copies - 1)})}
                        className="w-10 h-10 border-2 rounded-lg hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-lg">{customization.print_copies}</span>
                      <button
                        onClick={() => setCustomization({...customization, print_copies: Math.min(5, customization.print_copies + 1)})}
                        className="w-10 h-10 border-2 rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* KOT Settings */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Printer className="w-5 h-5 text-violet-600" />
                    KOT Print Settings
                  </CardTitle>
                  <CardDescription>
                    Configure Kitchen Order Ticket printing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ToggleSwitch 
                    label="Auto Print KOT" 
                    checked={customization.kot_auto_print}
                    onChange={(v) => setCustomization({...customization, kot_auto_print: v})}
                    description="Automatically print KOT when order is placed"
                  />
                  
                  <div>
                    <Label>KOT Font Size</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => setCustomization({...customization, kot_font_size: size})}
                          className={`p-2 border-2 rounded-lg capitalize transition-all ${
                            customization.kot_font_size === size 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Larger fonts are easier to read in kitchen</p>
                  </div>

                  <ToggleSwitch 
                    label="Show Order Time" 
                    checked={customization.kot_show_time}
                    onChange={(v) => setCustomization({...customization, kot_show_time: v})}
                    description="Display time when order was placed"
                  />
                  
                  <ToggleSwitch 
                    label="Highlight Special Notes" 
                    checked={customization.kot_highlight_notes}
                    onChange={(v) => setCustomization({...customization, kot_highlight_notes: v})}
                    description="Make special instructions stand out"
                  />
                </CardContent>
              </Card>

              {/* KOT Display Options */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    KOT Display Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Paper Width</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['58mm', '80mm'].map(width => (
                        <button
                          key={width}
                          onClick={() => setCustomization({...customization, paper_width: width})}
                          className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                            customization.paper_width === width 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {width === '58mm' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          {width}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="px-4"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:sticky lg:top-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-600" />
                Live Preview
              </CardTitle>
              <CardDescription>
                {activeTab === 'receipt' ? 'Receipt preview' : 'KOT preview'} with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-auto"
                style={{ 
                  maxHeight: '600px',
                  fontFamily: "'Courier New', Consolas, monospace",
                  fontSize: customization.font_size === 'small' ? '10px' : 
                           customization.font_size === 'large' ? '14px' : '12px',
                  lineHeight: '1.4'
                }}
              >
                <pre className="whitespace-pre-wrap text-gray-800">
                  {previewContent}
                </pre>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Paper: {customization.paper_width}</span>
                <span>Font: {customization.font_size}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrintCustomization;

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, Download, AlertCircle, Loader2, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '../App';

const BulkUpload = ({ type = 'menu', onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(''); // 'parsing', 'validating', 'saving'
  const [result, setResult] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResult(null);
      setUploadProgress(0);
      setProcessingStatus('');
      
      // Show instant feedback
      toast.success(`File selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB) - Starting upload...`);
      
      // Auto-upload immediately
      await handleUploadFile(selectedFile);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const handleUploadFile = async (fileToUpload) => {
    const uploadFile = fileToUpload || file;
    
    if (!uploadFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setProcessingStatus('parsing');
    
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const endpoint = type === 'menu' ? '/menu/bulk-upload' : '/inventory/bulk-upload';
      
      // Show instant feedback
      toast.info('Starting upload...', { duration: 2000 });
      
      const response = await axios.post(`${API}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          
          // Update status based on progress
          if (percentCompleted < 30) {
            setProcessingStatus('uploading');
          } else if (percentCompleted < 70) {
            setProcessingStatus('parsing');
          } else if (percentCompleted < 90) {
            setProcessingStatus('validating');
          } else {
            setProcessingStatus('saving');
          }
        }
      });

      setResult(response.data);
      setProcessingStatus('complete');
      
      // Show detailed success message with refresh notice
      const successMessage = `✅ ${response.data.items_added} items uploaded successfully! Refreshing menu...`;
      toast.success(successMessage, { duration: 3000 });
      
      setFile(null);
      
      // Force immediate refresh - call onSuccess which triggers fetchMenuItems
      if (onSuccess) {
        // Call immediately to refresh the menu
        await onSuccess();
        
        // Show completion message
        toast.success('Menu refreshed! New items are now visible.', { duration: 2000 });
      }
    } catch (error) {
      setProcessingStatus('error');
      const errorMessage = error.response?.data?.detail || error.message;
      toast.error(`Upload failed: ${errorMessage}`, { duration: 5000 });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    await handleUploadFile(file);
  };

  const downloadTemplate = async () => {
    try {
      const endpoint = type === 'menu' ? '/templates/menu-csv' : '/templates/inventory-csv';
      const response = await axios.get(`${API}${endpoint}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Upload {type === 'menu' ? 'Menu Items' : 'Inventory'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-violet-400 transition-colors bg-gradient-to-br from-violet-50 to-purple-50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id={`csv-upload-${type}`}
            disabled={uploading}
          />
          <label htmlFor={`csv-upload-${type}`} className={`cursor-pointer block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="w-16 h-16 mx-auto text-violet-600 animate-spin" />
                <p className="text-lg font-semibold text-violet-900">Uploading...</p>
                <p className="text-sm text-violet-600">{uploadProgress}% Complete</p>
              </div>
            ) : file ? (
              <div className="space-y-2">
                <FileText className="w-12 h-12 mx-auto mb-2 text-violet-600" />
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                <p className="text-xs text-violet-600 mt-2">✓ Uploading automatically...</p>
              </div>
            ) : (
              <div>
                <Upload className="w-16 h-16 mx-auto mb-3 text-violet-500" />
                <p className="text-lg font-semibold text-gray-800 mb-1">Click to Upload CSV</p>
                <p className="text-sm text-gray-600">or drag and drop your file here</p>
                <p className="text-xs text-gray-400 mt-2">File will upload automatically</p>
              </div>
            )}
          </label>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-3 p-4 bg-violet-50 rounded-lg border border-violet-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                <span className="text-sm font-medium text-violet-900">
                  {processingStatus === 'uploading' && 'Uploading file...'}
                  {processingStatus === 'parsing' && 'Parsing CSV data...'}
                  {processingStatus === 'validating' && 'Validating items...'}
                  {processingStatus === 'saving' && 'Saving to database...'}
                </span>
              </div>
              <span className="text-sm font-bold text-violet-600">{uploadProgress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-violet-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-violet-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            
            <p className="text-xs text-violet-700">
              Please wait while we process your file...
            </p>
          </div>
        )}

        {/* Manual Upload Button (Optional - for retry) */}
        {file && !uploading && (
          <Button
            onClick={handleUpload}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Retry Upload
            </span>
          </Button>
        )}

        {result && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            result.errors && result.errors.length > 0 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">
                  ✅ {result.items_added} items uploaded successfully
                </p>
                
                {result.items_updated > 0 && (
                  <p className="text-green-700 text-sm mt-1">
                    📝 {result.items_updated} items updated
                  </p>
                )}
                
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="text-orange-800 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {result.errors.length} errors occurred:
                    </p>
                    <ul className="text-sm text-orange-700 mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((error, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded">
          <p><strong>CSV Format:</strong></p>
          {type === 'menu' ? (
            <>
              <p>Columns: name, category, price, description, available</p>
              <p className="text-gray-400">Example: Margherita Pizza,Pizza,299,Classic cheese pizza,true</p>
            </>
          ) : (
            <>
              <p>Columns: item_name, quantity, unit, min_quantity, supplier</p>
              <p className="text-gray-400">Example: Tomatoes,50,kg,10,Fresh Farms</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUpload;

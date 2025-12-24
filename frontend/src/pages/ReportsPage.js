import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import TrialBanner from "../components/TrialBanner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  Sparkles, 
  TrendingUp,
  Users,
  Clock,
  Package,
  ShoppingCart,
  Calendar,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  CalendarDays
} from "lucide-react";

const ReportsPage = ({ user }) => {
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [bestSelling, setBestSelling] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activePreset, setActivePreset] = useState('week');

  // Quick date presets
  const datePresets = useMemo(() => ({
    today: () => {
      const today = new Date().toISOString().split("T")[0];
      return { start_date: today, end_date: today };
    },
    yesterday: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const date = yesterday.toISOString().split("T")[0];
      return { start_date: date, end_date: date };
    },
    week: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { 
        start_date: start.toISOString().split("T")[0], 
        end_date: end.toISOString().split("T")[0] 
      };
    },
    month: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { 
        start_date: start.toISOString().split("T")[0], 
        end_date: end.toISOString().split("T")[0] 
      };
    },
    thisMonth: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { 
        start_date: start.toISOString().split("T")[0], 
        end_date: end.toISOString().split("T")[0] 
      };
    },
    lastMonth: () => {
      const end = new Date();
      end.setDate(0); // Last day of previous month
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { 
        start_date: start.toISOString().split("T")[0], 
        end_date: end.toISOString().split("T")[0] 
      };
    }
  }), []);

  const applyPreset = useCallback((preset) => {
    setActivePreset(preset);
    setDateRange(datePresets[preset]());
  }, [datePresets]);

  useEffect(() => {
    // Prioritized loading: Load critical data first, then supporting data
    const loadReports = async () => {
      setInitialLoading(true);
      
      try {
        // Priority 1: Load essential reports first (most important for overview)
        await Promise.all([
          fetchDailyReport(),
          fetchWeeklyReport(),
          fetchMonthlyReport()
        ]);
        
        // Priority 2: Load analytics data in parallel (less critical)
        Promise.all([
          fetchBestSelling(),
          fetchStaffPerformance(),
          fetchPeakHours(),
          fetchCategoryAnalysis()
        ]);
        
        // Priority 3: Load AI forecast last (least critical, can be slow)
        setTimeout(() => {
          fetchForecast();
        }, 500);
        
      } catch (error) {
        console.error("Error loading reports:", error);
        toast.error("Failed to load some reports");
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadReports();
  }, []);

  const fetchDailyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/daily`);
      setDailyReport(response.data);
    } catch (error) {
      console.error("Failed to fetch daily report", error);
      setDailyReport({ total_orders: 0, total_sales: 0, orders: [] });
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/weekly`);
      setWeeklyReport(response.data);
    } catch (error) {
      console.error("Failed to fetch weekly report", error);
      setWeeklyReport({ total_orders: 0, total_sales: 0 });
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/monthly`);
      setMonthlyReport(response.data);
    } catch (error) {
      console.error("Failed to fetch monthly report", error);
      setMonthlyReport({ total_orders: 0, total_sales: 0 });
    }
  };

  const fetchBestSelling = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/best-selling`);
      setBestSelling(response.data || []);
    } catch (error) {
      console.error("Failed to fetch best selling items", error);
      setBestSelling([]);
    }
  }, []);

  const fetchStaffPerformance = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/staff-performance`);
      setStaffPerformance(response.data || []);
    } catch (error) {
      console.error("Failed to fetch staff performance", error);
      setStaffPerformance([]);
    }
  }, []);

  const fetchPeakHours = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/peak-hours`);
      setPeakHours(response.data || []);
    } catch (error) {
      console.error("Failed to fetch peak hours", error);
      setPeakHours([]);
    }
  }, []);

  const fetchCategoryAnalysis = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reports/category-analysis`);
      setCategoryAnalysis(response.data || []);
    } catch (error) {
      console.error("Failed to fetch category analysis", error);
      setCategoryAnalysis([]);
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    try {
      const response = await axios.post(`${API}/ai/sales-forecast`);
      setForecast(response.data);
    } catch (error) {
      console.error("Failed to fetch forecast", error);
      setForecast(null);
    }
  }, []);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
        setExportLoading(false);
        return;
      }

      const csvContent = [
        [
          "Order ID",
          "Table",
          "Waiter",
          "Customer",
          "Items",
          "Subtotal",
          "Tax",
          "Total",
          "Status",
          "Date",
        ],
        ...orders.map((order) => [
          order.id,
          order.table_number,
          order.waiter_name,
          order.customer_name || "N/A",
          order.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
          order.subtotal.toFixed(2),
          order.tax.toFixed(2),
          order.total.toFixed(2),
          order.status,
          new Date(order.created_at).toLocaleString(),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `restaurant-report-${dateRange.start_date}-to-${dateRange.end_date}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
        setExportLoading(false);
        return;
      }

      // Create Excel-compatible HTML table
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
      const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);

      const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #7c3aed; color: white; font-weight: bold; }
            .total-row { background-color: #f3f4f6; font-weight: bold; }
            .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">Sales Report: ${dateRange.start_date} to ${dateRange.end_date}</div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Waiter</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.id.slice(0, 8)}</td>
                  <td>${order.table_number}</td>
                  <td>${order.waiter_name}</td>
                  <td>${order.customer_name || 'N/A'}</td>
                  <td>${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                  <td>₹${order.subtotal.toFixed(2)}</td>
                  <td>₹${order.tax.toFixed(2)}</td>
                  <td>₹${order.total.toFixed(2)}</td>
                  <td>${order.status}</td>
                  <td>${new Date(order.created_at).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5">TOTALS</td>
                <td>₹${totalSubtotal.toFixed(2)}</td>
                <td>₹${totalTax.toFixed(2)}</td>
                <td>₹${totalSales.toFixed(2)}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `restaurant-report-${dateRange.start_date}-to-${dateRange.end_date}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
        setExportLoading(false);
        return;
      }

      // Calculate totals
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
      const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);

      // Create PDF-friendly print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Report PDF</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              line-height: 1.4;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              color: #7c3aed;
              font-size: 20px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item h3 {
              margin: 0;
              font-size: 9px;
              color: #666;
            }
            .summary-item p {
              margin: 5px 0 0 0;
              font-size: 16px;
              font-weight: bold;
              color: #7c3aed;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
              font-size: 9px;
            }
            th {
              background-color: #7c3aed;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .total-row {
              background-color: #e5e7eb;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 8px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${user?.business_settings?.restaurant_name || 'Restaurant'}</h1>
            <p>Sales Report</p>
            <p>${new Date(dateRange.start_date).toLocaleDateString()} - ${new Date(dateRange.end_date).toLocaleDateString()}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <h3>Total Orders</h3>
              <p>${totalOrders}</p>
            </div>
            <div class="summary-item">
              <h3>Total Sales</h3>
              <p>₹${totalSales.toFixed(2)}</p>
            </div>
            <div class="summary-item">
              <h3>Total Tax</h3>
              <p>₹${totalTax.toFixed(2)}</p>
            </div>
            <div class="summary-item">
              <h3>Avg Order</h3>
              <p>₹${(totalSales / totalOrders).toFixed(2)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Table</th>
                <th>Waiter</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.id.slice(0, 8)}</td>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${order.table_number}</td>
                  <td>${order.waiter_name}</td>
                  <td>${order.customer_name || 'N/A'}</td>
                  <td>${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                  <td>₹${order.subtotal.toFixed(2)}</td>
                  <td>₹${order.tax.toFixed(2)}</td>
                  <td>₹${order.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6">TOTALS</td>
                <td>₹${totalSubtotal.toFixed(2)}</td>
                <td>₹${totalTax.toFixed(2)}</td>
                <td>₹${totalSales.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by BillByteKOT AI - Restaurant Management System</p>
            <p>${user?.business_settings?.address || ''} | ${user?.business_settings?.phone || ''}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 100);" 
              style="padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
              Download as PDF
            </button>
            <button onclick="window.close()" 
              style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
              Close
            </button>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Click "Download as PDF" and choose "Save as PDF" in the print dialog
            </p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success("PDF preview opened! Use Print dialog to save as PDF");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrintReport = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
        return;
      }

      // Calculate totals
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
      const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);

      // Create print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Report - ${dateRange.start_date} to ${dateRange.end_date}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #7c3aed;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .summary-card h3 {
              margin: 0 0 5px 0;
              font-size: 14px;
              color: #666;
            }
            .summary-card p {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              color: #7c3aed;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #7c3aed;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${user?.business_settings?.restaurant_name || 'Restaurant'}</h1>
            <p>Sales Report</p>
            <p>${new Date(dateRange.start_date).toLocaleDateString()} - ${new Date(dateRange.end_date).toLocaleDateString()}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Total Orders</h3>
              <p>${totalOrders}</p>
            </div>
            <div class="summary-card">
              <h3>Total Sales</h3>
              <p>₹${totalSales.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h3>Total Tax</h3>
              <p>₹${totalTax.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h3>Avg Order</h3>
              <p>₹${(totalSales / totalOrders).toFixed(2)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Table</th>
                <th>Waiter</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.id.slice(0, 8)}</td>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${order.table_number}</td>
                  <td>${order.waiter_name}</td>
                  <td>${order.customer_name || 'N/A'}</td>
                  <td>${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                  <td>₹${order.subtotal.toFixed(2)}</td>
                  <td>₹${order.tax.toFixed(2)}</td>
                  <td><strong>₹${order.total.toFixed(2)}</strong></td>
                  <td>${order.status}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="6" style="text-align: right;">TOTALS:</td>
                <td>₹${totalSubtotal.toFixed(2)}</td>
                <td>₹${totalTax.toFixed(2)}</td>
                <td>₹${totalSales.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <p>Generated by BillByteKOT AI - Restaurant Management System</p>
            <p>${user?.business_settings?.address || ''} | ${user?.business_settings?.phone || ''}</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print Report
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success("Print preview opened!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate print report");
    } finally {
      setExportLoading(false);
    }
  };

  // Comprehensive Detailed Report with all analytics
  const handleDetailedReport = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders || [];
      
      // Calculate totals
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalTax = orders.reduce((sum, order) => sum + order.tax, 0);
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      // Create comprehensive PDF report
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Detailed Business Report - ${dateRange.start_date} to ${dateRange.end_date}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 15px;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .header h1 { margin: 0 0 5px 0; font-size: 24px; }
            .header p { margin: 3px 0; opacity: 0.9; }
            .section { margin-bottom: 25px; page-break-inside: avoid; }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #7c3aed;
              border-bottom: 2px solid #7c3aed;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 10px;
              text-align: center;
            }
            .stat-card.highlight { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; }
            .stat-card h4 { margin: 0 0 5px 0; font-size: 10px; opacity: 0.8; text-transform: uppercase; }
            .stat-card p { margin: 0; font-size: 22px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 10px; }
            th { background: #7c3aed; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .rank { 
              display: inline-flex; 
              align-items: center; 
              justify-content: center;
              width: 24px; 
              height: 24px; 
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); 
              color: white; 
              border-radius: 50%; 
              font-weight: bold;
              font-size: 11px;
            }
            .progress-bar { 
              height: 8px; 
              background: #e5e7eb; 
              border-radius: 4px; 
              overflow: hidden;
              margin-top: 4px;
            }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #a855f7); border-radius: 4px; }
            .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .footer {
              text-align: center;
              padding: 15px;
              border-top: 2px solid #e5e7eb;
              margin-top: 20px;
              color: #6b7280;
              font-size: 10px;
            }
            .no-print { margin-top: 20px; text-align: center; }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              margin: 5px;
            }
            .btn-primary { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; }
            .btn-secondary { background: #6b7280; color: white; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 ${user?.business_settings?.restaurant_name || 'Restaurant'}</h1>
            <p><strong>Detailed Business Report</strong></p>
            <p>${new Date(dateRange.start_date).toLocaleDateString()} - ${new Date(dateRange.end_date).toLocaleDateString()}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <!-- Summary Stats -->
          <div class="section">
            <div class="section-title">📈 Summary Overview</div>
            <div class="stats-grid">
              <div class="stat-card highlight">
                <h4>Total Revenue</h4>
                <p>₹${totalSales.toFixed(0)}</p>
              </div>
              <div class="stat-card">
                <h4>Total Orders</h4>
                <p>${totalOrders}</p>
              </div>
              <div class="stat-card">
                <h4>Avg Order Value</h4>
                <p>₹${totalOrders > 0 ? (totalSales / totalOrders).toFixed(0) : 0}</p>
              </div>
              <div class="stat-card">
                <h4>Tax Collected</h4>
                <p>₹${totalTax.toFixed(0)}</p>
              </div>
            </div>
            <div class="stats-grid">
              <div class="stat-card" style="background: #dcfce7;">
                <h4>Completed</h4>
                <p style="color: #16a34a;">${completedOrders}</p>
              </div>
              <div class="stat-card" style="background: #fef3c7;">
                <h4>Pending</h4>
                <p style="color: #d97706;">${orders.filter(o => o.status === 'pending').length}</p>
              </div>
              <div class="stat-card" style="background: #dbeafe;">
                <h4>Preparing</h4>
                <p style="color: #2563eb;">${orders.filter(o => o.status === 'preparing').length}</p>
              </div>
              <div class="stat-card" style="background: #fee2e2;">
                <h4>Cancelled</h4>
                <p style="color: #dc2626;">${cancelledOrders}</p>
              </div>
            </div>
          </div>

          <div class="two-col">
            <!-- Best Selling Items -->
            <div class="section">
              <div class="section-title">🏆 Top Selling Items</div>
              ${bestSelling && bestSelling.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>#</th><th>Item</th><th>Qty</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    ${bestSelling.slice(0, 10).map((item, i) => `
                      <tr>
                        <td><span class="rank">${i + 1}</span></td>
                        <td><strong>${item.name || 'Unknown'}</strong><br><small style="color:#6b7280">${item.category || ''}</small></td>
                        <td>${item.total_quantity || 0}</td>
                        <td>₹${(item.total_revenue || 0).toFixed(0)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color:#6b7280;text-align:center;">No data available</p>'}
            </div>

            <!-- Staff Performance -->
            <div class="section">
              <div class="section-title">👥 Staff Performance</div>
              ${staffPerformance && staffPerformance.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>Staff</th><th>Orders</th><th>Sales</th><th>Avg</th></tr>
                  </thead>
                  <tbody>
                    ${staffPerformance.slice(0, 10).map(staff => `
                      <tr>
                        <td><strong>${staff.waiter_name}</strong></td>
                        <td>${staff.total_orders}</td>
                        <td>₹${(staff.total_sales || 0).toFixed(0)}</td>
                        <td>₹${(staff.avg_order_value || 0).toFixed(0)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color:#6b7280;text-align:center;">No data available</p>'}
            </div>
          </div>

          <div class="two-col">
            <!-- Peak Hours -->
            <div class="section">
              <div class="section-title">⏰ Peak Hours Analysis</div>
              ${peakHours && peakHours.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>Hour</th><th>Orders</th><th>Sales</th><th>Activity</th></tr>
                  </thead>
                  <tbody>
                    ${peakHours.slice(0, 12).map(hour => {
                      const maxOrders = Math.max(...peakHours.map(h => h.order_count || 0));
                      const pct = maxOrders > 0 ? ((hour.order_count || 0) / maxOrders) * 100 : 0;
                      return `
                        <tr>
                          <td>${hour.hour}:00</td>
                          <td>${hour.order_count || 0}</td>
                          <td>₹${(hour.total_sales || 0).toFixed(0)}</td>
                          <td>
                            <div class="progress-bar">
                              <div class="progress-fill" style="width:${pct}%"></div>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              ` : '<p style="color:#6b7280;text-align:center;">No data available</p>'}
            </div>

            <!-- Category Analysis -->
            <div class="section">
              <div class="section-title">📦 Sales by Category</div>
              ${categoryAnalysis && categoryAnalysis.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>Category</th><th>Items</th><th>Revenue</th><th>Share</th></tr>
                  </thead>
                  <tbody>
                    ${categoryAnalysis.map(cat => {
                      const maxRev = Math.max(...categoryAnalysis.map(c => c.total_revenue || 0));
                      const pct = maxRev > 0 ? ((cat.total_revenue || 0) / maxRev) * 100 : 0;
                      return `
                        <tr>
                          <td><strong>${cat.category}</strong></td>
                          <td>${cat.total_quantity || 0}</td>
                          <td>₹${(cat.total_revenue || 0).toFixed(0)}</td>
                          <td>
                            <div class="progress-bar">
                              <div class="progress-fill" style="width:${pct}%"></div>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              ` : '<p style="color:#6b7280;text-align:center;">No data available</p>'}
            </div>
          </div>

          <!-- Orders Table -->
          ${orders.length > 0 ? `
            <div class="section">
              <div class="section-title">📋 Order Details (${orders.length} orders)</div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Table</th>
                    <th>Staff</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${orders.slice(0, 50).map(order => `
                    <tr>
                      <td>${order.id.slice(0, 8)}</td>
                      <td>${new Date(order.created_at).toLocaleDateString()}</td>
                      <td>${order.table_number}</td>
                      <td>${order.waiter_name}</td>
                      <td>${order.items.map(i => i.quantity + 'x ' + i.name).join(', ').slice(0, 40)}${order.items.length > 2 ? '...' : ''}</td>
                      <td><strong>₹${order.total.toFixed(0)}</strong></td>
                      <td style="color: ${order.status === 'completed' ? '#16a34a' : order.status === 'cancelled' ? '#dc2626' : '#d97706'}">${order.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${orders.length > 50 ? '<p style="text-align:center;color:#6b7280;font-size:10px;">Showing first 50 orders. Export CSV for complete data.</p>' : ''}
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>BillByteKOT</strong> - Restaurant Management System</p>
            <p>${user?.business_settings?.address || ''} ${user?.business_settings?.phone ? '| ' + user.business_settings.phone : ''}</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="no-print">
            <button class="btn btn-primary" onclick="window.print()">📄 Save as PDF / Print</button>
            <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
            <p style="margin-top:10px;font-size:12px;color:#6b7280;">
              Click "Save as PDF" in print dialog to download PDF
            </p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success("Detailed report ready! Click 'Save as PDF' to download");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate detailed report");
    } finally {
      setExportLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout user={user}>
        <div className="space-y-6">
          <TrialBanner user={user} />
          
          {/* Header Skeleton */}
          <div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-80 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-96"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-2 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
            ))}
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-0 shadow-lg rounded-lg p-6 bg-white">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
            ))}
          </div>

          {/* Large Card Skeleton */}
          <div className="border-0 shadow-lg rounded-lg p-6 bg-white">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="reports-page">
        <TrialBanner user={user} />
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive business insights and analytics
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Trends</TabsTrigger>
            <TabsTrigger value="items">Best Sellers</TabsTrigger>
            <TabsTrigger value="staff">Staff Performance</TabsTrigger>
            <TabsTrigger value="hours">Peak Hours</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {dailyReport && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                  className="card-hover border-0 shadow-lg"
                  data-testid="daily-orders-card"
                >
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">
                      Today's Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-violet-600">
                      {dailyReport.total_orders}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="card-hover border-0 shadow-lg"
                  data-testid="daily-sales-card"
                >
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">
                      Today's Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-green-600">
                      ₹{(dailyReport?.total_sales || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="card-hover border-0 shadow-lg"
                  data-testid="avg-order-card"
                >
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">
                      Avg Order Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-blue-600">
                      ₹
                      {(dailyReport?.total_orders || 0) > 0
                        ? (
                            (dailyReport?.total_sales || 0) / (dailyReport?.total_orders || 1)
                          ).toFixed(2)
                        : "0.00"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {forecast && (
              <Card className="border-0 shadow-lg" data-testid="forecast-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                    AI Sales Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-violet-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {forecast.current_stats.total_orders}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Sales</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{(forecast?.current_stats?.total_sales || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Order</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{(forecast?.current_stats?.avg_order || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {forecast.forecast}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg" data-testid="export-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-600" />
                  Quick Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'today', label: 'Today' },
                      { key: 'week', label: 'Last 7 Days' },
                      { key: 'month', label: 'Last 30 Days' },
                    ].map(preset => (
                      <button
                        key={preset.key}
                        onClick={() => applyPreset(preset.key)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                          activePreset === preset.key
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-gray-200 hover:border-violet-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Date Range Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">From</Label>
                      <input
                        type="date"
                        value={dateRange.start_date}
                        onChange={(e) => {
                          setActivePreset('custom');
                          setDateRange({ ...dateRange, start_date: e.target.value });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-violet-500 outline-none transition-all"
                        data-testid="start-date-input"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">To</Label>
                      <input
                        type="date"
                        value={dateRange.end_date}
                        onChange={(e) => {
                          setActivePreset('custom');
                          setDateRange({ ...dateRange, end_date: e.target.value });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-violet-500 outline-none transition-all"
                        data-testid="end-date-input"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleExportCSV}
                    disabled={exportLoading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
                    data-testid="export-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportLoading ? "Exporting..." : "Export to CSV"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {dailyReport?.orders && dailyReport.orders.length > 0 && (
              <Card
                className="border-0 shadow-lg"
                data-testid="today-orders-list"
              >
                <CardHeader>
                  <CardTitle>Today's Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dailyReport.orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Table {order.table_number} • {order.items.length}{" "}
                            items
                          </p>
                        </div>
                        <p className="font-bold text-violet-600">
                          ₹{(order?.total || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sales Trends Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dailyReport && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-violet-600">
                      ₹{(dailyReport?.total_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dailyReport.total_orders} orders
                    </p>
                  </CardContent>
                </Card>
              )}

              {weeklyReport && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{(weeklyReport?.total_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {weeklyReport.total_orders} orders
                    </p>
                  </CardContent>
                </Card>
              )}

              {monthlyReport && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{(monthlyReport?.total_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {monthlyReport.total_orders} orders
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sales Comparison */}
            {weeklyReport && monthlyReport && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    Sales Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Weekly Average</p>
                        <p className="text-2xl font-bold text-violet-600">
                          ₹{((weeklyReport?.total_sales || 0) / 7).toFixed(2)}/day
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Monthly Average</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{((monthlyReport?.total_sales || 0) / 30).toFixed(2)}/day
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Best Sellers Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-violet-600" />
                  Top Selling Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bestSelling && bestSelling.length > 0 ? (
                  <div className="space-y-3">
                    {bestSelling.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">
                              {item.category || 'N/A'} • ₹{(item.price || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-violet-600">
                            {item.total_quantity || 0}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{(item.total_revenue || 0).toFixed(2)} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No sales data available yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category Analysis */}
            {categoryAnalysis && categoryAnalysis.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-violet-600" />
                    Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryAnalysis.map((cat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{cat.category}</span>
                          <span className="text-sm text-gray-600">
                            {cat.total_quantity || 0} items • ₹{(cat.total_revenue || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full"
                            style={{
                              width: `${(cat.total_revenue / categoryAnalysis[0].total_revenue) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Staff Performance Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-600" />
                  Staff Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffPerformance && staffPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {staffPerformance.map((staff, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {staff.waiter_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{staff.waiter_name}</p>
                            <p className="text-sm text-gray-500">
                              {staff.total_orders} orders served
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{(staff.total_sales || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Avg: ₹{(staff.avg_order_value || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No staff performance data available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peak Hours Tab */}
          <TabsContent value="hours" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-600" />
                  Peak Hours Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {peakHours && peakHours.length > 0 ? (
                  <div className="space-y-3">
                    {peakHours.map((hour, index) => {
                      const maxOrders = Math.max(...peakHours.map(h => h.order_count));
                      const percentage = (hour.order_count / maxOrders) * 100;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {hour.hour}:00 - {hour.hour}:59
                            </span>
                            <span className="text-sm text-gray-600">
                              {hour.order_count || 0} orders • ₹{(hour.total_sales || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                percentage > 80
                                  ? 'bg-gradient-to-r from-red-500 to-orange-600'
                                  : percentage > 50
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                                  : 'bg-gradient-to-r from-violet-500 to-purple-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No peak hours data available yet
                  </p>
                )}
              </CardContent>
            </Card>

            {peakHours && peakHours.length > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const sortedHours = [...peakHours].sort((a, b) => b.order_count - a.order_count);
                      const peakHour = sortedHours[0];
                      const slowHour = sortedHours[sortedHours.length - 1];
                      
                      return (
                        <>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-sm text-gray-600">Busiest Hour</p>
                            <p className="text-lg font-bold text-blue-600">
                              {peakHour.hour}:00 - {peakHour.hour}:59
                            </p>
                            <p className="text-sm text-gray-500">
                              {peakHour.order_count || 0} orders • ₹{(peakHour.total_sales || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-sm text-gray-600">Slowest Hour</p>
                            <p className="text-lg font-bold text-gray-600">
                              {slowHour.hour}:00 - {slowHour.hour}:59
                            </p>
                            <p className="text-sm text-gray-500">
                              {slowHour.order_count || 0} orders • ₹{(slowHour.total_sales || 0).toFixed(2)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-violet-600" />
                  Export Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Quick Date Presets - More Prominent */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Quick Select Date Range</Label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { key: 'today', label: 'Today', icon: '📅' },
                        { key: 'yesterday', label: 'Yesterday', icon: '⏪' },
                        { key: 'week', label: 'Last 7 Days', icon: '📆' },
                        { key: 'month', label: 'Last 30 Days', icon: '🗓️' },
                        { key: 'thisMonth', label: 'This Month', icon: '📊' },
                        { key: 'lastMonth', label: 'Last Month', icon: '📈' },
                      ].map(preset => (
                        <button
                          key={preset.key}
                          onClick={() => applyPreset(preset.key)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            activePreset === preset.key
                              ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-md'
                              : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                          }`}
                        >
                          <span className="text-xl block mb-1">{preset.icon}</span>
                          <span className="text-xs font-medium">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Range */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Custom Date Range
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Start Date</Label>
                        <input
                          type="date"
                          value={dateRange.start_date}
                          onChange={(e) => {
                            setActivePreset('custom');
                            setDateRange({ ...dateRange, start_date: e.target.value });
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-base"
                          data-testid="export-start-date"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">End Date</Label>
                        <input
                          type="date"
                          value={dateRange.end_date}
                          onChange={(e) => {
                            setActivePreset('custom');
                            setDateRange({ ...dateRange, end_date: e.target.value });
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all text-base"
                          data-testid="export-end-date"
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-violet-100 rounded-lg text-center">
                      <span className="text-sm text-violet-700 font-medium">
                        📅 Selected: {new Date(dateRange.start_date).toLocaleDateString()} → {new Date(dateRange.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Export Format</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Button
                        onClick={handleExportCSV}
                        disabled={exportLoading}
                        className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 flex-col gap-1"
                        data-testid="export-csv-button"
                      >
                        <FileSpreadsheet className="w-6 h-6" />
                        <span className="text-sm">{exportLoading ? "..." : "CSV"}</span>
                      </Button>
                      
                      <Button
                        onClick={handleExportExcel}
                        disabled={exportLoading}
                        className="h-16 bg-gradient-to-r from-blue-600 to-cyan-600 flex-col gap-1"
                        data-testid="export-excel-button"
                      >
                        <FileSpreadsheet className="w-6 h-6" />
                        <span className="text-sm">{exportLoading ? "..." : "Excel"}</span>
                      </Button>
                      
                      <Button
                        onClick={handleExportPDF}
                        disabled={exportLoading}
                        className="h-16 bg-gradient-to-r from-red-600 to-pink-600 flex-col gap-1"
                        data-testid="export-pdf-button"
                      >
                        <FileText className="w-6 h-6" />
                        <span className="text-sm">{exportLoading ? "..." : "PDF"}</span>
                      </Button>
                      
                      <Button
                        onClick={handleDetailedReport}
                        disabled={exportLoading}
                        className="h-16 bg-gradient-to-r from-violet-600 to-purple-600 flex-col gap-1"
                        data-testid="detailed-report-button"
                      >
                        <Sparkles className="w-6 h-6" />
                        <span className="text-sm">{exportLoading ? "..." : "Detailed"}</span>
                      </Button>
                      
                      <Button
                        onClick={handlePrintReport}
                        disabled={exportLoading}
                        variant="outline"
                        className="h-16 flex-col gap-1 border-2"
                        data-testid="print-report-button"
                      >
                        <Printer className="w-6 h-6" />
                        <span className="text-sm">Print</span>
                      </Button>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      Export Options:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-white rounded-lg border">
                        <p className="font-semibold text-green-700">CSV / Excel</p>
                        <p className="text-xs text-gray-600">Order data for spreadsheets</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border">
                        <p className="font-semibold text-red-700">PDF</p>
                        <p className="text-xs text-gray-600">Basic sales report</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-violet-300 bg-violet-50">
                        <p className="font-semibold text-violet-700">⭐ Detailed Report</p>
                        <p className="text-xs text-gray-600">Full analytics: Best sellers, Staff, Peak hours, Categories</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border">
                        <p className="font-semibold text-gray-700">Print</p>
                        <p className="text-xs text-gray-600">Quick print view</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;

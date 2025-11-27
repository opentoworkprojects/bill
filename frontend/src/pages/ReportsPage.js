import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "sonner";
import { FileText, Download, Sparkles } from "lucide-react";

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

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    await Promise.all([
      fetchDailyReport(),
      fetchWeeklyReport(),
      fetchMonthlyReport(),
      fetchBestSelling(),
      fetchStaffPerformance(),
      fetchPeakHours(),
      fetchCategoryAnalysis(),
      fetchForecast(),
    ]);
  };

  const fetchDailyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/daily`);
      setDailyReport(response.data);
    } catch (error) {
      console.error("Failed to fetch daily report", error);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/weekly`);
      setWeeklyReport(response.data);
    } catch (error) {
      console.error("Failed to fetch weekly report", error);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const response = await axios.get(`${API}/reports/monthly`);
      setMonthlyReport(response.data);
    } catch (error) {
      console.error("Failed to fetch monthly report", error);
    }
  };

  const fetchBestSelling = async () => {
    try {
      const response = await axios.get(`${API}/reports/best-selling`);
      setBestSelling(response.data);
    } catch (error) {
      console.error("Failed to fetch best selling items", error);
    }
  };

  const fetchStaffPerformance = async () => {
    try {
      const response = await axios.get(`${API}/reports/staff-performance`);
      setStaffPerformance(response.data);
    } catch (error) {
      console.error("Failed to fetch staff performance", error);
    }
  };

  const fetchPeakHours = async () => {
    try {
      const response = await axios.get(`${API}/reports/peak-hours`);
      setPeakHours(response.data);
    } catch (error) {
      console.error("Failed to fetch peak hours", error);
    }
  };

  const fetchCategoryAnalysis = async () => {
    try {
      const response = await axios.get(`${API}/reports/category-analysis`);
      setCategoryAnalysis(response.data);
    } catch (error) {
      console.error("Failed to fetch category analysis", error);
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await axios.post(`${API}/ai/sales-forecast`);
      setForecast(response.data);
    } catch (error) {
      console.error("Failed to fetch forecast", error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/export`, {
        params: dateRange,
      });

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        toast.error("No data found for selected date range");
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

      toast.success("Report exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="reports-page">
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
                      ₹{dailyReport.total_sales.toFixed(2)}
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
                      {dailyReport.total_orders > 0
                        ? (
                            dailyReport.total_sales / dailyReport.total_orders
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
                          ₹{forecast.current_stats.total_sales.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Order</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{forecast.current_stats.avg_order.toFixed(2)}
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
                  Export Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={dateRange.start_date}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            start_date: e.target.value,
                          })
                        }
                        data-testid="start-date-input"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={dateRange.end_date}
                        onChange={(e) =>
                          setDateRange({
                            ...dateRange,
                            end_date: e.target.value,
                          })
                        }
                        data-testid="end-date-input"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleExport}
                    disabled={loading}
                    className="bg-gradient-to-r from-violet-600 to-purple-600"
                    data-testid="export-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? "Exporting..." : "Export to CSV"}
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
                          ₹{order.total.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* You can add other tabs like:
          <TabsContent value="sales">...</TabsContent>
          <TabsContent value="items">...</TabsContent>
          etc.
          */}
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;

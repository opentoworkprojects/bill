import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import LeadCaptureForm from './LeadCaptureForm';

// RestaurantCostCalculator — interactive tool for food cost & profit analysis
// On completion, shows LeadCaptureForm with "Save Your Results" prompt
const RestaurantCostCalculator = () => {
  const [inputs, setInputs] = useState({
    revenue: '',
    foodCost: '',
    laborCost: '',
    overhead: '',
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculate = (e) => {
    e.preventDefault();
    const rev = parseFloat(inputs.revenue) || 0;
    const food = parseFloat(inputs.foodCost) || 0;
    const labor = parseFloat(inputs.laborCost) || 0;
    const overhead = parseFloat(inputs.overhead) || 0;

    const totalCostPct = food + labor + overhead;
    const netProfitPct = 100 - totalCostPct;
    const netProfit = (rev * netProfitPct) / 100;

    let recommendation = '';
    if (netProfitPct < 0) {
      recommendation = '⚠️ Your costs exceed revenue. Reduce food cost below 32% and labor below 30% immediately.';
    } else if (netProfitPct < 5) {
      recommendation = '📉 Profit margin is very thin. Target food cost 28–32%, labor 25–30%, overhead 10–15%.';
    } else if (netProfitPct < 10) {
      recommendation = '📊 Decent margin. Optimise menu pricing and reduce waste to push above 10%.';
    } else {
      recommendation = '✅ Healthy profit margin! Focus on scaling revenue while keeping costs stable.';
    }

    setResult({ rev, food, labor, overhead, totalCostPct, netProfitPct, netProfit, recommendation });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 my-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-black text-base text-gray-900">Restaurant Cost Calculator</h3>
          <p className="text-xs text-gray-500">Calculate your profit margin instantly</p>
        </div>
      </div>

      <form onSubmit={calculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Monthly Revenue (₹)</label>
            <input
              name="revenue"
              value={inputs.revenue}
              onChange={handleChange}
              type="number"
              min="0"
              placeholder="e.g. 500000"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Food Cost %</label>
            <input
              name="foodCost"
              value={inputs.foodCost}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 32"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Labor Cost %</label>
            <input
              name="laborCost"
              value={inputs.laborCost}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 28"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Overhead %</label>
            <input
              name="overhead"
              value={inputs.overhead}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 12"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-2.5 rounded-xl text-sm transition-colors"
        >
          Calculate Profit Margin
        </button>
      </form>

      {result && (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Total Costs</div>
              <div className="font-black text-lg text-gray-900">{result.totalCostPct.toFixed(1)}%</div>
            </div>
            <div className={`rounded-xl p-3 text-center ${result.netProfitPct >= 5 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-xs text-gray-500 mb-1">Net Profit %</div>
              <div className={`font-black text-lg flex items-center justify-center gap-1 ${result.netProfitPct >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                {result.netProfitPct >= 5 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {result.netProfitPct.toFixed(1)}%
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Net Profit ₹</div>
              <div className="font-black text-lg text-blue-700">
                ₹{Math.round(result.netProfit).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-orange-50 rounded-xl p-3 text-sm text-gray-700">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            {result.recommendation}
          </div>
          <LeadCaptureForm title="Save Your Results & Get a Free Consultation" />
        </div>
      )}
    </div>
  );
};

export default RestaurantCostCalculator;

import { useState } from 'react';
import { Zap, TrendingUp, Clock } from 'lucide-react';
import LeadCaptureForm from './LeadCaptureForm';

// KOTROICalculator — estimates monthly savings and payback period from KOT system
// On completion, shows LeadCaptureForm with "Save Your Results" prompt
const KOTROICalculator = () => {
  const [inputs, setInputs] = useState({
    tables: '',
    coversPerDay: '',
    avgOrderValue: '',
    errorRate: '',
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculate = (e) => {
    e.preventDefault();
    const tables = parseFloat(inputs.tables) || 0;
    const covers = parseFloat(inputs.coversPerDay) || 0;
    const aov = parseFloat(inputs.avgOrderValue) || 0;
    const errorRate = parseFloat(inputs.errorRate) || 0;

    const dailyRevenue = covers * aov;
    const monthlyRevenue = dailyRevenue * 30;

    // Savings from error reduction (assume KOT reduces errors by 80%)
    const errorSavings = (monthlyRevenue * errorRate) / 100 * 0.8;

    // Savings from faster table turnover (assume 20% more covers with KOT)
    const turnoverGain = monthlyRevenue * 0.2;

    const totalMonthlySavings = Math.round(errorSavings + turnoverGain);

    // BillByteKOT annual cost ₹1999 → monthly ₹167
    const monthlyCost = 167;
    const paybackMonths = monthlyCost / totalMonthlySavings;
    const paybackDays = Math.ceil(paybackMonths * 30);

    setResult({ totalMonthlySavings, paybackDays, errorSavings: Math.round(errorSavings), turnoverGain: Math.round(turnoverGain) });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 my-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-black text-base text-gray-900">KOT System ROI Calculator</h3>
          <p className="text-xs text-gray-500">See how much you save with a KOT-first system</p>
        </div>
      </div>

      <form onSubmit={calculate} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Number of Tables</label>
            <input
              name="tables"
              value={inputs.tables}
              onChange={handleChange}
              type="number"
              min="1"
              placeholder="e.g. 20"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Avg Covers Per Day</label>
            <input
              name="coversPerDay"
              value={inputs.coversPerDay}
              onChange={handleChange}
              type="number"
              min="1"
              placeholder="e.g. 80"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Avg Order Value (₹)</label>
            <input
              name="avgOrderValue"
              value={inputs.avgOrderValue}
              onChange={handleChange}
              type="number"
              min="1"
              placeholder="e.g. 350"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Current Error Rate %</label>
            <input
              name="errorRate"
              value={inputs.errorRate}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 5"
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-2.5 rounded-xl text-sm transition-colors"
        >
          Calculate My Savings
        </button>
      </form>

      {result && (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <TrendingUp className="w-3 h-3" /> Monthly Savings
              </div>
              <div className="font-black text-2xl text-green-700">
                ₹{result.totalMonthlySavings.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                <Clock className="w-3 h-3" /> Payback Period
              </div>
              <div className="font-black text-2xl text-blue-700">
                {result.paybackDays} days
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Error reduction savings</span>
              <span className="font-bold text-green-600">₹{result.errorSavings.toLocaleString('en-IN')}/mo</span>
            </div>
            <div className="flex justify-between">
              <span>Turnover improvement</span>
              <span className="font-bold text-green-600">₹{result.turnoverGain.toLocaleString('en-IN')}/mo</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
              <span className="font-bold">BillByteKOT cost</span>
              <span className="font-bold text-gray-700">₹167/mo</span>
            </div>
          </div>
          <LeadCaptureForm title="Save Your ROI Results & Start Free Trial" />
        </div>
      )}
    </div>
  );
};

export default KOTROICalculator;

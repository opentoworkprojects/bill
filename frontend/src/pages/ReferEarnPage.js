import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Gift, Copy, Share2, MessageCircle, Smartphone, 
  Wallet, Users, TrendingUp, Clock, CheckCircle, 
  XCircle, AlertCircle, ChevronLeft, ChevronRight,
  Info
} from 'lucide-react';

const ReferEarnPage = ({ user }) => {
  // State for referral data
  const [referralCode, setReferralCode] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for referral summary
  const [referralStats, setReferralStats] = useState({
    total_referrals: 0,
    status_breakdown: {
      pending: 0,
      completed: 0,
      rewarded: 0,
      reversed: 0
    },
    total_earnings: 0,
    wallet_balance: 0,
    reward_per_referral: 300,
    discount_for_referee: 200
  });
  
  // State for wallet
  const [walletBalance, setWalletBalance] = useState({
    total_earned: 0,
    total_used: 0,
    available_balance: 0
  });
  
  // State for transactions
  const [transactions, setTransactions] = useState([]);
  const [transactionPagination, setTransactionPagination] = useState({
    skip: 0,
    limit: 10,
    total: 0,
    has_more: false
  });
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // Copy state for feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchWalletBalance();
    fetchTransactions();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch referral code
      const codeResponse = await axios.get(`${API}/referral/code`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (codeResponse.data.success) {
        setReferralCode(codeResponse.data.referral_code);
        setShareMessage(codeResponse.data.share_message);
      }
      
      // Fetch referral summary
      const summaryResponse = await axios.get(`${API}/referral/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (summaryResponse.data.success) {
        setReferralStats(summaryResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWalletBalance({
          total_earned: response.data.total_earned,
          total_used: response.data.total_used,
          available_balance: response.data.available_balance
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const fetchTransactions = async (skip = 0) => {
    try {
      setTransactionsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { skip, limit: 10 }
      });
      
      if (response.data.success) {
        setTransactions(response.data.transactions);
        setTransactionPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Copy referral code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  // Copy share link
  const handleCopyLink = async () => {
    try {
      const shareLink = `https://billbytekot.in?ref=${referralCode}`;
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Share via SMS
  const handleSMSShare = () => {
    const message = encodeURIComponent(shareMessage);
    window.open(`sms:?body=${message}`, '_blank');
  };

  // Pagination handlers
  const handlePrevPage = () => {
    const newSkip = Math.max(0, transactionPagination.skip - transactionPagination.limit);
    fetchTransactions(newSkip);
  };

  const handleNextPage = () => {
    if (transactionPagination.has_more) {
      fetchTransactions(transactionPagination.skip + transactionPagination.limit);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading referral data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="refer-earn-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Gift className="w-10 h-10 text-violet-600" />
              Refer & Earn
            </h1>
            <p className="text-gray-600 mt-2">Share your referral code and earn rewards when friends subscribe!</p>
          </div>
        </div>

        {/* Referral Code Display Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-violet-200 text-sm mb-2">Your Referral Code</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tracking-wider" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {referralCode}
                  </span>
                  <Button
                    onClick={handleCopyCode}
                    variant="secondary"
                    size="sm"
                    className={`${copied ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-2">
                <p className="text-violet-200 text-sm">Share & Earn</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(referralStats.reward_per_referral)}</span>
                  <span className="text-violet-200">per referral</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Buttons Section */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-violet-600" />
              Share Your Code
            </CardTitle>
            <CardDescription>
              Share your referral code with friends and earn ₹{referralStats.reward_per_referral} when they subscribe!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* WhatsApp Share */}
              <Button
                onClick={handleWhatsAppShare}
                className="bg-green-500 hover:bg-green-600 text-white h-14 text-lg"
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                WhatsApp
              </Button>
              
              {/* SMS Share */}
              <Button
                onClick={handleSMSShare}
                variant="outline"
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 h-14 text-lg"
              >
                <Smartphone className="w-6 h-6 mr-2" />
                SMS
              </Button>
              
              {/* Copy Link */}
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-2 border-violet-500 text-violet-600 hover:bg-violet-50 h-14 text-lg"
              >
                <Copy className="w-6 h-6 mr-2" />
                Copy Link
              </Button>
            </div>
            
            {/* Share Message Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Share Message:</p>
              <p className="text-gray-700 text-sm">{shareMessage}</p>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Referrals */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-3xl font-bold text-gray-800">{referralStats.total_referrals}</p>
                </div>
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(referralStats.total_earnings)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balance */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Wallet Balance</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(walletBalance.available_balance)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Rewards */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{referralStats.status_breakdown.pending}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown Cards */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Referral Status Breakdown</CardTitle>
            <CardDescription>Track the status of all your referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Pending</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{referralStats.status_breakdown.pending}</p>
                <p className="text-xs text-orange-600 mt-1">Awaiting payment</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Completed</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{referralStats.status_breakdown.completed}</p>
                <p className="text-xs text-blue-600 mt-1">Payment done</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Rewarded</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{referralStats.status_breakdown.rewarded}</p>
                <p className="text-xs text-green-600 mt-1">Reward credited</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Reversed</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{referralStats.status_breakdown.reversed}</p>
                <p className="text-xs text-red-600 mt-1">Refunded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Transaction History */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-violet-600" />
              Wallet Transactions
            </CardTitle>
            <CardDescription>Your referral reward history</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">Start referring friends to earn rewards!</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : '-'} {transaction.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.description || transaction.transaction_type}
                          </td>
                          <td className={`py-3 px-4 text-sm font-medium text-right ${
                            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">
                            {formatCurrency(transaction.balance_after || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {transactionPagination.total > transactionPagination.limit && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Showing {transactionPagination.skip + 1} - {Math.min(transactionPagination.skip + transactionPagination.limit, transactionPagination.total)} of {transactionPagination.total}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={transactionPagination.skip === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!transactionPagination.has_more}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Program Rules Section */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-violet-600" />
              How It Works
            </CardTitle>
            <CardDescription>Referral program rules and conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For Referrer */}
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                <h3 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  For You (Referrer)
                </h3>
                <ul className="space-y-2 text-sm text-violet-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Earn <strong>₹{referralStats.reward_per_referral}</strong> for each successful referral</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Reward credited after friend completes first payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Use wallet balance for subscription renewals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>No limit on number of referrals</span>
                  </li>
                </ul>
              </div>
              
              {/* For Referee */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  For Your Friend (Referee)
                </h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Get <strong>₹{referralStats.discount_for_referee}</strong> off on first subscription</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Enter referral code during signup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Discount applied automatically at checkout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Valid for new users only</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Terms & Conditions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                Terms & Conditions
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Referral rewards are credited only after the referee completes their first subscription payment</li>
                <li>• Self-referrals are not allowed and will be automatically detected</li>
                <li>• Each mobile number can only be used for one referral</li>
                <li>• Wallet balance can only be used for subscription payments</li>
                <li>• If a referee's payment is refunded within 7 days, the referral reward will be reversed</li>
                <li>• BillByteKOT reserves the right to modify or terminate the referral program at any time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReferEarnPage;

import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  CreditCard,
  Plus,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { dashboardApi } from "../lib/api-client";
import type { DashboardOverviewResponse } from "../lib/api-client";
import { Loader2, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userName = user?.name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getOverview();
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || "Failed to fetch dashboard data");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">
          Loading your financial overview...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Something went wrong
        </h2>
        <p className="text-slate-500 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Spent",
      value: formatCurrency(data?.stats.totalSpent || 0),
      change: `${data?.stats.transactionCount.spent || 0} txns`,
      changeType: "negative",
      icon: CreditCard,
      color: "from-stone-700 to-stone-800",
      bgColor: "bg-stone-100",
      textColor: "text-stone-700",
    },
    {
      name: "Total Received",
      value: formatCurrency(data?.stats.totalReceived || 0),
      change: `${data?.stats.transactionCount.received || 0} txns`,
      changeType: "positive",
      icon: Activity,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      name: "Total Added",
      value: formatCurrency(data?.stats.totalAdded || 0),
      change: `${data?.stats.transactionCount.added || 0} txns`,
      changeType: "positive",
      icon: Plus,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      name: "Total Withdrawn",
      value: formatCurrency(data?.stats.totalWithdrawn || 0),
      change: `${data?.stats.transactionCount.withdrawn || 0} txns`,
      changeType: "negative",
      icon: ArrowUpRight,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
  ];

  const recentTransactions =
    data?.recentTransactions.map((tx: any) => ({
      id: tx.id,
      name:
        tx.description ||
        (tx.type === "CREDIT" ? "Received Funds" : "Sent Funds"),
      amount: `${tx.type === "CREDIT" ? "+" : "-"}${formatCurrency(tx.amount)}`,
      date: new Date(tx.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      status:
        tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase(),
      type: tx.type.toLowerCase(),
      category: tx.flow,
    })) || [];

  return (
    <div className="space-y-10 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Good day, <span className="text-indigo-600">{userName}</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Everything looks set for your financial goals.
          </p>
        </motion.div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-2xl hover:bg-slate-50 transition-all card-shadow">
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]">
            <Send className="w-4 h-4" />
            Send Money
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-white rounded-4xl border border-slate-200/50 p-6 flex flex-col justify-between h-48 card-shadow transition-all duration-300 hover:border-indigo-100"
          >
            <div className="flex justify-between items-start">
              <div
                className={`p-3.5 ${stat.bgColor} ${stat.textColor} rounded-2xl shadow-sm border border-white/50`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                  stat.changeType === "positive"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                    : stat.changeType === "negative"
                      ? "bg-red-50 text-red-600 border-red-100/50"
                      : "bg-slate-50 text-slate-600 border-slate-100/50"
                }`}
              >
                {stat.changeType === "positive" ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : stat.changeType === "negative" ? (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                ) : (
                  <Activity className="h-2.5 w-2.5" />
                )}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                {stat.name}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">
                {stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-4xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-7 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Recent Activity
              </h2>
              <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                Updated just now
              </p>
            </div>
            <button className="text-indigo-600 text-xs font-bold hover:underline underline-offset-4">
              View All
            </button>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-6 flex items-center justify-between hover:bg-slate-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 ${
                      tx.type === "credit"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                        : "bg-indigo-50 text-indigo-600 border-indigo-100/50"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownRight className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {tx.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {tx.date}
                      </span>
                      <span className="h-0.5 w-0.5 rounded-full bg-slate-300"></span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-base font-bold tracking-tight ${tx.type === "credit" ? "text-emerald-600" : "text-slate-800"}`}
                  >
                    {tx.amount}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mt-1 border ${
                      tx.status === "Success" || tx.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100/50"
                        : tx.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-100/50"
                          : "bg-red-50 text-red-700 border-red-100/50"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Mock Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-4xl p-7 border border-slate-200/50 shadow-sm relative overflow-hidden h-full flex flex-col">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Spending
                </h2>
                <p className="text-slate-400 text-[10px] font-bold">
                  This Week
                </p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-all">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-end gap-2.5 mb-8 h-32 relative z-10 px-2">
              {[35, 60, 40, 85, 55, 75, 50].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="flex-1 bg-indigo-50 rounded-t-lg relative group transition-colors hover:bg-indigo-100"
                >
                  <div className="absolute inset-0 bg-indigo-200 opacity-0 group-hover:opacity-30 rounded-t-lg transition-opacity"></div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-slate-50/80 rounded-3xl p-5 border border-slate-100/50 mt-auto">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  Weekly Avg
                </p>
                <p className="text-lg font-bold text-slate-800">$1,240.00</p>
              </div>
              <div className="h-9 w-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-4xl p-7 text-white shadow-lg shadow-indigo-600/10 relative overflow-hidden group border border-indigo-500/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                <Activity className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold tracking-tight">
                Premium Support
              </h2>
            </div>
            <p className="text-white/80 text-xs font-medium leading-relaxed mb-6">
              Get instant help from our team.
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-sm">
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

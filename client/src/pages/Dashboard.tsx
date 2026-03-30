import {
  ArrowUpRight,
  Activity,
  CreditCard,
  Plus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { dashboardApi } from "../lib/api-client";
import type { DashboardOverviewResponse } from "../lib/api-client";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DashboardHeader,
  StatsGrid,
  RecentTransactions,
  SupportCard,
  SecurityOverview,
} from "../components/dashboard";
import type { StatItem, TransactionItem } from "../components/dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats: StatItem[] = [
    {
      name: "Total Spent",
      value: formatCurrency(data?.stats.totalSpent || 0),
      change: `${data?.stats.transactionCount.spent || 0} txns`,
      changeType: "negative",
      icon: CreditCard,
      bgColor: "bg-stone-100",
      textColor: "text-stone-700",
    },
    {
      name: "Total Received",
      value: formatCurrency(data?.stats.totalReceived || 0),
      change: `${data?.stats.transactionCount.received || 0} txns`,
      changeType: "positive",
      icon: Activity,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      name: "Total Added",
      value: formatCurrency(data?.stats.totalAdded || 0),
      change: `${data?.stats.transactionCount.added || 0} txns`,
      changeType: "positive",
      icon: Plus,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      name: "Total Withdrawn",
      value: formatCurrency(data?.stats.totalWithdrawn || 0),
      change: `${data?.stats.transactionCount.withdrawn || 0} txns`,
      changeType: "negative",
      icon: ArrowUpRight,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
  ];

  const recentTransactions: TransactionItem[] =
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
      <DashboardHeader
        userName={userName}
        onAddFunds={() => navigate("/dashboard/wallet")}
        onSendMoney={() => navigate("/dashboard/transfer")}
      />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <RecentTransactions
          transactions={recentTransactions}
          onViewAll={() => navigate("/dashboard/transactions")}
        />

        <div className="space-y-6">
          <SupportCard />
          <SecurityOverview
            emailVerified={user?.emailVerified}
            onSecureAccount={() => navigate("/dashboard/profile")}
          />
        </div>
      </div>
    </div>
  );
}

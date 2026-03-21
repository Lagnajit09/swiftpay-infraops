import { useState, useEffect } from "react";
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  PlusCircle,
  Activity,
  RefreshCcw,
} from "lucide-react";
import { walletApi, userApi, type WalletData } from "../lib/api-client";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Loader";

const Wallet = () => {
  const { user, checkAuth } = useAuth();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await walletApi.getWallet();

      if (res.success && res.data) {
        setWallet(res.data);
      } else {
        setError(res.message || "Failed to load wallet data.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching the wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create the wallet via /api/wallet
      const walletRes = await walletApi.getWallet();
      if (!walletRes.success || !walletRes.data) {
        throw new Error(walletRes.message || "Failed to create wallet");
      }

      // 2. Link the created wallet to the user via /api/user/update-user
      const updateRes = await userApi.updateUser({
        walletID: walletRes.data.walletId,
      });
      if (!updateRes.success) {
        throw new Error(
          updateRes.message || "Failed to link wallet to your profile",
        );
      }

      // 3. Update Auth Context so user.walletID is refreshed in the UI
      await checkAuth();

      // 4. Update local component state to show wallet immediately
      setWallet(walletRes.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the wallet.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if user has already linked a wallet previously
  useEffect(() => {
    if (user?.walletID && !wallet) {
      fetchWallet();
    }
  }, [user?.walletID]);

  // Helper to format currency
  const formatBalance = (balanceStr: string, currency: string) => {
    const num = parseFloat(balanceStr);
    if (isNaN(num)) return `0.00 ${currency}`;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 2,
    }).format(num / 100);
  };

  if (loading && !wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader />
        <p className="text-slate-500 font-medium">Loading your wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Wallet
        </h1>
        <p className="text-slate-500 mt-2 text-base">
          Manage your digital funds, deposit money, and withdraw to your bank.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center space-x-3">
          <Activity className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!user?.walletID ? (
        // Empty State: Create First Wallet
        <div className="bg-linear-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-12 flex flex-col items-center justify-center min-h-[400px] text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <WalletIcon className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Create your first wallet
          </h2>
          <p className="text-slate-500 max-w-md mb-8">
            Get started by initializing your digital wallet. You can then add
            money, transfer to friends, and withdraw securely.
          </p>
          <button
            onClick={handleCreateWallet}
            disabled={loading}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 transform hover:-translate-y-0.5 cursor-pointer"
          >
            {loading ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
            <span>{loading ? "Creating..." : "Create Wallet"}</span>
          </button>
        </div>
      ) : (
        // Active Wallet State
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Balance Card */}
          <div className="lg:col-span-2 relative group rounded-3xl text-white p-8 lg:p-10 shadow-xl overflow-hidden bg-slate-900 transition-all hover:shadow-2xl">
            {/* Background elements for premium aesthetic */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-linear-to-br from-indigo-500/20 to-purple-500/0 blur-3xl group-hover:from-indigo-500/30 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-linear-to-tr from-cyan-500/20 to-emerald-500/0 blur-3xl group-hover:from-cyan-500/30 transition-all duration-700" />

            <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <WalletIcon className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium text-sm tracking-wide uppercase">
                      Total Balance
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-slate-300 capitalize">
                        {wallet?.status?.toLowerCase() || "Active"}
                      </span>
                    </div>
                  </div>
                </div>
                {wallet?.currency && (
                  <span className="bg-white/10 text-indigo-200 py-1.5 px-3 rounded-full text-xs font-semibold backdrop-blur-md border border-white/5">
                    {wallet.currency}
                  </span>
                )}
              </div>

              <div className="mt-8">
                <h2 className="text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
                  {wallet
                    ? formatBalance(wallet.balance, wallet.currency)
                    : "---"}
                </h2>
                <p className="text-slate-400 mt-3 text-sm flex items-center">
                  Wallet ID:{" "}
                  <span className="font-mono text-slate-300 ml-2">
                    {wallet?.walletId || "Loading..."}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col justify-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Quick Actions
            </h3>

            <button
              onClick={() => alert("Add Money API integration coming soon!")}
              className="group w-full flex items-center justify-between bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 group-hover:bg-indigo-500/30 p-3 rounded-xl transition-colors">
                  <ArrowDownToLine className="w-6 h-6 group-hover:text-white transition-colors" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-base transition-colors">
                    Add Money
                  </span>
                  <span className="block text-xs text-indigo-500/70 group-hover:text-indigo-200 transition-colors">
                    Deposit from bank
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                alert("Withdraw Money API integration coming soon!")
              }
              className="group w-full flex items-center justify-between bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 group-hover:bg-emerald-400/30 p-3 rounded-xl transition-colors">
                  <ArrowUpFromLine className="w-6 h-6 group-hover:text-white transition-colors" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-base transition-colors">
                    Withdraw
                  </span>
                  <span className="block text-xs text-emerald-600/70 group-hover:text-emerald-100 transition-colors">
                    Transfer to bank
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

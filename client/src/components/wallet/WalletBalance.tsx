import { Wallet as WalletIcon } from "lucide-react";
import type { WalletData } from "../../lib/api-client";

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

interface WalletBalanceProps {
  wallet: WalletData | null;
}

export function WalletBalance({ wallet }: WalletBalanceProps) {
  return (
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
  );
}

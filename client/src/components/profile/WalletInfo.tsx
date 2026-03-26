import { motion } from "framer-motion";
import { CreditCard, Copy, CheckCircle2 } from "lucide-react";
import type { User, WalletData } from "../../lib/api-client";

interface WalletInfoProps {
  user: User | null;
  wallet: WalletData | null;
  copied: boolean;
  onCopyWalletId: () => void;
}

const WalletInfo = ({
  user,
  wallet,
  copied,
  onCopyWalletId,
}: WalletInfoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-4xl border border-slate-200/60 overflow-hidden shadow-sm card-shadow flex flex-col"
    >
      <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Wallet Information
            </h2>
            <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
              Your primary application wallet
            </p>
          </div>
        </div>
      </div>

      <div className="p-7">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
            Primary Wallet ID
          </p>
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200/60">
            <span className="font-mono text-sm text-slate-700">
              {user?.walletID || "No wallet assigned yet"}
            </span>
            {user?.walletID && (
              <button
                onClick={onCopyWalletId}
                className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-md transition-colors"
                title="Copy Wallet ID"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Currency
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {wallet?.currency || "USD"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Wallet Status
              </p>
              <p className="inline-flex py-0.5 px-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 capitalize">
                {wallet?.status?.toLowerCase() || "Active"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletInfo;

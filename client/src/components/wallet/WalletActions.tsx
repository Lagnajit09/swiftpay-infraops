import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface WalletActionsProps {
  setIsAddMoneyOpen: (isOpen: boolean) => void;
  setIsWithdrawOpen: (isOpen: boolean) => void;
}

export function WalletActions({ setIsAddMoneyOpen, setIsWithdrawOpen }: WalletActionsProps) {
  return (
    <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col justify-center space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />

      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Quick Actions
      </h3>

      <button
        onClick={() => setIsAddMoneyOpen(true)}
        className="group w-full flex items-center justify-between bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
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
        onClick={() => setIsWithdrawOpen(true)}
        className="group w-full flex items-center justify-between bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white p-5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
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
  );
}

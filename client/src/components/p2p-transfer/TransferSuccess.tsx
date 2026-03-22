import React from "react";
import { CheckCircle2 } from "lucide-react";

interface TransferSuccessProps {
  amount: string;
  recipientName: string;
  onReset: () => void;
}

const TransferSuccess: React.FC<TransferSuccessProps> = ({ amount, recipientName, onReset }) => {
  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-12 flex flex-col items-center justify-center animate-in zoom-in duration-500">
        <div className="h-24 w-24 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Money Sent!</h2>
        <p className="text-slate-500 text-center text-lg mb-8 max-w-sm">
          Your transfer was completed instantly and securely.
        </p>
        
        <div className="w-full bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Sent</p>
              <p className="text-2xl font-bold text-slate-900">₹{amount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 mb-1">To</p>
              <p className="text-lg font-bold text-slate-900">{recipientName}</p>
            </div>
        </div>

        <button 
          onClick={onReset}
          className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all active:scale-[0.98]"
        >
          Make Another Transfer
        </button>
      </div>
    </div>
  );
};

export default TransferSuccess;

import { Plus, Send } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  userName: string;
  onAddFunds: () => void;
  onSendMoney: () => void;
}

export function DashboardHeader({
  userName,
  onAddFunds,
  onSendMoney,
}: DashboardHeaderProps) {
  return (
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
        <button
          onClick={onAddFunds}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-2xl hover:bg-slate-50 transition-all card-shadow"
        >
          <Plus className="w-4 h-4" />
          Add Funds
        </button>
        <button
          onClick={onSendMoney}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          Send Money
        </button>
      </div>
    </div>
  );
}

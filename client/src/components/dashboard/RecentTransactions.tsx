import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface TransactionItem {
  id: string;
  name: string;
  amount: string;
  date: string;
  status: string;
  type: string;
  category: string;
}

interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onViewAll: () => void;
}

export function RecentTransactions({
  transactions,
  onViewAll,
}: RecentTransactionsProps) {
  return (
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
        <button
          onClick={onViewAll}
          className="text-indigo-600 text-xs font-bold hover:underline underline-offset-4"
        >
          View All
        </button>
      </div>
      <div className="flex-1 divide-y divide-slate-50">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
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
          ))
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <p className="text-slate-400 text-sm font-medium">No recent activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

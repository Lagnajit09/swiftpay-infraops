import { motion } from "framer-motion";
import { Building2, ExternalLink } from "lucide-react";
import { bankAccounts } from "../../constants/account-data";

const ConnectedAccounts = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-4xl border border-slate-200/60 overflow-hidden shadow-sm card-shadow flex flex-col"
    >
      <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Connected Accounts
            </h2>
            <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
              External banks and cards
            </p>
          </div>
        </div>
        <button className="text-indigo-600 text-xs font-bold hover:underline underline-offset-4">
          Add New
        </button>
      </div>

      <div className="p-7">
        <div className="space-y-4">
          {bankAccounts.map((account, index) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm border ${
                    index % 2 === 0
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-red-50 text-red-600 border-red-100"
                  }`}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {account.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    **** **** **** {account.accountNumber.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {index === 0 && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    Primary
                  </span>
                )}
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ConnectedAccounts;

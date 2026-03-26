import { motion } from "framer-motion";
import { Mail, CheckCircle2, Shield } from "lucide-react";
import type { User } from "../../lib/api-client";

interface SecurityStatusProps {
  user: User | null;
}

const SecurityStatus = ({ user }: SecurityStatusProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-4xl border border-slate-200/60 p-7 shadow-sm card-shadow"
    >
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-5">
        Security Status
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Email Address
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {user?.emailVerified ? "Verified" : "Unverified"}
              </p>
            </div>
          </div>
          {user?.emailVerified ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <button className="text-indigo-600 text-xs font-bold hover:underline">
              Verify
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Two-Factor Auth
              </p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Not Enabled
              </p>
            </div>
          </div>
          <button className="text-indigo-600 text-xs font-bold hover:underline">
            Enable
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityStatus;

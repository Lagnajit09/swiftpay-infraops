import { Shield, CheckCircle2 } from "lucide-react";

interface SecurityOverviewProps {
  emailVerified?: boolean;
  onSecureAccount: () => void;
}

export function SecurityOverview({
  emailVerified,
  onSecureAccount,
}: SecurityOverviewProps) {
  return (
    <div className="bg-slate-900 rounded-4xl p-7 text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
          <Shield className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-bold tracking-tight">Security Overview</h2>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
            Verification
          </span>
          {emailVerified ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Verified
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              Unverified
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
            2FA Status
          </span>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
            Security Warning
          </span>
        </div>
      </div>

      <button
        onClick={onSecureAccount}
        className="w-full py-3 bg-white text-slate-900 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm"
      >
        Secure Account
      </button>
    </div>
  );
}

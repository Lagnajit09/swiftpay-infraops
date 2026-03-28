import React from "react";
import { Mail, AlertCircle, Save } from "lucide-react";
import type { User } from "../../lib/api-client";

interface GeneralTabProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  user: User | null;
  handleUpdateEmail: (e: React.FormEvent) => Promise<void>;
  handleRequestVerification: () => Promise<void>;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  email,
  setEmail,
  isLoading,
  user,
  handleUpdateEmail,
  handleRequestVerification,
}) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">General Settings</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Update your email address and basic preferences.
        </p>
      </div>

      <form onSubmit={handleUpdateEmail} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800 bg-white"
              required
            />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Changing your email will require verification.
          </p>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          {user && !user.emailVerified && (
            <button
              type="button"
              onClick={handleRequestVerification}
              disabled={isLoading}
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 px-6 py-2.5 rounded-xl font-bold text-sm border border-amber-200 transition-colors disabled:opacity-70"
            >
              {isLoading ? "Sending..." : "Verify Email"}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Update Email
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

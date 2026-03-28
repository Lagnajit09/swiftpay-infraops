import React from "react";
import { Lock, Save } from "lucide-react";

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  isLoading: boolean;
  handleChangePassword: (e: React.FormEvent) => Promise<void>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  handleChangePassword,
}) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Security</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Update your password and secure your account.
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Current Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800 bg-white"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800 bg-white"
              placeholder="New password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800 bg-white"
              placeholder="Confirm new password"
              required
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              "Updating..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

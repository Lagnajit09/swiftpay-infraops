import React from "react";
import { Search, UserCheck, FileText, Send, Loader2 } from "lucide-react";

interface TransferFormProps {
  recipientWalletId: string;
  setRecipientWalletId: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  saveContact: boolean;
  setSaveContact: (val: boolean) => void;
  isSearching: boolean;
  resolvedUser: { name: string; isVerified: boolean } | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({
  recipientWalletId,
  setRecipientWalletId,
  amount,
  setAmount,
  description,
  setDescription,
  saveContact,
  setSaveContact,
  isSearching,
  resolvedUser,
  isLoading,
  onSubmit,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

      <div className="p-6 sm:p-10 space-y-8">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Recipient Input & Lookup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                Send TO <span className="text-indigo-500">*</span>
              </label>
              {isSearching && (
                <span className="text-xs font-medium text-indigo-500 flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching network...
                </span>
              )}
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="text"
                value={recipientWalletId}
                onChange={(e) => setRecipientWalletId(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                placeholder="Enter Wallet ID (e.g. wlt_abcd1234)"
                required
              />
            </div>

            {/* Resolved User Card */}
            {resolvedUser && !isSearching && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300 mt-2 flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="bg-white p-2 border border-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {resolvedUser.name}
                  </p>
                  <p className="text-xs font-medium text-indigo-600">
                    SwiftPay Verified User
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
              Amount (₹) <span className="text-indigo-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-2xl font-light text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  ₹
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-3xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description & Save Contact Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                What's this for?
              </label>
              <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                Optional
              </span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 pt-4 pointer-events-none">
                <FileText className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none h-24 shadow-inner shadow-slate-50/50"
                placeholder="Dinner, rent, birthday gift..."
              />
            </div>
          </div>

          {/* Save Contact Toggle */}
          <div
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer"
            onClick={() => setSaveContact(!saveContact)}
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={saveContact}
                onChange={(e) => setSaveContact(e.target.checked)}
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${saveContact ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${saveContact ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Save to My Contacts
              </p>
              <p className="text-xs font-medium text-slate-500">
                Easily find them next time
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !recipientWalletId || !amount}
              className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-slate-900 group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:-mt-1 group-hover:translate-x-1 transition-all" />
                  Send Payment Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;

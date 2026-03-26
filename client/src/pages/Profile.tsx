import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { walletApi, type WalletData } from "../lib/api-client";
import { bankAccounts } from "../constants/account-data";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  CreditCard,
  LogOut,
  CheckCircle2,
  Copy,
  ExternalLink,
  Building2,
} from "lucide-react";
const generateAccountId = (email?: string, id?: string | number) => {
  if (!email || id === undefined) return "N/A";
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const hashStr = Math.abs(hash).toString(36).substring(0, 4).padEnd(4, "0");
  const prefix = email.split("@")[0].replace(/[^a-zA-Z]/g, "").substring(0, 4).toLowerCase().padEnd(4, "x");
  return `${prefix}${hashStr}${id}`;
};

const Profile = () => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (user?.walletID) {
          const res = await walletApi.getWallet();
          if (res.success) {
            setWallet(res.data);
          }
        }
      } catch (error) {
        console.error("Error fetching wallet details:", error);
      }
    };
    fetchWallet();
  }, [user]);

  const handleCopyWalletId = () => {
    if (user?.walletID) {
      navigator.clipboard.writeText(user.walletID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "No email provided";
  const displayPhone = user?.number || "Not added";
  const displayRole = user?.role || "Standard User";

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            My Profile
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Manage your personal information, security, and preferences.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Info & Navigation */}
        <div className="space-y-6">
          {/* User ID Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-4xl border border-slate-200/60 p-8 shadow-sm text-center relative overflow-hidden card-shadow"
          >
            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-r from-indigo-500 to-indigo-600"></div>

            <div className="relative z-10 flex flex-col items-center mt-8">
              <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-lg mb-4">
                <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border border-indigo-200">
                  {getInitials(displayName)}
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {displayName}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{displayEmail}</span>
              </div>

              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide border border-indigo-100/50 uppercase">
                {displayRole}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* Security Summary Card */}
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
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-4xl border border-slate-200/60 overflow-hidden shadow-sm card-shadow flex flex-col"
          >
            <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Personal Details
                  </h2>
                  <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                    Your basic information
                  </p>
                </div>
              </div>
              <button className="text-indigo-600 text-xs font-bold hover:underline underline-offset-4 bg-indigo-50 px-3 py-1.5 rounded-lg">
                Edit Details
              </button>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                    Full Name
                  </p>
                  <p className="text-base font-semibold text-slate-800">
                    {displayName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                    Email Address
                  </p>
                  <p className="text-base font-semibold text-slate-800">
                    {displayEmail}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                    Phone Number
                  </p>
                  <p className="text-base font-semibold text-slate-800">
                    {displayPhone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                    Account ID
                  </p>
                  <p className="text-xs font-semibold text-slate-800 font-mono break-all">
                    {generateAccountId(user?.email, user?.id)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wallet Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-4xl border border-slate-200/60 overflow-hidden shadow-sm card-shadow flex flex-col"
          >
            <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Wallet Information
                  </h2>
                  <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                    Your primary application wallet
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Primary Wallet ID
                </p>
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200/60">
                  <span className="font-mono text-sm text-slate-700">
                    {user?.walletID || "No wallet assigned yet"}
                  </span>
                  {user?.walletID && (
                    <button
                      onClick={handleCopyWalletId}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Copy Wallet ID"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                      Currency
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {wallet?.currency || "USD"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                      Wallet Status
                    </p>
                    <p className="inline-flex py-0.5 px-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 capitalize">
                      {wallet?.status?.toLowerCase() || "Active"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Connected Accounts */}
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
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm border ${index % 2 === 0 ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-red-50 text-red-600 border-red-100"}`}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;

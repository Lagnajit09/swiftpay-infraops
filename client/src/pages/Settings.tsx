import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  BellRing,
  Mail,
  Lock,
  Smartphone,
  AlertCircle,
  Save,
  User,
  Trash2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type TabId = "general" | "account" | "security" | "notifications";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isLoading, setIsLoading] = useState(false);

  // General state
  const [email, setEmail] = useState("");

  // Populate state on load
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification state
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Handlers
  const handleSave = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, toast success here & integrate API
    }, 800);
  };

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: SettingsIcon,
      description: "Basic account settings",
    },
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Manage your account",
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
      description: "Passwords and authentication",
    },

    {
      id: "notifications",
      label: "Notifications",
      icon: BellRing,
      description: "Manage your alerts",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Settings
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Manage your account preferences, security, and notifications.
          </p>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-4xl border border-slate-200/60 overflow-hidden shadow-sm card-shadow flex flex-col md:flex-row min-h-[600px] mb-8"
      >
        {/* Sidebar */}
        <div className="md:w-72 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30 p-6 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left ${
                activeTab === tab.id
                  ? "bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm"
                  : "hover:bg-slate-100 text-slate-600 border border-transparent"
              }`}
            >
              <div
                className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-100/50 text-indigo-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <tab.icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${activeTab === tab.id ? "text-indigo-900" : "text-slate-700"}`}
                >
                  {tab.label}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                  {tab.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 p-8 grid place-items-start">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {activeTab === "general" && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      General Settings
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Update your email address and basic preferences.
                    </p>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
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
                        Changing your email may require verification.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-70"
                      >
                        {isLoading ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "account" && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      Account Management
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Manage your account status and data.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="bg-amber-100 text-amber-600 h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <LogOut className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Deactivate Account
                          </h3>
                          <p className="text-sm text-slate-500 font-medium mt-0.5 max-w-md">
                            Temporarily disable your account. You can reactivate
                            it anytime by logging back in.
                          </p>
                        </div>
                      </div>
                      <button className="whitespace-nowrap px-6 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm border border-amber-100 hover:bg-amber-100 transition-colors">
                        Deactivate
                      </button>
                    </div>

                    <div className="p-6 rounded-3xl border border-red-100 bg-red-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="bg-red-100 text-red-600 h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Trash2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-red-900">
                            Delete Account
                          </h3>
                          <p className="text-sm text-red-600/70 font-medium mt-0.5 max-w-md">
                            Permanently remove your account and all associated
                            data. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                      <button className="whitespace-nowrap px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-sm hover:bg-red-700 transition-colors">
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      Security
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Update your password and secure your account.
                    </p>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6">
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
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      Notifications
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Choose how you want to be notified by us.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 text-indigo-600 h-10 w-10 rounded-xl flex items-center justify-center">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Email Notifications
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Receive transaction updates and alerts via email.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEmailNotif(!emailNotif)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotif ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotif ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-200 text-slate-600 h-10 w-10 rounded-xl flex items-center justify-center">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            SMS Notifications
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Get instant text messages for important activity.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSmsNotif(!smsNotif)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smsNotif ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsNotif ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-70"
                      >
                        {isLoading ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> Save Preferences
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  BellRing,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authApi, userApi } from "../lib/api-client";
import { useToast } from "../components/auth/ToastProvider";

// Subcomponents
import { GeneralTab } from "../components/settings/GeneralTab";
import { AccountTab } from "../components/settings/AccountTab";
import { SecurityTab } from "../components/settings/SecurityTab";
import { NotificationsTab } from "../components/settings/NotificationsTab";

type TabId = "general" | "account" | "security" | "notifications";

const Settings = () => {
  const { user, logout, checkAuth } = useAuth();
  const { success, error: showError } = useToast();
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

  // --- Handlers ---

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === user?.email) {
      showError("Please enter a new email address");
      return;
    }

    setIsLoading(true);
    try {
      const updateRes = await userApi.updateEmail(email);
      if (updateRes.success) {
        await authApi.requestEmailVerification();
        await checkAuth(true);
        success(
          "Email updated. A verification link has been sent to your new address."
        );
      }
    } catch (err: any) {
      showError(err.message || "Failed to update email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.requestEmailVerification();
      if (res.success) {
        success("Verification email sent! Please check your inbox.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to resend verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      if (res.success) {
        success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      showError(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.deactivateAccount();
      if (res.success) {
        success("Account deactivated successfully");
        await logout();
      }
    } catch (err: any) {
      showError(err.message || "Failed to deactivate account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.deleteAccount();
      if (res.success) {
        success("Account deleted permanently");
        await logout();
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      success("Notification preferences updated");
    }, 600);
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
                className={`p-2 rounded-xl shrink-0 transition-colors ${
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
                >
                  <GeneralTab
                    email={email}
                    setEmail={setEmail}
                    isLoading={isLoading}
                    user={user}
                    handleUpdateEmail={handleUpdateEmail}
                    handleRequestVerification={handleRequestVerification}
                  />
                </motion.div>
              )}

              {activeTab === "account" && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccountTab
                    isLoading={isLoading}
                    handleDeactivate={handleDeactivate}
                    handleDelete={handleDelete}
                  />
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SecurityTab
                    currentPassword={currentPassword}
                    setCurrentPassword={setCurrentPassword}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    isLoading={isLoading}
                    handleChangePassword={handleChangePassword}
                  />
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <NotificationsTab
                    emailNotif={emailNotif}
                    setEmailNotif={setEmailNotif}
                    smsNotif={smsNotif}
                    setSmsNotif={setSmsNotif}
                    isLoading={isLoading}
                    handleSaveNotifications={handleSaveNotifications}
                  />
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

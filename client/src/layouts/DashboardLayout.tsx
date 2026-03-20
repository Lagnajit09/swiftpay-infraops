import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  History,
  Settings,
  User,
  LogOut,
  Bell,
  Zap,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../lib/api-client";
import { useToast } from "../components/auth/ToastProvider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "P2P Transfer", href: "/dashboard/transfer", icon: ArrowRightLeft },
  { name: "Transactions", href: "/dashboard/transactions", icon: History },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await authApi.requestEmailVerification();
      if (response.success) {
        success("Verification email sent! Please check your inbox.");
      } else {
        error(response.message || "Failed to send verification email");
      }
    } catch (err: any) {
      error(err.message || "Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  const userInitial =
    user?.name?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";
  const userName =
    user?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-dashboard font-sans selection:bg-indigo-500 selection:text-white flex">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 bg-white fixed h-full z-30 transition-all duration-300 border-r border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-start h-20 px-8">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/10 group-hover:scale-105 transition-transform duration-300">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Swift<span className="text-indigo-600">Pay</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-6 space-y-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            General
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-3xl p-4 mb-6 border border-slate-200/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-bold border border-slate-200 shadow-sm">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {userName}
                </p>
                <p className="text-[10px] font-medium text-slate-500 truncate uppercase tracking-wider">
                  Personal Account
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Sign Out
            </button>
          </div>

          <button className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all">
            Upgrade Plan
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen transition-all duration-300">
        {/* Top Navbar */}
        <header className="h-20 glass sticky top-0 z-20 flex items-center justify-between px-6 sm:px-10 border-b border-slate-200/40">
          <div className="flex items-center md:hidden">
            <Link
              to="/dashboard"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              Swift<span className="text-indigo-600">Pay</span>
            </Link>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="hidden sm:block">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {navigation.find((n) => n.href === location.pathname)?.name ||
                  "Overview"}
              </h2>
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/50">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Secure Connection
                </span>
              </div>

              <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 transition-all rounded-xl hover:bg-indigo-50 group">
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-indigo-500 rounded-full ring-2 ring-white"></span>
                <Bell className="h-5 w-5" />
              </button>

              <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Email Verification Banner */}
        {user && !user.emailVerified && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Email is not verified
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Verify your email to unlock all features of your account.
                  </p>
                </div>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {isResending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isResending ? "Sending..." : "Verify to continue"}
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useToast } from "./ToastProvider";
import { motion } from "framer-motion";
import { authApi } from "../../lib/api-client";

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    if (!token) {
      error("Reset token is missing. Please use the link from your email.");
      return false;
    }
    if (!newPassword) {
      error("Please enter a new password.");
      return false;
    }
    if (newPassword.length < 8) {
      error("Password must be at least 8 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({ token, newPassword });

      if (response.success) {
        success("Password reset successfully!");
        setIsSuccess(true);
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      } else {
        error(response.message || "Failed to reset password. Please try again.");
      }
    } catch (err: any) {
      error(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  // No token in URL — show a friendly error state
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Invalid Reset Link</h3>
          <p className="text-sm font-medium text-slate-600">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
        </div>

        <Link
          to="/forgot-password"
          className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-indigo-600 transition-all shadow-md shadow-indigo-200"
        >
          Request New Link
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Password Updated!</h3>
          <p className="text-sm font-medium text-slate-600">
            Your password has been reset successfully. Redirecting you to sign
            in…
          </p>
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sign In
        </Link>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* New Password */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-900 bg-white placeholder-slate-400 font-medium"
            placeholder="Min. 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-900 bg-white placeholder-slate-400 font-medium"
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {/* Inline match indicator */}
        {confirmPassword && (
          <p
            className={`mt-1.5 text-xs font-semibold ${
              newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
          </p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-200 text-base font-bold text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-75 disabled:cursor-not-allowed group"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Reset Password
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </motion.button>

      <div className="flex justify-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
};

export default ResetPasswordForm;

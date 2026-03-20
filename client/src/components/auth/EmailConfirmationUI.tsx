import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { authApi } from "../../lib/api-client";
import { useAuth } from "../../contexts/AuthContext";


const EmailConfirmationUI = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  const { checkAuth } = useAuth();
  const hasVerified = useRef(false);

  useEffect(() => {
    const mainFlow = async () => {
      // Prevent double execution in React Strict Mode which incorrectly consumes token
      if (hasVerified.current) return;
      hasVerified.current = true;

      // Step A: Verification
      try {
        if (!token) {
          throw new Error("Invalid or missing verification token.");
        }

        const response = await authApi.verifyEmail(token);
        if (response.success) {
          setStatus("success");
          // Refresh user session to update the 'emailVerified' flag in context
          await checkAuth();
        } else {
          setStatus("error");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        
        // Handle case where token is legitimately already used/verified in a previous session
        if (err.message && err.message.toLowerCase().includes("already")) {
          setStatus("success");
          await checkAuth();
        } else {
          setStatus("error");
        }
      }
    };

    mainFlow();
  }, [token, checkAuth]);

  return (
    <div className="space-y-8 text-center pt-8">
      {status === "loading" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/20 animate-pulse"></div>
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center relative border border-slate-100">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">
              Verifying your email
            </h3>
            <p className="text-slate-500 font-medium">
              Please wait a moment while we confirm your details...
            </p>
          </div>
        </motion.div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/20"></div>
            <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-emerald-500/10 flex items-center justify-center relative border border-slate-100">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">
              Email Verified!
            </h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              Your email has been successfully verified. You can now access all
              features of your SwiftPay account.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-md shadow-indigo-200 text-base font-bold text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all group mt-4"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-red-500/20"></div>
            <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-red-500/10 flex items-center justify-center relative border border-slate-100">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">
              Verification Failed
            </h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              This verification link appears to be invalid or has expired.
              Please try requesting a new one.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 border border-transparent rounded-full shadow-md shadow-indigo-200 text-base font-bold text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all group mt-4"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-8 border border-slate-200 rounded-full text-base font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm mt-4"
          >
            Back to Sign Up
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default EmailConfirmationUI;

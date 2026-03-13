import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "./ToastProvider";
import { motion } from "framer-motion";

const SignUpForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const validate = () => {
    if (!fullName.trim()) {
      error("Full name is required");
      return false;
    }
    if (fullName.trim().length < 2) {
      error("Full name must be at least 2 characters long");
      return false;
    }

    if (!email) {
      error("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error("Please enter a valid email address");
      return false;
    }

    if (!password) {
      error("Password is required");
      return false;
    }
    if (password.length < 8) {
      error("Password must be at least 8 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      // Simulate API call for now since server integration is not yet required
      await new Promise((resolve) => setTimeout(resolve, 1500));

      success("Account created successfully!");
    } catch (err: any) {
      error(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-900 bg-white placeholder-slate-400 font-medium"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-900 bg-white placeholder-slate-400 font-medium"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-900 bg-white placeholder-slate-400 font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none text-slate-900 bg-white placeholder-slate-400 font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-200 text-base font-bold text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-75 disabled:cursor-not-allowed group mt-2"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </motion.button>

      <p className="text-center text-sm font-medium text-slate-600 mt-4">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Sign in here
        </Link>
      </p>
    </form>
  );
};

export default SignUpForm;

import React from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex text-slate-900 bg-gray-50 font-['Montserrat']">
      {/* Left Pane - Abstract/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-linear-to-br from-indigo-500/40 to-purple-500/40 blur-3xl opacity-50" />
          <div className="absolute top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-blue-500/40 to-emerald-500/40 blur-3xl opacity-50" />
        </div>
        
        <div className="relative z-10 p-12 max-w-lg text-white">
          <Link to="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-90 transition-opacity">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-900/50">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Swift<span className="text-indigo-400">Pay</span>
            </span>
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-black leading-[1.2] mb-6"
          >
            The New Standard in <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">
              P2P Payments.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-slate-300 font-medium leading-relaxed"
          >
            Join millions who trust SwiftPay for seamless transactions. Manage your finances with zero hidden fees and ultra-fast transfers.
          </motion.p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 lg:hidden flex justify-center">
             <Link to="/" className="inline-flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-800">
                Swift<span className="text-indigo-600">Pay</span>
              </span>
            </Link>
          </div>

          <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{title}</h2>
            <p className="text-slate-500 font-medium mb-8">{subtitle}</p>
            
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

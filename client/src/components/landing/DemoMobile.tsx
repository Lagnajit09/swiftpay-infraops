import { motion } from "framer-motion";
import {
  ShieldCheck,
  ArrowDownUp,
  Zap,
  Wallet,
  Smartphone,
  CheckCircle,
} from "lucide-react";

const DemoMobile = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      className="relative mx-auto w-full max-w-[320px] lg:max-w-[300px] xl:max-w-[340px] lg:mt-20"
    >
      {/* Decorative blobs behind phone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[70%] bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl z-0"></div>

      {/* Phone Frame */}
      <div className="relative z-10 bg-slate-900 p-3 rounded-[3rem] shadow-2xl shadow-indigo-500/20 border border-slate-800 aspect-[9/19] overflow-hidden transform group hover:-translate-y-2 transition-transform duration-500">
        {/* Screen */}
        <div className="bg-slate-50 w-full h-full rounded-[2.5rem] overflow-hidden relative flex flex-col">
          {/* Top Notch Area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-20"></div>

          {/* App Header */}
          <div className="bg-indigo-600 px-6 pt-12 pb-16 text-white rounded-b-3xl shrink-0">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold border border-white/30">
                  JD
                </div>
                <span className="font-semibold text-sm">Hi, John! 👋</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-indigo-200" />
            </div>
            <div className="text-indigo-100 text-sm font-medium mb-1">
              Total Balance
            </div>
            <div className="text-4xl font-bold tracking-tight">$12,450.00</div>
          </div>

          {/* App floating action cards */}
          <div className="px-6 -mt-8 relative z-10 flex gap-4 shrink-0 justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex-1 flex flex-col items-center gap-2 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                <ArrowDownUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">
                Add Money
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex-1 flex flex-col items-center gap-2 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">Send</span>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="flex-1 bg-slate-50 px-6 pt-6 pb-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-800">Recent Activity</span>
              <span className="text-xs font-semibold text-indigo-600">
                See All
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-auto hide-scrollbar pb-6">
              {/* Tx 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg border border-rose-200">
                    S
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">
                      Sarah Jenkins
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Sent • Today, 2:41 PM
                    </div>
                  </div>
                </div>
                <div className="font-bold text-slate-800">-$45.00</div>
              </div>
              {/* Tx 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200">
                    <ArrowDownUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">
                      Bank Deposit
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Added • Yest, 9:20 AM
                    </div>
                  </div>
                </div>
                <div className="font-bold text-emerald-600">+$500.00</div>
              </div>
              {/* Tx 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">
                      Mike Ross
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Received • Mon, 11:00 AM
                    </div>
                  </div>
                </div>
                <div className="font-bold text-emerald-600">+$120.00</div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Fake */}
          <div className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-4 pb-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 text-slate-400 flex items-center justify-center">
              <ArrowDownUp className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 text-slate-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Floating Notification */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute top-24 -right-12 bg-white p-3 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 z-30"
        >
          <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Transfer Successful
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Sent $45 to Sarah
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DemoMobile;

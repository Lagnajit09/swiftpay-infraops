import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import DemoMobile from "./DemoMobile";

const HeroSection = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-0 lg:pb-32 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 inset-x-0 h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-100/40 to-purple-100/40 blur-3xl opacity-50" />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-blue-100/40 to-emerald-50/40 blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Hero Left: Text Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0"
          >
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              The New Standard in P2P Payments
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight"
            >
              Send Money <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                At Lightning Speed.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium"
            >
              Join millions who trust SwiftPay for seamless transactions. Create
              wallets, manage deposits, and transfer funds to friends instantly
              with zero hidden fees.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/30 group"
              >
                Create Free Wallet
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition-all border border-slate-200 hover:border-slate-300 shadow-sm"
              >
                See How it Works
              </a>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-slate-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                No Hidden Fees
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Instant Setup
              </div>
            </motion.div>
          </motion.div>

          <DemoMobile />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

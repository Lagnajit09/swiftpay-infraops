import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Banner = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900 z-0"></div>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
        <Zap className="w-96 h-96 text-white" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          Ready to switch to a better way to pay?
        </h2>
        <p className="text-xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto">
          Join the millions of users who have already upgraded their financial
          life with SwiftPay. Registration takes less than 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/register"
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:-translate-y-1"
          >
            Open Your Wallet
          </Link>
          <Link
            to="/login"
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/20"
          >
            Log into Existing
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Banner;

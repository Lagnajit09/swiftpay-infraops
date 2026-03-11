import { Wallet, ArrowDownUp, Zap } from "lucide-react";

const Features = () => {
  return (
    <section
      id="features"
      className="py-24 bg-slate-50 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-indigo-600 font-bold tracking-wide uppercase text-sm mb-3">
            Core Features
          </h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Everything you need to manage your money.
          </h3>
          <p className="text-lg text-slate-600 font-medium">
            We've built a financial ecosystem that puts you in control. Whether
            you're paying a friend for dinner or managing your weekly budget,
            SwiftPay makes it effortless.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white">
              <Wallet className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">
              Digital Wallets
            </h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              Create a secure digital wallet in seconds. Store your funds safely
              and access them anytime, anywhere. Your money, always at your
              fingertips.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-emerald-600 group-hover:text-white">
              <ArrowDownUp className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">
              Add & Withdraw
            </h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              Link your bank account or card to seamlessly move money in and out
              of your SwiftPay wallet. We support major banks worldwide.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-blue-600 group-hover:text-white">
              <Zap className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">
              Instant P2P Transfers
            </h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              Split bills, pay rent, or send gifts. Transfer money to other
              SwiftPay users instantly using just their phone number or
              username.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

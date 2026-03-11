import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import Features from "../components/landing/Features";
import Banner from "../components/landing/Banner";
import Footer from "../components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />
      <HeroSection />

      {/* Stats Section - kept inline as it's a simple divider */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-slate-200 rounded-2xl">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 mb-1">
                10M+
              </span>
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Active Users
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 mb-1">
                0%
              </span>
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Hidden Fees
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 mb-1">
                99.9%
              </span>
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Uptime
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 mb-1">
                4.9/5
              </span>
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                App Store Rating
              </span>
            </div>
          </div>
        </div>
      </section>

      <Features />
      <Banner />
      <Footer />
    </div>
  );
};

export default Landing;

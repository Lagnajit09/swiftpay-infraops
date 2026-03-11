import { Zap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-50 pt-16 pb-8 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-800">
                Swift<span className="text-indigo-600">Pay</span>
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm mb-6">
              Making financial transactions simple, fast, and secure for
              everyone around the globe.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center text-slate-500">
                <div className="w-4 h-4 bg-current rounded-sm"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer flex items-center justify-center text-slate-500">
                <div className="w-4 h-4 bg-current rounded-full shrink-0"></div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Digital Wallets
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  P2P Transfers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  International
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-600 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 text-sm font-medium text-slate-500">
          <p>© {new Date().getFullYear()} SwiftPay Inc. All rights reserved.</p>
          <p className="mt-2 md:mt-0 flex items-center gap-1">
            Designed with <span className="text-rose-500">♥</span> for your
            finances.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

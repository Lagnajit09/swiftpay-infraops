import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-800">
              Swift<span className="text-indigo-600">Pay</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#security"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Security
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              How it Works
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md transition-all hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-7 w-7" />
              ) : (
                <Menu className="h-7 w-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-6 space-y-2 shadow-xl"
        >
          <a
            href="#features"
            className="block px-3 py-3 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            Features
          </a>
          <a
            href="#security"
            className="block px-3 py-3 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            Security
          </a>
          <Link
            to="/login"
            className="block px-3 py-3 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="block w-full text-center mt-4 bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md"
          >
            Get Started
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;

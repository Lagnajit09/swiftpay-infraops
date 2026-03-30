import { motion } from "framer-motion";
import { Mail, LogOut } from "lucide-react";

interface ProfileInfoCardProps {
  displayName: string;
  displayEmail: string;
  displayRole: string;
  onLogout: () => void;
  getInitials: (name: string) => string;
}

const ProfileInfoCard = ({
  displayName,
  displayEmail,
  displayRole,
  onLogout,
  getInitials,
}: ProfileInfoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900 rounded-4xl border border-slate-800 p-8 shadow-2xl text-center relative overflow-hidden"
    >
      {/* Decorative background accent */}
      <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-br from-indigo-600/40 to-indigo-900/10 opacity-50"></div>
      
      {/* Glow effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col items-center mt-6">
        <div className="h-24 w-24 rounded-full bg-white/10 p-1.5 shadow-lg mb-4 backdrop-blur-sm border border-white/20">
          <div className="h-full w-full rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold border border-indigo-400/50 shadow-inner">
            {getInitials(displayName)}
          </div>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">{displayName}</h2>
        <div className="flex items-center gap-2 mt-1.5 text-white/50">
          <Mail className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{displayEmail}</span>
        </div>

        <div className="mt-5 inline-flex items-center px-4 py-1 rounded-full bg-white/10 text-indigo-300 text-[10px] font-bold tracking-widest border border-white/10 uppercase backdrop-blur-sm">
          {displayRole}
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-white/5 flex justify-center">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-red-400 px-6 py-2.5 rounded-xl transition-all duration-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 group"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileInfoCard;

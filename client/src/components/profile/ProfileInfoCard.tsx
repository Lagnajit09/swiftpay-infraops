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
      className="bg-white rounded-4xl border border-slate-200/60 p-8 shadow-sm text-center relative overflow-hidden card-shadow"
    >
      <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-r from-indigo-500 to-indigo-600"></div>

      <div className="relative z-10 flex flex-col items-center mt-8">
        <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-lg mb-4">
          <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border border-indigo-200">
            {getInitials(displayName)}
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
        <div className="flex items-center gap-1 mt-1 text-slate-500">
          <Mail className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">{displayEmail}</span>
        </div>

        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide border border-indigo-100/50 uppercase">
          {displayRole}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileInfoCard;

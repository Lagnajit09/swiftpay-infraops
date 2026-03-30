import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export interface StatItem {
  name: string;
  value: string;
  change: string;
  changeType: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}

interface StatCardProps {
  stat: StatItem;
  index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-white rounded-4xl border border-slate-200/50 p-6 flex flex-col justify-between h-48 card-shadow transition-all duration-300 hover:border-indigo-100"
    >
      <div className="flex justify-between items-start">
        <div
          className={`p-3.5 ${stat.bgColor} ${stat.textColor} rounded-2xl shadow-sm border border-white/50`}
        >
          <stat.icon className="h-5 w-5" />
        </div>
        <div
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
            stat.changeType === "positive"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
              : stat.changeType === "negative"
                ? "bg-red-50 text-red-600 border-red-100/50"
                : "bg-slate-50 text-slate-600 border-slate-100/50"
          }`}
        >
          {stat.changeType === "positive" ? (
            <ArrowUpRight className="h-2.5 w-2.5" />
          ) : stat.changeType === "negative" ? (
            <ArrowDownRight className="h-2.5 w-2.5" />
          ) : (
            <Activity className="h-2.5 w-2.5" />
          )}
          {stat.change}
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          {stat.name}
        </p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">
          {stat.value}
        </h3>
      </div>
    </motion.div>
  );
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.name} stat={stat} index={index} />
      ))}
    </div>
  );
}

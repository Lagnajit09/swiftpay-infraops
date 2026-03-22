import React from "react";
import { Users, ArrowRight, ShieldCheck } from "lucide-react";

export const MOCK_CONTACTS = [
  { id: 1, name: "Alex Chen", walletId: "wlt_alex99", avatar: "A", color: "bg-blue-100 text-blue-600" },
  { id: 2, name: "Sarah Smith", walletId: "wlt_sarah22", avatar: "S", color: "bg-purple-100 text-purple-600" },
  { id: 3, name: "Mike Johnson", walletId: "wlt_mike55", avatar: "M", color: "bg-emerald-100 text-emerald-600" },
  { id: 4, name: "Emma Wilson", walletId: "wlt_emma77", avatar: "E", color: "bg-rose-100 text-rose-600" },
];

interface QuickSendListProps {
  onSelectContact: (walletId: string) => void;
}

const QuickSendList: React.FC<QuickSendListProps> = ({ onSelectContact }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Quick Send
        </h3>
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
      </div>

      <div className="space-y-3">
        {MOCK_CONTACTS.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelectContact(contact.walletId)}
            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
          >
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg ${contact.color}`}>
              {contact.avatar}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{contact.name}</p>
              <p className="text-xs font-medium text-slate-500 truncate font-mono">{contact.walletId}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
          <div className="mt-1">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">Protected Payments</h4>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Every P2P transfer is instantly verified on the ledger and secured by 256-bit encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSendList;

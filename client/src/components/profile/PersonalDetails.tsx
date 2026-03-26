import { motion } from "framer-motion";
import { User as UserIcon, Save, Edit2 } from "lucide-react";
import type { User } from "../../lib/api-client";

interface PersonalDetailsProps {
  user: User | null;
  isEditing: boolean;
  isLoading: boolean;
  formData: {
    name: string;
    number: string;
    address: string;
    country: string;
    state: string;
    dob: string;
  };
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFormChange: (data: any) => void;
  displayName: string;
  displayEmail: string;
  displayPhone: string;
  generateAccountId: (email?: string, id?: string | number) => string;
}

const PersonalDetails = ({
  user,
  isEditing,
  isLoading,
  formData,
  onEdit,
  onSave,
  onCancel,
  onFormChange,
  displayName,
  displayEmail,
  displayPhone,
  generateAccountId,
}: PersonalDetailsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-4xl border border-slate-200/60 overflow-hidden shadow-sm card-shadow flex flex-col"
    >
      <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Personal Details
            </h2>
            <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
              Your basic information
            </p>
          </div>
        </div>
        <button
          onClick={isEditing ? onSave : onEdit}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold hover:bg-indigo-100 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
        >
          {isLoading ? (
            "Saving..."
          ) : isEditing ? (
            <>
              <Save className="h-3.5 w-3.5" /> Save
            </>
          ) : (
            <>
              <Edit2 className="h-3.5 w-3.5" /> Edit Details
            </>
          )}
        </button>
      </div>

      <div className="p-7">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-sm font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.number}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-sm font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  onFormChange({ ...formData, dob: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  State / Region
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {formData.state.length}/20
                </span>
              </div>
              <input
                type="text"
                value={formData.state}
                maxLength={20}
                onChange={(e) =>
                  onFormChange({ ...formData, state: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  Country
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {formData.country.length}/20
                </span>
              </div>
              <input
                type="text"
                value={formData.country}
                maxLength={20}
                onChange={(e) =>
                  onFormChange({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  Address Details
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {formData.address.length}/100
                </span>
              </div>
              <textarea
                value={formData.address}
                maxLength={100}
                onChange={(e) =>
                  onFormChange({ ...formData, address: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-800 resize-none"
              ></textarea>
            </div>
            <div className="md:col-span-2 pt-6 mt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col items-start">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Account ID
                </p>
                <p className="text-xs font-semibold text-slate-800 font-mono break-all inline-flex bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  {generateAccountId(user?.email, user?.id)}
                </p>
              </div>
              {user?.createdAt && (
                <div className="flex flex-col md:items-end">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">
                    Joined On
                  </p>
                  <p className="text-sm font-bold text-slate-900 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100/30">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={onCancel}
                className="text-slate-500 text-sm font-bold hover:text-slate-700 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Full Name
              </p>
              <p className="text-base font-semibold text-slate-800">
                {displayName}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Email Address
              </p>
              <p className="text-base font-semibold text-slate-800">
                {displayEmail}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Phone Number
              </p>
              <p className="text-base font-semibold text-slate-800">
                {displayPhone}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Date of Birth
              </p>
              <p className="text-base font-semibold text-slate-800">
                {user?.dob && !isNaN(new Date(user.dob).getTime())
                  ? new Date(user.dob).toLocaleDateString()
                  : "Not added"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                State / Country
              </p>
              <p className="text-base font-semibold text-slate-800 wrap-break-word line-clamp-2">
                {[user?.address?.state, user?.address?.country]
                  .filter(Boolean)
                  .join(", ") || "Not added"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">
                Address Details
              </p>
              <p className="text-base font-semibold text-slate-800 wrap-break-word whitespace-pre-wrap">
                {user?.address?.address || "Not added"}
              </p>
            </div>
            <div className="md:col-span-2 pt-6 mt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col items-start">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Account ID
                </p>
                <p className="text-xs font-semibold text-slate-800 font-mono break-all inline-flex bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  {generateAccountId(user?.email, user?.id)}
                </p>
              </div>
              {user?.createdAt && (
                <div className="flex flex-col md:items-end">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">
                    Joined On
                  </p>
                  <p className="text-sm font-bold text-slate-900 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100/30">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PersonalDetails;

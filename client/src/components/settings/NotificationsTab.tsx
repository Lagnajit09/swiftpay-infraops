import React from "react";
import { Mail, Smartphone, Save } from "lucide-react";

interface NotificationsTabProps {
  emailNotif: boolean;
  setEmailNotif: (notif: boolean) => void;
  smsNotif: boolean;
  setSmsNotif: (notif: boolean) => void;
  isLoading: boolean;
  handleSaveNotifications: (e: React.MouseEvent) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  emailNotif,
  setEmailNotif,
  smsNotif,
  setSmsNotif,
  isLoading,
  handleSaveNotifications,
}) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Choose how you want to be notified by us.
        </p>
      </div>

      <div className="space-y-6">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 text-indigo-600 h-10 w-10 rounded-xl flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Email Notifications
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Receive transaction updates and alerts via email.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmailNotif(!emailNotif)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailNotif ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailNotif ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-slate-200 text-slate-600 h-10 w-10 rounded-xl flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                SMS Notifications
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Get instant text messages for important activity.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSmsNotif(!smsNotif)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              smsNotif ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                smsNotif ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSaveNotifications}
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface AccountTabProps {
  isLoading: boolean;
  handleDeactivate: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  isLoading,
  handleDeactivate,
  handleDelete,
}) => {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Account Management</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage your account status and data.
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="bg-amber-100 text-amber-600 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Deactivate Account
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5 max-w-md">
                Temporarily disable your account. You can reactivate it anytime
                by logging back in.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger>
              <button
                disabled={isLoading}
                className="whitespace-nowrap px-6 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm border border-amber-100 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                Deactivate
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will temporarily disable your account. You can reactivate
                  it anytime by logging back in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeactivate}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="p-6 rounded-3xl border border-red-100 bg-red-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="bg-red-100 text-red-600 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-900">
                Delete Account
              </h3>
              <p className="text-sm text-red-600/70 font-medium mt-0.5 max-w-md">
                Permanently remove your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger>
              <button
                disabled={isLoading}
                className="whitespace-nowrap px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete Permanently
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-red-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-900">
                  Permanently Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-red-600/80">
                  CRITICAL: This will permanently delete your account and all
                  data. This action is irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 border-none"
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

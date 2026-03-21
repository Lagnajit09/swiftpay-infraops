import { Wallet as WalletIcon, PlusCircle, RefreshCcw } from "lucide-react";

interface CreateWalletStateProps {
  loading: boolean;
  handleCreateWallet: () => void;
}

export function CreateWalletState({ loading, handleCreateWallet }: CreateWalletStateProps) {
  return (
    <div className="bg-linear-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-12 flex flex-col items-center justify-center min-h-[400px] text-center shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <WalletIcon className="w-12 h-12 text-indigo-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Create your first wallet
      </h2>
      <p className="text-slate-500 max-w-md mb-8">
        Get started by initializing your digital wallet. You can then add
        money, transfer to friends, and withdraw securely.
      </p>
      <button
        onClick={handleCreateWallet}
        disabled={loading}
        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 transform hover:-translate-y-0.5 cursor-pointer"
      >
        {loading ? (
          <RefreshCcw className="w-5 h-5 animate-spin" />
        ) : (
          <PlusCircle className="w-5 h-5" />
        )}
        <span>{loading ? "Creating..." : "Create Wallet"}</span>
      </button>
    </div>
  );
}

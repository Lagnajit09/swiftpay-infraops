import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import {
  walletApi,
  userApi,
  transactionApi,
  type WalletData,
} from "../lib/api-client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/auth/ToastProvider";
import { bankAccounts } from "../constants/account-data";
import Loader from "../components/Loader";

// Wallet Subcomponents
import { CreateWalletState } from "../components/wallet/CreateWalletState";
import { WalletBalance } from "../components/wallet/WalletBalance";
import { WalletActions } from "../components/wallet/WalletActions";
import { TransactionModal } from "../components/wallet/TransactionModal";

const Wallet = () => {
  const { user, checkAuth } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction Modal State
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<number>(
    bankAccounts[0]?.id || 1,
  );
  const [txLoading, setTxLoading] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await walletApi.getWallet();

      if (res.success && res.data) {
        setWallet(res.data);
      } else {
        setError(res.message || "Failed to load wallet data.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching the wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create the wallet via /api/wallet
      const walletRes = await walletApi.getWallet();
      if (!walletRes.success || !walletRes.data) {
        throw new Error(walletRes.message || "Failed to create wallet");
      }

      // 2. Link the created wallet to the user via /api/user/update-user
      const updateRes = await userApi.updateUser({
        walletID: walletRes.data.walletId,
      });
      if (!updateRes.success) {
        throw new Error(
          updateRes.message || "Failed to link wallet to your profile",
        );
      }

      // 3. Update Auth Context so user.walletID is refreshed in the UI
      await checkAuth();

      // 4. Update local component state to show wallet immediately
      setWallet(walletRes.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the wallet.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if user has already linked a wallet previously
  useEffect(() => {
    if (user?.walletID && !wallet) {
      fetchWallet();
    }
  }, [user?.walletID]);

  const handleTransaction = async (type: "add" | "withdraw") => {
    try {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toastError("Please enter a valid positive amount");
        return;
      }

      setTxLoading(true);
      const bank = bankAccounts.find((b) => b.id === selectedBankId);
      if (!bank) throw new Error("Invalid bank account selected");

      const payload = {
        walletId: wallet?.walletId,
        amount: Number(amount) * 100, // Convert to minor units (e.g., paise)
        description: `${type === "add" ? "Add to" : "Withdraw from"} wallet`,
        currency: "INR",
        accountDetails: {
          accountNumber: bank.accountNumber,
          ifsc: bank.ifscCode,
          bankName: bank.name.split(" ")[0],
        },
      };

      const idempotencyKey = crypto.randomUUID();

      const res =
        type === "add"
          ? await transactionApi.addMoney(payload, idempotencyKey)
          : await transactionApi.withdrawMoney(payload, idempotencyKey);

      if (res.success && res.data) {
        toastSuccess(res.message || "Transaction successful");
        // Update balance inline
        setWallet((prev) =>
          prev ? { ...prev, balance: res.data.balance } : null,
        );

        // Reset states
        setIsAddMoneyOpen(false);
        setIsWithdrawOpen(false);
        setAmount("");
      } else {
        toastError(res.message || "Transaction failed");
      }
    } catch (err: any) {
      toastError(err.message || "An error occurred during transaction");
    } finally {
      setTxLoading(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <Loader />
        <p className="text-slate-500 font-medium">Loading your wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Wallet
        </h1>
        <p className="text-slate-500 mt-2 text-base">
          Manage your digital funds, deposit money, and withdraw to your bank.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center space-x-3">
          <Activity className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!user?.walletID ? (
        <CreateWalletState
          loading={loading}
          handleCreateWallet={handleCreateWallet}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <WalletBalance wallet={wallet} />
          
          <WalletActions 
            setIsAddMoneyOpen={setIsAddMoneyOpen} 
            setIsWithdrawOpen={setIsWithdrawOpen} 
          />
        </div>
      )}

      <TransactionModal
        isAddMoneyOpen={isAddMoneyOpen}
        isWithdrawOpen={isWithdrawOpen}
        setIsAddMoneyOpen={setIsAddMoneyOpen}
        setIsWithdrawOpen={setIsWithdrawOpen}
        amount={amount}
        setAmount={setAmount}
        selectedBankId={selectedBankId}
        setSelectedBankId={setSelectedBankId}
        txLoading={txLoading}
        handleTransaction={handleTransaction}
      />
    </div>
  );
};

export default Wallet;

import { ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { bankAccounts } from "../../constants/account-data";

interface TransactionModalProps {
  isAddMoneyOpen: boolean;
  isWithdrawOpen: boolean;
  setIsAddMoneyOpen: (isOpen: boolean) => void;
  setIsWithdrawOpen: (isOpen: boolean) => void;
  amount: string;
  setAmount: (amt: string) => void;
  selectedBankId: number;
  setSelectedBankId: (id: number) => void;
  txLoading: boolean;
  handleTransaction: (type: "add" | "withdraw") => void;
}

export function TransactionModal({
  isAddMoneyOpen,
  isWithdrawOpen,
  setIsAddMoneyOpen,
  setIsWithdrawOpen,
  amount,
  setAmount,
  selectedBankId,
  setSelectedBankId,
  txLoading,
  handleTransaction,
}: TransactionModalProps) {
  return (
    <Dialog
      open={isAddMoneyOpen || isWithdrawOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsAddMoneyOpen(false);
          setIsWithdrawOpen(false);
          setAmount("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAddMoneyOpen ? "Add Money from Bank" : "Withdraw to Bank"}
          </DialogTitle>
          <DialogDescription>
            {isAddMoneyOpen
              ? "Select your bank account and enter the amount to load your wallet."
              : "Select your bank account and enter the amount to withdraw."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                ₹
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-base!"
              />
            </div>
          </div>

          {/* Bank Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Select Bank Account
            </label>
            <Select
              value={String(selectedBankId)}
              onValueChange={(val) => setSelectedBankId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((bank) => (
                  <SelectItem key={bank.id} value={String(bank.id)}>
                    {bank.name} - ••••{bank.accountNumber.slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Button */}
          <Button
            className="w-full text-white"
            disabled={txLoading}
            onClick={() =>
              handleTransaction(isAddMoneyOpen ? "add" : "withdraw")
            }
            variant={"default"}
          >
            {txLoading ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : isAddMoneyOpen ? (
              <ArrowDownToLine className="mr-2 h-4 w-4" />
            ) : (
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
            )}
            {txLoading
              ? "Processing..."
              : isAddMoneyOpen
                ? "Add Money"
                : "Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

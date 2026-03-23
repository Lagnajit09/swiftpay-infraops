import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: string;
  type: "CREDIT" | "DEBIT";
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  flow: "P2P" | "ONRAMP" | "OFFRAMP";
  createdAt: string;
  paymentMethod?: any;
}

interface Props {
  transactions: Transaction[];
  isLoading: boolean;
  onViewDetails: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  isLoading,
  onViewDetails,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">
          No transactions found
        </h3>
        <p className="text-sm text-slate-500">
          We couldn't find any transactions matching your criteria.
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "CREDIT") {
      return (
        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <ArrowDownLeft className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-6 py-4">Transaction Details</th>
              <th className="px-6 py-4">Type / Flow</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onViewDetails(txn)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(txn.type)}
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] md:max-w-[300px]">
                        {txn.flow === "P2P"
                          ? txn.type === "CREDIT"
                            ? "Received from User"
                            : "Sent to User"
                          : txn.flow === "ONRAMP"
                            ? "Deposit to Wallet"
                            : "Withdrawal to Bank"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(txn.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-700">{txn.flow}</span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {txn.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(txn.status)}`}
                  >
                    {getStatusIcon(txn.status)}
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <span
                    className={
                      txn.type === "CREDIT"
                        ? "text-emerald-600"
                        : "text-slate-900"
                    }
                  >
                    {txn.type === "CREDIT" ? "+" : "-"}₹
                    {(Number(txn.amount) / 100).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

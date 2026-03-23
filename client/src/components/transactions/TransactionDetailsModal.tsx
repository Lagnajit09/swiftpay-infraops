import { useEffect, useState } from "react";
import {
  X,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User,
} from "lucide-react";
import { transactionApi } from "../../lib/api-client";
import TransactionReceipt from "./TransactionReceipt";

interface Props {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({
  transactionId,
  isOpen,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      setLoading(true);
      setError(null);
      transactionApi
        .getTransactionById(transactionId)
        .then((res) => {
          if (res.success) {
            setDetails(res.data);
          } else {
            setError(res.message || "Failed to load transaction details");
          }
        })
        .catch((err) => {
          setError(err.message || "An error occurred");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, transactionId]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "text-emerald-600 bg-emerald-50";
      case "PENDING":
        return "text-amber-600 bg-amber-50";
      case "FAILED":
      case "CANCELLED":
        return "text-red-600 bg-red-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-slate-500" />;
    }
  };

  const handleDownloadReceipt = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      // Keep it true if user wants to see it, or we can hide it.
      // Easiest is to show it visually only during print via CSS
      setShowReceipt(false);
    }, 100);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold text-slate-900">
              Transaction Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500 text-sm">Loading details...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-slate-900 font-medium">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            ) : details ? (
              <div className="space-y-6">
                {/* Hero section */}
                <div className="text-center py-2">
                  <div
                    className={`inline-flex items-center justify-center p-3 rounded-full mb-4 ${getStatusColor(details.status)}`}
                  >
                    <StatusIcon status={details.status} />
                  </div>
                  <h4 className="text-3xl font-bold text-slate-900">
                    {details.type === "CREDIT" ? "+" : "-"}₹
                    {Number(details.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </h4>
                  <p className="text-slate-500 mt-1 uppercase text-xs font-semibold tracking-wider">
                    {details.status}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono text-slate-900 font-medium">
                      {details.id.split("-")[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Date & Time</span>
                    <span className="text-slate-900 font-medium">
                      {new Date(details.createdAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Type</span>
                    <span className="text-slate-900 font-medium">
                      {details.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Flow</span>
                    <span className="text-slate-900 font-medium">
                      {details.flow}
                    </span>
                  </div>

                  {details.paymentDetails && (
                    <>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">
                          Payment Reference
                        </span>
                        <span className="font-mono text-slate-900 font-medium text-xs">
                          {details.paymentReferenceId}
                        </span>
                      </div>
                    </>
                  )}

                  {details.ledgerEntry && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Ledger Reference</span>
                      <span className="font-mono text-slate-900 font-medium text-xs">
                        {details.ledgerReferenceId}
                      </span>
                    </div>
                  )}

                  {details.metadata?.description && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Description</span>
                      <span className="text-slate-900 font-medium">
                        {details.metadata.description}
                      </span>
                    </div>
                  )}

                  {details.status === "CANCELLED" &&
                    details.metadata?.cancellationReason && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-red-500">Cancellation Note</span>
                        <span className="text-red-700 font-medium">
                          {details.metadata.cancellationReason}
                        </span>
                      </div>
                    )}
                </div>

                {/* Additional info based on flow */}
                {details.flow === "ONRAMP" && (
                  <div className="flex items-start gap-3 p-4 bg-indigo-50 text-indigo-900 rounded-xl">
                    <Building2 className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Deposit from Bank Account</p>
                      <p className="text-indigo-700 mt-1 opacity-80">
                        Funds added to your swiftpay wallet via standard bank
                        transfer.
                      </p>
                    </div>
                  </div>
                )}

                {details.flow === "OFFRAMP" && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-900 rounded-xl">
                    <Building2 className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Withdrawal to Bank Account</p>
                      <p className="text-blue-700 mt-1 opacity-80">
                        Funds transferred from your wallet to your linked bank
                        account.
                      </p>
                    </div>
                  </div>
                )}

                {details.flow === "P2P" && details.relatedTransaction && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 text-purple-900 rounded-xl">
                    <User className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {details.type === "CREDIT"
                          ? "Received from another user"
                          : "Sent to another user"}
                      </p>
                      <p className="text-purple-700 mt-1 opacity-80 break-all">
                        Related Wallet:{" "}
                        <span className="font-mono text-xs">
                          {details.relatedTransaction.walletId}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {!loading && !error && details && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden container for printing */}
      {showReceipt && details && (
        <div className="print-only">
          <TransactionReceipt transaction={details} />
        </div>
      )}
    </>
  );
}

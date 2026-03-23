import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
} from "lucide-react";
import {
  transactionApi,
  type TransactionFilters as FilterType,
  type TransactionSummary,
} from "../lib/api-client";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import TransactionDetailsModal from "../components/transactions/TransactionDetailsModal";

export default function TransactionHistory() {
  const [filters, setFilters] = useState<FilterType>({ page: 1, limit: 10 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, sumRes] = await Promise.all([
        transactionApi.getTransactions(filters),
        transactionApi.getTransactionSummary({
          startDate: filters.startDate,
          endDate: filters.endDate,
          walletId: filters.walletId,
        }),
      ]);

      if (txRes.success) {
        setTransactions(txRes.data.transactions);
        setPagination({
          currentPage: txRes.data.pagination.currentPage,
          totalPages: txRes.data.pagination.totalPages,
          totalCount: txRes.data.pagination.totalCount,
        });
      }

      if (sumRes.success) {
        setSummary(sumRes.data.summary);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (newFilters: FilterType) => {
    setFilters({ ...newFilters, page: 1 }); // Reset page on filter change
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transaction History
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            View and manage your recent financial activity.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Transactions
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {summary.totalTransactions}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Credits
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                ₹
                {(Number(summary.credits.total) / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Debits</p>
              <h3 className="text-2xl font-bold text-slate-900">
                ₹
                {(Number(summary.debits.total) / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>
        </div>
      )}

      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <TransactionTable
        transactions={transactions}
        isLoading={loading}
        onViewDetails={(txn) => setSelectedTxnId(txn.id)}
      />

      {/* Pagination Container */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * (filters.limit || 10) + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * (filters.limit || 10),
                pagination.totalCount,
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalCount}</span>{" "}
            results
          </p>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 border-r border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <div className="px-4 py-2 flex items-center justify-center text-sm font-medium text-indigo-600 bg-indigo-50 min-w-[48px]">
              {pagination.currentPage}
            </div>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 border-l border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <TransactionDetailsModal
        transactionId={selectedTxnId || ""}
        isOpen={!!selectedTxnId}
        onClose={() => setSelectedTxnId(null)}
      />
    </div>
  );
}

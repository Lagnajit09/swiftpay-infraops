import { Filter, Calendar, X } from "lucide-react";
import type { TransactionFilters as FilterType } from "../../lib/api-client";

interface Props {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  onClearFilters: () => void;
}

export default function TransactionFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: Props) {
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const hasActiveFilters =
    filters.type ||
    filters.flow ||
    filters.status ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            name="type"
            value={filters.type || ""}
            onChange={handleChange}
            className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-slate-700"
          >
            <option value="">All Types</option>
            <option value="CREDIT">Credit / Received</option>
            <option value="DEBIT">Debit / Sent</option>
          </select>
        </div>

        <div className="relative">
          <select
            name="flow"
            value={filters.flow || ""}
            onChange={handleChange}
            className="px-4 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-slate-700"
          >
            <option value="">All Flows</option>
            <option value="P2P">Peer to Peer</option>
            <option value="ONRAMP">Deposit (On-Ramp)</option>
            <option value="OFFRAMP">Withdrawal (Off-Ramp)</option>
          </select>
        </div>

        <div className="relative">
          <select
            name="status"
            value={filters.status || ""}
            onChange={handleChange}
            className="px-4 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 items-center w-full md:w-auto">
        <div className="relative flex items-center">
          <div className="absolute left-3 pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="date"
            name="startDate"
            value={filters.startDate || ""}
            onChange={handleChange}
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
            title="Start Date"
          />
        </div>
        <span className="text-slate-400 text-sm">-</span>
        <div className="relative flex items-center">
          <input
            type="date"
            name="endDate"
            value={filters.endDate || ""}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
            title="End Date"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center ml-2"
            title="Clear Filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

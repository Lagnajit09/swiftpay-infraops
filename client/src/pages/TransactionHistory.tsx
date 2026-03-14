const TransactionHistory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
        <p className="text-slate-500 mt-1 text-sm">View your past transactions and financial activity.</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Transaction table goes here.</p>
      </div>
    </div>
  );
};

export default TransactionHistory;

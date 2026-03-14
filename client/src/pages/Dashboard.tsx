import { ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      name: "Available Balance",
      value: "$14,250.00",
      change: "+4.75%",
      changeType: "positive",
      icon: Wallet,
    },
    {
      name: "Total Spent",
      value: "$3,410.50",
      change: "-1.2%",
      changeType: "negative",
      icon: CreditCard,
    },
    {
      name: "Total Received",
      value: "$5,240.25",
      change: "+8.2%",
      changeType: "positive",
      icon: Activity,
    },
  ];

  const recentTransactions = [
    { id: 1, name: "Amazon Purchases", amount: "-$120.50", date: "Today, 10:24 AM", status: "Completed", type: "debit" },
    { id: 2, name: "Salary Deposit", amount: "+$4,500.00", date: "Yesterday, 09:00 AM", status: "Completed", type: "credit" },
    { id: 3, name: "Coffee Shop", amount: "-$4.50", date: "Yesterday, 08:15 AM", status: "Completed", type: "debit" },
    { id: 4, name: "Transfer to John", amount: "-$50.00", date: "Mar 11, 02:30 PM", status: "Pending", type: "debit" },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, John 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Here's a breakdown of your recent financial activity.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            Deposit
          </button>
          <button className="px-4 py-2 bg-indigo-600 border border-transparent text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
            Transfer Money
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <stat.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${
                  stat.changeType === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}
              >
                {stat.changeType === "positive" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.name}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{tx.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.amount}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                    tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions or secondary widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Transfer</h2>
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recipient</label>
              <input 
                type="text" 
                placeholder="Email or Phone number" 
                className="w-full rounded-xl border-slate-200 border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                <input 
                  type="text" 
                  placeholder="0.00" 
                  className="w-full rounded-xl border-slate-200 border pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="pt-2">
              <button className="w-full px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm">
                Send Money
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

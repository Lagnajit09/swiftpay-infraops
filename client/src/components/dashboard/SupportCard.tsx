export function SupportCard() {
  return (
    <div className="bg-white rounded-4xl p-7 border border-slate-200/50 shadow-sm relative overflow-hidden flex flex-col">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Need Assistance?
        </h2>
        <p className="text-slate-400 text-[10px] font-bold">
          24/7 Dedicated Support
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-3xl border border-slate-100 hover:border-indigo-100/50 transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              Live Chat
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <p className="text-sm font-bold text-slate-800">Instant Help</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Average wait time: 2 mins
          </p>
        </div>

        <div className="p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-3xl border border-slate-100 hover:border-emerald-100/50 transition-all cursor-pointer">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">
            Quick Email
          </span>
          <p className="text-sm font-bold text-slate-800">support@swiftpay.com</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Direct response to your inbox
          </p>
        </div>

        <div className="p-4 bg-slate-50 hover:bg-amber-50/50 rounded-3xl border border-slate-100 hover:border-amber-100/50 transition-all cursor-pointer">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 block">
            Documentation
          </span>
          <p className="text-sm font-bold text-slate-800">Help Center</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Find answers immediately
          </p>
        </div>
      </div>

      <button className="w-full py-4 mt-8 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]">
        Contact Support
      </button>
    </div>
  );
}

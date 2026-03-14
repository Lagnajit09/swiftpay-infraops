import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  History, 
  Settings, 
  User,
  LogOut,
  Bell
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'P2P Transfer', href: '/dashboard/transfer', icon: ArrowRightLeft },
  { name: 'Transactions', href: '/dashboard/transactions', icon: History },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white flex">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white fixed h-full z-10 transition-all duration-300">
        <div className="flex items-center justify-center h-16 border-b border-slate-200 px-6">
          <Link to="/dashboard" className="text-2xl font-black text-indigo-600 tracking-tight">
            SwiftPay
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-200">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors duration-200">
            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center md:hidden">
            <Link to="/dashboard" className="text-xl font-black text-indigo-600 tracking-tight">
              SwiftPay
            </Link>
          </div>
          
          <div className="flex items-center justify-end w-full gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors rounded-full hover:bg-slate-100">
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900 leading-none">John Doe</p>
                <p className="text-xs text-slate-500 mt-1">john@example.com</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

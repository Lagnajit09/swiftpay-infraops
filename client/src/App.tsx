import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import EmailConfirmation from "./pages/EmailConfirmation";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import P2PTransfer from "./pages/P2PTransfer";
import TransactionHistory from "./pages/TransactionHistory";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/verify-email" element={<EmailConfirmation />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="transfer" element={<P2PTransfer />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

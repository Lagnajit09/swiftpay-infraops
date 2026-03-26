import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { walletApi, userApi, type WalletData } from "../lib/api-client";
import { motion } from "framer-motion";
import { useToast } from "../components/auth/ToastProvider";

// Sub-components
import ProfileInfoCard from "../components/profile/ProfileInfoCard";
import SecurityStatus from "../components/profile/SecurityStatus";
import PersonalDetails from "../components/profile/PersonalDetails";
import WalletInfo from "../components/profile/WalletInfo";
import ConnectedAccounts from "../components/profile/ConnectedAccounts";

/**
 * Account ID Generation helper
 * Creates a deterministic obfuscated ID from email + actual DB ID
 */
const generateAccountId = (email?: string, id?: string | number) => {
  if (!email || id === undefined) return "N/A";
  let hash = 0;
  for (let i = email.length - 1; i >= 0; i--) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const hashStr = Math.abs(hash).toString(36).substring(0, 4).padEnd(4, "0");
  const prefix = email
    .split("@")[0]
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toLowerCase()
    .padEnd(4, "x");
  return `${prefix}${hashStr}${id}`;
};

const Profile = () => {
  const { user, logout, checkAuth } = useAuth();
  const { success, error: showError } = useToast();

  const [copied, setCopied] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    number: user?.number || "",
    address: user?.address?.address || "",
    country: user?.address?.country || "",
    state: user?.address?.state || "",
    dob:
      user?.dob && !isNaN(new Date(user.dob).getTime())
        ? new Date(user.dob).toISOString().split("T")[0]
        : "",
  });

  // Keep form data in sync with user context changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        number: user.number || "",
        address: user.address?.address || "",
        country: user.address?.country || "",
        state: user.address?.state || "",
        dob:
          user.dob && !isNaN(new Date(user.dob).getTime())
            ? new Date(user.dob).toISOString().split("T")[0]
            : "",
      });
    }
  }, [user]);

  // Fetch Wallet details
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (user?.walletID) {
          const res = await walletApi.getWallet();
          if (res.success) {
            setWallet(res.data);
          }
        }
      } catch (error) {
        console.error("Error fetching wallet details:", error);
      }
    };
    fetchWallet();
  }, [user]);

  /**
   * Submission handler for profile updates
   */
  const handleSaveDetails = async () => {
    setIsLoading(true);
    try {
      // Create payload (stripping restricted fields)
      const payload = { ...formData };
      delete (payload as any).name;
      delete (payload as any).number;

      // Only send non-empty fields or format correctly
      if (!payload.dob) delete (payload as any).dob;
      if (!payload.address) delete (payload as any).address;
      if (!payload.state) delete (payload as any).state;
      if (!payload.country) delete (payload as any).country;

      const res = await userApi.updateUser(payload);
      if (res.success) {
        // Silent re-fetch to update context without full page flash
        await checkAuth(true);
        setIsEditing(false);
        success("Profile updated successfully");
      }
    } catch (err: any) {
      console.error("Failed to update profile", err);
      showError(err.message || "Failed to update profile details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to context state
    setFormData({
      name: user?.name || "",
      number: user?.number || "",
      address: user?.address?.address || "",
      country: user?.address?.country || "",
      state: user?.address?.state || "",
      dob:
        user?.dob && !isNaN(new Date(user.dob).getTime())
          ? new Date(user.dob).toISOString().split("T")[0]
          : "",
    });
  };

  const handleCopyWalletId = () => {
    if (user?.walletID) {
      navigator.clipboard.writeText(user.walletID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Safe display values
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "No email provided";
  const displayPhone = user?.number || "Not added";
  const displayRole = user?.role || "Standard User";

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            My Profile
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Manage your personal information, security, and preferences.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <ProfileInfoCard
            displayName={displayName}
            displayEmail={displayEmail}
            displayRole={displayRole}
            onLogout={logout}
            getInitials={getInitials}
          />
          <SecurityStatus user={user} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <PersonalDetails
            user={user}
            isEditing={isEditing}
            isLoading={isLoading}
            formData={formData}
            onEdit={() => setIsEditing(true)}
            onSave={handleSaveDetails}
            onCancel={handleCancelEdit}
            onFormChange={setFormData}
            displayName={displayName}
            displayEmail={displayEmail}
            displayPhone={displayPhone}
            generateAccountId={generateAccountId}
          />

          <WalletInfo
            user={user}
            wallet={wallet}
            copied={copied}
            onCopyWalletId={handleCopyWalletId}
          />

          <ConnectedAccounts />
        </div>
      </div>
    </div>
  );
};

export default Profile;

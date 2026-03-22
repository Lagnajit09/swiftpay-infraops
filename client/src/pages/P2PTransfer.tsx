import React, { useState, useEffect } from "react";
import { ArrowRightLeft } from "lucide-react";
import { transactionApi } from "../lib/api-client";
import { useToast } from "../components/auth/ToastProvider";
import QuickSendList, { MOCK_CONTACTS } from "../components/p2p-transfer/QuickSendList";
import TransferForm from "../components/p2p-transfer/TransferForm";
import TransferSuccess from "../components/p2p-transfer/TransferSuccess";

const P2PTransfer = () => {
  const [recipientWalletId, setRecipientWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saveContact, setSaveContact] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Simulated search state
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<{name: string, isVerified: boolean} | null>(null);

  const { success, error } = useToast();

  // Simulate debounced wallet ID search API call
  useEffect(() => {
    if (!recipientWalletId.trim() || recipientWalletId.length < 5) {
      setResolvedUser(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
      // Mock logic: check if it's a known contact
      const contact = MOCK_CONTACTS.find(c => c.walletId === recipientWalletId);
      if (contact) {
        setResolvedUser({ name: contact.name, isVerified: true });
      } else {
        // Mock a found user for any ID > 8 chars, else null
        if (recipientWalletId.length >= 8) {
          setResolvedUser({ name: "Verified SwiftPay User", isVerified: true });
        } else {
          setResolvedUser(null);
        }
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [recipientWalletId]);

  const handleSelectContact = (walletId: string) => {
    setRecipientWalletId(walletId);
    // Auto-focus amount field if possible in a real app
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientWalletId.trim()) {
      error("Recipient Wallet ID is required");
      return;
    }
    
    const transferAmount = Number(amount);
    if (!transferAmount || transferAmount <= 0) {
      error("Please enter a valid amount greater than 0");
      return;
    }

    setIsLoading(true);
    // smallest currency unit (paise for INR)
    const amountInPaise = transferAmount * 100;
    const idempotencyKey = `p2p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await transactionApi.p2pTransfer(
        {
          recipientWalletId: recipientWalletId.trim(),
          amount: amountInPaise,
          description: description.trim(),
        },
        idempotencyKey
      );

      if (response.success) {
        setIsSuccess(true);
        success("Transfer successful!");
        
        // In a real app, API call to save contact would go here if saveContact === true
        if (saveContact) {
          success(`Saved ${recipientWalletId} to contacts!`);
        }

        // We do not clear state immediately so TransferSuccess has access to amount/recipientName,
        // we clear them in the handleReset
      }
    } catch (err: any) {
      // Handle the detailed validation errors if they exist
      const errorData = err.data?.error;
      if (errorData?.details) {
        try {
          const detailsArray = JSON.parse(errorData.details);
          if (detailsArray.length > 0) {
            error(detailsArray[0].message);
            return;
          }
        } catch (e) {
          // Fall back to main message
        }
      }
      error(err.message || "Transfer failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setRecipientWalletId("");
    setAmount("");
    setDescription("");
    setSaveContact(false);
    setResolvedUser(null);
  };

  if (isSuccess) {
    return (
      <TransferSuccess 
        amount={amount} 
        recipientName={resolvedUser?.name || "Recipient"} 
        onReset={handleReset} 
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          P2P Transfer
        </h1>
        <p className="text-slate-500 mt-2 text-base max-w-2xl leading-relaxed">
          Send money instantly to anyone using their SwiftPay Wallet ID. Zero fees, lightning fast settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <TransferForm 
            recipientWalletId={recipientWalletId}
            setRecipientWalletId={setRecipientWalletId}
            amount={amount}
            setAmount={setAmount}
            description={description}
            setDescription={setDescription}
            saveContact={saveContact}
            setSaveContact={setSaveContact}
            isSearching={isSearching}
            resolvedUser={resolvedUser}
            isLoading={isLoading}
            onSubmit={handleTransfer}
          />
        </div>

        {/* Right Column: Quick Send / Saved Contacts */}
        <div className="lg:col-span-1 space-y-6">
          <QuickSendList onSelectContact={handleSelectContact} />
        </div>
      </div>
    </div>
  );
};

export default P2PTransfer;

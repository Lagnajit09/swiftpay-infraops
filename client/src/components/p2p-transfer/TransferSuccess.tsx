import React from "react";
import { CheckCircle2, Download, Share2, ReceiptText } from "lucide-react";
import { useToast } from "../../components/auth/ToastProvider";

interface TransferSuccessProps {
  amount: string;
  recipientName: string;
  transactionId?: string;
  description?: string;
  onReset: () => void;
}

const TransferSuccess: React.FC<TransferSuccessProps> = ({ 
  amount, 
  recipientName, 
  transactionId = "TXN" + Date.now().toString().slice(-8),
  description,
  onReset 
}) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const formattedTime = date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const handleDownloadReceipt = () => {
    // Basic text-based receipt generator
    const receiptText = `
------------------------------------------
           SWIFTPAY RECEIPT               
------------------------------------------
Status: Success
Date: ${formattedDate}
Time: ${formattedTime}
Transaction ID: ${transactionId}
------------------------------------------
Amount: ₹${amount}
Recipient: ${recipientName}
Method: SwiftPay Wallet
${description ? `Note: ${description}` : ''}
------------------------------------------
Thank you for using SwiftPay!
------------------------------------------
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SwiftPay_Receipt_${transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toastSuccess("Receipt downloaded as text file!");
  };

  const handleShare = async () => {
    const shareData = {
      title: 'SwiftPay Transaction Receipt',
      text: `Paid ₹${amount} to ${recipientName}. Transaction ID: ${transactionId}`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.text);
        toastSuccess("Receipt details copied to clipboard!");
      }
    } catch (err) {
      toastError("Could not share receipt.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 animate-in zoom-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-white px-8 pt-10 pb-8 flex flex-col items-center justify-center border-b border-slate-100">
          <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-5 shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Transfer Successful!</h2>
          <p className="text-slate-500 text-center text-sm font-medium">
            Your money has been securely sent.
          </p>
        </div>

        {/* Receipt Details Card */}
        <div className="p-8 space-y-6 bg-slate-50/50">
          
          <div id="receipt-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden">
            {/* Stamp decoration */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] text-emerald-600 rotate-12">
              <ReceiptText className="w-32 h-32" />
            </div>

            <div className="flex flex-col items-center justify-center border-b border-dashed border-slate-200 pb-5">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Amount Sent</span>
              <span className="text-4xl font-black text-slate-900 tracking-tight">₹{amount}</span>
            </div>

            <div className="space-y-4 pt-2 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-500">Recipient</span>
                <span className="font-bold text-slate-900">{recipientName}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-500">Date & Time</span>
                <span className="font-bold text-slate-900">{formattedDate}, {formattedTime}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-900">{transactionId}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-500">Payment Method</span>
                <span className="font-bold text-slate-900">SwiftPay Wallet</span>
              </div>

              {description && (
                <div className="flex justify-between items-start text-sm pt-4 border-t border-slate-100 mt-2">
                  <span className="font-medium text-slate-500">Note</span>
                  <span className="font-medium text-slate-700 text-right max-w-[60%] italic">"{description}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2 print:hidden">
            <div className="flex sm:flex-row flex-col gap-3">
              <button 
                onClick={handleDownloadReceipt}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-slate-400" />
                Download Receipt
              </button>
              <button 
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4 text-indigo-500" />
                Share
              </button>
            </div>
            
            <button 
              onClick={onReset}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Make Another Transfer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransferSuccess;

interface Props {
  transaction: any;
}

export default function TransactionReceipt({ transaction }: Props) {
  if (!transaction) return null;

  return (
    <div className="receipt-container hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
            font-family: 'Inter', system-ui, sans-serif;
            color: #0f172a;
          }
          .print-only {
            display: block !important;
          }
        }
      `,
        }}
      />

      <div className="max-w-2xl mx-auto border border-gray-200 p-8 rounded-lg">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-600 mb-2">
            SwiftPay
          </h1>
          <p className="text-xl font-medium text-gray-900">
            Transaction Receipt
          </p>
        </div>

        {/* Amount & Status */}
        <div className="text-center mb-10">
          <p className="text-gray-500 mb-2 font-medium uppercase tracking-wider text-sm">
            {transaction.status}
          </p>
          <h2 className="text-5xl font-bold mb-2">
            ₹
            {Number(transaction.amount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </h2>
          <p className="text-gray-600">
            {new Date(transaction.createdAt).toLocaleString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>

        {/* Details List */}
        <div className="space-y-4 mb-10 text-lg">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono font-medium">{transaction.id}</span>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">Transaction Type</span>
            <span className="font-medium">
              {transaction.type} ({transaction.flow})
            </span>
          </div>

          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-500">Wallet ID</span>
            <span className="font-mono font-medium text-sm">
              {transaction.walletId}
            </span>
          </div>

          {transaction.paymentReferenceId && (
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Payment Reference</span>
              <span className="font-mono font-medium text-sm">
                {transaction.paymentReferenceId}
              </span>
            </div>
          )}

          {transaction.ledgerReferenceId && (
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Ledger Reference</span>
              <span className="font-mono font-medium text-sm">
                {transaction.ledgerReferenceId}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-1">
            Thank you for using SwiftPay!
          </p>
          <p className="text-gray-400 text-xs">
            This is a highly-secure computer-generated receipt.
          </p>
        </div>
      </div>
    </div>
  );
}

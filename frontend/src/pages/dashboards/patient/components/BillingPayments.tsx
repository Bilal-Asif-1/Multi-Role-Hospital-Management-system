import { Receipt, Download, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

interface BillingPaymentsProps {
  invoices: any[]
}

export default function BillingPayments({ invoices }: BillingPaymentsProps) {
  const handleDownload = (invoice: any) => {
    // Download receipt functionality
    // TODO: Implement download functionality
  }

  const pendingInvoices = invoices?.filter((inv: any) => inv.status === 'PENDING') || []
  const paidInvoices = invoices?.filter((inv: any) => inv.status === 'PAID') || []

  const totalPending = pendingInvoices.reduce((sum: number, inv: any) => 
    sum + Number(inv.total || 0), 0
  )
  const totalPaid = paidInvoices.reduce((sum: number, inv: any) => 
    sum + Number(inv.total || 0), 0
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Billing & Payments</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Pending Invoices</p>
              <p className="text-2xl font-bold text-black mt-1">{pendingInvoices.length}</p>
              <p className="text-sm font-bold text-black mt-1">${Number(totalPending).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Paid Invoices</p>
              <p className="text-2xl font-bold text-black mt-1">{paidInvoices.length}</p>
              <p className="text-sm font-bold text-black mt-1">${Number(totalPaid).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="bg-black rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 ml-4">
              <p className="text-sm font-bold text-black">Total Amount</p>
              <p className="text-2xl font-bold text-black mt-1">
                ${Number(totalPending + totalPaid).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invoices */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center">
          <XCircle className="h-5 w-5 mr-2 text-black" />
          Pending Invoices
        </h3>
        <div className="space-y-3">
          {pendingInvoices.length > 0 ? (
            pendingInvoices.map((inv: any) => (
              <div key={inv.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-black">Invoice #{inv.invoiceNumber}</p>
                    <p className="text-sm font-bold text-black">
                      Date: {format(new Date(inv.invoiceDate), 'MMM dd, yyyy')}
                    </p>
                    {inv.dueDate && (
                      <p className="text-sm font-bold text-black">
                        Due: {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                    <p className="text-lg font-bold text-black mt-2">
                      Total: ${Number(inv.total).toFixed(2)}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900">
                    Pay Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-black font-bold py-8">No pending invoices</p>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-black" />
          Payment History
        </h3>
        <div className="space-y-3">
          {paidInvoices.length > 0 ? (
            paidInvoices.map((inv: any) => (
              <div key={inv.id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-black">Invoice #{inv.invoiceNumber}</p>
                    <p className="text-sm font-bold text-black">
                      Paid: {inv.paidAt ? format(new Date(inv.paidAt), 'MMM dd, yyyy') : format(new Date(inv.invoiceDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-lg font-bold text-black mt-2">
                      Amount: ${Number(inv.total).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(inv)}
                    className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Receipt
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-black font-bold py-8">No payment history</p>
          )}
        </div>
      </div>
    </div>
  )
}


import { Loader2, ArrowLeft } from "lucide-react";
import InvoiceActionBar from "./InvoiceActionBar";

export default function InvoiceTemplate({
  loading = false,
  error = null,
  invoice = null,
  pdfLoading = false,
  onDownloadPDF,
  onPrint,
  onBack,
  children
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin text-slate-400 mx-auto mb-4" size={48} />
          <p className="text-slate-600 text-lg font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#003d7a] hover:bg-[#002a5c] text-white rounded-lg transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Invoice Data</h2>
          <p className="text-slate-600 mb-6">The invoice could not be found or loaded.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#003d7a] hover:bg-[#002a5c] text-white rounded-lg transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="max-w-[210mm] mx-auto">
        <InvoiceActionBar
          onBack={onBack}
          onDownloadPDF={onDownloadPDF}
          onPrint={onPrint}
          isDownloading={pdfLoading}
        />
        {children}
      </div>
    </div>
  );
}

// InvoiceTemplate.jsx

// import { Loader2, ArrowLeft, Download, Printer } from "lucide-react";

// export default function InvoiceTemplate({
//   loading = false,
//   error = null,
//   invoice = null,
//   onDownloadPDF,
//   onPrint,
//   onBack,
//   children
// }) {
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <Loader2 className="animate-spin text-slate-400" size={48} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="bg-white p-8 rounded-xl shadow-lg text-center">
//           <h2 className="text-xl font-bold mb-4">Error</h2>
//           <p className="mb-6">{error}</p>
//           <button
//             onClick={onBack}
//             className="px-6 py-3 bg-[#003d7a] text-white rounded-lg"
//           >
//             <ArrowLeft size={18} className="inline mr-2" />
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!invoice) return null;

//   return (
//     <div className="min-h-screen bg-gray-100 p-6 print:p-0 print:bg-white">
//       <div className="max-w-[210mm] mx-auto">

//         {/* ACTION BAR */}
//         <div className="flex justify-between items-center mb-6 no-print">
//           <button
//             onClick={onBack}
//             className="px-4 py-2 bg-gray-200 rounded-lg"
//           >
//             <ArrowLeft size={16} className="inline mr-2" />
//             Back
//           </button>

//           <div className="flex gap-3">
//             <button
//               onClick={onPrint}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg"
//             >
//               <Printer size={16} className="inline mr-2" />
//               Print
//             </button>

//             <button
//               onClick={onDownloadPDF}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg"
//             >
//               <Download size={16} className="inline mr-2" />
//               Download PDF
//             </button>
//           </div>
//         </div>

//         {children}
//       </div>
//     </div>
//   );
// }

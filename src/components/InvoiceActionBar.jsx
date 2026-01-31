// import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";

// export default function InvoiceActionBar({ 
//   onBack, 
//   onDownloadPDF, 
//   onPrint, 
//   isDownloading = false 
// }) {
//   return (
//     <div className="no-print flex justify-between items-center mb-6 px-4 sm:px-0">
//       <button
//         onClick={onBack}
//         className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-md font-medium"
//       >
//         <ArrowLeft size={18} />
//         <span>Back</span>
//       </button>

//       <div className="flex gap-3">
//         <button
//           onClick={onDownloadPDF}
//           disabled={isDownloading}
//           className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isDownloading ? (
//             <>
//               <Loader2 size={18} className="animate-spin" />
//               <span>Generating...</span>
//             </>
//           ) : (
//             <>
//               <Download size={18} />
//               <span>Download PDF</span>
//             </>
//           )}
//         </button>

//         <button
//           onClick={onPrint}
//           className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-lg transition-colors shadow-md font-medium"
//         >
//           <Printer size={18} />
//           <span>Print</span>
//         </button>
//       </div>
//     </div>
//   );
// }


import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";

export default function InvoiceActionBar({ 
  onBack, 
  onDownloadPDF, 
  onPrint, 
  isDownloading = false 
}) {
  return (
    <div className="no-print flex justify-between items-center mb-6 gap-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium shadow-sm"
      >
        <ArrowLeft size={18} />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="flex gap-2">
        <button
          onClick={onDownloadPDF}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          {isDownloading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="hidden sm:inline">Generating...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span className="hidden sm:inline">Download PDF</span>
            </>
          )}
        </button>
        
        <button
          onClick={onPrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border border-blue-700 text-blue-700 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Printer size={18} />
          <span className="hidden sm:inline">Print</span>
        </button>
      </div>
    </div>
  );
}
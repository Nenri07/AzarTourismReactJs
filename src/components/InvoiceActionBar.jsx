
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";

export default function InvoiceActionBar({ 
  onBack, 
  onDownloadPDF, 
  onPrint, 
  isDownloading = false 
}) {
  return (
    <div className="no-print flex justify-between items-center text-[14px] mb-6 gap-4">
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

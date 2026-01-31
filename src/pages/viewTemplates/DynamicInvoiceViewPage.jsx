// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Loader2, ArrowLeft } from "lucide-react";
// import toast from "react-hot-toast";
// import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
// import CVKInvoiceView from "./CVKInvoiceView";
// import TRYPInvoiceView from "./TRYPInvoiceView";
// import GrandArasInvoiceView from "./GrandarasInvoiceView";

// export default function DynamicInvoiceViewPage() {
//   const { invoiceId } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [invoice, setInvoice] = useState(null);
//   const [hotelType, setHotelType] = useState(null);

//   useEffect(() => {
//     if (invoiceId) {
//       loadInvoice();
//     } else {
//       setLoading(false);
//     }
//   }, [invoiceId]);

//   const loadInvoice = async () => {
//     setLoading(true);
//     try {
//       const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      
//       let invoiceData = response.data || response;
      
//       // ✅ FIX: Handle triple-nested structure
//       // response.data.data.data
//       if (invoiceData.data && typeof invoiceData.data === 'object') {
//         invoiceData = invoiceData.data;
        
//         // Check for another nested level
//         if (invoiceData.data && typeof invoiceData.data === 'object') {
//           invoiceData = invoiceData.data;
//         }
//       }

//       console.log("📦 Final processed invoice data:", invoiceData);
      
//       setInvoice(invoiceData);
      
//       // ✅ FIX: Get hotel name from the correct location
//       const hotelName = (invoiceData.hotel || "").toLowerCase();
//       console.log("🏨 Hotel name:", hotelName);
      
//       let detectedType = "GrandAras";
      
//       if (hotelName.includes("cvk") || hotelName.includes("bosphorus")) {
//         detectedType = "CVK";
//       } else if (hotelName.includes("tryp")) {
//         detectedType = "TRYP";
//       } else if(hotelName.includes(""))
      
//       console.log("🎯 Detected hotel type:", detectedType);
//       setHotelType(detectedType);
      
//     } catch (error) {
//       console.error("❌ Error loading invoice:", error);
//       toast.error("Failed to load invoice", { duration: 4000 });
//       setTimeout(() => navigate("/invoices"), 2000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
//         <div className="text-center">
//           <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
//           <p className="text-slate-600 text-lg">Loading invoice...</p>
//           <p className="text-slate-400 text-sm mt-2">ID: {invoiceId?.substring(0, 8)}...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!invoice) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
//         <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </div>
//           <h2 className="text-xl font-bold text-slate-800 mb-2">Invoice Not Found</h2>
//           <p className="text-slate-600 mb-6">The requested invoice could not be loaded.</p>
//           <button
//             onClick={() => navigate("/invoices")}
//             className="btn bg-[#003d7a] hover:bg-[#002a5c] text-white border-none gap-2"
//           >
//             <ArrowLeft size={16} />
//             Back to Invoices
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (hotelType === "CVK") {
//     return <CVKInvoiceView invoiceData={invoice} />;
//   } else if (hotelType === "TRYP") {
//     return <TRYPInvoiceView invoiceData={invoice} />;
//   } else if(hotelType=== "GrandAras"){
//     return<GrandArasInvoiceView invoiceData={invoice} />
//   }
//   else {
//     // return <CVKInvoiceView invoiceData={invoice} />;
//     return<GrandArasInvoiceView invoiceData={invoice} />
//   }
// }



import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import CVKInvoiceView from "./CVKInvoiceView";
import TRYPInvoiceView from "./TRYPInvoiceView";
import GrandArasInvoiceView from "./GrandarasInvoiceView";
import NovotelInvoiceView from "./NovoTelInvoiceView";

export default function DynamicInvoiceViewPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [hotelType, setHotelType] = useState(null);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    } else {
      setLoading(false);
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      
      let invoiceData = response.data || response;
      
      // ✅ FIX: Handle triple-nested structure
      if (invoiceData.data && typeof invoiceData.data === 'object') {
        invoiceData = invoiceData.data;
        
        // Check for another nested level
        if (invoiceData.data && typeof invoiceData.data === 'object') {
          invoiceData = invoiceData.data;
        }
      }

      console.log("📦 Final processed invoice data:", invoiceData);
      
      setInvoice(invoiceData);
      
      // ✅ FIX: Get hotel name from the correct location
      const hotelName = (invoiceData.hotel || "").toLowerCase();
      console.log("🏨 Hotel name:", hotelName);
      
      let detectedType = "GrandAras"; // Default fallback
      
      if (hotelName.includes("cvk") || hotelName.includes("bosphorus")) {
        detectedType = "CVK";
      } else if (hotelName.includes("tryp")) {
        detectedType = "TRYP";
      } else if (hotelName.includes("novotel")) {
        detectedType = "NovoTel";
      } else if (hotelName.includes("grand") || hotelName.includes("aras")) {
        detectedType = "GrandAras";
      }
      
      console.log("🎯 Detected hotel type:", detectedType);
      setHotelType(detectedType);
      
    } catch (error) {
      console.error("❌ Error loading invoice:", error);
      toast.error("Failed to load invoice", { duration: 4000 });
      setTimeout(() => navigate("/invoices"), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading invoice...</p>
          <p className="text-slate-400 text-sm mt-2">ID: {invoiceId?.substring(0, 8)}...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invoice Not Found</h2>
          <p className="text-slate-600 mb-6">The requested invoice could not be loaded.</p>
          <button
            onClick={() => navigate("/invoices")}
            className="btn bg-[#003d7a] hover:bg-[#002a5c] text-white border-none gap-2"
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate invoice view based on hotel type
  if (hotelType === "CVK") {
    return <CVKInvoiceView invoiceData={invoice} />;
  } else if (hotelType === "TRYP") {
    return <TRYPInvoiceView invoiceData={invoice} />;
  } else if (hotelType === "NovoTel") {
    return <NovotelInvoiceView invoiceData={invoice} />;
  } else if (hotelType === "GrandAras") {
    return <GrandArasInvoiceView invoiceData={invoice} />;
  } else {
    // Default fallback
    return <GrandArasInvoiceView invoiceData={invoice} />;
  }
}
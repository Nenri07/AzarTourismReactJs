import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

// APIs
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import cairoInvoiceApi from "../../Api/cairoInvoice.api"; 
import malaysiaInvoiceApi from "../../Api/malaysiaInvoice.api";

// Views
import CVKInvoiceView from "./CVKInvoiceView";
import TRYPInvoiceView from "./TRYPInvoiceView";
import GrandArasInvoiceView from "./GrandarasInvoiceView";
import StaybridgeInvoiceView from "./StaybridgeInvoiceView"; 
import InvoiceViewPage from "./InvoiceViewPage";
import RaddisonInvoiceView from "./RaddisonInvoiceView";
import IntercontinentalInvoiceView from "./intercontinentalInvoiceView";
import FairmontInvoiceView from "./FairmontInvoiceView";
import HolidayInvoiceView from "./HolidayInvoiceView";
import HiltonInvoiceView from "./HiltonInvoiceView";
import DusitThanniInvoiceView from "./DusitThanniInvoiceView"
import TulipAlexendriaView from "./TulipAlexendriaView";
import RaddisonBluInvoiceView from "./RaddisonBluInvoiceView";
import LansonPalaceInvoiceView from "./LansonPalaceInvoiceView";
import GrandHayattInvoiceView from "./GrandHayattInvoiceView";
import OasiaInvoiceView from "./OasiaInvoiceView";
import RitzCarltonInvoiceView from "./RitzCarltonInvoiceView";
import FourSeasonsInvoiceView from "./FourSeasonsInvoiceView";
import WaldorfAstoriaInvoiceView from "./WaldorfAstoriaInvoiceView";
import PullmanInvoiceView from "./PullmanInvoiceView";
import PerdanaInvoiceView from "./PerdanaInvoiceView";

export default function DynamicInvoiceViewPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [hotelType, setHotelType] = useState(null);

  // Check if we are on the Egypt route
  const isEgyptRoute = location.pathname.includes('egypt-invoice');
    const isMalaysiaRoute = location.pathname.includes('malaysia-invoice');


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
      let response;
      
      // ✅ SMART FETCH: Route to correct API based on URL
      if (isEgyptRoute) {
        console.log("Fetching from Cairo API...");
        response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      } else if (isMalaysiaRoute) {
        console.log("Fetching from Malaysia API...");
        response = await malaysiaInvoiceApi.getInvoiceById(invoiceId);
      } else {
        console.log("Fetching from Turkey API...");
        response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      }
      
      let invoiceData = response.data || response;
      
      // Handle triple-nested structure safely
      if (invoiceData.data && typeof invoiceData.data === 'object') {
        invoiceData = invoiceData.data;
        if (invoiceData.data && typeof invoiceData.data === 'object') {
          invoiceData = invoiceData.data;
        }
      }

      console.log("📦 Final processed invoice data:", invoiceData);
      setInvoice(invoiceData);
      
      // Get hotel name from the correct location
      const hotelName = (invoiceData.hotel || "").toLowerCase();
      console.log("🏨 Hotel name:", hotelName);
      
      let detectedType = "GrandAras"; // Default fallback
      
      if (hotelName.includes("cvk") || hotelName.includes("bosphorus")) {
        detectedType = "CVK";
      } else if (hotelName.includes("tryp")) {
        detectedType = "TRYP";
      } else if (hotelName.includes("novotel")) {
        detectedType = "Novotel";
      } else if (hotelName.includes("staybridge") ) {
        detectedType = "Staybridge"; // ✅ Detect Staybridge
      } else if (hotelName.includes(" radisson residences") || hotelName.includes(" radisson residence") || hotelName.includes(" radisson residance") || hotelName.includes(" radisson residencies")) {
        detectedType = "Raddison1";
      }
      else if (hotelName.includes("intercontinental")) {
        detectedType = "Intercontinental";
      }

      else if(hotelName.includes("hilton")){
        detectedType = "Hilton";
      }
      else if (hotelName.includes("grand aras") || hotelName.includes("aras")) {
        detectedType = "GrandAras";
      }
      else if (hotelName.includes("holiday")) {
        detectedType = "HolidayInn";
      }
      else if (hotelName.includes("fairmont") || hotelName.includes("fairmount")) {
        detectedType = "Fairmont";
      }
      else if (hotelName.includes("dusit") || hotelName.includes("dusit thani")) {
        detectedType = "DusitThanni";
      }
      else if (hotelName.includes("tolip") || hotelName.includes("alexendria")) {
        detectedType = "TulipAlexendria";
      }
      else if (hotelName.includes("radisson blu") || hotelName.includes("radissonblu")) {
        detectedType = "RaddisonBlu";
      }
      else if(hotelName.includes("lanson place") || hotelName.includes("lansonpalace")) {
        detectedType = "LansonPalace";
      }
      else if (hotelName.includes("hyatt") || hotelName.includes("grand hyatt") || hotelName.includes("grandhyatt")) {
        detectedType = "GrandHayatt";
      }
      else if (hotelName.includes("oasia")) {
        detectedType = "Oasia";
      }
      else if (hotelName.includes("ritz") || hotelName.includes("carlton")) {
        detectedType = "Ritz";
      }
      else if (hotelName.includes("four") && hotelName.includes("season")) {
        detectedType = "FourSeasons";
      }
      else if (hotelName.includes("waldorf") && hotelName.includes("astoria")) {
        detectedType = "WaldorfAstoria";
      }      
      else if (hotelName.includes("pullman")) {
        detectedType = "Pullman";
      }
      else if (hotelName.includes("perdana")) {
        detectedType = "Perdana";
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
          <Loader2 size={48} className="animate-spin text-azar-blue mx-auto mb-4" />
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
            className="btn bg-azar-blue hover:bg-azar-dark text-white border-none gap-2"
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
  } else if (hotelType === "Novotel") {
    return <InvoiceViewPage />;
  } else if (hotelType === "Staybridge") {
    return <StaybridgeInvoiceView invoiceData={invoice} />; 
  } else if (hotelType === "GrandAras") {
    return <GrandArasInvoiceView invoiceData={invoice} />;
  } else if(hotelType === "Raddison1") {
    return <RaddisonInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "Intercontinental") {
    return <IntercontinentalInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "HolidayInn") {
    return <HolidayInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "Fairmont") {
    return <FairmontInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "Hilton") {
    return <HiltonInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "DusitThanni") {
    return <DusitThanniInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "TulipAlexendria") {
    return <TulipAlexendriaView invoiceData={invoice} />;
  }
  else if(hotelType === "RaddisonBlu") {
    return <RaddisonBluInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "LansonPalace") {
    return <LansonPalaceInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "GrandHayatt") {
    return <GrandHayattInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "Oasia") {
    return <OasiaInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "Ritz") {
    return <RitzCarltonInvoiceView invoiceData={invoice} />;
  }else if(hotelType === "FourSeasons") {
    return <FourSeasonsInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "WaldorfAstoria") {
    return <WaldorfAstoriaInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "Pullman") {
    return <PullmanInvoiceView invoiceData={invoice} />;
  }
  else if(hotelType === "Perdana") {
    return <PerdanaInvoiceView invoiceData={invoice} />;
  }
  else {
    // Default fallback
    return <GrandArasInvoiceView invoiceData={invoice} />;
  }
}
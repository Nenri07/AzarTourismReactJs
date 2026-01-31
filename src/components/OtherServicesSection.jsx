import { Plus, Calendar } from "lucide-react";
import ServiceRow from "./ServiceRow";

const OtherServicesSection = ({
  services = [],
  onServiceChange,
  onAddService,
  onRemoveService,
  arrivalDate,
  departureDate,
}) => {
  const totalAmount = services.reduce((sum, service) => {
    return sum + (parseFloat(service.amount) || 0);
  }, 0);

  // Format date as DD/MM/YYYY
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base md:text-lg text-slate-800">
            Other Services Used
          </h3>
          {arrivalDate && departureDate && (
            <div className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
              <Calendar size={12} />
              <span>
                {formatDateDisplay(arrivalDate)} -{" "}
                {formatDateDisplay(departureDate)}
              </span>
            </div>
          )}
        </div>
        {services.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {services.length} service{services.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Date range info for mobile */}
      {arrivalDate && departureDate && (
        <div className="sm:hidden mb-4 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
          <div className="flex items-center gap-2">
            <Calendar size={12} />
            <span>Services must be dated between:</span>
          </div>
          <div className="font-medium text-center mt-1">
            {formatDateDisplay(arrivalDate)} -{" "}
            {formatDateDisplay(departureDate)}
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-500 text-sm">
            No additional services added yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Click "Add Service" to include extra charges
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-10 gap-3 px-2 text-xs font-medium text-slate-600">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2">Amount (TND)</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              onChange={onServiceChange}
              onRemove={onRemoveService}
              arrivalDate={arrivalDate}
              departureDate={departureDate}
            />
          ))}
        </div>
      )}

      {/* Total */}
      {totalAmount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-green-800 font-semibold">
              Total Additional Services:
            </span>
            <span className="text-green-800 font-bold text-lg">
              {totalAmount.toFixed(2)} TND
            </span>
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={onAddService}
        className="mt-4 flex items-center justify-center gap-2 bg-[#002a5c] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#001a3c] transition-colors w-full"
      >
        <Plus size={16} />
        Add Service
      </button>
    </div>
  );
};

export default OtherServicesSection;

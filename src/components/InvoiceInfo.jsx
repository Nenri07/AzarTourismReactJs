import { Calendar } from "lucide-react";
import { Input, DatePicker } from "./index.js";

const InvoiceInfoSection = ({ formData, handleInputChange, dateError }) => {
  const labelClass =
    "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        Invoice Information
      </h3>

      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-xs flex items-center gap-2">
            <span className="text-red-500">*</span> Fields marked with asterisk
            are required
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8 md:gap-y-5">
          <div className="form-control">
            <label className={labelClass}>
              Reference No <span className="text-red-500">*</span>
            </label>
            <Input
              name="referenceNo"
              placeholder="Enter Reference No"
              value={formData.referenceNo || ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              name="invoiceDate"
              value={formData.invoiceDate || ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Guest Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="guestName"
              placeholder="Enter Guest Name"
              value={formData.guestName || ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>Hotel</label>
            <Input
              name="hotel"
              value={formData.hotel || "Novotel Tunis Lac"}
              onChange={handleInputChange}
              placeholder="Enter Hotel Name"
              readOnly
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              VAT No <span className="text-red-500">*</span>
            </label>
            <Input
              name="vatNo"
              type="text"
              value={formData.vatNo || ""}
              onChange={handleInputChange}
              placeholder="Enter VAT Number"
              style={{ MozAppearance: "textfield" }}
              onWheel={(e) => e.target.blur()}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Room No <span className="text-red-500">*</span>
            </label>
            <Input
              name="roomNo"
              value={formData.roomNo || ""}
              onChange={handleInputChange}
              placeholder="Enter Room No"
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>Cashier ID <span className="text-red-500">*</span>
            </label>
            <Input
              name="cashierId"
              type="text"
              value={formData.cashierId || ""}
              onChange={handleInputChange}
              placeholder="Enter Cashier ID"
              style={{ MozAppearance: "textfield" }}
              onWheel={(e) => e.target.blur()}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Account Number <span className="text-red-500">*</span>
            </label>
            <Input
              name="accountNumber"
              type="text"
              value={formData.accountNumber || ""}
              onChange={handleInputChange}
              placeholder="Enter Account Number"
              style={{ MozAppearance: "textfield" }}
              onWheel={(e) => e.target.blur()}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="form-control">
              <label className={labelClass}>
                Adult <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="paxAdult"
                value={formData.paxAdult || ""}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="form-control">
              <label className={labelClass}>Child</label>
              <Input
                type="number"
                name="paxChild"
                value={formData.paxChild || ""}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Invoice No <span className="text-red-500">*</span>
            </label>
            <Input
              name="batchNo"
              type="text"
              value={formData.batchNo || ""}
              onChange={handleInputChange}
              placeholder="Enter Invoice Id"
              style={{ MozAppearance: "textfield" }}
              onWheel={(e) => e.target.blur()}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Arrival Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              name="arrivalDate"
              value={formData.arrivalDate || ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-control">
            <label className={labelClass}>
              Departure Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              name="departureDate"
              value={formData.departureDate || ""}
              onChange={handleInputChange}
              required
            />
            {dateError && (
              <p className="text-red-500 text-xs mt-1">{dateError}</p>
            )}
          </div>
        </div>

        {formData.nights > 0 && (
          <div className="mt-4 md:mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold text-xs md:text-sm flex items-center gap-2">
              <Calendar size={16} /> Total Nights: {formData.nights}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceInfoSection;

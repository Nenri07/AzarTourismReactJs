import { Input } from "./index.js";
import { FileText } from "lucide-react";

const StampTaxSection = ({ formData, handleInputChange }) => {
  const labelClass =
    "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        Stamp Tax
      </h3>
      <div className="flex gap-2">
        <div className="form-control max-w-md flex-1">
          <label className={labelClass}>Stamp Tax Amount (One Time)</label>
          <Input
            type="number"
            name="stampTaxAmount"
            value={formData.stampTaxAmount || ""}
            onChange={handleInputChange}
            placeholder="0"
            step="0.01"
          />
        </div>

        {parseFloat(formData.stampTaxTotal || 0) > 0 && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg max-w-md flex-1">
            <div className="flex justify-between items-center">
              <span className="text-purple-900 font-semibold">
                Total Stamp Tax:
              </span>
              <span className="text-purple-900 font-bold text-lg">
                {formData.stampTaxTotal}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StampTaxSection;

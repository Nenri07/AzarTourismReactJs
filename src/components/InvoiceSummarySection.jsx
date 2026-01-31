const InvoiceSummarySection = ({ formData, handleInputChange }) => {
  const labelClass =
    "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const selectClass =
    "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]";

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        Invoice Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className={labelClass}>
                Status <span className="text-red-500">*</span>
              </label>

              <select
                name="status"
                value={formData.status ?? ""}
                onChange={handleInputChange}
                className={selectClass}
                required
              >
                <option value="" disabled selected>
                  Select the status
                </option>

                <option value="ready">Ready</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className={labelClass}>Note</label>
            <textarea
              name="note"
              value={formData.note || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] min-h-[80px] bg-white resize-none"
              placeholder="Enter Note"
            ></textarea>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-lg space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Net Taxable</span>
            <span className="font-medium">
              {formData.netTaxable || "0.00"} TND
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">FDSCT 1%</span>
            <span className="font-medium">{formData.fdsct || "0.00"} TND</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">VAT 7%</span>
            <span className="font-medium">
              {formData.vat7Total || "0.00"} TND
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">City Tax Total</span>
            <span className="font-medium">
              {formData.cityTaxTotal || "0.00"} TND
            </span>
          </div>

          <div className="flex justify-between text-sm border-b border-slate-300 pb-3">
            <span className="text-slate-600">Stamp Tax</span>
            <span className="font-medium">
              {formData.stampTaxTotal || "0.00"} TND
            </span>
          </div>

          <div className="flex justify-between text-lg font-bold text-[#003d7a] pt-2">
            <span>Gross Total Amount : </span>
            <span> {formData.grossTotal || "0.00"} TND</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummarySection;

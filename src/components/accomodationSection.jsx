import { Input } from "./index.js";

const AccommodationSection = ({ formData, handleInputChange }) => {
  const labelClass =
    "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

  // Calculate total of all accommodation nights
  const calculateAccommodationTotal = () => {
    if (
      !formData.accommodationDetails ||
      formData.accommodationDetails.length === 0
    )
      return 0;
    return formData.accommodationDetails.reduce((total, detail) => {
      return total + (parseFloat(detail.rate) || 0);
    }, 0);
  };

  const accommodationTotal = calculateAccommodationTotal();

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        Accommodation Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Auto-calculated nights field */}
        <div className="form-control">
          <label className={labelClass}>Total Nights (Auto)</label>
          <div className="relative">
            <Input
              type="number"
              name="nights"
              value={formData.nights || "0"}
              readOnly
              className="bg-slate-100 border-slate-300 text-slate-700 font-medium pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">
              nights
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated from arrival/departure dates
          </p>
        </div>

        <div className="form-control">
          <label className={labelClass}>Exchange Rate</label>
          <Input
            type="number"
            name="exchangeRate"
            value={formData.exchangeRate || ""}
            onChange={handleInputChange}
            placeholder="0"
            step="0.001"
          />
        </div>

        <div className="form-control">
          <label className={labelClass}>Selling Rate</label>
          <Input
            type="number"
            name="sellingRate"
            value={formData.sellingRate || ""}
            onChange={handleInputChange}
            placeholder="0"
            step="0.01"
          />
        </div>

        <div className="form-control">
          <label className={labelClass}>New Room Rate (Calculated)</label>
          <div className="relative">
            <Input
              type="number"
              name="newRoomRate"
              value={formData.newRoomRate || ""}
              readOnly
              className="bg-slate-100 border-slate-300 text-slate-700 font-medium pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">
              TND
            </div>
          </div>
        </div>
      </div>

      {/* Accommodation Details Table */}
      {formData.accommodationDetails &&
        formData.accommodationDetails.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Per Night Breakdown
              </h4>
              <div className="text-xs text-slate-500">
                {formData.accommodationDetails.length} night
                {formData.accommodationDetails.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-600 border-r border-slate-200">
                      Day
                    </th>
                    <th className="text-left p-3 font-medium text-slate-600 border-r border-slate-200">
                      Date
                    </th>
                    <th className="text-left p-3 font-medium text-slate-600 border-r border-slate-200">
                      Description
                    </th>
                    <th className="text-right p-3 font-medium text-slate-600">
                      Rate (TND)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.accommodationDetails.map((detail, index) => (
                    <tr
                      key={index}
                      className={`border-t border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30`}
                    >
                      <td className="p-3 font-medium text-slate-700 border-r border-slate-100">
                        Day {detail.day}
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">
                        {detail.date}
                      </td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">
                        {detail.description}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {parseFloat(detail.rate || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr className="border-t-2 border-slate-300 bg-slate-100/50">
                    <td
                      colSpan="3"
                      className="p-3 text-right font-medium text-slate-700"
                    >
                      Total Accommodation:
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-[#003d7a] text-sm">
                        {accommodationTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TND
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formData.accommodationDetails.length} night
                        {formData.accommodationDetails.length !== 1 ? "s" : ""}{" "}
                        × avg rate
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">
                  Average Rate
                </p>
                <p className="text-lg font-bold text-blue-700">
                  {formData.accommodationDetails.length > 0
                    ? (
                        accommodationTotal /
                        formData.accommodationDetails.length
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}{" "}
                  TND
                </p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium">
                  Total Nights
                </p>
                <p className="text-lg font-bold text-green-700">
                  {formData.accommodationDetails.length} night
                  {formData.accommodationDetails.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AccommodationSection;

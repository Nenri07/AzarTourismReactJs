
import { Input } from "./index.js";
import { useState, useEffect } from "react";

const CityTaxSection = ({ formData, handleInputChange }) => {
  const labelClass =
    "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

  const cityTaxDetails = formData.cityTaxDetails || [];

  // Safe parsing with defaults
  const cityTaxRows = parseInt(formData.cityTaxRows) || 0;

  // 1. Calculate Total Persons (Adults + Children)
  const paxAdult = parseInt(formData.paxAdult) || 0;
  const paxChild = parseInt(formData.paxChild) || 0;
  // Default to 1 if sum is 0 to ensure the user sees a valid calculation example
  const persons = paxAdult + paxChild || 1;

  // State for per-person input (allows empty string)
  const [perPersonInput, setPerPersonInput] = useState("");
  
  // Initialize perPersonInput from cityTaxAmount when component mounts
  useEffect(() => {
    if (formData.cityTaxAmount) {
      const parsedAmount = parseFloat(formData.cityTaxAmount);
      if (!isNaN(parsedAmount) && persons > 0) {
        // Calculate per-person rate from stored total-per-day
        const perPersonRate = parsedAmount / persons;
        setPerPersonInput(perPersonRate.toString());
      }
    }
  }, []);

  // Calculate per-day total (persons × per-person rate)
  const perPersonRate = parseFloat(perPersonInput) || 0;
  const perDayTotal = perPersonRate * persons;
  
  // Total for all nights
  const cityTaxTotal = cityTaxRows > 0 ? perDayTotal * cityTaxRows : 0;

  // Handle input change - store per-day total in formData
  const handlePerPersonChange = (value) => {
    setPerPersonInput(value);
    
    const perPerson = parseFloat(value) || 0;
    const perDayTotalToStore = perPerson * persons;
    
    // Store the per-day total (persons × per-person rate) in formData.cityTaxAmount
    handleInputChange({
      target: {
        name: "cityTaxAmount",
        value: perDayTotalToStore > 0 ? perDayTotalToStore.toString() : "",
      },
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        City Tax
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Number of Nights */}
        <div className="form-control">
          <label className={labelClass}>Number of Nights</label>
          <div className="relative">
            <Input
              type="number"
              name="cityTaxRows"
              value={cityTaxRows}
              readOnly
              className="bg-slate-50 border-slate-300 text-slate-700 font-medium pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
              {cityTaxRows === 1 ? "night" : "nights"}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on stay duration</p>
        </div>

        {/* Total Persons (Read Only) */}
        <div className="form-control">
          <label className={labelClass}>Total Persons</label>
          <div className="relative">
            <Input
              type="number"
              value={persons}
              readOnly
              className="bg-slate-50 border-slate-300 text-slate-700 font-medium pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
              {persons === 1 ? "person" : "persons"}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {paxAdult} Adult{paxAdult !== 1 ? "s" : ""} + {paxChild} Child
            {paxChild !== 1 ? "ren" : ""}
          </p>
        </div>

        {/* Amount Per Person Per Night - USER ENTERS THIS */}
        <div className="form-control">
          <label className={labelClass}>Tax Per Person/Night</label>
          <div className="relative">
            <Input
              type="number"
              name="cityTaxPerPerson"
              value={perPersonInput}
              onChange={(e) => {
                const value = e.target.value;
                handlePerPersonChange(value);
              }}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
              TND
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rate per person per night
            {perPersonRate > 0 && perDayTotal > 0 && (
              <span className="ml-1 font-medium">
                (Per day total: {perDayTotal.toFixed(2)} TND)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* City Tax Details Table - Only show when we have valid data */}
      {cityTaxRows > 0 && perPersonRate > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Per Night City Tax Breakdown
            </h4>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {cityTaxRows} nights × {persons} persons
            </span>
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
                  <th className="text-center p-3 font-medium text-slate-600 border-r border-slate-200 w-24">
                    Persons
                  </th>
                  <th className="text-right p-3 font-medium text-slate-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {cityTaxDetails.slice(0, cityTaxRows).map((detail, index) => (
                  <tr
                    key={index}
                    className={`border-t border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30`}
                  >
                    <td className="p-3 font-medium text-slate-700 border-r border-slate-100">
                      Day {detail.day || index + 1}
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-100">
                      {detail.date || "-"}
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-100">
                      {detail.description || `City Tax - Night ${index + 1}`}
                    </td>
                    <td className="p-3 text-center text-slate-600 border-r border-slate-100">
                      {persons}
                    </td>
                    {/* Per day total (persons × per-person rate) */}
                    <td className="p-3 text-right font-medium text-slate-700">
                      {perDayTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                {cityTaxTotal > 0 && (
                  <tr className="border-t-2 border-slate-300 bg-slate-100/50">
                    <td
                      colSpan="4"
                      className="p-3 text-right font-medium text-slate-700"
                    >
                      Total City Tax:
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-[#003d7a] text-sm">
                        {cityTaxTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TND
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {persons} pax × {cityTaxRows} nights
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Box */}
      {cityTaxTotal > 0 && (
        <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                City Tax Summary
              </p>
              <p className="text-xs text-slate-500">
                {perPersonRate.toFixed(2)} TND × {persons} person{persons !== 1 ? "s" : ""} × {cityTaxRows} night{cityTaxRows !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#003d7a]">
                {cityTaxTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                TND
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityTaxSection;
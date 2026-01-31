"use client";

import { useState, useEffect } from "react";
import { useInvoiceCalculations } from "../hooks/useInvoiceCalculations";

import {
  InvoiceSummarySection,
  AccommodationSection,
} from "../components/index";
import invoiceApi from "../Api/invoice.api";

export function InvoiceForm({ invoiceId = null }) {
  const { formData, handleInputChange, dateError } = useInvoiceCalculations({
    hotel: "Novotel Tunis Lac",
    invoiceNumber: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load invoice data if editing
  useEffect(() => {
    if (invoiceId) {
      loadInvoice(invoiceId);
    }
  }, [invoiceId]);

  const loadInvoice = async (id) => {
    setIsLoading(true);
    try {
      const data = await invoiceApi.getInvoice(id);
      console.log("[v0] Loaded invoice:", data);
      // Map API response to form data
      // This would be implemented based on your API response structure
    } catch (err) {
      setError("Failed to load invoice: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const invoiceData = {
        hotel: formData.hotel,
        reference_no: formData.invoiceNumber,
        guest_name: formData.guestName,
        room_no: formData.roomNo,
        pax_adult: Number.parseInt(formData.paxAdult) || 0,
        pax_child: Number.parseInt(formData.paxChild) || 0,
        arrival_date: formData.arrivalDate,
        departure_date: formData.departureDate,
        nights: Number.parseInt(formData.nights) || 0,
        actual_rate: Number.parseFloat(formData.actualRate) || 0,
        exchange_rate: Number.parseFloat(formData.exchangeRate) || 1,
        selling_rate: Number.parseFloat(formData.sellingRate) || 0,
        new_room_rate: Number.parseFloat(formData.newRoomRate) || 0,
        city_tax_rows: Number.parseInt(formData.cityTaxRows) || 0,
        city_tax_amount: Number.parseFloat(formData.cityTaxAmount) || 6,
        stamp_tax_rows: Number.parseInt(formData.stampTaxRows) || 0,
        stamp_tax_amount: Number.parseFloat(formData.stampTaxAmount) || 1,
        status: formData.status,
      };

      console.log("[v0] Saving invoice data:", invoiceData);

      let response;
      if (invoiceId) {
        response = await InvoiceApi.updateInvoice(invoiceId, invoiceData);
      } else {
        response = await InvoiceApi.createInvoice(invoiceData);
      }

      console.log("[v0] API response:", response);
      setSuccess(
        invoiceId
          ? "Invoice updated successfully!"
          : "Invoice created successfully!",
      );
    } catch (err) {
      console.error("[v0] Error saving invoice:", err);
      setError("Error saving invoice: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Guest Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Guest Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) =>
                handleInputChange("invoiceNumber", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => handleInputChange("guestName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Number
            </label>
            <input
              type="text"
              value={formData.roomNo}
              onChange={(e) => handleInputChange("roomNo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hotel
            </label>
            <input
              type="text"
              value={formData.hotel}
              onChange={(e) => handleInputChange("hotel", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Stay Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arrival Date
            </label>
            <input
              type="date"
              value={formData.arrivalDate}
              onChange={(e) => handleInputChange("arrivalDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departure Date
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) =>
                handleInputChange("departureDate", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {dateError && (
              <p className="text-red-600 text-sm mt-1">{dateError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adults
            </label>
            <input
              type="number"
              value={formData.paxAdult}
              onChange={(e) => handleInputChange("paxAdult", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Accommodation Section */}
      <AccommodationSection
        formData={formData}
        handleInputChange={handleInputChange}
        nights={formData.nights}
      />

      {/* Taxes Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Taxes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City Tax Rows
            </label>
            <input
              type="number"
              value={formData.cityTaxRows}
              onChange={(e) => handleInputChange("cityTaxRows", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City Tax Amount Each
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cityTaxAmount}
              onChange={(e) =>
                handleInputChange("cityTaxAmount", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stamp Tax Rows
            </label>
            <input
              type="number"
              value={formData.stampTaxRows}
              onChange={(e) =>
                handleInputChange("stampTaxRows", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stamp Tax Amount Each
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.stampTaxAmount}
              onChange={(e) =>
                handleInputChange("stampTaxAmount", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice Summary */}
      <InvoiceSummarySection formData={formData} />

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {isSaving
            ? "Saving..."
            : invoiceId
              ? "Update Invoice"
              : "Create Invoice"}
        </button>
        <button
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

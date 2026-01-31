import { useEffect, useState } from "react";
import Decimal from "decimal.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

export const useInvoiceCalculations = (initialData = {}) => {
  const DECIMAL_PLACES = 3;

  const D = (v) => new Decimal(v || 0);
  const F = (d) => d.toDecimalPlaces(DECIMAL_PLACES).toFixed(DECIMAL_PLACES);

  const [formData, setFormData] = useState({
    referenceNo: "",
    invoiceDate: "",
    guestName: "",
    hotel: "Novotel Tunis Lac",
    vatNo: "",
    cashierId: "",
    accountNumber: "",
    roomNo: "",
    paxAdult: "",
    paxChild: "",
    arrivalDate: "",
    departureDate: "",
    nights: "0",
    exchangeRate: "",
    sellingRate: "",
    newRoomRate: "0",
    cityTaxRows: "0",
    cityTaxAmount: "",
    stampTaxAmount: "",
    stampTaxTotal: "0",
    cityTaxTotal: "0",
    netTaxable: "0",
    fdsct: "0",
    vat7Total: "0",
    grossTotal: "0",
    subTotal: "0",
    grandTotal: "0",
    status: "",
    batchNo: "",
    note: "",
    accommodationDetails: [],
    cityTaxDetails: [],
    otherServices: [],
    ...initialData,
  });

  const [dateError, setDateError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };




  // ================= Nights =================
  useEffect(() => {
    if (!formData.arrivalDate || !formData.departureDate) {
      setFormData((p) => ({ ...p, nights: "0" }));
      setDateError("");
      return;
    }

    const arrival = new Date(formData.arrivalDate);
    const departure = new Date(formData.departureDate);

    if (departure < arrival) {
      setDateError("Departure date cannot be before arrival date");
      setFormData((p) => ({ ...p, nights: "0" }));
      return;
    }

    const diff = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24)) || 0;

    setDateError("");
    setFormData((p) => ({ ...p, nights: diff.toString() }));
  }, [formData.arrivalDate, formData.departureDate]);

  // ================= New Room Rate =================
  useEffect(() => {
    const rate = D(formData.exchangeRate).mul(D(formData.sellingRate));
    setFormData((p) => ({ ...p, newRoomRate: F(rate) }));
  }, [formData.exchangeRate, formData.sellingRate]);

  // ================= City Tax Rows =================
  useEffect(() => {
    setFormData((p) => ({ ...p, cityTaxRows: p.nights }));
  }, [formData.nights]);

  // ================= City Tax Total =================
  useEffect(() => {
    const total = D(formData.cityTaxRows).mul(D(formData.cityTaxAmount));
    setFormData((p) => ({ ...p, cityTaxTotal: F(total) }));
  }, [formData.cityTaxRows, formData.cityTaxAmount]);

  // ================= Stamp Tax =================
  useEffect(() => {
    setFormData((p) => ({
      ...p,
      stampTaxTotal: F(D(formData.stampTaxAmount)),
    }));
  }, [formData.stampTaxAmount]);

  // ================= Accommodation Details =================
  useEffect(() => {
    if (!formData.arrivalDate) return;
    console.log("formdata tax",formData.cityTaxAmount);
    

    const nights = parseInt(formData.nights) || 0;
    const rate = D(formData.newRoomRate);

    const details = Array.from({ length: nights }, (_, i) => {
      const d = new Date(formData.arrivalDate);
      d.setDate(d.getDate() + i);

      return {
        day: i + 1,
        date: d.toISOString().split("T")[0],
        description: "Hébergement",
        rate: F(rate),
      };
    });

    setFormData((p) => ({ ...p, accommodationDetails: details }));
  }, [formData.nights, formData.newRoomRate, formData.arrivalDate]);

  // ================= City Tax Details =================
  useEffect(() => {
    if (!formData.arrivalDate) return;

    const nights = parseInt(formData.nights) || 0;
    const amount = D(formData.cityTaxAmount);

    const details = Array.from({ length: nights }, (_, i) => {
      const d = new Date(formData.arrivalDate);
      d.setDate(d.getDate() + i);

      return {
        day: i + 1,
        date: d.toISOString().split("T")[0],
        description: "Taxe de séjour",
        amount: F(amount),
      };
    });

    setFormData((p) => ({ ...p, cityTaxDetails: details }));
  }, [formData.nights, formData.cityTaxAmount, formData.arrivalDate]);

  // ================= FINAL SUMMARY (YOUR FORMULAS) =================
  useEffect(() => {
    const nights = D(formData.nights);
    const roomRate = D(formData.newRoomRate);

    const accommodationTotal = nights.mul(roomRate);

    const otherServicesTotal = (formData.otherServices || []).reduce(
      (sum, s) => sum.plus(D(s.amount)),
      D(0),
    );

    const totalFromForm = accommodationTotal.plus(otherServicesTotal);

    // Company formula
    const a = D(1).mul(1.01);
    const b = a.mul(1.07);
    const netTaxable = b.eq(0) ? D(0) : totalFromForm.div(b);

    const fdsct = netTaxable.mul(0.01);
    const vat7Total = netTaxable.plus(fdsct).mul(0.07);

    const grossTotal = netTaxable
      .plus(fdsct)
      .plus(vat7Total)
      .plus(D(formData.stampTaxTotal))
      .plus(D(formData.cityTaxTotal));

    setFormData((p) => ({
      ...p,
      netTaxable: F(netTaxable),
      fdsct: F(fdsct),
      vat7Total: F(vat7Total),
      subTotal: F(totalFromForm),
      grossTotal: F(grossTotal),
      grandTotal: F(grossTotal),
    }));
  }, [
    formData.nights,
    formData.newRoomRate,
    formData.cityTaxTotal,
    formData.stampTaxTotal,
    formData.otherServices,
  ]);

  return {
    formData,
    setFormData,
    handleInputChange,
    dateError,
  };
};

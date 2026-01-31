/**
 * jsPDF Generators for Turkey Invoices
 * Optimized for smaller file sizes
 */

import { jsPDF } from 'jspdf';

/**
 * Convert image URL to base64
 */
export const getBase64ImageFromUrl = async (imageUrl) => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Image load failed:', imageUrl, e);
    return null;
  }
};

/**
 * Compress image to JPEG for smaller size
 */
const compressImage = (base64Image) => {
  if (!base64Image) return null;
  return base64Image.replace(/^data:image\/png/, 'data:image/jpeg');
};

/**
 * Generate CVK Invoice PDF
 */
export const generateCVKPDF = async (invoice, logoUrl) => {
  try {
    const doc = new jsPDF({ 
      orientation: "portrait", 
      unit: "mm", 
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true
    });

    const logoImg = await getBase64ImageFromUrl(logoUrl);
    const optimizedLogo = compressImage(logoImg);

    const pageWidth = 210;
    const marginL = 15;
    const marginR = 15;
    let y = 15;

    // Logo
    if (optimizedLogo) {
      const logoW = 80;
      const logoH = 20;
      doc.addImage(optimizedLogo, "JPEG", marginL, y, logoW, logoH);
      y += logoH + 10;
    }

    // Company details
    doc.setFontSize(9);
    doc.text(invoice.companyName, marginL, y); y += 4;
    doc.text(invoice.companyAddress, marginL, y); y += 4;
    doc.text(invoice.companyCity, marginL, y); y += 8;

    // V.D. and Date
    doc.text(`V.D. : ${invoice.vd}`, marginL, y);
    doc.text(`Date/Tarih : ${invoice.invoiceDate}`, pageWidth - marginR - 40, y); y += 4;
    doc.text(`V.No : ${invoice.vno}`, marginL, y); y += 8;

    // Guest name
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.guestName, marginL, y);
    doc.setFont(undefined, 'normal');
    y += 8;

    // Guest grid
    doc.setFontSize(8);
    const gridY = y;
    doc.text(`Room/Oda : ${invoice.roomNo}`, marginL, gridY);
    doc.text(`Arrival/Giriş : ${invoice.arrivalDate}`, marginL + 40, gridY);
    doc.text(`Adult/Yetişkin : ${invoice.adults}`, marginL + 95, gridY);
    doc.text(`Passport No - TC No : ${invoice.passportNo}`, marginL + 120, gridY);
    
    y += 5;
    doc.text(`Folio No : ${invoice.folioNo}`, marginL, y);
    doc.text(`Departure/Çıkış : ${invoice.departureDate}`, marginL + 40, y);
    doc.text(`Child/Çocuk : ${invoice.children}`, marginL + 95, y);
    doc.text(`Crs No/Voucher No : ${invoice.crsNo}`, marginL + 120, y);
    
    y += 5;
    doc.text(`User/Kullanıcı : ${invoice.user}`, marginL, y);
    doc.text(`Csh No/Kasa No : ${invoice.cashNo}`, marginL + 40, y);
    doc.text(`Page/Sayfa : ${invoice.pageNo}`, pageWidth - marginR - 30, y);
    y += 8;

    // Table header
    doc.setFillColor(237, 237, 237);
    doc.rect(marginL, y, pageWidth - marginL - marginR, 7, "F");
    doc.setLineWidth(0.2);
    doc.line(marginL, y, pageWidth - marginR, y);
    doc.line(marginL, y + 7, pageWidth - marginR, y + 7);

    doc.setFontSize(9);
    doc.text("Açıklama/Description", marginL + 2, y + 5);
    doc.text("Date/Tarih", marginL + 100, y + 5);
    doc.text("Debit/Borç", pageWidth - marginR - 35, y + 5, { align: "right" });
    doc.text("Credit/Alacak", pageWidth - marginR - 2, y + 5, { align: "right" });
    y += 9;

    // Transactions
    doc.setFontSize(8);
    invoice.transactions.forEach((txn, idx) => {
      const desc = txn.foreignAmount ? 
        `${txn.description}     ${txn.foreignAmount}` : 
        txn.description;
      
      doc.text(desc, marginL + 2, y);
      doc.text(txn.date, marginL + 100, y);
      doc.text(txn.debit, pageWidth - marginR - 35, y, { align: "right" });
      doc.text(txn.credit, pageWidth - marginR - 2, y, { align: "right" });
      y += 4;
      
      // Add subtle line every 3 rows
      if ((idx + 1) % 3 === 0) {
        doc.setDrawColor(240, 240, 240);
        doc.line(marginL, y, pageWidth - marginR, y);
        y += 1;
      }
    });

    y += 5;

    // Footer section
    const footerY = y;
    
    // Left side - Tax table
    doc.setFillColor(237, 237, 237);
    doc.rect(marginL, footerY, 55, 6, "F");
    doc.setFontSize(7);
    doc.text("Tax Rate/KDV Oranı", marginL + 2, footerY + 3);
    doc.text("Tax Base/KDV Matrahı", marginL + 20, footerY + 3);
    doc.text("Tax Amount/KDV Tutarı", marginL + 40, footerY + 3);
    
    doc.setFontSize(8);
    doc.text(invoice.taxRate, marginL + 5, footerY + 8);
    doc.text(invoice.taxBase, marginL + 23, footerY + 8);
    doc.text(invoice.taxAmount, marginL + 43, footerY + 8);

    y = footerY + 15;
    doc.setFontSize(8);
    doc.text(`Room Check-in EUR Exch. Rate  ${invoice.exchangeRate}`, marginL, y); y += 4;
    doc.text(`Total in EUR: ${invoice.totalInEUR}`, marginL, y);

    // Right side - Totals
    const rightX = pageWidth / 2 + 20;
    let ry = footerY;
    
    doc.setFontSize(8);
    doc.text("Total Amount/Toplam Tutar", rightX, ry);
    doc.text(invoice.totalAmount, pageWidth - marginR, ry, { align: "right" }); ry += 4;
    
    doc.text("Taxable Amount/KDV Matrah", rightX, ry);
    doc.text(invoice.taxableAmount, pageWidth - marginR, ry, { align: "right" }); ry += 4;
    
    doc.text("Total VAT/Hesaplanan KDV", rightX, ry);
    doc.text(invoice.totalVAT, pageWidth - marginR, ry, { align: "right" }); ry += 4;
    
    doc.text("Total Acc Tax/Konaklama Vergisi", rightX, ry);
    doc.text(invoice.totalAccTax, pageWidth - marginR, ry, { align: "right" }); ry += 4;
    
    doc.setFont(undefined, 'bold');
    doc.text("Total Inc.Vat/KDV Dahil Tutar", rightX, ry);
    doc.text(invoice.totalIncVat, pageWidth - marginR, ry, { align: "right" }); ry += 8;
    doc.setFont(undefined, 'normal');
    
    doc.text("Payments/Ödemeler", rightX, ry); ry += 4;
    doc.text("Direct Billing/City Ledger", rightX, ry);
    doc.text(invoice.directBilling, pageWidth - marginR, ry, { align: "right" }); ry += 8;
    
    doc.setFont(undefined, 'bold');
    doc.text("Balance/Bakiye", rightX, ry);
    doc.text(invoice.balance, pageWidth - marginR, ry, { align: "right" });

    const filename = invoice.folioNo || invoice.crsNo || 'CVK-Invoice';
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (e) {
    console.error("CVK PDF generation error:", e);
    throw e;
  }
};

/**
 * Generate Grand Aras Invoice PDF
 */
export const generateGrandArasPDF = async (invoice, logoUrl) => {
  try {
    const doc = new jsPDF({ 
      orientation: "portrait", 
      unit: "mm", 
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true
    });

    const logoImg = await getBase64ImageFromUrl(logoUrl);
    const optimizedLogo = compressImage(logoImg);

    const pageWidth = 210;
    const marginL = 15;
    const marginR = 15;
    let y = 15;

    // Company info and logo
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.meta.company.name, marginL, y); y += 4;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(invoice.meta.company.subName, marginL, y); y += 4;
    doc.setFontSize(8);
    doc.text(invoice.meta.company.addressLine1, marginL, y); y += 3;
    doc.text(invoice.meta.company.addressLine2, marginL, y); y += 3;
    doc.text(invoice.meta.company.addressLine3, marginL, y);

    if (optimizedLogo) {
      const logoW = 35;
      const logoH = 20;
      doc.addImage(optimizedLogo, "JPEG", pageWidth - marginR - logoW, 15, logoW, logoH);
    }

    y = 45;

    // V.D. and Date
    doc.setFontSize(9);
    doc.text(`V.D. : ${invoice.meta.vatOffice}`, marginL, y);
    doc.text(`Date/Tarih : ${invoice.meta.date}`, pageWidth - marginR - 40, y); y += 4;
    doc.text(`V. NO : ${invoice.meta.vatNo}`, marginL, y); y += 8;

    // Guest name
    doc.setFontSize(10);
    doc.text(invoice.guest.name, marginL, y); y += 8;

    // Guest grid (similar to CVK)
    doc.setFontSize(8);
    doc.text(`Room/Oda : ${invoice.guest.room}`, marginL, y);
    doc.text(`Arrival/Giriş : ${invoice.guest.arrival}`, marginL + 35, y);
    doc.text(`Adult/Yetişkin : ${invoice.guest.adults}`, marginL + 85, y);
    doc.text(`Passport No - TC No : ${invoice.guest.passport}`, marginL + 115, y);
    y += 5;

    doc.text(`Folio No : ${invoice.meta.folio}`, marginL, y);
    doc.text(`Departure/Çıkış : ${invoice.guest.departure}`, marginL + 35, y);
    doc.text(`Child/Çocuk : ${invoice.guest.children}`, marginL + 85, y);
    doc.text(`Crs No/Voucher No :`, marginL + 115, y);
    doc.text(`User/Kullanıcı : ${invoice.guest.user}`, pageWidth - marginR - 30, y);
    y += 5;

    doc.text(`Csh No/Kasa No : ${invoice.guest.cashierNo}`, marginL + 85, y);
    doc.text(`Page/Sayfa : 1`, pageWidth - marginR - 25, y);
    y += 8;

    // Table (same structure as CVK)
    doc.setFillColor(240, 240, 240);
    doc.rect(marginL, y, pageWidth - marginL - marginR, 7, "F");
    doc.line(marginL, y, pageWidth - marginR, y);
    doc.line(marginL, y + 7, pageWidth - marginR, y + 7);

    doc.setFontSize(9);
    doc.text("Açıklama/Description", marginL + 2, y + 5);
    doc.text("Date/Tarih", marginL + 90, y + 5);
    doc.text("Debit/Borç", pageWidth - marginR - 35, y + 5, { align: "right" });
    doc.text("Credit/Alacak", pageWidth - marginR - 2, y + 5, { align: "right" });
    y += 9;

    // Transactions
    doc.setFontSize(8);
    invoice.transactions.forEach((txn) => {
      const desc = txn.rate ? 
        `${txn.description}     ${txn.rate}` : 
        txn.description;
      
      doc.text(desc, marginL + 2, y);
      doc.text(txn.date, marginL + 90, y);
      
      if (txn.debit) {
        doc.text(txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), 
                 pageWidth - marginR - 35, y, { align: "right" });
      }
      if (txn.credit) {
        doc.text(txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), 
                 pageWidth - marginR - 2, y, { align: "right" });
      }
      y += 4;
    });

    y += 5;

    // Footer (similar structure to CVK)
    const footerY = y;
    
    // Tax table
    doc.setFillColor(240, 240, 240);
    doc.rect(marginL, footerY, 55, 6, "F");
    doc.setFontSize(7);
    doc.text("Tax Rate/KDV Oranı", marginL + 2, footerY + 3);
    doc.text("Tax Base/KDV Matrahı", marginL + 20, footerY + 3);
    doc.text("Tax Amount/KDV Tutarı", marginL + 40, footerY + 3);
    
    doc.setFontSize(8);
    doc.text(invoice.totals.taxRate, marginL + 5, footerY + 8);
    doc.text(invoice.totals.taxBase.toLocaleString('en-US', {minimumFractionDigits: 2}), marginL + 23, footerY + 8);
    doc.text(invoice.totals.taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2}), marginL + 43, footerY + 8);

    y = footerY + 15;
    doc.text(`Room Check-in USD Exch. Rate  ${invoice.totals.exchangeRates.usd.toFixed(4)} TRY`, marginL, y); y += 4;
    doc.text(`Room Check-in EUR Exch. Rate  ${invoice.totals.exchangeRates.eur.toFixed(4)} TRY`, marginL, y); y += 4;
    doc.text(`Total in EUR :  ${invoice.totals.totalEuro.toFixed(2)} EUR`, marginL, y); y += 5;
    
    doc.setFontSize(7);
    doc.text(invoice.totals.textAmount, marginL, y);

    // Right side totals
    const rightX = pageWidth / 2 + 15;
    let ry = footerY;
    
    doc.setFontSize(8);
    const totals = [
      ["Total Amount/Toplam Tutar", invoice.totals.summary.totalAmount],
      ["Taxable Amount/KDV Matrahı", invoice.totals.summary.taxableAmount],
      ["Total VAT/Hesaplanan KDV", invoice.totals.summary.totalVat],
      ["Total Acc Tax/Konaklama Vergisi", invoice.totals.summary.accTax],
      ["Total Inc.Vat/KDV Dahil Tutar", invoice.totals.summary.totalIncVat]
    ];

    totals.forEach(([label, value]) => {
      doc.text(label, rightX, ry);
      doc.text(value.toLocaleString('en-US', {minimumFractionDigits: 2}), pageWidth - marginR, ry, { align: "right" });
      ry += 4;
    });

    ry += 4;
    doc.text("Payments/Ödemeler", rightX, ry); ry += 4;
    doc.text("Deposit Transfer at C/IN", rightX, ry);
    doc.text(invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2}), pageWidth - marginR, ry, { align: "right" });
    ry += 8;
    
    doc.setFont(undefined, 'bold');
    doc.text("Balance/Bakiye", rightX, ry);
    doc.text(invoice.totals.summary.balance.toFixed(2), pageWidth - marginR, ry, { align: "right" });

    const filename = invoice.meta.folio || 'GrandAras-Invoice';
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (e) {
    console.error("Grand Aras PDF generation error:", e);
    throw e;
  }
};

/**
 * Generate TRYP Invoice PDF
 */
export const generateTRYPPDF = async (invoice, logoUrl) => {
  // Very similar to Grand Aras, just with different company info
  return generateGrandArasPDF(invoice, logoUrl);
};

export default {
  generateCVKPDF,
  generateGrandArasPDF,
  generateTRYPPDF,
  getBase64ImageFromUrl
};
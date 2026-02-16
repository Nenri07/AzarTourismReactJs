
import html2pdf from 'html2pdf.js';

/**
 * Generate and download a PDF from HTML element
 * @param {string} elementId - The ID of the HTML element to convert
 * @param {string} filename - The desired PDF filename (without .pdf extension)
 * @param {object} options - Optional custom configuration
 * @returns {Promise<void>}
 */
export const generatePDF = async (elementId, filename = 'invoice', options = {}) => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Default optimized settings for smaller file size
    const defaultOptions = {
      margin: [10, 10, 10, 10], // [top, left, bottom, right] in mm
      filename: `${filename}.pdf`,
      image: { 
        type: 'jpeg', // JPEG instead of PNG for smaller size
        quality: 0.85 // Slightly reduced quality for smaller size
      },
      html2canvas: { 
        scale: 2, // Lower scale = smaller file (2 is a good balance)
        useCORS: true,
        letterRendering: true,
        logging: false,
        imageTimeout: 0,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true // Enable PDF compression
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'] 
      }
    };

    // Merge custom options with defaults
    const finalOptions = {
      ...defaultOptions,
      ...options,
      html2canvas: {
        ...defaultOptions.html2canvas,
        ...(options.html2canvas || {})
      },
      jsPDF: {
        ...defaultOptions.jsPDF,
        ...(options.jsPDF || {})
      }
    };

    // Generate and download PDF
    await html2pdf()
      .set(finalOptions)
      .from(element)
      .save();

    return true;
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw error;
  }
};

/**
 * Generate and download PDF with invoice-specific optimizations
 * @param {string} elementId - The ID of the invoice container
 * @param {string} referenceNo - Invoice reference number (used for filename and PDF title)
 * @returns {Promise<void>}
 */
export const generateInvoicePDF = async (elementId, referenceNo) => {
  return generatePDF(elementId, referenceNo, {
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
      // Set PDF metadata including title
      putOnlyUsedFonts: true,
      floatPrecision: 16
    }
  });
};

/**
 * Alternative: Generate PDF with even smaller file size (lower quality)
 * Use this for large invoices or when file size is critical
 */
export const generateCompactInvoicePDF = async (elementId, referenceNo) => {
  return generatePDF(elementId, referenceNo, {
    image: { 
      type: 'jpeg',
      quality: 0.75 // Lower quality for smaller size
    },
    html2canvas: { 
      scale: 1.5, // Lower scale for smaller file
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
      putOnlyUsedFonts: true
    }
  });
};

/**
 * Get PDF blob instead of downloading (useful for preview or upload)
 */
export const generatePDFBlob = async (elementId, filename = 'invoice') => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    const options = {
      margin: [10, 10, 10, 10],
      filename: `${filename}.pdf`,
      image: { 
        type: 'jpeg',
        quality: 0.85
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      }
    };

    const pdf = await html2pdf()
      .set(options)
      .from(element)
      .outputPdf('blob');

    return pdf;
  } catch (error) {
    console.error('❌ PDF Blob Generation Error:', error);
    throw error;
  }
};


export default {
  generatePDF,
  generateInvoicePDF,
  generateCompactInvoicePDF,
  generatePDFBlob
};
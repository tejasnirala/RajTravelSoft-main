// utils/GeneratePDF.js (ES6 version - Updated: Removed subtype; Treat 'car-rental' as direct type)
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

// Utility function to load image as promise (same)
const loadImage = (src) => {
  return new Promise((resolve) => {
    if (!src || !src.startsWith("data:image")) {
      resolve(null)
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Travel Quotation PDF Generator (same, with conditional notes/terms)
export const generateTravelQuotationPDF = async (quotationData) => {
  const doc = new jsPDF()

  if (typeof autoTable !== 'function') {
    console.error('jsPDF-AutoTable is not properly loaded.')
    alert('PDF generation failed.')
    return
  }

  try {
    // Header (same)
    doc.setFillColor(0, 123, 255)
    doc.rect(0, 0, 210, 40, "F")

    const img = await loadImage(quotationData.logoUrl)
    if (img) {
      const aspectRatio = img.width / img.height
      const displayHeight = 20
      const displayWidth = displayHeight * aspectRatio
      doc.addImage(quotationData.logoUrl, "PNG", 15, 10, displayWidth, displayHeight)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text("TRAVEL QUOTATION", 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.text(`Quote #: ${quotationData.quotationNumber}`, 105, 30, { align: "center" })

    // Agency and Client Info (same)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text("FROM:", 15, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`${quotationData.company.name}`, 15, 55)
    const companyAddressFull = `${quotationData.company.address}, ${quotationData.company.district || ''}, ${quotationData.company.state || ''}`.trim();
    doc.text(companyAddressFull || 'N/A', 15, 60)
    doc.text(`Phone: ${quotationData.company.phone}`, 15, 65)
    doc.text(`Email: ${quotationData.company.email}`, 15, 70)

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("FOR:", 140, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${quotationData.client.name}`, 140, 55);

    const clientAddressFull = `${quotationData.client.address || ''} ${quotationData.client.district || ''} ${quotationData.client.state || ''}`.trim();
    const wrappedAddress = doc.splitTextToSize(clientAddressFull || 'N/A', 60);
    doc.text(wrappedAddress, 140, 60);

    let currentY = 60 + wrappedAddress.length * 5;

    doc.text(`Phone: ${quotationData.client.phone}`, 140, currentY + 5);
    doc.text(`Email: ${quotationData.client.email}`, 140, currentY + 10);

    doc.setFont("helvetica", "bold");
    doc.text(`Quote Date: ${format(quotationData.date, "dd/MM/yyyy")}`, 15, 85);
    doc.text(`Valid Until: ${format(quotationData.validUntil, "dd/MM/yyyy")}`, 110, 85);

    // Items Table (same)
    autoTable(doc, {
      startY: 95,
      head: [["Tour Code", "Itinerary Name", "Travel Date", "Description", "Pax", "Total Amount", "Amount"]],
      body: quotationData.items.map((item) => [
        item.tourCode || "N/A",
        item.itineraryName || "",
        item.travelDate ? format(new Date(item.travelDate), "dd/MM/yyyy") : "",
        item.description,
        item.quantity,
        `Rs:${item.unitPrice.toFixed(2)}`,
        `Rs:${item.unitPrice.toFixed(2)}`,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellWidth: 'auto',
        overflow: 'linebreak',
      },
      columnStyles: {
        3: { cellWidth: 'wrap' },
      },
    })

    // Summary (same)
    const finalY = doc.lastAutoTable.finalY + 10
    const isRajasthan = quotationData.client.state == 'Rajasthan'

    doc.setFontSize(10);
    doc.text("Quote Summary", 140, finalY);
    doc.line(140, finalY + 1, 195, finalY + 1);

    doc.text(`Subtotal:`, 140, finalY + 10);
    doc.text(`Rs:${quotationData.subtotal.toFixed(2)}`, 190, finalY + 10, { align: "right" });

    let taxY = finalY + 15;

    if (!isRajasthan) {
      doc.text(`GST (${quotationData.taxRate}%)`, 140, taxY);
      doc.text(`Rs:${quotationData.taxAmount.toFixed(2)}`, 190, taxY, { align: "right" });
      taxY += 10;
    } else {
      doc.text(`CGST (${(quotationData.taxRate / 2).toFixed(1)}%)`, 140, taxY);
      doc.text(`Rs:${(quotationData.taxAmount / 2).toFixed(2)}`, 190, taxY, { align: "right" });
      taxY += 5;
      doc.text(`SGST (${(quotationData.taxRate / 2).toFixed(1)}%)`, 140, taxY);
      doc.text(`Rs:${(quotationData.taxAmount / 2).toFixed(2)}`, 190, taxY, { align: "right" });
      taxY += 10;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Total Quote:`, 140, taxY);
    doc.text(`Rs:${quotationData.total.toFixed(2)}`, 190, taxY, { align: "right" });

    // Conditional Notes
    let notesY = taxY + 15
    if (quotationData.notes) {
      doc.setFont("helvetica", "bold")
      doc.text("Itinerary Notes:", 15, notesY)
      doc.setFont("helvetica", "normal")
      const wrappedNotes = doc.splitTextToSize(quotationData.notes, 180);
      doc.text(wrappedNotes, 15, notesY + 5);
      notesY += (wrappedNotes.length * 5) + 5;
    }

    // Conditional Terms
    if (quotationData.terms) {
      doc.setFont("helvetica", "bold")
      doc.text("Booking Terms & Conditions:", 15, notesY)
      doc.setFont("helvetica", "normal")
      const wrappedTerms = doc.splitTextToSize(quotationData.terms, 180);
      doc.text(wrappedTerms, 15, notesY + 5);
    }

    // Footer (same)
    doc.setFontSize(8)
    doc.text("Happy Travels! This is a quotation only, not a bill or receipt.", 105, 280, { align: "center" })

    doc.save(`travel_quotation_${quotationData.quotationNumber}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('PDF generation failed.')
  }
}

// Travel Sales Invoice PDF Generator (same, with conditional)
export const generateTravelSalesInvoicePDF = async (invoiceData) => {
  const doc = new jsPDF()

  if (typeof autoTable !== 'function') {
    console.error('jsPDF-AutoTable is not properly loaded.')
    alert('PDF generation failed.')
    return
  }

  try {
    // Header (same)
    doc.setFillColor(41, 128, 185)
    doc.rect(0, 0, 210, 40, "F")

    const img = await loadImage(invoiceData.logoUrl)
    if (img) {
      const aspectRatio = img.width / img.height
      const displayHeight = 20
      const displayWidth = displayHeight * aspectRatio
      doc.addImage(invoiceData.logoUrl, "PNG", 15, 10, displayWidth, displayHeight)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text("TRAVEL SALES INVOICE", 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 105, 30, { align: "center" })

    // Agency and Client Info (same)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text("FROM:", 15, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`${invoiceData.company.name}`, 15, 55)
    const companyAddressFull = `${invoiceData.company.address}, ${invoiceData.company.district || ''}, ${invoiceData.company.state || ''}`.trim();
    doc.text(companyAddressFull || 'N/A', 15, 60)
    doc.text(`Phone: ${invoiceData.company.phone}`, 15, 65)
    doc.text(`Email: ${invoiceData.company.email}`, 15, 70)
    doc.text(`GSTIN: ${invoiceData.company.gstin || "N/A"}`, 15, 75)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("BILL TO:", 140, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`${invoiceData.client.name}`, 140, 55)
    const clientAddressFull = `${invoiceData.client.address}, ${invoiceData.client.district || ''}, ${invoiceData.client.state || ''}`.trim();
    doc.text(clientAddressFull || 'N/A', 140, 60)
    doc.text(`Phone: ${invoiceData.client.phone}`, 140, 65)
    doc.text(`Email: ${invoiceData.client.email}`, 140, 70)
    doc.text(`GSTIN: ${invoiceData.client.gstin || "N/A"}`, 140, 75)

    // Invoice Details (same)
    doc.setFont("helvetica", "bold")
    doc.text(`Date: ${format(invoiceData.date, "dd/MM/yyyy")}`, 15, 90)
    doc.text(`Due Date: ${format(invoiceData.dueDate, "dd/MM/yyyy")}`, 140, 90)

    // Items Table (same)
    autoTable(doc, {
      startY: 100,
      head: [["Tour Code", "Itinerary Name", "Travel Date", "Description", "Pax", "Total Amount", "Amount"]],
      body: invoiceData.items.map((item) => [
        item.tourCode || "N/A",
        item.itineraryName || "",
        item.travelDate ? format(new Date(item.travelDate), "dd/MM/yyyy") : "",
        item.description,
        item.quantity,
        `Rs:${item.unitPrice.toFixed(2)}`,
        `Rs:${item.unitPrice.toFixed(2)}`,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellWidth: 'auto',
        overflow: 'linebreak',
      },
      columnStyles: {
        3: { cellWidth: 'wrap' },
      },
    })

    // Summary (same)
    const finalY = doc.lastAutoTable.finalY + 10
    const isRajasthan = invoiceData.client.state == 'Rajasthan'

    doc.setFontSize(10);
    doc.text("Summary", 140, finalY);
    doc.line(140, finalY + 2, 195, finalY + 2);

    doc.text(`Subtotal:`, 140, finalY + 12);
    doc.text(`Rs:${invoiceData.subtotal.toFixed(2)}`, 180, finalY + 12, { align: "right" });

    let taxY = finalY + 20;
    if (!isRajasthan) {
      doc.text(`GST (${invoiceData.taxRate}%)`, 140, taxY);
      doc.text(`Rs:${invoiceData.taxAmount.toFixed(2)}`, 180, taxY, { align: "right" });
      taxY += 12;
    } else {
      doc.text(`CGST (${(invoiceData.taxRate / 2).toFixed(1)}%)`, 140, taxY);
      doc.text(`Rs:${(invoiceData.taxAmount / 2).toFixed(2)}`, 180, taxY, { align: "right" });
      taxY += 7;
      doc.text(`SGST (${(invoiceData.taxRate / 2).toFixed(1)}%)`, 140, taxY);
      doc.text(`Rs:${(invoiceData.taxAmount / 2).toFixed(2)}`, 180, taxY, { align: "right" });
      taxY += 12;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Total:`, 140, taxY);
    doc.text(`Rs:${invoiceData.total.toFixed(2)}`, 180, taxY, { align: "right" });

    // Bank Details (same)
    let bankY = taxY + 15
    if (invoiceData.bankDetails) {
      doc.setFont("helvetica", "bold")
      doc.text("Bank Details:", 15, bankY)
      doc.setFont("helvetica", "normal")
      doc.text(`Bank Name: ${invoiceData.bankDetails.bankName || "N/A"}`, 15, bankY + 5)
      doc.text(`Account Number: ${invoiceData.bankDetails.accountNumber || "N/A"}`, 15, bankY + 10)
      doc.text(`IFSC Code: ${invoiceData.bankDetails.ifscCode || "N/A"}`, 15, bankY + 15)
      bankY += 25
    }

    // Conditional Notes
    let notesY = bankY
    if (invoiceData.notes) {
      doc.setFont("helvetica", "bold")
      doc.text("Travel Notes:", 15, notesY)
      doc.setFont("helvetica", "normal")
      const wrappedNotes = doc.splitTextToSize(invoiceData.notes, 180);
      doc.text(wrappedNotes, 15, notesY + 5);
      notesY += (wrappedNotes.length * 5) + 5;
    }

    // Conditional Terms
    if (invoiceData.terms) {
      doc.setFont("helvetica", "bold")
      doc.text("Booking Terms & Conditions:", 15, notesY)
      doc.setFont("helvetica", "normal")
      const wrappedTerms = doc.splitTextToSize(invoiceData.terms, 180);
      doc.text(wrappedTerms, 15, notesY + 5);
    }

    // Footer (same)
    doc.setFontSize(8)
    doc.text("Thank you for choosing us for your travel needs! Happy Journeys!", 105, 280, { align: "center" })

    doc.save(`travel_sales_invoice_${invoiceData.invoiceNumber}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('PDF generation failed.')
  }
}

// Updated Car Rental Invoice PDF (Updated: Use type 'car-rental')
// Updated Car Rental Invoice PDF (Updated: Added total KM in legs table footer)
export const generateCarRentalInvoicePDF = async (invoiceData) => {
  const doc = new jsPDF()

  if (typeof autoTable !== 'function') {
    console.error('jsPDF-AutoTable is not properly loaded.')
    alert('PDF generation failed.')
    return
  }

  try {
    // Header (same)
    doc.setFillColor(41, 128, 185)
    doc.rect(0, 0, 210, 40, "F")

    const img = await loadImage(invoiceData.logoUrl)
    if (img) {
      const aspectRatio = img.width / img.height
      const displayHeight = 20
      const displayWidth = displayHeight * aspectRatio
      doc.addImage(invoiceData.logoUrl, "PNG", 15, 10, displayWidth, displayHeight)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text("CAR RENTAL INVOICE", 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 105, 30, { align: "center" })

    // Company and Client Info (same)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text("FROM:", 15, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`${invoiceData.company.name}`, 15, 55)
    const companyAddressFull = `${invoiceData.company.address}, ${invoiceData.company.district || ''}, ${invoiceData.company.state || ''}`.trim();
    doc.text(companyAddressFull || 'N/A', 15, 60)
    doc.text(`Phone: ${invoiceData.company.phone}`, 15, 65)
    doc.text(`Email: ${invoiceData.company.email}`, 15, 70)
    doc.text(`GSTIN: ${invoiceData.company.gstin || "N/A"}`, 15, 75)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("BILL TO:", 140, 50)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`${invoiceData.client.name}`, 140, 55)
    const clientAddressFull = `${invoiceData.client.address}, ${invoiceData.client.district || ''}, ${invoiceData.client.state || ''}`.trim();
    doc.text(clientAddressFull || 'N/A', 140, 60)
    doc.text(`Phone: ${invoiceData.client.phone}`, 140, 65)
    doc.text(`Email: ${invoiceData.client.email}`, 140, 70)
    doc.text(`GSTIN: ${invoiceData.client.gstin || "N/A"}`, 140, 75)

    // Invoice Details (same)
    doc.setFont("helvetica", "bold")
    doc.text(`Date: ${format(invoiceData.date, "dd/MM/yyyy")}`, 15, 90)
    doc.text(`Due Date: ${format(invoiceData.dueDate, "dd/MM/yyyy")}`, 140, 90)

    // Driver Details with Download Links (same)
    let driverY = 100;
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    doc.text(`Driver License: ${invoiceData.driverLicense || 'N/A'}`, 15, driverY)
    if (invoiceData.driverLicenseImage) {
      const linkX = 15 + doc.getTextWidth(`Driver License: ${invoiceData.driverLicense || 'N/A'} `);
      doc.text("[Download]", linkX, driverY)
      doc.link(linkX, driverY - 2, doc.getTextWidth("[Download]"), 4, { url: `https://apitour.rajasthantouring.in/uploads/${invoiceData.driverLicenseImage}` })
    }
    driverY += 5;

    doc.text(`Vehicle Number: ${invoiceData.driverVehicleNumber || 'N/A'}`, 15, driverY)
    if (invoiceData.vehicleRcImage) {
      const linkX = 15 + doc.getTextWidth(`Vehicle Number: ${invoiceData.driverVehicleNumber || 'N/A'} `);
      doc.text("[Download RC]", linkX, driverY)
      doc.link(linkX, driverY - 2, doc.getTextWidth("[Download RC]"), 4, { url: `https://apitour.rajasthantouring.in/uploads/${invoiceData.vehicleRcImage}` })
    }
    driverY += 5;

    doc.text(`Aadhaar Name: ${invoiceData.aadhaarName || 'N/A'}`, 15, driverY)
    if (invoiceData.aadhaarImage) {
      const linkX = 15 + doc.getTextWidth(`Aadhaar Name: ${invoiceData.aadhaarName || 'N/A'} `);
      doc.text("[Download Aadhaar]", linkX, driverY)
      doc.link(linkX, driverY - 2, doc.getTextWidth("[Download Aadhaar]"), 4, { url: `https://apitour.rajasthantouring.in/uploads/${invoiceData.aadhaarImage}` })
    }
    driverY += 5;

    // New: Vehicle Name
    doc.text(`Vehicle: ${invoiceData.vehicleName || 'N/A'}`, 15, driverY)
    driverY += 5;

    // Updated: Legs Table with total KM footer
    const totalKM = invoiceData.legs.reduce((sum, leg) => sum + (leg.km || 0), 0);
    autoTable(doc, {
      startY: driverY + 10,
      head: [["Pickup Point", "Drop Point", "KM"]],
      body: invoiceData.legs.map((leg) => [
        leg.pickupPoint || "",
        leg.dropPoint || "",
        leg.km || 0,
      ]),
      foot: [
        [
          { content: 'Total KM', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: totalKM.toString(), styles: { halign: 'right', fontStyle: 'bold' } }
        ]
      ],
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
      styles: { fontSize: 8, cellWidth: 'auto', overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 'wrap' }, 1: { cellWidth: 'wrap' } },
    })

    // Summary (updated: use totalRentalAmount)
    const finalY = doc.lastAutoTable.finalY + 10
    const isRajasthan = invoiceData.client.state === 'Rajasthan'

    doc.setFontSize(10);
    doc.text("Summary", 140, finalY);
    doc.line(140, finalY + 2, 195, finalY + 2);

    doc.text(`Subtotal (Rental):`, 140, finalY + 12);
    doc.text(`Rs:${invoiceData.totalRentalAmount.toFixed(2)}`, 180, finalY + 12, { align: "right" });

    let taxY = finalY + 20;
    if (!isRajasthan) {
      doc.text(`GST (${invoiceData.taxRate}%)`, 140, taxY);
      doc.text(`Rs:${invoiceData.taxAmount.toFixed(2)}`, 180, taxY, { align: "right" });
      taxY += 12;
    } else {
      doc.text(`CGST (${(invoiceData.taxRate / 2).toFixed(1)}%)`, 140, taxY);
      doc.text(`Rs:${(invoiceData.taxAmount / 2).toFixed(2)}`, 180, taxY, { align: "right" });
      taxY += 7;
      doc.text(`SGST (${(invoiceData.taxRate / 2).toFixed(1)}%)`, 140, taxY);
      doc.text(`Rs:${(invoiceData.taxAmount / 2).toFixed(2)}`, 180, taxY, { align: "right" });
      taxY += 12;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Total:`, 140, taxY);
    doc.text(`Rs:${invoiceData.total.toFixed(2)}`, 180, taxY, { align: "right" });

    // Conditional Notes
    let notesY = taxY + 15
    if (invoiceData.notes) {
      doc.setFont("helvetica", "bold")
      doc.text("Notes:", 15, notesY)
      doc.setFont("helvetica", "normal")
      const wrappedNotes = doc.splitTextToSize(invoiceData.notes, 180);
      doc.text(wrappedNotes, 15, notesY + 5);
      notesY += (wrappedNotes.length * 5) + 5;
    }

    // Conditional Terms
    if (invoiceData.terms) {
      doc.setFont("helvetica", "bold")
      doc.text("Terms & Conditions:", 15, notesY)
      doc.setFont("helvetica", "normal")
      const wrappedTerms = doc.splitTextToSize(invoiceData.terms, 180);
      doc.text(wrappedTerms, 15, notesY + 5);
    }

    // Footer (same)
    doc.setFontSize(8)
    doc.text("Safe Drives! Thank you for your business.", 105, 280, { align: "center" })

    doc.save(`car_rental_invoice_${invoiceData.invoiceNumber}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('PDF generation failed.')
  }
}

// Main generatePDF (Updated case for 'car-rental' type)
export const generatePDFBuffer = async (billData) => {
  // Assuming this is the buffer version; adjust as needed for server-side
  let doc;
  switch (billData.type) {
    case "quotation":
      doc = await generateTravelQuotationPDF(billData);
      break;
    case "car-rental":
      doc = await generateCarRentalInvoicePDF(billData);
      break;
    case "invoice":
      doc = await generateTravelSalesInvoicePDF(billData);
      break;
  }
  return doc.output('arraybuffer');
};

export const generatePDF = async (invoiceData, invoiceType) => {
  switch (invoiceType) {
    case "quotation":
      await generateTravelQuotationPDF(invoiceData)
      break
    case "car-rental":
      await generateCarRentalInvoicePDF(invoiceData)
      break
    case "invoice":
      await generateTravelSalesInvoicePDF(invoiceData)
      break
    
  }
}
// pendingPayments.js (Updated for Multi-Category Support and Milestone Emails)
const express = require("express")
const router = express.Router()
const Pending = require("../model/pendingitineraray") // Assuming Pending model exists with similar structure to Booking
const ItineraryEmail = require("../model/email")
const Companybilldata = require("../model/Companybill")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const PDFDocument = require("pdfkit")
const mongoose = require("mongoose")
const JWT_SECRET = process.env.JWT_SECRET
const nodemailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
const TourSoftwareModel = require("../model/TourSoftwareModel")

// Server and client base URLs
const serverBase = process.env.SERVER_BASE_URL || "https://apitour.rajasthantouring.in"
const clientBase = process.env.CLIENT_BASE_URL || "https://tour.rajasthantouring.in"

// IMPORTANT: To fix the rupee symbol (₹) rendering issue in PDFs, download Noto Sans fonts from Google Fonts:
// - NotoSans-Regular.ttf
// - NotoSans-Bold.ttf
// Place them in a 'fonts' folder in your project root (e.g., project-root/fonts/).
// These fonts support the Indian Rupee symbol (U+20B9).
const fontsDir = path.join(__dirname, "..", "fonts")
const regularFontPath = path.join(fontsDir, "NotoSans-Regular.ttf")
const boldFontPath = path.join(fontsDir, "NotoSans-Bold.ttf")

// Helper to get category-wise amounts
const getCategoryAmounts = (amountsObj, currencySymbol) => {
  if (!amountsObj || typeof amountsObj !== 'object') return `${currencySymbol}${amountsObj || 0}`;
  return Object.entries(amountsObj).map(([cat, amt]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${currencySymbol}${Number(amt || 0)}`).join('\n');
};

const authMiddleware = (req, res, next) => {
  const token = req.cookies.admin_token || req.cookies.token || req.cookies.user_token // Check both token and admin_token

  console.log(token)

  if (!token) return res.status(401).json({ message: "Not authenticated" })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "rajasthantouringjaipur@gmail.com",
    pass: process.env.EMAIL_PASS || "bhsh nipi oory ayop",
  },
})

// Helper function to format date as "01 Jan 2025"
// Beautiful date formatter: 10-11-2025 → 10 Nov 2025
const formatDateFromDDMMYYYY = (dateStr) => {
  if (!dateStr) return "TBC";
  const [day, month, year] = dateStr.split("-");
  if (!day || !month || !year) return "TBC";

  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return "TBC";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Calculate End Date from itinerary days length
const calculateEndDate = (startDateStr, totalDays) => {
  if (!startDateStr || !totalDays) return "TBC";
  const [day, month, year] = startDateStr.split("-");
  const startDate = new Date(`${year}-${month}-${day}`);
  if (isNaN(startDate.getTime())) return "TBC";

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (totalDays - 1)); // -1 because Day 1 is included

  return endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Helper to calculate total paid amount (supports single or category-wise)
const calculateTotalPaid = (payments) => {
  return (payments || [])
    .filter(p => p.status === "success")
    .reduce((sum, p) => {
      if (typeof p.amount === "object" && p.amount !== null) {
        return sum + Object.values(p.amount).reduce((catSum, val) => catSum + Number(val || 0), 0);
      }
      return sum + Number(p.amount || 0);
    }, 0);
};

// ==================== 20% CONFIRMATION EMAIL ====================
const send20PercentConfirmationEmail = async (pending) => {
  try {
    const clientEmail = pending.clientDetails?.email;
    const clientName = pending.clientDetails?.name || "Valued Guest";

    const startDateRaw = pending.clientDetails?.travelDate;
    const totalItineraryDays = pending.itineraryData?.days?.length || 0;

    const startDate = formatDateFromDDMMYYYY(startDateRaw);
    const endDate = totalItineraryDays > 0
      ? calculateEndDate(startDateRaw, totalItineraryDays)
      : "TBC";

    const tourName = pending.selectedItinerary?.titles?.[0] ||
      pending.packageName ||
      "Custom Rajasthan Tour Package";

    if (!clientEmail) {
      console.log("No client email found, skipping 20% confirmation email");
      return;
    }

    // Find the first successful payment for breakdown
    const firstSuccessPayment = (pending.payments || []).find(p => p.status === "success");

    if (!firstSuccessPayment) {
      console.log("No successful payment found for 20%.");
      return;
    }

    // Extract amount properly (supports both single number and category-wise object)
    let receivedAmount = 0;
    let amountBreakdown = "";

    if (typeof firstSuccessPayment.amount === "object" && firstSuccessPayment.amount !== null) {
      // Multi-category amount (e.g., { hotel: 8000, cab: 2000 })
      receivedAmount = Object.values(firstSuccessPayment.amount).reduce((sum, val) => sum + Number(val || 0), 0);
      amountBreakdown = Object.entries(firstSuccessPayment.amount)
        .map(([cat, amt]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ₹${Number(amt || 0).toLocaleString('en-IN')}`)
        .join(" + ");
    } else {
      // Single amount
      receivedAmount = Number(firstSuccessPayment.amount || 0);
    }

    const formattedAmount = receivedAmount.toLocaleString('en-IN');
    const displayAmount = amountBreakdown ? `${amountBreakdown} = ₹${formattedAmount}` : `₹${formattedAmount}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "rajasthantouringjaipur@gmail.com",
      to: clientEmail,
      bcc: "rajasthantouringjaipur@gmail.com",
      subject: "Your Rajasthan Trip Booking is Confirmed!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fff;">
          <h2 style="color: #d4af37; text-align: center;">Rajasthan Touring</h2>
          <p>Dear <strong>${clientName}</strong>,</p>
          <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
          
          <p>Thank you for choosing Rajasthan Touring! We’re delighted to inform you that your Rajasthan Trip booking is now <strong>confirmed</strong>.</p>
          
          <p>We have successfully received your advance payment of:</p>
          <h2 style="color: green; text-align: center;">${displayAmount}</h2>

          ${amountBreakdown ? `<p><strong>Breakdown:</strong> ${amountBreakdown.replace(/ \+ /g, ' + ')}</p>` : ''}

          <h3>Booking Summary</h3>
          <ul>
           <li><strong>Tour Package:</strong> ${tourName}</li>
<li><strong>Travel Dates:</strong> ${startDate} – ${endDate}</li>
<li><strong>Guest Name:</strong> ${clientName}</li>
<li><strong>Total Guests:</strong> ${pending.clientDetails?.travelers || pending.clientDetails?.adults} (Adults: ${pending.clientDetails?.adults || 0}, Kids 5-12: ${pending.clientDetails?.kids5to12 || 0}, Below 5: ${pending.clientDetails?.kidsBelow5 || 0})</li>
          </ul>

          <h3>Payment Terms</h3>
          <ul>
            <li>20% – Advance Payment – <strong style="color: green;">Received ✓</strong> (${displayAmount})</li>
            <li>30% – Payable at the time of Hotel Confirmation & Voucher Issuance</li>
            <li>50% – Payable Upon Arrival on Day 1 (In Cash)</li>
          </ul>

          <p>Your hotels, cab, and itinerary are now being finalized. Vouchers will be shared within 24-48 hours.</p>

          <p>We’re super excited to host you in the royal land of Rajasthan!</p>

          <p>For any queries, feel free to call/WhatsApp us at <strong>+91 9509911614</strong>.</p>

          <br>
          <p>Warm Regards,<br>
          <strong>Team Rajasthan Touring</strong><br>
          Jaipur, Rajasthan</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`20% Confirmation email sent to ${clientEmail} | Amount: ₹${formattedAmount}`);
  } catch (err) {
    console.error("Failed to send 20% confirmation email:", err);
  }
};

// ==================== 30% VOUCHER CONFIRMATION EMAIL ====================
const send30PercentConfirmationEmail = async (pending) => {
  try {
    const clientEmail = pending.clientDetails?.email;
    const clientName = pending.clientDetails?.name || "Valued Guest";

    const startDateRaw = pending.clientDetails?.travelDate;
    const totalItineraryDays = pending.itineraryData?.days?.length || 0;

    const startDate = formatDateFromDDMMYYYY(startDateRaw);
    const endDate = totalItineraryDays > 0
      ? calculateEndDate(startDateRaw, totalItineraryDays)
      : "TBC";

    const tourName = pending.selectedItinerary?.titles?.[0] ||
      pending.packageName ||
      "Custom Rajasthan Tour Package";

    const bookingId = pending.bookingId || pending._id.slice(-5).toUpperCase();

    if (!clientEmail) {
      console.log("No client email found, skipping 30% confirmation email");
      return;
    }

    // Find the latest successful payment for 30% breakdown
    const successPayments = (pending.payments || []).filter(p => p.status === "success");
    const latest30Payment = successPayments[successPayments.length - 1]; // Assuming last is 30%

    if (!latest30Payment) {
      console.log("No successful payment found for 30%.");
      return;
    }

    // Extract amount properly
    let receivedAmount30 = 0;
    let amountBreakdown30 = "";

    if (typeof latest30Payment.amount === "object" && latest30Payment.amount !== null) {
      receivedAmount30 = Object.values(latest30Payment.amount).reduce((sum, val) => sum + Number(val || 0), 0);
      amountBreakdown30 = Object.entries(latest30Payment.amount)
        .map(([cat, amt]) => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: ₹${Number(amt || 0).toLocaleString('en-IN')}`)
        .join(" + ");
    } else {
      receivedAmount30 = Number(latest30Payment.amount || 0);
    }

    const formattedAmount30 = receivedAmount30.toLocaleString('en-IN');
    const displayAmount30 = amountBreakdown30 ? `${amountBreakdown30} = ₹${formattedAmount30}` : `₹${formattedAmount30}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || "rajasthantouringjaipur@gmail.com",
      to: clientEmail,
      bcc: "rajasthantouringjaipur@gmail.com",
      subject: "30% Voucher Payment Received - Booking Updated!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fff;">
          <h2 style="color: #d4af37; text-align: center;">Rajasthan Touring</h2>
          <p>Dear <strong>${clientName}</strong>,</p>
          <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
          
          <p>We’re happy to confirm that we have received your 30% voucher payment.</p>
          
          <p>Your booking is now fully updated in our system.</p>

          <p>We have successfully received your voucher payment of:</p>
          <h2 style="color: green; text-align: center;">${displayAmount30}</h2>

          ${amountBreakdown30 ? `<p><strong>Breakdown:</strong> ${amountBreakdown30.replace(/ \+ /g, ' + ')}</p>` : ''}

          <h3>Booking Summary</h3>
          <ul>
           <li><strong>Confirmation No.:</strong> ${bookingId}</li>
           <li><strong>Tour Package:</strong> ${tourName}</li>
<li><strong>Travel Dates:</strong> ${startDate} – ${endDate}</li>
<li><strong>Guest Name:</strong> ${clientName}</li>
<li><strong>Total Guests:</strong> ${pending.clientDetails?.travelers || pending.clientDetails?.adults} (Adults: ${pending.clientDetails?.adults || 0}, Kids 5-12: ${pending.clientDetails?.kids5to12 || 0}, Below 5: ${pending.clientDetails?.kidsBelow5 || 0})</li>
          </ul>

          <h3>Payment Status</h3>
          <ul>
            <li>20% – Advance <strong style="color: green;">(Received)</strong></li>
            <li>30% – Voucher Payment <strong style="color: green;">(Received)</strong></li>
            <li>50% – Due on Arrival (Day 1, in cash)</li>
          </ul>

          <p>Thank you for your prompt payment. Please feel free to contact us if you need any assistance.</p>

          <p>For any queries, feel free to call/WhatsApp us at <strong>+91 9509911614</strong>.</p>

          <br>
          <p>Warm Regards,<br>
          <strong>Team Rajasthan Touring</strong><br>
          Jaipur, Rajasthan</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`30% Confirmation email sent to ${clientEmail} | Amount: ₹${formattedAmount30}`);
  } catch (err) {
    console.error("Failed to send 30% confirmation email:", err);
  }
};

// ==================== GENERAL EMAIL CHECKER ====================
const checkAndSendMilestoneEmails = async (pending, oldTotalPaid) => {
  const totalAmount = pending.totalAmount || 0;
  const newTotalPaid = calculateTotalPaid(pending.payments);

  // 20% Threshold: First time >= 20%
  if (oldTotalPaid < 0.2 * totalAmount && newTotalPaid >= 0.2 * totalAmount) {
    await send20PercentConfirmationEmail(pending);
    pending.status = "Confirmed"; // Set status on first payment
    await pending.save();
  }

  // 50% Cumulative Threshold (20% + 30%): First time >= 50%
  if (oldTotalPaid < 0.5 * totalAmount && newTotalPaid >= 0.5 * totalAmount) {
    await send30PercentConfirmationEmail(pending);
  }
};

// Add a new payment (admin route for pending)
router.post("/:pendingId", authMiddleware, async (req, res) => {
  try {
    const pending = await Pending.findById(req.params.pendingId)
    if (!pending) {
      return res.status(404).json({ message: "Pending not found" })
    }

    const oldTotalPaid = calculateTotalPaid(pending.payments);

    const hadAnySuccessBefore = (pending.payments || []).some((p) => p.status === "success")

    const payment = {
      ...req.body,
      paymentDate: new Date(),
      _id: new mongoose.Types.ObjectId(),
    }

    pending.payments = pending.payments || []
    pending.payments.push(payment)

    // If first time marking any payment as success, set status to Confirmed or similar
    if (!hadAnySuccessBefore && payment.status === "success") {
      pending.status = "confirmed"
    }

    pending.updatedAt = Date.now()

    await pending.save()

    // Check and send milestone emails
    await checkAndSendMilestoneEmails(pending, oldTotalPaid);

    const io = req.app.get("io");
    io.emit("new_pending_payment", {
      message: "New payment added (admin)",
      pendingId: pending._id,
      payment,
      user: pending.clientDetails,
      status: pending.status,
    });

    res.status(201).json(pending)
  } catch (error) {
    console.error("Error adding payment to pending:", error)
    res.status(500).json({ message: "Failed to add payment", error: error.message })
  }
})

// Update an existing payment for pending
router.put("/:pendingId/:paymentId", authMiddleware, async (req, res) => {
  try {
    const pending = await Pending.findById(req.params.pendingId)
    if (!pending) {
      return res.status(404).json({ message: "Pending not found" })
    }

    const oldTotalPaid = calculateTotalPaid(pending.payments);

    const hadAnySuccessBefore = (pending.payments || []).some((p) => p.status === "success")

    const paymentIndex = pending.payments.findIndex((p) => p._id.toString() === req.params.paymentId)
    if (paymentIndex === -1) {
      return res.status(404).json({ message: "Payment not found" })
    }

    const updated = {
      ...pending.payments[paymentIndex],
      ...req.body,
      paymentDate: new Date(),
      _id: pending.payments[paymentIndex]._id,
    }
    pending.payments[paymentIndex] = updated

    // If first time marking any payment as success, set status to Confirmed
    if (!hadAnySuccessBefore && updated.status === "success") {
      pending.status = "Confirmed"
    }

    pending.updatedAt = Date.now()
    await pending.save()

    // Check and send milestone emails
    await checkAndSendMilestoneEmails(pending, oldTotalPaid);

    res.status(200).json(pending)
  } catch (error) {
    console.error("Error updating payment in pending:", error)
    res.status(500).json({ message: "Failed to update payment", error: error.message })
  }
})

// Add a new payment (from user/client perspective for pending)
router.post("/user/:pendingId", async (req, res) => {
  try {
    const pending = await Pending.findById(req.params.pendingId)
    if (!pending) {
      return res.status(404).json({ message: "Pending not found" })
    }

    const oldTotalPaid = calculateTotalPaid(pending.payments);

    const hadAnySuccessBefore = (pending.payments || []).some((p) => p.status === "success")

    const payment = {
      ...req.body,
      status: req.body.status || "pending",
      paymentDate: new Date(),
      _id: new mongoose.Types.ObjectId(),
      screenshot: req.body.screenshot || req.body.receiptUrl, // Map screenshot to receiptUrl if needed
    }

    pending.payments = pending.payments || []
    pending.payments.push(payment)

    // If first time marking any payment as success, set status to Confirmed
    if (!hadAnySuccessBefore && payment.status === "success") {
      pending.status = "Confirmed"
    }

    pending.updatedAt = Date.now()
    await pending.save()

    // Check and send milestone emails
    await checkAndSendMilestoneEmails(pending, oldTotalPaid);

    const io = req.app.get("io");
    io.emit("new_pending_payment", {
      message: "New payment added to pending",
      pendingId: pending._id,
      payment,
      user: pending.clientDetails,
      status: pending.status,
    });

    res.status(201).json(pending)
  } catch (error) {
    console.error("Error adding payment to pending:", error)
    res.status(500).json({ message: "Failed to add payment", error: error.message })
  }
})

module.exports = router 
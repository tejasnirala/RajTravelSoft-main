"use client"
import { useEffect, useState, useContext, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext" // Adjust the import path as needed
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Search, Filter, Calendar, User, CreditCard, Eye, Settings, X, Upload, Check, Clock, AlertCircle, XCircle, CheckCircle, FileText, Edit, MessageCircle, Download, FileSpreadsheet, Wallet, ChartNoAxesColumnDecreasing } from "lucide-react";
import { FaRupeeSign } from "react-icons/fa";
import Viewdata6 from "../itenery/ViewData6admin"
import Viewdata4 from "../itenery/ViewData4admin"
import Viewdata3admin from "../itenery/Viewdata3admin"
import Viewdata5Redesigned from "../itenery/Viewdata2admin"
import ViewDataadmin from "../hotelpage/ViewDataadmin"
import BookingSheetViewer from "../componate/BookingItinerarySheet"
import { toast } from "react-toastify"
const BookingsTable = () => {
    const [bookings, setBookings] = useState([])
    const [filteredBookings, setFilteredBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { user } = useContext(AuthContext)
    console.log(user);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [triggerDownload, setTriggerDownload] = useState(false);
    const [viewModal, setViewModal] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [offerLoading, setOfferLoading] = useState(false);
    const [completeLoading, setCompleteLoading] = useState(false);
    const [offerUsedLoading, setOfferUsedLoading] = useState(false);
    const [viewpdf, setViewpdf] = useState(false);
    const [nextPaymentPerc, setNextPaymentPerc] = useState('30');
    const [sheetBookingId, setSheetBookingId] = useState(null);
    const [show, setShow] = useState(false)
    const [showNote, setShowNote] = useState(false);
    const [noteText, setNoteText] = useState("");

    const [paymentData, setPaymentData] = useState({
        amount: "",
        currency: "INR",
        mobileNumber: "",
        method: "",
        transactionId: "",
        gateway: "",
        status: "pending",
        receiptUrl: "",
        screenshot: "",
        index: null,
    });
    const [nextOfferData, setNextOfferData] = useState({
        type: true,
        value: 0,
    });
    const [filters, setFilters] = useState({
        status: "",
        duration: "",
        clientName: "",
        vehicle: "",
        minAmount: "",
        maxAmount: "",
        itinerary: "",
        mobileNumber: "",
        travelDate: "",
        tourCode: "",
        createdBy: "",
    })
    console.log(viewModal);
    const calculateBalanceAmount = (booking) => {
        const paidAmount =
            booking.payments?.filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        return booking.totalAmount - paidAmount;
    };
    const clientBase = 'https://apitour.rajasthantouring.in'
    // Calculate End Date from itinerary days length
    const calculateEndDate = (startDateStr, totalDays) => {
        if (!startDateStr || !totalDays) return "TBC";
        const parts = startDateStr.split("-");
        if (parts.length !== 3) return "TBC";
        const [day, month, yearStr] = parts;
        let year = parseInt(yearStr, 10);
        if (year < 100) year += 2000;
        const startDate = new Date(year, month - 1, day);
        if (isNaN(startDate.getTime())) return "TBC";
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (totalDays - 1)); // -1 because Day 1 is included
        return endDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    useEffect(() => {
        if (selectedBooking && selectedBooking.nextOffer) {
            setNextOfferData({
                type: selectedBooking.nextOffer.type,
                value: selectedBooking.nextOffer.value || 0,
            });
        } else {
            setNextOfferData({ type: true, value: 0 });
        }
    }, [selectedBooking]);

    const fetchBookings = async () => {
        if (!user) {
            setLoading(false)
            return
        }
        try {
            let url = "https://apitour.rajasthantouring.in/api/bookings"
            if (user.role !== 'admin') {
                url += `?createdBy=${user._id}`
            }
            const res = await axios.get(url, {
                withCredentials: true,
            })
            console.log(res.data)
            const bookingsData = Array.isArray(res.data) ? res.data : []
            setBookings(bookingsData)
            setFilteredBookings(bookingsData)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching bookings:", error)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [user])
    useEffect(() => {
        const filtered = bookings.filter((booking) => {
            // User-based filtering (redundant with API filter but keeps client-side safety)
            if (user && user.role !== 'admin' && booking.createby?._id !== user._id) {
                return false
            }
            if (filters.status && booking.status !== filters.status) return false
            if (filters.duration) {
                const days = booking.itineraryData?.days?.length || 0
                if (filters.duration === "short" && days > 3) return false
                if (filters.duration === "medium" && (days <= 3 || days > 7)) return false
                if (filters.duration === "long" && days <= 7) return false
            }
            if (filters.clientName && !booking.clientDetails?.name?.toLowerCase().includes(filters.clientName.toLowerCase()))
                return false
            if (filters.vehicle) {
                const vehicleText = booking.itineraryData?.vehicle
                    ? ` ${booking.itineraryData.vehicle.model}`.toLowerCase()
                    : ""
                if (!vehicleText.includes(filters.vehicle.toLowerCase())) return false
            }
            if (filters.minAmount && booking.totalAmount < Number.parseInt(filters.minAmount)) return false
            if (filters.maxAmount && booking.totalAmount > Number.parseInt(filters.maxAmount)) return false
            if (filters.itinerary) {
                const itineraryText = booking.itineraryData?.titles?.join(" ").toLowerCase() || ""
                if (!itineraryText.includes(filters.itinerary.toLowerCase())) return false
            }
            if (filters.mobileNumber && !booking.clientDetails?.phone?.includes(filters.mobileNumber)) return false
            if (filters.createdBy && !booking.createby?.name?.toLowerCase().includes(filters.createdBy.toLowerCase())) return false
            if (filters.travelDate) {
                const rawBookingDate = booking.clientDetails?.travelDate ? booking.clientDetails?.travelDate : "";
                let normalizedBookingDate = "";
                if (rawBookingDate) {
                    let dateObj;
                    // Try ISO first (e.g., 2025-10-08)
                    if (!isNaN(Date.parse(rawBookingDate))) {
                        dateObj = new Date(rawBookingDate);
                    } else {
                        // Try DD-MM-YY or DD-MM-YYYY manually
                        const parts = rawBookingDate.split("-");
                        if (parts.length === 3) {
                            const [dd, mm, yyyyStr] = parts;
                            let yyyy = parseInt(yyyyStr, 10);
                            // Handle YY (e.g., 25 -> 2025)
                            if (yyyy < 100) {
                                yyyy += 2000;
                            }
                            dateObj = new Date(yyyy, mm - 1, dd);
                        }
                    }
                    // Validate date
                    if (!dateObj || isNaN(dateObj.getTime())) {
                        normalizedBookingDate = ""; // Invalid date, won't match
                    } else {
                        normalizedBookingDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
                    }
                }
                if (normalizedBookingDate !== filters.travelDate) return false
            }
            if (filters.tourCode && !booking.itineraryData?.tourcode?.toLowerCase().includes(filters.tourCode.toLowerCase()))
                return false
            return true
        })
        setFilteredBookings(filtered)
    }, [bookings, filters, user])
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }
    const clearFilters = () => {
        setFilters({
            status: "",
            duration: "",
            clientName: "",
            vehicle: "",
            minAmount: "",
            maxAmount: "",
            itinerary: "",
            mobileNumber: "",
            travelDate: "",
            tourCode: "",
            createdBy: "",
        })
    }
    console.log(bookings);
    // Universal Date Display Formatter (supports all cases)
    const parseDateForDisplay = (rawDate) => {
        if (!rawDate) return "N/A";

        const dmyRegex = /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/;

        let dateObj;

        // Case: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        if (dmyRegex.test(rawDate)) {
            const parts = rawDate.split(/[-/.]/);
            let [dd, mm, yy] = parts.map(p => parseInt(p, 10));

            if (yy < 100) yy += 2000; // Handle 2-digit year like 25 ➜ 2025

            dateObj = new Date(yy, mm - 1, dd);
        }
        else if (!isNaN(Date.parse(rawDate))) {
            // Handle: 2025-11-02, Nov 02 2025, etc.
            dateObj = new Date(rawDate);
        }

        // Invalid date guard
        if (!dateObj || isNaN(dateObj.getTime())) return "N/A";

        // Display Format => 02 Feb 2025
        return dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData({ ...paymentData, [name]: value });
    };
    const handleNextOfferChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNextOfferData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : Number(value),
        }));
    };
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("File size should be less than 5MB");
            return;
        }
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file");
            return;
        }
        const formData = new FormData();
        formData.append("screenshot", file);
        try {
            const response = await axios.post("https://apitour.rajasthantouring.in/api/bookings/upload-screenshot", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });
            setPaymentData({ ...paymentData, screenshot: response.data.screenshotUrl });
        } catch (err) {
            console.error("Error uploading screenshot:", err);
            alert("Failed to upload screenshot. Please try again.");
        }
    };
    const handleAddPayment = async () => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            alert("Please enter a valid amount greater than 0");
            return;
        }
        if (!paymentData.method || paymentData.method.trim() === "") {
            alert("Please enter a payment method");
            return;
        }
        try {
            setPaymentLoading(true);
            const response = await axios.post(
                `https://apitour.rajasthantouring.in/api/payments/${selectedBooking._id}`,
                paymentData,
                { withCredentials: true }
            );
            setSelectedBooking(response.data);
            setBookings(bookings.map((b) => (b._id === response.data._id ? response.data : b)));
            setPaymentData({
                amount: "",
                currency: "INR",
                method: "",
                transactionId: "",
                gateway: "",
                status: "pending",
                receiptUrl: "",
                screenshot: "",
                index: null,
            });
            alert("Payment added successfully");
        } catch (err) {
            console.error("Error adding payment:", err);
            alert("Failed to add payment. Please check your connection and try again.");
        } finally {
            setPaymentLoading(false);
        }
    };
    const handleUpdatePayment = async () => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            alert("Please enter a valid amount greater than 0");
            return;
        }
        if (!paymentData.method || paymentData.method.trim() === "") {
            alert("Please enter a payment method");
            return;
        }
        try {
            setPaymentLoading(true);
            const paymentId = selectedBooking.payments[paymentData.index]._id;
            const response = await axios.put(
                `https://apitour.rajasthantouring.in/api/payments/${selectedBooking._id}/${paymentId}`,
                paymentData,
                { withCredentials: true }
            );
            setSelectedBooking(response.data);
            setBookings(bookings.map((b) => (b._id === response.data._id ? response.data : b)));
            setPaymentData({
                amount: "",
                currency: "INR",
                method: "",
                transactionId: "",
                gateway: "",
                status: "pending",
                receiptUrl: "",
                screenshot: "",
                index: null,
            });
            alert("Payment updated successfully");
        } catch (err) {
            console.error("Error updating payment:", err);
            alert("Failed to update payment. Please check your connection and try again.");
        } finally {
            setPaymentLoading(false);
        }
    };
    const handleMarkAsCompleted = async () => {
        if (!selectedBooking) return;
        try {
            setCompleteLoading(true);
            const response = await axios.put(
                `https://apitour.rajasthantouring.in/api/bookings/complete/${selectedBooking._id}`,
                { nextOffer: nextOfferData },
                { withCredentials: true }
            );
            setSelectedBooking(response.data.booking);
            setBookings(bookings.map((b) => (b._id === response.data.booking._id ? response.data.booking : b)));
            alert("Booking marked as completed successfully");
        } catch (err) {
            console.error("Error marking booking as completed:", err);
            alert(err.response?.data?.message || "Failed to mark booking as completed. Please try again.");
        } finally {
            setCompleteLoading(false);
        }
    };
    const handleSendWhatsAppNotification = async (booking, payment, action) => {
        const response = await axios.get(`https://apitour.rajasthantouring.in/api/payments/${booking._id}/whatsapp`, { withCredentials: true });
        const { pdfUrl } = response.data;
        try {
            const allPayments = booking.payments || [];
            const totalPaid = allPayments
                .filter(p => p.status === "success")
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const remaining = Math.max(0, (booking.totalAmount || 0) - totalPaid);
            const message = `
Payment Received Successfully
Dear ${booking.clientDetails.name},
"Khammaghani"
${booking.itineraryData?.tourcode ? `Tour Code: ${booking.itineraryData.tourcode}` : ""}
Package: ${booking.itineraryData?.titles?.[0] || "N/A"}
Travel Date: ${booking.clientDetails.travelDate || "N/A"}
Amount: ₹${Number(payment.amount || 0)}
Status: ${payment.status || "N/A"}
Method: ${payment.method || "N/A"}
Total Paid: ₹${totalPaid}
Remaining: ₹${remaining}
View Details: ${clientBase}/${booking.theme.link}/${booking._id},
Download PDF: ${pdfUrl},
Total Amount: ₹${booking.totalAmount || 0}
Thank you for your payment!
    `.trim();
            // Phone number format karein
            const rawPhone = booking.clientDetails?.phone || '';
            let phone = rawPhone.replace(/[^0-9]/g, '');
            if (phone) {
                if (phone.length === 10) {
                    phone = `91${phone}`;
                } else if (phone.length === 11 && phone.startsWith('0')) {
                    phone = `91${phone.slice(1)}`;
                }
                // WhatsApp link generate karein
                const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                // ✅ WhatsApp window open karein
                window.open(waLink, '_blank');
                alert('WhatsApp message opened in new tab!');
            } else {
                alert('No phone number found for this client.');
            }
        } catch (err) {
            console.error('Error sending WhatsApp notification:', err);
            alert('Failed to send WhatsApp notification.');
        }
    };
    const handleUpdateNextOffer = async () => {
        if (!selectedBooking) return;
        if (nextOfferData.value < 0) {
            alert("Offer value cannot be negative");
            return;
        }
        try {
            setOfferLoading(true);
            const response = await axios.put(
                `https://apitour.rajasthantouring.in/api/bookings/update-offer/${selectedBooking._id}`,
                { nextOffer: nextOfferData },
                { withCredentials: true }
            );
            setSelectedBooking(response.data.booking);
            setBookings(bookings.map((b) => (b._id === response.data.booking._id ? response.data.booking : b)));
            alert("Next offer updated successfully");
        } catch (err) {
            console.error("Error updating next offer:", err);
            alert(err.response?.data?.message || "Failed to update next offer. Please try again.");
        } finally {
            setOfferLoading(false);
        }
    };
    const handleMarkOfferAsUsed = async () => {
        if (!selectedBooking) return;
        try {
            setOfferUsedLoading(true);
            const response = await axios.put(
                `https://apitour.rajasthantouring.in/api/bookings/use-offer/${selectedBooking._id}`,
                {},
                { withCredentials: true }
            );
            setSelectedBooking(response.data.booking);
            setBookings(bookings.map((b) => (b._id === response.data.booking._id ? response.data.booking : b)));
            alert("Offer marked as used successfully");
        } catch (err) {
            console.error("Error marking offer as used:", err);
            alert(err.response?.data?.message || "Failed to mark offer as used. Please try again.");
        } finally {
            setOfferUsedLoading(false);
        }
    };
    const handleEditPayment = (payment, index) => {
        setPaymentData({ ...payment, index });
    };
    const handleWhatsApp = async (booking) => {
        try {
            const response = await axios.get(`https://apitour.rajasthantouring.in/api/payments/${booking._id}/whatsapp`, { withCredentials: true });
            const { waLink } = response.data;
            window.open(waLink, '_blank');
        } catch (err) {
            console.error("Error generating WhatsApp link:", err);
            alert("Failed to generate WhatsApp link. Please check the phone number and try again.");
        }
    };
    const handleDownloadPDF = (booking) => {
        window.open(`https://apitour.rajasthantouring.in/api/payments/${booking._id}/pdf/updated`, '_blank');
    };
    // Helper function - Payment details
    const getPaymentDetails = (booking) => {
        const totalPaid = booking?.payments?.filter(p => p.status === "success")
            .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

        const totalAmount = Number(booking?.totalAmount || 0);

        const balance = totalAmount - totalPaid;

        const paidPercentage = totalAmount > 0
            ? ((totalPaid / totalAmount) * 100).toFixed(2)
            : 0;

        const hasPayment = totalPaid > 0;
        const isFullyPaid = Number(paidPercentage) === 100;

        return {
            totalPaid,
            balance,
            totalAmount,
            paidPercentage,
            hasPayment,
            isFullyPaid
        };
    };


    const cancell = async (id) => {
        try {
            const res = await axios.put(`https://apitour.rajasthantouring.in/api/bookings/cancel/${id}`);
            if (res.status === 200) {
                toast.success("Booking cancelled successfully!");
                console.log(res.data);
                fetchBookings()
            }
        } catch (error) {
            console.error("Cancel error:", error);

            toast.error(error?.response?.data?.message || "Failed to cancel booking");
        }
    };

    // ✅ NEW: Calculate expected amount based on total percentage
    const calculateExpectedAmount = (booking, percentage) => {
        const { totalAmount } = getPaymentDetails(booking);
        return ((totalAmount * percentage) / 100).toFixed(2);
    };

    const payments = getPaymentDetails(selectedBooking);

    // ✅ NEW: Calculate shortage from previous payments
    const calculateShortage = (booking) => {
        // Yahan aap apne payment plan ko track kar sakte hain
        // Abhi ke liye, simple calculation: expected vs actual
        const { totalPaid, totalAmount } = getPaymentDetails(booking);
        // Example: Agar aapne pehle 20% expect kiya tha
        // Aap yahan custom logic laga sakte hain based on your payment plan
        return 0; // Default - aap isko customize kar sakte hain
    };
    // ✅ MAIN: Amount calculation - TOTAL ka percentage + previous shortage
    const calculateNextPaymentAmount = (booking, currentPercentage) => {
        const { totalAmount, totalPaid } = getPaymentDetails(booking);
        const plan = booking.paymentPercentages || [20, 30, 50];
        const current = Number(currentPercentage);
        const index = plan.indexOf(current);
        const prevPercent = plan.slice(0, index).reduce((a, b) => a + b, 0);
        const prevExpected = (totalAmount * prevPercent) / 100;
        const currentExpected = (totalAmount * current) / 100;
        const previousShortage = Math.max(0, prevExpected - totalPaid);
        // ⭐ Addons only on 50%
        let addonAdvance = 0;
        if (current === 50) {
            const addonTotal = booking.addons?.reduce((s, a) => s + (a.value || 0), 0) || 0;
            addonAdvance = addonTotal; // full addon OR 50%? you choose
        }
        return (currentExpected + previousShortage + addonAdvance).toFixed(2);
    };
    // WhatsApp Handler - Updated with templates
    const handleSendNextPaymentWhatsApp = async () => {
        if (!nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0) {
            alert("Please enter a valid percentage");
            return;
        }
        const perc = parseFloat(nextPaymentPerc);
        const paymentDetails = getPaymentDetails(selectedBooking);
        const totalDays = selectedBooking.itineraryData?.days?.length || parseInt(selectedBooking.selectedItinerary?.duration) || 0;
        const startDate = parseDateForDisplay(selectedBooking.clientDetails.travelDate);
        const endDate = calculateEndDate(selectedBooking.clientDetails.travelDate, totalDays);
        const tripDates = totalDays > 0 ? `${startDate} – ${endDate}` : startDate;
        const packageName = selectedBooking.itineraryData?.titles?.[0] || "N/A";
        const bookingId = selectedBooking.bookingId || selectedBooking._id.slice(-5);
        const name = selectedBooking.clientDetails.name;
        const paymentLink = `https://tour.rajasthantouring.in/userpayment/${selectedBooking._id}?tab=final`;
        let message = "";
        if (perc === 20) {
            // Initial confirmation/reminder for 20%
            message = `Rajasthan Trip – Booking & Payment Confirmation
Dear ${name},
"Khammaghani"
Thank you for your 20% advance payment. Your booking is confirmed!
Confirmation No.: ${bookingId}
Payment Schedule:
• 20% – Received
• 30% – At hotel confirmation & voucher issuance
• 50% – On arrival (Day 1) in cash
We’ve started processing your hotel bookings and will share the confirmation vouchers soon.
Trip Dates: ${tripDates}
Package: ${packageName}
If you need any help, feel free to contact us anytime.
Rajasthan Touring`;
        } else if (perc === 30) {
            // Second part payment request
            message = `Rajasthan Trip – 2nd Payment Request
Dear ${name},
"Khammaghani"
We hope you received the hotel confirmation vouchers shared with you.
As per the payment schedule, we kindly request you to please process the 30% second payment for your Rajasthan trip.
Confirmation No.: ${bookingId}
Payment Terms:
• 20% – Advance (Received)
• 30% – Due now (Hotel Confirmation Stage)
• 50% – On Arrival (Day 1, in cash)
Thank you for your cooperation. Please share the payment confirmation once completed.
Rajasthan Touring`;
            message += `\n\nPay Now: ${paymentLink}`;
        } else if (perc === 50) {
            // Final payment reminder (cash, no link)
            message = `Rajasthan Trip – Final Payment Reminder
Dear ${name},
"Khammaghani"
Your Rajasthan trip is just 2 days away! We hope you’re excited for the journey.
As per the payment schedule, we kindly remind you that the remaining 50% final payment is due in cash upon arrival. Our representative will meet you at your hotel to collect the payment.
Confirmation No.: ${bookingId}
Payment Status:
• 20% – Advance (Received)
• 30% – Voucher Payment (Received)
• 50% – Final Payment – Due in cash on arrival
Please have the final amount ready for a smooth check-in and travel experience. For any assistance, feel free to contact us anytime.
Rajasthan Touring`;
        } else {
            alert("Please use 20, 30, or 50 for the percentage.");
            return;
        }
        const rawPhone = selectedBooking.clientDetails?.phone || '';
        let phone = rawPhone.replace(/[^0-9]/g, '');
        if (phone) {
            if (phone.length === 10) {
                phone = `91${phone}`;
            } else if (phone.length === 11 && phone.startsWith('0')) {
                phone = `91${phone.slice(1)}`;
            }
            const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(waLink, '_blank');
            alert('WhatsApp message opened in new tab!');
        } else {
            alert('No phone number found for this client.');
        }
    };

    const [isSending, setIsSending] = useState(false);

    // Email Handler - Updated with templates
    const handleSendNextPaymentEmail = async () => {
        if (!nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0) {
            alert("Please enter a valid percentage");
            return;
        }
        const perc = parseFloat(nextPaymentPerc);
        const paymentDetails = getPaymentDetails(selectedBooking);
        const totalDays = selectedBooking.itineraryData?.days?.length || parseInt(selectedBooking.selectedItinerary?.duration) || 0;
        const startDate = parseDateForDisplay(selectedBooking.clientDetails.travelDate);
        const endDate = calculateEndDate(selectedBooking.clientDetails.travelDate, totalDays);
        const tripDates = totalDays > 0 ? `${startDate} – ${endDate}` : startDate;
        const packageName = selectedBooking.itineraryData?.titles?.[0] || "N/A";
        const bookingId = selectedBooking.bookingId || selectedBooking._id.slice(-5);
        const name = selectedBooking.clientDetails.name;
        const paymentLink = `https://tour.rajasthantouring.in/userpayment/${selectedBooking._id}?tab=final`;
        let emailBody = "";
        let subject = "";
        if (perc === 20) {
            // Initial confirmation
            subject = `Rajasthan Trip – Booking & Payment Confirmation`;
            emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Verdana; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
        .breakdown { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .breakdown-last { border-bottom: none; }
        .amount { font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .note { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rajasthan Trip – Booking & Payment Confirmation</h2>
        </div>
        <p>Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
        <p>Thank you for your 20% advance payment. Your booking is confirmed!</p>
        <div class="section">
            <h3>Confirmation Details</h3>
            <div class="breakdown"><span>Confirmation No.:</span><span>${bookingId}</span></div>
            <div class="breakdown"><span>Trip Dates:</span><span>${tripDates}</span></div>
            <div class="breakdown breakdown-last"><span>Package:</span><span>${packageName}</span></div>
        </div>
        <div class="section">
            <h3>Payment Schedule</h3>
            <ul style="margin:0; padding-left:20px;">
                <li>20% – Received</li>
                <li>30% – At hotel confirmation & voucher issuance</li>
                <li>50% – On arrival (Day 1) in cash</li>
            </ul>
        </div>
        <p>We’ve started processing your hotel bookings and will share the confirmation vouchers soon.</p>
        <p>If you need any help, feel free to contact us anytime.</p>
        <div class="footer"><p>Regards,<br>Rajasthan Touring</p></div>
    </div>
</body>
</html>`;
        } else if (perc === 30) {
            // Second part
            subject = `Rajasthan Trip – 2nd Payment Request`;
            emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Verdana; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
        .breakdown { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .breakdown-last { border-bottom: none; }
        .amount { font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .note { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rajasthan Trip – 2nd Payment Request</h2>
        </div>
        <p>Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
        <p>We hope you received the hotel confirmation vouchers shared with you.</p>
        <p>As per the payment schedule, we kindly request you to please process the 30% second payment for your Rajasthan trip.</p>
        <div class="section">
            <h3>Confirmation Details</h3>
            <div class="breakdown"><span>Confirmation No.:</span><span>${bookingId}</span></div>
            <div class="breakdown"><span>Trip Dates:</span><span>${tripDates}</span></div>
            <div class="breakdown breakdown-last"><span>Package:</span><span>${packageName}</span></div>
        </div>
        <div class="section">
            <h3>Payment Terms</h3>
            <ul style="margin:0; padding-left:20px;">
                <li>20% – Advance (Received)</li>
                <li>30% – Due now (Hotel Confirmation Stage)</li>
                <li>50% – On Arrival (Day 1, in cash)</li>
            </ul>
        </div>
        <p>Thank you for your cooperation. Please share the payment confirmation once completed.</p>
        <div style="text-align:center;">
            <a href="${paymentLink}" style="color:white;background:#007bff;padding:12px 20px;border-radius:5px;text-decoration:none;">Click Here to Pay</a>
        </div>
        <div class="footer"><p>Regards,<br>Rajasthan Touring</p></div>
    </div>
</body>
</html>`;
        } else if (perc === 50) {
            // Final
            subject = `Rajasthan Trip – Final Payment Reminder`;
            emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Verdana; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
        .breakdown { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
        .breakdown-last { border-bottom: none; }
        .amount { font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .note { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Rajasthan Trip – Final Payment Reminder</h2>
        </div>
        <p>Dear <strong>${name}</strong>,</p>
        <p style="margin-bottom: 20px; font-style: italic;">
  "Khammaghani" 
</p>
        <p>Your Rajasthan trip is just 2 days away! We hope you’re excited for the journey.</p>
        <p>As per the payment schedule, we kindly remind you that the remaining 50% final payment is due in cash upon arrival. Our representative will meet you at your hotel to collect the payment.</p>
        <div class="section">
            <h3>Confirmation Details</h3>
            <div class="breakdown"><span>Confirmation No.:</span><span>${bookingId}</span></div>
            <div class="breakdown"><span>Trip Dates:</span><span>${tripDates}</span></div>
            <div class="breakdown breakdown-last"><span>Package:</span><span>${packageName}</span></div>
        </div>
        <div class="section">
            <h3>Payment Status</h3>
            <ul style="margin:0; padding-left:20px;">
                <li>20% – Advance (Received)</li>
                <li>30% – Voucher Payment (Received)</li>
                <li>50% – Final Payment – Due in cash on arrival</li>
            </ul>
        </div>
        <p>Please have the final amount ready for a smooth check-in and travel experience. For any assistance, feel free to contact us anytime.</p>
        <div class="footer"><p>Regards,<br>Rajasthan Touring</p></div>
    </div>
</body>
</html>`;
        } else {
            alert("Please use 20, 30, or 50 for the percentage.");
            return;
        }
        const emailData = {
            to: selectedBooking.clientDetails.email,
            subject: subject,
            html: emailBody,
        };

        setIsSending(true);
        try {
            await axios.post(
                `https://apitour.rajasthantouring.in/api/bookings/${selectedBooking._id}/send-next-payment-email`,
                emailData
            );
            alert("Email sent successfully!");
        } catch (err) {
            console.error("Error sending email:", err);
            alert("Failed to send email. Please try again.");
        }
        setIsSending(false)
    };
    const closeModal = () => {
        setSelectedBooking(null);
        setPaymentData({
            amount: "",
            currency: "INR",
            method: "",
            transactionId: "",
            mobileNumber: "",
            gateway: "",
            status: "pending",
            receiptUrl: "",
            screenshot: "",
            index: null,
        });
        setShow(false)
        setNextOfferData({ type: true, value: 0 });
        setNextPaymentPerc('30');
    };
    const closeViewModal = () => {
        setViewModal(null);
    };
    const isEligibleForCompletion = (booking) => {
        const parseDate = (dateStr) => {
            // dateStr expected format: "DD-MM-YYYY" ya "D-M-YYYY"
            const parts = dateStr.split(/[-/]/);
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // month 0-based
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        };
        // Usage:
        const travelDate = parseDate(booking.clientDetails.travelDate);
        const balanceAmount = calculateBalanceAmount(booking);
        const today = new Date();
        const durationDays =
            (booking.itineraryData?.days?.length
                ? booking.itineraryData.days.length - 1
                : parseInt(booking.selectedItinerary?.duration)) ?? 0;
        const diffTime = today - travelDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log("Balance Amount:", balanceAmount);
        console.log("Booking Status:", booking.status);
        console.log("Today:", today);
        console.log("Travel Date:", travelDate);
        console.log("Duration Days:", durationDays);
        console.log("Diff Days:", diffDays);
        return balanceAmount === 0 && booking.status === "Booked" && diffDays >= durationDays;
    };
    const isEligibleForCompletionOffer = (booking) => {
        const balanceAmount = calculateBalanceAmount(booking);
        const today = new Date();
        const travelDate = new Date(booking.clientDetails.travelDate);
        const durationDays =
            (booking.itineraryData?.days?.length
                ? booking.itineraryData.days.length - 1
                : parseInt(booking.selectedItinerary?.duration)) ?? 0;
        const diffTime = today - travelDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return balanceAmount === 0 && booking.status === "completed" && diffDays >= durationDays;
    };
    const topScrollRef = useRef(null);
    const bottomScrollRef = useRef(null);
    const tableRef = useRef(null);
    useEffect(() => {
        if (tableRef.current && topScrollRef.current) {
            topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
        }
    }, []);
    const syncTopScroll = () => {
        bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    };
    const syncBottomScroll = () => {
        topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    };
    if (loading)
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading bookings...</p>
                </div>
            </div>
        )
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <p className="text-gray-600 text-lg">Please log in to view bookings.</p>
            </div>
        )
    }
    if (!bookings.length)
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-600 text-lg">No bookings found</p>
                </div>
            </div>
        )
    return (
        <div className="bg-white w-full mx-auto rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Bookings Management</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage and view all booking details ({filteredBookings.length} of {bookings.length} bookings)
                        </p>
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Clear Filters
                    </button>
                </div>
                <div className="max-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="Booked">Booked</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="created">Created</option>
                            <option value="accepted">Accepted</option>
                        </select>
                    </div>
                    {/* Duration Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                        <select
                            value={filters.duration}
                            onChange={(e) => handleFilterChange("duration", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Durations</option>
                            <option value="short">Short (1-3 days)</option>
                            <option value="medium">Medium (4-7 days)</option>
                            <option value="long">Long (8+ days)</option>
                        </select>
                    </div>
                    {/* Client Name Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                        <input
                            type="text"
                            value={filters.clientName}
                            onChange={(e) => handleFilterChange("clientName", e.target.value)}
                            placeholder="Search by name..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Vehicle Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle</label>
                        <input
                            type="text"
                            value={filters.vehicle}
                            onChange={(e) => handleFilterChange("vehicle", e.target.value)}
                            placeholder="Search vehicle..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Amount Range Filters */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount (₹)</label>
                        <input
                            type="number"
                            value={filters.minAmount}
                            onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                            placeholder="Min amount..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount (₹)</label>
                        <input
                            type="number"
                            value={filters.maxAmount}
                            onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                            placeholder="Max amount..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Itinerary Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Itinerary</label>
                        <input
                            type="text"
                            value={filters.itinerary}
                            onChange={(e) => handleFilterChange("itinerary", e.target.value)}
                            placeholder="Search destinations..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Mobile Number Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number</label>
                        <input
                            type="text"
                            value={filters.mobileNumber}
                            onChange={(e) => handleFilterChange("mobileNumber", e.target.value)}
                            placeholder="Search mobile..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Travel Date Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Travel Date</label>
                        <input
                            type="date"
                            value={filters.travelDate}
                            onChange={(e) => handleFilterChange("travelDate", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Tour Code Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tour Code</label>
                        <input
                            type="text"
                            value={filters.tourCode}
                            onChange={(e) => handleFilterChange("tourCode", e.target.value)}
                            placeholder="Search tour code..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Created By Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Created By</label>
                        <input
                            type="text"
                            value={filters.createdBy}
                            onChange={(e) => handleFilterChange("createdBy", e.target.value)}
                            placeholder="Search creator name..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
            <div className="relative w-full">
                <div
                    ref={topScrollRef}
                    onScroll={syncTopScroll}
                    className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                    style={{ height: 16 }}
                >
                    <div style={{ width: tableRef.current?.scrollWidth || "100%" }}></div>
                </div>
                <div
                    ref={bottomScrollRef}
                    onScroll={syncBottomScroll} className="overflow-x-auto ">
                    <div ref={tableRef} className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Id
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Client Details
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Created By
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Tour Code
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Itinerary
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Vehicle
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Update
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        approvel
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBookings.map((booking, index) => (
                                    <tr
                                        key={booking._id}
                                        className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                                    >
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {booking.bookingId}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 min-w-[200px]">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-gray-900">{booking.clientDetails?.name}</p>
                                                <p className="text-sm text-gray-600">{booking.clientDetails?.email}</p>
                                                <p className="text-sm text-gray-600">{booking.clientDetails?.phone}</p>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {booking.clientDetails?.travelers} travelers
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[150px]">
                                            <div className="text-sm text-gray-900">{booking.createby?.name || "N/A"}</div>
                                        </td>
                                        <td className="px-4 py-4 min-w-[120px]">
                                            <div className="text-sm text-gray-900">{booking.itineraryData?.tourcode}</div>
                                        </td>
                                        <td className="px-4 py-4 min-w-[150px]">
                                            <div className="text-sm text-gray-900">{booking.itineraryData?.titles?.join(", ")}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[150px]">
                                            <div className="text-sm text-gray-900">
                                                {booking.itineraryData?.vehicle ? (
                                                    <div className="flex flex-col gap-1 text-xs justify-center items-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {booking.itineraryData.vehicle.model}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No vehicle</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
                                            <div className="text-sm font-medium text-gray-900">
                                                {booking?.updateCount}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold
      ${booking?.approvel
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {booking?.approvel ? "Approved" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
                                            <div className="text-sm font-medium text-gray-900">
                                                {parseDateForDisplay(booking.clientDetails?.travelDate)}
                                            </div>
                                        </td>
                                        {/* Updated: Amount column to include balance */}
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                                            <div className="text-sm font-medium text-gray-900">₹{booking.totalAmount?.toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">
                                                Balance: ₹{calculateBalanceAmount(booking).toLocaleString()}
                                            </div>
                                            {booking.payments?.length > 0 ? (() => {
                                                const successPayments = booking.payments.filter(p => p.status === "success");
                                                return successPayments.length > 0 ? (
                                                    <div className="space-y-1 mt-0.5">
                                                        {successPayments.slice(0, 2).map((payment, pIndex) => (
                                                            <div key={pIndex} className="text-xs bg-green-100 rounded px-2 py-1">
                                                                ₹{payment.amount} ({payment.status})
                                                            </div>
                                                        ))}
                                                        {successPayments.length > 2 && (
                                                            <div className="text-xs text-gray-500">
                                                                +{successPayments.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 bg-red-100 px-1.5 py-1 rounded-2xl">No payments</span>
                                                );
                                            })() : (
                                                <span className="text-xs text-gray-500 bg-red-100 px-1.5 py-1 rounded-2xl">No payments</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap min-w-[200px]">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => navigate(`/admin/${booking.theme.link}/${booking._id}`)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-4 h-4 mr-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (booking.status === "completed") {
                                                            alert("Booking is already completed. Cannot edit.");
                                                            return;
                                                        }
                                                        navigate(`/update/${booking._id}`);
                                                    }}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setTriggerDownload(true);
                                                        toast.success("Pdf Download 15 -20 sec...")
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                </button>
                                                <button
                                                    onClick={() => setViewModal(booking)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                                                >
                                                    <Clock className="w-4 h-4 mr-1" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(booking)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                                                >
                                                    <Download className="w-4 h-4 mr-1" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking)
                                                        setShow(true)
                                                    }}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-150"
                                                >
                                                    <Wallet className="w-4 h-4 mr-1" />
                                                </button>
                                                <button
                                                    onClick={() => { handleWhatsApp(booking) }}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                                                    title="Send WhatsApp Message"
                                                >
                                                    <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4 mr-1" />
                                                </button>
                                                <button
                                                    onClick={() => setSheetBookingId(booking._id)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                                                    title="Transport Sheet"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                                                </button>
                                                <button
                                                    onClick={() => cancell(booking._id)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                                                    title="Cancel Booking"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />

                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="hidden">
                {selectedBooking?.theme?.link?.includes("viewData5") ? (
                    <Viewdata6
                        id={selectedBooking._id}
                        autoDownload={triggerDownload}
                        onDownloadComplete={() => setTriggerDownload(false)}
                    />
                ) : selectedBooking?.theme?.link?.includes("viewData4") ? (
                    <Viewdata4
                        id={selectedBooking._id}
                        autoDownload={triggerDownload}
                        onDownloadComplete={() => setTriggerDownload(false)}
                    />
                ) : selectedBooking?.theme?.link?.includes("viewData3") ? (
                    <Viewdata3admin
                        id={selectedBooking._id}
                        autoDownload={triggerDownload}
                        onDownloadComplete={() => setTriggerDownload(false)}
                    />
                ) : selectedBooking?.theme?.link?.includes("viewData2") ? (
                    <Viewdata5Redesigned
                        id={selectedBooking._id}
                        autoDownload={triggerDownload}
                        onDownloadComplete={() => setTriggerDownload(false)}
                    />
                ) : (
                    <ViewDataadmin
                        id={selectedBooking?._id}
                        autoDownload={triggerDownload}
                        onDownloadComplete={() => setTriggerDownload(false)}
                    />
                )}
            </div>
            {selectedBooking && show && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Manage Payments</h2>
                                <p className="text-sm text-gray-500">
                                    Booking #{selectedBooking.bookingId || selectedBooking._id.slice(-5)} - {selectedBooking.clientDetails.name}
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedBooking.status === "completed" ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                                    <AlertCircle className="inline-block h-6 w-6 text-yellow-600 mr-2" />
                                    <span className="text-yellow-800 font-medium">
                                        This booking is completed and cannot be modified except for Next Offer.
                                    </span>
                                </div>
                            ) : null}
                            <div className="">
                                {/* <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={paymentData.amount}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter amount"
                                            required
                                            disabled={selectedBooking.status === "completed" || paymentData.index !== null}
                                            readOnly={paymentData.index !== null}
                                        />
                                        {paymentData.index !== null && (
                                            <p className="text-xs text-gray-500 mt-1">Amount cannot be edited for existing payments</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                        <input
                                            type="text"
                                            name="method"
                                            value={paymentData.method}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Credit Card, UPI, Bank Transfer"
                                            disabled={selectedBooking.status === "completed"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number (UPI)</label>
                                        <input
                                            type="tel"
                                            name="mobileNumber"
                                            value={paymentData.mobileNumber}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ''); // Only digits
                                                if (value.length <= 10) {
                                                    setPaymentData({ ...paymentData, mobileNumber: value });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter 10-digit mobile number"
                                            maxLength={10}
                                            disabled={selectedBooking.status === "completed"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                                        <input
                                            type="text"
                                            name="transactionId"
                                            value={paymentData.transactionId}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Transaction reference number"
                                            disabled={selectedBooking.status === "completed"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gateway</label>
                                        <input
                                            type="text"
                                            name="gateway"
                                            value={paymentData.gateway}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Razorpay, Stripe, PayPal"
                                            disabled={selectedBooking.status === "completed"}
                                        />
                                    </div>
                                </div> */}
                                {/* <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            name="status"
                                            value={paymentData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={selectedBooking.status === "completed"}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="success">Success</option>
                                            <option value="failed">Failed</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL</label>
                                        <input
                                            type="url"
                                            name="receiptUrl"
                                            value={paymentData.receiptUrl}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://example.com/receipt"
                                            disabled={selectedBooking.status === "completed"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <Upload size={16} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600">Choose file</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    name="screenshot"
                                                    accept="image/jpeg,image/png"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    disabled={selectedBooking.status === "completed"}
                                                />
                                            </label>
                                            {paymentData.screenshot && (
                                                <img
                                                    src={paymentData.screenshot || "/placeholder.svg"}
                                                    alt="Screenshot Preview"
                                                    className="w-16 h-16 object-cover rounded-lg border"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            onClick={paymentData.index !== null ? handleUpdatePayment : handleAddPayment}
                                            disabled={paymentLoading || selectedBooking.status === "completed"}
                                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                                        >
                                            {paymentLoading
                                                ? paymentData.index !== null
                                                    ? "Updating..."
                                                    : "Processing..."
                                                : paymentData.index !== null
                                                    ? "Update Payment"
                                                    : "Add Payment"}
                                        </button>
                                    </div>
                                </div> */}
                            </div>
                            {isEligibleForCompletionOffer(selectedBooking) && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Offer</h3>
                                    {selectedBooking.nextOffer.used === "used" ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                            <AlertCircle className="inline-block h-6 w-6 text-red-600 mr-2" />
                                            <span className="text-red-800 font-medium">
                                                This offer has been used and cannot be modified.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Offer Active</label>
                                                <input
                                                    type="checkbox"
                                                    name="type"
                                                    checked={nextOfferData.type}
                                                    onChange={handleNextOfferChange}
                                                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    disabled={selectedBooking.nextOffer.used === "used" || selectedBooking.nextOffer.value > 0}
                                                />
                                                <span className="ml-2 text-sm text-gray-600">
                                                    {nextOfferData.type ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Offer Value (%)</label>
                                                <input
                                                    type="number"
                                                    name="value"
                                                    value={nextOfferData.value}
                                                    onChange={handleNextOfferChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter offer value"
                                                    min="0"
                                                    disabled={selectedBooking.nextOffer.used === "used" || selectedBooking.nextOffer.value > 0}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4 flex gap-4">
                                        <button
                                            onClick={handleUpdateNextOffer}
                                            disabled={offerLoading || selectedBooking.nextOffer.used === "used" || selectedBooking.nextOffer.value > 0}
                                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                                        >
                                            {offerLoading ? "Processing..." : "Update Next Offer"}
                                        </button>
                                        {selectedBooking.nextOffer.used !== "used" && (
                                            <button
                                                onClick={handleMarkOfferAsUsed}
                                                disabled={offerUsedLoading || selectedBooking.nextOffer.value === 0}
                                                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
                                            >
                                                {offerUsedLoading ? "Processing..." : "Mark Offer as Used"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {isEligibleForCompletion(selectedBooking) && (
                                <div className="mb-6">
                                    <button
                                        onClick={handleMarkAsCompleted}
                                        disabled={completeLoading}
                                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                                    >
                                        {completeLoading ? "Processing..." : "Mark Booking as Completed"}
                                    </button>
                                </div>
                            )}
                            <div className="mb-6 border-t pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Next Payment Reminder</h3>
                                <div className="space-y-4">
                                    {/* Payment Status Card */}
                                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-4">
                                        <div className="grid grid-cols-4 gap-4">
                                            {/* Total Amount */}
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase">Total Amount</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    ₹{getPaymentDetails(selectedBooking).totalAmount.toLocaleString()}
                                                </p>
                                            </div>
                                            {/* Already Paid */}
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase">Already Paid</p>
                                                <p className="text-xl font-bold text-green-700">
                                                    ₹{getPaymentDetails(selectedBooking).totalPaid.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-green-600 font-medium">
                                                    ({getPaymentDetails(selectedBooking).paidPercentage}%)
                                                </p>
                                            </div>
                                            {/* Balance Remaining */}
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase">Balance Remaining</p>
                                                <p className="text-xl font-bold text-orange-700">
                                                    ₹{getPaymentDetails(selectedBooking).balance.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-orange-600 font-medium">
                                                    ({(100 - parseFloat(getPaymentDetails(selectedBooking).paidPercentage)).toFixed(2)}%)
                                                </p>
                                            </div>
                                            {/* Payment Status */}
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>

                                                {/* FULLY PAID */}
                                                {payments.isFullyPaid ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                        <span className="text-sm font-semibold text-green-700">Fully Paid</span>
                                                    </div>
                                                ) : payments.hasPayment ? (
                                                    // PARTIAL PAID
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-5 h-5 text-yellow-600" />
                                                        <span className="text-sm font-semibold text-yellow-700">Partial Paid</span>
                                                    </div>
                                                ) : (
                                                    // UNPAID
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                                        <span className="text-sm font-semibold text-red-700">Unpaid</span>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                    {/* Payment History (अगर कोई payment किया है तो दिखाएंगे) */}
                                    {getPaymentDetails(selectedBooking).hasPayment && selectedBooking.payments?.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm font-medium text-blue-900 mb-2">Previous Payments:</p>
                                            <div className="space-y-1">
                                                {selectedBooking.payments
                                                    .filter(p => p.status === "success")
                                                    .map((payment, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs">
                                                            <span className="text-blue-700">Payment {idx + 1}:</span>
                                                            <span className="font-semibold text-blue-900">
                                                                ₹{Number(payment.amount).toLocaleString()} (${((payment.amount / selectedBooking.totalAmount) * 100).toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Custom Percentage Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Custom Percentage (20/30/50)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Enter percentage"
                                                value={nextPaymentPerc}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                                        setNextPaymentPerc(val);
                                                    }
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                    {/* Final Amount Preview - UPDATED */}
                                    {nextPaymentPerc && parseFloat(nextPaymentPerc) > 0 && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                                            <div className="space-y-3">
                                                {/* Calculation Breakdown */}
                                                <div className="space-y-2 pb-3 border-b border-green-200">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600">Total Booking Amount:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            ₹{getPaymentDetails(selectedBooking).totalAmount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600">Current Payment (${nextPaymentPerc}% of Total):</span>
                                                        <span className="font-semibold text-gray-900">
                                                            ₹{calculateExpectedAmount(selectedBooking, nextPaymentPerc)}
                                                        </span>
                                                    </div>
                                                    {/* Show shortage if exists */}
                                                    {(() => {
                                                        const expectedOnly = parseFloat(calculateExpectedAmount(selectedBooking, nextPaymentPerc));
                                                        const totalDue = parseFloat(calculateNextPaymentAmount(selectedBooking, nextPaymentPerc));
                                                        const shortage = (totalDue - expectedOnly).toFixed(2);
                                                        return parseFloat(shortage) > 0 ? (
                                                            <div className="flex justify-between bg-red-50 -mx-2 px-2 py-1 rounded">
                                                                <span className="text-sm text-red-700 font-medium">+ Previous Shortage:</span>
                                                                <span className="font-semibold text-red-700">
                                                                    ₹{parseFloat(shortage).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                {/* Final Amount */}
                                                <div className="flex justify-between items-center pt-2 bg-green-100 -mx-2 px-2 py-3 rounded">
                                                    <span className="text-lg font-bold text-gray-900">
                                                        Total Amount to Request:
                                                    </span>
                                                    <span className="text-3xl font-bold text-green-700">
                                                        ₹{calculateNextPaymentAmount(selectedBooking, nextPaymentPerc)}
                                                    </span>
                                                </div>
                                                {/* Total after this payment */}
                                                {/* <div className="flex justify-between pt-2 border-t border-green-200">
                                                    <span className="text-sm font-medium text-gray-600">Total Paid After This:</span>
                                                    <span className="text-sm font-bold text-green-700">
                                                        ₹{(
                                                            getPaymentDetails(selectedBooking).totalPaid +
                                                            parseFloat(calculateNextPaymentAmount(selectedBooking, nextPaymentPerc))
                                                        ).toLocaleString()} (
                                                        {(
                                                            ((getPaymentDetails(selectedBooking).totalPaid +
                                                                parseFloat(calculateNextPaymentAmount(selectedBooking, nextPaymentPerc))) /
                                                                getPaymentDetails(selectedBooking).totalAmount) * 100
                                                        ).toFixed(1)}%)
                                                    </span>
                                                </div> */}
                                                {parseFloat(nextPaymentPerc) === 50 && selectedBooking.addons?.length > 0 && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                                        <h3 className="text-sm font-medium text-blue-900 mb-2">🎁 Add-ons</h3>
                                                        {selectedBooking.addons.map((a, i) => (
                                                            <div key={i} className="flex justify-between text-xs py-1 border-b border-blue-200 last:border-b-0">
                                                                <span className="text-blue-700">{a.title}</span>
                                                                <span className="font-semibold text-blue-900">₹{a.value.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between text-sm font-bold text-blue-900 mt-2 pt-2 border-t border-blue-300">
                                                            <span>Total Add-ons:</span>
                                                            <span>₹{
                                                                selectedBooking.addons.reduce((sum, a) => sum + (a.value || 0), 0
                                                                ).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Remaining balance */}
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
                                                    <span className="text-sm font-bold text-orange-600">
                                                        ₹{(
                                                            getPaymentDetails(selectedBooking).balance -
                                                            parseFloat(calculateNextPaymentAmount(selectedBooking, nextPaymentPerc))
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Send Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSendNextPaymentWhatsApp}
                                            disabled={!nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0}
                                            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faWhatsapp} />
                                            Send WhatsApp
                                        </button>
                                        <button
                                            onClick={handleSendNextPaymentEmail}
                                            disabled={isSending || !nextPaymentPerc || parseFloat(nextPaymentPerc) <= 0}
                                            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 
               transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed
               flex items-center justify-center gap-2"
                                        >
                                            {isSending ? (
                                                <>
                                                    <svg
                                                        className="animate-spin h-5 w-5 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                                                        ></path>
                                                    </svg>
                                                    Sending…
                                                </>
                                            ) : (
                                                "Send Email"
                                            )}
                                        </button>

                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedBooking.payments?.map((payment, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payment.amount}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{payment.method || "N/A"}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{payment.mobileNumber || "-"}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{payment.transactionId || "N/A"}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={payment.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {payment.receiptUrl ? (
                                                            <a
                                                                href={payment.receiptUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-700 text-sm"
                                                            >
                                                                View Receipt
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {payment.screenshot ? (
                                                            <img
                                                                src={payment.screenshot || "/placeholder.svg"}
                                                                alt="Payment screenshot"
                                                                className="w-12 h-12 object-cover rounded cursor-pointer"
                                                                onClick={() => setPreviewImage(payment.screenshot)}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {/* <button
                                                                onClick={() => handleEditPayment(payment, index)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                disabled={selectedBooking.status === "completed"}
                                                            >
                                                                <Edit size={12} />
                                                            </button> */}
                                                            <button
                                                                onClick={() => handleSendWhatsAppNotification(selectedBooking, payment, "updated")}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                title="Send WhatsApp Notification"
                                                            >
                                                                <FontAwesomeIcon icon={faWhatsapp} size="lg" className="text-green-600" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {viewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                                <p className="text-sm text-gray-500">#{viewModal._id.slice(-5)}</p>
                            </div>
                            <button onClick={closeViewModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Booking ID</span>
                                                <span className="text-sm font-medium text-gray-900">#{viewModal.bookingId || viewModal._id.slice(-5)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Itinerary Title</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {viewModal.itineraryData?.titles?.[0] || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Travel Date</span>
                                                <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.travelDate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Status</span>
                                                <StatusBadge status={viewModal.status} />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Next Offer</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {viewModal.nextOffer
                                                        ? `${viewModal.nextOffer.type ? "Active" : "Inactive"}, Value: %${viewModal.nextOffer.value}${viewModal.nextOffer.used === "used" ? " (Used)" : ""
                                                        }`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Name</span>
                                                <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Email</span>
                                                <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Phone</span>
                                                <span className="text-sm font-medium text-gray-900">{viewModal.clientDetails.phone || viewModal.clientDetails.mobile}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Total Amount</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    ₹{viewModal.totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Balance Amount</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    ₹{calculateBalanceAmount(viewModal).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-500">Payment Status</span>
                                                <PaymentStatusBadge booking={viewModal} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                                {viewModal.payments?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border border-gray-200 rounded-lg">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screenshot</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {viewModal.payments.map((payment, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payment.amount}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{payment.method || "N/A"}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{payment.mobileNumber || "-"}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{payment.transactionId || "N/A"}</td>
                                                        <td className="px-4 py-3">
                                                            <StatusBadge status={payment.status} />
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {payment.receiptUrl ? (
                                                                <a
                                                                    href={payment.receiptUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                                                >
                                                                    View Receipt
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {payment.screenshot ? (
                                                                <img
                                                                    src={payment.screenshot || "/placeholder.svg"}
                                                                    alt="Payment screenshot"
                                                                    className="w-12 h-12 object-cover rounded cursor-pointer"
                                                                    onClick={() => setPreviewImage(payment.screenshot)}
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">N/A</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                        <p>No payments recorded yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {previewImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl w-full">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>
                        <img
                            src={previewImage || "/placeholder.svg"}
                            alt="Payment screenshot preview"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
            {sheetBookingId && (
                <BookingSheetViewer
                    bookingId={sheetBookingId}
                    onClose={() => setSheetBookingId(null)}
                />
            )}
        </div>
    )
}
const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: {
            color: "bg-blue-50 text-blue-700 border border-blue-200",
            icon: Clock,
            dot: "bg-blue-400",
        },
        Booked: {
            color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            icon: Check,
            dot: "bg-emerald-400",
        },
        completed: {
            color: "bg-blue-50 text-blue-700 border border-blue-200",
            icon: CheckCircle,
            dot: "bg-blue-400",
        },
        success: {
            color: "bg-green-50 text-green-700 border border-green-200",
            icon: FaRupeeSign,
            dot: "bg-green-500",
        },
        paymentSuccess: {
            color: "bg-green-50 text-green-700 border border-green-200",
            icon: FaRupeeSign,
            dot: "bg-green-500",
        },
        failed: {
            color: "bg-red-50 text-red-700 border border-red-200",
            icon: CheckCircle,
            dot: "bg-red-500",
        },
        created: {
            color: "bg-purple-50 text-purple-700 border border-purple-200",
            icon: Clock,
            dot: "bg-purple-400",
        },
        accepted: {
            color: "bg-orange-50 text-orange-700 border border-orange-200",
            icon: Check,
            dot: "bg-orange-400",
        },
    };
    const normalizedStatus = status?.toLowerCase?.() || "pending";
    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;
    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}
        >
            <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
            <span className="capitalize">{status}</span>
        </div>
    );
};
const PaymentStatusBadge = ({ booking }) => {
    const calculateBalanceAmount = (booking) => {
        const paidAmount =
            booking.payments?.filter((p) => p.status === "success").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
        return booking.totalAmount - paidAmount;
    };
    const balanceAmount = calculateBalanceAmount(booking);
    let status, color, icon, dot;
    if (balanceAmount === 0) {
        status = "Fully Paid";
        color = "bg-blue-50 text-blue-700 border border-blue-200";
        icon = Check;
        dot = "bg-blue-400";
    } else if (balanceAmount === booking.totalAmount) {
        status = "Unpaid";
        color = "bg-red-50 text-red-700 border border-red-200";
        icon = XCircle;
        dot = "bg-red-400";
    } else {
        status = "Partial";
        color = "bg-orange-50 text-orange-700 border border-orange-200";
        icon = AlertCircle;
        dot = "bg-orange-400";
    }
    const Icon = icon;
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
            <div className={`w-2 h-2 rounded-full ${dot}`}></div>
            <Icon size={12} />
            <span>{status}</span>
        </div>
    );
};
export default BookingsTable
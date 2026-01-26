"use client"

import { useState, useEffect, useContext } from "react"
import jsPDF from "jspdf"
import { autoTable } from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext


export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("bookings")
    const { user } = useContext(AuthContext)
    const [pendingInquiries, setPendingInquiries] = useState([])
    const [filteredPendingInquiries, setFilteredPendingInquiries] = useState([])
    const [pendingInquiriesLoading, setPendingInquiriesLoading] = useState(true)
    const [pendingInquiriesSearch, setPendingInquiriesSearch] = useState("")
    const [pendingInquiriesStatus, setPendingInquiriesStatus] = useState("all")

    const [bookings, setBookings] = useState([])
    const [filteredBookings, setFilteredBookings] = useState([])
    const [bookingsLoading, setBookingsLoading] = useState(true)
    const [bookingsSearch, setBookingsSearch] = useState("")
    const [bookingsStatus, setBookingsStatus] = useState("all")

    const [payments, setPayments] = useState([])
    const [filteredPayments, setFilteredPayments] = useState([])
    const [paymentsLoading, setPaymentsLoading] = useState(true)
    const [paymentsSearch, setPaymentsSearch] = useState("")
    const [paymentsStatus, setPaymentsStatus] = useState("all")

    const [inquiries, setInquiries] = useState([])
    const [filteredInquiries, setFilteredInquiries] = useState([])
    const [inquiriesLoading, setInquiriesLoading] = useState(true)
    const [inquiriesSearch, setInquiriesSearch] = useState("")
    const [inquiriesStatus, setInquiriesStatus] = useState("all")

    const [emails, setEmails] = useState([])
    const [filteredEmails, setFilteredEmails] = useState([])
    const [emailsLoading, setEmailsLoading] = useState(true)
    const [emailsSearch, setEmailsSearch] = useState("")
    const [emailsStatus, setEmailsStatus] = useState("all")

    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchBookings()
        fetchPayments()
        fetchInquiries()
        fetchPendingInquiries()
        fetchEmails()
    }, [])

    useEffect(() => {
        applyBookingsFilters()
    }, [bookings, bookingsSearch, bookingsStatus])

    useEffect(() => {
        applyPaymentsFilters()
    }, [payments, paymentsSearch, paymentsStatus])

    useEffect(() => {
        applyInquiriesFilters()
    }, [inquiries, inquiriesSearch, inquiriesStatus])

    useEffect(() => {
        applyPendingInquiriesFilters()
    }, [pendingInquiries, pendingInquiriesSearch, pendingInquiriesStatus])

    useEffect(() => {
        applyEmailsFilters()
    }, [emails, emailsSearch, emailsStatus])

    const fetchBookings = async () => {
        try {
            setBookingsLoading(true)
            const response = await fetch("https://apitour.rajasthantouring.in/api/bookings")
            const data = await response.json()
            setBookings(data || [])
        } catch (error) {
            console.error("Error fetching bookings:", error)
        } finally {
            setBookingsLoading(false)
        }
    }

    const fetchPayments = async () => {
        try {
            setPaymentsLoading(true)
            const response = await fetch("https://apitour.rajasthantouring.in/api/bookings")
            const data = await response.json()
            setPayments(data || [])
        } catch (error) {
            console.error("Error fetching payments:", error)
        } finally {
            setPaymentsLoading(false)
        }
    }

    const fetchInquiries = async () => {
        try {
            setInquiriesLoading(true)
            const response = await fetch("https://apitour.rajasthantouring.in/api/inquiries", {
                credentials: "include",
            })
            const data = await response.json()
            setInquiries(data.data || [])
        } catch (error) {
            console.error("Error fetching inquiries:", error)
        } finally {
            setInquiriesLoading(false)
        }
    }

    const fetchPendingInquiries = async () => {
        try {
            setPendingInquiriesLoading(true)

            const query = user && user.role !== 'admin'
                ? `createdBy=${user._id}&role=${user?.role}`
                : `role=${user?.role}`;
            const response = await fetch(`https://apitour.rajasthantouring.in/api/pending?${query}`, {
             credentials: "include"
            })
            const data = await response.json()
            console.log(data);
            console.log("data");

            setPendingInquiries(data || [])
        } catch (error) {
            console.error("Error fetching pending inquiries:", error)
        } finally {
            setPendingInquiriesLoading(false)
        }
    }

    const fetchEmails = async () => {
        try {
            setEmailsLoading(true)
            const response = await fetch("https://apitour.rajasthantouring.in/api/emails")
            const data = await response.json()
            setEmails(data.emails || [])
        } catch (error) {
            console.error("Error fetching emails:", error)
        } finally {
            setEmailsLoading(false)
        }
    }

    const applyBookingsFilters = () => {
        let filtered = bookings || []

        if (bookingsSearch) {
            const search = bookingsSearch.trim()?.toLowerCase()
            filtered = filtered.filter(
                (b) =>
                    b.clientDetails?.name?.trim()?.toLowerCase().includes(search) ||
                    b.clientDetails?.email?.trim()?.toLowerCase().includes(search) ||
                    b.bookingId?.trim()?.toLowerCase().includes(search),
            )
        }

        if (bookingsStatus && bookingsStatus !== "all") {
            const status = bookingsStatus.trim()?.toLowerCase()
            filtered = filtered.filter((b) => b.status?.trim()?.toLowerCase() === status)
        }

        setFilteredBookings(filtered)
    }

    const applyPaymentsFilters = () => {
        let filtered = payments || [];

        // SEARCH FILTER
        if (paymentsSearch.trim() !== "") {
            const search = paymentsSearch.trim()?.toLowerCase();
            filtered = filtered.filter((p) =>
                p.clientDetails?.name?.toLowerCase().includes(search) ||
                p.clientDetails?.email?.toLowerCase().includes(search) ||
                p.bookingId?.toLowerCase().includes(search)
            );
        }

        // STATUS FILTER (filter child payments inside array)
        if (paymentsStatus !== "all") {
            const status = paymentsStatus?.toLowerCase();

            filtered = filtered
                .map((p) => ({
                    ...p,
                    payments: p.payments.filter(
                        (pay) =>
                            String(pay.status || "")
                                .trim()
                                ?.toLowerCase() === status
                    ),
                }))
                .filter((p) => p.payments.length > 0); // keep only bookings with matching payments
        }

        setFilteredPayments(filtered);
    };


    const applyInquiriesFilters = () => {
        let filtered = inquiries

        if (inquiriesSearch) {
            filtered = filtered.filter(
                (i) =>
                    i.name?.toLowerCase().includes(inquiriesSearch?.toLowerCase()) ||
                    i.email?.toLowerCase().includes(inquiriesSearch?.toLowerCase()) ||
                    i.packageTitle?.toLowerCase().includes(inquiriesSearch?.toLowerCase()),
            )
        }

        if (inquiriesStatus !== "all") {
            filtered = filtered.filter((i) => i.status === inquiriesStatus)
        }

        setFilteredInquiries(filtered)
    }

    const applyPendingInquiriesFilters = () => {
        let filtered = pendingInquiries

        if (pendingInquiriesSearch) {
            filtered = filtered.filter(
                (p) =>
                    p.clientDetails?.name?.toLowerCase().includes(pendingInquiriesSearch?.toLowerCase()) ||
                    p.clientDetails?.email?.toLowerCase().includes(pendingInquiriesSearch?.toLowerCase()) ||
                    p.bookingId?.toLowerCase().includes(pendingInquiriesSearch?.toLowerCase()),
            )
        }

        if (pendingInquiriesStatus !== "all") {
            filtered = filtered.filter((p) => p.status === pendingInquiriesStatus)
        }

        setFilteredPendingInquiries(filtered)
    }

    const applyEmailsFilters = () => {
        let filtered = emails

        if (emailsSearch) {
            filtered = filtered.filter(
                (e) =>
                    e.clientDetails.name?.toLowerCase().includes(emailsSearch?.toLowerCase()) ||
                    e.clientDetails.email?.toLowerCase().includes(emailsSearch?.toLowerCase()) ||
                    e.bookingId?.toLowerCase().includes(emailsSearch?.toLowerCase()),
            )
        }

        if (emailsStatus !== "all") {
            if (emailsStatus === "seen") {
                filtered = filtered.filter((e) => e.isSeen)
            } else if (emailsStatus === "unseen") {
                filtered = filtered.filter((e) => !e.isSeen)
            } else {
                filtered = filtered.filter((e) => e.status === emailsStatus)
            }
        }

        setFilteredEmails(filtered)
    }

    const getTotalAmount = (inquiry) => {
        if (inquiry?.selectedCategory && inquiry.totalAmount?.[inquiry.selectedCategory]) {
            return inquiry.totalAmount[inquiry.selectedCategory]
        }
        if (typeof inquiry.totalAmount === "number") {
            return inquiry.totalAmount
        }
        if (typeof inquiry.totalAmount === "object") {
            const amounts = Object.values(inquiry.totalAmount || {})
            return amounts.length > 0 ? amounts[0] : 0
        }
        return 0
    }

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            alert("No data to export")
            return
        }

        const headers = Object.keys(data[0])
        const csvContent = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header]
                        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`
                        }
                        return value
                    })
                    .join(","),
            ),
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    jsPDF.autoTable = autoTable;

    const exportToPDF = (headers, data, filename) => {
        try {
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;

            // Add title
            doc.setFontSize(16);
            doc.text(filename.replace(/-/g, " ").toUpperCase(), margin, margin + 5);

            // Add date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(
                `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
                margin,
                margin + 12,
            );

            // Check if autoTable is available and use it
            if (typeof autoTable === 'function') {
                // Use global autoTable function
                autoTable(doc, {
                    head: [headers],
                    body: data,
                    startY: margin + 18,
                    margin: margin,
                    theme: "grid",
                    styles: {
                        fontSize: 10,
                        cellPadding: 3,
                    },
                    headStyles: {
                        fillColor: [41, 128, 185],
                        textColor: 255,
                        fontStyle: "bold",
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245],
                    },
                });
            } else if (typeof doc.autoTable === 'function') {
                // Use doc.autoTable method
                doc.autoTable({
                    head: [headers],
                    body: data,
                    startY: margin + 18,
                    margin: margin,
                    theme: "grid",
                    styles: {
                        fontSize: 10,
                        cellPadding: 3,
                    },
                    headStyles: {
                        fillColor: [41, 128, 185],
                        textColor: 255,
                        fontStyle: "bold",
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245],
                    },
                });
            } else {
                console.error('AutoTable function not available');
                return;
            }

            // Add footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount} | Total Records: ${data.length}`, margin, pageHeight - margin + 5);
            }

            // Save PDF
            doc.save(`${filename}-${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    }

    const handleBookingsExportCSV = async () => {
        setExporting(true)
        try {
            const csvData = filteredBookings.map((b) => ({
                "Booking ID": b.bookingId,
                "Client Name": b.clientDetails.name,
                Email: b.clientDetails.email,
                Phone: b.clientDetails.phone,
                "Tour Code": b.itineraryData.tourcode,
                Package: b.itineraryData.titles[0] || "N/A",
                "Travel Date": b.clientDetails.travelDate,
                "Total Amount": b.totalAmount,
                Status: b.status,
                Created: new Date(b.createdAt).toLocaleDateString(),
            }))
            exportToCSV(csvData, "bookings-report")
        } finally {
            setExporting(false)
        }
    }

    const handleBookingsExportPDF = async () => {
        setExporting(true)
        try {
            const pdfData = filteredBookings.map((b) => [
                b.bookingId,
                b.clientDetails.name,
                b.clientDetails.email,
                b.itineraryData.titles[0] || "N/A",
                b.totalAmount,
                b.status,
            ])
            exportToPDF(["Booking ID", "Client Name", "Email", "Package", "Amount", "Status"], pdfData, "bookings-report")
        } finally {
            setExporting(false)
        }
    }

    const handlePaymentsExportCSV = async () => {
        setExporting(true)
        try {
            const csvData = []
            filteredPayments.forEach((p) => {
                p.payments.forEach((payment) => {
                    const date = new Date(payment.paymentDate);
                    const formattedDate = date.toLocaleDateString('en-GB'); // 'en-GB' uses DD/MM/YYYY
                    csvData.push({
                        "Booking ID": p.bookingId,
                        "Client Name": p.clientDetails.name,
                        Email: p.clientDetails.email,
                        Amount: payment.amount,
                        Status: payment.status,
                        Method: payment.method || "N/A",
                        Gateway: payment.gateway || "N/A",
                        "Transaction ID": payment.transactionId || "N/A",
                        Date: formattedDate,
                    })
                })
            })
            exportToCSV(csvData, "payments-report")
        } finally {
            setExporting(false)
        }
    }

    const handlePaymentsExportPDF = async () => {
        setExporting(true)
        try {
            const pdfData = []
            filteredPayments.forEach((p) => {
                p.payments.forEach((payment) => {
                    const date = new Date(payment.paymentDate);
                    const formattedDate = date.toLocaleDateString('en-GB'); // 'en-GB' uses DD/MM/YYYY
                    pdfData.push([
                        p.bookingId,
                        p.clientDetails.name,
                        payment.amount,
                        payment.status,
                        payment.method || "N/A",
                        formattedDate,
                    ])
                })
            })
            exportToPDF(["Booking ID", "Client Name", "Amount", "Status", "Method", "Date"], pdfData, "payments-report")
        } finally {
            setExporting(false)
        }
    }

    const handleInquiriesExportCSV = async () => {
        setExporting(true)
        try {
            const csvData = filteredInquiries.map((i) => ({
                Name: i.name,
                Email: i.email,
                Mobile: i.mobile,
                Package: i.packageTitle,
                Message: i.message,
                Status: i.status,
                Created: new Date(i.createdAt).toLocaleDateString(),
            }))
            exportToCSV(csvData, "inquiries-report")
        } finally {
            setExporting(false)
        }
    }

    const handleInquiriesExportPDF = async () => {
        setExporting(true)
        try {
            const pdfData = filteredInquiries.map((i) => [
                i.name,
                i.email,
                i.mobile,
                i.packageTitle,
                i.status,
                new Date(i.createdAt).toLocaleDateString(),
            ])
            exportToPDF(["Name", "Email", "Mobile", "Package", "Status", "Created"], pdfData, "inquiries-report")
        } finally {
            setExporting(false)
        }
    }

    const handlePendingInquiriesExportCSV = async () => {
        setExporting(true)
        try {
            const csvData = filteredPendingInquiries.map((p) => ({
                "Booking ID": p.bookingId,
                "Client Name": p.clientDetails?.name || "N/A",
                Email: p.clientDetails?.email || "N/A",
                Phone: p.clientDetails?.phone || "N/A",
                "Travel Date": p.clientDetails?.travelDate || "N/A",
                Package: p.itineraryData?.titles?.[0] || "N/A",
                "Total Amount": getTotalAmount(p),
                Status: p.status,
                Created: new Date(p.createdAt).toLocaleDateString(),
            }))
            exportToCSV(csvData, "Optional-Itinerary-report")
        } finally {
            setExporting(false)
        }
    }

    const handlePendingInquiriesExportPDF = async () => {
        setExporting(true)
        try {
            const pdfData = filteredPendingInquiries.map((p) => [
                p.bookingId,
                p.clientDetails?.name || "N/A",
                p.clientDetails?.email || "N/A",
                p.itineraryData?.titles?.[0] || "N/A",
                getTotalAmount(p),
                p.status,
            ])
            exportToPDF(
                ["Booking ID", "Client Name", "Email", "Package", "Amount", "Status"],
                pdfData,
                "pending-inquiries-report",
            )
        } finally {
            setExporting(false)
        }
    }

    const handleEmailsExportCSV = async () => {
        setExporting(true)
        try {
            const csvData = filteredEmails.map((e) => ({
                "Booking ID": e.bookingId,
                "Client Name": e.clientDetails.name,
                Email: e.clientDetails.email,
                Status: e.status,
                Seen: e.isSeen ? "Yes" : "No",
                "Send Count": e.sendCount,
                "Sent At": new Date(e.sentAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                })

            }))
            exportToCSV(csvData, "emails-report")
        } finally {
            setExporting(false)
        }
    }

    const handleEmailsExportPDF = async () => {
        setExporting(true)
        try {
            const pdfData = filteredEmails.map((e) => [
                e.bookingId,
                e.clientDetails.name,
                e.clientDetails.email,
                e.status,
                e.isSeen ? "Yes" : "No",
                e.sendCount,
                new Date(e.sentAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                })

            ])
            exportToPDF(
                ["Booking ID", "Client Name", "Email", "Status", "Seen", "Send Count", "Sent At"],
                pdfData,
                "emails-report",
            )
        } finally {
            setExporting(false)
        }
    }

    const ReportTable = ({ data, columns, renderRow, loading, emptyMessage }) => (
        <div style={{ overflowX: "auto" }}>
            {loading ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>Loading...</div>
            ) : data.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>{emptyMessage}</div>
            ) : (
                <table style={{ width: "100%", fontSize: "14px" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    style={{
                                        textAlign: "left",
                                        padding: "12px 16px",
                                        color: "#1e293b",
                                        fontWeight: "600",
                                    }}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>{data.map(renderRow)}</tbody>
                </table>
            )}
        </div>
    )

    const styles = {
        container: {
            minHeight: "100vh",

            padding: "24px",
        },
        maxWidth: {
            maxWidth: "80rem",
            margin: "0 auto",
        },
        header: {
            marginBottom: "32px",
        },

        subtitle: {
            color: "#475569",
        },
        tabsContainer: {
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            borderBottom: "1px solid #e2e8f0",
            overflowX: "auto",
        },
        tabButton: (isActive) => ({
            padding: "8px 16px",
            fontWeight: "500",
            transition: "all 0.3s",
            whiteSpace: "nowrap",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: isActive ? "#3b82f6" : "#94a3b8",
            borderBottom: isActive ? "2px solid #3b82f6" : "none",
            paddingBottom: isActive ? "6px" : "8px",
        }),
        card: {

            border: "1px solid #e2e8f0",
            borderRadius: "8px",
        },
        cardHeader: {
            padding: "24px",
            borderBottom: "1px solid #e2e8f0",
        },
        cardTitle: {
            fontSize: "20px",
            fontWeight: "600",
            color: "#1e293b",
            marginBottom: "4px",
        },
        cardDescription: {
            color: "#64748b",
            fontSize: "14px",
        },
        cardContent: {
            padding: "24px",
        },
        filterGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
        },
        input: {
            width: "100%",
            padding: "8px 12px",

            border: "1px solid #e2e8f0",
            color: "#1e293b",
            borderRadius: "4px",
            fontSize: "14px",
        },
        select: {
            width: "100%",
            padding: "8px 12px",

            border: "1px solid #e2e8f0",
            color: "#1e293b",
            borderRadius: "4px",
            fontSize: "14px",
        },
        buttonGroup: {
            display: "flex",
            gap: "8px",
        },
        button: (bgColor) => ({
            flex: 1,
            padding: "8px 16px",
            background: bgColor,
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            transition: "all 0.3s",
        }),
        buttonGreen: {
            background: "#10b981",
        },
        buttonGreenHover: {
            background: "#059669",
        },
        buttonRed: {
            background: "#ef4444",
        },
        buttonRedHover: {
            background: "#dc2626",
        },
        statusBadge: (status) => {
            let bgColor = "#f87171"
            let textColor = "#fee2e2"

            if (status === "Booked" || status === "booked" || status === "success") {
                bgColor = "#10b981"
                textColor = "#d1fae5"
            } else if (status === "pending" || status === "Pending") {
                bgColor = "#3b82f6"  // Light blue background (blue-500)
                textColor = "#dbeafe"  // Light blue text (blue-100)
            } else if (status === "ongoing") {
                bgColor = "#8b5cf6"
                textColor = "#e9d5ff"
            } else if (status === "cancelled" || status === "failed" || status === "refunded") {
                bgColor = "#f87171"
                textColor = "#fee2e2"
            } else if (status === "seen") {
                bgColor = "#10b981"
                textColor = "#d1fae5"
            } else if (status === "unseen") {
                bgColor = "#f59e0b"
                textColor = "#fef3c7"
            }

            return {
                padding: "6px 12px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: "600",
                background: bgColor,
                color: textColor,
                display: "inline-block",
            }
        },
        tableRow: {
            borderBottom: "1px solid #e2e8f0",
        },
        tableRowHover: {
            background: "rgba(248, 250, 252, 0.5)",
        },
        tableCell: {
            padding: "12px 16px",
            color: "#1e293b",
        },
        footerText: {
            marginTop: "16px",
            fontSize: "14px",
            color: "#64748b",
        },
    }

    return (
        <div style={styles.container}>
            <div style={styles.maxWidth}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 className=" text-blue-600 mb-5 font-bold text-2xl">Reports Dashboard</h1>
                    <p style={styles.subtitle}>View and export all your business data with advanced filtering</p>
                </div>

                {/* Tabs */}
                <div style={styles.tabsContainer}>
                    {["bookings", "payments", "inquiries", "pending", "emails"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={styles.tabButton(activeTab === tab)}>
                            {tab === "pending" ? "Optional Itinerary" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Bookings Report */}
                {activeTab === "bookings" && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Bookings Report</h2>
                            <p style={styles.cardDescription}>View and export all booking records</p>
                        </div>
                        <div style={styles.cardContent}>
                            <div style={styles.filterGrid}>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or booking ID..."
                                    value={bookingsSearch}
                                    onChange={(e) => setBookingsSearch(e.target.value)}
                                    style={styles.input}
                                />
                                <select
                                    value={bookingsStatus}
                                    onChange={(e) => setBookingsStatus(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="Booked">Booked</option>
                                    <option value="completed">completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div style={styles.buttonGroup}>
                                    <button
                                        onClick={handleBookingsExportCSV}
                                        disabled={exporting || filteredBookings.length === 0}
                                        style={{
                                            ...styles.button("#10b981"),
                                            opacity: exporting || filteredBookings.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "CSV"}
                                    </button>
                                    <button
                                        onClick={handleBookingsExportPDF}
                                        disabled={exporting || filteredBookings.length === 0}
                                        style={{
                                            ...styles.button("#ef4444"),
                                            opacity: exporting || filteredBookings.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "PDF"}
                                    </button>
                                </div>
                            </div>

                            <ReportTable
                                data={filteredBookings}
                                columns={["Booking ID", "Client Name", "Email", "Package", "Amount", "Status"]}
                                loading={bookingsLoading}
                                emptyMessage="No bookings found"
                                renderRow={(booking) => (
                                    <tr key={booking._id} style={styles.tableRow}>
                                        <td style={styles.tableCell}>{booking.bookingId}</td>
                                        <td style={styles.tableCell}>{booking.clientDetails.name}</td>
                                        <td style={styles.tableCell}>{booking.clientDetails.email}</td>
                                        <td style={styles.tableCell}>{booking.itineraryData.titles[0] || "N/A"}</td>
                                        <td style={styles.tableCell}>₹{booking.totalAmount}</td>
                                        <td style={styles.tableCell}>
                                            <span style={styles.statusBadge(booking.status)}>{booking.status}</span>
                                        </td>
                                    </tr>
                                )}
                            />

                            <div style={styles.footerText}>
                                Showing {filteredBookings.length} of {bookings.length} bookings
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments Report */}
                {activeTab === "payments" && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Payments Report</h2>
                            <p style={styles.cardDescription}>View and export all payment records</p>
                        </div>
                        <div style={styles.cardContent}>
                            <div style={styles.filterGrid}>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or booking ID..."
                                    value={paymentsSearch}
                                    onChange={(e) => setPaymentsSearch(e.target.value)}
                                    style={styles.input}
                                />
                                <select
                                    value={paymentsStatus}
                                    onChange={(e) => setPaymentsStatus(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="all">All Status</option>
                                    <option value="success">Success</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                                <div style={styles.buttonGroup}>
                                    <button
                                        onClick={handlePaymentsExportCSV}
                                        disabled={exporting || filteredPayments.length === 0}
                                        style={{
                                            ...styles.button("#10b981"),
                                            opacity: exporting || filteredPayments.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "CSV"}
                                    </button>
                                    <button
                                        onClick={handlePaymentsExportPDF}
                                        disabled={exporting || filteredPayments.length === 0}
                                        style={{
                                            ...styles.button("#ef4444"),
                                            opacity: exporting || filteredPayments.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "PDF"}
                                    </button>
                                </div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                {paymentsLoading ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>Loading payments...</div>
                                ) : filteredPayments.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>No payments found</div>
                                ) : (
                                    <table style={{ width: "100%", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Booking ID
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Client Name
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Amount
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Status
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Method
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayments.map((payment) =>
                                                payment.payments.map((p) => (
                                                    <tr key={p._id} style={styles.tableRow}>
                                                        <td style={styles.tableCell}>{payment.bookingId}</td>
                                                        <td style={styles.tableCell}>{payment.clientDetails.name}</td>
                                                        <td style={styles.tableCell}>₹{p.amount}</td>
                                                        <td style={styles.tableCell}>
                                                            <span style={styles.statusBadge(p.status)}>{p.status}</span>
                                                        </td>
                                                        <td style={styles.tableCell}>{p.method || "N/A"}</td>
                                                        <td style={styles.tableCell}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                                    </tr>
                                                )),
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div style={styles.footerText}>
                                Showing {filteredPayments.length} of {payments.length} payment records
                            </div>
                        </div>
                    </div>
                )}

                {/* Inquiries Report */}
                {activeTab === "inquiries" && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Inquiries Report</h2>
                            <p style={styles.cardDescription}>View and export all inquiry records</p>
                        </div>
                        <div style={styles.cardContent}>
                            <div style={styles.filterGrid}>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or package..."
                                    value={inquiriesSearch}
                                    onChange={(e) => setInquiriesSearch(e.target.value)}
                                    style={styles.input}
                                />
                                <select
                                    value={inquiriesStatus}
                                    onChange={(e) => setInquiriesStatus(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="booked">Booked</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div style={styles.buttonGroup}>
                                    <button
                                        onClick={handleInquiriesExportCSV}
                                        disabled={exporting || filteredInquiries.length === 0}
                                        style={{
                                            ...styles.button("#10b981"),
                                            opacity: exporting || filteredInquiries.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "CSV"}
                                    </button>
                                    <button
                                        onClick={handleInquiriesExportPDF}
                                        disabled={exporting || filteredInquiries.length === 0}
                                        style={{
                                            ...styles.button("#ef4444"),
                                            opacity: exporting || filteredInquiries.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "PDF"}
                                    </button>
                                </div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                {inquiriesLoading ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>Loading inquiries...</div>
                                ) : filteredInquiries.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>No inquiries found</div>
                                ) : (
                                    <table style={{ width: "100%", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Name
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Email
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Mobile
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Package
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Status
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Created
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInquiries.map((inquiry) => (
                                                <tr key={inquiry._id} style={styles.tableRow}>
                                                    <td style={styles.tableCell}>{inquiry.name}</td>
                                                    <td style={styles.tableCell}>{inquiry.email}</td>
                                                    <td style={styles.tableCell}>{inquiry.mobile}</td>
                                                    <td style={styles.tableCell}>{inquiry.packageTitle}</td>
                                                    <td style={styles.tableCell}>
                                                        <span style={styles.statusBadge(inquiry.status)}>{inquiry.status}</span>
                                                    </td>
                                                    <td style={styles.tableCell}>{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div style={styles.footerText}>
                                Showing {filteredInquiries.length} of {inquiries.length} inquiries
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Inquiries Report */}
                {activeTab === "pending" && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Optional Itinerary Report</h2>
                            <p style={styles.cardDescription}>View and export all Optional Itinerary</p>
                        </div>
                        <div style={styles.cardContent}>
                            <div style={styles.filterGrid}>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or booking ID..."
                                    value={pendingInquiriesSearch}
                                    onChange={(e) => setPendingInquiriesSearch(e.target.value)}
                                    style={styles.input}
                                />
                                <select
                                    value={pendingInquiriesStatus}
                                    onChange={(e) => setPendingInquiriesStatus(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="Booked">Booked</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div style={styles.buttonGroup}>
                                    <button
                                        onClick={handlePendingInquiriesExportCSV}
                                        disabled={exporting || filteredPendingInquiries.length === 0}
                                        style={{
                                            ...styles.button("#10b981"),
                                            opacity: exporting || filteredPendingInquiries.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "CSV"}
                                    </button>
                                    <button
                                        onClick={handlePendingInquiriesExportPDF}
                                        disabled={exporting || filteredPendingInquiries.length === 0}
                                        style={{
                                            ...styles.button("#ef4444"),
                                            opacity: exporting || filteredPendingInquiries.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "PDF"}
                                    </button>
                                </div>
                            </div>

                            <ReportTable
                                data={filteredPendingInquiries}
                                columns={["Booking ID", "Client Name", "Email", "Package", "Amount", "Status"]}
                                loading={pendingInquiriesLoading}
                                emptyMessage="No Optional Itinerary found"
                                renderRow={(inquiry) => (
                                    <tr key={inquiry._id} style={styles.tableRow}>
                                        <td style={styles.tableCell}>{inquiry.bookingId}</td>
                                        <td style={styles.tableCell}>{inquiry.clientDetails?.name || "N/A"}</td>
                                        <td style={styles.tableCell}>{inquiry.clientDetails?.email || "N/A"}</td>
                                        <td style={styles.tableCell}>{inquiry.itineraryData?.titles?.[0] || "N/A"}</td>
                                        <td style={styles.tableCell}>₹{getTotalAmount(inquiry)}</td>
                                        <td style={styles.tableCell}>
                                            <span style={styles.statusBadge(inquiry.status)}>{inquiry.status}</span>
                                        </td>
                                    </tr>
                                )}
                            />

                            <div style={styles.footerText}>
                                Showing {filteredPendingInquiries.length} of {pendingInquiries.length} Optional Itinerary
                            </div>
                        </div>
                    </div>
                )}

                {/* Emails Report */}
                {activeTab === "emails" && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Emails Report</h2>
                            <p style={styles.cardDescription}>View and export all email tracking records</p>
                        </div>
                        <div style={styles.cardContent}>
                            <div style={styles.filterGrid}>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or booking ID..."
                                    value={emailsSearch}
                                    onChange={(e) => setEmailsSearch(e.target.value)}
                                    style={styles.input}
                                />
                                <select value={emailsStatus} onChange={(e) => setEmailsStatus(e.target.value)} style={styles.select}>
                                    <option value="all">All Status</option>
                                    <option value="seen">Seen</option>
                                    <option value="unseen">Unseen</option>
                                    <option value="pending">Pending</option>
                                </select>
                                <div style={styles.buttonGroup}>
                                    <button
                                        onClick={handleEmailsExportCSV}
                                        disabled={exporting || filteredEmails.length === 0}
                                        style={{
                                            ...styles.button("#10b981"),
                                            opacity: exporting || filteredEmails.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "CSV"}
                                    </button>
                                    <button
                                        onClick={handleEmailsExportPDF}
                                        disabled={exporting || filteredEmails.length === 0}
                                        style={{
                                            ...styles.button("#ef4444"),
                                            opacity: exporting || filteredEmails.length === 0 ? 0.5 : 1,
                                        }}
                                    >
                                        {exporting ? "Exporting..." : "PDF"}
                                    </button>
                                </div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                {emailsLoading ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>Loading emails...</div>
                                ) : filteredEmails.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>No emails found</div>
                                ) : (
                                    <table style={{ width: "100%", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Booking ID
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Client Name
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Email
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Status
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Seen
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Send Count
                                                </th>
                                                <th style={{ textAlign: "left", padding: "12px 16px", color: "#1e293b", fontWeight: "600" }}>
                                                    Sent At
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmails.map((email) => (
                                                <tr key={email._id} style={styles.tableRow}>
                                                    <td style={styles.tableCell}>{email.bookingId}</td>
                                                    <td style={styles.tableCell}>{email.clientDetails.name}</td>
                                                    <td style={styles.tableCell}>{email.clientDetails.email}</td>
                                                    <td style={styles.tableCell}>
                                                        <span style={styles.statusBadge(email.status)}>{email.status}</span>
                                                    </td>
                                                    <td style={styles.tableCell}>
                                                        <span
                                                            style={{
                                                                ...styles.statusBadge(email.isSeen ? "seen" : "unseen"),
                                                            }}
                                                        >
                                                            {email.isSeen ? "Yes" : "No"}
                                                        </span>
                                                    </td>
                                                    <td style={styles.tableCell}>{email.sendCount}</td>
                                                    <td style={styles.tableCell}>{new Date(email.sentAt).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: '2-digit'
                                                    })
                                                    }</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div style={styles.footerText}>
                                Showing {filteredEmails.length} of {emails.length} emails
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
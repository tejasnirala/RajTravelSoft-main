// UserBookNow.jsx (Modified)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
// Removed external FontAwesome dependencies
import { Copy, MoveLeft } from "lucide-react";

// Simple WhatsApp SVG component to replace FontAwesome
const WhatsAppIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        className={className}
        fill="currentColor"
    >
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
);

const UserBookNow = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'Final'; // Default to 'Final' if no tab
    const [booking, setBooking] = useState(null);
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState(null);
    const [user, setUser] = useState(null);
    console.log(structure);

    const navigate = useNavigate();

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);


    const [paymentDetails, setPaymentDetails] = useState({
        amount: "",
        currency: "INR",
        method: "",
        gateway: "",
        screenshot: null,
        screenshotPreview: null, // For screenshot preview
        paymentDate: new Date().toISOString(),
        receiptUrl: "", // Added for schema
        screenshotUrl: "", // Added for schema
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Helper functions to compute display values for both pending and booking structures
    const getTotalAmount = (bookingData) => {
        if (bookingData?.grandTotal) {
            return Number(bookingData.grandTotal);
        }
        return Number(bookingData?.totalAmount || 0);
    };

    // Get total categories
    const getTotalCategories = (bookingData) => {
        let ta = bookingData?.totalAmount;
        if (!ta && bookingData?.itineraryData?.totalAmount) {
            ta = bookingData.itineraryData.totalAmount;
        }
        if (!ta || typeof ta !== 'object') return null;
        const categories = {};
        Object.keys(ta).forEach(cat => {
            const catData = ta[cat];
            if (catData && (typeof catData === 'number' || catData.value)) {
                categories[cat] = typeof catData === 'number' ? catData : catData.value;
            }
        });
        return categories;
    };

    // Get booking categories
    const getBookingCategories = (bookingData) => {
        let ba = bookingData?.bookingAmount;
        if (!ba && bookingData?.itineraryData?.bookingAmount) {
            ba = bookingData.itineraryData.bookingAmount;
        }
        if (!ba || typeof ba !== 'object') return null;
        const categories = {};
        Object.keys(ba).forEach(cat => {
            const catData = ba[cat];
            if (catData && (typeof catData === 'number' || catData.value)) {
                categories[cat] = typeof catData === 'number' ? catData : catData.value;
            }
        });
        return categories;
    };

    const getBookingAmount = (bookingData) => {
        const bc = getBookingCategories(bookingData);
        return bc ? Object.values(bc).reduce((sum, amt) => sum + Number(amt), 0) : Number(bookingData?.bookingAmount || 0);
    };

    // Check if multi-category
    const totalCategories = getTotalCategories(booking);
    const bookingCategories = getBookingCategories(booking);
    const isMultiCategory = !!totalCategories || !!bookingCategories;
    const totalAmount = getTotalAmount(booking);
    const bookingAmountValue = getBookingAmount(booking);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!id) throw new Error("Missing booking id in URL");

                // Determine API endpoint based on tab
                const bookingEndpoint = tab === 'Optional' ? `https://apitour.rajasthantouring.in/api/pending/${id}` : `https://apitour.rajasthantouring.in/api/bookings/${id}`;
                const bookingRes = await axios.get(bookingEndpoint, {
                    withCredentials: true,
                });
                if (!bookingRes.data) throw new Error("No booking data returned");
                setBooking(bookingRes.data);
                setUser(bookingRes.data?.contact)


                if (tab === "Optional") {

                    console.log("🔍 DEBUG: Checking isLatest field in booking...");
                    console.log("➡️ bookingRes.data:", bookingRes.data);
                    console.log("➡️ isLatest exists?", bookingRes.data.hasOwnProperty("isLatest"));
                    console.log("➡️ isLatest value:", bookingRes.data.isLatest);

                    // 1️⃣ If isLatest is missing → error
                    if (!bookingRes.data.hasOwnProperty("isLatest")) {
                        console.log("❌ ERROR: isLatest field missing");
                        setErrors("⚠️ Unable to verify latest quotation. Please contact support.");
                    }

                    // 2️⃣ If isLatest is present but FALSE → error
                    else if (bookingRes.data.isLatest === false) {
                        console.log("❌ ERROR: isLatest = false (Not latest quotation)");
                        setErrors("⚠️ This is not your latest quotation. Please make payment on the latest updated quotation.");
                    }

                    // 3️⃣ If isLatest === true → all good (don't show error)
                    else {
                        console.log("✅ OK: isLatest = true (Allow payment)");
                    }
                }


                const structureRes = await axios.get("https://apitour.rajasthantouring.in/api/structure", {
                    withCredentials: true,
                });
                if (!structureRes.data) throw new Error("No structure data returned");
                setStructure(structureRes.data);
            } catch (err) {
                setError(`Failed to load data. ${err?.message || "Please try again."}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, tab]); // Re-fetch if tab changes

    const walletOptions = useMemo(
        () =>
            structure?.paymentIds?.map((p) => ({
                label: `${p.type} (${p.value})`,
                value: p.value,
            })) ?? [],
        [structure],
    );

    const qrOptions = useMemo(
        () =>
            structure?.paymentIds
                ?.filter((p) => p.qrImageUrl)
                .map((p) => ({
                    label: `${p.receiverName || p.type} (${p.value})`,
                    value: p.value,
                })) ?? [],
        [structure],
    );

    const bankOptions = useMemo(
        () =>
            structure?.bankDetails?.map((b) => ({
                label: `${b.bankName} • ${b.accountNumber}`,
                value: b.accountNumber,
            })) ?? [],
        [structure],
    );

    const formatINR = (n) => {
        const num = Number(n || 0);
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // no-op
        }
    };

    const openDialogFor = (method) => {
        setSelectedMethod(method);
        const defaultGateway = method === "wallet" ? walletOptions[0]?.value ?? "" :
            method === "qr" ? qrOptions[0]?.value ?? "" :
                bankOptions[0]?.value ?? "";
        setPaymentDetails((prev) => ({
            ...prev,
            method,
            gateway: defaultGateway,
            amount: "", // Prefill with computed booking amount (sum)
            screenshot: null,
            screenshotPreview: null,
            receiptUrl: "",
            screenshotUrl: "",
        }));
        setIsDialogOpen(true);
        setSuccessMessage(null);
        setError(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (file && file.size > 5 * 1024 * 1024) {
            setError("Screenshot size must be less than 5MB.");
            return;
        }
        if (file && !["image/jpeg", "image/png"].includes(file.type)) {
            setError("Only JPEG and PNG images are allowed.");
            return;
        }
        setPaymentDetails((prev) => ({
            ...prev,
            screenshot: file,
            screenshotPreview: file ? URL.createObjectURL(file) : null,
        }));
    };

    const handleSubmitPayment = async () => {
        if (!id) return;
        if (!paymentDetails.amount || paymentDetails.amount <= 0) {
            setError("Please enter a valid payment amount.");
            return;
        }
        if (!selectedMethod) {
            setError("Please select a payment method.");
            return;
        }
        if (!paymentDetails.gateway) {
            setError("Please select a wallet/UPI or bank account.");
            return;
        }

        // REQUIRED: Screenshot validation
        if (!paymentDetails.screenshot) {
            setError("Please upload the payment screenshot.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            let screenshotUrl = null;
            if (paymentDetails.screenshot) {
                const formData = new FormData();
                formData.append("screenshot", paymentDetails.screenshot);
                const uploadRes = await axios.post("https://apitour.rajasthantouring.in/api/bookings/upload-screenshot", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    withCredentials: true,
                });
                screenshotUrl = uploadRes.data?.screenshotUrl ?? null;
            }

            const payload = {
                amount: Number(paymentDetails.amount),
                currency: paymentDetails.currency,
                method: selectedWallet?.type || (selectedMethod === "qr" ? "qr" : selectedMethod),
                gateway: paymentDetails.gateway,
                paymentDate: paymentDetails.paymentDate,
                receiptUrl: screenshotUrl,
                screenshot: screenshotUrl,
                status: "pending",
            };
            console.log(payload);

            // Determine payment endpoint based on tab
            const paymentEndpoint = tab === 'Optional' ? `https://apitour.rajasthantouring.in/api/pendingPayments/user/${id}` : `https://apitour.rajasthantouring.in/api/payments/user/${id}`;
            await axios.post(paymentEndpoint, payload, {
                withCredentials: true,
            });
            navigate(`/thank-you?id=${id}&tab=${tab}`);

            setSuccessMessage("Payment submitted. Status set to Pending until admin confirms.");
            setIsDialogOpen(false);
            setSelectedMethod(null);
            setPaymentDetails({
                amount: "",
                currency: "INR",
                method: "",
                gateway: "",
                screenshot: null,
                screenshotPreview: null,
                paymentDate: new Date().toISOString(),
                receiptUrl: "",
                screenshotUrl: "",
            });
        } catch (err) {
            setError("Failed to submit payment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };
    console.log(errors);

    // Find selected bank or wallet details
    const selectedBank = structure?.bankDetails?.find((b) => b.accountNumber === paymentDetails.gateway);
    const selectedWallet = structure?.paymentIds?.find((p) => p.value === paymentDetails.gateway);

    if (loading) return <div className="p-6">Loading...</div>;
    if (errors) return <div className="p-6 text-red-600">{errors}</div>;
    if (!booking || !structure) return <div className="p-6">No data found.</div>;

    return (
        <main className="mx-auto max-w-7xl p-4 md:p-6">

            <div className="flex justify-between items-center py-4 w-full px-6 mb-4">
                {/* Logo at top-left */}
                <img
                    src={
                        structure?.logo
                            ? (structure.logo.startsWith("/uploads") ? `https://apitour.rajasthantouring.in${structure.logo}` : structure.logo)
                            : "/logo1.png"
                    }
                    alt="Company Logo"
                    className="h-12 w-auto object-contain"
                />
                {/* WhatsApp number on right */}
                {user?.mobiles?.[0] && (
                    <a
                        href={`https://wa.me/${user.mobiles[0].replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <WhatsAppIcon className="w-4 h-4" />
                        {user.mobiles[0].replace(/[^0-9]/g, '')}
                    </a>
                )}
            </div>

            <button
                onClick={() => navigate(-1)}
                className="flex my-2 items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 hover:shadow-md transition duration-200"
            >
                {/* Optional arrow icon */}

                <MoveLeft />
            </button>

            {/* Tab Indicator (for debugging/visual) */}
            <div className="mb-4 p-2 bg-gray-100 rounded-md text-center">
                <span className="text-sm font-medium">Current Tab: <strong>{tab}</strong></span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left: Methods */}
                <section className="space-y-6">
                    <div className="rounded-lg border bg-white">
                        <div className="border-b px-5 py-4">
                            <h2 className="text-lg font-semibold text-balance">Choose Your Payment Method</h2>
                        </div>

                        <div className="space-y-8 p-5">
                            {/* Option 1: Wallet */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white">
                                        Option 1
                                    </span>
                                    <h3 className="text-lg font-semibold">UPI Transfer</h3>
                                </div>

                                <div className="overflow-hidden rounded-md border divide-y">
                                    {structure.paymentIds?.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
                                        >
                                            {/* LEFT : LOGO + TYPE */}
                                            <div className="flex items-center gap-3 min-w-[120px]">
                                                {p.logoUrl && (
                                                    <img
                                                        src={`https://apitour.rajasthantouring.in${p.logoUrl}`}
                                                        alt="logo"
                                                        className="h-8 w-8 object-contain"
                                                    />
                                                )}
                                                <p className="text-sm font-medium capitalize">{p.type}</p>
                                            </div>

                                            {/* RIGHT : VALUE + COPY */}
                                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
                                                <p className="text-sm text-gray-700 truncate max-w-[250px] sm:max-w-none">
                                                    {p.value}
                                                </p>

                                                <button
                                                    onClick={() => navigator.clipboard.writeText(p.value)}
                                                    className="p-2 rounded-md border bg-gray-100 hover:bg-gray-200"
                                                >
                                                    <Copy size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {!structure.paymentIds?.length && (
                                        <div className="p-4 text-sm text-gray-500">No wallet/UPI IDs configured.</div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openDialogFor("wallet")}
                                    className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                                    disabled={!structure.paymentIds?.length}
                                >
                                    I Have Done Payment
                                </button>
                            </div>


                            {/* Option 2: Bank */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white">Option 2</span>
                                    <h3 className="text-lg font-semibold">Bank Transfer</h3>
                                </div>

                                {(structure.bankDetails ?? []).map((bank, idx) => (
                                    <div key={idx} className="rounded-md border">
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Bank Name:</span>
                                                {bank.logoUrl && (
                                                    <img
                                                        src={`https://apitour.rajasthantouring.in${bank.logoUrl}`}
                                                        alt={`${bank.bankName} logo`}
                                                        className="h-8 w-8 object-contain"
                                                    />
                                                )}
                                                <span className="text-gray-700">{bank.bankName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">IFSC Code:</span>
                                                <span className="text-gray-700">{bank.ifscCode}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Account Name:</span>
                                                <span className="text-gray-700">{bank.accountName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Account Number:</span>
                                                <span className="text-gray-700">{bank.accountNumber}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyText(bank.accountNumber)}
                                                    className="ml-2 rounded-md border bg-gray-50 px-3 py-1.5 text-sm hover:bg-gray-100"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium">Account Type:</span>
                                                <span className="text-gray-700">{bank.accountType}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!structure.bankDetails?.length && (
                                    <div className="rounded-md border p-4 text-sm text-gray-500">No bank accounts configured.</div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => openDialogFor("bank")}
                                    className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                                    disabled={!structure.bankDetails?.length}
                                >
                                    I Have Done Payment
                                </button>
                            </div>

                            {/* Option 3: QR */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white">
                                        Option 3
                                    </span>
                                    <h3 className="text-lg font-semibold">QR Code Payment</h3>
                                </div>

                                <div className=" rounded-md border">
                                    {structure.paymentIds?.filter((p) => p.qrImageUrl).length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 p-4">
                                            {structure.paymentIds
                                                ?.filter((p) => p.qrImageUrl)
                                                .map((p, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-4 border rounded-lg flex flex-col items-center gap-2 shadow-sm bg-white"
                                                    >
                                                        <img
                                                            src={`https://apitour.rajasthantouring.in${p.qrImageUrl}`}
                                                            alt="QR Code"
                                                            className="h-32 w-32 object-contain border rounded-md"
                                                        />
                                                        <div className="text-sm font-medium text-center">
                                                            {p.receiverName}
                                                        </div>
                                                        <div className="text-sm text-gray-700 text-center">{p.value}</div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-sm text-gray-500">No QR codes configured.</div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openDialogFor("qr")}
                                    className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                                    disabled={!qrOptions.length}
                                >
                                    I Have Done Payment
                                </button>
                            </div>

                            {successMessage && <p className="text-sm font-medium text-green-600">{successMessage}</p>}
                            {/* Removed error display from here so it doesn't show in the main layout if modal is open */}
                        </div>
                    </div>
                </section>

                {/* Right: Summary */}
                <aside>
                    <div className="rounded-lg border bg-white">
                        <div className="border-b px-5 py-4">
                            <h2 className="text-lg font-semibold text-balance">Payment Summary</h2>
                        </div>
                        <div className="p-5 text-sm space-y-2">
                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">Name:</span>
                                <span>{booking?.clientDetails?.name ?? "N/A"}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">Email:</span>
                                <span>{booking?.clientDetails?.email ?? "N/A"}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1 flex-wrap">
                                <span className="font-medium">Package:</span>
                                <span>{booking?.itineraryData?.titles?.[0] ?? "N/A"}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">No of Adults:</span>
                                <span>{booking?.clientDetails?.adults ?? 0}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">No of Kids (5 to 12 yrs):</span>
                                <span>{booking?.clientDetails?.kids5to12 ?? 0}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">Kids (Below 5 yrs):</span>
                                <span>{booking?.clientDetails?.kidsBelow5 ?? 0}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">Travel Date:</span>
                                <span>{booking?.clientDetails?.travelDate ?? "N/A"}</span>
                            </div>

                            <div className="flex justify-between border-b pb-1">
                                <span className="font-medium">Total Amount:</span>
                                <span>
                                    {isMultiCategory && totalCategories ? (
                                        <div className="space-y-1">
                                            {Object.entries(totalCategories).map(([cat, amt]) => (
                                                <div key={cat} className="flex justify-between">
                                                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}:</span>
                                                    <span>{formatINR(amt)}</span>
                                                </div>
                                            ))}

                                        </div>
                                    ) : (
                                        formatINR(totalAmount)
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between pb-1">
                                <span className="font-medium">Booking Amount:</span>
                                <span className="font-semibold text-green-600">
                                    {isMultiCategory && bookingCategories ? (
                                        <div className="space-y-1">
                                            {Object.entries(bookingCategories).map(([cat, amt]) => (
                                                <div key={cat} className="flex justify-between">
                                                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}:</span>
                                                    <span>{formatINR(amt)}</span>
                                                </div>
                                            ))}

                                        </div>
                                    ) : (
                                        formatINR(bookingAmountValue)
                                    )}
                                </span>
                            </div>
                        </div>

                    </div>
                </aside>
            </div>


            {/* Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsDialogOpen(false)} />
                    <div className="relative h-[90vh] overflow-y-auto z-10 w-full scrollbar-hide max-w-lg rounded-lg bg-white shadow-lg flex flex-col">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <h3 className="text-xl font-semibold">
                                {selectedMethod === "bank" ? "Bank Transfer Details" :
                                    selectedMethod === "qr" ? "QR Payment Details" : "UPI Transfer Details"}
                            </h3>
                            <button
                                type="button"
                                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                onClick={() => setIsDialogOpen(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 p-5 overflow-y-auto flex-1">

                            {/* Payment Method Selection */}
                            {selectedMethod === "wallet" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Wallet (Gateway):</label>
                                    <select
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                        value={paymentDetails.gateway}
                                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, gateway: e.target.value }))}
                                    >
                                        {walletOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedMethod === "qr" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select QR Payment (Gateway):</label>
                                    <select
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                        value={paymentDetails.gateway}
                                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, gateway: e.target.value }))}
                                    >
                                        {qrOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedMethod === "bank" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Bank Account (Gateway):</label>
                                    <select
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                        value={paymentDetails.gateway}
                                        onChange={(e) => setPaymentDetails((prev) => ({ ...prev, gateway: e.target.value }))}
                                    >
                                        {bankOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Payment Details */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Method:</label>
                                <input
                                    className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100"
                                    value={selectedMethod === "bank" ? "Bank Transfer" : selectedWallet?.type || (selectedMethod === "qr" ? "QR Payment" : selectedMethod)}
                                    readOnly
                                />
                            </div>

                            {/* REMOVED MOBILE NUMBER FIELD */}
                            {/* REMOVED TRANSACTION ID FIELD */}

                            <div className="space-y-2">
                                <label htmlFor="amount" className="text-sm font-medium">
                                    Amount:
                                </label>
                                <input
                                    id="amount"
                                    type="text"
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    value={paymentDetails.amount}
                                    onChange={(e) =>
                                        setPaymentDetails((prev) => ({ ...prev, amount: e.target.value }))
                                    }
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="currency" className="text-sm font-medium">
                                    Currency:
                                </label>
                                <input
                                    id="currency"
                                    className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100"
                                    value={paymentDetails.currency}
                                    readOnly
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="paymentDate" className="text-sm font-medium">
                                    Payment Date:
                                </label>
                                <input
                                    id="paymentDate"
                                    className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100"
                                    value={formatDate(paymentDetails.paymentDate)}
                                    readOnly
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="receipt" className="text-sm font-medium">
                                    Upload Receipt Screenshot <span className="text-red-500">*</span>:
                                </label>
                                <input
                                    id="receipt"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    className="w-full rounded-md border px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2"
                                    onChange={handleFileChange}
                                />
                                {paymentDetails.screenshotPreview && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">Screenshot Preview:</p>
                                        <img
                                            src={paymentDetails.screenshotPreview}
                                            alt="Screenshot Preview"
                                            className="mt-1 h-24 w-auto object-contain border rounded-md"
                                        />
                                    </div>
                                )}
                            </div>

                            {(paymentDetails.receiptUrl || paymentDetails.screenshotUrl) && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Uploaded Screenshot URL:</label>
                                    <input
                                        className="w-full rounded-md border px-3 py-2 text-sm bg-gray-100"
                                        value={paymentDetails.receiptUrl || paymentDetails.screenshotUrl}
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t px-5 py-4">
                            {/* ERROR MESSAGE DISPLAYED INSIDE MODAL */}
                            {error && (
                                <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitPayment}
                                    disabled={submitting}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {submitting ? "Submitting..." : "Submit Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default UserBookNow;
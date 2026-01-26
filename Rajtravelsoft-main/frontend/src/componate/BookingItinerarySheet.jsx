import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Edit3, Save, Eye, Download, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookingSheetViewer = ({ bookingId, onClose, isEditable = true }) => {
    const [sheet, setSheet] = useState(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedRows, setEditedRows] = useState({});
    const [showPrevious, setShowPrevious] = useState({}); // For viewing previous hotels per row
    console.log(sheet);

    const navigate = useNavigate()
    useEffect(() => {
        if (bookingId) fetchSheet(bookingId);
    }, [bookingId]);

    const fetchSheet = async (id) => {
        try {
            setLoading(true);
            const bookingRes = await fetch(`https://apitour.rajasthantouring.in/api/bookings/${id}`, {
                credentials: 'include',
            });
            setBooking(await bookingRes.json());
            const sheetRes = await fetch(`https://apitour.rajasthantouring.in/api/sheets/${id}`, {
                credentials: 'include',
            });
            if (sheetRes.ok) {
                const sheetData = await sheetRes.json();
                setSheet(sheetData);
                initEdits(sheetData.sheetData?.rows);
            } else {
                await generateSheet(id);
            }
        } finally {
            setLoading(false);
        }
    };

    const initEdits = (rows) => {
        const initial = {};
        rows.forEach((row, i) => {
            if (row.type === "day") {
                initial[i] = { ...row };
            }
        });
        setEditedRows(initial);
    };

    const generateSheet = async (id) => {
        const res = await fetch(`https://apitour.rajasthantouring.in/api/sheets/${id}/generate`, {
            method: "POST",
            credentials: "include",
        });
        const data = await res.json();
        setSheet(data);
        console.log(data);

        initEdits(data?.sheetData?.rows);
    };

    const downloadSheet = async () => {
        window.open(`https://apitour.rajasthantouring.in/api/sheets/${bookingId}/download`, '_blank');
    };



    const recalculateTotals = (updatedRows) => {
        let hotelTotal = updatedRows
            .filter((r) => r.type === "day" && !r.isRemoved)
            .reduce((sum, r) => sum + (r.totalRoomPrice || 0) + (r.totalExtraPrice || 0), 0);
        const transportRow = updatedRows.find((r) => r.type === "transport");
        let calculatedVehicleTotal = 0;
        let additionalChargesTotal = 0;
        let transportTotal = 0;
        if (transportRow) {
            const tDetails = transportRow.transportDetails;
            calculatedVehicleTotal = tDetails.calculatedVehicleTotal || (tDetails.vehicleKm * tDetails.vehiclePricePerKm) || 0;
            if (tDetails.others?.length) {
                tDetails.others.forEach((o) => {
                    additionalChargesTotal += o.price || 0;
                });
            }
            transportTotal = calculatedVehicleTotal + additionalChargesTotal;
        }
        const grandTotal = hotelTotal + transportTotal;
        const finalRows = updatedRows.map((row) => {
            if (row.type === "summary") {
                if (row.label === "Total Hotel Prices") row.value = `₹${hotelTotal}`;
                if (row.label === "Vehicle Price") row.value = `₹${calculatedVehicleTotal}`;
                if (row.label === "Additional Charges") row.value = `₹${additionalChargesTotal}`;
                if (row.label === "Grand Total") row.value = `₹${grandTotal}`;
            }
            return row;
        });
        setSheet(prev => ({
            ...prev,
            sheetData: {
                ...prev.sheetData,
                rows: finalRows,
                budget: {
                    ...prev.sheetData.budget,
                    hotelTotal,
                    transportTotal,
                    grandTotal,
                    additionalChargesTotal,
                },
            },
        }));
    };

    // Hotel field change handlers - Updated for new fields
    const handleFieldChange = (rowIndex, field, value) => {
        const updated = {
            ...editedRows[rowIndex],
            [field]: field.includes('Count') ? parseInt(value) || 0 : parseFloat(value) || 0 || value,
        };
        // Auto-calculate totals
        if (field === 'doubleRoomPrice') {
            updated.totalRoomPrice = updated.doubleRoomPrice * (updated.roomCount || 1);
        } else if (field === 'roomCount') {
            updated.totalRoomPrice = (updated.doubleRoomPrice || 0) * updated.roomCount;
        } else if (field === 'extraBedPrice') {
            updated.totalExtraPrice = updated.extraBedPrice * (updated.extraBedCount || 0);
        } else if (field === 'extraBedCount') {
            updated.totalExtraPrice = (updated.extraBedPrice || 0) * updated.extraBedCount;
        }
        // Only set isSheetModified for non-price fields (hotelName, category, mealType, hotelNotes)
        if (['hotelName', 'category', 'mealType', 'hotelNotes'].includes(field)) {
            updated.isSheetModified = true;
        }
        setEditedRows({
            ...editedRows,
            [rowIndex]: updated,
        });
        const updatedRows = sheet.sheetData.rows.map((r, i) =>
            i === rowIndex ? updated : r
        );
        recalculateTotals(updatedRows);
    };

    const handleModifiedToggle = (rowIndex) => {
        const updated = {
            ...editedRows[rowIndex],
            isModified: !editedRows[rowIndex].isModified,
        };
        // Do not set isSheetModified here, only for sheet-specific changes
        setEditedRows({
            ...editedRows,
            [rowIndex]: updated,
        });
        recalculateTotals(sheet.sheetData.rows.map((r, i) => i === rowIndex ? updated : r));
    };

    const handleNotesChange = (rowIndex, value) => {
        const updated = {
            ...editedRows[rowIndex],
            hotelNotes: value,
        };
        setEditedRows({
            ...editedRows,
            [rowIndex]: updated,
        });
        recalculateTotals(sheet.sheetData.rows.map((r, i) => i === rowIndex ? updated : r));
    };

    // Toggle previous hotels view
    const togglePrevious = (index) => {
        setShowPrevious(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Transport updates - Already handles calculated
    const updateTransport = (key, value) => {
        const updatedSheet = { ...sheet };
        const transportRow = updatedSheet.sheetData.rows.find((r) => r.type === "transport");
        const tDetails = transportRow.transportDetails;
        tDetails[key] =
            key === "vehicleKm" || key === "vehiclePricePerKm" ? parseFloat(value) || 0 : value;
        const product = tDetails.vehicleKm * tDetails.vehiclePricePerKm;
        tDetails.calculatedVehicleTotal = product;
        let transportTotal = tDetails.calculatedVehicleTotal;
        let additionalChargesTotal = 0;
        if (tDetails.others?.length) {
            tDetails.others.forEach((o) => {
                additionalChargesTotal += o.price || 0;
                transportTotal += o.price || 0;
            });
        }
        updatedSheet.sheetData.rows = updatedSheet.sheetData.rows.map(row => {
            if (row.type === "summary") {
                if (row.label === "Vehicle Price") row.value = `₹${tDetails.calculatedVehicleTotal}`;
                if (row.label === "Additional Charges") row.value = `₹${additionalChargesTotal}`;
                if (row.label === "Grand Total") {
                    const hotelTotal = updatedSheet.sheetData.budget.hotelTotal;
                    row.value = `₹${hotelTotal + transportTotal}`;
                }
            }
            return row;
        });
        updatedSheet.sheetData.budget.transportTotal = transportTotal;
        updatedSheet.sheetData.budget.grandTotal = updatedSheet.sheetData.budget.hotelTotal + transportTotal;
        updatedSheet.sheetData.budget.additionalChargesTotal = additionalChargesTotal;
        setSheet(updatedSheet);
    };

    const updateCalculatedManual = (newCalc) => {
        const updatedSheet = { ...sheet };
        const transportRow = updatedSheet.sheetData.rows.find((r) => r.type === "transport");
        const tDetails = transportRow.transportDetails;
        tDetails.calculatedVehicleTotal = newCalc;
        let transportTotal = tDetails.calculatedVehicleTotal;
        let additionalChargesTotal = 0;
        if (tDetails.others?.length) {
            tDetails.others.forEach((o) => {
                additionalChargesTotal += o.price || 0;
                transportTotal += o.price || 0;
            });
        }
        updatedSheet.sheetData.rows = updatedSheet.sheetData.rows.map(row => {
            if (row.type === "summary") {
                if (row.label === "Vehicle Price") row.value = `₹${tDetails.calculatedVehicleTotal}`;
                if (row.label === "Additional Charges") row.value = `₹${additionalChargesTotal}`;
                if (row.label === "Grand Total") {
                    const hotelTotal = updatedSheet.sheetData.budget.hotelTotal;
                    row.value = `₹${hotelTotal + transportTotal}`;
                }
            }
            return row;
        });
        updatedSheet.sheetData.budget.transportTotal = transportTotal;
        updatedSheet.sheetData.budget.grandTotal = updatedSheet.sheetData.budget.hotelTotal + transportTotal;
        updatedSheet.sheetData.budget.additionalChargesTotal = additionalChargesTotal;
        setSheet(updatedSheet);
    };

    const updateOther = (index, key, value) => {
        // Similar to before, but update additional total
        const updatedSheet = { ...sheet };
        const transport = updatedSheet.sheetData.rows.find((r) => r.type === "transport");
        const tDetails = transport.transportDetails;
        tDetails.others[index][key] =
            key === "price" ? parseFloat(value) || 0 : value;
        let calculatedVehicleTotal = tDetails.calculatedVehicleTotal || (tDetails.vehicleKm * tDetails.vehiclePricePerKm) || 0;
        let additionalChargesTotal = 0;
        if (tDetails.others?.length) {
            tDetails.others.forEach((o) => {
                additionalChargesTotal += o.price || 0;
            });
        }
        const transportTotal = calculatedVehicleTotal + additionalChargesTotal;
        updatedSheet.sheetData.rows = updatedSheet.sheetData.rows.map(row => {
            if (row.type === "summary") {
                if (row.label === "Vehicle Price") row.value = `₹${calculatedVehicleTotal}`;
                if (row.label === "Additional Charges") row.value = `₹${additionalChargesTotal}`;
                if (row.label === "Grand Total") {
                    const hotelTotal = updatedSheet.sheetData.budget.hotelTotal;
                    row.value = `₹${hotelTotal + transportTotal}`;
                }
            }
            return row;
        });
        updatedSheet.sheetData.budget.transportTotal = transportTotal;
        updatedSheet.sheetData.budget.grandTotal = updatedSheet.sheetData.budget.hotelTotal + transportTotal;
        updatedSheet.sheetData.budget.additionalChargesTotal = additionalChargesTotal;
        setSheet(updatedSheet);
    };

    const addOther = () => {
        // As before
        const updatedSheet = { ...sheet };
        const transport = updatedSheet.sheetData.rows.find((r) => r.type === "transport");
        const tDetails = transport.transportDetails;
        if (!tDetails.others) tDetails.others = [];
        tDetails.others.push({ title: "", price: 0 });
        setSheet(updatedSheet);
    };

    const saveSheetEdits = async () => {
        // As before, but with new fields in reduce
        let updatedRows = sheet.sheetData.rows.map((row, i) => {
            if (editedRows[i] && row.type === "day") return editedRows[i];
            return row;
        });
        let hotelTotal = updatedRows
            .filter((r) => r.type === "day" && !r.isRemoved)
            .reduce((sum, r) => sum + (r.totalRoomPrice || 0) + (r.totalExtraPrice || 0), 0);
        const transportRow = updatedRows.find((r) => r.type === "transport");
        let calculatedVehicleTotal = 0;
        let additionalChargesTotal = 0;
        let transportTotal = 0;
        if (transportRow) {
            const tDetails = transportRow.transportDetails;
            calculatedVehicleTotal = tDetails.calculatedVehicleTotal || (tDetails.vehicleKm * tDetails.vehiclePricePerKm) || 0;
            if (tDetails.others?.length) {
                tDetails.others.forEach((o) => {
                    additionalChargesTotal += o.price || 0;
                });
            }
            transportTotal = calculatedVehicleTotal + additionalChargesTotal;
        }
        const grandTotal = hotelTotal + transportTotal;
        updatedRows = updatedRows.map((row) => {
            if (row.type === "summary") {
                if (row.label === "Total Hotel Prices") row.value = `₹${hotelTotal}`;
                if (row.label === "Vehicle Price") row.value = `₹${calculatedVehicleTotal}`;
                if (row.label === "Additional Charges") row.value = `₹${additionalChargesTotal}`;
                if (row.label === "Grand Total") row.value = `₹${grandTotal}`;
            }
            return row;
        });
        const updatedSheetData = {
            ...sheet.sheetData,
            rows: updatedRows,
            budget: {
                ...sheet.sheetData.budget,
                hotelTotal,
                transportTotal,
                grandTotal,
                additionalChargesTotal,
            },
        };
        const res = await fetch(`https://apitour.rajasthantouring.in/api/sheets/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sheetData: updatedSheetData }),
        });
        const saved = await res.json();
        setSheet(saved);
        initEdits(saved.sheetData.rows);
        setEditMode(false);
        alert("Saved Successfully");
    };

    if (loading || !sheet) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-center mt-2">Loading Sheet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full  rounded-xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5" />
                        <div>
                            <h2 className="font-bold text-xl">Booking Sheet</h2>
                            <p className="text-sm opacity-80">Booking ID: #{booking.bookingId || bookingId}</p>
                            <p className="text-sm opacity-80">Itinerary Amount :- ₹ {booking.bookingamount || booking.totalAmount || booking.totalamount}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/${booking.theme.link}/${booking._id}`)}
                            className="p-2 hover:bg-green-500 rounded transition-colors flex items-center gap-1"
                            title="Download Excel"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {isEditable && (
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="p-2 hover:bg-blue-500 rounded transition-colors"
                                title={editMode ? "Exit Edit Mode" : "Edit Sheet"}
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={downloadSheet}
                            className="p-2 hover:bg-green-500 rounded transition-colors flex items-center gap-1"
                            title="Download Excel"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500 rounded transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {/* TABLE - Updated columns */}
                <div className="flex-1 overflow-auto  bg-gray-50">
                    <div className="bg-white rounded-lg shadow-inner overflow-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px]  text-left">Date</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px] text-left">Place</th>
                                    <th className="border border-gray-300 px-4 py-3  min-w-[120px] text-left">Hotel Name</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px]  text-right">Room Price (₹)</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px] text-right">Room Count</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px] text-right">Total Room (₹)</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px] text-right">Extra Bed Count</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px] text-right">Extra Bed Price (₹)</th>
                                    <th className="border border-gray-300 px-3 py-3 min-w-[50px]  text-right">Total Extra (₹)</th>
                                    <th className="border border-gray-300 px-4 py-3 min-w-[50px] text-left">Reason/Notes</th>
                                    {editMode && <th className="border border-gray-300 min-w-[50px] px-3 py-3 text-center">Booked?</th>}
                                    {editMode && <th className="border border-gray-300 min-w-[50px] px-3 py-3 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sheet.sheetData.rows.map((row, index) => {
                                    if (row.type === "day") {
                                        const edited = editedRows[index] || row;
                                        if (edited.isRemoved) {
                                            return (
                                                <tr key={index} className="bg-red-50 hover:bg-red-100 transition-colors">
                                                    <td colSpan={editMode ? 12 : 10} className="border border-red-300 px-4 py-3 text-sm text-red-700 font-medium">
                                                        <span className="flex items-center gap-2">
                                                            <Eye className="w-4 h-4" />
                                                            Removed Hotel: {edited.hotelName} at {edited.place} on {edited.date} ({edited.mealType})
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        // Color logic: Sheet Modified (Green) for booking updates / edits, Modified (Red) for toggle
                                        const nameColorClass = edited.isSheetModified ? 'text-green-600' : edited.isModified ? 'text-red-600' : 'text-gray-900';
                                        const priceColorClass = edited.isSheetModified ? 'text-green-600' : edited.isModified ? 'text-red-600' : 'text-gray-900';
                                        return (
                                            <React.Fragment key={index}>
                                                <tr className={`hover:bg-gray-50 transition-colors ${edited.isNew ? 'bg-blue-50' : ''}`}>
                                                    <td className="border border-gray-300 px-3 py-3 text-sm font-medium">{edited.date}</td>
                                                    <td className="border  border-gray-300 px-3 py-3 text-sm">{edited.place}</td>
                                                    <td className={`border w-[300px] text-wrap  border-gray-300 px-4 py-3 font-semibold ${nameColorClass}`}>
                                                        {editMode ? (
                                                            <textarea
                                                                value={edited.hotelName || ""}
                                                                onChange={(e) => handleFieldChange(index, 'hotelName', e.target.value)}
                                                                className={`w-full bg-transparent outline-none border border-gray-300 focus:border-blue-500 px-2 py-1 rounded min-h-[50px] text-sm ${nameColorClass}`}
                                                                placeholder="Hotel name"
                                                                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                                            ></textarea>
                                                        ) : (
                                                            edited.hotelName || '-'
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-3 text-right font-mono">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.doubleRoomPrice || 0}
                                                                onChange={(e) => handleFieldChange(index, 'doubleRoomPrice', e.target.value)}
                                                                className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 px-1 py-1 text-right"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className={priceColorClass}>{`₹${edited.doubleRoomPrice || 0}`}</span>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-3 text-right font-mono">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.roomCount || 1}
                                                                onChange={(e) => handleFieldChange(index, 'roomCount', e.target.value)}
                                                                className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 px-1 py-1 text-right"
                                                                placeholder="1"
                                                            />
                                                        ) : (
                                                            <span className={priceColorClass}>{edited.roomCount || 1}</span>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-3 text-right font-mono">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.totalRoomPrice || 0}
                                                                onChange={(e) => handleFieldChange(index, 'totalRoomPrice', e.target.value)}
                                                                className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 px-1 py-1 text-right"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className={priceColorClass}>{`₹${edited.totalRoomPrice || 0}`}</span>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-3 text-right font-mono">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.extraBedCount || 0}
                                                                onChange={(e) => handleFieldChange(index, 'extraBedCount', e.target.value)}
                                                                className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 px-1 py-1 text-right"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className={priceColorClass}>{edited.extraBedCount || 0}</span>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-3 text-right font-mono">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.extraBedPrice || 0}
                                                                onChange={(e) => handleFieldChange(index, 'extraBedPrice', e.target.value)}
                                                                className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 px-1 py-1 text-right"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className={priceColorClass}>{`₹${edited.extraBedPrice || 0}`}</span>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-3 text-right font-mono">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.totalExtraPrice || 0}
                                                                onChange={(e) => handleFieldChange(index, 'totalExtraPrice', e.target.value)}
                                                                className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-blue-500 px-1 py-1 text-right"
                                                                placeholder="0"
                                                            />
                                                        ) : (
                                                            <span className={priceColorClass}>{`₹${edited.totalExtraPrice || 0}`}</span>
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={edited.hotelNotes || ""}
                                                                onChange={(e) => handleNotesChange(index, e.target.value)}
                                                                className="w-full outline-none text-gray-700 px-1 py-1 border-b border-gray-300 focus:border-blue-500"
                                                                placeholder="Add reason/notes..."
                                                            />
                                                        ) : (
                                                            <span className="text-gray-700">{edited.hotelNotes || '-'}</span>
                                                        )}
                                                    </td>
                                                    {editMode && (
                                                        <td className="border border-gray-300 px-3 py-3 text-center">
                                                            <label className="flex items-center justify-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={edited.isModified}
                                                                    onChange={() => handleModifiedToggle(index)}
                                                                    className="mr-1"
                                                                />

                                                            </label>
                                                        </td>
                                                    )}
                                                    {editMode && (
                                                        <td className="border border-gray-300 px-3 py-3 text-center">
                                                            <div className="flex gap-1 justify-center">
                                                                <button
                                                                    onClick={() => togglePrevious(index)}
                                                                    className={`p-1 rounded transition-colors ${(edited.isModified || edited.isSheetModified) ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400'}`}
                                                                    title={(edited.isModified || edited.isSheetModified) ? "View Previous Hotels" : "No Changes"}
                                                                    disabled={!(edited.isModified || edited.isSheetModified)}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>

                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                                {/* Previous Hotels Modal/Popup if shown */}
                                                {showPrevious[index] && edited.previousHotels.length > 0 && (
                                                    <tr className="bg-yellow-50">
                                                        <td colSpan={editMode ? 12 : 10} className="border border-gray-300 px-4 py-2">
                                                            <div className="text-sm text-gray-700">
                                                                <strong>Previous Hotels:</strong>
                                                                <ul className="list-disc ml-4 mt-1">
                                                                    {edited.previousHotels.map((prevHotel, pIdx) => (
                                                                        <li key={pIdx}>{prevHotel.name} - ₹{prevHotel.price} ({prevHotel.mealType})</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }
                                    if (row.type === "transport") {
                                        const tDetails = row.transportDetails;
                                        const calculatedTotal = tDetails.calculatedVehicleTotal || (tDetails.vehicleKm * tDetails.vehiclePricePerKm) || 0;
                                        return (
                                            <React.Fragment key={index}>
                                                <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                                                    <td colSpan={editMode ? 12 : 10} className="border border-gray-300 px-4 py-3 font-bold text-lg text-indigo-800">
                                                        Transport Details
                                                    </td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3 font-medium">Total Vehicle KM</td>
                                                    <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={tDetails.vehicleKm || 0}
                                                                onChange={(e) => updateTransport("vehicleKm", e.target.value)}
                                                                className="w-full outline-none border-b border-gray-300 focus:border-blue-500 px-2 py-1"
                                                                placeholder="e.g., 200"
                                                            />
                                                        ) : (
                                                            `${tDetails.vehicleKm || 0} km`
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3 font-medium">Price per KM (₹)</td>
                                                    <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={tDetails.vehiclePricePerKm || 0}
                                                                onChange={(e) => updateTransport("vehiclePricePerKm", e.target.value)}
                                                                className="w-full outline-none border-b border-gray-300 focus:border-blue-500 px-2 py-1"
                                                                placeholder="e.g., 10"
                                                            />
                                                        ) : (
                                                            `₹${tDetails.vehiclePricePerKm || 0}/km`
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr className="bg-white">
                                                    <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3 font-medium text-green-700">Calculated Vehicle Cost (₹)</td>
                                                    <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3 font-bold text-green-700 text-right">
                                                        {editMode ? (
                                                            <input
                                                                type="text"
                                                                value={calculatedTotal}
                                                                onChange={(e) => updateCalculatedManual(parseFloat(e.target.value) || 0)}
                                                                className="w-full outline-none border-b border-gray-300 focus:border-blue-500 px-2 py-1 text-right"
                                                            />
                                                        ) : (
                                                            `₹${calculatedTotal}`
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr className="bg-indigo-50">
                                                    <td colSpan={editMode ? 12 : 10} className="border border-gray-300 px-4 py-3 font-semibold text-indigo-700">
                                                        Additional Charges
                                                    </td>
                                                </tr>
                                                {tDetails.others?.map((o, i) => (
                                                    <tr key={i} className="bg-white">
                                                        <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3">
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    value={o.title || ""}
                                                                    onChange={(e) => updateOther(i, "title", e.target.value)}
                                                                    className="w-full outline-none border-b border-gray-300 focus:border-blue-500 px-2 py-1"
                                                                    placeholder="Charge title..."
                                                                />
                                                            ) : (
                                                                o.title || '-'
                                                            )}
                                                        </td>
                                                        <td colSpan={editMode ? 6 : 5} className="border border-gray-300 px-4 py-3 text-right">
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    value={o.price || 0}
                                                                    onChange={(e) => updateOther(i, "price", e.target.value)}
                                                                    className="w-full outline-none border-b border-gray-300 focus:border-blue-500 px-2 py-1 text-right"
                                                                    placeholder="0"
                                                                />
                                                            ) : (
                                                                `₹${o.price || 0}`
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {editMode && (
                                                    <tr>
                                                        <td colSpan={editMode ? 12 : 10} className="border border-gray-300 py-3 text-center">
                                                            <button
                                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors shadow-md"
                                                                onClick={addOther}
                                                            >
                                                                <Plus size={16} /> Add Additional Charge
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }
                                    if (row.type === "summary") {
                                        return (
                                            <tr key={index} className=" text-black font-bold">
                                                <td colSpan={editMode ? 7 : 6} className="border border-gray-300 px-4 py-3 text-right">
                                                    {row.label}
                                                </td>
                                                <td colSpan={editMode ? 5 : 4} className="border border-gray-300 px-4 py-3 text-right text-2xl">
                                                    {row.value}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return null;
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* FOOTER - Updated legend */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 flex justify-between items-center border-t border-gray-300">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md shadow-sm">
                            <div className="w-4 h-4 bg-gray-800 rounded"></div>
                            <span className="text-gray-700 font-medium">Original (Black)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md shadow-sm">
                            <div className="w-4 h-4 bg-red-600 rounded"></div>
                            <span className="text-gray-700 font-medium">Manual Modified (Red)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md shadow-sm">
                            <div className="w-4 h-4 bg-green-600 rounded"></div>
                            <span className="text-gray-700 font-medium">Booking Updated (Green)</span>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md shadow-sm">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-gray-700 font-medium">Removed (Red BG)</span>
                        </div>
                    </div>
                    <div className="flex gap-3">

                        {editMode && (
                            <>
                                <button
                                    onClick={saveSheetEdits}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure? This will clear all saved data and regenerate the sheet.")) {
                                    // 🔥 Now run the regenerate function
                                    generateSheet(bookingId);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-xs text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
                        >
                            <FileSpreadsheet size={18} /> Regenerate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSheetViewer;
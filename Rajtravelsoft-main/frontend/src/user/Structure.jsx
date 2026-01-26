// UserForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import TourInclusionExclusionForm from "../componate/TourInclusionExclusionForm";
import ThemeForm from "../componate/ThemeForm";
import Adminachivement from "../componate/Adminachivement";
import Homepagecreate from "../componate/Homepagecreate";
import CompanyInfoManager from "./CompanyInfoManager";
import { toast } from "react-toastify";
import { FaEdit } from "react-icons/fa";
import { Delete } from "lucide-react";
import { MdDelete } from "react-icons/md";
export default function UserForm() {
    const [form, setForm] = useState({
        contacts: [{
            name: "",
            emails: [""],
            mobiles: [""],
            addresses: [],
            socialLinks: { facebook: "", instagram: "", youtube: "", website: "" }
        }],
        addresses: [{ street: "", area: "", city: "", state: "", pincode: "", landmark: "" }],
        socialLinks: { facebook: "",  instagram: "",  youtube: "", website: "" },
        logo: null,
        bankDetails: [{ bankName: "", ifscCode: "", accountName: "", accountNumber: "", accountType: "", logoUrl: null }],
        paymentIds: [{ type: "", value: "", receiverName: "", logoUrl: null, qrImageUrl: null }],
        sosNumber: "",
    });
    const [userId, setUserId] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [bankLogoFiles, setBankLogoFiles] = useState([]);
    const [walletLogoFiles, setWalletLogoFiles] = useState([]);
    const [qrFiles, setQrFiles] = useState([]);
    const [warning, setWarning] = useState(null);
    // Editing states for each section
    const [editingContacts, setEditingContacts] = useState(new Set());
    const [editingAddresses, setEditingAddresses] = useState(new Set());
    const [editingSocialLinks, setEditingSocialLinks] = useState(false);
    const [editingBankDetails, setEditingBankDetails] = useState(new Set());
    const [editingPaymentIds, setEditingPaymentIds] = useState(new Set());
    const [editingLogo, setEditingLogo] = useState(false);
    const [editingSos, setEditingSos] = useState(false);
    const defaultContact = {
        name: "",
        emails: [""],
        mobiles: [""],
        addresses: [],
        socialLinks: { facebook: "",  instagram: "",  youtube: "", website: "" }
    };
    const defaultAddress = { street: "", area: "", city: "", state: "", pincode: "", landmark: "" };
    const defaultSocialLinks = { facebook: "",  instagram: "", youtube: "", website: "" };
    const defaultBank = { bankName: "", ifscCode: "", accountName: "", accountNumber: "", accountType: "", logoUrl: null };
    const defaultPayment = { type: "", value: "", mobileNumber: "", receiverName: "", logoUrl: null, qrImageUrl: null };
    // Fetch existing user on mount
    const fetchUser = async () => {
        try {
            const response = await axios.get("https://apitour.rajasthantouring.in/api/structure");
            if (response.data) {
                const data = response.data;
                setForm({
                    contacts: data.contacts || [defaultContact],
                    addresses: data.addresses || [defaultAddress],
                    socialLinks: data.socialLinks || defaultSocialLinks,
                    logo: data.logo,
                    bankDetails: data.bankDetails || [defaultBank],
                    paymentIds: data.paymentIds || [defaultPayment],
                    sosNumber: data.sosNumber || "",
                });
                setUserId(data._id);
                setBankLogoFiles(new Array(data.bankDetails?.length || 1).fill(null));
                setWalletLogoFiles(new Array(data.paymentIds?.length || 1).fill(null));
                setQrFiles(new Array(data.paymentIds?.length || 1).fill(null));
                // Reset editing states
                setEditingContacts(new Set());
                setEditingAddresses(new Set());
                setEditingSocialLinks(false);
                setEditingBankDetails(new Set());
                setEditingPaymentIds(new Set());
                setEditingLogo(false);
                setEditingSos(false);
            }
        } catch (err) {
            console.error("Error fetching user:", err);
        }
    };
    useEffect(() => {
        fetchUser();
    }, []);
    const getImageSrc = (url) => {
        return url ? (url.startsWith("/uploads") ? `https://apitour.rajasthantouring.in${url}` : url) : null;
    };
    const buildFormDataForSection = (section) => {
        const formData = new FormData();
        switch (section) {
            case 'logo':
                if (logoFile) formData.append("logo", logoFile);
                break;
            case 'sosNumber':
                formData.append("sosNumber", form.sosNumber);
                break;
            case 'contacts':
                // Send only name, emails, mobiles for contacts, addresses and socialLinks are handled separately
                const contactsToSend = form.contacts.map(contact => ({
                    name: contact.name,
                    emails: contact.emails,
                    mobiles: contact.mobiles
                }));
                formData.append("contacts", JSON.stringify(contactsToSend));
                break;
            case 'addresses':
                formData.append("addresses", JSON.stringify(form.addresses));
                break;
            case 'socialLinks':
                formData.append("socialLinks", JSON.stringify(form.socialLinks));
                break;
            case 'bankDetails':
                const bankDetailsToSend = form.bankDetails.map((bank, index) => ({
                    ...bank,
                    newBankLogo: !!bankLogoFiles[index],
                    logoUrl: bankLogoFiles[index] ? undefined : bank.logoUrl,
                }));
                formData.append("bankDetails", JSON.stringify(bankDetailsToSend));
                bankLogoFiles.forEach((file) => {
                    if (file) formData.append("bankLogos", file);
                });
                break;
            case 'paymentIds':
                const paymentIdsToSend = form.paymentIds.map((payment, index) => ({
                    ...payment,
                    newWalletLogo: !!walletLogoFiles[index],
                    newQrImage: !!qrFiles[index],
                    logoUrl: walletLogoFiles[index] ? undefined : payment.logoUrl,
                    qrImageUrl: qrFiles[index] ? undefined : payment.qrImageUrl,
                }));
                formData.append("paymentIds", JSON.stringify(paymentIdsToSend));
                walletLogoFiles.forEach((file) => {
                    if (file) formData.append("walletLogos", file);
                });
                qrFiles.forEach((file) => {
                    if (file) formData.append("qrImages", file);
                });
                break;
            default:
                break;
        }
        return formData;
    };
    const buildFullFormData = () => {
        const formData = new FormData();
        // For full submit, send contacts without addresses/social, addresses and social separately
        const contactsToSend = form.contacts.map(contact => ({
            name: contact.name,
            emails: contact.emails,
            mobiles: contact.mobiles
        }));
        formData.append("contacts", JSON.stringify(contactsToSend));
        formData.append("addresses", JSON.stringify(form.addresses));
        formData.append("socialLinks", JSON.stringify(form.socialLinks));
        formData.append("sosNumber", form.sosNumber);
        const bankDetailsToSend = form.bankDetails.map((bank, index) => ({
            ...bank,
            newBankLogo: !!bankLogoFiles[index],
            logoUrl: bankLogoFiles[index] ? undefined : bank.logoUrl,
        }));
        formData.append("bankDetails", JSON.stringify(bankDetailsToSend));
        const paymentIdsToSend = form.paymentIds.map((payment, index) => ({
            ...payment,
            newWalletLogo: !!walletLogoFiles[index],
            newQrImage: !!qrFiles[index],
            logoUrl: walletLogoFiles[index] ? undefined : payment.logoUrl,
            qrImageUrl: qrFiles[index] ? undefined : payment.qrImageUrl,
        }));
        formData.append("paymentIds", JSON.stringify(paymentIdsToSend));
        if (logoFile) formData.append("logo", logoFile);
        bankLogoFiles.forEach((file) => {
            if (file) formData.append("bankLogos", file);
        });
        walletLogoFiles.forEach((file) => {
            if (file) formData.append("walletLogos", file);
        });
        qrFiles.forEach((file) => {
            if (file) formData.append("qrImages", file);
        });
        return formData;
    };
    const saveSection = async (section) => {
        if (!userId) {
            toast.error("Please save the structure first to enable section saves.");
            return;
        }
        const formData = buildFormDataForSection(section);
        if (formData.entries().next().done) {
            toast.info("No changes to save.");
            return;
        }
        try {
            await axios.put(`https://apitour.rajasthantouring.in/api/structure/${userId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} saved!`);
            // Refetch to sync updated data (e.g., new image URLs from server)
            await fetchUser();
            // Clear temporary files after successful save
            if (section === 'logo' && logoFile) setLogoFile(null);
            if (section === 'bankDetails') {
                setBankLogoFiles(new Array(form.bankDetails.length).fill(null));
            }
            if (section === 'paymentIds') {
                setWalletLogoFiles(new Array(form.paymentIds.length).fill(null));
                setQrFiles(new Array(form.paymentIds.length).fill(null));
            }
        } catch (err) {
            toast.error(`Error saving ${section}: ${err.response?.data?.error || err.message}`);
        }
    };
    const handleFullSubmit = async (e) => {
        e.preventDefault();
        const formData = buildFullFormData();
        if (formData.entries().next().done) {
            toast.info("No changes to save.");
            return;
        }
        try {
            let response;
            if (!userId) {
                response = await axios.post("https://apitour.rajasthantouring.in/api/structure", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setUserId(response.data._id);
                toast.success("Structure created!");
            } else {
                response = await axios.put(`https://apitour.rajasthantouring.in/api/structure/${userId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Structure updated!");
            }
            // Refetch to sync
            await fetchUser();
        } catch (err) {
            toast.error(`Error: ${err.response?.data?.error || err.message}`);
        }
    };
    const handleChange = (e, field, contactIdx, subfield, innerIdx, innerSubfield) => {
        if (field === "sosNumber") {
            setForm({ ...form, sosNumber: e.target.value });
            return;
        }
        if (field === "contacts") {
            const contacts = [...form.contacts];
            if (["emails", "mobiles"].includes(subfield)) {
                const arr = [...contacts[contactIdx][subfield]];
                arr[innerIdx] = e.target.value;
                contacts[contactIdx][subfield] = arr;
            } else {
                contacts[contactIdx][subfield] = e.target.value;
            }
            setForm({ ...form, contacts });
        } else if (field === "addresses") {
            const newAddresses = [...form.addresses];
            newAddresses[innerIdx][innerSubfield] = e.target.value;
            const updatedContacts = form.contacts.map(contact => ({
                ...contact,
                addresses: [...newAddresses]
            }));
            setForm({ ...form, addresses: newAddresses, contacts: updatedContacts });
        } else if (field === "socialLinks") {
            const newSocialLinks = { ...form.socialLinks, [innerSubfield]: e.target.value };
            const updatedContacts = form.contacts.map(contact => ({
                ...contact,
                socialLinks: { ...newSocialLinks }
            }));
            setForm({ ...form, socialLinks: newSocialLinks, contacts: updatedContacts });
        } else if (field === "bankDetails") {
            const arr = [...form.bankDetails];
            if (subfield === "logoUrl") {
                const newBankLogoFiles = [...bankLogoFiles];
                newBankLogoFiles[innerIdx] = e.target.files[0];
                setBankLogoFiles(newBankLogoFiles);
                arr[innerIdx][subfield] = e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null;
            } else {
                arr[innerIdx][subfield] = e.target.value;
            }
            setForm({ ...form, bankDetails: arr });
        } else if (field === "paymentIds") {
            const arr = [...form.paymentIds];
            if (subfield === "logoUrl") {
                const newWalletLogoFiles = [...walletLogoFiles];
                newWalletLogoFiles[innerIdx] = e.target.files[0];
                setWalletLogoFiles(newWalletLogoFiles);
                arr[innerIdx][subfield] = e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null;
            } else if (subfield === "qrImageUrl") {
                const newQrFiles = [...qrFiles];
                newQrFiles[innerIdx] = e.target.files[0];
                setQrFiles(newQrFiles);
                arr[innerIdx][subfield] = e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null;
            } else {
                arr[innerIdx][subfield] = e.target.value;
            }
            setForm({ ...form, paymentIds: arr });
        } else if (field === "logo") {
            setLogoFile(e.target.files[0]);
            setForm({ ...form, logo: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null });
        }
    };
    const addField = (field, contactIdx = null, innerField = null) => {
        let newIndex;
        const isSubAdd = innerField && ["emails", "mobiles"].includes(innerField);
        if (field === "contacts") {
            if (innerField === "emails") {
                const contacts = [...form.contacts];
                contacts[contactIdx].emails = [...contacts[contactIdx].emails, ""];
                setForm({ ...form, contacts });
            } else if (innerField === "mobiles") {
                const contacts = [...form.contacts];
                contacts[contactIdx].mobiles = [...contacts[contactIdx].mobiles, ""];
                setForm({ ...form, contacts });
            } else {
                const newContact = {
                    ...defaultContact,
                    addresses: [...form.addresses],
                    socialLinks: { ...form.socialLinks }
                };
                setForm({ ...form, contacts: [...form.contacts, newContact] });
                newIndex = form.contacts.length;
                setEditingContacts(prev => new Set([...prev, newIndex]));
            }
        } else if (field === "addresses") {
            const newAddresses = [...form.addresses, defaultAddress];
            const updatedContacts = form.contacts.map(contact => ({
                ...contact,
                addresses: [...newAddresses]
            }));
            setForm({ ...form, addresses: newAddresses, contacts: updatedContacts });
            newIndex = newAddresses.length - 1;
            setEditingAddresses(prev => new Set([...prev, newIndex]));
        } else if (field === "bankDetails") {
            setForm({ ...form, bankDetails: [...form.bankDetails, defaultBank] });
            setBankLogoFiles([...bankLogoFiles, null]);
            newIndex = form.bankDetails.length;
            setEditingBankDetails(prev => new Set([...prev, newIndex]));
        } else if (field === "paymentIds") {
            setForm({ ...form, paymentIds: [...form.paymentIds, defaultPayment] });
            setWalletLogoFiles([...walletLogoFiles, null]);
            setQrFiles([...qrFiles, null]);
            newIndex = form.paymentIds.length;
            setEditingPaymentIds(prev => new Set([...prev, newIndex]));
        }
    };
    const removeField = (field, contactIdx = null, innerIdx = null, innerField = null) => {
        const isSubRemove = innerField && ["emails", "mobiles"].includes(innerField);
        if (field === "contacts") {
            if (["emails", "mobiles"].includes(innerField) && form.contacts[contactIdx][innerField].length > 1) {
                const contacts = [...form.contacts];
                contacts[contactIdx][innerField] = contacts[contactIdx][innerField].filter((_, index) => index !== innerIdx);
                setForm({ ...form, contacts });
            } else if (form.contacts.length > 1) {
                const newEditing = new Set(editingContacts);
                newEditing.delete(contactIdx);
                setEditingContacts(newEditing);
                setForm({ ...form, contacts: form.contacts.filter((_, index) => index !== contactIdx) });
            }
        } else if (field === "addresses" && form.addresses.length > 1) {
            const newAddresses = form.addresses.filter((_, index) => index !== innerIdx);
            const newEditing = new Set(editingAddresses);
            newEditing.delete(innerIdx);
            setEditingAddresses(newEditing);
            const updatedContacts = form.contacts.map(contact => ({
                ...contact,
                addresses: [...newAddresses]
            }));
            setForm({ ...form, addresses: newAddresses, contacts: updatedContacts });
        } else if (["bankDetails", "paymentIds"].includes(field) && form[field].length > 1) {
            if (field === "bankDetails") {
                const newEditing = new Set(editingBankDetails);
                newEditing.delete(innerIdx);
                setEditingBankDetails(newEditing);
                const newBankLogoFiles = bankLogoFiles.filter((_, index) => index !== innerIdx);
                setBankLogoFiles(newBankLogoFiles);
            } else if (field === "paymentIds") {
                const newEditing = new Set(editingPaymentIds);
                newEditing.delete(innerIdx);
                setEditingPaymentIds(newEditing);
                const newWalletLogoFiles = walletLogoFiles.filter((_, index) => index !== innerIdx);
                const newQrFiles = qrFiles.filter((_, index) => index !== innerIdx);
                setWalletLogoFiles(newWalletLogoFiles);
                setQrFiles(newQrFiles);
            }
            setForm({ ...form, [field]: form[field].filter((_, index) => index !== innerIdx) });
        }
    };
    // Toggle functions for each section
    const toggleEditContact = (contactIdx) => {
        const newEditing = new Set(editingContacts);
        if (newEditing.has(contactIdx)) {
            newEditing.delete(contactIdx);
        } else {
            newEditing.add(contactIdx);
        }
        setEditingContacts(newEditing);
    };
    const toggleEditAddress = (addrIdx) => {
        const newEditing = new Set(editingAddresses);
        if (newEditing.has(addrIdx)) {
            newEditing.delete(addrIdx);
        } else {
            newEditing.add(addrIdx);
        }
        setEditingAddresses(newEditing);
    };
    const toggleEditSocialLinks = () => {
        setEditingSocialLinks(!editingSocialLinks);
    };
    const toggleEditBank = (bankIdx) => {
        const newEditing = new Set(editingBankDetails);
        if (newEditing.has(bankIdx)) {
            newEditing.delete(bankIdx);
        } else {
            newEditing.add(bankIdx);
        }
        setEditingBankDetails(newEditing);
    };
    const toggleEditPayment = (paymentIdx) => {
        const newEditing = new Set(editingPaymentIds);
        if (newEditing.has(paymentIdx)) {
            newEditing.delete(paymentIdx);
        } else {
            newEditing.add(paymentIdx);
        }
        setEditingPaymentIds(newEditing);
    };
    const toggleEditLogo = () => {
        setEditingLogo(!editingLogo);
    };
    const toggleEditSos = () => {
        setEditingSos(!editingSos);
    };
    // Save functions (save section and exit edit for specific item)
    const saveContact = async (contactIdx) => {
        await saveSection('contacts');
        const newEditing = new Set(editingContacts);
        newEditing.delete(contactIdx);
        setEditingContacts(newEditing);
    };
    const saveAddress = async (addrIdx) => {
        await saveSection('addresses');
        const newEditing = new Set(editingAddresses);
        newEditing.delete(addrIdx);
        setEditingAddresses(newEditing);
    };
    const saveSocialLinks = async () => {
        await saveSection('socialLinks');
        setEditingSocialLinks(false);
    };
    const saveBank = async (bankIdx) => {
        await saveSection('bankDetails');
        const newEditing = new Set(editingBankDetails);
        newEditing.delete(bankIdx);
        setEditingBankDetails(newEditing);
    };
    const savePayment = async (paymentIdx) => {
        await saveSection('paymentIds');
        const newEditing = new Set(editingPaymentIds);
        newEditing.delete(paymentIdx);
        setEditingPaymentIds(newEditing);
    };
    const saveLogo = async () => {
        await saveSection('logo');
        setEditingLogo(false);
    };
    const saveSos = async () => {
        await saveSection('sosNumber');
        setEditingSos(false);
    };
    // Cancel functions (exit edit without saving)
    const cancelEditContact = (contactIdx) => {
        const newEditing = new Set(editingContacts);
        newEditing.delete(contactIdx);
        setEditingContacts(newEditing);
    };
    const cancelEditAddress = (addrIdx) => {
        const newEditing = new Set(editingAddresses);
        newEditing.delete(addrIdx);
        setEditingAddresses(newEditing);
    };
    const cancelEditSocialLinks = () => {
        setEditingSocialLinks(false);
    };
    const cancelEditBank = (bankIdx) => {
        const newEditing = new Set(editingBankDetails);
        newEditing.delete(bankIdx);
        setEditingBankDetails(newEditing);
    };
    const cancelEditPayment = (paymentIdx) => {
        const newEditing = new Set(editingPaymentIds);
        newEditing.delete(paymentIdx);
        setEditingPaymentIds(newEditing);
    };
    const cancelEditLogo = () => {
        setEditingLogo(false);
        setLogoFile(null);
    };
    const cancelEditSos = () => {
        setEditingSos(false);
    };
    const handleDelete = () => {
        setWarning({ message: "Are you sure you want to delete this Structure?", id: userId });
    };
    const confirmDelete = async () => {
        setWarning(null);
        if (!userId) return;
        try {
            await axios.delete(`https://apitour.rajasthantouring.in/api/structure/${userId}`);
            setForm({
                contacts: [defaultContact],
                addresses: [defaultAddress],
                socialLinks: defaultSocialLinks,
                logo: null,
                bankDetails: [defaultBank],
                paymentIds: [defaultPayment],
                sosNumber: "",
            });
            setUserId(null);
            setLogoFile(null);
            setBankLogoFiles([null]);
            setWalletLogoFiles([null]);
            setQrFiles([null]);
            setEditingContacts(new Set());
            setEditingAddresses(new Set());
            setEditingSocialLinks(false);
            setEditingBankDetails(new Set());
            setEditingPaymentIds(new Set());
            setEditingLogo(false);
            setEditingSos(false);
            toast.success("Structure deleted!");
        } catch (err) {
            toast.error(`Error: ${err.response?.data?.error || err.message}`);
        }
    };
    const buttonClass =
        "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors inline-flex items-center justify-center";
    const smallButtonClass =
        "px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium transition-colors text-sm inline-flex items-center justify-center";
    return (
        <div className="min-h-screen w-full flex flex-col gap-4 px-2 py-3 bg-gray-50">
            {warning && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white text-yellow-800 p-4 rounded-lg shadow-lg max-w-sm w-full text-center">
                        <p className="mb-3">{warning.message}</p>
                        <div className="flex justify-center gap-3">
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition h-10 w-16"
                                onClick={confirmDelete}
                            >
                                Yes
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition h-10 w-16"
                                onClick={() => setWarning(null)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="w-full mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-xl font-bold text-blue-600 mb-4 text-left">Structure</h2>
                <form onSubmit={handleFullSubmit} className="space-y-4">
                    {/* Company Logo Section */}
                    <div className="bg-white border w-full border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                        <div className="flex-shrink-0 w-full">
                            <div className="flex flex-wrap justify-between items-center mb-2 w-full">
                                <h3 className="text-lg font-bold text-blue-600">Company Logo</h3>
                                <div className="flex gap-2">
                                    {editingLogo ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={saveLogo}
                                                className={smallButtonClass.replace('w-20', 'w-16')}
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEditLogo}
                                                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-16"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={toggleEditLogo}
                                            className={smallButtonClass.replace('w-20', 'w-16')}
                                        >
                                            <FaEdit />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {form.logo && (
                                <img
                                    src={getImageSrc(form.logo)}
                                    alt="Logo"
                                    className="h-16 w-16 object-contain rounded-md border border-gray-300 flex-shrink-0"
                                />
                            )}
                        </div>
                        <div className="flex">
                            {editingLogo ? (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleChange(e, "logo")}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                                />
                            ) : (
                                <p className="text-sm text-gray-700"></p>
                            )}
                        </div>
                    </div>
                    {/* Staff Contact Information Section */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-blue-600">Staff Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {form.contacts.map((contact, contactIdx) => {
                                const isEditing = editingContacts.has(contactIdx);
                                return (
                                    <div key={contactIdx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex flex-wrap justify-between items-center mb-2">
                                            <h4 className="text-base font-semibold text-gray-800">Contact {contactIdx + 1}</h4>
                                            <div className="flex gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveContact(contactIdx)}
                                                            className={smallButtonClass}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelEditContact(contactIdx)}
                                                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-20"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEditContact(contactIdx)}
                                                        className={smallButtonClass}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                )}
                                                {form.contacts.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeField("contacts", contactIdx)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium transition-colors text-sm inline-block"
                                                    >
                                                    <MdDelete/>
                                           
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            // Edit mode: Show inputs
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                                    <input
                                                        placeholder="Enter name"
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                        value={contact.name}
                                                        onChange={(e) => handleChange(e, "contacts", contactIdx, "name")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Emails</label>
                                                    <div className="space-y-1">
                                                        {contact.emails.map((email, idx) => (
                                                            <div key={idx} className="flex items-center space-x-1">
                                                                <input
                                                                    placeholder="Enter email"
                                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                    value={email}
                                                                    onChange={(e) => handleChange(e, "contacts", contactIdx, "emails", idx)}
                                                                />
                                                                {contact.emails.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeField("contacts", contactIdx, idx, "emails")}
                                                                        className="text-red-500 text-xs font-medium hover:text-red-700"
                                                                    >
                                                                    <MdDelete/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => addField("contacts", contactIdx, "emails")}
                                                            className="text-blue-600 text-xs font-medium hover:text-blue-800"
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Mobiles</label>
                                                      <p className="text-red-500 text-sm mt-1 font-medium">
    ⚠️ Please enter your country code with number (e.g. +91 1234567890)
  </p>
                                                    <div className="space-y-1">
                                                        {contact.mobiles.map((mob, idx) => (
                                                            <div key={idx} className="flex items-center space-x-1">
                                                                <input
                                                                    placeholder=" +91 Enter mobile number "
                                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                    value={mob}
                                                                    onChange={(e) => handleChange(e, "contacts", contactIdx, "mobiles", idx)}


                                                                    
                                                                />
                                                                {contact.mobiles.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeField("contacts", contactIdx, idx, "mobiles")}
                                                                        className="text-red-500 text-xs font-medium hover:text-red-700"
                                                                    >
                                                                    <MdDelete/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => addField("contacts", contactIdx, "mobiles")}
                                                            className="text-blue-600 text-xs font-medium hover:text-blue-800"
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // View mode: Show display text including addresses and social links
                                            <div className="space-y-2 text-sm text-gray-700">
                                                <div><strong>Name:</strong> {contact.name || 'N/A'}</div>
                                                <div><strong>Emails:</strong> {contact.emails.join(', ') || 'N/A'}</div>
                                                <div><strong>Mobiles:</strong> {contact.mobiles.join(', ') || 'N/A'}</div>
                                              
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => addField("contacts")}
                                className={buttonClass}
                            >
                                + Add
                            </button>
                            <button
                                type="button"
                                onClick={() => saveSection('contacts')}
                                className={buttonClass}
                                disabled={!userId}
                            >
                                Save All
                            </button>
                        </div>
                    </div>
                    {/* Company Addresses Section */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-blue-600">Company Addresses</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {form.addresses.map((addr, idx) => {
                                const isEditing = editingAddresses.has(idx);
                                return (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex flex-wrap justify-between items-center mb-2">
                                            <h4 className="text-base font-semibold text-gray-800">Address {idx + 1}</h4>
                                            <div className="flex gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveAddress(idx)}
                                                            className={smallButtonClass}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelEditAddress(idx)}
                                                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-20"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEditAddress(idx)}
                                                        className={smallButtonClass}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                )}
                                                {form.addresses.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeField("addresses", null, idx)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium transition-colors text-sm inline-block"
                                                    >
                                                    <MdDelete/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            // Edit mode
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 space-y-2">
                                                <input
                                                    placeholder="Street"
                                                    value={addr.street}
                                                    onChange={(e) => handleChange(e, "addresses", null, null, idx, "street")}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="Area"
                                                    value={addr.area}
                                                    onChange={(e) => handleChange(e, "addresses", null, null, idx, "area")}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="City"
                                                    value={addr.city}
                                                    onChange={(e) => handleChange(e, "addresses", null, null, idx, "city")}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="State"
                                                    value={addr.state}
                                                    onChange={(e) => handleChange(e, "addresses", null, null, idx, "state")}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="Pincode"
                                                    value={addr.pincode}
                                                    onChange={(e) => handleChange(e, "addresses", null, null, idx, "pincode")}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="Landmark"
                                                    value={addr.landmark}
                                                    onChange={(e) => handleChange(e, "addresses", null, null, idx, "landmark")}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                        ) : (
                                            // View mode
                                            <div className="space-y-2 text-sm text-gray-700">
                                                <div><strong>Street:</strong> {addr.street || 'N/A'}</div>
                                                <div><strong>Area:</strong> {addr.area || 'N/A'}</div>
                                                <div><strong>City:</strong> {addr.city || 'N/A'}</div>
                                                <div><strong>State:</strong> {addr.state || 'N/A'}</div>
                                                <div><strong>Pincode:</strong> {addr.pincode || 'N/A'}</div>
                                                <div><strong>Landmark:</strong> {addr.landmark || 'N/A'}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => addField("addresses")}
                                className={buttonClass}
                            >
                                + Add
                            </button>
                            <button
                                type="button"
                                onClick={() => saveSection('addresses')}
                                className={buttonClass}
                                disabled={!userId}
                            >
                                Save All
                            </button>
                        </div>
                    </div>
                    {/* Company Social Links Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-blue-600">Company Social Links</h3>
                            <div className="flex gap-2">
                                {editingSocialLinks ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={saveSocialLinks}
                                            className={smallButtonClass}
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditSocialLinks}
                                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-20"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={toggleEditSocialLinks}
                                        className={smallButtonClass}
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            {editingSocialLinks ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.keys(form.socialLinks).map((key) => (
                                        <div key={key}>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{key}</label>
                                            <input
                                                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                                                value={form.socialLinks[key]}
                                                onChange={(e) => handleChange(e, "socialLinks", null, null, null, key)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm text-gray-700">
                                    {Object.keys(form.socialLinks).map((key) => (
                                        <div key={key} className="capitalize">
                                            <strong>{key}:</strong> {form.socialLinks[key] || 'N/A'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* SOS Number Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-blue-600">SOS Number</h3>
                            <div className="flex gap-2">
                                {editingSos ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={saveSos}
                                            className={smallButtonClass}
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditSos}
                                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-20"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={toggleEditSos}
                                        className={smallButtonClass}
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            {editingSos ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">SOS Number</label>
                                    <input
                                        placeholder="Enter SOS Number"
                                        value={form.sosNumber}
                                        onChange={(e) => handleChange(e, "sosNumber")}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div><strong>SOS Number:</strong> {form.sosNumber || 'N/A'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Bank Details Section */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-blue-600">Bank Details</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {form.bankDetails.map((bank, idx) => {
                                const isEditing = editingBankDetails.has(idx);
                                return (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex flex-wrap justify-between items-center mb-2">
                                            <h4 className="text-base font-semibold text-gray-800">Bank Account {idx + 1}</h4>
                                            <div className="flex gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveBank(idx)}
                                                            className={smallButtonClass}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelEditBank(idx)}
                                                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-20"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEditBank(idx)}
                                                        className={smallButtonClass}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                )}
                                                {form.bankDetails.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeField("bankDetails", null, idx)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium transition-colors text-sm inline-block"
                                                    >
                                                    <MdDelete/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            // Edit mode
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 space-y-2">
                                                <input
                                                    placeholder="Bank Name"
                                                    value={bank.bankName}
                                                    onChange={(e) => handleChange(e, "bankDetails", null, "bankName", idx)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="IFSC Code"
                                                    value={bank.ifscCode}
                                                    onChange={(e) => handleChange(e, "bankDetails", null, "ifscCode", idx)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="Account Name"
                                                    value={bank.accountName}
                                                    onChange={(e) => handleChange(e, "bankDetails", null, "accountName", idx)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="Account Number"
                                                    value={bank.accountNumber}
                                                    onChange={(e) => handleChange(e, "bankDetails", null, "accountNumber", idx)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <input
                                                    placeholder="Account Type"
                                                    value={bank.accountType}
                                                    onChange={(e) => handleChange(e, "bankDetails", null, "accountType", idx)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Bank Logo</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleChange(e, "bankDetails", null, "logoUrl", idx)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    />
                                                    {bank.logoUrl && (
                                                        <img
                                                            src={getImageSrc(bank.logoUrl)}
                                                            alt="Bank Logo"
                                                            className="mt-1 h-12 w-12 object-contain rounded-md border border-gray-300"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // View mode
                                            <div className="space-y-2 text-sm text-gray-700">
                                                <div><strong>Bank Name:</strong> {bank.bankName || 'N/A'}</div>
                                                <div><strong>IFSC Code:</strong> {bank.ifscCode || 'N/A'}</div>
                                                <div><strong>Account Name:</strong> {bank.accountName || 'N/A'}</div>
                                                <div><strong>Account Number:</strong> {bank.accountNumber || 'N/A'}</div>
                                                <div><strong>Account Type:</strong> {bank.accountType || 'N/A'}</div>
                                                {bank.logoUrl && (
                                                    <div className="flex items-center">
                                                        <strong>Bank Logo:</strong>
                                                        <img
                                                            src={getImageSrc(bank.logoUrl)}
                                                            alt="Bank Logo"
                                                            className="ml-2 h-12 w-12 object-contain rounded-md border border-gray-300"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => addField("bankDetails")}
                                className={buttonClass}
                            >
                                + Add
                            </button>
                            <button
                                type="button"
                                onClick={() => saveSection('bankDetails')}
                                className={buttonClass}
                                disabled={!userId}
                            >
                                Save All
                            </button>
                        </div>
                    </div>
                    {/* Payment ID Section */}
             <div className="space-y-2">
    <h3 className="text-xl font-bold text-blue-600">Payment ID (Wallet/UPI)</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {form.paymentIds.map((payment, idx) => {
            const isEditing = editingPaymentIds.has(idx);
            return (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-wrap justify-between items-center mb-2">
                        <h4 className="text-base font-semibold text-gray-800">Payment Method {idx + 1}</h4>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => savePayment(idx)}
                                        className={smallButtonClass}
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => cancelEditPayment(idx)}
                                        className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors text-sm h-8 w-20"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => toggleEditPayment(idx)}
                                    className={smallButtonClass}
                                >
                                    <FaEdit />
                                </button>
                            )}
                            {form.paymentIds.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeField("paymentIds", null, idx)}
                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 font-medium transition-colors text-sm inline-block"
                                >
                                    <MdDelete/>
                                </button>
                            )}
                        </div>
                    </div>
                    {isEditing ? (
                        // Edit mode
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 space-y-2">
                            <input
                                placeholder="Type (e.g., GPay, PhonePe, UPI)"
                                value={payment.type}
                                onChange={(e) => handleChange(e, "paymentIds", null, "type", idx)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                placeholder="UPI ID / Value"
                                value={payment.value}
                                onChange={(e) => handleChange(e, "paymentIds", null, "value", idx)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                placeholder="Receiver Name"
                                value={payment.receiverName}
                                onChange={(e) => handleChange(e, "paymentIds", null, "receiverName", idx)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                placeholder="Mobile Number (for UPI)"
                                value={payment.mobileNumber}
                                onChange={(e) => handleChange(e, "paymentIds", null, "mobileNumber", idx)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Wallet Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleChange(e, "paymentIds", null, "logoUrl", idx)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                {payment.logoUrl && (
                                    <img
                                        src={getImageSrc(payment.logoUrl)}
                                        alt="Wallet Logo"
                                        className="mt-1 h-12 w-12 object-contain rounded-md border border-gray-300"
                                    />
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">QR Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleChange(e, "paymentIds", null, "qrImageUrl", idx)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                {payment.qrImageUrl && (
                                    <img
                                        src={getImageSrc(payment.qrImageUrl)}
                                        alt="QR Image"
                                        className="mt-1 h-12 w-12 object-contain rounded-md border border-gray-300"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        // View mode
                        <div className="space-y-2 text-sm text-gray-700">
                            <div><strong>Type:</strong> {payment.type || 'N/A'}</div>
                            <div><strong>UPI ID / Value:</strong> {payment.value || 'N/A'}</div>
                            <div><strong>Receiver Name:</strong> {payment.receiverName || 'N/A'}</div>
                            <div><strong>Mobile Number:</strong> {payment.mobileNumber || 'N/A'}</div>
                            {payment.logoUrl && (
                                <div className="flex items-center">
                                    <strong>Wallet Logo:</strong>
                                    <img
                                        src={getImageSrc(payment.logoUrl)}
                                        alt="Wallet Logo"
                                        className="ml-2 h-12 w-12 object-contain rounded-md border border-gray-300"
                                    />
                                </div>
                            )}
                            {payment.qrImageUrl && (
                                <div className="flex items-center">
                                    <strong>QR Image:</strong>
                                    <img
                                        src={getImageSrc(payment.qrImageUrl)}
                                        alt="QR Image"
                                        className="ml-2 h-12 w-12 object-contain rounded-md border border-gray-300"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
    <div className="flex justify-center gap-2 sm:justify-end">
        <button
            type="button"
            onClick={() => addField("paymentIds")}
            className={buttonClass}
        >
            + Add
        </button>
        <button
            type="button"
            onClick={() => saveSection('paymentIds')}
            className={buttonClass}
            disabled={!userId}
        >
            Save All
        </button>
    </div>
</div>
                    {/* Full Save Button */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors h-10 w-32"
                        >
                            {userId ? "Update Structure" : "Save Structure"}
                        </button>
                        {userId && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors h-10 w-32"
                            >
                                Delete Structure
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <CompanyInfoManager />
            <Homepagecreate />
            <TourInclusionExclusionForm />
            <ThemeForm />
            <Adminachivement />
        </div>
    );
}
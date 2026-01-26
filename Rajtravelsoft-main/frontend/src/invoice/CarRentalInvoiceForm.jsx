// CarRentalInvoiceForm.jsx (Updated: Removed subtype; Set type to 'car-rental' directly)
"use client"

import { useState, useEffect } from "react"
import axios from 'axios'
import { useNavigate, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast";

const CarRentalInvoiceForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate()
  // Get the value of "edit" parameter (?edit=123)
  const editId = searchParams.get("edit");

  const [isEditMode, setIsEditMode] = useState(!!editId)
  const [invoiceData, setInvoiceData] = useState({
    _id: '',  // For edit
    type: 'car-rental', // Changed: Direct type 'car-rental' instead of 'invoice' with subtype
    company: {
      name: "",
      address: "",
      district: "",
      state: "",
      phone: "",
      email: "",
      gstin: "",
    },
    client: {
      name: "",
      address: "",
      district: "",
      state: "",
      phone: "",
      email: "",
      gstin: "",
    },
    invoiceNumber: "",
    date: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    vehicleName: "", // New: Single vehicle name
    legs: [{  // New: Array of legs instead of items
      pickupPoint: "", 
      dropPoint: "", 
      km: 0 
    }], 
    totalRentalAmount: 0, // New: Single total amount for all legs
    driverLicense: "", // New: Global driver license
    driverVehicleNumber: "", // New: Vehicle registration number
    aadhaarName: "", // New: Aadhaar name (driver's?)
    driverLicenseImage: "", // New: Image URL
    vehicleRcImage: "", // New: RC Image URL
    aadhaarImage: "", // New: Aadhaar Image URL
    notes: "",
    terms: "",
    taxRate: 18,
    logoUrl: null,
    totalPaid: 0,
    pendingAmount: 0,
  })

  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [total, setTotal] = useState(0)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  // New: Image states for driver documents
  const [driverLicensePreview, setDriverLicensePreview] = useState(null)
  const [driverLicenseFile, setDriverLicenseFile] = useState(null)
  const [vehicleRcPreview, setVehicleRcPreview] = useState(null)
  const [vehicleRcFile, setVehicleRcFile] = useState(null)
  const [aadhaarPreview, setAadhaarPreview] = useState(null)
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [statesData, setStatesData] = useState([])
  const [companyDistricts, setCompanyDistricts] = useState([])
  const [clientDistricts, setClientDistricts] = useState([])
  const [uniqueCompanies, setUniqueCompanies] = useState([])
  const [uniqueClients, setUniqueClients] = useState([])

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json')
      .then(res => res.json())
      .then(data => setStatesData(data.states || []))
      .catch(err => console.error('Error fetching states:', err))
  }, [])

  useEffect(() => {
    if (statesData.length > 0) {
      const companyState = invoiceData.company.state
      if (companyState) {
        const stateObj = statesData.find(s => s.state === companyState)
        setCompanyDistricts(stateObj ? stateObj.districts : [])
      } else {
        setCompanyDistricts([])
      }
    }
  }, [invoiceData.company.state, statesData])

  useEffect(() => {
    if (statesData.length > 0) {
      const clientState = invoiceData.client.state
      if (clientState) {
        const stateObj = statesData.find(s => s.state === clientState)
        setClientDistricts(stateObj ? stateObj.districts : [])
      } else {
        setClientDistricts([])
      }
    }
  }, [invoiceData.client.state, statesData])

  useEffect(() => {
    if (editId) {
      const loadBillForEdit = async () => {
        try {
          const res = await axios.get(`https://apitour.rajasthantouring.in/api/bills/${editId}`)
          const bill = res.data
          // Migrate old items to new structure if needed (for backward compatibility)
          let newLegs = bill.legs || bill.items?.map(item => ({
            pickupPoint: item.pickupPoint || '',
            dropPoint: item.dropPoint || '',
            km: item.km || 0
          })) || [{ pickupPoint: "", dropPoint: "", km: 0 }];
          let newTotalRentalAmount = bill.totalRentalAmount || bill.items?.reduce((sum, item) => sum + (item.totalAmount || 0), 0) || 0;
          let newVehicleName = bill.vehicleName || '';
          setInvoiceData({
            ...bill,
            type: 'car-rental', // Ensure type
            vehicleName: newVehicleName,
            legs: newLegs,
            totalRentalAmount: newTotalRentalAmount,
            date: new Date(bill.date),
            dueDate: bill.dueDate ? new Date(bill.dueDate) : new Date(),
          })
          if (bill.logoUrl) {
            setLogoPreview(`https://apitour.rajasthantouring.in/uploads/${bill.logoUrl}`)
          }
          // New: Load image previews
          if (bill.driverLicenseImage) {
            setDriverLicensePreview(`https://apitour.rajasthantouring.in/uploads/${bill.driverLicenseImage}`)
          }
          if (bill.vehicleRcImage) {
            setVehicleRcPreview(`https://apitour.rajasthantouring.in/uploads/${bill.vehicleRcImage}`)
          }
          if (bill.aadhaarImage) {
            setAadhaarPreview(`https://apitour.rajasthantouring.in/uploads/${bill.aadhaarImage}`)
          }
          // Recalculate totals
          let newSubtotal = bill.type === 'car-rental' ? newTotalRentalAmount : bill.items.reduce((sum, item) => sum + (item.unitPrice || 0), 0);
          setSubtotal(newSubtotal)
          const newTaxAmount = (newSubtotal * bill.taxRate) / 100
          setTaxAmount(newTaxAmount)
          setTotal(newSubtotal + newTaxAmount)
        } catch (err) {
          console.error('Error loading bill for edit:', err)
        }
      }
      loadBillForEdit()
    }
  }, [editId])

  // Fetch all invoices... (Updated: Fetch with type='car-rental')
  useEffect(() => {
    if (isEditMode) return
    const fetchAllInvoicesAndAutoFill = async () => {
      try {
        const res = await axios.get('https://apitour.rajasthantouring.in/api/bills?type=car-rental&limit=0');
        const all = res.data

        // Unique companies... (same logic)
        const companyMap = new Map()
        all.forEach((b) => {
          const email = b.company?.email
          if (email) {
            const existing = companyMap.get(email)
            if (!existing || new Date(b.date) > new Date(existing.date)) {
              companyMap.set(email, {
                company: b.company,
                logoUrl: b.logoUrl,
                date: b.date,
              })
            }
          }
        })
        setUniqueCompanies(Array.from(companyMap.values()))

        const clientMap = new Map()
        all.forEach((b) => {
          const email = b.client?.email
          if (email) {
            const existing = clientMap.get(email)
            if (!existing || new Date(b.date) > new Date(existing.date)) {
              clientMap.set(email, {
                client: b.client,
                date: b.date,
              })
            }
          }
        })
        setUniqueClients(Array.from(clientMap.values()).map((v) => v.client))

        if (all.length > 0) {
          const last = all[0];
          setInvoiceData(prev => ({
            ...prev,
            company: last.company,
            client: last.client,
            logoUrl: last.logoUrl,
          }));

          if (last.logoUrl) {
            setLogoPreview(`https://apitour.rajasthantouring.in/uploads/${last.logoUrl}`);
          }
          // Set next invoice number... (same logic)
          const lastNumberStr = last.number || '';
          const match = lastNumberStr.match(/^(.*?)(\d+)$/);
          let nextNumber;
          if (match) {
            const prefix = match[1];
            const numericPart = match[2];
            const lastNum = parseInt(numericPart, 10);
            if (!isNaN(lastNum)) {
              const nextNum = lastNum + 1;
              const paddingLength = numericPart.length;
              nextNumber = prefix + nextNum.toString().padStart(paddingLength, '0');
            } else {
              nextNumber = 'car-00001';
            }
          } else {
            nextNumber = 'car-00001';
          }
          setInvoiceData(prev => ({ ...prev, invoiceNumber: nextNumber }));
        } else {
          setInvoiceData(prev => ({ ...prev, invoiceNumber: "car-00001" }));
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
        const randomNum = Math.floor(1 + Math.random() * 99999);
        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber: `car-${randomNum.toString().padStart(5, '0')}`,
        }));
      }
    };
    fetchAllInvoicesAndAutoFill();
  }, [isEditMode])

  // Updated: Subtotal = totalRentalAmount for car-rental
  useEffect(() => {
    let newSubtotal = 0;
    if (invoiceData.type === 'car-rental') {
      newSubtotal = invoiceData.totalRentalAmount || 0;
    } else {
      newSubtotal = invoiceData.items.reduce((sum, item) => sum + (item.unitPrice || 0), 0);
    }
    setSubtotal(newSubtotal)
    const newTaxAmount = (newSubtotal * invoiceData.taxRate) / 100
    setTaxAmount(newTaxAmount)
    setTotal(newSubtotal + newTaxAmount)
    setInvoiceData(prev => ({
      ...prev,
      pendingAmount: (newSubtotal + newTaxAmount) - prev.totalPaid
    }))
  }, [invoiceData.legs, invoiceData.totalRentalAmount, invoiceData.taxRate, invoiceData.totalPaid, invoiceData.type])

  const handleSelectCompany = (e) => {
    // Same
    const email = e.target.value
    if (!email) {
      setInvoiceData((prev) => ({
        ...prev,
        company: {
          name: "",
          address: "",
          district: "",
          state: "",
          phone: "",
          email: "",
          gstin: "",
        },
        logoUrl: null,
      }))
      setLogoPreview(null)
      setLogoFile(null)
      return
    }
    const selected = uniqueCompanies.find((c) => c.company.email === email)
    if (selected) {
      setInvoiceData((prev) => ({
        ...prev,
        company: { ...selected.company },
        logoUrl: selected.logoUrl,
      }))
      if (selected.logoUrl) {
        setLogoPreview(`https://apitour.rajasthantouring.in/uploads/${selected.logoUrl}`)
      } else {
        setLogoPreview(null)
      }
      setLogoFile(null)
    }
  }

  const handleSelectClient = (e) => {
    // Same
    const email = e.target.value
    if (!email) {
      setInvoiceData((prev) => ({
        ...prev,
        client: {
          name: "",
          address: "",
          district: "",
          state: "",
          phone: "",
          email: "",
          gstin: "",
        },
      }))
      return
    }
    const selected = uniqueClients.find((c) => c.email === email)
    if (selected) {
      setInvoiceData((prev) => ({
        ...prev,
        client: {
          ...selected,
        },
      }))
    }
  }

  const handleCompanyChange = (e) => {
    // Same
    const { name, value } = e.target
    setInvoiceData((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        [name]: value,
      },
    }))
  }

  const handleClientChange = (e) => {
    // Same
    const { name, value } = e.target
    setInvoiceData((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        [name]: value,
      },
    }))
  }

  const handleDateChange = (e) => {
    // Same
    const { name, value } = e.target
    setInvoiceData((prev) => ({
      ...prev,
      [name]: new Date(value),
    }))
  }

  const handleTotalPaidChange = (e) => {
    // Same
    setInvoiceData(prev => ({
      ...prev,
      totalPaid: parseFloat(e.target.value) || 0
    }))
  }

  // New: Handle vehicle name change
  const handleVehicleChange = (e) => {
    setInvoiceData(prev => ({
      ...prev,
      vehicleName: e.target.value
    }))
  }

  // New: Handle leg change
  const handleLegChange = (index, e) => {
    const { name, value } = e.target
    const newLegs = [...invoiceData.legs]
    newLegs[index][name] = name === 'km' ? Number.parseFloat(value) || 0 : value
    setInvoiceData((prev) => ({
      ...prev,
      legs: newLegs,
    }))
  }

  // New: Handle total rental amount change
  const handleTotalRentalAmountChange = (e) => {
    setInvoiceData(prev => ({
      ...prev,
      totalRentalAmount: Number.parseFloat(e.target.value) || 0
    }))
  }

  // New: Add leg
  const addLeg = () => {
    setInvoiceData((prev) => ({
      ...prev,
      legs: [...prev.legs, { 
        pickupPoint: "", 
        dropPoint: "", 
        km: 0 
      }],
    }))
  }

  // New: Remove leg
  const removeLeg = (index) => {
    const newLegs = [...invoiceData.legs]
    newLegs.splice(index, 1)
    setInvoiceData((prev) => ({
      ...prev,
      legs: newLegs.length > 0 ? newLegs : [{ pickupPoint: "", dropPoint: "", km: 0 }],
    }))
  }

  const handleTaxRateChange = (e) => {
    // Same
    setInvoiceData((prev) => ({
      ...prev,
      taxRate: Number.parseFloat(e.target.value) || 0,
    }))
  }

  const handleLogoUpload = (e) => {
    // Same
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // New handlers for driver details
  const handleDriverChange = (e) => {
    const { name, value } = e.target
    setInvoiceData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // New: Image upload handlers (same)
  const handleDriverLicenseImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setDriverLicenseFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setDriverLicensePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVehicleRcImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVehicleRcFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setVehicleRcPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAadhaarImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAadhaarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAadhaarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGeneratePDF = async (preview = false) => {
    const formData = new FormData()
    formData.append('type', invoiceData.type)
    formData.append('company', JSON.stringify(invoiceData.company))
    formData.append('client', JSON.stringify(invoiceData.client))
    formData.append('invoiceNumber', invoiceData.invoiceNumber)
    formData.append('date', invoiceData.date.toISOString())
    formData.append('dueDate', invoiceData.dueDate.toISOString())
    formData.append('vehicleName', invoiceData.vehicleName) // New
    formData.append('legs', JSON.stringify(invoiceData.legs)) // New
    formData.append('totalRentalAmount', invoiceData.totalRentalAmount) // New
    formData.append('driverLicense', invoiceData.driverLicense)
    formData.append('driverVehicleNumber', invoiceData.driverVehicleNumber)
    formData.append('aadhaarName', invoiceData.aadhaarName)
    formData.append('notes', invoiceData.notes)
    formData.append('terms', invoiceData.terms)
    formData.append('taxRate', invoiceData.taxRate)
    formData.append('subtotal', subtotal)
    formData.append('taxAmount', taxAmount)
    formData.append('total', total)
    formData.append('totalPaid', invoiceData.totalPaid)
    formData.append('pendingAmount', invoiceData.pendingAmount)
    if (logoFile) {
      formData.append('logo', logoFile)
    } else if (invoiceData.logoUrl) {
      formData.append('logoUrl', invoiceData.logoUrl)
    }
    // Append driver images (same)
    if (driverLicenseFile) {
      formData.append('driverLicenseImage', driverLicenseFile)
    } else if (invoiceData.driverLicenseImage) {
      formData.append('driverLicenseImageUrl', invoiceData.driverLicenseImage)
    }
    if (vehicleRcFile) {
      formData.append('vehicleRcImage', vehicleRcFile)
    } else if (invoiceData.vehicleRcImage) {
      formData.append('vehicleRcImageUrl', invoiceData.vehicleRcImage)
    }
    if (aadhaarFile) {
      formData.append('aadhaarImage', aadhaarFile)
    } else if (invoiceData.aadhaarImage) {
      formData.append('aadhaarImageUrl', invoiceData.aadhaarImage)
    }

    try {
      let res
      if (isEditMode) {
        res = await axios.put(`https://apitour.rajasthantouring.in/api/bills/${invoiceData._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res) {
          // Reset form (updated)
          setInvoiceData({
            _id: '',
            type: 'car-rental',
            company: { name: "", address: "", district: "", state: "", phone: "", email: "", gstin: "" },
            client: { name: "", address: "", district: "", state: "", phone: "", email: "", gstin: "" },
            invoiceNumber: "",
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            vehicleName: "",
            legs: [{ pickupPoint: "", dropPoint: "", km: 0 }],
            totalRentalAmount: 0,
            driverLicense: "",
            driverVehicleNumber: "",
            aadhaarName: "",
            driverLicenseImage: "",
            vehicleRcImage: "",
            aadhaarImage: "",
            notes: "",
            terms: "",
            taxRate: 18,
            logoUrl: null,
            totalPaid: 0,
            pendingAmount: 0,
          })
          // Reset images
          setDriverLicensePreview(null)
          setDriverLicenseFile(null)
          setVehicleRcPreview(null)
          setVehicleRcFile(null)
          setAadhaarPreview(null)
          setAadhaarFile(null)
          setLogoPreview(null)
          setLogoFile(null)
          setIsEditMode(false)
          navigate('/invoice')
        }
      } else {
        res = await axios.post('https://apitour.rajasthantouring.in/api/bills', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        // Update next number (same)
        const savedNumber = res.data.bill.number
        const match = savedNumber.match(/^(.*?)(\d+)$/);
        let nextNumber;
        if (match) {
          const prefix = match[1];
          const numericPart = match[2];
          const lastNum = parseInt(numericPart, 10);
          if (!isNaN(lastNum)) {
            const nextNum = lastNum + 1;
            const paddingLength = numericPart.length;
            nextNumber = prefix + nextNum.toString().padStart(paddingLength, '0');
          } else {
            nextNumber = 'car-00001';
          }
        } else {
          nextNumber = 'car-00001';
        }
        setInvoiceData((prev) => ({ ...prev, invoiceNumber: nextNumber }));
        // Reset images
        setDriverLicensePreview(null)
        setDriverLicenseFile(null)
        setVehicleRcPreview(null)
        setVehicleRcFile(null)
        setAadhaarPreview(null)
        setAadhaarFile(null)
      }
      const savedId = res.data.bill._id
      const pdfUrl = `https://apitour.rajasthantouring.in/api/bills/${savedId}/download`
      if (preview) {
        window.open(pdfUrl, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `car-rental-invoice-${res.data.bill.number}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      if (isEditMode) {
        toast.success('Invoice updated successfully!')
      }
    } catch (err) {
      console.error('Error saving/downloading invoice:', err)
    }
  }

  const prepareFormData = () => {
    const formData = new FormData()
    formData.append('type', invoiceData.type)
    formData.append('company', JSON.stringify(invoiceData.company))
    formData.append('client', JSON.stringify(invoiceData.client))
    formData.append('invoiceNumber', invoiceData.invoiceNumber)
    formData.append('date', invoiceData.date.toISOString())
    formData.append('dueDate', invoiceData.dueDate.toISOString())
    formData.append('vehicleName', invoiceData.vehicleName)
    formData.append('legs', JSON.stringify(invoiceData.legs))
    formData.append('totalRentalAmount', invoiceData.totalRentalAmount)
    formData.append('driverLicense', invoiceData.driverLicense)
    formData.append('driverVehicleNumber', invoiceData.driverVehicleNumber)
    formData.append('aadhaarName', invoiceData.aadhaarName)
    formData.append('notes', invoiceData.notes)
    formData.append('terms', invoiceData.terms)
    formData.append('taxRate', invoiceData.taxRate)
    formData.append('subtotal', subtotal)
    formData.append('taxAmount', taxAmount)
    formData.append('total', total)
    formData.append('totalPaid', invoiceData.totalPaid)
    formData.append('pendingAmount', invoiceData.pendingAmount)
    if (logoFile) {
      formData.append("logo", logoFile)
    } else if (invoiceData.logoUrl) {
      formData.append("logoUrl", invoiceData.logoUrl)
    }
    // Append driver images (same)
    if (driverLicenseFile) {
      formData.append('driverLicenseImage', driverLicenseFile)
    } else if (invoiceData.driverLicenseImage) {
      formData.append('driverLicenseImageUrl', invoiceData.driverLicenseImage)
    }
    if (vehicleRcFile) {
      formData.append('vehicleRcImage', vehicleRcFile)
    } else if (invoiceData.vehicleRcImage) {
      formData.append('vehicleRcImageUrl', invoiceData.vehicleRcImage)
    }
    if (aadhaarFile) {
      formData.append('aadhaarImage', aadhaarFile)
    } else if (invoiceData.aadhaarImage) {
      formData.append('aadhaarImageUrl', invoiceData.aadhaarImage)
    }
    return formData
  }

  const handlePreviewPDF = async () => {
    const formData = prepareFormData();
    try {
      const response = await axios.post("https://apitour.rajasthantouring.in/api/bills/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error previewing invoice:", err);
      toast.error('Failed to preview PDF. Check console for details.');
    }
  };

  const isRajasthan = invoiceData.client.state === 'Rajasthan'

  return (
    <div className="p-4 sm:p-6 rounded-lg shadow-lg bg-white text-gray-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4 sm:mb-0">
          {isEditMode ? 'Edit Car Rental Invoice' : 'LTC Car Rental Invoice'}
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700">Upload Logo:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-sm text-gray-500 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold"
            />
            <p className="text-xs mt-1 text-gray-500">Only images allowed</p>
          </div>
          {logoPreview && (
            <img src={logoPreview} alt="Agency Logo" className="h-10 w-auto mt-2 sm:mt-0" />
          )}
        </div>
      </div>

      {/* Company and Client sections - Same */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Company Section - Same */}
        <div className="p-4 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Your Company</h3>
          <div className="mb-4">
            {!isEditMode && (
              <select onChange={handleSelectCompany} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300">
                <option value="">Create New</option>
                {uniqueCompanies.map((c, i) => (
                  <option key={i} value={c.company.email}>{c.company.name} ({c.company.email})</option>
                ))}
              </select>
            )}
          </div>
          {['name', 'address', 'phone', 'email', 'gstin'].map((field) => (
            <div key={field} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field === 'name' ? 'Company Name' : field === 'gstin' ? 'GSTIN' : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              {field === 'address' ? (
                <textarea name={field} value={invoiceData.company[field]} onChange={handleCompanyChange} rows="2" className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              ) : (
                <input type={field === 'email' ? 'email' : 'text'} name={field} value={invoiceData.company[field]} onChange={handleCompanyChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select name="state" value={invoiceData.company.state} onChange={handleCompanyChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300">
              <option value="">Select State</option>
              {statesData.map((s) => <option key={s.state} value={s.state}>{s.state}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <select name="district" value={invoiceData.company.district} onChange={handleCompanyChange} disabled={!invoiceData.company.state} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300">
              <option value="">Select District</option>
              {companyDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Client Section - Same */}
        <div className="p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Client Information</h3>
          <div className="mb-4">
            {!isEditMode && (
              <select onChange={handleSelectClient} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300">
                <option value="">Create New</option>
                {uniqueClients.map((c, i) => (
                  <option key={i} value={c.email}>{c.name} ({c.email})</option>
                ))}
              </select>
            )}
          </div>
          {['name', 'address', 'phone', 'email', 'gstin'].map((field) => (
            <div key={field} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field === 'name' ? 'Client Name' : field === 'gstin' ? 'GSTIN' : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              {field === 'address' ? (
                <textarea name={field} value={invoiceData.client[field]} onChange={handleClientChange} rows="2" className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              ) : (
                <input type={field === 'email' ? 'email' : 'text'} name={field} value={invoiceData.client[field]} onChange={handleClientChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select name="state" value={invoiceData.client.state} onChange={handleClientChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300">
              <option value="">Select State</option>
              {statesData.map((s) => <option key={s.state} value={s.state}>{s.state}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <select name="district" value={invoiceData.client.district} onChange={handleClientChange} disabled={!invoiceData.client.state} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300">
              <option value="">Select District</option>
              {clientDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Details - Same */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
          <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300 bg-gray-100" readOnly={isEditMode} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input type="date" name="date" value={invoiceData.date.toISOString().substr(0, 10)} onChange={handleDateChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <input type="date" name="dueDate" value={invoiceData.dueDate.toISOString().substr(0, 10)} onChange={handleDateChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
        </div>
      </div>

      {/* Updated Driver Details Section with Image Uploads - Same */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-yellow-50">
        <div>
          <label className="block text-sm font-medium text-gray-700">Driver License</label>
          <input type="text" name="driverLicense" value={invoiceData.driverLicense} onChange={handleDriverChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
          <label className="block text-xs font-medium text-gray-600 mt-1">Upload License Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleDriverLicenseImageUpload}
            className="text-sm text-gray-500 file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold mt-1"
          />
          {driverLicensePreview && (
            <img src={driverLicensePreview} alt="Driver License" className="h-12 w-auto mt-1" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Driver Vehicle Number</label>
          <input type="text" name="driverVehicleNumber" value={invoiceData.driverVehicleNumber} onChange={handleDriverChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
          <label className="block text-xs font-medium text-gray-600 mt-1">Upload RC Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleVehicleRcImageUpload}
            className="text-sm text-gray-500 file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold mt-1"
          />
          {vehicleRcPreview && (
            <img src={vehicleRcPreview} alt="Vehicle RC" className="h-12 w-auto mt-1" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Aadhaar Name</label>
          <input type="text" name="aadhaarName" value={invoiceData.aadhaarName} onChange={handleDriverChange} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
          <label className="block text-xs font-medium text-gray-600 mt-1">Upload Aadhaar Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAadhaarImageUpload}
            className="text-sm text-gray-500 file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold mt-1"
          />
          {aadhaarPreview && (
            <img src={aadhaarPreview} alt="Aadhaar" className="h-12 w-auto mt-1" />
          )}
        </div>
      </div>

      {/* New: Vehicle Name */}
      <div className="mb-6 p-4 rounded-lg bg-green-50">
        <h3 className="text-lg font-semibold mb-3 text-green-700">Vehicle Details</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Vehicle Name</label>
          <input type="text" value={invoiceData.vehicleName} onChange={handleVehicleChange} placeholder="e.g., Toyota Innova" className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3 text-blue-700">Trip Legs</h3>
      <div className="mb-6 border rounded-lg overflow-hidden bg-white border-gray-200">
        <div className="overflow-x-auto">
          {/* Desktop Header for Legs */}
          <div className="hidden md:grid grid-cols-8 gap-2 mb-2 font-medium text-white bg-blue-600 p-2 sm:p-3">
            <div className="col-span-2">Pickup Point</div>
            <div className="col-span-2">Drop Point</div>
            <div className="col-span-1">KM</div>
            <div className="col-span-3"></div> {/* Empty for remove */}
          </div>

          {invoiceData.legs.map((leg, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-8 gap-2 p-2 sm:p-3 items-start border-b border-gray-200 w-full">
              <div className="md:col-span-2 space-y-1">
                <label className="md:hidden text-sm font-medium">Pickup Point</label>
                <input type="text" name="pickupPoint" value={leg.pickupPoint} onChange={(e) => handleLegChange(index, e)} placeholder="e.g., Delhi Airport" className="block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="md:hidden text-sm font-medium">Drop Point</label>
                <input type="text" name="dropPoint" value={leg.dropPoint} onChange={(e) => handleLegChange(index, e)} placeholder="e.g., Mumbai" className="block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              </div>
              <div className="md:col-span-1 space-y-1">
                <label className="md:hidden text-sm font-medium">KM</label>
                <input type="number" name="km" value={leg.km} onChange={(e) => handleLegChange(index, e)} placeholder="0" min="0" className="block w-full border rounded-md shadow-sm p-2 border-gray-300" />
              </div>
              <div className="md:col-span-3 flex items-center justify-end">
                <button type="button" onClick={() => removeLeg(index)} className="text-red-500 hover:text-red-700" disabled={invoiceData.legs.length === 1}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 sm:p-3">
          <button type="button" onClick={addLeg} className="flex items-center text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Leg
          </button>
        </div>
      </div>

      {/* New: Total Rental Amount */}
      <div className="mb-6 p-4 rounded-lg bg-purple-50">
        <label className="block text-sm font-medium text-gray-700">Total Rental Amount (for entire trip)</label>
        <input type="number" value={invoiceData.totalRentalAmount} onChange={handleTotalRentalAmountChange} placeholder="₹0.00" min="0" step="0.01" className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" />
      </div>

      {/* Notes and Terms - Always show fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" value={invoiceData.notes} onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" rows="3" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
            <textarea name="terms" value={invoiceData.terms} onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })} className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300" rows="3" />
          </div>
        </div>

        {/* Summary - Updated */}
        <div>
          <div className="p-4 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">Summary</h3>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">GST Rate:</span>
              <div className="flex items-center">
                <input type="number" value={invoiceData.taxRate} onChange={handleTaxRateChange} className="w-16 border rounded-md shadow-sm p-1 mr-1 border-gray-300" min="0" max="100" />
                <span>%</span>
              </div>
            </div>
            {!isRajasthan ? (
              <div className="flex justify-between mb-2">
                <span className="font-medium">GST ({invoiceData.taxRate}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">CGST ({(invoiceData.taxRate / 2).toFixed(1)}%):</span>
                  <span>₹{(taxAmount / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">SGST ({(invoiceData.taxRate / 2).toFixed(1)}%):</span>
                  <span>₹{(taxAmount / 2).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Total Paid:</span>
              <input type="number" value={invoiceData.totalPaid} onChange={handleTotalPaidChange} className="w-20 border rounded-md shadow-sm p-1 text-right border-gray-300" min="0" step="0.01" />
            </div>
            <div className="flex justify-between mb-2 text-lg font-bold text-red-600">
              <span>Pending:</span>
              <span>₹{invoiceData.pendingAmount.toFixed(2)}</span>
            </div>
            <div className="border-t my-2 border-gray-300"></div>
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button type="button" onClick={handlePreviewPDF} className="w-full flex items-center justify-center font-bold py-3 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white">
              Preview PDF
            </button>
            <button type="button" onClick={() => handleGeneratePDF(false)} className="w-full flex items-center justify-center font-bold py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              {isEditMode ? 'Update & Download PDF' : 'Download Car Rental Invoice PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarRentalInvoiceForm
// TravelQuotationForm.jsx (Updated: Remove prefix, add preview button that opens PDF in new tab)
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { matchPath } from "react-router-dom"

const TravelQuotationForm = () => {
  const [quotationData, setQuotationData] = useState({
    type: "quotation",
    company: {
      name: "",
      address: "",
      district: "",
      state: "",
      phone: "",
      email: "",
    },
    client: {
      name: "",
      address: "",
      district: "",
      state: "",
      phone: "",
      email: "",
    },
    quotationNumber: "",
    date: new Date(),
    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
    items: [{ description: "", tourCode: "", itineraryName: "", travelDate: "", quantity: 1, unitPrice: 0 }],
    notes: "",
    terms: "",
    taxRate: 18,
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
    },
    logoUrl: null,
  })

  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [total, setTotal] = useState(0)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [statesData, setStatesData] = useState([])
  const [companyDistricts, setCompanyDistricts] = useState([])
  const [clientDistricts, setClientDistricts] = useState([])
  const [uniqueCompanies, setUniqueCompanies] = useState([])
  const [uniqueClients, setUniqueClients] = useState([])

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json")
      .then((res) => res.json())
      .then((data) => setStatesData(data.states || []))
      .catch((err) => console.error("Error fetching states:", err))
  }, [])

  useEffect(() => {
    if (statesData.length > 0) {
      const companyState = quotationData.company.state
      if (companyState) {
        const stateObj = statesData.find((s) => s.state === companyState)
        setCompanyDistricts(stateObj ? stateObj.districts : [])
      } else {
        setCompanyDistricts([])
      }
    }
  }, [quotationData.company.state, statesData])

  useEffect(() => {
    if (statesData.length > 0) {
      const clientState = quotationData.client.state
      if (clientState) {
        const stateObj = statesData.find((s) => s.state === clientState)
        setClientDistricts(stateObj ? stateObj.districts : [])
      } else {
        setClientDistricts([])
      }
    }
  }, [quotationData.client.state, statesData])

  // Fetch all quotations, extract unique companies/clients (latest by date), and auto-fill from last
  // Fetch all quotations, extract unique companies/clients (latest by date), and auto-fill from last
  useEffect(() => {
    const fetchAllQuotationsAndAutoFill = async () => {
      try {
        const res = await axios.get("https://apitour.rajasthantouring.in/api/bills?type=quotation&limit=0")
        const all = res.data // Assuming sorted by timestamp: -1 (latest first)

        // Unique companies (latest by date for each email)
        const companyMap = new Map()
        all.forEach((b) => {
          const email = b.company?.email
          if (email) {
            const existing = companyMap.get(email)
            if (!existing || new Date(b.date) > new Date(existing.date)) {
              companyMap.set(email, {
                company: b.company,
                logoUrl: b.logoUrl,
                bankDetails: b.bankDetails,
                date: b.date,
              })
            }
          }
        })
        setUniqueCompanies(Array.from(companyMap.values()))

        // Unique clients (latest by date for each email)
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
          const last = all[0]
          // Auto-fill company details, logo, bank from last
          setQuotationData((prev) => ({
            ...prev,
            company: last.company,
            client: last.client,
            logoUrl: last.logoUrl,
            bankDetails: last.bankDetails || { bankName: "", accountNumber: "", ifscCode: "" },
          }))
          if (last.logoUrl) {
            setLogoPreview(`https://apitour.rajasthantouring.in/uploads/${last.logoUrl}`)
          }
          // Set next quotation number (keep prefix like "jss-", increment numeric, preserve padding)
          const lastNumberStr = last.number || '';
          const match = lastNumberStr.match(/^(.*?)(\d+)$/); // e.g., "jss-0003" -> prefix="jss-", num="0003"
          let nextNumber;

          console.log(nextNumber, lastNumberStr, match);

          if (match) {
            const prefix = match[1]; // "jss-"
            const numericPart = match[2]; // "0003"
            const lastNum = parseInt(numericPart, 10);
            if (!isNaN(lastNum)) {
              const nextNum = lastNum + 1;
              const paddingLength = numericPart.length; // 4
              nextNumber = prefix + nextNum.toString().padStart(paddingLength, '0'); // "jss-0004"
            } else {
              nextNumber = 'jss-100001'; // Fallback
            }
          } else {
            // Pure number or invalid, fallback with prefix
            nextNumber = 'jss-100001';
          }
          setQuotationData((prev) => ({ ...prev, quotationNumber: nextNumber }))
        } else {
          // Fallback to initial sequential with prefix
          setQuotationData((prev) => ({ ...prev, quotationNumber: "jss-100001" }))
        }
      } catch (err) {
        console.error("Error fetching quotations:", err)
        // Fallback random with prefix
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        setQuotationData((prev) => ({
          ...prev,
          quotationNumber: `jss-${randomNum.toString().padStart(6, '0')}`,
        }))
      }
    }
    fetchAllQuotationsAndAutoFill()
  }, [])

  useEffect(() => {
    const newSubtotal = quotationData.items.reduce((sum, item) => sum + item.unitPrice, 0)
    setSubtotal(newSubtotal)
    const newTaxAmount = (newSubtotal * quotationData.taxRate) / 100
    setTaxAmount(newTaxAmount)
    setTotal(newSubtotal + newTaxAmount)
  }, [quotationData.items, quotationData.taxRate])

  const handleSelectCompany = (e) => {
    const email = e.target.value

    // agar email blank hai to company details, bank details aur logo clear kar do
    if (!email) {
      setQuotationData((prev) => ({
        ...prev,
        company: {
          name: "",
          address: "",
          district: "",
          state: "",
          phone: "",
          email: "",
        },
        bankDetails: {
          bankName: "",
          accountNumber: "",
          ifscCode: "",
        },
        logoUrl: null,
      }))
      setLogoPreview(null)
      return
    }

    // agar company milti hai to data set karo
    const selected = uniqueCompanies.find((c) => c.company.email === email)
    if (selected) {
      setQuotationData((prev) => ({
        ...prev,
        company: { ...selected.company },
        bankDetails: { ...selected.bankDetails },
        logoUrl: selected.logoUrl,
      }))

      if (selected.logoUrl) {
        setLogoPreview(`https://apitour.rajasthantouring.in/uploads/${selected.logoUrl}`)
      } else {
        setLogoPreview(null)
      }
    }
  }

  const handleSelectClient = (e) => {
    const email = e.target.value

    // agar email blank hai, to client ko reset kar do
    if (!email) {
      setQuotationData((prev) => ({
        ...prev,
        client: {
          name: "",
          address: "",
          district: "",
          state: "",
          phone: "",
          email: "",
        },
      }))
      return
    }

    const selected = uniqueClients.find((c) => c.email === email)
    if (selected) {
      setQuotationData((prev) => ({
        ...prev,
        client: { ...selected },
      }))
    }
  }


  const handleCompanyChange = (e) => {
    const { name, value } = e.target
    setQuotationData((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        [name]: value,
      },
    }))
  }

  const handleClientChange = (e) => {
    const { name, value } = e.target
    setQuotationData((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        [name]: value,
      },
    }))
  }

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target
    setQuotationData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value,
      },
    }))
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    setQuotationData((prev) => ({
      ...prev,
      [name]: new Date(value),
    }))
  }

  const handleItemChange = (index, e) => {
    const { name, value } = e.target
    const newItems = [...quotationData.items]
    if (name === "quantity" || name === "unitPrice") {
      newItems[index][name] = Number.parseFloat(value) || 0
    } else if (name === "travelDate") {
      newItems[index][name] = value
    } else {
      newItems[index][name] = value
    }
    setQuotationData((prev) => ({
      ...prev,
      items: newItems,
    }))
  }

  const addItem = () => {
    setQuotationData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", tourCode: "", itineraryName: "", travelDate: "", quantity: 1, unitPrice: 0 },
      ],
    }))
  }

  const removeItem = (index) => {
    const newItems = [...quotationData.items]
    newItems.splice(index, 1)
    setQuotationData((prev) => ({
      ...prev,
      items: newItems,
    }))
  }

  const handleTaxRateChange = (e) => {
    setQuotationData((prev) => ({
      ...prev,
      taxRate: Number.parseFloat(e.target.value) || 0,
    }))
  }

  const handleLogoUpload = (e) => {
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

  const prepareFormData = () => {
    const formData = new FormData()
    formData.append("type", quotationData.type)
    formData.append("company", JSON.stringify(quotationData.company))
    formData.append("client", JSON.stringify(quotationData.client))
    formData.append("quotationNumber", quotationData.quotationNumber || "")  // Allow empty for server generate
    formData.append("date", quotationData.date.toISOString())
    formData.append("validUntil", quotationData.validUntil.toISOString())
    formData.append("items", JSON.stringify(quotationData.items))
    formData.append("notes", quotationData.notes)
    formData.append("terms", quotationData.terms)
    formData.append("taxRate", quotationData.taxRate)
    formData.append("bankDetails", JSON.stringify(quotationData.bankDetails))
    formData.append("subtotal", subtotal)
    formData.append("taxAmount", taxAmount)
    formData.append("total", total)
    if (logoFile) {
      formData.append("logo", logoFile)
    } else if (quotationData.logoUrl) {
      formData.append("logoUrl", quotationData.logoUrl)
    }
    return formData
  }

  const handleGeneratePDF = async (preview = false) => {
    const formData = new FormData()
    formData.append("type", quotationData.type)
    formData.append("company", JSON.stringify(quotationData.company))
    formData.append("client", JSON.stringify(quotationData.client))
    formData.append("quotationNumber", quotationData.quotationNumber)
    formData.append("date", quotationData.date.toISOString())
    formData.append("validUntil", quotationData.validUntil.toISOString())
    formData.append("items", JSON.stringify(quotationData.items))
    formData.append("notes", quotationData.notes)
    formData.append("terms", quotationData.terms)
    formData.append("taxRate", quotationData.taxRate)
    formData.append("bankDetails", JSON.stringify(quotationData.bankDetails))
    formData.append("subtotal", subtotal)
    formData.append("taxAmount", taxAmount)
    formData.append("total", total)
    if (logoFile) {
      formData.append("logo", logoFile)
    } else if (quotationData.logoUrl) {
      formData.append("logoUrl", quotationData.logoUrl)
    }

    try {
      const res = await axios.post("https://apitour.rajasthantouring.in/api/bills", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const savedId = res.data.bill._id
      const savedNumber = res.data.bill.number // e.g., "jss-0003" (server might add/modify prefix)
      // Update local quotationNumber to next (keep prefix, increment numeric)
      const match = savedNumber.match(/^(.*?)(\d+)$/); // e.g., "jss-0003" -> prefix="jss-", num="0003"
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
          nextNumber = 'jss-100001';
        }
      } else {
        nextNumber = 'jss-100001';
      }
      setQuotationData((prev) => ({ ...prev, quotationNumber: nextNumber }))
      // If preview, open in new tab; else download
      const pdfUrl = `https://apitour.rajasthantouring.in/api/bills/${savedId}/download`
      if (preview) {
        window.open(pdfUrl, '_blank')
      } else {
        // Trigger download from server
        const link = document.createElement("a")
        link.href = pdfUrl
        link.download = `travel-quotation-${savedNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.log(err);

      console.error("Error saving/downloading quotation:", err)
      alert("Error generating PDF. Check console for details.")
    }
  }

const handlePreviewPDF = async () => {
  const formData = prepareFormData()
  try {
    const response = await axios.post("https://apitour.rajasthantouring.in/api/bills/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: 'blob'
    })

    // Log for debugging (remove later)
    console.log('Blob size:', response.data.size);
    console.log('Blob type:', response.data.type);

    // Create blob with explicit PDF MIME type
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Open in new tab
    window.open(url, '_blank');

    // Optional: Revoke URL after use to free memory (e.g., in a useEffect cleanup)
    // URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error previewing quotation:", err);
    alert('Failed to preview PDF. Check console for details.');
  }
};

  const isRajasthan = quotationData.client.state === "Rajasthan"

  return (
    <div className="p-4 sm:p-6 rounded-lg shadow-lg bg-white text-gray-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4 sm:mb-0">Travel & Tour Agency Quotation</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700">Upload Logo:</label>
            <input
              type="file"
              accept="image/png"
              onChange={handleLogoUpload}
              className="text-sm text-gray-500 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold"
            />
            <p className="text-xs mt-1 text-gray-500">Only PNG images allowed</p>
          </div>
          {logoPreview && (
            <img src={logoPreview} alt="Agency Logo" className="h-10 w-auto mt-2 sm:mt-0" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="p-4 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Your Travel Agency</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Existing Agency</label>
            <select
              onChange={handleSelectCompany}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
            >
              <option value="">Create New</option>
              {uniqueCompanies.map((c, i) => (
                <option key={i} value={c.company.email}>
                  {c.company.name} ({c.company.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {["name", "address", "phone", "email"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700">
                  {field === "name" ? "Agency Name" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                {field === "address" ? (
                  <textarea
                    name={field}
                    value={quotationData.company[field]}
                    onChange={handleCompanyChange}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                    rows="2"
                  />
                ) : (
                  <input
                    type={field === "email" ? "email" : "text"}
                    name={field}
                    value={quotationData.company[field]}
                    onChange={handleCompanyChange}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <select
                name="state"
                value={quotationData.company.state}
                onChange={handleCompanyChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
              >
                <option value="">Select State</option>
                {statesData.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">District</label>
              <select
                name="district"
                value={quotationData.company.district}
                onChange={handleCompanyChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                disabled={!quotationData.company.state}
              >
                <option value="">Select District</option>
                {companyDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Client Information</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Existing Client</label>
            <select
              onChange={handleSelectClient}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
            >
              <option value="">Create New</option>
              {uniqueClients.map((c, i) => (
                <option key={i} value={c.email}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {["name", "address", "phone", "email"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700">
                  {field === "name" ? "Client Name" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                {field === "address" ? (
                  <textarea
                    name={field}
                    value={quotationData.client[field]}
                    onChange={handleClientChange}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                    rows="2"
                  />
                ) : (
                  <input
                    type={field === "email" ? "email" : "text"}
                    name={field}
                    value={quotationData.client[field]}
                    onChange={handleClientChange}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <select
                name="state"
                value={quotationData.client.state}
                onChange={handleClientChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
              >
                <option value="">Select State</option>
                {statesData.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">District</label>
              <select
                name="district"
                value={quotationData.client.district}
                onChange={handleClientChange}
                className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                disabled={!quotationData.client.state}
              >
                <option value="">Select District</option>
                {clientDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quotation Number</label>
          <input
            type="text"
            name="quotationNumber"
            value={quotationData.quotationNumber}
            onChange={(e) => setQuotationData({ ...quotationData, quotationNumber: e.target.value })}
            className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quote Date</label>
          <input
            type="date"
            name="date"
            value={quotationData.date.toISOString().substr(0, 10)}
            onChange={handleDateChange}
            className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valid Until</label>
          <input
            type="date"
            name="validUntil"
            value={quotationData.validUntil.toISOString().substr(0, 10)}
            onChange={handleDateChange}
            className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3 text-blue-700">Travel Services</h3>
      <div className="mb-6 border rounded-lg overflow-hidden bg-white border-gray-200">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-2 mb-2 font-medium text-white bg-blue-600 p-2 sm:p-3">
          <div className="col-span-1">Tour Code</div>
          <div className="col-span-2">Itinerary Name</div>
          <div className="col-span-1">Travel Date</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1">Pax</div>
          <div className="col-span-2">Total Amount</div>
          <div className="col-span-1">Amount</div>
        </div>

        {quotationData.items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 sm:p-3 items-start border-b border-gray-200"
          >
            {/* Tour Code */}
            <div className="md:col-span-1">
              <label className="md:hidden text-sm font-medium mb-1">Tour Code</label>
              <input
                type="text"
                name="tourCode"
                placeholder="Tour Code"
                value={item.tourCode}
                onChange={(e) => handleItemChange(index, e)}
                className="block w-full border rounded-md shadow-sm p-2 border-gray-300"
              />
            </div>

            {/* Itinerary Name */}
            <div className="md:col-span-2">
              <label className="md:hidden text-sm font-medium mb-1">Itinerary Name</label>
              <input
                type="text"
                name="itineraryName"
                placeholder="e.g., Delhi Golden Triangle"
                value={item.itineraryName}
                onChange={(e) => handleItemChange(index, e)}
                className="block w-full border rounded-md shadow-sm p-2 border-gray-300"
              />
            </div>

            {/* Travel Date */}
            <div className="md:col-span-1">
              <label className="md:hidden text-sm font-medium mb-1">Travel Date</label>
              <input
                type="date"
                name="travelDate"
                value={item.travelDate}
                onChange={(e) => handleItemChange(index, e)}
                className="block w-full border rounded-md shadow-sm p-2 border-gray-300"
              />
            </div>

            {/* Description (expanded) */}
            <div className="md:col-span-4">
              <label className="md:hidden text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                name="description"
                placeholder="e.g., Delhi to Mumbai, Economy Class"
                value={item.description}
                onChange={(e) => handleItemChange(index, e)}
                className="block w-full border rounded-md shadow-sm p-2 border-gray-300"
              />
            </div>

            {/* Quantity (Pax) */}
            <div className="md:col-span-1">
              <label className="md:hidden text-sm font-medium mb-1">Pax</label>
              <input
                type="number"
                name="quantity"
                placeholder="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, e)}
                className="block w-full border rounded-md shadow-sm p-2 border-gray-300"
                min="1"
              />
            </div>

            {/* Total Amount (formerly Rate (Per Pax)) */}
            <div className="md:col-span-2">
              <label className="md:hidden text-sm font-medium mb-1">Total Amount</label>
              <input
                type="number"
                name="unitPrice"
                placeholder="₹0.00"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, e)}
                className="block w-full border rounded-md shadow-sm p-2 border-gray-300"
                min="0"
                step="0.01"
              />
            </div>

            {/* Amount */}
            <div className="md:col-span-1 flex items-center justify-between">
              <label className="md:hidden text-sm font-medium mb-1">Amount</label>
              <div className="font-medium p-2">₹{item.unitPrice.toFixed(2)}</div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 md:ml-2"
                disabled={quotationData.items.length === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Add Item Button */}
        <div className="p-2 sm:p-3">
          <button type="button" onClick={addItem} className="flex items-center text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Travel Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Bank Details</h3>
          <div className="p-4 rounded-lg bg-gray-50 space-y-3 mb-4">
            {["bankName", "accountNumber", "ifscCode"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700">
                  {field === "bankName" ? "Bank Name" : field === "accountNumber" ? "Account Number" : "IFSC Code"}
                </label>
                <input
                  type="text"
                  name={field}
                  value={quotationData.bankDetails[field]}
                  onChange={handleBankDetailsChange}
                  className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Itinerary Notes</label>
            <textarea
              name="notes"
              value={quotationData.notes}
              onChange={(e) => setQuotationData({ ...quotationData, notes: e.target.value })}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
              rows="3"
              placeholder="Additional travel notes, inclusions/exclusions..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Booking Terms & Conditions</label>
            <textarea
              name="terms"
              value={quotationData.terms}
              onChange={(e) => setQuotationData({ ...quotationData, terms: e.target.value })}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300"
              rows="3"
              placeholder="Cancellation policy, payment terms..."
            />
          </div>
        </div>

        <div>
          <div className="p-4 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">Quotation Summary</h3>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">GST Rate:</span>
              <div className="flex items-center">
                <input
                  type="number"
                  value={quotationData.taxRate}
                  onChange={handleTaxRateChange}
                  className="w-16 border rounded-md shadow-sm p-1 mr-1 border-gray-300"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
            </div>
            {!isRajasthan ? (
              <div className="flex justify-between mb-2">
                <span className="font-medium">GST ({quotationData.taxRate}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">CGST ({(quotationData.taxRate / 2).toFixed(1)}%):</span>
                  <span>₹{(taxAmount / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">SGST ({(quotationData.taxRate / 2).toFixed(1)}%):</span>
                  <span>₹{(taxAmount / 2).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="border-t my-2 border-gray-300"></div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Quote:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handlePreviewPDF}
              className="w-full flex items-center justify-center font-bold py-3 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white"
            >
              Preview PDF
            </button>
            <button
              type="button"
              onClick={() => handleGeneratePDF(false)}
              className="w-full flex items-center justify-center font-bold py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                  clipRule="evenodd"
                />
              </svg>
              Download Travel Quotation PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TravelQuotationForm
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DatePicker, Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { Table, Card, Row, Col, Button, Tag } from 'antd';
import { AutoComplete } from 'antd';   // ← यह line ऊपर imports में add कर लें
import { DownloadOutlined } from '@ant-design/icons';
import {
    CalendarOutlined,
    UserOutlined,
    SearchOutlined,
    ReloadOutlined,
    ClearOutlined,
    CarOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    SolutionOutlined,
    MoneyCollectOutlined
} from '@ant-design/icons';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { AuthContext } from '../context/AuthContext';

const { Option } = Select;

const DashboardBookings = () => {
    const [bookings, setBookings] = useState([]);
    const { user } = useContext(AuthContext);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [filteredBookedOnly, setFilteredBookedOnly] = useState([]);
    const [activeTab, setActiveTab] = useState('booked');
    const [loading, setLoading] = useState(true);
    const [travelDateFilter, setTravelDateFilter] = useState(null);
    const [monthFilter, setMonthFilter] = useState(null); // NEW: Month filter
    const [selectedUser, setSelectedUser] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState([]);

    // Modal states
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [editForm] = Form.useForm();
    const [editLoading, setEditLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [locations, setLocations] = useState([]);

    // Advance Modal
    const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
    const [editingAdvanceBooking, setEditingAdvanceBooking] = useState(null);
    const [advanceForm] = Form.useForm();
    const [advanceLoading, setAdvanceLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchVehicles();
        fetchLocations();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const bookingsRes = await axios.get(`https://apitour.rajasthantouring.in/api/bookings`);

            // NAYA: Travel Date ke basis pe sort karo (sabse jaldi wali pehle)
            const sortedBookings = bookingsRes.data.sort((a, b) => {
                const dateA = parseTravelDate(a.clientDetails?.travelDate);
                const dateB = parseTravelDate(b.clientDetails?.travelDate);

                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateA - dateB; // ← Chhoti date (upcoming) pehle
            });

            const formattedBookings = sortedBookings.map(b => ({ ...b, type: "Booking" }));

            setBookings(formattedBookings);
            setFilteredBookings(formattedBookings);
            setFilteredBookedOnly(formattedBookings.filter(b =>
                ["Booked", "booked", "completed", "complete"].includes(b.status?.toLowerCase())
            ));

            const uniqueUsers = [...new Set(
                formattedBookings
                    .map(b => Array.isArray(b.createby) ? b.createby[0]?.name : b.createby?.name)
                    .filter(Boolean)
            )];
            setUsers(uniqueUsers);

        } catch (error) {
            console.error("Error fetching data:", error);
            message.error("Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await axios.get('https://apitour.rajasthantouring.in/api/vehicles');
            setVehicles(res.data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await axios.get('https://apitour.rajasthantouring.in/api/locations');
            setLocations(res.data || []);
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    const clearFilters = () => {
        setTravelDateFilter(null);
        setMonthFilter(null);
        setSelectedUser('all');
        setSearchText('');
    };

    const downloadExcel = (data, tabName) => {
        (function () {
            try {
                if (!data || data.length === 0) {
                    message.warning('No data to download');
                    return;
                }

                const prepareData = data.map((b, index) => {
                    const creator = Array.isArray(b.createby)
                        ? b.createby[0]?.name || 'N/A'
                        : b.createby?.name || 'N/A';

                    const vehicleNumber = b.vehicleSelection?.vehicleNumber || b.itineraryData?.vehicle?.number || '';
                    const vehicleModel = b.vehicleSelection?.vehicleModel || b.itineraryData?.vehicle?.model || '';
                    const vehicleDisplay = vehicleNumber || vehicleModel || 'N/A';

                    let travelDate = 'N/A';
                    if (b.clientDetails?.travelDate) {
                        const m = moment(b.clientDetails.travelDate, ['DD-MM-YYYY', 'YYYY-MM-DD'], true);
                        travelDate = m.isValid() ? m.format('DD-MM-YYYY') : b.clientDetails.travelDate;
                    }

                    let tripEndDate = 'N/A';
                    if (b.tripDates?.tripEndDate) {
                        const m = moment(b.tripDates.tripEndDate, ['DD-MM-YYYY', 'YYYY-MM-DD'], true);
                        tripEndDate = m.isValid() ? m.format('DD-MM-YYYY') : b.tripDates.tripEndDate;
                    }

                    return {
                        'S.No': index + 1,
                        'Creator': creator,
                        'Client Name': b.clientDetails?.name || 'N/A',
                        'Travel Date': travelDate,
                        'Pickup Location': b.tripDates?.pickupLocation || 'N/A',
                        'Trip End Date': tripEndDate,
                        'Dropoff Location': b.tripDates?.dropoffLocation || 'N/A',
                        'Vehicle': vehicleDisplay,
                        'Driver Name': b.driverDetails?.name || 'N/A',
                        'Driver Phone': b.driverDetails?.phone || 'N/A',
                        'Driver Advance': b.driverAdvance?.number || 0,
                        'Status': b.status || 'N/A',
                        'Total Amount': b.totalAmount || 0,
                    };
                });

                const ws = XLSX.utils.json_to_sheet(prepareData);
                ws['!cols'] = Array(13).fill({ wch: 18 });
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Bookings");
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const filename = `Bookings_${tabName}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                window.URL.revokeObjectURL(url);
                message.success('Download started: ' + filename);
            } catch (err) {
                console.error('Excel generation failed:', err);
                message.error('Failed to generate Excel');
            }
        })();
    };

    const parseTravelDate = (dateStr) => {
        if (!dateStr) return null;
        let m = moment(dateStr, 'DD-MM-YYYY', true);
        if (!m.isValid()) m = moment(dateStr, 'YYYY-MM-DD', true);
        return m.isValid() ? m : null;
    };

    // Smart Vehicle Display Function
    const getVehicleDisplay = (record) => {
        const num = record.vehicleSelection?.vehicleNumber || record.itineraryData?.vehicle?.number || '';
        const model = record.vehicleSelection?.vehicleModel || record.itineraryData?.vehicle?.model || '';
        const type = record.vehicleSelection?.vehicleType || record.itineraryData?.vehicle?.type || '';
        const display = num || model || type || 'N/A';
        const color = display === 'N/A' ? 'red' : 'blue';
        return <Tag color={color}>{display}</Tag>;
    };

    useEffect(() => {
        let filteredB = bookings;

        if (travelDateFilter) {
            const filterDate = travelDateFilter.format('YYYY-MM-DD');
            filteredB = filteredB.filter(b => {
                const m = parseTravelDate(b.clientDetails?.travelDate);
                return m && m.format('YYYY-MM-DD') === filterDate;
            });
        }

        if (monthFilter) {
            const filterYM = monthFilter.format('YYYY-MM');
            filteredB = filteredB.filter(b => {
                const m = parseTravelDate(b.clientDetails?.travelDate);
                return m && m.format('YYYY-MM') === filterYM;
            });
        }

        if (selectedUser !== 'all') {
            filteredB = filteredB.filter(b => {
                const creator = Array.isArray(b.createby) ? b.createby[0]?.name : b.createby?.name;
                return creator === selectedUser;
            });
        }

        if (searchText) {
            const lower = searchText.toLowerCase();
            filteredB = filteredB.filter(b =>
                (b.clientDetails?.name || '').toLowerCase().includes(lower) ||
                (b.itineraryData?.tourcode || '').toLowerCase().includes(lower) ||
                (b.itineraryData?.titles?.[0] || '').toLowerCase().includes(lower)
            );
        }

        // NAYA: Hamesha Travel Date ke basis pe sort rakho (upcoming first)
        filteredB.sort((a, b) => {
            const da = parseTravelDate(a.clientDetails?.travelDate);
            const db = parseTravelDate(b.clientDetails?.travelDate);
            if (!da) return 1;
            if (!db) return -1;
            return da - db; // ← Chhoti date pehle
        });

        setFilteredBookings(filteredB);
        setFilteredBookedOnly(filteredB.filter(b =>
            ["Booked", "booked", "completed", "complete"].includes(b.status?.toLowerCase())
        ));
    }, [travelDateFilter, monthFilter, selectedUser, searchText, bookings]);



    const handleVehicleChange = (vehicleId) => {
        if (!vehicleId) {
            editForm.setFieldsValue({ vehicleNumber: '', vehicleType: '', vehicleModel: '', capacity: '' });
            return;
        }
        const v = vehicles.find(v => v._id === vehicleId);
        if (v) {
            editForm.setFieldsValue({
                vehicleNumber: v.number || '',
                vehicleType: v.type || '',
                vehicleModel: v.model || '',
                capacity: v.capacity || '',
            });
        }
    };

const openEditModal = (booking) => {
    setEditingBooking(booking);
    const currentVehicleId = booking.vehicleSelection?.vehicleId || booking.itineraryData?.vehicle?._id || null;

    // ====== SUPER ACCURATE PICKUP & DROPOFF FROM DAYS ARRAY ======
    let smartPickup = booking.tripDates?.pickupLocation?.trim() || '';
    let smartDropoff = booking.tripDates?.dropoffLocation?.trim() || '';

    const days = booking.itineraryData?.days || [];

    // Pickup: Day 1 का पहला location (सबसे reliable!)
    if (!smartPickup && days.length > 0 && days[0]?.locations?.length > 0) {
        smartPickup = days[0].locations[0];
        smartPickup = smartPickup.charAt(0).toUpperCase() + smartPickup.slice(1).toLowerCase();
    }

    // Dropoff: आखिरी Day का आखिरी location
    if (!smartDropoff && days.length > 0) {
        const lastDay = days[days.length - 1];
        if (lastDay?.locations?.length > 0) {
            const lastLocation = lastDay.locations[lastDay.locations.length - 1];
            smartDropoff = lastLocation.charAt(0).toUpperCase() + lastLocation.slice(1).toLowerCase();
        }
    }

    // Fallback: अगर locations ना मिले तो title से try करो (very rare case)
    if (!smartPickup && days[0]?.titles?.[0]) {
        const title = days[0].titles[0];
        const match = title.match(/(?:Arrival in|Start in)\s*[–-]?\s*([A-Za-z\s]+)/i);
        if (match) smartPickup = match[1].trim();
    }

    editForm.setFieldsValue({
        driverName: booking.driverDetails?.name || '',
        driverPhone: booking.driverDetails?.phone || '',
        vehicleId: currentVehicleId,
        vehicleNumber: booking.vehicleSelection?.vehicleNumber || booking.itineraryData?.vehicle?.number || '',
        vehicleType: booking.vehicleSelection?.vehicleType || booking.itineraryData?.vehicle?.type || '',
        vehicleModel: booking.vehicleSelection?.vehicleModel || booking.itineraryData?.vehicle?.model || '',
        capacity: booking.vehicleSelection?.capacity || booking.itineraryData?.vehicle?.capacity || '',

        // अब 100% सही आएगा!
        pickupLocation: smartPickup || '',
        dropoffLocation: smartDropoff || '',

        tripEndDate: booking.tripDates?.tripEndDate ? moment(booking.tripDates.tripEndDate, 'DD-MM-YYYY') : null,
    });

    if (currentVehicleId) {
        setTimeout(() => handleVehicleChange(currentVehicleId), 0);
    }
    setEditModalVisible(true);
};

    const handleEditSave = async (values) => {
        try {
            setEditLoading(true);
            const updateData = {
                driverDetails: { name: values.driverName || '', phone: values.driverPhone || '' },
                vehicleSelection: {
                    vehicleId: values.vehicleId || null,
                    vehicleNumber: values.vehicleNumber || '',
                    vehicleType: values.vehicleType || '',
                    vehicleModel: values.vehicleModel || '',
                    capacity: values.capacity || '',
                },
                tripDates: {
                    pickupLocation: values.pickupLocation || '',
                    dropoffLocation: values.dropoffLocation || '',
                    tripEndDate: values.tripEndDate ? values.tripEndDate.format('DD-MM-YYYY') : '',
                },
            };

            await axios.put(`https://apitour.rajasthantouring.in/api/bookings/${editingBooking._id}/driver`, updateData);
            message.success('Updated successfully');
            setEditModalVisible(false);
            editForm.resetFields();
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Update failed');
        } finally {
            setEditLoading(false);
        }
    };

    const openAdvanceModal = (booking) => {
        setEditingAdvanceBooking(booking);
        advanceForm.setFieldsValue({ advanceAmount: booking.driverAdvance?.number || 0 });
        setAdvanceModalVisible(true);
    };

    const handleAdvanceSave = async (values) => {
        try {
            setAdvanceLoading(true);
            await axios.put(`https://apitour.rajasthantouring.in/api/bookings/${editingAdvanceBooking._id}/driver`, {
                driverAdvance: { number: values.advanceAmount || 0 }
            });
            message.success('Advance updated');
            setAdvanceModalVisible(false);
            advanceForm.resetFields();
            fetchData();
        } catch (error) {
            message.error('Update failed');
        } finally {
            setAdvanceLoading(false);
        }
    };

    const formatAdvance = (amt) => amt >= 1000 ? `${(amt / 1000).toFixed(1)}K` : amt;

    const bookedColumns = [
        { title: <><UserOutlined /> Creator</>, width: 80, render: (_, r) => Array.isArray(r.createby) ? r.createby[0]?.name : r.createby?.name },
        { title: 'Client Name', dataIndex: ['clientDetails', 'name'], width: 130 },
        {
            title: <><CalendarOutlined /> Travel Date & Pickup</>, width: 170, render: (_, r) => {
                const d = parseTravelDate(r.clientDetails?.travelDate);
                return <div><strong>{d ? d.format('DD-MM-YYYY') : 'N/A'}</strong><div style={{ fontSize: 11, color: '#666' }}>{r.tripDates?.pickupLocation || 'N/A'}</div></div>
            }
        },
        {
            title: <><EnvironmentOutlined /> End & Dropoff</>, width: 170, render: (_, r) => {
                const end = r.tripDates?.tripEndDate ? moment(r.tripDates.tripEndDate, ['DD-MM-YYYY', 'YYYY-MM-DD'], true) : null;
                const ed = end?.isValid() ? end.format('DD-MM-YYYY') : 'N/A';
                return <div><strong>{ed}</strong><div style={{ fontSize: 11, color: '#666' }}>{r.tripDates?.dropoffLocation || 'N/A'}</div></div>
            }
        },
        { title: <><CarOutlined /> Vehicle</>, width: 120, render: getVehicleDisplay },
        {
            title: <><SolutionOutlined /> Driver</>, width: 140, render: (_, r) => (
                <div><strong>{r.driverDetails?.name || '-'}</strong><div style={{ fontSize: 11, color: '#666' }}>{r.driverDetails?.phone || '-'}</div></div>
            )
        },
        { title: <><MoneyCollectOutlined /> Advance</>, width: 90, render: (_, r) => `₹${formatAdvance(r.driverAdvance?.number || 0)}` },
        {
            title: 'Actions', fixed: 'right', width: 160, render: (_, r) => (
                <div>
                    <Button size="small" type="primary" onClick={() => openEditModal(r)}>Edit</Button>{' '}
                    <Button size="small" icon={<MoneyCollectOutlined />} onClick={() => openAdvanceModal(r)}>Advance</Button>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '20px' }}>
            <style jsx>{`.completed-row { background: #fff2f0 !important; } .completed-row:hover { background: #ffebee !important; }`}</style>

            <h1 className='text-2xl mb-5 font-semibold text-blue-600'><CalendarOutlined /> All Bookings Dashboard</h1>

            <div style={{ marginBottom: 20, borderBottom: '2px solid #e0e0e0', paddingBottom: 10 }}>
                <Button type={activeTab === 'booked' ? 'primary' : 'default'} size="large" onClick={() => setActiveTab('booked')}>
                    Confirmed Bookings ({filteredBookedOnly.length})
                </Button>
            </div>

            {activeTab === 'booked' && (
                <>
                    <Row gutter={16} style={{ marginBottom: 20 }}>
                        <Col span={12}><Card title="Total Booked"><h2 style={{ color: '#1890ff' }}>{filteredBookedOnly.length}</h2></Card></Col>
                        <Col span={12}><Card title="Total Amount"><h2 style={{ color: '#52c41a' }}>₹{filteredBookedOnly.reduce((s, b) => s + (b.totalAmount || 0), 0)}</h2></Card></Col>
                    </Row>

                    <Card title={<><SearchOutlined /> Filters</>} style={{ marginBottom: 20 }}>
                        <Row gutter={16}>
                            <Col xs={24} lg={5}>
                                <label><strong>User:</strong></label>
                                <Select value={selectedUser} onChange={setSelectedUser} style={{ width: '100%', marginTop: 4 }}>
                                    <Option value="all">All Users</Option>
                                    {users.map(u => <Option key={u} value={u}>{u}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} lg={5}>
                                <label><strong>Month:</strong></label>
                                <DatePicker picker="month" value={monthFilter} onChange={setMonthFilter} format="MMMM YYYY" style={{ width: '100%', marginTop: 4 }} allowClear placeholder="All Months" />
                            </Col>
                            <Col xs={24} lg={5}>
                                <label><strong>Date:</strong></label>
                                <DatePicker value={travelDateFilter} onChange={setTravelDateFilter} format="DD-MM-YYYY" style={{ width: '100%', marginTop: 4 }} allowClear />
                            </Col>
                            <Col xs={24} lg={5}>
                                <label><strong>Search:</strong></label>
                                <Input.Search value={searchText} onChange={e => setSearchText(e.target.value)} style={{ marginTop: 4 }} />
                            </Col>
                            <Col xs={24} lg={4}>
                                <div style={{ marginTop: 28, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <Button icon={<ReloadOutlined />} onClick={fetchData} type="primary">Refresh</Button>
                                    <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear</Button>
                                    <Button icon={<DownloadOutlined />} onClick={() => downloadExcel(filteredBookedOnly, 'Booked')}>Excel</Button>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    <Card>
                        <Table
                            columns={bookedColumns}
                            dataSource={filteredBookedOnly}
                            rowKey="_id"
                            loading={loading}
                            scroll={{ x: 1300 }}
                            size="small"
                            pagination={{ pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }}
                        />
                    </Card>
                </>
            )}

            {/* Edit Modal */}
            <Modal
                title={<><SolutionOutlined /> Edit Driver & Vehicle</>}
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={() => editForm.submit()}
                confirmLoading={editLoading}
                width={900}
            >
                <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
                    <div style={{ background: '#f0f5ff', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                        <strong>Client:</strong> {editingBooking?.clientDetails?.name} | <strong>Tour:</strong> {editingBooking?.itineraryData?.tourcode}
                    </div>

                    <h4><SolutionOutlined /> Driver Details</h4>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="driverName" label="Name" rules={[{ required: false }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="driverPhone" label="Phone" rules={[{ required: false, pattern: /^\d{10}$/ }]}><Input /></Form.Item></Col>
                    </Row>

                    <h4><CarOutlined /> Vehicle Details</h4>
                    <Form.Item name="vehicleId" label="Select Vehicle">
                        <Select onChange={handleVehicleChange} allowClear>
                            {vehicles.map(v => <Option key={v._id} value={v._id}>{v.number} - {v.make} {v.model}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="vehicleNumber" label="Number"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="vehicleType" label="Type"><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="vehicleModel" label="Model"><Input /></Form.Item></Col>
                    </Row>

                    <h4><EnvironmentOutlined /> Trip Locations</h4>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="pickupLocation"
                                label="Pickup Location"
                                rules={[{ required: false, message: 'Pickup location required' }]}
                            >
                                <AutoComplete
                                    options={locations.map(loc => ({ value: loc.name }))}
                                    filterOption={(inputValue, option) =>
                                        option.value.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                    placeholder="e.g. Jaipur Airport, type 'kum' for Kumbhalgarh..."
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="dropoffLocation"
                                label="Dropoff Location"
                                rules={[{ required: false, message: 'Dropoff location required' }]}
                            >
                                <AutoComplete
                                    options={locations.map(loc => ({ value: loc.name }))}
                                    filterOption={(inputValue, option) =>
                                        option.value.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                    placeholder="e.g. Delhi Airport, Kumbhalgarh Fort..."
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="tripEndDate" label="Trip End Date"><DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>

            {/* Advance Modal */}
            <Modal
                title={<><MoneyCollectOutlined /> Update Driver Advance</>}
                open={advanceModalVisible}
                onCancel={() => setAdvanceModalVisible(false)}
                onOk={() => advanceForm.submit()}
                confirmLoading={advanceLoading}
            >
                <Form form={advanceForm} onFinish={handleAdvanceSave}>
                    <Form.Item name="advanceAmount" label="Advance Amount (₹)" rules={[{ required: true }]}>
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DashboardBookings;
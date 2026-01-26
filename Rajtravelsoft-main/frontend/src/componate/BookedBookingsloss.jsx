import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Tag, Typography, Card, Row, Col, Statistic } from 'antd';
import { EditOutlined, DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined, WalletOutlined, DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const { Title } = Typography;

const BookedBookings = () => {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expenseModal, setExpenseModal] = useState({ visible: false, bookingId: null, expenseId: null });
    const [form] = Form.useForm();
    const [selectedBookings, setSelectedBookings] = useState([]);
    const [summary, setSummary] = useState({ totalPaid: 0, totalExpenses: 0, totalProfit: 0 });

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        fetchBookings();
    }, [user]);

    const fetchBookings = async () => {
        try {
            const res = await axios.post('https://apitour.rajasthantouring.in/api/bookings/booked-completed', { user });
            const data = res.data || [];
            setBookings(data);
            calculateSummary(data);
        } catch (err) {
            console.error(err);
            message.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Calculate total payments, expenses & profit/loss
    const calculateSummary = (data) => {
        const totalPaid = data.reduce((acc, b) => acc + (b.totalPaid || 0), 0);
        const totalExpenses = data.reduce((acc, b) => acc + (b.totalExpenses || 0), 0);
        const totalProfit = totalPaid - totalExpenses;
        setSummary({ totalPaid, totalExpenses, totalProfit });
    };

    const getTitle = () => {
        if (!user) return 'Booked & Completed Bookings';
        return user.role === 'admin'
            ? 'All Booked & Completed Bookings (Admin View)'
            : 'My Booked & Completed Bookings';
    };

    const columns = [
        { title: 'Booking ID', dataIndex: 'bookingId', key: 'bookingId' },
        { title: 'Client Name', dataIndex: 'clientDetails', key: 'clientName', render: (client) => client?.name || 'N/A' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={status === 'completed' ? 'green' : 'blue'}>{status}</Tag>
        },
        { title: 'Total Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (amt) => `₹${amt?.toLocaleString()}` },
        {
            title: 'Successful Payments',
            key: 'successfulPayments',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    {record.successfulPayments?.map((p, i) => (
                        <Tag key={i} color="green">{`₹${p.amount} (${p.method})`}</Tag>
                    ))}
                    <div>Total Paid: ₹{record.totalPaid?.toLocaleString()}</div>
                </Space>
            )
        },
        {
            title: 'Expenses',
            key: 'expenses',
            render: (_, record) => (
                <div>
                    Total: ₹{(record.totalExpenses || 0).toLocaleString()}
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => setExpenseModal({ visible: true, bookingId: record._id, expenseId: null })}
                        disabled={!user || user.role !== 'admin'}
                    >
                        Add/Edit
                    </Button>
                </div>
            )
        },
        {
            title: 'Profit/Loss',
            key: 'profitLoss',
            render: (_, record) => (
                <Tag color={record.profitLoss > 0 ? 'green' : (record.profitLoss < 0 ? 'red' : 'orange')}>
                    {record.profitLossStatus}: ₹{record.profitLoss?.toLocaleString()}
                </Tag>
            )
        },
        { title: 'Travel Date', dataIndex: 'clientDetails', key: 'travelDate', render: (client) => client?.travelDate || 'N/A' },
    ];

    const addExpense = async (values) => {
        try {
            await axios.post(`https://apitour.rajasthantouring.in/api/bookings/${expenseModal.bookingId}/add-expense`, values);
            message.success('Expense added successfully');
            form.resetFields();
            setExpenseModal({ visible: false, bookingId: null, expenseId: null });
            fetchBookings();
        } catch (err) {
            message.error('Failed to add expense');
        }
    };

    const handleExport = async () => {
        if (selectedBookings.length === 0) {
            message.warning('Select at least one booking');
            return;
        }
        try {
            const res = await axios.post(
                'https://apitour.rajasthantouring.in/api/bookings/export-excel',
                { bookingIds: selectedBookings },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bookings-report-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            message.error('Failed to export Excel');
        }
    };

    if (!user) {
        return <div style={{ padding: 24 }}><Title level={3}>Please log in to view bookings</Title></div>;
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>{getTitle()}</Title>

            {/* ✅ Dashboard Summary Boxes */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Total Successful Payments"
                            value={summary.totalPaid}
                            prefix={<WalletOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Total Expenses"
                            value={summary.totalExpenses}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Net Profit / Loss"
                            value={summary.totalProfit}
                            prefix={<LineChartOutlined />}
                            valueStyle={{ color: summary.totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
                            suffix={summary.totalProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                    </Card>
                </Col>
            </Row>

            <Space style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    disabled={selectedBookings.length === 0}
                >
                    Export Selected to Excel
                </Button>
            </Space>

            <Table
                columns={columns}
                dataSource={Array.isArray(bookings) ? bookings : []}
                loading={loading}
                rowKey="_id"
                rowSelection={{
                    type: 'checkbox',
                    onChange: (selected) => setSelectedBookings(selected.map(id => id.toString())),
                }}
            />

            {/* Expense Modal */}
            <Modal
                title={expenseModal.expenseId ? "Edit Expense" : "Add Expense"}
                open={expenseModal.visible}
                onCancel={() => setExpenseModal({ ...expenseModal, visible: false })}
                onOk={() => form.submit()}
                okButtonProps={{ disabled: !user || user.role !== 'admin' }}
            >
                <Form form={form} onFinish={addExpense} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input placeholder="Expense Title" />
                    </Form.Item>
                    <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                        <InputNumber placeholder="Amount" min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Description" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BookedBookings;

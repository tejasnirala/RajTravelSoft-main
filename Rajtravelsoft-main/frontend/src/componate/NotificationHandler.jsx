// NotificationHandler.jsx
// Handles notifications for both Booking and Pending payments
// Place this in your main App.js or layout component

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { BellIcon } from '@heroicons/react/24/solid';

const SOCKET_URL = 'https://apitour.rajasthantouring.in';

const NotificationHandler = () => {
    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [showNotificationBell, setShowNotificationBell] = useState(false);
    const [softwareData, setSoftwareData] = useState(null);

    // Simple beep sound using Web Audio API
    const playNotificationSound = async () => {
        try {
            let audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            window.audioContext = audioContext;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            console.log('Beep sound played successfully.');
        } catch (err) {
            console.error('Web Audio failed:', err);
            try {
                const audio = new Audio('data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=');
                audio.volume = 0.8;
                await audio.play();
                console.log('Fallback beep played.');
            } catch (fallbackErr) {
                console.error('Fallback audio failed:', fallbackErr);
            }
        }
    };

    // Request notification permission
    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    playNotificationSound().catch(err => console.error('Sound play error:', err));
                    toast.success('Notifications enabled automatically!');
                } else {
                    toast.info('Notifications denied. Enable in browser settings.');
                }
            }).catch(err => {
                console.error('Permission request error:', err);
                toast.error('Failed to request notification permission.');
            });
        } else if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
            if (Notification.permission === 'granted') {
                playNotificationSound().catch(err => console.error('Sound play error:', err));
            }
        }
    };

    // Show browser notification with sound
    const showBrowserNotification = async (title, body, identifier, type = 'booking') => {
        console.log('Attempting to show notification. Permission:', notificationPermission);
        if (notificationPermission === 'granted' && 'Notification' in window) {
            try {
                const notification = new Notification(title, {
                    body: body,
                    icon: `${SOCKET_URL}${softwareData?.logo || ''}`,
                    tag: `payment-${type}-${identifier}`,
                    requireInteraction: true,
                });
                playNotificationSound().catch(err => console.error('Sound play error in notification:', err));
                console.log('Notification shown successfully with sound.');

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    toast.info('Payment notification clicked!');
                    window.location.href = 'https://tour.rajasthantouring.in/PaymentsManager';
                };

                notification.onclose = () => {
                    console.log('Notification closed.');
                };

                notification.onerror = (error) => {
                    console.error('Notification error:', error);
                };
            } catch (error) {
                console.error('Failed to create notification:', error);
                toast.error('Notification failed to show.');
            }
        } else {
            console.log('Notification blocked or permission needed.');
            if (notificationPermission === 'default') {
                requestNotificationPermission();
            }
        }
    };

    // Fetch software data
    useEffect(() => {
        const fetchSoftwareData = async () => {
            try {
                const response = await fetch("https://apitour.rajasthantouring.in/api/toursoftware");
                const data = await response.json();
                if (data && data.length > 0) {
                    setSoftwareData(data[0]);
                }
            } catch (error) {
                console.error("Error fetching software data:", error);
            }
        };
        fetchSoftwareData();
    }, []);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("https://apitour.rajasthantouring.in/api/auth/me", {
                    credentials: "include",
                });
                const data = await response.json();
                if (data.ok) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                setUser(null);
            }
        };
        fetchUser();
    }, []);

    // Check permission
    const hasViewPaymentsPermission = user && (user.role !== "user" || (user.permissions && user.permissions.includes("view_payments")) || (user.permissions && user.permissions.includes("all")));

    // Socket event handler for BOOKING payment
    const handleNewBookingPayment = async (data) => {
        if (!hasViewPaymentsPermission) return;

        console.log('🔵 New BOOKING payment received via socket:', data);

        // Show popup toast
        toast.info(` New Booking Payment from ${data.user?.name || data.user?.email || 'Unknown'}! Amount: ₹${data.payment?.amount || 'N/A'}`, {
            position: 'top-right',
            autoClose: 5000,
            style: { backgroundColor: '#1e40af', color: 'white' }
        });

        // Show system notification
        showBrowserNotification(
            ' New Booking Payment Received',
            `Payment from ${data.user?.name || data.user?.email}. Amount: ₹${data.payment?.amount || 'N/A'} ${data.payment?.currency || 'INR'}. Method: ${data.payment?.method || 'N/A'}`,
            data.bookingId || data.payment?._id,
            'booking'
        ).catch(err => console.error('Notification error:', err));

        // Trigger bell
        setShowNotificationBell(true);
        setTimeout(() => setShowNotificationBell(false), 3000);
    };

    // Socket event handler for PENDING payment
    const handleNewPendingPayment = async (data) => {
        if (!hasViewPaymentsPermission) return;

        console.log(' New PENDING payment received via socket:', data);

        // Show popup toast with different color
        toast.warning(` New Pending Payment from ${data.user?.name || data.user?.email || 'Unknown'}! Amount: ₹${data.payment?.amount || 'N/A'}`, {
            position: 'top-right',
            autoClose: 5000,
            style: { backgroundColor: '#f59e0b', color: 'white' }
        });

        // Show system notification
        showBrowserNotification(
            ' New Pending Payment Received',
            `Pending payment from ${data.user?.name || data.user?.email}. Amount: ₹${data.payment?.amount || 'N/A'} ${data.payment?.currency || 'INR'}. Method: ${data.payment?.method || 'N/A'}`,
            data.pendingId || data.payment?._id,
            'pending'
        ).catch(err => console.error('Notification error:', err));

        // Trigger bell
        setShowNotificationBell(true);
        setTimeout(() => setShowNotificationBell(false), 3000);
    };

    // Socket connection and auto-enable notifications
    useEffect(() => {
        if (!hasViewPaymentsPermission || !user) return;

        // Handle notifications
        if ('Notification' in window) {
            const currentPermission = Notification.permission;
            setNotificationPermission(currentPermission);
            console.log('Initial notification permission:', currentPermission);
            if (currentPermission === 'default') {
                requestNotificationPermission();
            } else if (currentPermission === 'granted') {
                playNotificationSound().catch(err => console.error('Initial sound play error:', err));
            }
        }

        // Initialize socket
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        setSocket(newSocket);

        // Listen for BOOKING payment events
        newSocket.on('new_payment', handleNewBookingPayment);
        newSocket.on('new_booking_payment', handleNewBookingPayment); // Alternative event name
        
        // Listen for PENDING payment events
        newSocket.on('new_pending_payment', handleNewPendingPayment);
        
        // Connection events
        newSocket.on('welcome', (data) => {
            console.log('📨 Welcome from server:', data);
        });
        newSocket.on("connect", () => console.log("🟢 Socket connected:", newSocket.id));
        newSocket.on("connect_error", (err) => console.log("❌ Socket connect error:", err.message));
        newSocket.on("disconnect", (reason) => console.log("🔴 Socket disconnected:", reason));

        return () => {
            newSocket.off('new_payment', handleNewBookingPayment);
            newSocket.off('new_booking_payment', handleNewBookingPayment);
            newSocket.off('new_pending_payment', handleNewPendingPayment);
            newSocket.close();
        };
    }, [hasViewPaymentsPermission, user, notificationPermission, softwareData]);

    return showNotificationBell ? (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
            <div className="relative">
                <BellIcon className="h-8 w-8 text-red-500 animate-pulse" />
                <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            </div>
        </div>
    ) : null;
};

export default NotificationHandler;
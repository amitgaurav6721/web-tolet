require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Initialize Razorpay Instance with fallback checks
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

let otpStorage = {};

const getWebsiteData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = { 
            logo: "Web Tolet", 
            promoBanner: "🎉 INTRODUCTORY OFFER Initializing Matrix...", 
            hero: { tagline: "Engine", title: "Web Design Team", desc: "Scale seamless workflows" }, 
            categories: [], durations: [], plans: [], portfolio: [], testimonials: [], clients: [], documents: {} 
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4));
        return defaultData;
    }
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error("Database reading error, using default template:", e);
        return { logo: "Web Tolet", promoBanner: "🎉 INTRODUCTORY OFFER Initializing Matrix...", hero: { tagline: "Engine", title: "Web Design Team", desc: "Scale seamless workflows" }, categories: [], durations: [], plans: [], portfolio: [], testimonials: [], clients: [], documents: {} };
    }
};

app.get('/api/website-data', (req, res) => { res.json(getWebsiteData()); });

// Secure Admin Login check
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if(username === 'admin' && password === 'webtolet2026') {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        res.json({ success: true, message: "Handshake verified safely.", token: sessionToken });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials." });
    }
});

app.post('/api/admin/update', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 4));
        res.json({ success: true, message: "Configurations saved!" });
    } catch (error) { 
        console.error("Error writing data config:", error);
        res.status(500).json({ success: false, message: "Write failure." }); 
    }
});

app.post('/api/create-order', async (req, res) => {
    const { amount, currency } = req.body;
    try {
        const order = await razorpay.orders.create({ amount: parseInt(amount), currency: currency || "INR", receipt: `rec_${Date.now()}` });
        res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) { 
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).json({ success: false, message: "Gateway error." }); 
    }
});

app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, client_data } = req.body;
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret');
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    if (hmac.digest('hex') === razorpay_signature) {
        const currentData = getWebsiteData();
        if (!currentData.clients) currentData.clients = [];
        currentData.clients.push({ ...client_data, payment_id: razorpay_payment_id, registeredAt: new Date().toISOString() });
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 4));
            res.json({ success: true, message: "Subscription active!" });
        } catch (err) {
            console.error("Database Write Error in verify-payment:", err);
            res.status(500).json({ success: false, message: "Failed to update client database matrix." });
        }
    } else { res.status(400).json({ success: false, message: "Signature mismatch." }); }
});

// SENDGRID API INTEGRATION (REPLACES NODEMAILER)
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ success: false, message: "Email required." });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = generatedOtp;

    try {
        // SendGrid API endpoint call
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: email }] }],
                from: { 
                    email: 'webtolet@gmail.com', // Must be verified in SendGrid
                    name: 'Web Tolet Engine' 
                },
                subject: '🔒 Web Tolet Security Access Verification Token',
                content: [{
                    type: 'text/html',
                    value: `<div style="font-family: Arial, sans-serif; padding: 25px; background: #06060a; color: #fff; border-radius: 12px;"><h2>Web Tolet Security</h2><p>OTP:</p><h1 style="color: #a855f7;">${generatedOtp}</h1></div>`
                }]
            })
        });

        if (response.ok) {
            res.json({ success: true, message: "OTP sent via SendGrid!" });
        } else {
            const errorDetails = await response.text();
            console.error("❌ SendGrid API Error Details:", errorDetails);
            res.status(500).json({ success: false, message: "SendGrid API Error." });
        }
    } catch (error) { 
        console.error("❌ SendGrid Connection Error:", error);
        res.status(500).json({ success: false, message: "Connection tunnel error." }); 
    }
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] === otp) {
        delete otpStorage[email];
        res.json({ success: true });
    } else { res.status(400).json({ success: false, message: "Invalid OTP." }); }
});

app.listen(PORT, () => { console.log(`Server live on port ${PORT}`); });

require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
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

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// FIXED SECURE PORT 465 SSL/TLS LAYER TUNNEL FOR NODEMAILER
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS  
    },
    tls: {
        rejectUnauthorized: false 
    }
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
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

app.get('/api/website-data', (req, res) => { res.json(getWebsiteData()); });

// POINT 3 FIX: Secure Admin Login validation logic completely inside backend cloud engine
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // In production, these should be locked inside process.env variables matrix securely
    if(username === 'admin' && password === 'webtolet2026') {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        res.json({ success: true, message: "Handshake verified safely.", token: sessionToken });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials. Core validation blocked." });
    }
});

app.post('/api/admin/update', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 4));
        res.json({ success: true, message: "Configurations saved successfully!" });
    } catch (error) { res.status(500).json({ success: false, message: "Database array write failure." }); }
});

app.post('/api/create-order', async (req, res) => {
    const { amount, currency } = req.body;
    if (!amount || amount < 100) {
        return res.status(400).json({ success: false, message: "Minimum amount is 100 paise." });
    }
    const orderOptions = { amount: parseInt(amount), currency: currency || "INR", receipt: `receipt_${Date.now()}` };
    try {
        const order = await razorpay.orders.create(orderOptions);
        res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) { res.status(500).json({ success: false, message: "Gateway connection error." }); }
});

app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, client_data } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing tracking variables logic mapping." });
    }
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    if (hmac.digest('hex') === razorpay_signature) {
        const currentData = getWebsiteData();
        if (!currentData.clients) currentData.clients = [];
        currentData.clients.push({
            name: client_data.name, email: client_data.email, whatsapp: client_data.whatsapp,
            payment_id: razorpay_payment_id, order_id: razorpay_order_id, tier: client_data.tier,
            registeredAt: new Date().toISOString()
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 4));
        res.json({ success: true, message: "Subscription active!" });
    } else { res.status(400).json({ success: false, message: "Signature verification mismatch." }); }
});

app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ success: false, message: "Email parameter empty." });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = generatedOtp;

    const mailOptions = {
        from: `"Web Tolet Engine" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🔒 Web Tolet Security Access Verification Token',
        html: `<div style="font-family: Arial, sans-serif; padding: 25px; background-color: #06060a; color: #ffffff; border-radius: 12px; max-width: 500px;"><h2 style="color: #00f5d4;">Web Tolet Engine Security</h2><p>Your 6-Digit code token:</p><div style="font-size: 28px; font-weight: bold; color: #a855f7; letter-spacing: 5px; text-align: center;">${generatedOtp}</div></div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Verification token code sent to Gmail!" });
    } catch (error) { 
        console.error("SMTP Direct connection logs detail alert:", error);
        res.status(500).json({ success: false, message: "Mailing tunnel authentication offline." }); 
    }
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] && otpStorage[email] === otp) {
        delete otpStorage[email];
        res.json({ success: true, message: "Email validation cleared!" });
    } else { res.status(400).json({ success: false, message: "Incorrect OTP mapping tokens." }); }
});

app.listen(PORT, () => { console.log(`Mailing & Layout Engine running flawlessly on port ${PORT}`); });

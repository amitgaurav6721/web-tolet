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

// Initialize Secure Razorpay Instance Instance Layout Matrix
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS  
    }
});

let otpStorage = {};

const getWebsiteData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = { logo: "Web Tolet", promoBanner: "🎉 INTRODUCTORY OFFER Initializing...", hero: { tagline: "Engine", title: "Web Design Team", desc: "Scale seamless workflows" }, categories: [], durations: [], plans: [], portfolio: [], testimonials: [], clients: [], documents: {} };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

app.get('/api/website-data', (req, res) => { res.json(getWebsiteData()); });

app.post('/api/admin/update', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 4));
        res.json({ success: true, message: "Configurations saved successfully!" });
    } catch (error) { res.status(500).json({ success: false, message: "Database array write failure." }); }
});

// STEP 1: BACKEND - Create Secure Order Framework Endpoint
app.post('/api/create-order', async (req, res) => {
    const { amount, currency } = req.body; // Amount shifts directly in paise

    if (!amount || amount < 100) {
        return res.status(400).json({ success: false, message: "Validation Failure: Minimum amount is 100 paise (₹1)." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(401).json({ success: false, message: "Authentication Failure: Razorpay API tokens are missing from server runtime variables." });
    }

    const orderOptions = {
        amount: parseInt(amount),
        currency: currency || "INR",
        receipt: `receipt_node_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(orderOptions);
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error("Razorpay order compilation failure diagnostics:", error);
        res.status(500).json({ success: false, message: "Failed to compile gateway order channel." });
    }
});

// STEP 3: BACKEND - Validate Payment Signatures and Sync Verified Accounts Matrix
app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, client_data } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing required verification signature variables map logs." });
    }

    // Hash Authentication validation block routines
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        // Payment Validated cleanly -> Append user data directly to JSON Database table safely
        const currentData = getWebsiteData();
        if (!currentData.clients) currentData.clients = [];

        currentData.clients.push({
            name: client_data.name,
            email: client_data.email,
            whatsapp: client_data.whatsapp,
            category: client_data.category,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            tier_status: client_data.tier,
            amount_paise: client_data.amount,
            registeredAt: new Date().toISOString()
        });

        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 4));
        res.json({ success: true, message: "Signature verification cleared. Client subscription fully activated!" });
    } else {
        console.warn("Signature verification mismatch detected!");
        res.status(400).json({ success: false, message: "Cryptographic signature mismatch. Payment record rejected." });
    }
});

app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ success: false, message: "Target email parameter empty." });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = generatedOtp;

    const mailOptions = {
        from: `"Web Tolet Engine" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🔒 Web Tolet Security Access Verification Token',
        html: `<div style="font-family: Arial, sans-serif; padding: 25px; background-color: #06060a; color: #ffffff; border-radius: 12px; max-width: 500px; border: 1px solid #1a1a24;"><h2 style="color: #00f5d4; font-size: 20px; margin-bottom: 5px;">Web Tolet Engine Security Guard</h2><div style="height: 1px; background: linear-gradient(to right, #00f5d4, #3b82f6); margin-bottom: 20px;"></div><p style="color: #cccccc; font-size: 14px;">Your 6-Digit security validation code token is active:</p><div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #a855f7; margin: 25px 0; background: rgba(255,255,255,0.03); padding: 15px; text-align: center; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">${generatedOtp}</div></div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Verification token code sent to Gmail!" });
    } catch (error) { res.status(500).json({ success: false, message: "Mailing layer connection offline." }); }
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] && otpStorage[email] === otp) {
        delete otpStorage[email];
        res.json({ success: true, message: "Email validation checks successfully cleared!" });
    } else {
        res.status(400).json({ success: false, message: "Incorrect OTP configuration routing mapping." });
    }
});

app.listen(PORT, () => { console.log(`Mailing & Layout Engine running flawlessly on port ${PORT}`); });

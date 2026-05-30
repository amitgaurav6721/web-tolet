// 1. Environment variables package ko load karna (Sabse top par)
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware Setup
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Static frontend files ko serve karne ke liye

// SECURE TRANSPORT ENGINE: Credentials are now completely driven via process.env variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS  
    }
});

// Temporary memory infrastructure to track active OTP loops
let otpStorage = {};

// Helper Function: Database (JSON file) se data read karna
const getWebsiteData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
            logo: "Web Tolet",
            promoBanner: "🎉 INTRODUCTORY OFFER: Use code PREMIUM26 to unlock immediate 20% flat savings on design queues!",
            hero: {
                tagline: "Design & Dev Engine",
                title: "Your Dedicated Web Design Team. Just A Subscription Away.",
                desc: "Scale your business footprint with high-velocity UI asset design, modular landing pages, and rapid custom deployment. Clean workflows directly integrated via your personalized dashboard pipeline.",
                metrics: [
                    { value: "99.9%", label: "Uptime & Speed", icon: "fa-chart-line" },
                    { value: "Unlimited", label: "Design Revisions", icon: "fa-pen-nib" }
                ]
            },
            categories: [
                { title: "E-Commerce Infrastructure", desc: "Enterprise scale Shopify, high-performance headless WooCommerce architectures built for fluid buying conversion pipelines.", icon: "fa-cart-shopping" },
                { title: "SaaS & High Growth Startups", desc: "Futuristic interactive dark layouts, complex asset cards, and analytics dashboard mockups tailored for software platforms.", icon: "fa-server" },
                { title: "Luxury Real Estate", desc: "Ultra premium real-estate portal layouts, cinematic gallery grids, and immersive maps built for high-end project display.", icon: "fa-house-chimney" }
            ],
            durations: [
                { id: "3m", label: "3 Months" },
                { id: "6m", label: "6 Months (Best Value)", active: true },
                { id: "12m", label: "12 Months (Max Savings)" }
            ],
            plans: [
                { title: "Basic Tier", desc: "Perfect solution for early-stage standard validation setups.", price: { "3m": 1200, "6m": 2156, "12m": 3800 }, features: ["1 Active design flow pipeline", "Turnaround in 48 hours", "Unlimited core iterations"], antiFeatures: ["Dedicated slack sync channel"] },
                { title: "Growth Engine Tier", desc: "The ultimate production speed layout for growing operational brands.", price: { "3m": 2400, "6m": 4316, "12m": 7900 }, features: ["2 Concurrent active design pipelines", "Priority 24-hour delivery target", "Unlimited core iterations", "Dedicated real-time slack sync channel"], antiFeatures: [], recommended: true },
                { title: "Enterprise Tier", desc: "Complete dedicated studio execution handling multi-product scaling requirements.", price: { "3m": 4800, "6m": 8636, "12m": 15500 }, features: ["4 Concurrent active design pipelines", "Instant dedicated engineer allocation", "Custom tech-stack priority deployment", "Unlimited multi-product asset development"], antiFeatures: [] }
            ],
            portfolio: [
                { title: "Nubos Cloud Dashboard", desc: "Glassmorphic futuristic node architecture framework analytics visualization setup.", category: "SAAS ASSETS", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
                { title: "Aura Fintech Analytics", desc: "Neon electric charts engineered for data clarity and dark mode aesthetic depth.", category: "FINTECH UI", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" },
                { title: "Aurum Luxury Homes", desc: "Minimalist layout card handling premium high-end properties presentation.", category: "REAL ESTATE", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" }
            ],
            testimonials: [
                { name: "Marcus Vance", company: "Peak Fitness Executive", text: "The architectural depth of the layouts transformed our marketing conversion loops. A true enterprise design powerhouse.", rating: 5 },
                { name: "Alina Kross", company: "Aurora AI Product Lead", text: "Incredible delivery velocities. Our design asset overhead vanished completely under this structured setup.", rating: 5 }
            ],
            clients: [],
            documents: {
                refund: { tag: "Legal node", title: "Refund Policy matrix", body: "<p>Refund requests can be cleanly raised within <b>7 business operating days</b> of your initial transaction cycle.</p>" },
                terms: { tag: "Legal node", title: "Terms of Service Agreement", body: "<p>All source layouts turn entirely into your <b>absolute personal commercial property</b>.</p>" },
                privacy: { tag: "Data protection", title: "Privacy Framework Matrix", body: "<p>Your project pipeline descriptions remain tightly secured under sandbox storage layers.</p>" },
                pricing_agreement: { tag: "Commercials", title: "Pricing Framework Agreement", body: "<p>Subscription rates are strictly locked at initialization configurations.</p>" },
                sla: { tag: "Operations", title: "SLA Production Guidelines", body: "<p>Our standard response metrics secure code asset deployment pipelines inside <b>24 to 48 hours</b>.</p>" },
                scaling: { tag: "Enterprise", title: "Enterprise Scaling Nodes", body: "<p>Our engine supports scaling structures flawlessly up to 10 concurrent active pipelines.</p>" },
                faq: { tag: "Help Node", title: "Core FAQ Routing", body: "<div class='space-y-3'><div><b>Q: How do design request updates process?</b><p class='text-gray-500 text-xs mt-0.5'>A: Drop your specs via dashboard interface. Our asset queue picks them up instantly.</p></div></div>" },
                contact: { tag: "Support", title: "Contact Engineering Support", body: "<p>Direct support communication routing manager lines open safely at <b>support@webtolet.com</b></p>" },
                ticket: { tag: "Ticket Sync", title: "Submit Active Design Ticket", body: "<p>Register structural issues regarding asset layers directly inside secure customer channels.</p>" }
            }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

// API: Website Frontend dynamically fetches configuration nodes from here
app.get('/api/website-data', (req, res) => {
    res.json(getWebsiteData());
});

// API: Admin panel sends layout configuration payloads here
app.post('/api/admin/update', (req, res) => {
    try {
        const newData = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 4));
        res.json({ success: true, message: "System configurations updated successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to write database array." });
    }
});

// API: Dispatches Gmail Validation Token (OTP) to customer
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if(!email) return res.status(400).json({ success: false, message: "Target email parameter empty." });

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = generatedOtp;

    const mailOptions = {
        from: `"Web Tolet Engine" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🔒 Web Tolet Security Access Verification Token',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #06060a; color: #ffffff; border-radius: 12px; max-width: 500px; border: 1px solid #1a1a24;">
                <h2 style="color: #00f5d4; font-size: 20px; margin-bottom: 5px;">Web Tolet Engine Security Guard</h2>
                <div style="height: 1px; background: linear-gradient(to right, #00f5d4, #3b82f6); margin-bottom: 20px;"></div>
                <p style="color: #cccccc; font-size: 14px;">Your 6-Digit account initialization security token is active below:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #a855f7; margin: 25px 0; background: rgba(255,255,255,0.03); padding: 15px; text-align: center; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    ${generatedOtp}
                </div>
                <p style="color: #666666; font-size: 11px; margin-top: 20px; line-height: 1.4;">If you didn't trigger this client onboarding verification, safely disregard this notification block.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Verification code dispatched safely to Gmail!" });
    } catch (error) {
        console.error("Nodemailer service crashed error:", error);
        res.status(500).json({ success: false, message: "Mailing transport system offline." });
    }
});

// API: Confirms active OTP token and inserts account metadata safely inside dynamic arrays
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp, name, whatsapp, category } = req.body;
    
    if (otpStorage[email] && otpStorage[email] === otp) {
        delete otpStorage[email]; // Consume token immediately

        const currentData = getWebsiteData();
        if(!currentData.clients) currentData.clients = [];

        // Insert fresh verified customer data object payload row inside dynamic schema layout
        currentData.clients.push({
            name,
            email,
            whatsapp,
            category,
            registeredAt: new Date().toISOString()
        });

        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 4));
        res.json({ success: true, message: "Gmail verified and client account recorded flawlessly!" });
    } else {
        res.status(400).json({ success: false, message: "Incorrect OTP configuration code matrix mapping." });
    }
});

// Port Execution Listener
app.listen(PORT, () => {
    console.log(`Mailing & Layout Engine running flawlessly on port ${PORT}`);
});

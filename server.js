const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Static frontend files serve karne ke liye

// Helper function: Database (JSON File) se data read karna
const getWebsiteData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        // Agar data file nahi hai toh default data create karein (Jo aapne pehle frontend me use kiya tha)
        const defaultData = {
            logo: "Web Tolet",
            promoBanner: "🎉 SPECIAL OFFER ACTIVE: Use Code OFFER20 for 20% Off!",
            hero: {
                tagline: "Design & Dev Subscription",
                title: "Your Dedicated Web Design Team. Just A Subscription Away.",
                desc: "We build premium websites. Subscribe to a plan, submit tasks, and get them delivered one by one.",
                metrics: [
                    { value: "99.9%", label: "Uptime & Speed", icon: "fa-chart-line" },
                    { value: "Unlimited", label: "Design Revisions", icon: "fa-pen-nib" }
                ]
            }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

// 1. GET API: Frontend isko call karke live data lega
app.get('/api/website-data', (req, res) => {
    res.json(getWebsiteData());
});

// 2. POST API: Admin Panel isko call karke data save karega
app.post('/api/admin/update', (req, res) => {
    try {
        const newData = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
        res.json({ success: true, message: "Website data updated successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error while saving data." });
    }
});

// Server Start
app.listen(PORT, () => {
    console.log(`Server running smoothly on http://localhost:${PORT}`);
});

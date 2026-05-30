const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 1. YAHA APNA EMAIL AUR APP PASSWORD SET KAREIN
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'webtolet@gmail.com',  // <-- Yahan apna real Gmail address dalein
        pass: 'vzkjytcbvmoaoubm'             // <-- Yahan wo 16-digit ka App Password dalein (bina space ke)
    }
});

// Temporary memory runtime me OTP store karne ke liye
let otpStorage = {};

// 2. API Endpoint: Frontend se details aane par OTP send karne ke liye
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    
    // 6-Digit random OTP generate karein
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = generatedOtp; // Email ke sath OTP map kar dein

    // Mail configurations matrix
    const mailOptions = {
        from: '"Web Tolet Studio" <YOUR_OFFICIAL_GMAIL@gmail.com>',
        to: email,
        subject: '🔒 Web Tolet Security Access Verification Token',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #06060a; color: #ffffff; border-radius: 10px;">
                <h2 style="color: #00f5d4;">Web Tolet Security Guard</h2>
                <p style="color: #aaaaaa;">Your 6-Digit account initialization security token is active below:</p>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #a855f7; margin: 20px 0; background: rgba(255,255,255,0.05); padding: 10px; text-align: center; border-radius: 5px;">
                    ${generatedOtp}
                </div>
                <p style="color: #555555; font-size: 11px;">If you didn't trigger this validation request, safely disregard this connection block.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "OTP sent successfully to Gmail!" });
    } catch (error) {
        console.error("Nodemailer routing failure error:", error);
        res.status(500).json({ success: false, message: "Failed to dispatch verification email node." });
    }
});

// 3. API Endpoint: Client ka enter kiya hua OTP verify karne ke liye
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp, name, whatsapp, category } = req.body;

    if (otpStorage[email] && otpStorage[email] === otp) {
        delete otpStorage[email]; // Clear token from runtime after verification
        
        // TODO: Yahan par aap client ke account details (name, email, whatsapp, category) ko database me push karenge
        
        res.json({ success: true, message: "Gmail verified and account indexed flawlessly!" });
    } else {
        res.status(400).json({ success: false, message: "Incorrect OTP code matrix configuration." });
    }
});

app.listen(3000, () => console.log('Mailing engine running on port 3000'));

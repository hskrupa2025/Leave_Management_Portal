// Load environment variables FIRST, before anything reads process.env
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const CompanyHoliday = require('./models/CompanyHoliday');
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const INDIA_COMPANY_HOLIDAYS = {
    2026: [
        ['2026-01-26', 'Republic Day'], ['2026-03-04', 'Holi'],
        ['2026-03-21', 'Eid-ul-Fitr (tentative; moon sighting)'], ['2026-03-31', 'Mahavir Jayanti'],
        ['2026-04-03', 'Good Friday'], ['2026-05-01', 'Buddha Purnima'],
        ['2026-05-27', 'Eid-ul-Zuha (tentative; moon sighting)'], ['2026-06-26', 'Muharram (tentative; moon sighting)'],
        ['2026-08-15', 'Independence Day'], ['2026-08-26', 'Id-e-Milad (tentative; moon sighting)'],
        ['2026-09-14', 'Ganesh Chaturthi'], ['2026-10-02', 'Mahatma Gandhi Jayanti'],
        ['2026-10-20', 'Dussehra'], ['2026-11-08', 'Diwali'],
        ['2026-11-24', 'Guru Nanak Jayanti'], ['2026-12-25', 'Christmas Day'],
    ],
    2027: [
        ['2027-01-26', 'Republic Day'], ['2027-03-10', 'Eid-ul-Fitr (tentative; moon sighting)'],
        ['2027-03-22', 'Holi'], ['2027-03-26', 'Good Friday'],
        ['2027-04-19', 'Mahavir Jayanti'], ['2027-05-17', 'Eid-ul-Zuha (tentative; moon sighting)'],
        ['2027-05-20', 'Buddha Purnima'], ['2027-08-15', 'Independence Day'],
        ['2027-08-25', 'Janmashtami'], ['2027-10-02', 'Mahatma Gandhi Jayanti'],
        ['2027-10-09', 'Dussehra'], ['2027-10-29', 'Diwali'],
        ['2027-11-14', 'Guru Nanak Jayanti'], ['2027-12-25', 'Christmas Day'],
    ],
};

// ---------- Middleware ----------
// Set CLIENT_URL in Render to your Vercel URL, e.g. https://your-app.vercel.app
// (no trailing slash). Several origins can be separated by commas.
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
    : null;

app.use(
    cors(
        allowedOrigins
            ? { origin: allowedOrigins, credentials: true }
            : undefined // no CLIENT_URL set: allow all origins (fine for local dev)
    )
);
app.use(express.json());

// ---------- Seed demo data ----------
const seedUsers = async () => {
    try {
        const adminEmail = 'admin@exelongmail.com';
        const employeeEmails = ['employee@exelon.com', 'employee@example.com'];

        // Admin: create only if missing. The password is reset on restart
        // ONLY when SEED_RESET_ADMIN=true is set in the environment.
        const admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('Admin@123', salt);
            await User.create({
                name: 'Exelon Admin',
                email: adminEmail,
                passwordHash,
                role: 'ADMIN',
            });
            console.log(`Seed: Admin user created (${adminEmail} / Admin@123)`);
        } else if (process.env.SEED_RESET_ADMIN === 'true') {
            const salt = await bcrypt.genSalt(10);
            admin.passwordHash = await bcrypt.hash('Admin@123', salt);
            admin.role = 'ADMIN';
            await admin.save();
            console.log(`Seed: Admin credentials reset for ${admin.email}`);
        }

        // Holidays
        const adminDoc = await User.findOne({ email: adminEmail });
        for (const [year, holidays] of Object.entries(INDIA_COMPANY_HOLIDAYS)) {
            const existingCount = await CompanyHoliday.countDocuments({
                date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
            });
            if (existingCount === 0) {
                await CompanyHoliday.insertMany(
                    holidays.map(([date, name]) => ({
                        date,
                        name,
                        createdBy: adminDoc._id,
                    }))
                );
                console.log(`Seed: India company holidays added for ${year}`);
            }
        }

        // Demo employee
        const employeeExists = await User.findOne({ email: { $in: employeeEmails } });
        if (!employeeExists) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('Employee@123', salt);
            await User.create({
                name: 'John Employee',
                email: 'employee@exelon.com',
                passwordHash,
                role: 'EMPLOYEE',
            });
            console.log('Seed: Employee user created (employee@exelon.com / Employee@123)');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
};

// ---------- Routes ----------
app.get('/', (req, res) => {
    res.send('Leave Management API is running');
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Leave Management API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown API routes (returns JSON instead of HTML)
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---------- Start ----------
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        // Seed after the server is listening so Render's port check passes fast
        await seedUsers();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

startServer();
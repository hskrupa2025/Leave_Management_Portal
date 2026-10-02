const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const CompanyHoliday = require('./models/CompanyHoliday');
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

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

// Middleware
app.use(cors());
app.use(express.json());

// Seed demo users function
const seedUsers = async () => {
    try {
        const adminEmail = 'admin@exelongmail.com';
        const employeeEmails = ['employee@exelon.com', 'employee@example.com'];

        const adminExists = await User.findOne({ email: adminEmail });
        const salt = await bcrypt.genSalt(10);
        const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
        if (adminExists) {
            adminExists.name = 'Exelon Admin';
            adminExists.passwordHash = adminPasswordHash;
            adminExists.role = 'ADMIN';
            await adminExists.save();
            console.log(`Seed: Admin credentials synchronized for ${adminExists.email}`);
        } else {
            await User.create({
                name: 'Exelon Admin',
                email: adminEmail,
                passwordHash: adminPasswordHash,
                role: 'ADMIN',
            });
            console.log(`Seed: Admin user created (${adminEmail} / Admin@123)`);
        }

        const admin = await User.findOne({ email: adminEmail });
        for (const [year, holidays] of Object.entries(INDIA_COMPANY_HOLIDAYS)) {
            const yearStart = `${year}-01-01`;
            const yearEnd = `${year}-12-31`;
            const existingCount = await CompanyHoliday.countDocuments({
                date: { $gte: yearStart, $lte: yearEnd },
            });
            if (existingCount === 0) {
                await CompanyHoliday.insertMany(holidays.map(([date, name]) => ({
                    date,
                    name,
                    createdBy: admin._id,
                })));
                console.log(`Seed: India company holidays added for ${year}`);
            }
        }

        const employeeExists = await User.findOne({ email: { $in: employeeEmails } });
        if (!employeeExists) {
            const salt = await bcrypt.genSalt(10);
            const employeePasswordHash = await bcrypt.hash('Employee@123', salt);
            await User.create({
                name: 'John Employee',
                email: 'employee@exelon.com',
                passwordHash: employeePasswordHash,
                role: 'EMPLOYEE',
            });
            console.log('Seed: Employee user created (employee@exelon.com / Employee@123)');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Leave Management API is running' });
});

const startServer = async () => {
    try {
        await connectDB();
        await seedUsers();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

startServer();

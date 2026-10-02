const CompanyHoliday = require('../models/CompanyHoliday');

const isValidDateKey = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const getCompanyHolidays = async (req, res) => {
    try {
        const year = String(req.query.year || new Date().getFullYear());
        if (!/^\d{4}$/.test(year)) {
            return res.status(400).json({ message: 'Year must be a four-digit year' });
        }

        const holidays = await CompanyHoliday.find({
            date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
        }).sort({ date: 1 });
        res.status(200).json(holidays);
    } catch (error) {
        console.error('Get company holidays error:', error);
        res.status(500).json({ message: 'Server error while fetching company holidays' });
    }
};

const createCompanyHoliday = async (req, res) => {
    try {
        const { date, name } = req.body;
        if (!isValidDateKey(date) || !String(name || '').trim()) {
            return res.status(400).json({ message: 'Provide a valid date and holiday name' });
        }

        const holiday = await CompanyHoliday.create({
            date,
            name: String(name).trim(),
            createdBy: req.user._id,
        });
        res.status(201).json(holiday);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A company holiday is already set for this date' });
        }
        console.error('Create company holiday error:', error);
        res.status(500).json({ message: 'Server error while creating company holiday' });
    }
};

const deleteCompanyHoliday = async (req, res) => {
    try {
        const holiday = await CompanyHoliday.findByIdAndDelete(req.params.id);
        if (!holiday) {
            return res.status(404).json({ message: 'Company holiday not found' });
        }
        res.status(200).json({ message: 'Company holiday removed' });
    } catch (error) {
        console.error('Delete company holiday error:', error);
        res.status(500).json({ message: 'Server error while removing company holiday' });
    }
};

module.exports = { getCompanyHolidays, createCompanyHoliday, deleteCompanyHoliday };
const Leave = require('../models/Leave');
const User = require('../models/User');
const CompanyHoliday = require('../models/CompanyHoliday');

const normalizeLeaveType = (leaveType) => {
    const aliases = { Sick: 'Sick Leave', Casual: 'Casual Leave', Earned: 'Earned Leave' };
    return aliases[leaveType] || leaveType;
};

const getBalanceField = (leaveType) => {
    if (leaveType === 'Casual Leave') return 'casualLeave';
    if (leaveType === 'Sick Leave') return 'sickLeave';
    if (leaveType === 'Earned Leave') return 'earnedLeave';
    return null;
};

const parseDateInput = (value) => {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateWorkdays = (start, end, holidays = new Set()) => {
    const date = new Date(start);
    let workdays = 0;

    while (date <= end) {
        if (!isWeekend(date) && !holidays.has(getDateKey(date))) workdays += 1;
        date.setDate(date.getDate() + 1);
    }

    return workdays;
};

const countWorkdaysByYear = (start, end, holidays = new Set()) => {
    const counts = {};
    const date = new Date(start);

    while (date <= end) {
        if (!isWeekend(date) && !holidays.has(getDateKey(date))) {
            const year = date.getFullYear();
            counts[year] = (counts[year] || 0) + 1;
        }
        date.setDate(date.getDate() + 1);
    }

    return counts;
};

const getAnnualWorkdayUsage = (leaveRequests, year, holidays = new Set()) => {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    return leaveRequests.reduce((total, leave) => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        const start = leaveStart > yearStart ? leaveStart : yearStart;
        const end = leaveEnd < yearEnd ? leaveEnd : yearEnd;
        return end < start ? total : total + calculateWorkdays(start, end, holidays);
    }, 0);
};

// @desc    Apply for leave
// @route   POST /api/leave
// @access  Private (Employee)
const applyLeave = async (req, res) => {
    try {
        let { leaveType, startDate, endDate, reason } = req.body;
        leaveType = normalizeLeaveType(leaveType);

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        if (!['Casual Leave', 'Sick Leave', 'Earned Leave'].includes(leaveType)) {
            return res.status(400).json({ message: 'Invalid leave type' });
        }

        const start = parseDateInput(startDate);
        const end = parseDateInput(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Please provide valid leave dates' });
        }

        if (start < today) {
            return res.status(400).json({ message: 'Start date cannot be in the past' });
        }

        if (end < start) {
            return res.status(400).json({ message: 'End date cannot be before start date' });
        }

        const firstYear = start.getFullYear();
        const lastYear = end.getFullYear();
        const companyHolidays = await CompanyHoliday.find({
            date: { $gte: `${firstYear}-01-01`, $lte: `${lastYear}-12-31` },
        }).select('date');
        const holidayDates = new Set(companyHolidays.map((holiday) => holiday.date));

        if (isWeekend(start) || isWeekend(end) || holidayDates.has(getDateKey(start)) || holidayDates.has(getDateKey(end))) {
            return res.status(400).json({ message: 'Leave start and end dates must be working days. Weekends and company holidays are not available.' });
        }

        const numberOfDays = calculateWorkdays(start, end, holidayDates);
        if (!numberOfDays) {
            return res.status(400).json({ message: 'Leave requests must include at least one working day' });
        }

        const requestedByYear = countWorkdaysByYear(start, end, holidayDates);
        const annualRequests = await Leave.find({
            employee: req.user._id,
            status: { $in: ['PENDING', 'APPROVED'] },
            startDate: { $lte: new Date(end.getFullYear(), 11, 31) },
            endDate: { $gte: new Date(start.getFullYear(), 0, 1) },
        });

        for (const [yearValue, requestedInYear] of Object.entries(requestedByYear)) {
            const year = Number(yearValue);
            const usedInYear = getAnnualWorkdayUsage(annualRequests, year, holidayDates);
            if (usedInYear + requestedInYear > 30) {
                return res.status(400).json({
                    message: `Annual leave limit is 30 weekdays. You already have ${usedInYear} days requested or approved in ${year}, and this request adds ${requestedInYear}.`,
                });
            }
        }

        const balanceField = getBalanceField(leaveType);

        if (!balanceField) {
            return res.status(400).json({ message: 'Invalid leave type' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user[balanceField] < numberOfDays) {
            return res.status(400).json({
                message: `Insufficient leave balance. Requested: ${numberOfDays}, Available: ${user[balanceField]}`,
            });
        }

        // Check for overlapping pending or approved leave
        const overlappingLeave = await Leave.findOne({
            employee: req.user._id,
            status: { $in: ['PENDING', 'APPROVED'] },
            $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
        });

        if (overlappingLeave) {
            return res.status(400).json({ message: 'You already have an overlapping leave request for these dates' });
        }

        const leave = await Leave.create({
            employee: req.user._id,
            leaveType,
            startDate: start,
            endDate: end,
            numberOfDays,
            reason,
            status: 'PENDING',
        });

        res.status(201).json({
            message: 'Leave application submitted successfully',
            leave,
        });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ message: 'Server error while applying for leave' });
    }
};

// @desc    Get logged-in employee's leave history
// @route   GET /api/leaves/my
// @access  Private (Employee)
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ employee: req.user._id })
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        console.error('Get my leaves error:', error);
        res.status(500).json({ message: 'Server error while fetching leaves' });
    }
};

// @desc    Get single leave by ID
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveById = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id).populate('employee', 'name email');
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Ensure user owns request or is admin
        if (leave.employee._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to view this leave request' });
        }

        res.status(200).json(leave);
    } catch (error) {
        console.error('Get leave by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    getLeaveById,
    getBalanceField,
    calculateWorkdays,
    countWorkdaysByYear,
    getAnnualWorkdayUsage,
    getDateKey,
};




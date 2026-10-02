const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Get admin dashboard stats and recent leaves
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: 'EMPLOYEE' });
        const totalLeaves = await Leave.countDocuments();
        const pendingLeaves = await Leave.countDocuments({ status: 'PENDING' });
        const approvedLeaves = await Leave.countDocuments({ status: 'APPROVED' });
        const rejectedLeaves = await Leave.countDocuments({ status: 'REJECTED' });

        const recentLeaves = await Leave.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            stats: {
                totalEmployees,
                totalLeaves,
                pendingLeaves,
                approvedLeaves,
                rejectedLeaves,
            },
            recentLeaves,
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error while fetching admin dashboard stats' });
    }
};

// @desc    Get all leave requests
// @route   GET /api/admin/leaves
// @access  Private (Admin)
const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ message: 'Server error while fetching leaves' });
    }
};

// @desc    Approve leave request
// @route   PUT /api/admin/leaves/:id/approve
// @access  Private (Admin)
const approveLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({ message: `Leave request is already ${leave.status}` });
        }

        const employee = await User.findById(leave.employee);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Determine balance field
        let balanceField;
        if (leave.leaveType === 'Casual Leave') balanceField = 'casualLeave';
        else if (leave.leaveType === 'Sick Leave') balanceField = 'sickLeave';
        else if (leave.leaveType === 'Earned Leave') balanceField = 'earnedLeave';

        if (employee[balanceField] < leave.numberOfDays) {
            return res.status(400).json({
                message: `Cannot approve. Employee has insufficient ${leave.leaveType} balance. Available: ${employee[balanceField]}, Required: ${leave.numberOfDays}`,
            });
        }

        // Deduct balance
        employee[balanceField] -= leave.numberOfDays;
        await employee.save();

        // Update leave status
        leave.status = 'APPROVED';
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = Date.now();
        await leave.save();

        res.status(200).json({
            message: 'Leave approved successfully and balance updated',
            leave,
        });
    } catch (error) {
        console.error('Approve leave error:', error);
        res.status(500).json({ message: 'Server error while approving leave' });
    }
};

// @desc    Reject leave request
// @route   PUT /api/admin/leaves/:id/reject
// @access  Private (Admin)
const rejectLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({ message: `Leave request is already ${leave.status}` });
        }

        leave.status = 'REJECTED';
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = Date.now();
        await leave.save();

        res.status(200).json({
            message: 'Leave request rejected',
            leave,
        });
    } catch (error) {
        console.error('Reject leave error:', error);
        res.status(500).json({ message: 'Server error while rejecting leave' });
    }
};

// @desc    Get all employees and their leave balances
// @route   GET /api/admin/employees
// @access  Private (Admin)
const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'EMPLOYEE' }).select('-passwordHash');
        res.status(200).json(employees);
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: 'Server error while fetching employees' });
    }
};

module.exports = {
    getAdminDashboard,
    getAllLeaves,
    approveLeave,
    rejectLeave,
    getAllEmployees,
};




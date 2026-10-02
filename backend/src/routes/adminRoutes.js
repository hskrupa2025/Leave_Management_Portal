const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getAllLeaves,
    approveLeave,
    rejectLeave,
    getAllEmployees,
} = require('../controllers/adminControllers');
const {
    getCompanyHolidays,
    createCompanyHoliday,
    deleteCompanyHoliday,
} = require('../controllers/companyHolidayController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMidlleware');

// Protect all admin routes with authentication and admin role check
router.use(protect, adminOnly);

router.get('/dashboard', getAdminDashboard);
router.get('/leaves', getAllLeaves);
router.put('/leaves/:id/approve', approveLeave);
router.put('/leaves/:id/reject', rejectLeave);
router.get('/employees', getAllEmployees);
router.get('/holidays', getCompanyHolidays);
router.post('/holidays', createCompanyHoliday);
router.delete('/holidays/:id', deleteCompanyHoliday);

module.exports = router;

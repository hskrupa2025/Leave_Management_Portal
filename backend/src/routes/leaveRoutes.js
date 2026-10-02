const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getLeaveById } = require('../controllers/leaveController');
const { getCompanyHolidays } = require('../controllers/companyHolidayController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes below

router.route('/').post(applyLeave);
router.route('/holidays').get(getCompanyHolidays);
router.route('/my').get(getMyLeaves);
router.route('/:id').get(getLeaveById);

module.exports = router;
const test = require('node:test');
const assert = require('node:assert/strict');
const Leave = require('../src/models/Leave');
const {
    getBalanceField,
    calculateWorkdays,
    countWorkdaysByYear,
    getAnnualWorkdayUsage,
} = require('../src/controllers/leaveController');

test('only the supported leave types are accepted by the schema', () => {
    const leaveTypePath = Leave.schema.path('leaveType');

    assert.deepEqual(leaveTypePath.enumValues, ['Casual Leave', 'Sick Leave', 'Earned Leave']);
    assert.equal(getBalanceField('Earned Leave'), 'earnedLeave');
});

test('weekends are excluded from leave day totals', () => {
    assert.equal(calculateWorkdays(new Date(2026, 9, 2), new Date(2026, 9, 5)), 2);
    assert.equal(calculateWorkdays(new Date(2026, 9, 3), new Date(2026, 9, 4)), 0);
});

test('weekday requests are split across calendar years for the annual limit', () => {
    const counts = countWorkdaysByYear(new Date(2026, 11, 31), new Date(2027, 0, 4));

    assert.deepEqual(counts, { 2026: 1, 2027: 2 });
});

test('annual usage counts pending and approved weekdays within the selected year', () => {
    const leaves = [
        { startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 5), status: 'APPROVED' },
        { startDate: new Date(2025, 11, 31), endDate: new Date(2026, 0, 2), status: 'PENDING' },
    ];

    assert.equal(getAnnualWorkdayUsage(leaves, 2026), 5);
});
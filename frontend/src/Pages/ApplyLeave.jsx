import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
    if (!value) return null;
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const countWorkdays = (startValue, endValue, holidayDates) => {
    const start = parseDateInput(startValue);
    const end = parseDateInput(endValue);
    if (!start || !end || end < start) return 0;

    let count = 0;
    const current = new Date(start);
    while (current <= end) {
        if (!isWeekend(current) && !holidayDates.has(toDateInputValue(current))) count += 1;
        current.setDate(current.getDate() + 1);
    }
    return count;
};

const countAnnualUsage = (leaves, year, holidayDates) => leaves.reduce((total, leave) => {
    if (!['PENDING', 'APPROVED'].includes(leave.status)) return total;
    const leaveStart = toDateInputValue(new Date(leave.startDate));
    const leaveEnd = toDateInputValue(new Date(leave.endDate));
    const start = leaveStart < `${year}-01-01` ? `${year}-01-01` : leaveStart;
    const end = leaveEnd > `${year}-12-31` ? `${year}-12-31` : leaveEnd;
    return end < start ? total : total + countWorkdays(start, end, holidayDates);
}, 0);

const getMonthDays = (year, month) => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: cellCount }, (_, index) => {
        const day = index - firstWeekday + 1;
        return day < 1 || day > daysInMonth ? null : new Date(year, month, day);
    });
};

const ApplyLeave = () => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear;
    const maxYear = currentYear + 1;
    const [leaveType, setLeaveType] = useState('Casual Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [user, setUser] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [calendarYear, setCalendarYear] = useState(currentYear);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([API.get('/auth/me'), API.get('/leaves/my')])
            .then(([profileResponse, leavesResponse]) => {
                setUser(profileResponse.data.user);
                setLeaves(leavesResponse.data);
            })
            .catch(() => setError('Unable to load your leave details'));
    }, []);

    useEffect(() => {
        API.get('/leaves/holidays', { params: { year: calendarYear } })
            .then((response) => setHolidays(response.data))
            .catch(() => setHolidays([]));
    }, [calendarYear]);

    const holidayDates = new Set(holidays.map((holiday) => holiday.date));
    const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday]));
    const requestedDays = countWorkdays(startDate, endDate, holidayDates);
    const annualUsed = countAnnualUsage(leaves, calendarYear, holidayDates);
    const annualRemaining = Math.max(0, 30 - annualUsed);
    const requestIsInCalendarYear = startDate && endDate
        && startDate.startsWith(String(calendarYear))
        && endDate.startsWith(String(calendarYear));
    const getAvailableBalance = () => {
        if (!user) return 0;
        if (leaveType === 'Casual Leave') return user.casualLeave;
        if (leaveType === 'Sick Leave') return user.sickLeave;
        if (leaveType === 'Earned Leave') return user.earnedLeave;
        return 0;
    };

    const handleCalendarPick = (date) => {
        const dateValue = toDateInputValue(date);
        if (!startDate || endDate || dateValue < startDate) {
            setStartDate(dateValue);
            setEndDate('');
            return;
        }
        setEndDate(dateValue);
    };

    const changeCalendarYear = (year) => {
        setCalendarYear(year);
        setStartDate('');
        setEndDate('');
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        const start = parseDateInput(startDate);
        const end = parseDateInput(endDate);
        if (!start || !end || end < start) {
            setError('Choose a valid start and end date');
            return;
        }
        if (isWeekend(start) || isWeekend(end)) {
            setError('Saturday and Sunday are holidays. Choose weekdays for the start and end dates.');
            return;
        }
        if (holidayDates.has(startDate) || holidayDates.has(endDate)) {
            setError('Company holidays cannot be selected as leave dates.');
            return;
        }
        if (requestedDays > getAvailableBalance()) {
            setError('Requested weekdays exceed your available leave balance');
            return;
        }
        if (requestIsInCalendarYear && annualUsed + requestedDays > 30) {
            setError(`This request would exceed the annual limit of 30 leave days for ${calendarYear}.`);
            return;
        }

        try {
            await API.post('/leaves', { leaveType, startDate, endDate, reason });
            setSuccess('Leave applied successfully!');
            setTimeout(() => navigate('/employee/history'), 1500);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Error applying for leave');
        }
    };

    const getLeaveStatusForDay = (dateValue) => {
        const leave = leaves.find((item) => {
            const start = toDateInputValue(new Date(item.startDate));
            const end = toDateInputValue(new Date(item.endDate));
            return dateValue >= start && dateValue <= end;
        });
        return leave?.status?.toLowerCase() || '';
    };

    const todayValue = toDateInputValue(new Date());
    const minimumDate = calendarYear === currentYear ? todayValue : `${calendarYear}-01-01`;
    const updateDate = (setter, label) => (event) => {
        const value = event.target.value;
        const date = parseDateInput(value);
        if (date && (isWeekend(date) || holidayDates.has(value))) {
            setError(`${label} must be a working day, not a weekend or company holiday.`);
            return;
        }
        setError('');
        setter(value);
    };

    return (
        <div className="container-fluid leave-application-page mt-4">
            <h2>Apply for Leave</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="row g-4 align-items-start">
                <section className="col-lg-5">
                    <div className="card shadow p-4 h-100">
                        <p className="text-muted">
                            Available balance for <strong>{leaveType}</strong>: {getAvailableBalance()} weekdays
                        </p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="leave-type">Leave Type</label>
                                <select
                                    id="leave-type"
                                    className="form-control"
                                    value={leaveType}
                                    onChange={(event) => setLeaveType(event.target.value)}
                                >
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="leave-start">Start Date</label>
                                <input
                                    id="leave-start"
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    min={minimumDate}
                                    max={`${calendarYear}-12-31`}
                                    onChange={updateDate(setStartDate, 'Start date')}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="leave-end">End Date</label>
                                <input
                                    id="leave-end"
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    min={startDate || minimumDate}
                                    max={`${calendarYear}-12-31`}
                                    onChange={updateDate(setEndDate, 'End date')}
                                    required
                                />
                            </div>
                            {requestedDays > 0 && (
                                <p className="text-info">Leave days requested: {requestedDays}</p>
                            )}
                            <p className="leave-weekend-note">Weekends and company holidays are excluded from leave days.</p>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="leave-reason">Reason</label>
                                <textarea
                                    id="leave-reason"
                                    className="form-control"
                                    rows="3"
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={!requestedDays || requestedDays > getAvailableBalance() || (requestIsInCalendarYear && annualUsed + requestedDays > 30)}
                            >
                                Submit Application
                            </button>
                        </form>
                    </div>
                </section>

                <section className="col-lg-7" aria-label="Yearly leave calendar">
                    <div className="year-calendar-panel">
                        <div className="year-calendar-heading">
                            <div>
                                <h3>{calendarYear} Leave Calendar</h3>
                                <p>Choose weekdays to fill the date range.</p>
                            </div>
                            <div className="year-calendar-controls">
                                <button type="button" aria-label="Previous year" disabled={calendarYear <= minYear} onClick={() => changeCalendarYear(calendarYear - 1)}>&lsaquo;</button>
                                <button type="button" aria-label="Next year" disabled={calendarYear >= maxYear} onClick={() => changeCalendarYear(calendarYear + 1)}>&rsaquo;</button>
                            </div>
                        </div>
                        <div className="year-calendar-legend">
                            <span><i className="calendar-legend-dot pending" />Pending</span>
                            <span><i className="calendar-legend-dot approved" />Approved</span>
                            <span><i className="calendar-legend-dot weekend" />Weekend holiday</span>
                            <span><i className="calendar-legend-dot company" />Company holiday</span>
                        </div>
                        <div className="year-calendar-grid">
                            {Array.from({ length: 12 }, (_, month) => (
                                <div className="mini-month" key={`${calendarYear}-${month}`}>
                                    <h4>{new Date(calendarYear, month, 1).toLocaleString(undefined, { month: 'short' })}</h4>
                                    <div className="mini-month-days">
                                        {weekdayLabels.map((label, index) => (
                                            <span className="mini-weekday" key={`${label}-${index}`}>{label}</span>
                                        ))}
                                        {getMonthDays(calendarYear, month).map((date, index) => {
                                            if (!date) return <span className="mini-day empty" key={`empty-${index}`} />;

                                            const dateValue = toDateInputValue(date);
                                            const weekend = isWeekend(date);
                                            const past = dateValue < todayValue;
                                            const companyHoliday = holidayByDate.get(dateValue);
                                            const leaveStatus = getLeaveStatusForDay(dateValue);
                                            const inSelectedRange = startDate && (dateValue === startDate || (endDate && dateValue > startDate && dateValue <= endDate));
                                            const dayClasses = [
                                                'mini-day',
                                                weekend && 'weekend',
                                                companyHoliday && 'company-holiday',
                                                past && 'past',
                                                leaveStatus && `leave-${leaveStatus}`,
                                                inSelectedRange && 'selected-range',
                                            ].filter(Boolean).join(' ');

                                            return (
                                                <button
                                                    type="button"
                                                    className={dayClasses}
                                                    key={dateValue}
                                                    disabled={weekend || past || Boolean(companyHoliday)}
                                                    aria-label={`${date.toLocaleDateString()}${weekend ? ', weekend holiday' : ''}${companyHoliday ? `, company holiday: ${companyHoliday.name}` : ''}${leaveStatus ? `, ${leaveStatus} leave` : ''}`}
                                                    title={weekend ? 'Weekend holiday' : companyHoliday ? companyHoliday.name : leaveStatus ? `${leaveStatus} leave` : 'Select weekday'}
                                                    onClick={() => handleCalendarPick(date)}
                                                >
                                                    {date.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ApplyLeave;

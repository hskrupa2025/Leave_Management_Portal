import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const EmployeeDashboard = () => {
    const [user, setUser] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await API.get('/auth/me');
                setUser(profileRes.data.user);
                const leavesRes = await API.get('/leaves/my');
                setLeaves(leavesRes.data);
            } catch (err) {
                console.error('Error fetching data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
    const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
    const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

    return (
        <div className="container mt-4">
            <h2>Employee Dashboard</h2>
            <p className="text-muted">Welcome back, {user?.name}</p>

            <div className="row my-4">
                <div className="col-md-4 mb-3">
                    <div className="card bg-info text-white p-3">
                        <h5>Casual Leave Balance</h5>
                        <h3>{user?.casualLeave} Days</h3>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card bg-warning text-dark p-3">
                        <h5>Sick Leave Balance</h5>
                        <h3>{user?.sickLeave} Days</h3>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card bg-success text-white p-3">
                        <h5>Earned Leave Balance</h5>
                        <h3>{user?.earnedLeave} Days</h3>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-md-4 mb-2">
                    <div className="card p-3 bg-light">
                        <h6>Pending Requests</h6>
                        <h4>{pendingCount}</h4>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card p-3 bg-light">
                        <h6>Approved Requests</h6>
                        <h4>{approvedCount}</h4>
                    </div>
                </div>
                <div className="col-md-4 mb-2">
                    <div className="card p-3 bg-light">
                        <h6>Rejected Requests</h6>
                        <h4>{rejectedCount}</h4>
                    </div>
                </div>
            </div>

            <div className="d-flex gap-3">
                <Link to="/employee/apply-leave" className="btn btn-primary">Apply Leave</Link>
                <Link to="/employee/history" className="btn btn-secondary">View Leave History</Link>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
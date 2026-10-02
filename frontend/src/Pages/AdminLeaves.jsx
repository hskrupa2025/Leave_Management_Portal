import React, { useEffect, useState } from 'react';
import API from '../services/api';

const AdminLeaves = () => {
    const [leaves, setLeaves] = useState([]);

    const fetchLeaves = () => {
        API.get('/admin/leaves').then((res) => setLeaves(res.data));
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const hasPendingLeaves = leaves.some((leave) => leave.status === 'PENDING');

    const handleAction = async (id, action) => {
        try {
            await API.put(`/admin/leaves/${id}/${action}`);
            fetchLeaves();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating leave status');
        }
    };

    return (
        <div className="container mt-4">
            <h2>All Leave Requests</h2>
            <div className="table-responsive mt-3">
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {hasPendingLeaves && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.length === 0 ? (
                            <tr><td colSpan={hasPendingLeaves ? 8 : 7} className="text-center">No leave requests</td></tr>
                        ) : (
                            leaves.map((l) => (
                                <tr key={l._id}>
                                    <td>{l.employee?.name} ({l.employee?.email})</td>
                                    <td>{l.leaveType}</td>
                                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                                    <td>{l.numberOfDays}</td>
                                    <td>{l.reason}</td>
                                    <td>
                                        <span className={`badge bg-${l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    {hasPendingLeaves && (
                                        <td>
                                            {l.status === 'PENDING' && (
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-success btn-sm" onClick={() => handleAction(l._id, 'approve')}>Approve</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleAction(l._id, 'reject')}>Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminLeaves;
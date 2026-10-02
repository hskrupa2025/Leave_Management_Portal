import React, { useEffect, useState } from 'react';
import API from '../services/api';

const LeaveHistory = () => {
    const [leaves, setLeaves] = useState([]);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        API.get('/leaves/my').then((res) => setLeaves(res.data));
    }, []);

    const filteredLeaves = leaves.filter((l) => {
        if (filter === 'ALL') return true;
        return l.status === filter;
    });

    return (
        <div className="container mt-4">
            <h2>My Leave History</h2>
            <div className="btn-group my-3">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                    <button
                        key={f}
                        className={`btn btn-outline-secondary ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="table-responsive">
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Follow-up</th>
                            <th>Applied On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center">No leave requests found</td>
                            </tr>
                        ) : (
                            filteredLeaves.map((l) => (
                                <tr key={l._id}>
                                    <td>{l.leaveType}</td>
                                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                                    <td>{l.numberOfDays}</td>
                                    <td>{l.reason}</td>
                                    <td>
                                        <span
                                            className={`badge bg-${l.status === 'APPROVED'
                                                ? 'success'
                                                : l.status === 'REJECTED'
                                                    ? 'danger'
                                                    : 'warning'
                                                }`}
                                        >
                                            {l.status}
                                        </span>
                                    </td>
                                    <td>
                                        {l.reviewedAt ? (
                                            <>
                                                <div>{new Date(l.reviewedAt).toLocaleDateString()}</div>
                                                {l.reviewedBy?.name && <small>Reviewed by {l.reviewedBy.name}</small>}
                                            </>
                                        ) : 'Awaiting review'}
                                    </td>
                                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveHistory;
import React, { useEffect, useState } from 'react';
import API from '../services/api';

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        API.get('/admin/employees').then((res) => setEmployees(res.data));
    }, []);

    return (
        <div className="container mt-4">
            <h2>Employee List & Balances</h2>
            <div className="table-responsive mt-3">
                <table className="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Casual Leave</th>
                            <th>Sick Leave</th>
                            <th>Earned Leave</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp._id}>
                                <td className="text-white">{emp.name}</td>
                                <td>{emp.email}</td>
                                <td>{emp.casualLeave}</td>
                                <td>{emp.sickLeave}</td>
                                <td>{emp.earnedLeave}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEmployees;
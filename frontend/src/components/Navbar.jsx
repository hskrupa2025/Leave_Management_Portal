import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
            <Link className="navbar-brand" to={user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard'}>
                Leave Management System ({user.role})
            </Link>
            <div className="collapse navbar-collapse justify-content-end">
                <ul className="navbar-nav align-items-center">
                    <li className="nav-item text-light me-3">
                        Welcome, {user.name}
                    </li>
                    <li className="nav-item">
                        <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
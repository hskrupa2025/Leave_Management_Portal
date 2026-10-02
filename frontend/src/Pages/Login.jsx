import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Mobile keyboards often add capital letters or a trailing space,
        // so clean the email before sending it. Do NOT trim the password.
        const cleanEmail = email.trim().toLowerCase();

        try {
            if (isRegistering) {
                await API.post('/auth/register', {
                    name: name.trim(),
                    email: cleanEmail,
                    password,
                });
                setMessage('Account created. Sign in with your work email and password.');
                setIsRegistering(false);
                setName('');
                setPassword('');
                return;
            }

            const response = await API.post('/auth/login', { email: cleanEmail, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/employee/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        }
    };

    return (
        <div className="login-shell">
            <div className="login-panel">
                <div className="login-brand">
                    <div className="login-badge">L</div>
                    <h3 className="login-title">Leave Portal</h3>
                </div>

                <p className="login-subtitle">Company employees only. Please use your official credentials.</p>

                <div className="login-info-box">
                    <h4>Employee Portal</h4>
                    <ul>
                        <li>Apply and track leave requests online</li>
                        <li>View your leave balances and request history</li>
                        <li>Use only your work email and password for secure access</li>
                    </ul>
                </div>

                {error && <div className="login-alert">{error}</div>}
                {message && <div className="login-success">{message}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegistering && (
                        <div className="login-field">
                            <label className="login-label" htmlFor="employee-name">Full Name</label>
                            <input
                                id="employee-name"
                                type="text"
                                className="login-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                autoComplete="name"
                                required
                            />
                        </div>
                    )}
                    <div className="login-field">
                        <label className="login-label" htmlFor="work-email">Work Email</label>
                        <input
                            id="work-email"
                            type="email"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete={isRegistering ? 'new-password' : 'current-password'}
                            autoCapitalize="none"
                            autoCorrect="off"
                            minLength={isRegistering ? 8 : undefined}
                            required
                        />
                    </div>

                    {!isRegistering && (
                        <div className="login-info-box">
                            <h4>Instructions</h4>
                            <ul>
                                <li>Do not share your password with anyone</li>
                                <li>Submit leave requests before the leave start date</li>
                                <li>Contact HR if you need help with leave balances</li>
                            </ul>
                        </div>
                    )}

                    <button type="submit" className="login-btn">
                        {isRegistering ? 'Create Employee Account' : 'Login'}
                    </button>
                </form>
                <button
                    type="button"
                    className="login-mode-toggle"
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                        setMessage('');
                    }}
                >
                    {isRegistering ? 'Back to login' : 'Create an employee account'}
                </button>
            </div>
        </div>
    );
};

export default Login;

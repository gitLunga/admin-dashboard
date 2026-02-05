import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // We'll create this CSS file

const Navbar = () => {
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="nav-container">
                {/* Logo Section */}
                <div className="nav-logo">
                    <div className="logo-image">
                        <span className="logo-text-1">REPUBLIC OF</span>
                        <span className="logo-text-2">SOUTH AFRICA</span>
                    </div>
                    <span className="system-name">Judicial Admin System</span>
                </div>

                {/* Navigation Links */}
                <div className="nav-links">
                    <Link
                        to='/'
                        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        Home
                    </Link>
                    <Link
                        to='/login'
                        className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                    >
                        Login
                    </Link>
                    <Link
                        to='/register'
                        className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                    >
                        Register
                    </Link>
                    <Link
                        to='/forgot-password'
                        className={`nav-link ${location.pathname === '/forgot-password' ? 'active' : ''}`}
                    >
                        Reset Password
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
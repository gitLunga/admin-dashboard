import React from 'react';
import '../styles/WelcomePage.css';
import { Link } from 'react-router-dom';

const WelcomePage = () => {
    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <div className="welcome-header">
                    <h1 className="welcome-title">Welcome to Our System</h1>
                    <p className="welcome-subtitle">
                        Your journey to amazing experiences starts here
                    </p>
                </div>

                <div className="welcome-features">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Fast & Efficient</h3>
                        <p>Experience lightning-fast performance</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure</h3>
                        <p>Your data is protected with top security</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🚀</div>
                        <h3>Powerful</h3>
                        <p>Advanced features for all your needs</p>
                    </div>
                </div>

                <div className="welcome-actions">
                    <Link to="/register" className="primary-button">
                        Get Started
                    </Link>
                    <Link to="/login" className="secondary-button">
                        Sign In
                    </Link>
                </div>

                <div className="welcome-footer">
                    <p>Already have an account? <Link to="/login">Sign in here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
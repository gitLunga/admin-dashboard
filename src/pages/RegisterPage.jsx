import React, { useState } from 'react';
import '../styles/RegisterPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

// --- CONSTANTS ---
const TITLES = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Prof', label: 'Professor' },
];

// --- DESIGN SYSTEM ---
const COLORS = {
    primary: '#1e3a8a',
    primaryLight: '#3b82f6',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    surface: '#ffffff',
    background: '#f9fafb',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    disabled: '#9ca3af',
};

// --- COMPONENTS ---
const SelectInput = ({ label, value, placeholder, onSelect, editable, options, error }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = options.find(opt => opt.value === value)?.label || '';

    const handleSelect = (selectedValue) => {
        onSelect(selectedValue);
        setIsOpen(false);
    };

    return (
        <div className="input-group">
            <label className="label">{label}</label>
            <div className="select-wrapper">
                <button
                    type="button"
                    className={`select-button ${error ? 'error' : ''} ${!editable ? 'disabled' : ''}`}
                    onClick={() => editable && setIsOpen(!isOpen)}
                    disabled={!editable}
                >
                    <span className={`select-button-text ${!value ? 'placeholder' : ''}`}>
                        {selectedLabel || placeholder}
                    </span>
                    <span className="select-arrow">▼</span>
                </button>

                {isOpen && (
                    <>
                        <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
                        <div className="dropdown-menu">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`dropdown-item ${value === option.value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <span className="dropdown-item-text">{option.label}</span>
                                    {value === option.value && (
                                        <span className="dropdown-check">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {error && <span className="error-text">{error}</span>}
            </div>
        </div>
    );
};

const PasswordInput = ({
                           label,
                           value,
                           onChangeText,
                           error,
                           showPassword,
                           onToggleVisibility,
                           onBlur,
                           editable = true
                       }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="input-group">
            <label className="label">{label}</label>
            <div className={`password-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    className="password-input"
                    placeholder="Enter password"
                    value={value}
                    onChange={(e) => onChangeText(e.target.value)}
                    disabled={!editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur?.();
                    }}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
                <button
                    type="button"
                    className="eye-button"
                    onClick={onToggleVisibility}
                    disabled={!editable}
                >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>
            {error && <span className="error-text">{error}</span>}
            {label === 'Password *' && !error && value && (
                <div className="hint-text">Must be at least 8 characters long</div>
            )}
        </div>
    );
};

const ModernInput = ({
                         label,
                         placeholder,
                         value,
                         onChangeText,
                         editable,
                         type = 'text',
                         error,
                         onBlur
                     }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e) => {
        onChangeText(e.target.value);
    };

    return (
        <div className="input-group">
            <label className="label">{label}</label>
            <input
                type={type}
                className={`modern-input ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                disabled={!editable}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    onBlur?.();
                }}
                autoCapitalize={type === 'email' ? 'off' : 'words'}
                autoCorrect={type === 'email' ? 'off' : 'on'}
                spellCheck={type === 'email' ? 'false' : 'true'}
            />
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        userRole: 'Admin',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const userRoles = [
        { value: 'Admin', label: 'Administrator', description: 'Full system access' },
        { value: 'MTN_Staff', label: 'MTN Staff', description: 'Device and order management' },
        { value: 'Approver', label: 'Approver', description: 'Application process approver' },
    ];

    const validateField = (field, value) => {
        switch (field) {
            case 'email':
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                return '';

            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                return '';

            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                return '';

            case 'title':
            case 'firstName':
            case 'lastName':
                if (!value) return 'This field is required';
                return '';

            default:
                return '';
        }
    };

    const handleBlur = (field) => {
        const error = validateField(field, formData[field]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleRegister = async (e) => {
        e?.preventDefault();

        const newErrors = {};
        const fieldsToValidate = Object.keys(formData);

        fieldsToValidate.forEach(key => {
            const value = formData[key];
            const error = validateField(key, value);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            alert('Validation Error\nPlease fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Registering operational user...');

            const registrationData = {
                title: formData.title,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                user_role: formData.userRole,
                password: formData.password,
                // Remove created_at and updated_at - these should be handled by the database
            };

            console.log('📤 Operational registration data:', registrationData);

            // Make the actual API call
            // First, make sure you have imported authAPI at the top of your file
            // import { authAPI } from './services/api'; // Adjust the path as needed

            const response = await authAPI.registerOperational(registrationData);

            console.log('✅ Operational Registration API Response:', response.data);

            if (response.data.success) {
                alert('Success\n' + (response.data.message || 'Registration successful!'));
                navigate('/login');
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }

        } catch (error) {
            console.log('❌ Operational Registration API Error:', error);
            // Check if it's an axios error
            if (error.response) {
                // Server responded with error status
                alert('Registration Failed\n' + (error.response.data.message || error.response.statusText));
            } else if (error.request) {
                // Request made but no response
                alert('Registration Failed\nNo response from server. Please check your connection.');
            } else {
                // Something else went wrong
                alert('Registration Failed\n' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container" style={{ backgroundColor: COLORS.background }}>
            <div className="register-form-wrapper" style={{ backgroundColor: COLORS.surface }}>
                <div className="register-header">
                    <h1 style={{ color: COLORS.textPrimary }}>Operational Registration</h1>
                    <p style={{ color: COLORS.textSecondary }}>Create your staff account</p>
                </div>

                <form onSubmit={handleRegister} className="register-form">
                    <SelectInput
                        label="Title *"
                        value={formData.title}
                        placeholder="Select your title"
                        onSelect={(value) => {
                            setFormData({ ...formData, title: value });
                            setErrors(prev => ({ ...prev, title: '' }));
                        }}
                        editable={!loading}
                        options={TITLES}
                        error={errors.title}
                    />

                    <ModernInput
                        label="First Name *"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('firstName')}
                        error={errors.firstName}
                    />

                    <ModernInput
                        label="Last Name *"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('lastName')}
                        error={errors.lastName}
                    />

                    <ModernInput
                        label="Email Address *"
                        placeholder="Enter your work email"
                        type="email"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                    />

                    <div className="input-group">
                        <label className="label">User Role *</label>
                        <div className="roles-container">
                            {userRoles.map((role) => (
                                <button
                                    type="button"
                                    key={role.value}
                                    className={`role-card ${formData.userRole === role.value ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                                    onClick={() => setFormData({ ...formData, userRole: role.value })}
                                    disabled={loading}
                                >
                                    <div className="role-header">
                                        <div className={`role-radio ${formData.userRole === role.value ? 'selected' : ''}`}>
                                            {formData.userRole === role.value && (
                                                <div className="radio-inner" />
                                            )}
                                        </div>
                                        <span className={`role-title ${formData.userRole === role.value ? 'selected' : ''}`}>
                                            {role.label}
                                        </span>
                                    </div>
                                    <span className={`role-description ${formData.userRole === role.value ? 'selected' : ''}`}>
                                        {role.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <PasswordInput
                        label="Password *"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        error={errors.password}
                        showPassword={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                        onBlur={() => handleBlur('password')}
                        editable={!loading}
                    />

                    <PasswordInput
                        label="Confirm Password *"
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        error={errors.confirmPassword}
                        showPassword={showConfirmPassword}
                        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                        onBlur={() => handleBlur('confirmPassword')}
                        editable={!loading}
                    />

                    <button
                        type="submit"
                        className={`submit-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                        style={{ backgroundColor: loading ? COLORS.disabled : COLORS.primary }}
                    >
                        {loading ? (
                            <span className="button-content">
                                <span className="spinner"></span>
                                Creating Account...
                            </span>
                        ) : (
                            'Create Staff Account'
                        )}
                    </button>

                    <div className="login-link">
                        <p style={{ color: COLORS.textSecondary }}>
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="login-link-text"
                                style={{ color: COLORS.primary }}
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
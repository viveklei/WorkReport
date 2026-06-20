import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import './LoginPage.css';
import logo from '../assets/laserexperts.png';

const LoginPage = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [photo, setPhoto] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        // Load GIS script dynamically
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleCallback,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-btn-container'),
                    { theme: 'outline', size: 'large', width: '100%' }
                );
            }
        };
        document.body.appendChild(script);

        return () => {
            try {
                document.body.removeChild(script);
            } catch (e) {
                // ignore if already removed or not found
            }
        };
    }, []);

    const handleGoogleCallback = async (response) => {
        setError('');
        setIsLoading(true);
        try {
            const { token, user } = await api.loginWithGoogle(response.credential);
            localStorage.setItem('work_report_token', token);
            onLogin(user, rememberMe);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMockGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            const mockEmail = prompt("Enter mock Google email:", "google-user@lei.com");
            if (!mockEmail) {
                setIsLoading(false);
                return;
            }
            const mockName = mockEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const mockPayload = {
                email: mockEmail,
                name: mockName,
                picture: 'https://lh3.googleusercontent.com/a/default-user',
                mock: true
            };
            const mockCredential = btoa(JSON.stringify(mockPayload));
            const { token, user } = await api.loginWithGoogle(mockCredential);
            localStorage.setItem('work_report_token', token);
            onLogin(user, rememberMe);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Profile picture must be smaller than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegistering) {
                await api.register({
                    email,
                    password,
                    name,
                    department,
                    photo
                });
                alert('Registration successful! Please sign in.');
                setIsRegistering(false);
                setPassword('');
            } else {
                const { token, user } = await api.login(email, password);
                
                // Store token for API requests
                localStorage.setItem('work_report_token', token);
                
                onLogin(user, rememberMe);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <img src={logo} alt="Laser Experts" className="login-logo" />
                    <div className="login-title">
                        LEI <span className="accent-text">Report</span> Portal
                    </div>
                    <p className="login-subtitle">
                        {isRegistering ? 'Create your professional account' : 'Access your professional dashboard'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegistering && (
                        <div className="registration-fields animate-fade-in">
                            <div className="photo-upload-section">
                                <div 
                                    className="profile-preview" 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ backgroundImage: photo ? `url(${photo})` : 'none' }}
                                >
                                    {!photo && <span className="add-photo-icon">+</span>}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePhotoUpload} 
                                />
                                <p className="photo-label">Profile Picture (Optional)</p>
                            </div>

                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g. Sales, Engineering"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            required
                        />
                    </div>

                    {!isRegistering && (
                        <div className="remember-me-container animate-fade-in">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe} 
                                    onChange={(e) => setRememberMe(e.target.checked)} 
                                />
                                <span className="checkbox-text">Remember Me</span>
                            </label>
                        </div>
                    )}

                    {error && <div className="login-error animate-shake">{error}</div>}

                    <button type="submit" className="login-button">
                        {isRegistering ? 'Create Account' : 'Sign In'}
                    </button>
                    
                    {!isRegistering && (
                        <>
                            <div className="login-divider">
                                <span>or</span>
                            </div>
                            
                            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                                <div id="google-signin-btn-container" className="google-btn-container"></div>
                            ) : (
                                <button 
                                    type="button" 
                                    className="google-signin-btn-mock"
                                    onClick={handleMockGoogleLogin}
                                >
                                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                    </svg>
                                    <span>Sign in with Google</span>
                                </button>
                            )}
                        </>
                    )}

                    <button 
                        type="button" 
                        className="mode-toggle-btn"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                    >
                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 LEI Professional Services</p>
                    <div className="login-support">
                        <span>Support:</span>
                        <a href="tel:8807717916">8807717916</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

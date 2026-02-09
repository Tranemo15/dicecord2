import { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Auth({ setAuth }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
            const data = res.data;
            setAuth(data.token, data.username, data.avatar_url);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <h2>{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
                    <p>{isLogin ? "We're so excited to see you again!" : "Join the server and start chatting!"}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>USERNAME</label>
                        <input
                            className="discord-input"
                            type="text"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <input
                            className="discord-input"
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <button type="submit" className="discord-btn auth-submit">
                        {isLogin ? 'Log In' : 'Continue'}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>{isLogin ? 'Need an account?' : 'Already have an account?'}</span>
                    <span
                        className="link"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </span>
                </div>
            </div>
        </div>
    );
}

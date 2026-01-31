import React, { useState, useEffect } from 'react';
import './UserProfileModal.css';
import Avatar from './Avatar';
import { X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function UserProfileModal({ username, onClose }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/user/${username}`);
                setUserData(res.data);
            } catch (err) {
                console.error("Failed to fetch user profile", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchUser();
        }
    }, [username]);

    if (!username) return null;

    return (
        <div className="user-profile-modal-overlay" onClick={onClose}>
            <div className="user-profile-modal" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    <>
                        <div
                            className="profile-banner-view"
                            style={{ backgroundColor: userData.banner_url ? 'transparent' : '#5865F2' }}
                        >
                            {userData.banner_url && (
                                <img src={`${API_URL}${userData.banner_url}`} alt="Banner" />
                            )}
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="profile-header-view">
                            <div className="avatar-wrapper-view">
                                <Avatar
                                    username={userData.username}
                                    avatarUrl={userData.avatar_url}
                                    size={80}
                                />
                                <div className="status-indicator-view online"></div>
                            </div>
                            <h2 className="username-view">{userData.username}</h2>
                        </div>

                        <div className="profile-body-view">
                            <div className="section">
                                <h3>ABOUT ME</h3>
                                <div className="bio-view">
                                    {userData.bio || "This user hasn't added a bio yet."}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

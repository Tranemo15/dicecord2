import { useState, useEffect } from 'react';
import { X, Upload, Save, Loader, Edit3 } from 'lucide-react';
import Avatar from './Avatar';
import axios from 'axios';
import './UserSettingsModal.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function UserSettingsModal({ isOpen, onClose, username, avatarUrl, setAvatarUrl, token }) {
    const [profile, setProfile] = useState({
        avatar_url: avatarUrl,
        banner_url: null,
        bio: ''
    });

    // Staging state
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);

    const [previewBanner, setPreviewBanner] = useState(null);
    const [selectedBannerFile, setSelectedBannerFile] = useState(null);

    const [editedBio, setEditedBio] = useState(null); // null means untouched

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isOpen && username) {
            setIsFetching(true);
            axios.get(`${API_URL}/api/user/${username}`)
                .then(res => {
                    setProfile({
                        avatar_url: res.data.avatar_url,
                        banner_url: res.data.banner_url || null,
                        bio: res.data.bio || ''
                    });
                    // Sync parent avatar just in case
                    if (res.data.avatar_url !== avatarUrl && setAvatarUrl) {
                        setAvatarUrl(res.data.avatar_url);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsFetching(false));

            // Reset staging
            setPreviewAvatar(null);
            setSelectedAvatarFile(null);
            setPreviewBanner(null);
            setSelectedBannerFile(null);
            setEditedBio(null);
        }
    }, [isOpen, username]);

    if (!isOpen) return null;

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedAvatarFile(file);
            setPreviewAvatar(URL.createObjectURL(file));
        }
    };

    const handleBannerSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedBannerFile(file);
            setPreviewBanner(URL.createObjectURL(file));
        }
    };

    const hasChanges = !!selectedAvatarFile || !!selectedBannerFile || (editedBio !== null && editedBio !== profile.bio);

    const handleSave = async () => {
        if (!hasChanges) return;
        setIsLoading(true);

        try {
            // Avatar
            if (selectedAvatarFile) {
                const formData = new FormData();
                formData.append('avatar', selectedAvatarFile);
                formData.append('username', username);
                const res = await axios.post(`${API_URL}/api/user/avatar`, formData);
                if (setAvatarUrl) setAvatarUrl(res.data.avatar_url);
                setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
            }

            // Banner
            if (selectedBannerFile) {
                const formData = new FormData();
                formData.append('banner', selectedBannerFile);
                formData.append('username', username);
                const res = await axios.post(`${API_URL}/api/user/banner`, formData);
                setProfile(prev => ({ ...prev, banner_url: res.data.banner_url }));
            }

            // Bio
            if (editedBio !== null && editedBio !== profile.bio) {
                await axios.post(`${API_URL}/api/user/bio`, { username, bio: editedBio });
                setProfile(prev => ({ ...prev, bio: editedBio }));
            }

            // Reset staging
            setPreviewAvatar(null);
            setSelectedAvatarFile(null);
            setPreviewBanner(null);
            setSelectedBannerFile(null);
            setEditedBio(null);
            onClose();

        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to save changes");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-sidebar">
                    <div className="settings-sidebar-header">USER SETTINGS</div>
                    <div className="settings-tab active">My Account</div>
                </div>

                <div className="settings-content">
                    <div className="settings-header">
                        <h2>My Account</h2>
                    </div>

                    <div className="profile-section">
                        {/* Banner */}
                        <div
                            className="profile-banner clickable"
                            style={{
                                backgroundColor: (previewBanner || profile.banner_url) ? 'transparent' : '#5865F2',
                                backgroundImage: (previewBanner || profile.banner_url) ? `url(${previewBanner || (API_URL + profile.banner_url)})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <label className="banner-upload-label">
                                <Edit3 size={16} />
                                <input type="file" hidden accept="image/*" onChange={handleBannerSelect} />
                            </label>
                        </div>

                        <div className="profile-header">
                            <div className="profile-avatar-container">
                                <Avatar
                                    username={username}
                                    avatarUrl={previewAvatar || profile.avatar_url}
                                    size={80}
                                    className="profile-avatar-lg"
                                />
                                <div className="avatar-hint"></div>
                            </div>
                            <div className="profile-username">
                                <h3>{username}</h3>
                            </div>
                            <div className="profile-actions">
                                <label className="upload-btn">
                                    Change Avatar
                                    <input type="file" hidden accept="image/*" onChange={handleAvatarSelect} />
                                </label>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="bio-section">
                            <label>ABOUT ME</label>
                            <textarea
                                placeholder="Write something about yourself..."
                                value={editedBio !== null ? editedBio : profile.bio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                maxLength={190}
                            />
                        </div>

                        {hasChanges && (
                            <div className="unsaved-changes-bar">
                                <span>Careful — you have unsaved changes!</span>
                                <div className="actions">
                                    <button className="btn-reset" onClick={() => {
                                        setPreviewAvatar(null);
                                        setSelectedAvatarFile(null);
                                        setPreviewBanner(null);
                                        setSelectedBannerFile(null);
                                        setEditedBio(null);
                                    }}>Reset</button>
                                    <button className="btn-save" onClick={handleSave} disabled={isLoading}>
                                        {isLoading ? <Loader className="spin" size={16} /> : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="close-btn-abs" onClick={onClose}>
                        <X size={24} />
                        <span>ESC</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

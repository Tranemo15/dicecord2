import React from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Avatar({ username, avatarUrl, size = 40, className = '' }) {
    const handleError = (e) => {
        e.target.src = `https://ui-avatars.com/api/?name=${username}&background=random`;
    };

    let src = `https://ui-avatars.com/api/?name=${username}&background=random`;

    if (avatarUrl) {
        // If it's a full URL (like http...) use it, otherwise prepend API_URL
        if (avatarUrl.startsWith('http')) {
            src = avatarUrl;
        } else {
            src = `${API_URL}${avatarUrl}`;
        }
    }

    return (
        <img
            src={src}
            alt={username}
            className={`avatar-img ${className}`}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            onError={handleError}
        />
    );
}

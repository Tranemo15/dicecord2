import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, LogOut, Hash, Send, Smile, X, Settings, ListPlus, Users } from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import EmojiManager from '../components/EmojiManager';
import Avatar from '../components/Avatar';
import UserSettingsModal from '../components/UserSettingsModal';
import UserProfileModal from '../components/UserProfileModal';
import { emoji as emojiMap } from 'emoji-name-map';
import './Chat.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Chat({ token, username, avatarUrl, setAvatarUrl, logout }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [emojis, setEmojis] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showEmojiManager, setShowEmojiManager] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState(null); // Username for profile view

    // User Sidebar State
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(true);

    const [autocompleteList, setAutocompleteList] = useState([]);
    const [autocompleteIndex, setAutocompleteIndex] = useState(0);
    const [lightboxImage, setLightboxImage] = useState(null);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const openEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    const fetchEmojis = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/emojis`);
            const emojisData = Array.isArray(res.data) ? res.data : [];
            setEmojis(emojisData);
        } catch (err) {
            console.error("Failed to fetch emojis", err);
            setEmojis([]);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            const usersData = Array.isArray(res.data) ? res.data : [];
            setAllUsers(usersData);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setAllUsers([]);
        }
    };

    const [unreadCount, setUnreadCount] = useState(0);

    const updateFavicon = (count) => {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.id = 'favicon'; // Ensure ID

        if (count === 0) {
            link.href = '/vite.svg';
            document.getElementsByTagName('head')[0].appendChild(link);
            document.title = 'Diskok';
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = '/vite.svg';
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 32, 32);

            // Badge Circle
            ctx.beginPath();
            ctx.arc(22, 22, 10, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444'; // Red-500
            ctx.fill();
            ctx.strokeStyle = '#232428'; // Dark bg
            ctx.lineWidth = 2;
            ctx.stroke();

            // Badge Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const badgeText = count > 9 ? '9+' : count.toString();
            ctx.fillText(badgeText, 22, 23); // slightly offset y for alignment

            link.href = canvas.toDataURL('image/png');
            document.getElementsByTagName('head')[0].appendChild(link);
            document.title = `(${count}) Diskok`;
        };
    };

    // Channels State
    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null); // { id, name }
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [showPinnedMessages, setShowPinnedMessages] = useState(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setUnreadCount(0);
                updateFavicon(0);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Fetch Channels
        // Fetch Channels - RESTORED TO SIMPLE STATE
        const fetchChannels = async () => {
            // Bypass API for stability "Rollback"
            console.log('Using static channels for stability');
            const staticChannels = [{ id: 1, name: 'general', type: 'text' }];
            setChannels(staticChannels);
            setActiveChannel(staticChannels[0]);
        };


        fetchChannels();
        fetchEmojis();
        fetchAllUsers();

        // Socket connection
        socket.auth = { token };
        socket.connect();

        socket.on('newMessage', (msg) => {
            // Only add message if it belongs to active channel
            // Note: In a real app we would track unread counts for other channels
            setMessages((prev) => {
                // We can't access activeChannel state reliably inside this callback closure without ref
                // But for now, let's filter in render or use a functional update trick if needed.
                // Actually, simplest is to just append all, and let the UI filter.
                // But that might grow large.
                // Let's refetch or append if matches.
                // Wait, we need to know the current active channel ID.
                return [...prev, msg];
            });

            if (document.hidden) {
                setUnreadCount(prev => {
                    const newCount = prev + 1;
                    updateFavicon(newCount);
                    return newCount;
                });
            }
        });

        socket.on('channelCreated', (newChannel) => {
            setChannels(prev => [...prev, newChannel]);
        });

        socket.on('onlineUsers', (users) => {
            // Ensure we always have an array
            setOnlineUsers(Array.isArray(users) ? users : []);
        });

        socket.on('messageUpdated', (updatedMsg) => {
            setMessages((prev) => prev.map(m =>
                m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
            ));
        });

        socket.on('messageDeleted', (deletedId) => {
            setMessages((prev) => prev.filter(m => m.id !== deletedId));
        });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            socket.off('newMessage');
            socket.off('channelCreated');
            socket.off('onlineUsers');
            socket.off('messageUpdated');
            socket.off('messageDeleted');
            socket.disconnect();
        };
    }, [token]);

    // Fetch messages when active channel changes
    useEffect(() => {
        if (!activeChannel) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/messages?channelId=${activeChannel.id}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        };
        fetchMessages();
    }, [activeChannel]);

    // ... (existing helper functions) ...

    const sendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() && activeChannel) {
            const payload = {
                user_id: 0,
                username: username,
                content: inputValue,
                channel_id: activeChannel.id // Send channel ID
            };

            socket.emit('sendMessage', payload);
            setInputValue('');
        }
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;

        // Normalize the name the same way the server does
        const safeName = newChannelName.toLowerCase().replace(/[^a-z0-9-]/g, '');

        // Check if channel already exists
        if (channels.some(ch => ch.name === safeName)) {
            alert(`Channel "${safeName}" already exists!`);
            setNewChannelName('');
            setIsCreatingChannel(false);
            return;
        }

        if (!safeName) {
            alert('Channel name must contain at least one alphanumeric character');
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/api/channels`,
                { name: newChannelName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Socket will update list, but we can switch immediately or wait
            // Let's reset input
            setNewChannelName('');
            setIsCreatingChannel(false);
        } catch (err) {
            alert("Failed to create channel: " + (err.response?.data?.error || err.message));
        }
    };

    // Filter messages for rendering (client-side specific safety)
    const displayedMessages = messages.filter(m => m.channel_id === (activeChannel?.id || 1));

    const handlePinMessage = async (messageId) => {
        try {
            await axios.post(`${API_URL}/api/messages/${messageId}/pin`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Failed to pin/unpin message", err);
            alert("Failed to pin/unpin message: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await axios.delete(`${API_URL}/api/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to delete message", err);
            alert("Failed to delete message: " + (err.response?.data?.error || err.message));
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle outside click for emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        // Autocomplete logic
        const lastWord = val.split(' ').pop();
        if (lastWord.startsWith(':') && lastWord.length > 1) {
            const query = lastWord.slice(1).toLowerCase();

            // 1. Search Custom Emojis
            const customMatches = emojis
                .filter(e => e.name.toLowerCase().includes(query))
                .map(e => ({ type: 'custom', ...e }));

            // 2. Search Standard Emojis
            const standardMatches = [];
            if (emojiMap) {
                Object.keys(emojiMap).forEach(name => {
                    if (name.includes(query)) {
                        standardMatches.push({ type: 'standard', name: name, char: emojiMap[name] });
                    }
                });
            }

            // Merge and Limit
            const allMatches = [...customMatches, ...standardMatches].slice(0, 5); // Limit to 5 for UI

            setAutocompleteList(allMatches);
            setAutocompleteIndex(0);
        } else {
            setAutocompleteList([]);
        }
    };

    const handleKeyDown = (e) => {
        if (autocompleteList.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setAutocompleteIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setAutocompleteIndex(prev => Math.min(autocompleteList.length - 1, prev + 1));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectAutocomplete(autocompleteList[autocompleteIndex]);
            } else if (e.key === 'Escape') {
                setAutocompleteList([]);
            }
        }
    };

    const selectAutocomplete = (emoji) => {
        const words = inputValue.split(' ');
        words.pop();

        let suffix = '';
        if (emoji.type === 'custom') {
            suffix = `:${emoji.name}: `;
        } else {
            suffix = `${emoji.char} `; // Insert actual char for standard
        }

        const newValue = words.join(' ') + (words.length > 0 ? ' ' : '') + suffix;
        setInputValue(newValue);
        setAutocompleteList([]);
    };

    const insertEmoji = (emoji) => {
        if (emoji.char) {
            setInputValue(prev => prev + emoji.char);
        } else {
            setInputValue(prev => prev + `:${emoji.name}: `);
        }
        setShowEmojiPicker(false);
    };

    const renderMessageContent = (content) => {
        // Regex for :emoji_name: is :[a-zA-Z0-9_]+:
        const emojiRegex = /:([a-zA-Z0-9_]+):/g;

        // Remove whitespace and check if strict match (for Jumbo)
        const isJumbo = content.replace(/\s/g, '').replace(emojiRegex, '') === '';

        const parts = content.split(emojiRegex);

        if (parts.length === 1) return content;

        return (
            <span className={isJumbo ? 'jumbomoji-container' : ''}>
                {parts.map((part, i) => {
                    if (i % 2 === 1) {
                        const emojiName = part;
                        const emoji = emojis.find(e => e.name === emojiName);
                        if (emoji) {
                            return (
                                <img
                                    key={i}
                                    src={`${API_URL}${emoji.url}`}
                                    alt={`:${emojiName}:`}
                                    className={`emoji ${isJumbo ? 'jumbo' : ''}`}
                                    onClick={() => setLightboxImage(emoji)}
                                    title={`:${emojiName}:`}
                                />
                            );
                        } else {
                            return `:${emojiName}:`;
                        }
                    } else {
                        return part;
                    }
                })}
            </span>
        );
    };



    // Calculate Offline Users
    const offlineUsers = allUsers.filter(u => !onlineUsers.some(ou => ou.id === u.id));

    const formatToCET = (dateStr, type) => {
        if (!dateStr) return '';

        // Fix for SQL timestamps (e.g. "2023-01-01 12:00:00") which lack 'Z'
        // We assume database stores UTC. If we don't add 'Z', browser interprets as Local Time,
        // causing a shift (often -1h) compared to the Socket messages which are explicitly UTC.
        let safeDateStr = dateStr;
        if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('T')) {
            safeDateStr = dateStr.replace(' ', 'T') + 'Z';
        }

        const date = new Date(safeDateStr);

        // Force CET (Central European Time)
        // Note: 'CET' might not be supported in all environments, 'Europe/Paris' or 'Europe/Berlin' is safer.
        const options = {
            timeZone: 'Europe/Paris', // CET/CEST
            hour12: false, // 24-hour clock
        };

        if (type === 'time') {
            return new Intl.DateTimeFormat('en-GB', {
                ...options,
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } else {
            return new Intl.DateTimeFormat('en-GB', {
                ...options,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar code... */}
            <div className="sidebar">
                <div className="server-name">My Server</div>
                <div className="channels-header" style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                    <span>TEXT CHANNELS</span>
                    <Plus size={16} style={{ cursor: 'pointer' }} onClick={() => setIsCreatingChannel(true)} />
                </div>

                <div className="channels">
                    {channels.map(channel => (
                        <div
                            key={channel.id}
                            className={`channel ${activeChannel?.id === channel.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(channel)}
                        >
                            <Hash size={20} />
                            <span>{channel.name}</span>
                        </div>
                    ))}

                    {isCreatingChannel && (
                        <form onSubmit={handleCreateChannel} style={{ padding: '0 8px' }}>
                            <input
                                autoFocus
                                type="text"
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value)}
                                onBlur={() => !newChannelName && setIsCreatingChannel(false)}
                                placeholder="new-channel"
                                style={{
                                    background: '#202225',
                                    border: '1px solid #000',
                                    color: 'white',
                                    width: '100%',
                                    padding: '4px',
                                    borderRadius: '4px'
                                }}
                            />
                        </form>
                    )}
                </div>

                <div className="user-profile">
                    <div className="user-info">
                        <div className="avatar-upload-wrapper" title="User Settings" onClick={() => setIsSettingsOpen(true)}>
                            <Avatar username={username} avatarUrl={avatarUrl || null} />
                            <div className="avatar-overlay">
                                <Settings size={16} />
                            </div>
                        </div>
                        <div className="username-tag">
                            <span className="username">{username}</span>
                        </div>
                    </div>
                    <div className="profile-controls">
                        <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="User Settings">
                            <Settings size={18} />
                        </button>
                        <button className="icon-btn" onClick={logout} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <UserSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                username={username}
                avatarUrl={avatarUrl}
                setAvatarUrl={setAvatarUrl}
                token={token}
            />

            <EmojiManager
                isOpen={showEmojiManager}
                onClose={() => setShowEmojiManager(false)}
                emojis={emojis}
                refreshEmojis={fetchEmojis}
            />

            {/* Chat Area */}
            <div className="chat-area">
                <div className="chat-header">
                    <Hash size={24} className="header-hash" />
                    <h3>{activeChannel?.name || 'general'}</h3>
                    <span className="topic">The one and only global chat</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button
                            className={`icon-btn ${showPinnedMessages ? 'active' : ''}`}
                            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                            title="Pinned Messages"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin"><line x1="12" x2="12" y1="17" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
                        </button>

                        <button
                            className={`icon-btn ${isUserSidebarOpen ? 'active' : ''}`}
                            onClick={() => setIsUserSidebarOpen(!isUserSidebarOpen)}
                            title="Toggle User List"
                        >
                            <Users size={24} />
                        </button>
                    </div>
                </div>

                {showPinnedMessages && (
                    <div className="pinned-messages-popout">
                        <div className="pinned-header">
                            <h3>Pinned Messages</h3>
                        </div>
                        <div className="pinned-list">
                            {messages.filter(m => m.is_pinned).length === 0 ? (
                                <div className="pinned-empty">No pinned messages yet.</div>
                            ) : (
                                messages.filter(m => m.is_pinned).map(msg => (
                                    <div key={msg.id} className="pinned-item">
                                        <div className="pinned-item-header">
                                            <div onClick={() => setSelectedUserProfile(msg.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <Avatar username={msg.username} avatarUrl={msg.avatar_url} size={24} />
                                                <span className="pinned-username" style={{ marginLeft: 8 }}>{msg.username}</span>
                                            </div>
                                            <span className="pinned-time">{formatToCET(msg.created_at, 'full')}</span>
                                        </div>
                                        <div className="pinned-content">
                                            {renderMessageContent(msg.content)}
                                        </div>
                                        <button className="pinned-remove" onClick={() => handlePinMessage(msg.id)} title="Unpin">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="messages-list">
                    {displayedMessages.map((msg, idx) => {
                        const isDifferentUser = idx === 0 || displayedMessages[idx - 1].username !== msg.username;

                        return (
                            <div key={msg.id || idx} className={`message-item ${isDifferentUser ? 'message-group-start' : 'message-group-follow'}`}>
                                <div className="message-left-col">
                                    {isDifferentUser ? (
                                        <div onClick={() => setSelectedUserProfile(msg.username)} style={{ cursor: 'pointer' }}>
                                            <Avatar
                                                username={msg.username}
                                                avatarUrl={msg.avatar_url}
                                                size={40}
                                                className="message-avatar"
                                            />
                                        </div>
                                    ) : (
                                        <div className="message-timestamp-hover">
                                            {formatToCET(msg.created_at, 'time')}
                                        </div>
                                    )}
                                </div>

                                <div className="message-right-col">
                                    {isDifferentUser && (
                                        <div className="message-header">
                                            <span className="message-username" onClick={() => setSelectedUserProfile(msg.username)} style={{ cursor: 'pointer' }}>{msg.username}</span>
                                            <span className="message-time">
                                                {formatToCET(msg.created_at, 'full')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="message-content">
                                        {renderMessageContent(msg.content)}
                                    </div>
                                </div>

                                <div className="message-actions">
                                    <button
                                        className="message-action-btn"
                                        title={msg.is_pinned ? "Unpin Message" : "Pin Message"}
                                        onClick={() => handlePinMessage(msg.id)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
                                    </button>

                                    {msg.username === username && (
                                        <button
                                            className="message-action-btn delete-btn"
                                            title="Delete Message"
                                            onClick={() => handleDeleteMessage(msg.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    {/* ... (input area same as before) ... */}
                    {autocompleteList.length > 0 && (
                        <div className="autocomplete-popup">
                            {autocompleteList.map((emoji, idx) => (
                                <div
                                    key={idx}
                                    className={`autocomplete-item ${idx === autocompleteIndex ? 'active' : ''}`}
                                    onClick={() => selectAutocomplete(emoji)}
                                >
                                    {emoji.type === 'custom' ? (
                                        <img src={`${API_URL}${emoji.url}`} alt={emoji.name} />
                                    ) : (
                                        <span style={{ marginRight: 8, fontSize: 20 }}>{emoji.char}</span>
                                    )}
                                    <span>:{emoji.name}:</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="chat-form-container">
                        <form className="chat-form" onSubmit={sendMessage}>
                            <input
                                type="text"
                                placeholder={`Message #general`}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="chat-form-actions">
                                <button
                                    type="button"
                                    className="emoji-trigger-btn"
                                    onClick={() => setShowEmojiManager(true)}
                                    title="Manage Emojis"
                                >
                                    <ListPlus size={20} />
                                </button>
                                <button
                                    type="button"
                                    className="emoji-trigger-btn"
                                    onClick={openEmojiPicker}
                                    title="Open Emojis"
                                >
                                    <Smile size={20} />
                                </button>
                            </div>
                        </form>
                        {showEmojiPicker && (
                            <div className="emoji-picker-popup" ref={emojiPickerRef}>
                                <EmojiPicker
                                    emojis={emojis}
                                    onSelect={insertEmoji}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Users Sidebar */}
            <div className={`users-sidebar ${isUserSidebarOpen ? 'open' : 'closed'}`}>
                {/* Online Users */}
                <div className="users-section">
                    <div className="section-header">ONLINE — {onlineUsers.length}</div>
                    {onlineUsers.map(u => (
                        <div key={u.id} className="user-item online" onClick={() => setSelectedUserProfile(u.username)} style={{ cursor: 'pointer' }}>
                            <Avatar username={u.username} avatarUrl={u.avatar_url} size={32} />
                            <div className="user-text">
                                <span className="username">{u.username}</span>
                                {/* <span className="status-text">{u.bio || ''}</span> */}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Offline Users */}
                {offlineUsers.length > 0 && (
                    <div className="users-section mt-4">
                        <div className="section-header">OFFLINE — {offlineUsers.length}</div>
                        {offlineUsers.map(u => (
                            <div key={u.id} className="user-item offline" onClick={() => setSelectedUserProfile(u.username)} style={{ cursor: 'pointer' }}>
                                <Avatar username={u.username} avatarUrl={u.avatar_url} size={32} />
                                <div className="user-text">
                                    <span className="username">{u.username}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isSettingsOpen && (
                <UserSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    username={username}
                    token={token}
                    avatarUrl={avatarUrl}
                    onAvatarUpdate={setAvatarUrl}
                    onLogout={logout}
                />
            )}

            {selectedUserProfile && (
                <UserProfileModal
                    username={selectedUserProfile}
                    onClose={() => setSelectedUserProfile(null)}
                />
            )}

            {/* Lightbox */}
            {
                lightboxImage && (
                    <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
                        <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                            <img src={`${API_URL}${lightboxImage.url}`} alt={lightboxImage.name} />
                            <div className="lightbox-footer">
                                <span className="lightbox-name">:{lightboxImage.name}:</span>
                                <a href={`${API_URL}${lightboxImage.url}`} target="_blank" rel="noopener noreferrer">Open in original</a>
                            </div>
                        </div>
                        <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
                            <X size={24} />
                        </button>
                    </div>
                )
            }
        </div>
    );
}

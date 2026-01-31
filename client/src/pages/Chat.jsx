import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, LogOut, Hash, Send, Smile, X, Settings, ListPlus, Users } from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import EmojiManager from '../components/EmojiManager';
import Avatar from '../components/Avatar';
import UserSettingsModal from '../components/UserSettingsModal';
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
            setEmojis(res.data);
        } catch (err) {
            console.error("Failed to fetch emojis", err);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/users`);
            setAllUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    useEffect(() => {
        // Initial fetch
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/messages`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        };

        fetchMessages();
        fetchEmojis();
        fetchAllUsers();

        // Socket connection
        socket.auth = { token };
        socket.connect();

        socket.on('newMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('onlineUsers', (users) => {
            setOnlineUsers(users);
        });

        return () => {
            socket.off('newMessage');
            socket.off('onlineUsers');
            socket.disconnect();
        };
    }, [token]);

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

    const sendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            const payload = {
                user_id: 0,
                username: username,
                content: inputValue
            };

            socket.emit('sendMessage', payload);
            setInputValue('');
        }
    };

    // Calculate Offline Users
    const offlineUsers = allUsers.filter(u => !onlineUsers.some(ou => ou.id === u.id));

    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="server-name">My Server</div>
                <div className="channels">
                    <div className="channel active">
                        <Hash size={20} />
                        <span>general</span>
                    </div>
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
            </div>

            {/* Chat Area */}
            <div className="chat-area">
                <div className="chat-header">
                    <Hash size={24} className="header-hash" />
                    <h3>general</h3>
                    <span className="topic">The one and only global chat</span>
                    <button
                        className={`icon-btn ml-auto ${isUserSidebarOpen ? 'active' : ''}`}
                        onClick={() => setIsUserSidebarOpen(!isUserSidebarOpen)}
                        title="Toggle User List"
                        style={{ marginLeft: 'auto' }}
                    >
                        <Users size={24} />
                    </button>
                </div>

                <div className="messages-list">
                    {messages.map((msg, idx) => {
                        const isDifferentUser = idx === 0 || messages[idx - 1].username !== msg.username;

                        return (
                            <div key={msg.id || idx} className={`message-item ${isDifferentUser ? 'message-group-start' : 'message-group-follow'}`}>
                                <div className="message-left-col">
                                    {isDifferentUser ? (
                                        <Avatar
                                            username={msg.username}
                                            avatarUrl={msg.avatar_url}
                                            size={40}
                                            className="message-avatar"
                                        />
                                    ) : (
                                        <div className="message-timestamp-hover">
                                            {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                                        </div>
                                    )}
                                </div>

                                <div className="message-right-col">
                                    {isDifferentUser && (
                                        <div className="message-header">
                                            <span className="message-username">{msg.username}</span>
                                            <span className="message-time">
                                                {msg.created_at ? format(new Date(msg.created_at), 'MM/dd/yyyy h:mm a') : ''}
                                            </span>
                                        </div>
                                    )}
                                    <div className="message-content">
                                        {renderMessageContent(msg.content)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
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
                        <div key={u.id} className="user-item online">
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
                            <div key={u.id} className="user-item offline">
                                <Avatar username={u.username} avatarUrl={u.avatar_url} size={32} />
                                <div className="user-text">
                                    <span className="username">{u.username}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
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
            )}
        </div>
    );
}

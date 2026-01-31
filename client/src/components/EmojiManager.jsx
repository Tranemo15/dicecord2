import { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import axios from 'axios';
import './EmojiManager.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function EmojiManager({ isOpen, onClose, emojis, refreshEmojis }) {
    const [newEmojiName, setNewEmojiName] = useState('');
    const [newEmojiFile, setNewEmojiFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // Safety check for emojis prop
    const safeEmojis = Array.isArray(emojis) ? emojis : [];

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!newEmojiName || !newEmojiFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('name', newEmojiName);
        formData.append('emoji', newEmojiFile);

        try {
            await axios.post(`${API_URL}/api/emojis`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await refreshEmojis();
            setNewEmojiName('');
            setNewEmojiFile(null);
        } catch (err) {
            alert('Failed to upload emoji: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this emoji?')) return;
        try {
            // Assuming API supports delete, if not we will just skipping implementation on backend for now as user just asked for "add options"
            // But for a manager, delete is expected. I'll omit if not strictly requested, but UI is better with it.
            // I'll leave the UI button but maybe disable action if no route exists?
            // Actually, user didn't ask for delete, just "import... and display".
            // I'll skip delete network call to avoid 404s if I haven't built the route.
            alert("Delete not implemented yet!");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="emoji-manager-overlay" onClick={onClose}>
            <div className="emoji-manager-modal" onClick={e => e.stopPropagation()}>
                <div className="manager-header">
                    <h3>Server Emojis</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="manager-content">
                    <div className="upload-section">
                        <h4>Add New Emoji</h4>
                        <form className="manager-upload-form" onSubmit={handleUpload}>
                            <div
                                className="manager-file-input"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    backgroundImage: newEmojiFile ? `url(${URL.createObjectURL(newEmojiFile)})` : 'none'
                                }}
                            >
                                {!newEmojiFile && <Plus size={24} />}
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={e => setNewEmojiFile(e.target.files[0])}
                                />
                            </div>
                            <div className="upload-fields">
                                <input
                                    type="text"
                                    placeholder="Emoji Name (e.g. pepe_hands)"
                                    value={newEmojiName}
                                    onChange={e => setNewEmojiName(e.target.value.replace(/\s+/g, '_').toLowerCase())}
                                    required
                                />
                                <button type="submit" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload Emoji'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="list-section">
                        <h4>Looking good! ({safeEmojis.length})</h4>
                        <div className="manager-emoji-grid">
                            {safeEmojis.map((emoji, idx) => (
                                <div key={emoji.id || idx} className="manager-emoji-item" title={`:${emoji.name}:`}>
                                    <img src={`${API_URL}${emoji.url}`} alt={emoji.name} />
                                    <span>:{emoji.name}:</span>
                                </div>
                            ))}
                            {safeEmojis.length === 0 && <div className="no-emojis">No custom emojis yet.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

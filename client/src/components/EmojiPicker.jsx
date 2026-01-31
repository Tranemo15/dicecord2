import { useMemo, useState, useEffect, memo } from 'react';
import Picker from 'emoji-picker-react';
import './EmojiPicker.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function EmojiPickerWrapper({ emojis = [], onSelect }) {
    // FREEZE emojis logic:
    // Only update the emoji list if we haven't locked in a list yet. 
    // This allows the initial fetch to populate the picker, but ignores subsequent updates (like uploads).
    // This prevents the Picker from re-rendering/crashing on dynamic updates.
    const [frozenEmojis, setFrozenEmojis] = useState([]);

    useEffect(() => {
        if (emojis.length > 0 && frozenEmojis.length === 0) {
            setFrozenEmojis(emojis);
        }
    }, [emojis]);

    // Use frozenEmojis for the picker instead of live props
    const activeEmojis = frozenEmojis.length > 0 ? frozenEmojis : [];

    // Transform DB emojis to emoji-picker-react custom format
    const customEmojis = useMemo(() => {
        // TEMPORARY SAFETY OVERRIDE: Return empty array to verify if Custom Emojis are the crash cause.
        // If this fixes the gray screen, we know the data format is the issue.
        return [];

        /* 
        if (!Array.isArray(activeEmojis) || !activeEmojis.length) return [];
        return [
            {
                id: 'server-emojis',
                name: 'Server Emojis',
                emojis: activeEmojis
                    .filter(e => e.name && e.url)
                    .map(e => ({
                        id: `${e.name.replace(/\s+/g, '_').toLowerCase()}_${e.id}`,
                        name: e.name,
                        keywords: [e.name],
                        skins: [{ src: `${API_URL}${e.url}` }]
                    }))
            }
        ];
        */
    }, [activeEmojis]);

    const handleEmojiClick = (emojiData) => {
        if (emojiData.isCustom) {
            // Find the original emoji object by reconstructing the ID or just searching
            const customEmoji = activeEmojis.find(e =>
                `${e.name.replace(/\s+/g, '_').toLowerCase()}_${e.id}` === emojiData.id
            );

            if (customEmoji) {
                onSelect(customEmoji);
            } else {
                // Clean fallback if lookup fails (strip the ID Suffix for display)
                const simpleName = emojiData.id.split('_').slice(0, -1).join('_');
                onSelect({ char: `:${simpleName}:` });
            }
        } else {
            onSelect({ char: emojiData.emoji });
        }
    };

    return (
        <div className="emoji-picker-container">
            <Picker
                theme="dark"
                onEmojiClick={handleEmojiClick}
                customEmojis={customEmojis}
                previewConfig={{ showPreview: false }}
                width="100%"
                height="100%"
            />
        </div>
    );
}

// Wrap in React.memo with a custom comparator that always returns true.
// This ensures that NO prop changes from the parent (emojis list updates, function recreations) 
// will trigger a re-render of this component. It remains perfectly static after mount.
export default memo(EmojiPickerWrapper, () => true);

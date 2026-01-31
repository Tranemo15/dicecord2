import React from 'react';

// A small subset of standard emojis for demo
// In a real app, use a library like 'emoji-datasource' or 'node-emoji'
export const STANDARD_EMOJIS = {
    ':skull:': '💀',
    ':sob:': '😭',
    ':joy:': '😂',
    ':heart:': '❤️',
    ':fire:': '🔥',
    ':thumbsup:': '👍',
    ':thumbsdown:': '👎',
    ':eyes:': '👀',
    ':smile:': '😄',
    ':clown:': '🤡'
};

/**
 * Parses text and replaces :shortcodes: with standard unicode or custom image tags.
 * @param {string} text - Message content
 * @param {object} customEmojis - Map of { ':name:': '/url' }
 * @returns {Array} - Array of React elements or strings
 */
export const parseEmojis = (text, customEmojis = {}, onEmojiClick) => {
    if (!text) return [];

    // Regex to capture :shortcode:
    // This simple regex matches :word_with_underscores:
    const regex = /(:[a-zA-Z0-9_]+:)/g;

    // Check if message is ONLY emojis (and whitespace)
    const isJumbo = text.replace(regex, '').trim() === '';

    const parts = text.split(regex);

    return parts.map((part, index) => {
        // If part matches regex
        if (regex.test(part)) {
            // Check native
            if (STANDARD_EMOJIS[part]) {
                const className = `emoji ${isJumbo ? 'emoji-jumbo' : ''}`;
                return <span key={index} className={className}>{STANDARD_EMOJIS[part]}</span>;
            }
            // Check custom
            if (customEmojis[part]) {
                const url = import.meta.env.VITE_API_URL ?
                    (import.meta.env.VITE_API_URL + customEmojis[part]) :
                    customEmojis[part];

                return (
                    <img
                        key={index}
                        src={url}
                        alt={part}
                        className={`emoji-custom ${isJumbo ? 'emoji-jumbo' : ''}`}
                        title={part}
                        onClick={() => onEmojiClick && onEmojiClick(url)}
                        style={{ cursor: 'pointer' }}
                    />
                );
            }
        }
        return part;
    });
};

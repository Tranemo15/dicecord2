# Channel Creation - Duplicate Name Handling

## Issue
When trying to create a channel with a name that already exists, the database throws:
```
SQLITE_CONSTRAINT: UNIQUE constraint failed: channels.name
```

## Why This Happens
The `channels` table has a UNIQUE constraint on the `name` column to prevent duplicate channel names. This is good database design, but the error message wasn't user-friendly.

## Fixes Applied

### 1. Server-Side Improvement (server/index.js)
**Better Error Messages:**
- Added specific error handling for UNIQUE constraint violations
- Now returns: `Channel "channel-name" already exists` instead of the raw SQLite error
- Added validation for empty channel names after sanitization

**Code:**
```javascript
catch (err) {
    // Check for UNIQUE constraint error
    if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key')) {
        return res.status(400).json({ error: `Channel "${safeName}" already exists` });
    }
    res.status(500).json({ error: err.message });
}
```

### 2. Client-Side Prevention (client/src/pages/Chat.jsx)
**Proactive Duplicate Detection:**
- Added client-side check before making the API call
- Normalizes the channel name the same way the server does
- Checks against existing channels list
- Provides immediate feedback without making a network request

**Code:**
```javascript
// Normalize the name the same way the server does
const safeName = newChannelName.toLowerCase().replace(/[^a-z0-9-]/g, '');

// Check if channel already exists
if (channels.some(ch => ch.name === safeName)) {
    alert(`Channel "${safeName}" already exists!`);
    setNewChannelName('');
    setIsCreatingChannel(false);
    return;
}
```

## Channel Name Rules
Channels are automatically sanitized:
- Converted to lowercase
- Only alphanumeric characters and dashes allowed
- Special characters and spaces are removed

**Examples:**
- `"General Chat"` → `"generalchat"`
- `"Random-Stuff!"` → `"random-stuff"`
- `"Dev-Team-2024"` → `"dev-team-2024"`

## User Experience
**Before:**
- User enters duplicate name → API call → Database error → Confusing error message

**After:**
- User enters duplicate name → Instant feedback → Clear message → No wasted API call
- If somehow a duplicate still gets through → User-friendly error message from server

## Testing
To test, try creating channels with these names:
1. Create a channel called "test"
2. Try to create another channel called "test" → Should see immediate alert
3. Try "Test" or "TEST" → Should also be caught (normalized to "test")
4. Try "T@e#s$t!" → Should be caught as "test"

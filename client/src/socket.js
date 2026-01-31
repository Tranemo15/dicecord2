import { io } from 'socket.io-client';

// Change this URL if deployed
const URL = import.meta.env.VITE_API_URL || undefined;

export const socket = io(URL, {
    autoConnect: false
});

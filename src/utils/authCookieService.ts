// Simple cookie utility for authentication
// Get a cookie by name
export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// Set a cookie
export function setCookie(name: string, value: string, expiresAfterHours: number = 2) {
    const expires = new Date();
    expires.setHours(expires.getHours() + expiresAfterHours);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Remove a cookie
export function removeCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Image URL Utility
 * Constructs proper image URLs for local network deployment
 * 
 * Backend serves images at: http://SERVER_IP:3000/uploads/...
 * This utility ensures images work on both server PC and client PCs
 */

/**
 * Get the base URL for API and file serving
 * Removes /api suffix if present since images are served at root level
 */
function getBaseUrl() {
  // If VITE_API_URL is explicitly set, use it
  let apiUrl;
  if (import.meta.env.VITE_API_URL) {
    apiUrl = import.meta.env.VITE_API_URL;
  } else {
    // Use the current hostname and protocol from the browser
    // In production (behind Nginx), images are served at the same domain (via Nginx proxy)
    // In development (localhost), use port 3000 for backend
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development - backend runs on port 3000
      apiUrl = `${protocol}//${hostname}:3000/api`;
    } else {
      // Check if we're being served from a subdirectory (e.g., /d)
      const pathname = window.location.pathname;
      if (pathname.startsWith('/d')) {
        // If served from /d, use /d/api
        apiUrl = `${protocol}//${hostname}/d/api`;
      } else {
        // Production - Nginx proxies /uploads, so use same hostname (no port needed)
        apiUrl = `${protocol}//${hostname}/api`;
      }
    }
  }
  
  // Remove /api suffix if present (images are served at /uploads, not /api/uploads)
  if (apiUrl.endsWith('/api')) {
    return apiUrl.replace('/api', '');
  }
  
  // If no /api, assume it's already the base URL
  return apiUrl;
}

/**
 * Construct a full image URL from a file path
 * @param {string} filePath - Path from backend (e.g., "uploads/patient-gallery/image.jpg" or "/uploads/..." or Windows path)
 * @returns {string} Full URL (e.g., "http://192.168.1.100:3000/uploads/patient-gallery/image.jpg")
 */
export function getImageUrl(filePath) {
  if (!filePath) {
    console.warn('[getImageUrl] Empty filePath provided');
    return '';
  }

  // If already a full URL, check if it contains localhost:3000 and fix it
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // If URL contains localhost:3000, replace it with the current hostname
    if (filePath.includes('localhost:3000') || filePath.includes('127.0.0.1:3000')) {
      const url = new URL(filePath);
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // Extract the path from the URL
      const path = url.pathname;
      
      // Reconstruct URL with current hostname (no port for production, use Nginx)
      let baseUrl;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        baseUrl = `${protocol}//${hostname}:3000`;
      } else {
        // Check if we're being served from /d subdirectory
        const pathname = window.location.pathname;
        if (pathname.startsWith('/d')) {
          baseUrl = `${protocol}//${hostname}/d`;
        } else {
          baseUrl = `${protocol}//${hostname}`;
        }
      }
      
      const finalUrl = `${baseUrl}${path}`;
      console.debug('[getImageUrl] Fixed localhost URL:', { original: filePath, finalUrl });
      return finalUrl;
    }
    // Otherwise return as is
    return filePath;
  }

  // Normalize Windows paths (replace backslashes with forward slashes)
  let normalizedPath = filePath.replace(/\\/g, '/');

  // Remove leading slash if present
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }

  // The backend serves files from /uploads route, so the path should start with "uploads/"
  // If it doesn't, add it. If it does, keep it.
  if (!normalizedPath.startsWith('uploads/')) {
    normalizedPath = `uploads/${normalizedPath}`;
  }

  // Construct full URL - ensure no double slashes
  const baseUrl = getBaseUrl().replace(/\/$/, ''); // Remove trailing slash if present
  const finalUrl = `${baseUrl}/${normalizedPath}`;
  
  console.debug('[getImageUrl]', { original: filePath, normalized: normalizedPath, finalUrl });
  return finalUrl;
}

/**
 * Get API base URL (for API calls)
 */
export function getApiUrl() {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Otherwise, use the current hostname (works for localhost and network access)
  // Backend runs on port 3000
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // Check if we're being served from a subdirectory (e.g., /d)
  const pathname = window.location.pathname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && pathname.startsWith('/d')) {
    // If served from /d, use /d/api
    return `${protocol}//${hostname}/d/api`;
  }
  
  // Local development or root path
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3000/api`;
  }
  
  return `${protocol}//${hostname}/api`;
}

/**
 * Get server base URL (for file serving, without /api)
 */
export function getServerUrl() {
  return getBaseUrl();
}

export default {
  getImageUrl,
  getApiUrl,
  getServerUrl
};


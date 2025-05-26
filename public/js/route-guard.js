// Route guard for protecting pages
import { Auth } from 'aws-amplify';

// List of allowed public pages that don't require authentication
const PUBLIC_PAGES = [
    '/public/index.html',
    '/public/login.html'
];

// List of allowed authenticated pages
const AUTHENTICATED_PAGES = [
    '/app/updated_dashboard.html'
];

// Check if the current path is allowed
function isAllowedPath(path) {
    const normalizedPath = path.toLowerCase();
    return [...PUBLIC_PAGES, ...AUTHENTICATED_PAGES].some(allowedPath => 
        normalizedPath === allowedPath.toLowerCase() || 
        normalizedPath.startsWith(allowedPath.toLowerCase())
    );
}

// Check if the current path requires authentication
function requiresAuth(path) {
    const normalizedPath = path.toLowerCase();
    return AUTHENTICATED_PAGES.some(authPath => 
        normalizedPath === authPath.toLowerCase() || 
        normalizedPath.startsWith(authPath.toLowerCase())
    );
}

// Initialize route protection
async function initializeRouteGuard() {
    const currentPath = window.location.pathname;
    
    // If the path is not allowed, redirect to index
    if (!isAllowedPath(currentPath)) {
        window.location.href = '/index.html';
        return;
    }

    // If the path requires auth, check authentication
    if (requiresAuth(currentPath)) {
        try {
            await Auth.currentAuthenticatedUser();
        } catch (error) {
            // Not authenticated, redirect to login
            window.location.href = '/login.html';
        }
    }
}

// Export the route guard functions
export {
    initializeRouteGuard,
    isAllowedPath,
    requiresAuth
}; 
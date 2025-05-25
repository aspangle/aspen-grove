// Import AWS Amplify
import { Auth } from 'aws-amplify';
import awsconfig from './aws-exports.js';

// Configure Amplify
Auth.configure(awsconfig);

// Authentication state
let currentUser = null;

// Check if user is authenticated
async function checkAuth() {
    try {
        const user = await Auth.currentAuthenticatedUser();
        currentUser = user;
        return true;
    } catch (error) {
        currentUser = null;
        return false;
    }
}

// Sign in user
async function signIn(email, password) {
    try {
        const user = await Auth.signIn(email, password);
        currentUser = user;
        return { success: true, user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to sign in'
        };
    }
}

// Sign up new user
async function signUp(email, password, attributes) {
    try {
        const { user } = await Auth.signUp({
            username: email,
            password,
            attributes: {
                email,
                ...attributes
            }
        });
        return { success: true, user };
    } catch (error) {
        console.error('Sign up error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to create account'
        };
    }
}

// Confirm sign up (email verification)
async function confirmSignUp(email, code) {
    try {
        await Auth.confirmSignUp(email, code);
        return { success: true };
    } catch (error) {
        console.error('Confirm sign up error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to verify account'
        };
    }
}

// Sign out
async function signOut() {
    try {
        await Auth.signOut();
        currentUser = null;
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to sign out'
        };
    }
}

// Forgot password
async function forgotPassword(email) {
    try {
        await Auth.forgotPassword(email);
        return { success: true };
    } catch (error) {
        console.error('Forgot password error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to send reset code'
        };
    }
}

// Reset password
async function resetPassword(email, code, newPassword) {
    try {
        await Auth.forgotPasswordSubmit(email, code, newPassword);
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to reset password'
        };
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Get user attributes
async function getUserAttributes() {
    try {
        const user = await Auth.currentAuthenticatedUser();
        const attributes = await Auth.userAttributes(user);
        return { success: true, attributes };
    } catch (error) {
        console.error('Get attributes error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to get user attributes'
        };
    }
}

// Update user attributes
async function updateUserAttributes(attributes) {
    try {
        const user = await Auth.currentAuthenticatedUser();
        await Auth.updateUserAttributes(user, attributes);
        return { success: true };
    } catch (error) {
        console.error('Update attributes error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to update attributes'
        };
    }
}

// Export all functions
export {
    checkAuth,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    getUserAttributes,
    updateUserAttributes
}; 
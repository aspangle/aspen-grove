// auth.js - Authentication and user management
import { Auth } from 'aws-amplify';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    async initialize() {
        try {
            await this.checkAuthState();
            this.setupAuthListeners();
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.redirectToLogin();
        }
    }

    async checkAuthState() {
        try {
            const user = await Auth.currentAuthenticatedUser();
            this.currentUser = user;
            this.isAuthenticated = true;
            this.updateUIForUser(user);
        } catch (error) {
            console.log('No authenticated user:', error);
            this.redirectToLogin();
        }
    }

    setupAuthListeners() {
        Auth.currentAuthenticatedUser()
            .then(user => {
                this.currentUser = user;
                this.isAuthenticated = true;
                this.updateUIForUser(user);
            })
            .catch(() => {
                this.redirectToLogin();
            });
    }

    updateUIForUser(user) {
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');
        
        if (userNameElement) {
            userNameElement.textContent = user.attributes.name || user.username;
        }
        
        if (userRoleElement) {
            // You might want to get this from user attributes or a separate API call
            userRoleElement.textContent = 'Administrator';
        }
    }

    async signOut() {
        try {
            await Auth.signOut();
            this.currentUser = null;
            this.isAuthenticated = false;
            this.redirectToLogin();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '/public/login.html';
    }

    async getCurrentUser() {
        if (!this.currentUser) {
            try {
                this.currentUser = await Auth.currentAuthenticatedUser();
            } catch (error) {
                console.error('Error getting current user:', error);
                return null;
            }
        }
        return this.currentUser;
    }

    async getUserAttributes() {
        const user = await this.getCurrentUser();
        if (user) {
            return user.attributes;
        }
        return null;
    }
}

export const authManager = new AuthManager();

function handleSignOut() {
    Auth.signOut()
        .then(() => {
            window.location.href = '/public/login.html';
        })
        .catch(error => {
            console.error('Error signing out:', error);
        });
}

function handleSignIn(username, password) {
    Auth.signIn(username, password)
        .then(user => {
            window.location.href = '/app/updated_dashboard.html';
        })
        .catch(error => {
            console.error('Error signing in:', error);
            // Handle error appropriately
        });
} 
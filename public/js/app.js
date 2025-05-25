// app.js - Main application initialization
import { Amplify } from 'aws-amplify';
import { authManager } from './auth.js';
import { caseManager } from './cases.js';
import { uploadManager } from './upload.js';
import { reportManager } from './reports.js';
import { uiManager } from './ui.js';

class App {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize AWS Amplify
            await this.initializeAmplify();
            
            // Initialize authentication
            await authManager.initialize();
            
            // Initialize UI
            uiManager.initialize();
            
            // Initialize case management
            await caseManager.initialize();
            
            // Initialize file upload
            uploadManager.initialize();
            
            // Initialize report generation
            reportManager.initialize();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            this.initialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            uiManager.showError('Failed to initialize application');
        }
    }

    async initializeAmplify() {
        try {
            // Load AWS configuration
            const awsConfig = await fetch('/aws-exports.js').then(response => response.text());
            const config = this.parseAwsConfig(awsConfig);
            
            // Configure Amplify
            Amplify.configure(config);
            
            console.log('AWS Amplify configured successfully');
        } catch (error) {
            console.error('Failed to initialize AWS Amplify:', error);
            throw error;
        }
    }

    parseAwsConfig(configText) {
        // Extract the configuration object from the aws-exports.js file
        const match = configText.match(/const awsmobile = ({[\s\S]*?});/);
        if (!match) {
            throw new Error('Invalid AWS configuration format');
        }
        
        try {
            return JSON.parse(match[1]);
        } catch (error) {
            console.error('Failed to parse AWS configuration:', error);
            throw error;
        }
    }

    setupGlobalEventListeners() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 250);
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N for new case
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                caseManager.showNewCasePanel();
            }
            
            // Ctrl/Cmd + F for filter
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                uiManager.showFilterPanel();
            }
            
            // Escape key to close modals/panels
            if (e.key === 'Escape') {
                const newCasePanel = document.getElementById('newCasePanel');
                if (newCasePanel && newCasePanel.classList.contains('active')) {
                    caseManager.hideNewCasePanel();
                }
            }
        });
    }

    handleWindowResize() {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        
        // Handle mobile menu
        if (window.innerWidth <= 768) {
            if (sidebar && !sidebar.classList.contains('active')) {
                sidebar.classList.add('collapsed');
            }
            if (menuToggle) {
                menuToggle.style.display = 'block';
            }
        } else {
            if (sidebar) {
                sidebar.classList.remove('collapsed', 'active');
            }
            if (menuToggle) {
                menuToggle.style.display = 'none';
            }
        }
    }

    hasUnsavedChanges() {
        // Check if there are any unsaved changes in forms
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            if (form.dataset.modified === 'true') {
                return true;
            }
        }
        
        // Check if there are any unsaved files
        const fileLists = document.querySelectorAll('.file-list');
        for (const list of fileLists) {
            if (list.children.length > 0) {
                return true;
            }
        }
        
        return false;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize().catch(error => {
        console.error('Failed to start application:', error);
        uiManager.showError('Failed to start application. Please refresh the page.');
    });
}); 
// ui.js - UI utilities and helpers
class UIManager {
    constructor() {
        this.loadingElements = new Map();
        this.notificationTimeout = null;
    }

    initialize() {
        this.setupMobileMenu();
        this.setupSectionNavigation();
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });

            // Close sidebar on outside click
            document.addEventListener('click', (event) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(event.target) && 
                    !menuToggle.contains(event.target) &&
                    sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }

    setupSectionNavigation() {
        const menuLinks = document.querySelectorAll('.menu-link');
        const sections = {
            dashboard: document.getElementById('dashboardSection'),
            cases: document.getElementById('casesSection'),
            documents: document.getElementById('documentsSection'),
            reports: document.getElementById('reportsSection')
        };

        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = link.getAttribute('data-section');
                
                // Update active states
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update header title
                const titles = {
                    dashboard: 'Dashboard',
                    cases: 'Cases Management',
                    documents: 'Documents',
                    reports: 'Reports'
                };
                const headerTitle = document.querySelector('.header-title');
                if (headerTitle) {
                    headerTitle.textContent = titles[sectionName] || 'Dashboard';
                }
                
                // Show/hide sections
                Object.entries(sections).forEach(([name, section]) => {
                    if (section) {
                        section.style.display = name === sectionName ? 'block' : 'none';
                    }
                });
            });
        });
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('loading');
            this.loadingElements.set(elementId, element);
        }
    }

    hideLoading(elementId) {
        const element = this.loadingElements.get(elementId);
        if (element) {
            element.classList.remove('loading');
            this.loadingElements.delete(elementId);
        }
    }

    showNotification(message, type = 'info') {
        // Clear any existing notification
        this.clearNotification();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    clearNotification() {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'exclamation-circle';
            case 'warning':
                return 'exclamation-triangle';
            default:
                return 'info-circle';
        }
    }

    showModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${options.title || ''}</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `
                    <div class="modal-footer">
                        ${options.footer}
                    </div>
                ` : ''}
            </div>
        `;

        // Add to page
        document.body.appendChild(modal);

        // Setup close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
            }
        });

        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);

        return modal;
    }

    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }

    showConfirmDialog(message, onConfirm, onCancel) {
        const content = `
            <p>${message}</p>
            <div class="confirm-dialog-buttons">
                <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button class="btn btn-primary" data-action="confirm">Confirm</button>
            </div>
        `;

        const modal = this.showModal(content, {
            title: 'Confirm Action',
            footer: false
        });

        // Setup button handlers
        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            this.closeModal(modal);
            if (onConfirm) onConfirm();
        });

        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.closeModal(modal);
            if (onCancel) onCancel();
        });
    }

    showFilterPanel() {
        const content = `
            <form id="filterForm" class="filter-form">
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="status" value="new"> New
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="status" value="processing"> Processing
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="status" value="completed"> Completed
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Attorney Firm</label>
                    <select name="attorneyFirm" class="form-select">
                        <option value="">All Firms</option>
                        <option value="Bergmann & Moore">Bergmann & Moore</option>
                        <option value="CCK">CCK</option>
                        <option value="ProVetLegal">ProVetLegal</option>
                        <option value="H&P">Hill & Ponton (H&P)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Date Range</label>
                    <div class="date-range">
                        <input type="date" name="dateFrom" class="form-input">
                        <span>to</span>
                        <input type="date" name="dateTo" class="form-input">
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" data-action="reset">Reset</button>
            <button class="btn btn-primary" data-action="apply">Apply Filters</button>
        `;

        const modal = this.showModal(content, {
            title: 'Filter Cases',
            footer
        });

        // Setup button handlers
        modal.querySelector('[data-action="apply"]').addEventListener('click', () => {
            const formData = new FormData(modal.querySelector('#filterForm'));
            const filters = Object.fromEntries(formData.entries());
            this.closeModal(modal);
            // TODO: Apply filters
            console.log('Apply filters:', filters);
        });

        modal.querySelector('[data-action="reset"]').addEventListener('click', () => {
            modal.querySelector('#filterForm').reset();
        });
    }
}

export const uiManager = new UIManager(); 
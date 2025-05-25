// cases.js - Case management functionality
import { API, graphqlOperation } from 'aws-amplify';
import { authManager } from './auth.js';
import { uiManager } from './ui.js';

class CaseManager {
    constructor() {
        this.cases = [];
        this.currentCase = null;
    }

    async initialize() {
        await this.loadCases();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New case form submission
        const newCaseForm = document.getElementById('caseDetailsForm');
        if (newCaseForm) {
            newCaseForm.addEventListener('submit', (e) => this.handleNewCaseSubmit(e));
        }

        // Case action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) {
                const action = e.target.closest('.action-btn').dataset.action;
                const caseId = e.target.closest('.case-card').dataset.caseId;
                this.handleCaseAction(action, caseId);
            }
        });

        // Filter button
        const filterBtn = document.querySelector('.btn-secondary');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.showFilterPanel());
        }
    }

    async loadCases() {
        try {
            uiManager.showLoading('casesList');
            // TODO: Replace with actual API call
            const response = await this.fetchCases();
            this.cases = response.data.listCases.items;
            this.renderCases();
        } catch (error) {
            console.error('Error loading cases:', error);
            uiManager.showError('Failed to load cases');
        } finally {
            uiManager.hideLoading('casesList');
        }
    }

    async fetchCases() {
        // TODO: Replace with actual GraphQL query
        const query = `
            query ListCases {
                listCases {
                    items {
                        id
                        title
                        status
                        attorneyFirm
                        reportType
                        createdAt
                        updatedAt
                        dueDate
                    }
                }
            }
        `;
        
        return await API.graphql(graphqlOperation(query));
    }

    renderCases() {
        const casesList = document.getElementById('casesList');
        if (!casesList) return;

        casesList.innerHTML = this.cases.map(caseItem => this.createCaseCard(caseItem)).join('');
        this.updateCaseCount();
    }

    createCaseCard(caseItem) {
        const statusClass = `status-${caseItem.status.toLowerCase()}`;
        const statusText = caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1);
        
        return `
            <div class="case-card" data-case-id="${caseItem.id}">
                <div class="case-header">
                    <h3 class="case-title">${caseItem.title}</h3>
                    <span class="case-status ${statusClass}">${statusText}</span>
                </div>
                <div class="case-details">
                    <div class="case-detail-item">
                        <i class="fas fa-building"></i>
                        <span>${caseItem.attorneyFirm}</span>
                    </div>
                    <div class="case-detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>Created: ${new Date(caseItem.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="case-detail-item">
                        <i class="fas fa-clock"></i>
                        <span>Due: ${new Date(caseItem.dueDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="case-actions">
                    ${this.getCaseActionButtons(caseItem)}
                </div>
            </div>
        `;
    }

    getCaseActionButtons(caseItem) {
        const actions = [];
        
        switch (caseItem.status.toLowerCase()) {
            case 'new':
                actions.push(
                    '<button class="btn btn-secondary action-btn" data-action="start">' +
                    '<i class="fas fa-play"></i> Start</button>',
                    '<button class="btn btn-primary action-btn" data-action="edit">' +
                    '<i class="fas fa-edit"></i> Edit</button>'
                );
                break;
            case 'processing':
                actions.push(
                    '<button class="btn btn-secondary action-btn" data-action="view">' +
                    '<i class="fas fa-eye"></i> View</button>',
                    '<button class="btn btn-primary action-btn" data-action="edit">' +
                    '<i class="fas fa-edit"></i> Edit</button>'
                );
                break;
            case 'completed':
                actions.push(
                    '<button class="btn btn-secondary action-btn" data-action="download">' +
                    '<i class="fas fa-download"></i> Download</button>',
                    '<button class="btn btn-primary action-btn" data-action="share">' +
                    '<i class="fas fa-share"></i> Share</button>'
                );
                break;
        }
        
        return actions.join('');
    }

    async handleNewCaseSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const caseData = {
                title: `${formData.get('firstName')} ${formData.get('lastName')} - ${formData.get('reportType')}`,
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                attorneyFirm: formData.get('attorneyFirm'),
                reportType: formData.get('reportType'),
                serviceFromDate: formData.get('serviceFromDate'),
                serviceToDate: formData.get('serviceToDate'),
                caseNotes: formData.get('caseNotes'),
                status: 'new',
                createdAt: new Date().toISOString(),
                dueDate: this.calculateDueDate()
            };

            // TODO: Replace with actual API call
            await this.createCase(caseData);
            
            uiManager.showNotification('Case created successfully', 'success');
            this.hideNewCasePanel();
            await this.loadCases();
        } catch (error) {
            console.error('Error creating case:', error);
            uiManager.showError('Failed to create case');
        }
    }

    async createCase(caseData) {
        // TODO: Replace with actual GraphQL mutation
        const mutation = `
            mutation CreateCase($input: CreateCaseInput!) {
                createCase(input: $input) {
                    id
                    title
                    status
                    createdAt
                }
            }
        `;
        
        return await API.graphql(graphqlOperation(mutation, { input: caseData }));
    }

    calculateDueDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7); // Due in 7 days
        return date.toISOString();
    }

    async handleCaseAction(action, caseId) {
        const caseItem = this.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        try {
            switch (action) {
                case 'start':
                    await this.startCase(caseId);
                    break;
                case 'edit':
                    this.editCase(caseId);
                    break;
                case 'view':
                    this.viewCase(caseId);
                    break;
                case 'download':
                    await this.downloadCase(caseId);
                    break;
                case 'share':
                    this.shareCase(caseId);
                    break;
            }
        } catch (error) {
            console.error(`Error handling case action ${action}:`, error);
            uiManager.showError(`Failed to ${action} case`);
        }
    }

    async startCase(caseId) {
        // TODO: Implement case start logic
        await this.updateCaseStatus(caseId, 'processing');
        await this.loadCases();
    }

    editCase(caseId) {
        // TODO: Implement case edit logic
        console.log('Edit case:', caseId);
    }

    viewCase(caseId) {
        // TODO: Implement case view logic
        console.log('View case:', caseId);
    }

    async downloadCase(caseId) {
        // TODO: Implement case download logic
        console.log('Download case:', caseId);
    }

    shareCase(caseId) {
        // TODO: Implement case sharing logic
        console.log('Share case:', caseId);
    }

    async updateCaseStatus(caseId, status) {
        // TODO: Replace with actual API call
        const mutation = `
            mutation UpdateCaseStatus($input: UpdateCaseInput!) {
                updateCase(input: $input) {
                    id
                    status
                }
            }
        `;
        
        await API.graphql(graphqlOperation(mutation, {
            input: { id: caseId, status }
        }));
    }

    showFilterPanel() {
        // TODO: Implement filter panel
        console.log('Show filter panel');
    }

    updateCaseCount() {
        const casesCount = document.getElementById('casesCount');
        if (casesCount) {
            casesCount.textContent = this.cases.length;
        }
    }

    showNewCasePanel() {
        const panel = document.getElementById('newCasePanel');
        if (panel) {
            panel.classList.add('active');
            this.resetNewCaseForm();
        }
    }

    hideNewCasePanel() {
        const panel = document.getElementById('newCasePanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    resetNewCaseForm() {
        const form = document.getElementById('caseDetailsForm');
        if (form) {
            form.reset();
        }
        
        // Clear file lists
        document.querySelectorAll('.file-list').forEach(list => list.innerHTML = '');
        document.querySelectorAll('.upload-zone').forEach(zone => zone.classList.remove('has-files'));
        
        // Reset auto-fill indicators
        document.querySelectorAll('.auto-fill-icon').forEach(icon => icon.style.display = 'none');
        document.querySelectorAll('.form-input, .form-select').forEach(input => input.classList.remove('auto-filled'));
    }
}

export const caseManager = new CaseManager(); 
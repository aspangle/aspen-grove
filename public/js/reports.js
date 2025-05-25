// reports.js - Report generation and management
import { API, graphqlOperation } from 'aws-amplify';
import { uiManager } from './ui.js';

class ReportManager {
    constructor() {
        this.currentReport = null;
        this.generationStatus = null;
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateReport());
        }

        // Report preview actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="preview-report"]')) {
                this.previewReport();
            } else if (e.target.closest('[data-action="download-report"]')) {
                this.downloadReport();
            } else if (e.target.closest('[data-action="share-report"]')) {
                this.shareReport();
            }
        });
    }

    async generateReport() {
        const generateBtn = document.getElementById('generateReportBtn');
        const reportPreview = document.getElementById('reportPreview');
        
        try {
            // Show loading state
            generateBtn.classList.add('loading');
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generateBtn.disabled = true;
            
            // Get form data
            const formData = new FormData(document.getElementById('caseDetailsForm'));
            const caseData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                attorneyFirm: formData.get('attorneyFirm'),
                reportType: formData.get('reportType'),
                serviceFromDate: formData.get('serviceFromDate'),
                serviceToDate: formData.get('serviceToDate'),
                caseNotes: formData.get('caseNotes')
            };

            // TODO: Replace with actual API call
            const report = await this.createReport(caseData);
            this.currentReport = report;
            
            // Show report preview
            this.showReportPreview(report);
            
            // Update case status
            await this.updateCaseStatus('completed');
            
            uiManager.showSuccess('Report generated successfully!');
        } catch (error) {
            console.error('Error generating report:', error);
            uiManager.showError('Failed to generate report');
        } finally {
            // Reset button state
            generateBtn.classList.remove('loading');
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Report';
            generateBtn.disabled = false;
        }
    }

    async createReport(caseData) {
        // TODO: Replace with actual GraphQL mutation
        const mutation = `
            mutation GenerateReport($input: GenerateReportInput!) {
                generateReport(input: $input) {
                    id
                    title
                    status
                    createdAt
                    downloadUrl
                }
            }
        `;
        
        const response = await API.graphql(graphqlOperation(mutation, {
            input: {
                ...caseData,
                type: caseData.reportType
            }
        }));
        
        return response.data.generateReport;
    }

    showReportPreview(report) {
        const reportPreview = document.getElementById('reportPreview');
        if (!reportPreview) return;

        reportPreview.style.display = 'block';
        reportPreview.querySelector('.preview-content').innerHTML = `
            <h4>${report.title}</h4>
            <p><strong>Generated:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${report.status}</p>
            <div class="preview-actions">
                <button class="btn btn-secondary" data-action="preview-report">
                    <i class="fas fa-eye"></i> Preview
                </button>
                <button class="btn btn-primary" data-action="download-report">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-secondary" data-action="share-report">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        `;
    }

    async previewReport() {
        if (!this.currentReport) return;

        try {
            uiManager.showLoading('reportPreview');
            
            // TODO: Replace with actual API call
            const previewUrl = await this.getReportPreviewUrl(this.currentReport.id);
            
            // Show preview in modal
            const content = `
                <div class="report-preview-container">
                    <iframe src="${previewUrl}" frameborder="0"></iframe>
                </div>
            `;
            
            uiManager.showModal(content, {
                title: 'Report Preview',
                footer: `
                    <button class="btn btn-primary" data-action="download-report">
                        <i class="fas fa-download"></i> Download
                    </button>
                `
            });
        } catch (error) {
            console.error('Error previewing report:', error);
            uiManager.showError('Failed to preview report');
        } finally {
            uiManager.hideLoading('reportPreview');
        }
    }

    async downloadReport() {
        if (!this.currentReport) return;

        try {
            uiManager.showLoading('reportPreview');
            
            // TODO: Replace with actual API call
            const downloadUrl = await this.getReportDownloadUrl(this.currentReport.id);
            
            // Trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${this.currentReport.title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            uiManager.showSuccess('Report downloaded successfully');
        } catch (error) {
            console.error('Error downloading report:', error);
            uiManager.showError('Failed to download report');
        } finally {
            uiManager.hideLoading('reportPreview');
        }
    }

    async shareReport() {
        if (!this.currentReport) return;

        const content = `
            <form id="shareReportForm" class="share-form">
                <div class="form-group">
                    <label class="form-label">Share with</label>
                    <input type="email" name="email" class="form-input" placeholder="Enter email address" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Message (optional)</label>
                    <textarea name="message" class="form-textarea" rows="3" 
                        placeholder="Add a message to your email..."></textarea>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button class="btn btn-primary" data-action="send">Send</button>
        `;

        const modal = uiManager.showModal(content, {
            title: 'Share Report',
            footer
        });

        // Setup button handlers
        modal.querySelector('[data-action="send"]').addEventListener('click', async () => {
            const formData = new FormData(modal.querySelector('#shareReportForm'));
            const shareData = {
                email: formData.get('email'),
                message: formData.get('message')
            };

            try {
                uiManager.showLoading(modal);
                await this.shareReportWithUser(shareData);
                uiManager.closeModal(modal);
                uiManager.showSuccess('Report shared successfully');
            } catch (error) {
                console.error('Error sharing report:', error);
                uiManager.showError('Failed to share report');
            } finally {
                uiManager.hideLoading(modal);
            }
        });
    }

    async shareReportWithUser(shareData) {
        // TODO: Replace with actual API call
        const mutation = `
            mutation ShareReport($input: ShareReportInput!) {
                shareReport(input: $input) {
                    id
                    sharedWith
                    sharedAt
                }
            }
        `;
        
        return await API.graphql(graphqlOperation(mutation, {
            input: {
                reportId: this.currentReport.id,
                ...shareData
            }
        }));
    }

    async getReportPreviewUrl(reportId) {
        // TODO: Replace with actual API call
        const query = `
            query GetReportPreview($id: ID!) {
                getReport(id: $id) {
                    previewUrl
                }
            }
        `;
        
        const response = await API.graphql(graphqlOperation(query, { id: reportId }));
        return response.data.getReport.previewUrl;
    }

    async getReportDownloadUrl(reportId) {
        // TODO: Replace with actual API call
        const query = `
            query GetReportDownload($id: ID!) {
                getReport(id: $id) {
                    downloadUrl
                }
            }
        `;
        
        const response = await API.graphql(graphqlOperation(query, { id: reportId }));
        return response.data.getReport.downloadUrl;
    }

    async updateCaseStatus(status) {
        // TODO: Replace with actual API call
        const mutation = `
            mutation UpdateCaseStatus($input: UpdateCaseInput!) {
                updateCase(input: $input) {
                    id
                    status
                }
            }
        `;
        
        return await API.graphql(graphqlOperation(mutation, {
            input: {
                id: this.currentReport.caseId,
                status
            }
        }));
    }
}

export const reportManager = new ReportManager(); 
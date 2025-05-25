// upload.js - File upload handling
import { Storage } from 'aws-amplify';
import { uiManager } from './ui.js';

class UploadManager {
    constructor() {
        this.uploadZones = new Map();
        this.maxFileSizes = {
            request: 10 * 1024 * 1024, // 10MB
            interview: 10 * 1024 * 1024, // 10MB
            medical: 50 * 1024 * 1024 // 50MB
        };
        this.allowedTypes = ['.pdf', '.doc', '.docx'];
    }

    initialize() {
        this.setupUploadZones();
        this.setupDragAndDrop();
    }

    setupUploadZones() {
        const zones = {
            request: document.getElementById('requestUpload'),
            interview: document.getElementById('interviewUpload'),
            medical: document.getElementById('medicalUpload')
        };

        for (const [type, zone] of Object.entries(zones)) {
            if (zone) {
                this.uploadZones.set(type, {
                    element: zone,
                    fileInput: zone.querySelector('.file-input'),
                    fileList: zone.querySelector('.file-list')
                });

                // Click handler
                zone.addEventListener('click', () => {
                    const fileInput = zone.querySelector('.file-input');
                    if (fileInput) fileInput.click();
                });

                // File input change handler
                const fileInput = zone.querySelector('.file-input');
                if (fileInput) {
                    fileInput.addEventListener('change', (e) => this.handleFileSelect(e, type));
                }
            }
        }
    }

    setupDragAndDrop() {
        this.uploadZones.forEach((zone, type) => {
            const element = zone.element;
            
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                element.classList.add('dragover');
            });

            element.addEventListener('dragleave', (e) => {
                e.preventDefault();
                element.classList.remove('dragover');
            });

            element.addEventListener('drop', (e) => {
                e.preventDefault();
                element.classList.remove('dragover');
                this.handleFileDrop(e, type);
            });
        });
    }

    async handleFileSelect(event, type) {
        const files = event.target.files;
        if (files.length > 0) {
            await this.processFiles(Array.from(files), type);
        }
    }

    async handleFileDrop(event, type) {
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            await this.processFiles(Array.from(files), type);
        }
    }

    async processFiles(files, type) {
        const zone = this.uploadZones.get(type);
        if (!zone) return;

        const maxSize = this.maxFileSizes[type];
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        // Validate total size
        if (totalSize > maxSize) {
            uiManager.showError(`Total file size exceeds ${this.formatFileSize(maxSize)} limit`);
            return;
        }

        // Validate file types
        const invalidFiles = files.filter(file => !this.isValidFileType(file));
        if (invalidFiles.length > 0) {
            uiManager.showError(`Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`);
            return;
        }

        try {
            uiManager.showLoading(zone.element.id);
            
            for (const file of files) {
                await this.uploadFile(file, type);
                this.addFileToList(file, zone.fileList);
            }

            zone.element.classList.add('has-files');
            this.checkGenerateButtonState();
            
            // Simulate auto-fill for request documents
            if (type === 'request') {
                this.simulateAutoFill();
            }
        } catch (error) {
            console.error('Error processing files:', error);
            uiManager.showError('Failed to upload files');
        } finally {
            uiManager.hideLoading(zone.element.id);
        }
    }

    async uploadFile(file, type) {
        const key = `cases/${type}/${Date.now()}-${file.name}`;
        
        try {
            await Storage.put(key, file, {
                contentType: file.type,
                progressCallback: (progress) => {
                    this.updateUploadProgress(key, progress);
                }
            });

            return key;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    updateUploadProgress(key, progress) {
        const fileItem = document.querySelector(`[data-key="${key}"]`);
        if (fileItem) {
            const progressBar = fileItem.querySelector('.upload-progress');
            if (progressBar) {
                progressBar.style.width = `${progress.loaded / progress.total * 100}%`;
            }
        }
    }

    addFileToList(file, container) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
            <div class="upload-progress-container">
                <div class="upload-progress"></div>
            </div>
            <button class="remove-file" onclick="uploadManager.removeFile(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(fileItem);
    }

    removeFile(button) {
        const fileItem = button.closest('.file-item');
        const uploadZone = button.closest('.upload-zone');
        
        fileItem.remove();
        
        // Check if upload zone is empty
        const fileList = uploadZone.querySelector('.file-list');
        if (fileList.children.length === 0) {
            uploadZone.classList.remove('has-files');
        }
        
        this.checkGenerateButtonState();
    }

    isValidFileType(file) {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return this.allowedTypes.includes(extension);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    checkGenerateButtonState() {
        const generateBtn = document.getElementById('generateReportBtn');
        const reportStatus = document.getElementById('reportStatus');
        
        // Check if we have required files
        const hasRequest = this.uploadZones.get('request')?.fileList.children.length > 0;
        const hasInterview = this.uploadZones.get('interview')?.fileList.children.length > 0;
        
        if (hasRequest && hasInterview) {
            generateBtn.disabled = false;
            reportStatus.className = 'report-status status-ready';
            reportStatus.querySelector('.status-title').textContent = 'Ready to Generate';
            reportStatus.querySelector('.status-description').textContent = 'All required documents uploaded';
            reportStatus.querySelector('.status-icon i').className = 'fas fa-check-circle';
        } else {
            generateBtn.disabled = true;
            reportStatus.className = 'report-status status-pending';
            reportStatus.querySelector('.status-title').textContent = 'Waiting for Documents';
            reportStatus.querySelector('.status-description').textContent = 'Upload request letter and interview transcript';
            reportStatus.querySelector('.status-icon i').className = 'fas fa-clock';
        }
    }

    simulateAutoFill() {
        setTimeout(() => {
            // Auto-fill first name
            const firstNameInput = document.getElementById('firstName');
            const firstNameIcon = document.getElementById('firstNameAutoFill');
            if (firstNameInput && !firstNameInput.value) {
                firstNameInput.value = 'John';
                firstNameInput.classList.add('auto-filled');
                firstNameIcon.style.display = 'inline';
            }
            
            // Auto-fill last name
            const lastNameInput = document.getElementById('lastName');
            const lastNameIcon = document.getElementById('lastNameAutoFill');
            if (lastNameInput && !lastNameInput.value) {
                lastNameInput.value = 'Smith';
                lastNameInput.classList.add('auto-filled');
                lastNameIcon.style.display = 'inline';
            }
            
            // Auto-fill attorney firm
            const attorneyFirmSelect = document.getElementById('attorneyFirm');
            const attorneyFirmIcon = document.getElementById('attorneyFirmAutoFill');
            if (attorneyFirmSelect && !attorneyFirmSelect.value) {
                attorneyFirmSelect.value = 'Bergmann & Moore';
                attorneyFirmSelect.classList.add('auto-filled');
                attorneyFirmIcon.style.display = 'inline';
            }
        }, 1500);
    }
}

export const uploadManager = new UploadManager(); 
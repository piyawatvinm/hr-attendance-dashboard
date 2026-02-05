import { useState } from 'react';
import './FileUpload.css';

export default function FileUpload({ onFileProcessed, label, compact = false }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await processFile(files[0]);
        }
    };

    const handleFileSelect = async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            await processFile(files[0]);
        }
    };

    const processFile = async (file) => {
        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            setError('Please upload a valid Excel file (.xlsx or .xls)');
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            await onFileProcessed(file);
        } catch (err) {
            setError(err.message || 'Failed to process file. Please check the file format.');
        } finally {
            setIsProcessing(false);
        }
    };

    const inputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;

    // Compact mode for inline upload
    if (compact) {
        return (
            <div className="file-upload-compact">
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id={inputId}
                />
                <label htmlFor={inputId} className="btn btn-primary btn-sm">
                    {isProcessing ? 'Processing...' : (label || 'Choose File')}
                </label>
                {error && <span className="error-text">{error}</span>}
            </div>
        );
    }

    return (
        <div className="file-upload-container">
            <div
                className={`upload-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isProcessing ? (
                    <div className="upload-content">
                        <div className="spinner"></div>
                        <h3>Processing Excel file...</h3>
                        <p className="text-secondary">Please wait while we transform your data</p>
                    </div>
                ) : (
                    <div className="upload-content">
                        <div className="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <h3>{label || 'Upload Excel File'}</h3>
                        <p className="text-secondary">Drag and drop or click to browse</p>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            id={inputId}
                        />
                        <label htmlFor={inputId} className="btn btn-primary mt-2">
                            Choose File
                        </label>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message fade-in">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
}

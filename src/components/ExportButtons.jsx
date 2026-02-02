import { exportToCSV, exportToExcel, exportToJSON } from '../utils/exportUtils';
import './ExportButtons.css';

export default function ExportButtons({ employees, summary }) {
    const handleExport = (format) => {
        switch (format) {
            case 'csv':
                exportToCSV(employees);
                break;
            case 'excel':
                exportToExcel(employees);
                break;
            case 'json':
                exportToJSON(employees, summary);
                break;
            default:
                break;
        }
    };

    return (
        <div className="export-buttons">
            <h3>Export Data</h3>
            <div className="button-group">
                <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Export CSV
                </button>

                <button className="btn btn-secondary" onClick={() => handleExport('excel')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    Export Excel
                </button>

                <button className="btn btn-secondary" onClick={() => handleExport('json')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M10 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2" />
                        <path d="M14 12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2" />
                    </svg>
                    Export JSON
                </button>
            </div>
        </div>
    );
}

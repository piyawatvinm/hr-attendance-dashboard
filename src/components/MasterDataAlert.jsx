import './MasterDataAlert.css';

export default function MasterDataAlert({ onUpload }) {
    return (
        <div className="master-data-alert">
            <div className="alert-content">
                <span className="alert-icon">📢</span>
                <div className="alert-text">
                    <h3>Master Data Required</h3>
                    <p>
                        Upload Employee Master Data to unlock:
                        <strong> Plant/Division, Employee Type, Team, Cost Center, Category</strong> columns
                        and <strong>Department Summary, Category Breakdown, Compliance Analysis</strong>
                    </p>
                </div>
            </div>
            <button className="alert-upload-btn" onClick={onUpload}>
                📁 Upload Master Data
            </button>
        </div>
    );
}

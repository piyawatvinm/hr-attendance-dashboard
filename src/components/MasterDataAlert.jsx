import './MasterDataAlert.css';

export default function MasterDataAlert({ onUpload, isPunchFormat }) {
    return (
        <div className={`master-data-alert ${isPunchFormat ? 'punch-urgency' : ''}`}>
            <div className="alert-content">
                <span className="alert-icon">{isPunchFormat ? '⚠️' : '📢'}</span>
                <div className="alert-text">
                    <h3>
                        {isPunchFormat
                            ? 'Upload Master Data to Calculate OT Correctly'
                            : 'Master Data Required'}
                    </h3>
                    <p>
                        {isPunchFormat ? (
                            <>
                                ตรวจพบ <strong>Punch Log Format</strong> — ต้องการข้อมูล <strong>Plant (RTEC/Snack)</strong>{' '}
                                จาก Master Data เพื่อคำนวณ OT ตาม Shift Schedule ให้ถูกต้อง
                            </>
                        ) : (
                            <>
                                Upload Employee Master Data to unlock:
                                <strong> Plant/Division, Employee Type, Team, Cost Center, Category</strong> columns
                                and <strong>Department Summary, Category Breakdown, Compliance Analysis</strong>
                            </>
                        )}
                    </p>
                </div>
            </div>
            <button className="alert-upload-btn" onClick={onUpload}>
                📁 Upload Master Data
            </button>
        </div>
    );
}

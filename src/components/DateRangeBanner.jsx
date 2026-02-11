import './DateRangeBanner.css';

export default function DateRangeBanner({ dateRange }) {
    if (!dateRange || !dateRange.formatted.start) {
        return null;
    }

    return (
        <div className="date-range-banner">
            <span className="date-range-label">Period:</span>
            <span className="date-range-value">
                {dateRange.formatted.start} → {dateRange.formatted.end}
            </span>
            <span className="date-range-days">({dateRange.days} days)</span>
        </div>
    );
}

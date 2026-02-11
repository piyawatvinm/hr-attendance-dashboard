import { useState } from 'react';
import './ComplianceAlert.css';

export default function ComplianceAlert({ complianceStats }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!complianceStats || complianceStats.totalViolations === 0) {
        return (
            <div className="compliance-alert compliance-safe">
                <span className="compliance-icon">✅</span>
                <span className="compliance-message">
                    All employees are within the 60-hour weekly limit
                </span>
            </div>
        );
    }

    return (
        <div className="compliance-alert compliance-warning">
            <div className="compliance-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="compliance-title">
                    <span className="compliance-icon">⚠️</span>
                    <span className="compliance-message">
                        {complianceStats.totalViolations} employee{complianceStats.totalViolations > 1 ? 's' : ''} exceeded 60 hours
                    </span>
                </div>
                <button className="compliance-toggle">
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {isExpanded && (
                <div className="compliance-table-wrapper">
                    <table className="compliance-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Department</th>
                                <th>Count</th>
                                <th>Law (hrs)</th>
                                <th>Actual (hrs)</th>
                                <th>Over 60 (hrs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complianceStats.data.map((row, index) => (
                                <tr
                                    key={index}
                                    className={
                                        row.isGrandTotal ? 'grand-total' :
                                            row.isSubtotal ? 'subtotal' : 'data-row'
                                    }
                                >
                                    <td className="category-cell">
                                        {row.isSubtotal || row.isGrandTotal ? row.category : ''}
                                        {!row.isSubtotal && !row.isGrandTotal && row.category}
                                    </td>
                                    <td>{row.department}</td>
                                    <td className="number">{row.count}</td>
                                    <td className="number">{row.lawWorkingHours.toFixed(2)}</td>
                                    <td className="number">{row.totalActualWorkingHours.toFixed(2)}</td>
                                    <td className="number over-limit">({Math.abs(row.lawOver60).toFixed(2)})</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

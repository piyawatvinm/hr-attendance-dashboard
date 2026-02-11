import { useState } from 'react';
import SummaryCards from './SummaryCards';
import SummaryTable from './SummaryTable';
import DateRangeBanner from './DateRangeBanner';
import ComplianceAlert from './ComplianceAlert';
import CategoryBreakdown from './CategoryBreakdown';
import MasterDataAlert from './MasterDataAlert';
import EmployeeTable from './EmployeeTable';
import ExportButtons from './ExportButtons';
import './Dashboard.css';

export default function Dashboard({
    employees,
    summary,
    chartData,
    summaryRows,
    dateRange,
    categoryStats,
    complianceStats,
    onMasterDataUpload
}) {
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(true);
    const hasMasterData = summaryRows && summaryRows.length > 0;

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <span className="header-icon">📋</span>
                    <div className="header-text">
                        <h1>HR Time Attendance Dashboard</h1>
                        <div className="header-subtitle-row">
                            <p className="text-secondary">Eagle System Report Analysis</p>
                            {dateRange && <DateRangeBanner dateRange={dateRange} />}
                        </div>
                    </div>
                </div>
                <ExportButtons employees={employees} summary={summary} summaryRows={summaryRows} />
            </div>

            {/* Master Data Alert */}
            {!hasMasterData && onMasterDataUpload && (
                <MasterDataAlert onUpload={onMasterDataUpload} />
            )}

            {/* Section: Key Metrics */}
            <section className="dashboard-section">
                <div className="section-label">
                    <span className="section-icon">📊</span>
                    <span>Key Metrics Overview</span>
                </div>
                <SummaryCards summary={summary} />
            </section>

            {/* Section: Compliance Alert */}
            {complianceStats && hasMasterData && (
                <section className="dashboard-section">
                    <div className="section-label">
                        <span className="section-icon">⚠️</span>
                        <span>Compliance Status</span>
                        <span className="section-subtitle">Working Hours Limit Monitoring</span>
                    </div>
                    <ComplianceAlert complianceStats={complianceStats} />
                </section>
            )}

            {/* Section: Category Breakdown */}
            {categoryStats && categoryStats.length > 0 && hasMasterData && (
                <section className="dashboard-section">
                    <div className="section-label">
                        <span className="section-icon">📈</span>
                        <span>Working Hours & Overtime Analysis</span>
                        <span className="section-subtitle">By Category & Department</span>
                    </div>
                    <CategoryBreakdown categoryStats={categoryStats} />
                </section>
            )}

            {/* Section: Department Summary */}
            {summaryRows && summaryRows.length > 0 && (
                <section className="dashboard-section">
                    <div className="section-label">
                        <span className="section-icon">🏢</span>
                        <span>Department Summary</span>
                        <span className="section-subtitle">Overtime Breakdown by Department</span>
                    </div>
                    <SummaryTable summaryRows={summaryRows} />
                </section>
            )}

            {/* Section: Employee Details (Collapsible) */}
            <section className="dashboard-section">
                <div
                    className="section-label section-label-clickable"
                    onClick={() => setShowEmployeeDetails(!showEmployeeDetails)}
                >
                    <span className="section-icon">👥</span>
                    <span>Employee Details</span>
                    <span className="section-subtitle">Individual Attendance Records</span>
                    <span className="section-toggle">{showEmployeeDetails ? '▼' : '▶'}</span>
                </div>
                {showEmployeeDetails && <EmployeeTable employees={employees} />}
            </section>
        </div>
    );
}

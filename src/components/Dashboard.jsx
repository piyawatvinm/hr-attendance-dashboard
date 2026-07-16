import { useState } from 'react';
import SummaryCards from './SummaryCards';
import SummaryTable from './SummaryTable';
import DateRangeBanner from './DateRangeBanner';
import ComplianceAlert from './ComplianceAlert';
import CategoryBreakdown from './CategoryBreakdown';
import MasterDataAlert from './MasterDataAlert';
import EmployeeTable from './EmployeeTable';
import ExportButtons from './ExportButtons';
import DepartmentCompliance from './DepartmentCompliance';
import OTByEmployee from './Charts/OTByEmployee';
import OTByRate from './Charts/OTByRate';
import OTTrend from './Charts/OTTrend';
import { getDepartmentComplianceStats } from '../utils/dashboardUtils';
import './Dashboard.css';

export default function Dashboard({
    employees,
    summary,
    chartData,
    summaryRows,
    dateRange,
    categoryStats,
    complianceStats,
    fileFormat,
    onMasterDataUpload
}) {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'categories', 'employees'
    const hasMasterData = summaryRows && summaryRows.length > 0;
    const deptComplianceStats = hasMasterData ? getDepartmentComplianceStats(employees) : [];

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
                <MasterDataAlert onUpload={onMasterDataUpload} isPunchFormat={fileFormat === 'punch'} />
            )}

            {/* Dashboard Tabs Switcher */}
            {hasMasterData && (
                <div className="dashboard-tabs">
                    <button
                        className={`dashboard-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview & Compliance
                    </button>
                    <button
                        className={`dashboard-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        📈 Hours & Category Breakdown
                    </button>
                    <button
                        className={`dashboard-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
                        onClick={() => setActiveTab('employees')}
                    >
                        👥 Employee Directory
                    </button>
                </div>
            )}

            {/* Tab content rendering */}
            {hasMasterData && (
                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <>
                            {/* Section: Key Metrics */}
                            <section className="dashboard-section">
                                <div className="section-label">
                                    <span className="section-icon">📊</span>
                                    <span>Key Metrics Overview</span>
                                </div>
                                <SummaryCards summary={summary} />
                            </section>

                            {/* Section: Compliance Alert & Department Analysis */}
                            <section className="dashboard-section">
                                <div className="section-label">
                                    <span className="section-icon">⚠️</span>
                                    <span>Compliance & Headcount Status</span>
                                    <span className="section-subtitle">Working Hours Limit Monitoring and Headcount Analysis by Department</span>
                                </div>
                                <ComplianceAlert complianceStats={complianceStats} />
                                <DepartmentCompliance stats={deptComplianceStats} employees={employees} />
                            </section>
                        </>
                    )}

                    {activeTab === 'categories' && (
                        <>
                            {/* Section: Category Breakdown */}
                            {categoryStats && categoryStats.length > 0 && (
                                <section className="dashboard-section">
                                    <div className="section-label">
                                        <span className="section-icon">📈</span>
                                        <span>Working Hours & Overtime Analysis</span>
                                        <span className="section-subtitle">By Category & Department</span>
                                    </div>
                                    <CategoryBreakdown categoryStats={categoryStats} />
                                </section>
                            )}

                            {/* Section: Detailed Overtime Analysis */}
                            {chartData && (
                                <section className="dashboard-section">
                                    <div className="section-label">
                                        <span className="section-icon">📊</span>
                                        <span>Detailed Overtime Analysis</span>
                                        <span className="section-subtitle">Individual Rates, Top Performers, and Timeline Trends</span>
                                    </div>
                                    <div className="charts-grid">
                                        <div className="chart-card">
                                            <OTByRate data={chartData.otByRate} />
                                        </div>
                                        <div className="chart-card">
                                            <OTByEmployee data={chartData.otByEmployee} />
                                        </div>
                                        <div className="chart-card chart-card-wide">
                                            <OTTrend data={chartData.otTrend} />
                                        </div>
                                    </div>
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
                        </>
                    )}

                    {activeTab === 'employees' && (
                        <section className="dashboard-section">
                            <div className="section-label">
                                <span className="section-icon">👥</span>
                                <span>Employee Details</span>
                                <span className="section-subtitle">Individual Attendance Records</span>
                            </div>
                            <EmployeeTable employees={employees} />
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

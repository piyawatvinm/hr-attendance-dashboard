import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { parseExcelFile, extractStructuredData } from './utils/excelParser';
import { transformEmployeeData, calculateSummary, getChartData } from './utils/dataTransformer';
import { parseMasterDataFile } from './utils/masterDataParser';
import { mergeEmployeeData, createSummaryTable } from './utils/dataMerger';
import { getDateRange, getCategoryStats, getComplianceStats, countEmployeesOver60 } from './utils/dashboardUtils';
import './App.css';

function App() {
    const [data, setData] = useState(null);
    const [masterData, setMasterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileProcessed = async (file) => {
        setLoading(true);
        setError(null);

        try {
            // Parse Excel file
            const rawData = await parseExcelFile(file);

            // Extract structured data
            const employees = extractStructuredData(rawData);

            if (employees.length === 0) {
                throw new Error('No employee data found in the file');
            }

            // Transform data
            let transformedEmployees = transformEmployeeData(employees);

            // If we have master data, merge it
            if (masterData) {
                transformedEmployees = mergeEmployeeData(transformedEmployees, masterData);
            }

            // Calculate summary
            const summary = calculateSummary(transformedEmployees);
            summary.employeesOver60 = countEmployeesOver60(transformedEmployees);

            // Get chart data
            const chartData = getChartData(transformedEmployees);

            // Create summary table
            const summaryRows = masterData ? createSummaryTable(transformedEmployees) : [];

            // Get dashboard stats
            const dateRange = getDateRange(transformedEmployees);
            const categoryStats = getCategoryStats(transformedEmployees);
            const complianceStats = getComplianceStats(transformedEmployees);

            setData({
                employees: transformedEmployees,
                summary,
                chartData,
                summaryRows,
                dateRange,
                categoryStats,
                complianceStats
            });
        } catch (err) {
            console.error('Error processing file:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleMasterDataUpload = async (file) => {
        try {
            const parsedMasterData = await parseMasterDataFile(file);
            setMasterData(parsedMasterData);

            // If we already have attendance data, re-process with master data
            if (data) {
                const mergedEmployees = mergeEmployeeData(data.employees, parsedMasterData);
                const summaryRows = createSummaryTable(mergedEmployees);
                const summary = calculateSummary(mergedEmployees);
                summary.employeesOver60 = countEmployeesOver60(mergedEmployees);
                const categoryStats = getCategoryStats(mergedEmployees);
                const complianceStats = getComplianceStats(mergedEmployees);

                setData({
                    ...data,
                    employees: mergedEmployees,
                    summary,
                    summaryRows,
                    categoryStats,
                    complianceStats
                });
            }

            return true;
        } catch (err) {
            console.error('Error processing master data:', err);
            throw err;
        }
    };

    return (
        <div className="app">
            <div className="container">
                {!data ? (
                    <div className="welcome-screen">
                        <div className="welcome-content">
                            <h1 className="app-title">
                                <span className="icon">📊</span>
                                HR Time Attendance Dashboard
                            </h1>
                            <p className="app-subtitle">
                                Transform your Eagle System attendance reports into actionable insights
                            </p>

                            <div className="upload-section">
                                <div className="upload-box">
                                    <h3>📋 Step 1: Attendance Data</h3>
                                    <FileUpload onFileProcessed={handleFileProcessed} />
                                </div>

                                <div className="upload-box master-data">
                                    <h3>👥 Step 2: Employee Master Data (Optional)</h3>
                                    <p className="upload-hint">Upload to enable department summary</p>
                                    <FileUpload
                                        onFileProcessed={handleMasterDataUpload}
                                        label="Upload Master Data"
                                    />
                                    {masterData && (
                                        <p className="success-message">
                                            ✅ Master data loaded ({Object.keys(masterData).length} employees)
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="features">
                                <div className="feature">
                                    <span className="feature-icon">⚡</span>
                                    <h3>Instant Processing</h3>
                                    <p>Upload and transform data in seconds</p>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">📈</span>
                                    <h3>Visual Analytics</h3>
                                    <p>Interactive charts and insights</p>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">💾</span>
                                    <h3>Export Ready</h3>
                                    <p>Download as CSV, Excel, or JSON</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="dashboard-header">
                            <button
                                className="btn btn-secondary reset-btn"
                                onClick={() => setData(null)}
                            >
                                ← Upload New File
                            </button>
                        </div>

                        <Dashboard
                            employees={data.employees}
                            summary={data.summary}
                            chartData={data.chartData}
                            summaryRows={data.summaryRows}
                            dateRange={data.dateRange}
                            categoryStats={data.categoryStats}
                            complianceStats={data.complianceStats}
                            onMasterDataUpload={!masterData ? () => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.xlsx,.xls';
                                input.onchange = async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        try {
                                            await handleMasterDataUpload(file);
                                        } catch (err) {
                                            console.error('Failed to upload master data:', err);
                                        }
                                    }
                                };
                                input.click();
                            } : null}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default App;

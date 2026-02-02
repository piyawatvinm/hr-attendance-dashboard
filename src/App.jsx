import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { parseExcelFile, extractStructuredData } from './utils/excelParser';
import { transformEmployeeData, calculateSummary, getChartData } from './utils/dataTransformer';
import './App.css';

function App() {
    const [data, setData] = useState(null);
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
            const transformedEmployees = transformEmployeeData(employees);

            // Calculate summary
            const summary = calculateSummary(transformedEmployees);

            // Get chart data
            const chartData = getChartData(transformedEmployees);

            setData({
                employees: transformedEmployees,
                summary,
                chartData
            });
        } catch (err) {
            console.error('Error processing file:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
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
                            <FileUpload onFileProcessed={handleFileProcessed} />

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
                        <button
                            className="btn btn-secondary reset-btn"
                            onClick={() => setData(null)}
                        >
                            ← Upload New File
                        </button>
                        <Dashboard
                            employees={data.employees}
                            summary={data.summary}
                            chartData={data.chartData}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default App;

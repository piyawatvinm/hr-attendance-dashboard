import SummaryCards from './SummaryCards';
import OTByEmployee from './Charts/OTByEmployee';
import OTTrend from './Charts/OTTrend';
import OTByRate from './Charts/OTByRate';
import EmployeeTable from './EmployeeTable';
import ExportButtons from './ExportButtons';
import './Dashboard.css';

export default function Dashboard({ employees, summary, chartData }) {
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>HR Time Attendance Dashboard</h1>
                    <p className="text-secondary">Eagle System Report Analysis</p>
                </div>
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Kellogg%27s_logo.svg/320px-Kellogg%27s_logo.svg.png"
                    alt="Kellogg's"
                    className="company-logo"
                />
            </div>

            <SummaryCards summary={summary} />

            <div className="charts-grid">
                <div className="chart-large">
                    <OTByEmployee data={chartData.otByEmployee} />
                </div>
                <div className="chart-large">
                    <OTTrend data={chartData.otTrend} />
                </div>
                {chartData.otByRate.length > 0 && (
                    <div className="chart-small">
                        <OTByRate data={chartData.otByRate} />
                    </div>
                )}
            </div>

            <EmployeeTable employees={employees} />

            <ExportButtons employees={employees} summary={summary} />
        </div>
    );
}

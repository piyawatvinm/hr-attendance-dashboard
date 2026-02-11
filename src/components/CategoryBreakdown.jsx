import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './CategoryBreakdown.css';

export default function CategoryBreakdown({ categoryStats }) {
    if (!categoryStats || categoryStats.length === 0) {
        return <div className="category-breakdown-empty">No category data available</div>;
    }

    // Filter out subtotals and grand total for chart, only show main categories
    const chartData = categoryStats.filter(stat =>
        !stat.isSubtotal && !stat.isGrandTotal && stat.department
    ).map(stat => ({
        name: `${stat.category.slice(0, 12)}...`,
        fullName: stat.category,
        dept: stat.department,
        'Working Hrs': stat.actualWorkingHours,
        'OT': stat.totalOT
    })).slice(0, 10); // Show top 10

    // Aggregate by category for chart
    const byCategory = {};
    categoryStats.filter(s => !s.isSubtotal && !s.isGrandTotal).forEach(stat => {
        if (!byCategory[stat.category]) {
            byCategory[stat.category] = {
                name: stat.category,
                'Working Hrs': 0,
                'OT': 0
            };
        }
        byCategory[stat.category]['Working Hrs'] += stat.actualWorkingHours;
        byCategory[stat.category]['OT'] += stat.totalOT;
    });

    const categoryChartData = Object.values(byCategory);

    return (
        <div className="category-breakdown">
            <div className="breakdown-chart">
                <h3>📊 Working Hours & OT by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.6)"
                            angle={-15}
                            textAnchor="end"
                            height={60}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(26, 26, 26, 0.95)',
                                border: '1px solid rgba(228, 0, 43, 0.3)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="Working Hrs" stackId="a" fill="#00C853" />
                        <Bar dataKey="OT" stackId="a" fill="#FF9800" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="breakdown-table">
                <h3>📋 Category Summary</h3>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Department</th>
                                <th>Count</th>
                                <th>Working (hrs)</th>
                                <th>OT (hrs)</th>
                                <th>Total (hrs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryStats.map((stat, index) => (
                                <tr
                                    key={index}
                                    className={
                                        stat.isGrandTotal ? 'grand-total' :
                                            stat.isSubtotal ? 'subtotal' : 'data-row'
                                    }
                                >
                                    <td className="category-cell">
                                        {stat.isSubtotal || stat.isGrandTotal ? stat.category : ''}
                                        {!stat.isSubtotal && !stat.isGrandTotal && stat.category}
                                    </td>
                                    <td>{stat.department}</td>
                                    <td className="number">{stat.count}</td>
                                    <td className="number">{stat.actualWorkingHours.toFixed(2)}</td>
                                    <td className="number">{stat.totalOT.toFixed(2)}</td>
                                    <td className="number bold">{stat.totalActualWorkingHours.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

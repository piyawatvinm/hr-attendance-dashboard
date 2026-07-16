import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
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
                    <BarChart data={categoryChartData} margin={{ top: 15, right: 15, left: 20, bottom: 10 }}>
                        <defs>
                            <linearGradient id="workingHoursGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#64748B" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#475569" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="otCategoryGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#E40029" stopOpacity={0.95} />
                                <stop offset="100%" stopColor="#B8001F" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--text-tertiary)"
                            angle={-15}
                            textAnchor="end"
                            height={50}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                        />
                        <YAxis 
                            stroke="var(--text-tertiary)" 
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Hours (Hrs)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--surface-glass, rgba(255, 255, 255, 0.95))',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '16px',
                                color: 'var(--text-primary)',
                                boxShadow: 'var(--shadow-lg)',
                                padding: '12px 16px',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}
                            cursor={{ fill: 'rgba(15, 23, 42, 0.02)' }}
                        />
                        <Legend 
                            wrapperStyle={{ 
                                fontSize: '11px', 
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                paddingTop: '10px'
                            }}
                            iconType="circle"
                            iconSize={7}
                        />
                        <Bar dataKey="Working Hrs" stackId="a" fill="url(#workingHoursGrad)" name="Working Hours" maxBarSize={28}>
                            <LabelList dataKey="Working Hrs" position="center" fill="#fff" fontSize={9} fontWeight={700} formatter={(v) => v > 15 ? Math.round(v).toLocaleString() : ''} />
                        </Bar>
                        <Bar dataKey="OT" stackId="a" fill="url(#otCategoryGrad)" name="Overtime" radius={[4, 4, 0, 0]} maxBarSize={28}>
                            <LabelList dataKey="OT" position="top" fill="var(--text-secondary)" fontSize={9} fontWeight={700} offset={4} formatter={(v) => v > 0 ? Math.round(v).toLocaleString() : ''} />
                        </Bar>
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

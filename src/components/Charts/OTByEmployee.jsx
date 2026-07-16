import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OTByEmployee({ data }) {
    // Take top 10 employees by OT
    const topEmployees = data ? data.slice(0, 10) : [];

    return (
        <div className="chart-container">
            <h3 className="chart-title">Top 10 Employees by OT Hours</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topEmployees} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <defs>
                        <linearGradient id="ot1xGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="ot1_5xGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="ot2xGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="ot3xGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={90}
                        stroke="var(--text-tertiary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="var(--text-tertiary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'OT Hours', angle: -90, position: 'insideLeft', offset: -5, fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
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
                        cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }}
                    />
                    <Legend 
                        wrapperStyle={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            color: 'var(--text-secondary)',
                            paddingTop: '15px'
                        }} 
                        iconType="circle"
                        iconSize={8}
                    />
                    <Bar dataKey="ot1x" stackId="a" fill="url(#ot1xGrad)" name="1x Rate" radius={[0, 0, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="ot1_5x" stackId="a" fill="url(#ot1_5xGrad)" name="1.5x Rate" radius={[0, 0, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="ot2x" stackId="a" fill="url(#ot2xGrad)" name="2x Rate" radius={[0, 0, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="ot3x" stackId="a" fill="url(#ot3xGrad)" name="3x Rate" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

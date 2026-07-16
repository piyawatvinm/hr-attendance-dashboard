import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OTTrend({ data }) {
    return (
        <div className="chart-container">
            <h3 className="chart-title">OT Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data || []} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <defs>
                        <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--kellogg-red, #E40029)" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="var(--kellogg-red, #E40029)" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={90}
                        stroke="var(--text-tertiary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="var(--text-tertiary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Total OT Hours', angle: -90, position: 'insideLeft', offset: -5, fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
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
                    />
                    <Area
                        type="monotone"
                        dataKey="totalOT"
                        fill="url(#trendAreaGrad)"
                        stroke="none"
                    />
                    <Line
                        type="monotone"
                        dataKey="totalOT"
                        stroke="var(--kellogg-red, #E4002B)"
                        strokeWidth={3}
                        dot={{ stroke: 'var(--kellogg-red, #E4002B)', strokeWidth: 2, fill: 'var(--surface)', r: 4 }}
                        activeDot={{ stroke: 'var(--kellogg-red, #E4002B)', strokeWidth: 2, fill: 'var(--surface)', r: 6 }}
                        name="Total OT"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

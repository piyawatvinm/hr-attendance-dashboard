import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OTByRate({ data }) {
    // Custom colors matching the gradient palette
    const colorMap = {
        '1x': '#10B981',     // Emerald
        '1.5x': '#F59E0B',   // Amber
        '2x': '#EF4444',     // Red
        '3x': '#8B5CF6'      // Purple
    };

    const defaultColors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="chart-container">
            <h3 className="chart-title">OT Hours by Rate</h3>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={data || []}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={115}
                        paddingAngle={3}
                        cornerRadius={6}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                        {(data || []).map((entry, index) => {
                            const sliceColor = colorMap[entry.name] || defaultColors[index % defaultColors.length];
                            return <Cell key={`cell-${index}`} fill={sliceColor} stroke="var(--surface)" strokeWidth={2} />;
                        })}
                    </Pie>
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
                    <Legend 
                        wrapperStyle={{ 
                            fontSize: '12px', 
                            fontWeight: 600, 
                            color: 'var(--text-secondary)',
                            paddingTop: '10px'
                        }} 
                        iconType="circle"
                        iconSize={8}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

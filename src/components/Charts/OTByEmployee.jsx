import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OTByEmployee({ data }) {
    // Take top 10 employees by OT
    const topEmployees = data.slice(0, 10);

    return (
        <div className="chart-container">
            <h3 className="chart-title">Top 10 Employees by OT Hours</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topEmployees} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        stroke="#B0B0B0"
                        tick={{ fill: '#B0B0B0', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#B0B0B0"
                        tick={{ fill: '#B0B0B0' }}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#B0B0B0' }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1A1A1A',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#FFFFFF'
                        }}
                    />
                    <Legend wrapperStyle={{ color: '#B0B0B0' }} />
                    <Bar dataKey="ot1x" stackId="a" fill="#4CAF50" name="1x" />
                    <Bar dataKey="ot1_5x" stackId="a" fill="#FF9800" name="1.5x" />
                    <Bar dataKey="ot2x" stackId="a" fill="#F44336" name="2x" />
                    <Bar dataKey="ot3x" stackId="a" fill="#9C27B0" name="3x" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

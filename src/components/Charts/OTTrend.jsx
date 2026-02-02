import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OTTrend({ data }) {
    return (
        <div className="chart-container">
            <h3 className="chart-title">OT Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        stroke="#B0B0B0"
                        tick={{ fill: '#B0B0B0', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#B0B0B0"
                        tick={{ fill: '#B0B0B0' }}
                        label={{ value: 'Total OT Hours', angle: -90, position: 'insideLeft', fill: '#B0B0B0' }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1A1A1A',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#FFFFFF'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="totalOT"
                        stroke="#E4002B"
                        strokeWidth={3}
                        dot={{ fill: '#E4002B', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total OT"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

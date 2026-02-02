import './SummaryCards.css';
import { formatHours } from '../utils/dateUtils';

export default function SummaryCards({ summary }) {
    const cards = [
        {
            title: 'Total Hours',
            value: formatHours(summary.totalHours),
            icon: '⏱️',
            color: '#4CAF50'
        },
        {
            title: 'Total OT Hours',
            value: formatHours(summary.totalOT),
            icon: '⚡',
            color: '#FF9800'
        },
        {
            title: 'Employees',
            value: summary.totalEmployees,
            icon: '👥',
            color: '#2196F3'
        },
        {
            title: 'Avg OT per Employee',
            value: formatHours(summary.avgOTPerEmployee),
            icon: '📊',
            color: '#9C27B0'
        }
    ];

    return (
        <div className="summary-cards">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="summary-card fade-in"
                    style={{
                        animationDelay: `${index * 100}ms`,
                        '--card-color': card.color
                    }}
                >
                    <div className="card-icon">{card.icon}</div>
                    <div className="card-content">
                        <h3 className="card-title">{card.title}</h3>
                        <p className="card-value">{card.value}</p>
                    </div>
                    <div className="card-glow" style={{ background: card.color }}></div>
                </div>
            ))}
        </div>
    );
}

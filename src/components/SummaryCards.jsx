import { useState, useEffect } from 'react';
import './SummaryCards.css';
import { formatHours } from '../utils/dateUtils';

// Animated counter hook
function useAnimatedCounter(endValue, duration = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const numericValue = typeof endValue === 'number' ? endValue : parseFloat(endValue) || 0;
        if (numericValue === 0) {
            setCount(0);
            return;
        }

        let startTime;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(numericValue * easeOut);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [endValue, duration]);

    return count;
}

export default function SummaryCards({ summary }) {
    const cards = [
        {
            title: 'Total Days Worked',
            value: summary.totalHours,
            displayValue: summary.totalHours,
            icon: '📅',
            gradient: 'linear-gradient(135deg, #475569, #64748B)',
            bgGradient: 'linear-gradient(135deg, rgba(71, 85, 105, 0.06), rgba(100, 116, 139, 0.02))',
            iconBg: 'rgba(71, 85, 105, 0.1)'
        },
        {
            title: 'Total OT Hours',
            value: summary.totalOT,
            displayValue: formatHours(summary.totalOT),
            icon: '⚡',
            gradient: 'linear-gradient(135deg, #991B1B, #B91C1C)',
            bgGradient: 'linear-gradient(135deg, rgba(153, 27, 27, 0.06), rgba(185, 28, 28, 0.02))',
            iconBg: 'rgba(153, 27, 27, 0.1)'
        },
        {
            title: 'Total Employees',
            value: summary.totalEmployees,
            displayValue: summary.totalEmployees,
            icon: '👥',
            gradient: 'linear-gradient(135deg, #1E293B, #334155)',
            bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.06), rgba(51, 65, 85, 0.02))',
            iconBg: 'rgba(30, 41, 59, 0.1)'
        },
        {
            title: 'Employees Over 60 hrs',
            value: summary.employeesOver60 || 0,
            displayValue: summary.employeesOver60 || 0,
            icon: '⚠️',
            gradient: 'linear-gradient(135deg, #E40029, #FF3B5F)',
            bgGradient: 'linear-gradient(135deg, rgba(228, 0, 41, 0.06), rgba(255, 59, 95, 0.02))',
            iconBg: 'rgba(228, 0, 41, 0.1)'
        },
        {
            title: 'Avg OT / Employee',
            value: summary.avgOTPerEmployee,
            displayValue: formatHours(summary.avgOTPerEmployee),
            icon: '📊',
            gradient: 'linear-gradient(135deg, #64748B, #94A3B8)',
            bgGradient: 'linear-gradient(135deg, rgba(100, 116, 139, 0.06), rgba(148, 163, 184, 0.02))',
            iconBg: 'rgba(100, 116, 139, 0.1)'
        }
    ];

    return (
        <div className="summary-cards">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="summary-card"
                    style={{
                        '--card-gradient': card.gradient,
                        '--card-bg': card.bgGradient,
                        '--icon-bg': card.iconBg,
                        animationDelay: `${index * 100}ms`
                    }}
                >
                    <div className="card-accent"></div>
                    <div className="card-body">
                        <div className="card-icon-wrapper">
                            <span className="card-icon">{card.icon}</span>
                        </div>
                        <div className="card-content">
                            <span className="card-title">{card.title}</span>
                            <div className="card-value-row">
                                <AnimatedValue value={card.value} displayValue={card.displayValue} />
                            </div>
                        </div>
                    </div>
                    <div className="card-shine"></div>
                </div>
            ))}
        </div>
    );
}

function AnimatedValue({ value, displayValue }) {
    const animated = useAnimatedCounter(value);
    const isNumeric = typeof displayValue === 'number';

    return (
        <span className="card-value">
            {isNumeric ? Math.round(animated).toLocaleString() : displayValue}
        </span>
    );
}

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
            gradient: 'linear-gradient(135deg, #00C853, #00E676)',
            bgGradient: 'linear-gradient(135deg, rgba(0, 200, 83, 0.15), rgba(0, 230, 118, 0.05))',
            iconBg: 'rgba(0, 200, 83, 0.2)'
        },
        {
            title: 'Total OT Hours',
            value: summary.totalOT,
            displayValue: formatHours(summary.totalOT),
            icon: '⚡',
            gradient: 'linear-gradient(135deg, #FF6D00, #FFAB00)',
            bgGradient: 'linear-gradient(135deg, rgba(255, 109, 0, 0.15), rgba(255, 171, 0, 0.05))',
            iconBg: 'rgba(255, 109, 0, 0.2)'
        },
        {
            title: 'Total Employees',
            value: summary.totalEmployees,
            displayValue: summary.totalEmployees,
            icon: '👥',
            gradient: 'linear-gradient(135deg, #2979FF, #00B0FF)',
            bgGradient: 'linear-gradient(135deg, rgba(41, 121, 255, 0.15), rgba(0, 176, 255, 0.05))',
            iconBg: 'rgba(41, 121, 255, 0.2)'
        },
        {
            title: 'Avg OT / Employee',
            value: summary.avgOTPerEmployee,
            displayValue: formatHours(summary.avgOTPerEmployee),
            icon: '📊',
            gradient: 'linear-gradient(135deg, #AA00FF, #E040FB)',
            bgGradient: 'linear-gradient(135deg, rgba(170, 0, 255, 0.15), rgba(224, 64, 251, 0.05))',
            iconBg: 'rgba(170, 0, 255, 0.2)'
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

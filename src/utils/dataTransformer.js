import { excelTimeToHours, parseEagleDate } from './dateUtils';

/**
 * Transform raw employee data into clean, structured format
 */
export function transformEmployeeData(employees) {
    return employees.map(employee => {
        // Transform daily records
        const transformedRecords = employee.dailyRecords.map(record => ({
            date: parseEagleDate(record.date),
            dateStr: record.date,
            totalHours: excelTimeToHours(record.totalHours),
            ot1x: excelTimeToHours(record.ot1x),
            ot1_5x: excelTimeToHours(record.ot1_5x),
            ot2x: excelTimeToHours(record.ot2x),
            ot3x: excelTimeToHours(record.ot3x)
        }));

        // Calculate totals
        const totals = transformedRecords.reduce((acc, record) => ({
            totalHours: acc.totalHours + record.totalHours,
            ot1x: acc.ot1x + record.ot1x,
            ot1_5x: acc.ot1_5x + record.ot1_5x,
            ot2x: acc.ot2x + record.ot2x,
            ot3x: acc.ot3x + record.ot3x
        }), {
            totalHours: 0,
            ot1x: 0,
            ot1_5x: 0,
            ot2x: 0,
            ot3x: 0
        });

        // Calculate total OT
        totals.totalOT = totals.ot1x + totals.ot1_5x + totals.ot2x + totals.ot3x;

        return {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            department: employee.department,
            dailyRecords: transformedRecords,
            totals
        };
    });
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(employees) {
    const summary = {
        totalEmployees: employees.length,
        totalHours: 0,
        totalOT: 0,
        ot1x: 0,
        ot1_5x: 0,
        ot2x: 0,
        ot3x: 0
    };

    employees.forEach(emp => {
        summary.totalHours += emp.totals.totalHours;
        summary.totalOT += emp.totals.totalOT;
        summary.ot1x += emp.totals.ot1x;
        summary.ot1_5x += emp.totals.ot1_5x;
        summary.ot2x += emp.totals.ot2x;
        summary.ot3x += emp.totals.ot3x;
    });

    summary.avgOTPerEmployee = summary.totalEmployees > 0
        ? summary.totalOT / summary.totalEmployees
        : 0;

    return summary;
}

/**
 * Get OT data for charts
 */
export function getChartData(employees) {
    // OT by employee (for bar chart)
    const otByEmployee = employees.map(emp => ({
        name: emp.name,
        totalOT: emp.totals.totalOT,
        ot1x: emp.totals.ot1x,
        ot1_5x: emp.totals.ot1_5x,
        ot2x: emp.totals.ot2x,
        ot3x: emp.totals.ot3x
    })).sort((a, b) => b.totalOT - a.totalOT);

    // OT by rate (for pie chart)
    const summary = calculateSummary(employees);
    const otByRate = [
        { name: '1x', value: summary.ot1x, color: '#4CAF50' },
        { name: '1.5x', value: summary.ot1_5x, color: '#FF9800' },
        { name: '2x', value: summary.ot2x, color: '#F44336' },
        { name: '3x', value: summary.ot3x, color: '#9C27B0' }
    ].filter(item => item.value > 0);

    // OT trend over time (for line chart)
    const dailyOT = {};
    employees.forEach(emp => {
        emp.dailyRecords.forEach(record => {
            if (record.date) {
                const dateKey = record.date.toISOString().split('T')[0];
                if (!dailyOT[dateKey]) {
                    dailyOT[dateKey] = { date: record.date, totalOT: 0 };
                }
                dailyOT[dateKey].totalOT += record.ot1x + record.ot1_5x + record.ot2x + record.ot3x;
            }
        });
    });

    const otTrend = Object.values(dailyOT)
        .sort((a, b) => a.date - b.date)
        .map(item => ({
            date: item.date.toLocaleDateString('en-GB'),
            totalOT: item.totalOT
        }));

    return {
        otByEmployee,
        otByRate,
        otTrend
    };
}

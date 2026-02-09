import { excelTimeToHours, parseEagleDate, parseDayValue } from './dateUtils';

/**
 * Transform raw employee data into clean, structured format
 */
export function transformEmployeeData(employees) {
    return employees.map(employee => {
        // Transform daily records
        const transformedRecords = employee.dailyRecords.map(record => {
            // Parse day values (1:00:00 = 1 day, 0:04:00 = 0.5 day)
            const rawWorkDays = parseDayValue(record.work);
            const leaveDays = parseDayValue(record.leave);
            const absentDays = parseDayValue(record.absent);

            // Actual worked days = raw work - leave - absent
            // Example: Work=1, Leave=0.5 → actualWorked = 1 - 0.5 = 0.5
            const actualWorkedDays = Math.max(0, rawWorkDays - leaveDays - absentDays);

            return {
                date: parseEagleDate(record.date),
                dateStr: record.date,
                // Day values as decimals
                workDays: actualWorkedDays,  // Net worked days after deductions
                leaveDays: leaveDays,
                absentDays: absentDays,
                // Boolean flags for simple checks
                worked: actualWorkedDays > 0,
                leave: leaveDays > 0,
                absent: absentDays > 0,
                // OT hours
                ot1x: excelTimeToHours(record.ot1x),
                ot1_5x: excelTimeToHours(record.ot1_5x),
                ot2x: excelTimeToHours(record.ot2x),
                ot3x: excelTimeToHours(record.ot3x)
            };
        });

        // Calculate totals - sum decimal days
        const calculatedTotals = transformedRecords.reduce((acc, record) => ({
            daysWorked: acc.daysWorked + record.workDays,
            leaveDays: acc.leaveDays + record.leaveDays,
            absentDays: acc.absentDays + record.absentDays,
            ot1x: acc.ot1x + record.ot1x,
            ot1_5x: acc.ot1_5x + record.ot1_5x,
            ot2x: acc.ot2x + record.ot2x,
            ot3x: acc.ot3x + record.ot3x
        }), {
            daysWorked: 0,
            leaveDays: 0,
            absentDays: 0,
            ot1x: 0,
            ot1_5x: 0,
            ot2x: 0,
            ot3x: 0
        });

        // Total hours is now days worked (for backward compatibility)
        calculatedTotals.totalHours = calculatedTotals.daysWorked;

        // Calculate total OT
        calculatedTotals.totalOT = calculatedTotals.ot1x + calculatedTotals.ot1_5x + calculatedTotals.ot2x + calculatedTotals.ot3x;

        return {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            department: employee.department,
            dailyRecords: transformedRecords,
            totals: calculatedTotals
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

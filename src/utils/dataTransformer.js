import { excelTimeToHours, parseEagleDate, parseDayValue, parseLeaveType } from './dateUtils';

/**
 * Transform raw employee data into clean, structured format
 */
export function transformEmployeeData(employees) {
    return employees.map(employee => {
        // Transform daily records
        const transformedRecords = employee.dailyRecords.map(record => {
            // Parse day values (1:00:00 = 1 day, 0:04:00 = 0.5 day)
            const rawWorkDays = parseDayValue(record.work);
            const absentDays = parseDayValue(record.absent);

            // Parse leave and separate sick leave from regular leave
            const leaveInfo = parseLeaveType(record.leave);
            const sickLeaveDays = leaveInfo.isSickLeave ? leaveInfo.days : 0;
            const leaveDays = leaveInfo.isSickLeave ? 0 : leaveInfo.days;
            const totalLeaveDays = leaveDays + sickLeaveDays;

            // Actual worked days = raw work - all leave - absent
            const actualWorkedDays = Math.max(0, rawWorkDays - totalLeaveDays - absentDays);

            // Working hours = worked days * 8
            const workingHours = actualWorkedDays * 8;

            // OT hours
            const ot1x = excelTimeToHours(record.ot1x);
            const ot1_5x = excelTimeToHours(record.ot1_5x);
            const ot2x = excelTimeToHours(record.ot2x);
            const ot3x = excelTimeToHours(record.ot3x);
            const totalOT = ot1x + ot1_5x + ot2x + ot3x;

            return {
                date: parseEagleDate(record.date),
                dateStr: record.date,
                // Day values as decimals
                workDays: actualWorkedDays,
                workingHours: workingHours,
                leaveDays: leaveDays,
                sickLeaveDays: sickLeaveDays,
                absentDays: absentDays,
                // Boolean flags for simple checks
                worked: actualWorkedDays > 0,
                leave: leaveDays > 0,
                sickLeave: sickLeaveDays > 0,
                absent: absentDays > 0,
                // OT hours
                ot1x,
                ot1_5x,
                ot2x,
                ot3x,
                totalOT,
                // Total working hours = working hours + total OT
                totalWorkingHours: workingHours + totalOT
            };
        });

        // Calculate totals
        const calculatedTotals = transformedRecords.reduce((acc, record) => ({
            daysWorked: acc.daysWorked + record.workDays,
            workingHours: acc.workingHours + record.workingHours,
            leaveDays: acc.leaveDays + record.leaveDays,
            sickLeaveDays: acc.sickLeaveDays + record.sickLeaveDays,
            absentDays: acc.absentDays + record.absentDays,
            ot1x: acc.ot1x + record.ot1x,
            ot1_5x: acc.ot1_5x + record.ot1_5x,
            ot2x: acc.ot2x + record.ot2x,
            ot3x: acc.ot3x + record.ot3x,
            totalOT: acc.totalOT + record.totalOT,
            totalWorkingHours: acc.totalWorkingHours + record.totalWorkingHours
        }), {
            daysWorked: 0,
            workingHours: 0,
            leaveDays: 0,
            sickLeaveDays: 0,
            absentDays: 0,
            ot1x: 0,
            ot1_5x: 0,
            ot2x: 0,
            ot3x: 0,
            totalOT: 0,
            totalWorkingHours: 0
        });

        // Backward compatibility
        calculatedTotals.totalHours = calculatedTotals.daysWorked;

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
                dailyOT[dateKey].totalOT += record.totalOT;
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

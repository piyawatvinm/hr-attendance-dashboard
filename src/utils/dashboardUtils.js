/**
 * Dashboard utility functions for summary statistics
 */

/**
 * Get date range from employee daily records
 */
export function getDateRange(employees) {
    let minDate = null;
    let maxDate = null;

    employees.forEach(emp => {
        emp.dailyRecords.forEach(record => {
            if (record.date) {
                if (!minDate || record.date < minDate) minDate = record.date;
                if (!maxDate || record.date > maxDate) maxDate = record.date;
            }
        });
    });

    const days = (minDate && maxDate)
        ? Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
        : 0;

    return {
        startDate: minDate,
        endDate: maxDate,
        days,
        formatted: {
            start: minDate ? minDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            end: maxDate ? maxDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
        }
    };
}

/**
 * Get category statistics grouped by category → department
 */
export function getCategoryStats(employees) {
    const categoryOrder = ['Permanent RTEC', 'Permanent Snack', 'Salaried', 'Subcontract', 'Other', 'Unknown'];
    const grouped = {};

    employees.forEach(emp => {
        const cat = emp.category || 'Unknown';
        const dept = emp.subCategory || emp.department || 'Unknown';
        const key = `${cat}|${dept}`;

        if (!grouped[key]) {
            grouped[key] = {
                category: cat,
                department: dept,
                count: 0,
                actualWorkingHours: 0,
                ot1x: 0,
                ot1_5x: 0,
                ot2x: 0,
                ot3x: 0,
                totalOT: 0,
                totalActualWorkingHours: 0,
                sickLeaveDays: 0,
                absentDays: 0
            };
        }

        const g = grouped[key];
        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;

        g.count++;
        g.actualWorkingHours += workingHrs;
        g.ot1x += emp.totals.ot1x || 0;
        g.ot1_5x += emp.totals.ot1_5x || 0;
        g.ot2x += emp.totals.ot2x || 0;
        g.ot3x += emp.totals.ot3x || 0;
        g.totalOT += totalOT;
        g.totalActualWorkingHours += workingHrs + totalOT;
        g.sickLeaveDays += emp.totals.sickLeaveDays || 0;
        g.absentDays += emp.totals.absentDays || 0;
    });

    // Order by category, then by department
    const result = [];
    categoryOrder.forEach(cat => {
        const items = Object.values(grouped)
            .filter(g => g.category === cat)
            .sort((a, b) => a.department.localeCompare(b.department));
        if (items.length > 0) {
            result.push(...items);
        }
    });

    // Add category subtotals
    const withSubtotals = [];
    categoryOrder.forEach(cat => {
        const items = result.filter(r => r.category === cat);
        if (items.length === 0) return;

        withSubtotals.push(...items);

        // Calculate subtotal
        const subtotal = items.reduce((acc, item) => ({
            category: `${cat} Total`,
            department: '',
            count: acc.count + item.count,
            actualWorkingHours: acc.actualWorkingHours + item.actualWorkingHours,
            ot1x: acc.ot1x + item.ot1x,
            ot1_5x: acc.ot1_5x + item.ot1_5x,
            ot2x: acc.ot2x + item.ot2x,
            ot3x: acc.ot3x + item.ot3x,
            totalOT: acc.totalOT + item.totalOT,
            totalActualWorkingHours: acc.totalActualWorkingHours + item.totalActualWorkingHours,
            sickLeaveDays: acc.sickLeaveDays + item.sickLeaveDays,
            absentDays: acc.absentDays + item.absentDays,
            isSubtotal: true
        }), { count: 0, actualWorkingHours: 0, ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0, totalOT: 0, totalActualWorkingHours: 0, sickLeaveDays: 0, absentDays: 0 });

        withSubtotals.push(subtotal);
    });

    // Grand total
    const grandTotal = result.reduce((acc, item) => ({
        category: 'Grand Total',
        department: '',
        count: acc.count + item.count,
        actualWorkingHours: acc.actualWorkingHours + item.actualWorkingHours,
        ot1x: acc.ot1x + item.ot1x,
        ot1_5x: acc.ot1_5x + item.ot1_5x,
        ot2x: acc.ot2x + item.ot2x,
        ot3x: acc.ot3x + item.ot3x,
        totalOT: acc.totalOT + item.totalOT,
        totalActualWorkingHours: acc.totalActualWorkingHours + item.totalActualWorkingHours,
        sickLeaveDays: acc.sickLeaveDays + item.sickLeaveDays,
        absentDays: acc.absentDays + item.absentDays,
        isGrandTotal: true
    }), { count: 0, actualWorkingHours: 0, ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0, totalOT: 0, totalActualWorkingHours: 0, sickLeaveDays: 0, absentDays: 0 });

    withSubtotals.push(grandTotal);

    return withSubtotals;
}

/**
 * Get compliance statistics for employees exceeding 60 hours
 */
export function getComplianceStats(employees) {
    const categoryOrder = ['Permanent RTEC', 'Permanent Snack', 'Salaried', 'Subcontract', 'Other', 'Unknown'];

    // Filter employees > 60 hrs
    const over60Employees = employees.filter(emp => {
        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;
        return (workingHrs + totalOT) > 60;
    });

    const grouped = {};

    over60Employees.forEach(emp => {
        const cat = emp.category || 'Unknown';
        const dept = emp.subCategory || emp.department || 'Unknown';
        const key = `${cat}|${dept}`;

        if (!grouped[key]) {
            grouped[key] = {
                category: cat,
                department: dept,
                count: 0,
                lawWorkingHours: 0,
                totalActualWorkingHours: 0,
                lawOver60: 0
            };
        }

        const g = grouped[key];
        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;
        const totalActual = workingHrs + totalOT;

        g.count++;
        g.lawWorkingHours += 60;
        g.totalActualWorkingHours += totalActual;
        g.lawOver60 += (60 - totalActual);
    });

    // Order by category
    const result = [];
    categoryOrder.forEach(cat => {
        const items = Object.values(grouped)
            .filter(g => g.category === cat)
            .sort((a, b) => a.department.localeCompare(b.department));
        if (items.length > 0) {
            result.push(...items);
        }
    });

    // Add subtotals
    const withSubtotals = [];
    categoryOrder.forEach(cat => {
        const items = result.filter(r => r.category === cat);
        if (items.length === 0) return;

        withSubtotals.push(...items);

        const subtotal = items.reduce((acc, item) => ({
            category: `${cat} Total`,
            department: '',
            count: acc.count + item.count,
            lawWorkingHours: acc.lawWorkingHours + item.lawWorkingHours,
            totalActualWorkingHours: acc.totalActualWorkingHours + item.totalActualWorkingHours,
            lawOver60: acc.lawOver60 + item.lawOver60,
            isSubtotal: true
        }), { count: 0, lawWorkingHours: 0, totalActualWorkingHours: 0, lawOver60: 0 });

        withSubtotals.push(subtotal);
    });

    // Grand total
    if (result.length > 0) {
        const grandTotal = result.reduce((acc, item) => ({
            category: 'Grand Total',
            department: '',
            count: acc.count + item.count,
            lawWorkingHours: acc.lawWorkingHours + item.lawWorkingHours,
            totalActualWorkingHours: acc.totalActualWorkingHours + item.totalActualWorkingHours,
            lawOver60: acc.lawOver60 + item.lawOver60,
            isGrandTotal: true
        }), { count: 0, lawWorkingHours: 0, totalActualWorkingHours: 0, lawOver60: 0 });

        withSubtotals.push(grandTotal);
    }

    return {
        totalViolations: over60Employees.length,
        data: withSubtotals
    };
}

/**
 * Count employees over 60 hours
 */
export function countEmployeesOver60(employees) {
    return employees.filter(emp => {
        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;
        return (workingHrs + totalOT) > 60;
    }).length;
}

/**
 * Get compliance and headcount stats grouped by department
 */
export function getDepartmentComplianceStats(employees) {
    const departments = {};

    employees.forEach(emp => {
        const dept = emp.department || 'No Department';
        if (!departments[dept]) {
            departments[dept] = {
                department: dept,
                headcount: 0,
                totalHours: 0,
                violatorsCount: 0,
                excessHours: 0
            };
        }

        const d = departments[dept];
        d.headcount++;

        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;
        const totalHrs = workingHrs + totalOT;

        d.totalHours += totalHrs;

        if (totalHrs > 60) {
            d.violatorsCount++;
            d.excessHours += (totalHrs - 60);
        }
    });

    // Round total hours and excess hours
    Object.values(departments).forEach(d => {
        d.totalHours = Math.round(d.totalHours * 100) / 100;
        d.excessHours = Math.round(d.excessHours * 100) / 100;
    });

    return Object.values(departments).sort((a, b) => b.violatorsCount - a.violatorsCount || b.excessHours - a.excessHours);
}


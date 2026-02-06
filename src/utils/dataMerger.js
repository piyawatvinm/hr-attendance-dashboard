import { getEmployeeCategory } from './masterDataParser';

/**
 * Merge attendance data with master data
 */
export function mergeEmployeeData(employees, masterData) {
    if (!masterData || Object.keys(masterData).length === 0) {
        console.log('No master data to merge');
        return employees;
    }

    let matchCount = 0;
    let unmatchedIds = [];

    const mergedEmployees = employees.map(emp => {
        const master = masterData[emp.id];

        if (master) {
            matchCount++;
            const category = getEmployeeCategory(master.plantDivision, master.employeeType);
            return {
                ...emp,
                plantDivision: master.plantDivision,
                employeeType: master.employeeType,
                costCenter: master.costCenter,
                category: category.category,
                subCategory: category.subCategory
            };
        } else {
            unmatchedIds.push(emp.id);
            return {
                ...emp,
                plantDivision: '',
                employeeType: '',
                costCenter: '',
                category: 'Unknown',
                subCategory: 'Unknown'
            };
        }
    });

    console.log(`Merged ${matchCount} of ${employees.length} employees`);
    if (unmatchedIds.length > 0 && unmatchedIds.length <= 10) {
        console.log('Unmatched IDs:', unmatchedIds);
    }

    return mergedEmployees;
}

/**
 * Calculate summary by category
 */
export function calculateCategorySummary(employees) {
    const summary = {};

    employees.forEach(emp => {
        const category = emp.category || 'Unknown';
        const subCategory = emp.subCategory || 'Unknown';
        const key = `${category}|${subCategory}`;

        if (!summary[key]) {
            summary[key] = {
                category,
                subCategory,
                headcount: 0,
                totalHours: 0,
                ot1x: 0,
                ot1_5x: 0,
                ot2x: 0,
                ot3x: 0,
                leaveDays: 0,
                absentDays: 0
            };
        }

        summary[key].headcount++;
        summary[key].totalHours += emp.totals?.totalHours || 0;
        summary[key].ot1x += emp.totals?.ot1x || 0;
        summary[key].ot1_5x += emp.totals?.ot1_5x || 0;
        summary[key].ot2x += emp.totals?.ot2x || 0;
        summary[key].ot3x += emp.totals?.ot3x || 0;
        summary[key].leaveDays += emp.totals?.leaveDays || 0;
        summary[key].absentDays += emp.totals?.absentDays || 0;
    });

    return summary;
}

/**
 * Create structured summary for display
 */
export function createSummaryTable(employees) {
    const categorySummary = calculateCategorySummary(employees);

    // Define category order
    const categoryOrder = ['Permanent RTEC', 'Permanent Snack', 'Salaried', 'Subcontract', 'Other', 'Unknown'];

    // Group by category
    const grouped = {};
    categoryOrder.forEach(cat => {
        grouped[cat] = [];
    });

    Object.values(categorySummary).forEach(item => {
        const cat = categoryOrder.includes(item.category) ? item.category : 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    // Build table rows with subtotals
    const tableRows = [];

    categoryOrder.forEach(category => {
        const items = grouped[category];
        if (!items || items.length === 0) return;

        // Sort items within category
        items.sort((a, b) => b.headcount - a.headcount);

        // Add item rows
        items.forEach(item => {
            tableRows.push({
                type: 'data',
                employeeType: item.category,
                department: item.subCategory,
                headcount: item.headcount,
                totalHours: item.totalHours,
                ot1x: item.ot1x,
                ot1_5x: item.ot1_5x,
                ot2x: item.ot2x,
                ot3x: item.ot3x
            });
        });

        // Add subtotal row
        const subtotal = items.reduce((acc, item) => ({
            headcount: acc.headcount + item.headcount,
            totalHours: acc.totalHours + item.totalHours,
            ot1x: acc.ot1x + item.ot1x,
            ot1_5x: acc.ot1_5x + item.ot1_5x,
            ot2x: acc.ot2x + item.ot2x,
            ot3x: acc.ot3x + item.ot3x
        }), { headcount: 0, totalHours: 0, ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0 });

        tableRows.push({
            type: 'subtotal',
            label: `Total ${category}`,
            ...subtotal
        });
    });

    // Grand total
    const grandTotal = Object.values(categorySummary).reduce((acc, item) => ({
        headcount: acc.headcount + item.headcount,
        totalHours: acc.totalHours + item.totalHours,
        ot1x: acc.ot1x + item.ot1x,
        ot1_5x: acc.ot1_5x + item.ot1_5x,
        ot2x: acc.ot2x + item.ot2x,
        ot3x: acc.ot3x + item.ot3x
    }), { headcount: 0, totalHours: 0, ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0 });

    tableRows.push({
        type: 'grandtotal',
        label: 'Grand Total',
        ...grandTotal
    });

    return tableRows;
}

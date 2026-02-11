import * as XLSX from 'xlsx';

/**
 * Generate timestamped filename
 */
function getExportFilename() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `Weekly_Overtime_Tracking_Report_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.xlsx`;
}

/**
 * Helper: group employees by category → subCategory (department)
 * Returns ordered array of { category, department, ...aggregated }
 */
function groupByCategoryDept(employeeList) {
    const categoryOrder = ['Permanent RTEC', 'Permanent Snack', 'Salaried', 'Subcontract', 'Other', 'Unknown'];
    const grouped = {};

    employeeList.forEach(emp => {
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
                totalActualWorkingHours: 0,
                sickLeaveDays: 0,
                absentDays: 0,
                lawWorkingHours: 0,
                lawOver60: 0
            };
        }

        const g = grouped[key];
        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;
        const totalActual = workingHrs + totalOT;

        g.count++;
        g.actualWorkingHours += workingHrs;
        g.ot1x += emp.totals.ot1x || 0;
        g.ot1_5x += emp.totals.ot1_5x || 0;
        g.ot2x += emp.totals.ot2x || 0;
        g.ot3x += emp.totals.ot3x || 0;
        g.totalActualWorkingHours += totalActual;
        g.sickLeaveDays += emp.totals.sickLeaveDays || 0;
        g.absentDays += emp.totals.absentDays || 0;
        g.lawWorkingHours += 60;
        g.lawOver60 += (60 - totalActual);
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

    return result;
}

/**
 * Build Table 2 & 3 rows from grouped data
 */
function buildGroupedRows(groupedData, columns, getRowValues) {
    const rows = [];
    const categories = [...new Set(groupedData.map(g => g.category))];

    categories.forEach(cat => {
        const items = groupedData.filter(g => g.category === cat);
        if (items.length === 0) return;

        items.forEach((item, idx) => {
            rows.push(getRowValues(item, idx === 0 ? cat : ''));
        });

        // Subtotal row
        const subtotal = items.reduce((acc, item) => {
            columns.forEach(col => {
                if (typeof item[col] === 'number') {
                    acc[col] = (acc[col] || 0) + item[col];
                }
            });
            return acc;
        }, {});
        rows.push(getRowValues({ ...subtotal, category: `${cat} Total`, department: '' }, `${cat} Total`));
    });

    // Grand total
    const grandTotal = groupedData.reduce((acc, item) => {
        columns.forEach(col => {
            if (typeof item[col] === 'number') {
                acc[col] = (acc[col] || 0) + item[col];
            }
        });
        return acc;
    }, {});
    rows.push(getRowValues({ ...grandTotal, category: 'Grand Total', department: '' }, 'Grand Total'));

    return rows;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(employees) {
    const rows = [];

    rows.push([
        'Employee ID', 'Name', 'Position', 'Department', 'Plant/Division',
        'Employee Type', 'Cost Center', 'Team',
        'Days Worked', 'OT 1x (hrs)', 'OT 1.5x (hrs)', 'OT 2x (hrs)', 'OT 3x (hrs)',
        'Total OT (hrs)', 'Leave Days', 'Sick Leave Days', 'Absent Days'
    ]);

    employees.forEach(emp => {
        rows.push([
            emp.id, emp.name, emp.position, emp.department,
            emp.plantDivision || '', emp.employeeType || '', emp.costCenter || '', emp.team || '',
            emp.totals.daysWorked,
            emp.totals.ot1x.toFixed(2), emp.totals.ot1_5x.toFixed(2),
            emp.totals.ot2x.toFixed(2), emp.totals.ot3x.toFixed(2),
            emp.totals.totalOT.toFixed(2),
            emp.totals.leaveDays || 0, emp.totals.sickLeaveDays || 0, emp.totals.absentDays || 0
        ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    downloadFile(csvContent, 'hr-attendance-summary.csv', 'text/csv');
}

/**
 * Export data to Excel format with 3 sheets
 */
export function exportToExcel(employees, summaryRows = []) {
    const wb = XLSX.utils.book_new();

    // ===== Sheet 1: Daily Details =====
    const dailyData = [];

    dailyData.push([
        'Date', 'Employee ID', 'Name', 'Position', 'Department',
        'Plant/Division', 'Employee Type', 'Cost Center', 'Category', 'Team',
        'Worked (Days)', 'Working hours', 'Leave', 'Sick leave', 'Absent',
        'OT 1x (hrs)', 'OT 1.5x (hrs)', 'OT 2x (hrs)', 'OT 3x (hrs)',
        'Total OT (hrs)', 'Total Working hours'
    ]);

    employees.forEach(emp => {
        emp.dailyRecords.forEach(record => {
            const dateStr = record.date
                ? record.date.toLocaleDateString('en-GB')
                : record.dateStr || '';

            const workedDays = record.workDays || 0;
            const workingHours = workedDays * 8;
            const totalOT = (record.ot1x || 0) + (record.ot1_5x || 0) + (record.ot2x || 0) + (record.ot3x || 0);
            const totalWorkingHours = workingHours + totalOT;

            dailyData.push([
                dateStr, emp.id, emp.name, emp.position, emp.department,
                emp.plantDivision || '', emp.employeeType || '', emp.costCenter || '',
                emp.category || '', emp.team || '',
                workedDays, workingHours,
                record.leaveDays || 0, record.sickLeaveDays || 0, record.absentDays || 0,
                record.ot1x || 0, record.ot1_5x || 0, record.ot2x || 0, record.ot3x || 0,
                totalOT, totalWorkingHours
            ]);
        });
    });

    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
    wsDaily['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
        { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 14 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Details');

    // ===== Sheet 2: Employee Summary =====
    const summaryEmpData = [];

    summaryEmpData.push([
        'No.', 'Employee ID', 'Name', 'Position', 'Department',
        'Plant/Division', 'Employee Type', 'Cost Center', 'Category', 'Team',
        'Days Worked', 'Leave Days', 'Sick leave (Days)', 'Absent Days',
        'OT 1x (hrs)', 'OT 1.5x (hrs)', 'OT 2x (hrs)', 'OT 3x (hrs)',
        'Total Actual Working hours', 'Actual Working hours', 'Actual OT (hrs)',
        'Law working hours', 'Law working hours over 60 hrs.', 'Type'
    ]);

    employees.forEach((emp, index) => {
        const daysWorked = emp.totals.daysWorked || 0;
        const actualWorkingHours = daysWorked * 8;
        const actualOT = emp.totals.totalOT || 0;
        const totalActualWorkingHours = actualWorkingHours + actualOT;
        const lawWorkingHours = 60;
        const lawOver60 = lawWorkingHours - totalActualWorkingHours;
        const type = totalActualWorkingHours > 60 ? 'Over 60 hrs' : 'Normal';

        summaryEmpData.push([
            index + 1, emp.id, emp.name, emp.position, emp.department,
            emp.plantDivision || '', emp.employeeType || '', emp.costCenter || '',
            emp.category || '', emp.team || '',
            daysWorked, emp.totals.leaveDays || 0, emp.totals.sickLeaveDays || 0, emp.totals.absentDays || 0,
            emp.totals.ot1x || 0, emp.totals.ot1_5x || 0, emp.totals.ot2x || 0, emp.totals.ot3x || 0,
            totalActualWorkingHours, actualWorkingHours, actualOT,
            lawWorkingHours, lawOver60, type
        ]);
    });

    const wsSummaryEmp = XLSX.utils.aoa_to_sheet(summaryEmpData);
    wsSummaryEmp['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
        { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 25 }, { wch: 20 }, { wch: 14 },
        { wch: 18 }, { wch: 28 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummaryEmp, 'Employee Summary');

    // ===== Sheet 3: Summary (3 tables) =====
    const summarySheetData = [];

    // --- Table 1: Date Range ---
    // Find min and max dates from all daily records
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

    const formatDate = (d) => {
        if (!d) return '';
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const daysDiff = (minDate && maxDate)
        ? Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
        : 0;

    summarySheetData.push(['Start', 'End', '(Days)']);
    summarySheetData.push([formatDate(minDate), formatDate(maxDate), daysDiff]);
    summarySheetData.push([]); // blank row

    // --- Table 2: Actual Working Hours and OT ---
    summarySheetData.push(['Actual Working Hours and OT']);
    summarySheetData.push([
        'Category', 'Department', 'Count of Name',
        'Sum of Actual working hours', 'Sum of OT 1x (hrs)', 'Sum of OT 1.5x (hrs)',
        'Sum of OT 2x (hrs)', 'Sum of OT 3x (hrs)',
        'Sum of Total Actual working hours',
        'Count of Sick leave (Days)', 'Sum of Absent Days'
    ]);

    // Group ALL employees
    const allGrouped = groupByCategoryDept(employees);
    const numericCols = ['count', 'actualWorkingHours', 'ot1x', 'ot1_5x', 'ot2x', 'ot3x', 'totalActualWorkingHours', 'sickLeaveDays', 'absentDays'];

    const table2Rows = buildGroupedRows(allGrouped, numericCols, (item, catLabel) => [
        catLabel !== undefined ? catLabel : item.category,
        item.department || '',
        item.count || 0,
        item.actualWorkingHours || 0,
        item.ot1x || 0,
        item.ot1_5x || 0,
        item.ot2x || 0,
        item.ot3x || 0,
        item.totalActualWorkingHours || 0,
        item.sickLeaveDays || 0,
        item.absentDays || 0
    ]);

    table2Rows.forEach(row => summarySheetData.push(row));
    summarySheetData.push([]); // blank row

    // --- Table 3: Compliance VS Actual Total Working Hours > 60 ---
    // Filter only employees with Total Actual Working Hours > 60
    const over60Employees = employees.filter(emp => {
        const daysWorked = emp.totals.daysWorked || 0;
        const workingHrs = daysWorked * 8;
        const totalOT = emp.totals.totalOT || 0;
        return (workingHrs + totalOT) > 60;
    });

    summarySheetData.push(['Compliance VS Actual Total Working Hours > 60 (Hours)']);
    summarySheetData.push([
        'Category', 'Department', 'Count of Name',
        'Sum of Law working hours', 'Sum of Total Actual Working hours',
        'Sum of Law working hours over 60 hrs.'
    ]);

    if (over60Employees.length > 0) {
        const over60Grouped = groupByCategoryDept(over60Employees);
        const complianceCols = ['count', 'lawWorkingHours', 'totalActualWorkingHours', 'lawOver60'];

        const table3Rows = buildGroupedRows(over60Grouped, complianceCols, (item, catLabel) => [
            catLabel !== undefined ? catLabel : item.category,
            item.department || '',
            item.count || 0,
            item.lawWorkingHours || 0,
            item.totalActualWorkingHours || 0,
            item.lawOver60 || 0
        ]);

        table3Rows.forEach(row => summarySheetData.push(row));
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    wsSummary['!cols'] = [
        { wch: 22 },  // Category / Start
        { wch: 30 },  // Department / End
        { wch: 14 },  // Count / Days
        { wch: 26 },  // Sum of Actual working hours / Law working hours
        { wch: 18 },  // OT 1x / Total Actual
        { wch: 18 },  // OT 1.5x / Law over 60
        { wch: 18 },  // OT 2x
        { wch: 18 },  // OT 3x
        { wch: 28 },  // Total Actual working hours
        { wch: 22 },  // Sick leave
        { wch: 18 }   // Absent Days
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Generate Excel file
    XLSX.writeFile(wb, getExportFilename());
}

/**
 * Export data to JSON format
 */
export function exportToJSON(employees, summary) {
    const summarizedEmployees = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        department: emp.department,
        plantDivision: emp.plantDivision || '',
        employeeType: emp.employeeType || '',
        team: emp.team || '',
        costCenter: emp.costCenter || '',
        category: emp.category || '',
        totals: emp.totals,
        daysWorked: emp.totals.daysWorked
    }));

    const jsonData = {
        exportDate: new Date().toISOString(),
        summary,
        employees: summarizedEmployees
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    downloadFile(jsonString, 'hr-attendance-summary.json', 'application/json');
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

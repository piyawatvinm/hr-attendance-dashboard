import * as XLSX from 'xlsx';

/**
 * Export data to CSV format (Summarized - 1 row per employee)
 */
export function exportToCSV(employees) {
    const rows = [];

    // Header row
    rows.push([
        'Employee ID',
        'Name',
        'Position',
        'Department',
        'Plant/Division',
        'Employee Type',
        'Cost Center',
        'Days Worked',
        'OT 1x (hrs)',
        'OT 1.5x (hrs)',
        'OT 2x (hrs)',
        'OT 3x (hrs)',
        'Total OT (hrs)',
        'Leave Days',
        'Absent Days'
    ]);

    // Data rows - one row per employee with totals
    employees.forEach(emp => {
        rows.push([
            emp.id,
            emp.name,
            emp.position,
            emp.department,
            emp.plantDivision || '',
            emp.employeeType || '',
            emp.costCenter || '',
            emp.totals.totalHours,
            emp.totals.ot1x.toFixed(2),
            emp.totals.ot1_5x.toFixed(2),
            emp.totals.ot2x.toFixed(2),
            emp.totals.ot3x.toFixed(2),
            emp.totals.totalOT.toFixed(2),
            emp.totals.leaveDays || 0,
            emp.totals.absentDays || 0
        ]);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Create download
    downloadFile(csvContent, 'hr-attendance-summary.csv', 'text/csv');
}

/**
 * Export data to Excel format with 3 sheets:
 * Sheet 1: Daily Details (1 row per day per employee)
 * Sheet 2: Employee Summary (1 row per employee)
 * Sheet 3: Summary by Department
 */
export function exportToExcel(employees, summaryRows = []) {
    const wb = XLSX.utils.book_new();

    // ===== Sheet 1: Daily Details =====
    const dailyData = [];

    // Header row
    dailyData.push([
        'Date',
        'Employee ID',
        'Name',
        'Position',
        'Department',
        'Plant/Division',
        'Employee Type',
        'Cost Center',
        'Category',
        'Worked',
        'OT 1x (hrs)',
        'OT 1.5x (hrs)',
        'OT 2x (hrs)',
        'OT 3x (hrs)',
        'Total OT (hrs)'
    ]);

    // Daily data rows
    employees.forEach(emp => {
        emp.dailyRecords.forEach(record => {
            const dateStr = record.date
                ? record.date.toLocaleDateString('en-GB')  // DD/MM/YYYY format
                : record.dateStr || '';

            dailyData.push([
                dateStr,
                emp.id,
                emp.name,
                emp.position,
                emp.department,
                emp.plantDivision || '',
                emp.employeeType || '',
                emp.costCenter || '',
                emp.category || '',
                record.worked ? 'Y' : 'N',
                record.ot1x || 0,
                record.ot1_5x || 0,
                record.ot2x || 0,
                record.ot3x || 0,
                (record.ot1x || 0) + (record.ot1_5x || 0) + (record.ot2x || 0) + (record.ot3x || 0)
            ]);
        });
    });

    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);

    // Set column widths
    wsDaily['!cols'] = [
        { wch: 12 }, // Date
        { wch: 12 }, // Employee ID
        { wch: 25 }, // Name
        { wch: 30 }, // Position
        { wch: 15 }, // Department
        { wch: 18 }, // Plant/Division
        { wch: 15 }, // Employee Type
        { wch: 15 }, // Cost Center
        { wch: 15 }, // Category
        { wch: 8 },  // Worked
        { wch: 12 }, // OT 1x
        { wch: 12 }, // OT 1.5x
        { wch: 12 }, // OT 2x
        { wch: 12 }, // OT 3x
        { wch: 12 }  // Total OT
    ];

    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Details');

    // ===== Sheet 2: Employee Summary =====
    const detailData = [];

    // Header row
    detailData.push([
        'Employee ID',
        'Name',
        'Position',
        'Department',
        'Plant/Division',
        'Employee Type',
        'Cost Center',
        'Category',
        'Days Worked',
        'OT 1x (hrs)',
        'OT 1.5x (hrs)',
        'OT 2x (hrs)',
        'OT 3x (hrs)',
        'Total OT (hrs)',
        'Leave Days',
        'Absent Days'
    ]);

    // Data rows
    employees.forEach(emp => {
        detailData.push([
            emp.id,
            emp.name,
            emp.position,
            emp.department,
            emp.plantDivision || '',
            emp.employeeType || '',
            emp.costCenter || '',
            emp.category || '',
            emp.totals.totalHours,  // Now represents days worked
            emp.totals.ot1x,
            emp.totals.ot1_5x,
            emp.totals.ot2x,
            emp.totals.ot3x,
            emp.totals.totalOT,
            emp.totals.leaveDays || 0,
            emp.totals.absentDays || 0
        ]);
    });

    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);

    // Set column widths
    wsDetail['!cols'] = [
        { wch: 12 }, // Employee ID
        { wch: 25 }, // Name
        { wch: 30 }, // Position
        { wch: 15 }, // Department
        { wch: 18 }, // Plant/Division
        { wch: 15 }, // Employee Type
        { wch: 15 }, // Cost Center
        { wch: 15 }, // Category
        { wch: 12 }, // Days Worked
        { wch: 12 }, // OT 1x
        { wch: 12 }, // OT 1.5x
        { wch: 12 }, // OT 2x
        { wch: 12 }, // OT 3x
        { wch: 12 }, // Total OT
        { wch: 12 }, // Leave Days
        { wch: 12 }  // Absent Days
    ];

    XLSX.utils.book_append_sheet(wb, wsDetail, 'Employee Summary');

    // ===== Sheet 3: Summary by Department =====
    const summaryData = [];

    // Header row
    summaryData.push([
        'Employee Type',
        'Department',
        'Headcount',
        'OT 1x (Holiday)',
        'OT 1.5x',
        'OT 2x',
        'OT 3x (Holiday)'
    ]);

    // Summary rows
    if (summaryRows && summaryRows.length > 0) {
        summaryRows.forEach(row => {
            if (row.type === 'data') {
                summaryData.push([
                    row.employeeType,
                    row.department,
                    row.headcount,
                    row.ot1x || 0,
                    row.ot1_5x || 0,
                    row.ot2x || 0,
                    row.ot3x || 0
                ]);
            } else if (row.type === 'subtotal' || row.type === 'grandtotal') {
                summaryData.push([
                    '',
                    row.label,
                    row.headcount,
                    row.ot1x || 0,
                    row.ot1_5x || 0,
                    row.ot2x || 0,
                    row.ot3x || 0
                ]);
            }
        });
    } else {
        // If no summary rows, generate from employees
        const grouped = {};
        employees.forEach(emp => {
            const key = emp.category || 'Unknown';
            if (!grouped[key]) {
                grouped[key] = { headcount: 0, ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0 };
            }
            grouped[key].headcount++;
            grouped[key].ot1x += emp.totals.ot1x || 0;
            grouped[key].ot1_5x += emp.totals.ot1_5x || 0;
            grouped[key].ot2x += emp.totals.ot2x || 0;
            grouped[key].ot3x += emp.totals.ot3x || 0;
        });

        Object.entries(grouped).forEach(([category, data]) => {
            summaryData.push([
                category,
                '',
                data.headcount,
                data.ot1x,
                data.ot1_5x,
                data.ot2x,
                data.ot3x
            ]);
        });
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths for summary
    wsSummary['!cols'] = [
        { wch: 18 }, // Employee Type
        { wch: 25 }, // Department
        { wch: 12 }, // Headcount
        { wch: 15 }, // OT 1x
        { wch: 12 }, // OT 1.5x
        { wch: 12 }, // OT 2x
        { wch: 15 }  // OT 3x
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Generate Excel file
    XLSX.writeFile(wb, 'hr-attendance-report.xlsx');
}

/**
 * Export data to JSON format (Summarized)
 */
export function exportToJSON(employees, summary) {
    // Create summarized employee data without daily records
    const summarizedEmployees = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        position: emp.position,
        department: emp.department,
        plantDivision: emp.plantDivision || '',
        employeeType: emp.employeeType || '',
        costCenter: emp.costCenter || '',
        category: emp.category || '',
        totals: emp.totals,
        daysWorked: emp.totals.totalHours
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

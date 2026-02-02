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
        'Total Hours',
        'OT 1x (hrs)',
        'OT 1.5x (hrs)',
        'OT 2x (hrs)',
        'OT 3x (hrs)',
        'Total OT (hrs)',
        'Days Worked'
    ]);

    // Data rows - one row per employee with totals
    employees.forEach(emp => {
        rows.push([
            emp.id,
            emp.name,
            emp.position,
            emp.department,
            emp.totals.totalHours.toFixed(2),
            emp.totals.ot1x.toFixed(2),
            emp.totals.ot1_5x.toFixed(2),
            emp.totals.ot2x.toFixed(2),
            emp.totals.ot3x.toFixed(2),
            emp.totals.totalOT.toFixed(2),
            emp.dailyRecords.length
        ]);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Create download
    downloadFile(csvContent, 'hr-attendance-summary.csv', 'text/csv');
}

/**
 * Export data to Excel format (Summarized - 1 row per employee)
 */
export function exportToExcel(employees) {
    const data = [];

    // Header row
    data.push([
        'Employee ID',
        'Name',
        'Position',
        'Department',
        'Total Hours',
        'OT 1x (hrs)',
        'OT 1.5x (hrs)',
        'OT 2x (hrs)',
        'OT 3x (hrs)',
        'Total OT (hrs)',
        'Days Worked'
    ]);

    // Data rows - one row per employee with totals
    employees.forEach(emp => {
        data.push([
            emp.id,
            emp.name,
            emp.position,
            emp.department,
            emp.totals.totalHours,
            emp.totals.ot1x,
            emp.totals.ot1_5x,
            emp.totals.ot2x,
            emp.totals.ot3x,
            emp.totals.totalOT,
            emp.dailyRecords.length
        ]);
    });

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Generate Excel file
    XLSX.writeFile(wb, 'hr-attendance-summary.xlsx');
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
        totals: emp.totals,
        daysWorked: emp.dailyRecords.length
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

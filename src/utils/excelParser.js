import * as XLSX from 'xlsx';

/**
 * Parse Excel file from Eagle System
 * Returns raw data array
 */
export async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                // Get the first sheet (RTA302_EagleRaw)
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with header row
                // Use raw: true to preserve numeric values (Excel serial numbers)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    raw: true,  // Keep numbers as numbers
                    defval: null
                });

                console.log('Excel parsed, first 5 rows:', jsonData.slice(0, 5));

                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Find the header row index
 * Looks for row containing "HRS.", "1", "1.5", etc.
 */
function findHeaderRow(data) {
    for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (Array.isArray(row)) {
            // Look for characteristic columns
            const rowStr = row.join('|').toLowerCase();
            if (rowStr.includes('hrs') && (rowStr.includes('1.5') || rowStr.includes('1_1'))) {
                return i;
            }
        }
    }
    return -1;
}

/**
 * Extract column indices from header row
 */
function getColumnIndices(headerRow) {
    const indices = {
        name: -1,
        date: -1,
        totalHours: -1,
        ot1x: -1,
        ot1_5x: -1,
        ot2x: -1,
        ot3x: -1,
        calc1x: -1,
        calc1_5x: -1,
        calc3x: -1,
        leave: -1,
        absent: -1
    };

    // Track if we've seen these columns before (for duplicates)
    let seen1 = false;
    let seen1_5 = false;
    let seen3 = false;

    headerRow.forEach((cell, index) => {
        const cellStr = String(cell || '').trim().toLowerCase();

        console.log(`Column ${index}: "${cell}" (lowercase: "${cellStr}")`);

        // Match column names (flexible matching)
        if (cellStr === '' && indices.name === -1) {
            indices.name = index; // First empty column is usually name
        }
        else if (cellStr === '' && indices.date === -1 && indices.name !== -1) {
            indices.date = index; // Second empty is date
        }
        else if (cellStr.includes('hrs') && indices.totalHours === -1) {
            indices.totalHours = index; // First HRS column
        }
        else if (cellStr === '2' || cellStr === '2 times') {
            indices.ot2x = index;
        }
        // Leave and Absent columns - Column J (index 9) and K (index 10)
        // Look for specific patterns or column positions
        else if ((cellStr === 'l' || cellStr === 'leave' || cellStr.includes('ลา') || cellStr.includes('la')) && indices.leave === -1) {
            indices.leave = index;
            console.log('Found Leave column at index:', index);
        }
        else if ((cellStr === 'a' || cellStr === 'absent' || cellStr.includes('ขาด') || cellStr.includes('ab')) && indices.absent === -1) {
            indices.absent = index;
            console.log('Found Absent column at index:', index);
        }
        // Also check by position if columns J and K (9 and 10)
        else if (index === 9 && indices.leave === -1) {
            indices.leave = index;
            console.log('Assigned Leave to column J (index 9)');
        }
        else if (index === 10 && indices.absent === -1) {
            indices.absent = index;
            console.log('Assigned Absent to column K (index 10)');
        }
        // Handle duplicate columns - first occurrence is raw, second is calculated
        else if (cellStr === '1' || cellStr === '1 time') {
            if (!seen1) {
                indices.ot1x = index;
                seen1 = true;
            } else {
                indices.calc1x = index; // Second occurrence is calculated
            }
        }
        else if (cellStr === '1.5' || cellStr.includes('1.5')) {
            if (!seen1_5) {
                indices.ot1_5x = index;
                seen1_5 = true;
            } else {
                indices.calc1_5x = index; // Second occurrence is calculated
            }
        }
        else if (cellStr === '3' || cellStr === '3 times') {
            if (!seen3) {
                indices.ot3x = index;
                seen3 = true;
            } else {
                indices.calc3x = index; // Second occurrence is calculated
            }
        }
    });

    console.log('Final indices:', indices);

    return indices;
}

/**
 * Check if row is a separator (all nulls)
 */
function isSeparatorRow(row) {
    return !row || row.every(cell => !cell || String(cell).trim() === '');
}

/**
 * Check if row is a summary row (Total, Sub-Total, Grand Total)
 */
function isSummaryRow(row, nameIndex) {
    if (!row || !row[nameIndex]) return false;
    const name = String(row[nameIndex]).toLowerCase();
    return name.includes('total') || name.includes('sub-total') || name.includes('grand');
}

/**
 * Extract structured data from raw Excel data
 */
export function extractStructuredData(rawData) {
    const headerRowIndex = findHeaderRow(rawData);

    if (headerRowIndex === -1) {
        throw new Error('Could not find header row in Excel file');
    }

    const headerRow = rawData[headerRowIndex];
    const indices = getColumnIndices(headerRow);

    console.log('Header row found at index:', headerRowIndex);
    console.log('Header row:', headerRow);
    console.log('Column indices:', indices);

    const employees = [];
    let currentEmployee = null;
    let currentDepartment = '';

    // Process data rows (skip header and everything before it)
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];

        // Skip separator rows
        if (isSeparatorRow(row)) {
            continue;
        }

        // Skip summary rows
        if (isSummaryRow(row, indices.name)) {
            continue;
        }

        const nameCell = row[indices.name];
        const dateCell = row[indices.date];

        // Check if this is a department header row
        if (nameCell && String(nameCell).includes(',') && !dateCell) {
            currentDepartment = String(nameCell).split(',')[0].trim();
            continue;
        }

        // Check if this is an employee header row (has ID and name, no date)
        if (nameCell && !dateCell && String(nameCell).match(/^\d+\s+/)) {
            // Save previous employee if exists
            if (currentEmployee) {
                employees.push(currentEmployee);
            }

            // Parse employee info
            const employeeInfo = parseEmployeeInfo(String(nameCell));
            currentEmployee = {
                ...employeeInfo,
                department: currentDepartment,
                dailyRecords: [],
                totals: {
                    totalHours: 0,
                    ot1x: 0,
                    ot1_5x: 0,
                    ot2x: 0,
                    ot3x: 0,
                    leaveDays: 0,
                    absentDays: 0
                }
            };
            continue;
        }

        // This is a daily record row
        if (currentEmployee && dateCell) {
            // Use the calculated OT columns (1_1, 1.5_2, 3_3) instead of raw time columns
            // These columns already have the OT hours calculated
            const leaveValue = row[indices.leave];
            const absentValue = row[indices.absent];

            const record = {
                date: dateCell,
                totalHours: row[indices.totalHours] || null,
                // Use first occurrence columns (22, 23, 25) for OT hours
                ot1x: row[indices.ot1x] || null,      // Column 22 (W)
                ot1_5x: row[indices.ot1_5x] || null,  // Column 23 (X)
                ot2x: row[indices.ot2x] || null,      // Column 24 (Y)
                ot3x: row[indices.ot3x] || null,      // Column 25 (Z)
                leave: leaveValue || null,
                absent: absentValue || null
            };

            // Count leave and absent days
            // Leave: count if column has any value (AL-, BD-, HL-, or just time like 1:00:00)
            // Absent: count if column has any value (could be just time like 1:00:00)

            if (leaveValue !== null && leaveValue !== undefined && leaveValue !== '') {
                const leaveStr = String(leaveValue).trim();
                if (leaveStr.length > 0) {
                    currentEmployee.totals.leaveDays++;
                }
            }

            if (absentValue !== null && absentValue !== undefined && absentValue !== '') {
                const absentStr = String(absentValue).trim();
                if (absentStr.length > 0) {
                    currentEmployee.totals.absentDays++;
                }
            }


            currentEmployee.dailyRecords.push(record);
        }
    }

    // Don't forget the last employee
    if (currentEmployee) {
        employees.push(currentEmployee);
    }

    // Debug: Log final totals
    console.log('=== FINAL EMPLOYEE TOTALS ===');
    employees.forEach(emp => {
        console.log(`${emp.name}: Leave=${emp.totals.leaveDays}, Absent=${emp.totals.absentDays}`);
    });

    return employees;
}

/**
 * Parse employee info from combined string
 * Example: "965  Phongdanai Promprasri  ps_Maintenance Technician-SNACK"
 */
function parseEmployeeInfo(str) {
    const parts = str.split(/\s{2,}/); // Split by 2+ spaces

    return {
        id: parts[0]?.trim() || '',
        name: parts[1]?.trim() || '',
        position: parts[2]?.trim().replace('ps_', '') || ''
    };
}

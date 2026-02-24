import * as XLSX from 'xlsx';

/**
 * Parse Employee Master Data Excel file
 * Columns: B (Employee ID), J (Plant/Division), K (Employee Type), S (Cost Center)
 */
export function parseMasterDataFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to array of arrays
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Parse master data
                const masterData = extractMasterData(rows);

                resolve(masterData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Extract master data from rows
 * Returns a map of employeeId -> { name, position, department, plantDivision, employeeType, team, costCenter }
 */
function extractMasterData(rows) {
    const masterData = {};

    // Find header row (look for "Employee ID" in column B)
    let headerRow = null;
    let dataStartRow = 0;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i];
        if (row && row[1] && String(row[1]).toLowerCase().includes('employee id')) {
            headerRow = row.map(h => h ? String(h).toLowerCase().trim() : '');
            dataStartRow = i + 1;
            break;
        }
    }

    // If no header found, start from row 3 (skip title rows)
    if (dataStartRow === 0) {
        dataStartRow = 3;
    }

    // Auto-detect column indices from header
    let colName = 2;        // default col C
    let colPosition = 3;    // default col D
    let colDepartment = 4;  // default col E
    let colPlant = 9;       // default col J
    let colEmpType = 10;    // default col K
    let colTeam = 11;       // default col L
    let colCostCenter = 18; // default col S

    if (headerRow) {
        headerRow.forEach((h, idx) => {
            if (!h) return;
            if (h.includes('name') && !h.includes('cost') && !h.includes('plant')) colName = idx;
            if (h.includes('position') || h.includes('job title')) colPosition = idx;
            if (h.includes('department') || h.includes('dept')) colDepartment = idx;
            if (h.includes('plant') || h.includes('division')) colPlant = idx;
            if (h.includes('employee type') || h.includes('emp type')) colEmpType = idx;
            if (h.includes('team')) colTeam = idx;
            if (h.includes('cost center')) colCostCenter = idx;
        });
    }

    console.log('Master data starting from row:', dataStartRow);
    console.log('Column mapping:', { colName, colPosition, colDepartment, colPlant, colEmpType, colTeam, colCostCenter });

    // Parse each data row
    for (let i = dataStartRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const employeeId = row[1];
        if (!employeeId) continue;

        const id = String(employeeId).trim();
        if (id && id !== '' && !isNaN(id.charAt(0))) {
            masterData[id] = {
                employeeId: id,
                name: row[colName] ? String(row[colName]).trim() : '',
                position: row[colPosition] ? String(row[colPosition]).trim() : '',
                department: row[colDepartment] ? String(row[colDepartment]).trim() : '',
                plantDivision: row[colPlant] ? String(row[colPlant]).trim() : '',
                employeeType: row[colEmpType] ? String(row[colEmpType]).trim() : '',
                team: row[colTeam] ? String(row[colTeam]).trim() : '',
                costCenter: row[colCostCenter] ? String(row[colCostCenter]).trim() : ''
            };
        }
    }

    console.log('Parsed master data count:', Object.keys(masterData).length);
    console.log('Sample:', Object.entries(masterData).slice(0, 3));

    return masterData;
}

/**
 * Get category for grouping
 */
export function getEmployeeCategory(plantDivision, employeeType) {
    const type = employeeType?.toLowerCase() || '';
    const plant = plantDivision?.toLowerCase() || '';

    // Salaried staff
    if (type.includes('salaried')) {
        if (plant.includes('snack')) {
            return { category: 'Salaried', subCategory: 'Snack Salaried' };
        }
        return { category: 'Salaried', subCategory: 'RTEC Salaried' };
    }

    // Operator
    if (type.includes('operator')) {
        // SNACK operators
        if (plant.includes('snack')) {
            if (plant.includes('engineering')) {
                return { category: 'Permanent Snack', subCategory: 'Engineering-SNACK' };
            }
            if (plant.includes('qfs')) {
                return { category: 'Permanent Snack', subCategory: 'QFS-SNACK' };
            }
            return { category: 'Permanent Snack', subCategory: 'SNACK-Operator' };
        }
        // RTEC operators
        if (plant.includes('engineering')) {
            return { category: 'Permanent RTEC', subCategory: 'Engineering' };
        }
        if (plant.includes('qfs')) {
            return { category: 'Permanent RTEC', subCategory: 'QFS' };
        }
        return { category: 'Permanent RTEC', subCategory: 'RTEC-Operator' };
    }

    // Casual and Temporary
    if (type.includes('casual') || type.includes('temporary')) {
        if (plant.includes('snack')) {
            return { category: 'Subcontract', subCategory: 'Snack-Casual & Cleaner' };
        }
        if (type.includes('temporary')) {
            return { category: 'Subcontract', subCategory: 'Temporary Office' };
        }
        return { category: 'Subcontract', subCategory: 'RTEC-Casual & Cleaner' };
    }

    // Default
    return { category: 'Other', subCategory: plantDivision || 'Unknown' };
}

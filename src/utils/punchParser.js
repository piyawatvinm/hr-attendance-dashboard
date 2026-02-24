import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export async function detectAttendanceFormat(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                let punchLikeRows = 0;
                for (let i = 0; i < Math.min(10, rows.length); i++) {
                    const row = rows[i];
                    if (!row || row.length < 3) continue;
                    const col0 = row[0], col1 = row[1], col2 = row[2];
                    const isNumericId = !isNaN(Number(col0)) && String(col0).length >= 5;
                    const hasDate = col1 instanceof Date || typeof col1 === 'number' ||
                        (typeof col1 === 'string' && /\d+\/\d+\/\d+/.test(col1));
                    const hasTime = col2 instanceof Date || typeof col2 === 'number' ||
                        (typeof col2 === 'string' && /\d+:\d+/.test(col2));
                    if (isNumericId && hasDate && hasTime) punchLikeRows++;
                }
                resolve(punchLikeRows >= 2 ? 'punch' : 'eagle');
            } catch {
                resolve('eagle');
            }
        };
        reader.onerror = () => resolve('eagle');
        reader.readAsArrayBuffer(file);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE FILE
// ─────────────────────────────────────────────────────────────────────────────

export function parsePunchFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // ★ NO cellDates — avoids timezone shifting of Date objects
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                // ★ raw: true (default) — serial numbers stay as numbers, no locale strings
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const punches = [];
                for (const row of rows) {
                    if (!row || row.length < 2) continue;
                    const empId = String(row[0]).trim();
                    if (!empId || isNaN(Number(empId)) || empId.length < 4) continue;

                    const result = extractDateTime(row[1], row[2]);
                    if (!result) continue;

                    punches.push({
                        employeeId: empId,
                        year: result.year,
                        month: result.month,   // 0-based
                        day: result.day,
                        timeMinutes: result.timeMinutes,
                        // Sorting key: absolute minutes from a fixed epoch (no Date object!)
                        sortKey: result.sortKey
                    });
                }

                const employees = groupAndTransform(punches);

                // Debug: log first employee's pairs so user can verify
                if (employees.length > 0) {
                    const emp = employees[0];
                    console.log(`[PunchParser] Employee ${emp.id}: ${emp.dailyRecords.length} sessions`);
                    console.table(emp.dailyRecords.map(r => ({
                        date: r.dateStr,
                        shift: r.shiftType,
                        dayType: r.dayType,
                        clockIn: r.clockIn,
                        clockOut: r.clockOut,
                        normal: r.normalHours,
                        'OT1.5x': r.ot1_5x,
                        'OT3x': r.ot3x,
                        unverified: r._unverified
                    })));
                }

                resolve(employees);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROBUST DATE / TIME EXTRACTION  (timezone-safe — no Date objects from XLSX)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract date + time from raw Excel cell values.
 * Handles: Number (serial), String ("M/D/Y", "H:M:S", "M/D/Y H:M:S"), Date object.
 * Returns: { year, month (0-based), day, timeMinutes, sortKey }
 *   sortKey = day-number * 1440 + timeMinutes  (for sort, no timezone)
 */
function extractDateTime(dateCol, timeCol) {
    let year, month, day;           // date parts
    let hours = 0, minutes = 0, seconds = 0;  // time parts

    // ── Parse column B (date, possibly with embedded time) ───────────────
    if (typeof dateCol === 'number') {
        // Excel serial date (e.g. 46043 = 1/27/2026, 46043.594 = 1/27/2026 14:15)
        const d = XLSX.SSF.parse_date_code(dateCol);
        if (!d) return null;
        year = d.y; month = d.m - 1; day = d.d;
        hours = d.H || 0; minutes = d.M || 0; seconds = d.S || 0;
    } else if (dateCol instanceof Date) {
        // Fallback: Date object (may have timezone issues, but handle it)
        year = dateCol.getFullYear(); month = dateCol.getMonth(); day = dateCol.getDate();
        hours = dateCol.getHours(); minutes = dateCol.getMinutes(); seconds = dateCol.getSeconds();
    } else if (typeof dateCol === 'string') {
        const trimmed = dateCol.trim();
        const spaceIdx = trimmed.indexOf(' ');
        const datePart = spaceIdx > 0 ? trimmed.substring(0, spaceIdx) : trimmed;
        const timePart = spaceIdx > 0 ? trimmed.substring(spaceIdx + 1) : null;

        const dp = datePart.split('/');
        if (dp.length === 3) {
            const [m, d, y] = dp.map(Number);
            if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
            year = y; month = m - 1; day = d;
        } else {
            return null; // can't parse
        }

        if (timePart) {
            const t = parseTimeString(timePart);
            if (t) { hours = t.h; minutes = t.m; seconds = t.s; }
        }
    } else {
        return null;
    }

    // ── Parse column C (time — OVERRIDES time from column B) ─────────────
    if (timeCol !== undefined && timeCol !== null && timeCol !== '') {
        if (typeof timeCol === 'number') {
            // Excel time serial: fraction of a day (e.g. 0.265 = 6:22)
            // Take fractional part only (in case it includes a date component)
            const frac = timeCol % 1;
            const totalSec = Math.round(frac * 86400);
            hours = Math.floor(totalSec / 3600);
            minutes = Math.floor((totalSec % 3600) / 60);
            seconds = totalSec % 60;
        } else if (timeCol instanceof Date) {
            // Fallback
            hours = timeCol.getHours(); minutes = timeCol.getMinutes(); seconds = timeCol.getSeconds();
        } else if (typeof timeCol === 'string') {
            const t = parseTimeString(timeCol);
            if (t) { hours = t.h; minutes = t.m; seconds = t.s; }
        }
    }

    if (year === undefined) return null;

    const timeMinutes = hours * 60 + minutes + seconds / 60;

    // Absolute sort key: days-from-an-epoch * 1440 + timeMinutes
    // Using a simple Julian-like day number (no Date object → no timezone)
    const dayNumber = julianDay(year, month + 1, day); // month is 1-based for julianDay
    const sortKey = dayNumber * 1440 + timeMinutes;

    return { year, month, day, timeMinutes, sortKey };
}

/**
 * Simple day-number calculation for sorting purposes.
 * month is 1-based (1=Jan).
 */
function julianDay(y, m, d) {
    // Simplified: just need a monotonic day count
    return y * 366 + m * 31 + d;
}

/**
 * Parse time string: "6:23:34", "06:23", "12:04:13 AM", "6:23:34 PM"
 * Returns { h, m, s } in 24-hour format.
 */
function parseTimeString(str) {
    if (!str) return null;
    const trimmed = str.trim().toUpperCase();
    const isPM = trimmed.includes('PM');
    const isAM = trimmed.includes('AM');
    const clean = trimmed.replace(/\s*(AM|PM)\s*/i, '').trim();
    const parts = clean.split(':').map(Number);
    if (parts.length < 2 || parts.some(isNaN)) return null;
    let h = parts[0], m = parts[1], s = parts[2] || 0;
    if (isAM && h === 12) h = 0;
    if (isPM && h !== 12) h += 12;
    return { h, m, s };
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function minutesToHHMM(minutes) {
    const m = Math.round(minutes) % 1440;
    const norm = m < 0 ? m + 1440 : m;
    return `${Math.floor(norm / 60)}:${String(norm % 60).padStart(2, '0')}`;
}

/** Build a JS Date from y/m/d (for getDayType & display only) */
function makeDate(year, month, day) {
    return new Date(year, month, day);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIFT DETECTION & SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

function getDayType(date) {
    const dow = date.getDay(); // 0=Sun, 6=Sat
    return (dow === 5 || dow === 6 || dow === 0) ? 'fri-sun' : 'weekday';
}

function detectShift(clockInMinutes) {
    if (clockInMinutes >= 180 && clockInMinutes < 660) return 'Morning';    // 03:00–10:59
    if (clockInMinutes >= 660 && clockInMinutes < 1080) return 'Afternoon';  // 11:00–17:59
    return 'Night';                                                           // 18:00–02:59
}

function getShiftSchedule(plant, dayType, shiftType) {
    const isSnack = plant && plant.toLowerCase().includes('snack');

    if (!isSnack) {
        if (dayType === 'weekday') {
            if (shiftType === 'Morning') return { otBefore: [220, 400], normal: [420, 960], otAfter: [980, 1160] };
            if (shiftType === 'Afternoon') return { otBefore: [660, 880], normal: [900, 1380], otAfter: [1400, 1580] };
            if (shiftType === 'Night') return { otBefore: [1140, 1360], normal: [1380, 1920], otAfter: [1940, 2120] };
        }
        if (dayType === 'fri-sun') {
            if (shiftType === 'Morning') return { otBefore: null, normal: [420, 960], otAfter: [980, 1160] };
            if (shiftType === 'Night') return { otBefore: [1140, 1360], normal: [1380, 1880], otAfter: null };
        }
    } else {
        if (shiftType === 'Morning') return { otBefore: null, normal: [420, 960], otAfter: [980, 1160] };
        if (shiftType === 'Night') return { otBefore: [1140, 1360], normal: [1380, 1880], otAfter: null };
    }
    return { otBefore: [220, 400], normal: [420, 960], otAfter: [980, 1160] };
}

// ─────────────────────────────────────────────────────────────────────────────
// OT CALCULATION (All-or-Nothing per Period)
// ─────────────────────────────────────────────────────────────────────────────
// Each OT period is a single block. Employee must cover the ENTIRE period:
//   OT Before: clockIn  <= period START → full period duration as OT
//   OT After:  clockOut >= period END   → full period duration as OT
// OT hours = exact period duration (e.g. 220 min = 3h 40m)

function calculateOT(clockInMin, clockOutMin, schedule, dayType) {
    const { otBefore, normal, otAfter } = schedule;
    const isWeekend = dayType === 'fri-sun';
    let normalHours = 0, otWeekdayMin = 0, otWeekendMin = 0;

    // Normal hours
    if (normal && clockInMin < normal[1] && clockOutMin > normal[0]) {
        normalHours = (normal[1] - normal[0]) / 60;
    }

    // OT Before: must clock in ≤ period START to get full period
    if (otBefore && clockInMin <= otBefore[0]) {
        const periodMin = otBefore[1] - otBefore[0];
        isWeekend ? (otWeekendMin += periodMin) : (otWeekdayMin += periodMin);
    }

    // OT After: must clock out ≥ period END to get full period
    if (otAfter && clockOutMin >= otAfter[1]) {
        const periodMin = otAfter[1] - otAfter[0];
        isWeekend ? (otWeekendMin += periodMin) : (otWeekdayMin += periodMin);
    }

    return { normalHours, ot1_5x: otWeekdayMin / 60, ot3x: otWeekendMin / 60 };
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION-BASED PAIRING
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. Sort all punches by sortKey (absolute day*1440 + timeMinutes — NO timezone)
// 2. Pair: #1=IN, #2=OUT, #3=IN, #4=OUT …
// 3. Work date = date of the IN punch
// 4. clockOutMin = clockInMin + duration (handles cross-midnight)
// 5. Duration > 18h → flag _unverified
// 6. Odd punch → _unverified

const MAX_SHIFT_MIN = 18 * 60;

function groupAndTransform(punches) {
    const byEmp = {};
    for (const p of punches) {
        if (!byEmp[p.employeeId]) byEmp[p.employeeId] = [];
        byEmp[p.employeeId].push(p);
    }

    const employees = [];

    for (const [empId, allPunches] of Object.entries(byEmp)) {
        // ★ Sort by sortKey (timezone-free absolute minutes)
        allPunches.sort((a, b) => a.sortKey - b.sortKey);

        const dailyRecords = [];

        for (let i = 0; i + 1 < allPunches.length; i += 2) {
            const inP = allPunches[i];
            const outP = allPunches[i + 1];

            // Work date = date of IN punch
            const workDate = makeDate(inP.year, inP.month, inP.day);
            const clockInMin = inP.timeMinutes;

            // Duration from sortKey difference → handles cross-midnight correctly
            const durationMin = outP.sortKey - inP.sortKey;
            const clockOutMin = clockInMin + durationMin;

            const isSuspicious = durationMin > MAX_SHIFT_MIN || durationMin < 0;

            const shiftType = detectShift(clockInMin);
            const dayType = getDayType(workDate);
            const schedule = getShiftSchedule('RTEC', dayType, shiftType);
            const { normalHours, ot1_5x, ot3x } = isSuspicious
                ? { normalHours: 0, ot1_5x: 0, ot3x: 0 }
                : calculateOT(clockInMin, clockOutMin, schedule, dayType);

            // Display clock-out
            const crossDay = (outP.year !== inP.year || outP.month !== inP.month || outP.day !== inP.day);
            const clockOutDisplay = crossDay
                ? minutesToHHMM(outP.timeMinutes) + ' (+1)'
                : minutesToHHMM(outP.timeMinutes);

            dailyRecords.push({
                date: workDate,
                dateStr: `${inP.day}/${inP.month + 1}/${inP.year}`,
                workDays: isSuspicious ? 0 : 1,
                leaveDays: 0, sickLeaveDays: 0, absentDays: 0,
                ot1x: 0,
                ot1_5x: Math.round(ot1_5x * 100) / 100,
                ot2x: 0,
                ot3x: Math.round(ot3x * 100) / 100,
                clockIn: minutesToHHMM(clockInMin),
                clockOut: clockOutDisplay,
                shiftType, dayType,
                normalHours: Math.round(normalHours * 100) / 100,
                _clockInMin: clockInMin,
                _clockOutMin: clockOutMin,
                _unverified: isSuspicious
            });
        }

        // Odd punch → unpaired
        if (allPunches.length % 2 !== 0) {
            const last = allPunches[allPunches.length - 1];
            const lastDate = makeDate(last.year, last.month, last.day);
            dailyRecords.push({
                date: lastDate,
                dateStr: `${last.day}/${last.month + 1}/${last.year}`,
                workDays: 1,
                leaveDays: 0, sickLeaveDays: 0, absentDays: 0,
                ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0,
                clockIn: minutesToHHMM(last.timeMinutes),
                clockOut: '—',
                shiftType: detectShift(last.timeMinutes),
                dayType: getDayType(lastDate),
                normalHours: 0,
                _clockInMin: last.timeMinutes,
                _clockOutMin: last.timeMinutes,
                _unverified: true
            });
        }

        dailyRecords.sort((a, b) => a.date - b.date);

        const totals = buildTotals(dailyRecords);

        employees.push({
            id: empId,
            name: '', position: '', department: '',
            plantDivision: '', employeeType: '', team: '', costCenter: '',
            category: '', subCategory: '',
            _isPunchFormat: true,
            _dailyRaw: dailyRecords.map(r => ({
                date: r.date,
                clockInMin: r._clockInMin,
                clockOutMin: r._clockOutMin,
                clockIn: r.clockIn,
                clockOut: r.clockOut,
                shiftType: r.shiftType,
                dayType: r.dayType,
                _unverified: r._unverified
            })),
            dailyRecords,
            totals
        });
    }

    return employees;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOTALS BUILDER (shared)
// ─────────────────────────────────────────────────────────────────────────────

function buildTotals(dailyRecords) {
    const totals = dailyRecords.reduce((acc, r) => ({
        daysWorked: acc.daysWorked + (r._unverified ? 0 : r.workDays),
        leaveDays: acc.leaveDays + (r.leaveDays || 0),
        sickLeaveDays: acc.sickLeaveDays + (r.sickLeaveDays || 0),
        absentDays: acc.absentDays + (r.absentDays || 0),
        ot1x: acc.ot1x + (r._unverified ? 0 : (r.ot1x || 0)),
        ot1_5x: acc.ot1_5x + (r._unverified ? 0 : (r.ot1_5x || 0)),
        ot2x: acc.ot2x + (r._unverified ? 0 : (r.ot2x || 0)),
        ot3x: acc.ot3x + (r._unverified ? 0 : (r.ot3x || 0)),
    }), {
        daysWorked: 0, leaveDays: 0, sickLeaveDays: 0, absentDays: 0,
        ot1x: 0, ot1_5x: 0, ot2x: 0, ot3x: 0
    });

    totals.totalOT = totals.ot1x + totals.ot1_5x + totals.ot2x + totals.ot3x;
    totals.workingHours = dailyRecords
        .filter(r => !r._unverified)
        .reduce((s, r) => s + (r.normalHours || 0), 0);
    totals.totalWorkingHours = Math.round((totals.workingHours + totals.totalOT) * 100) / 100;
    totals.workingHours = Math.round(totals.workingHours * 100) / 100;

    return totals;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECALCULATE OT AFTER MASTER DATA
// ─────────────────────────────────────────────────────────────────────────────

export function recalculatePunchOT(employees) {
    return employees.map(emp => {
        if (!emp._isPunchFormat || !emp._dailyRaw) return emp;

        const plant = emp.plantDivision || 'RTEC';

        const newDaily = emp._dailyRaw.map((raw, i) => {
            const old = emp.dailyRecords[i];
            if (raw._unverified) return { ...old };

            const schedule = getShiftSchedule(plant, raw.dayType, raw.shiftType);
            const { normalHours, ot1_5x, ot3x } = calculateOT(
                raw.clockInMin, raw.clockOutMin, schedule, raw.dayType
            );

            return {
                ...old,
                normalHours: Math.round(normalHours * 100) / 100,
                ot1_5x: Math.round(ot1_5x * 100) / 100,
                ot3x: Math.round(ot3x * 100) / 100
            };
        });

        const totals = buildTotals(newDaily);
        return { ...emp, dailyRecords: newDaily, totals };
    });
}

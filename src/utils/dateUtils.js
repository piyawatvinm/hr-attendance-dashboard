// Utility functions for date and time operations

/**
 * Convert Excel datetime (stored as 12/31/1899 with time) to hours
 * Example: "12/31/1899 3:00:00 AM" -> 3.0
 * Example: "12/31/1899 10:00:00 AM" -> 10.0
 * Excel stores times as decimal fractions (0.125 = 3 hours)
 */
export function excelTimeToHours(excelDate) {
    if (!excelDate && excelDate !== 0) return 0;

    console.log('excelTimeToHours input:', excelDate, 'type:', typeof excelDate);

    // If it's a number between 0 and 1, it's an Excel time fraction
    // Excel stores time as decimal: 0.125 = 3 hours (3/24)
    if (typeof excelDate === 'number') {
        // If it's a small decimal (< 1), it's a time fraction
        if (excelDate < 1 && excelDate >= 0) {
            const hours = excelDate * 24;
            console.log('  -> Converted from fraction:', hours);
            return hours;
        }
        // If it's a larger number, it might be Excel serial date
        // Extract just the time portion (fractional part)
        if (excelDate >= 1) {
            const timeFraction = excelDate - Math.floor(excelDate);
            const hours = timeFraction * 24;
            console.log('  -> Converted from serial date:', hours);
            return hours;
        }
        return excelDate;
    }

    // If it's a Date object
    if (excelDate instanceof Date) {
        const hours = excelDate.getHours();
        const minutes = excelDate.getMinutes();
        const result = hours + (minutes / 60);
        console.log('  -> Converted from Date object:', result);
        return result;
    }

    // If it's a string, try to parse it
    if (typeof excelDate === 'string') {
        // Try parsing as a date string
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const result = hours + (minutes / 60);
            console.log('  -> Converted from string:', result);
            return result;
        }
    }

    console.log('  -> Could not convert, returning 0');
    return 0;
}

/**
 * Parse date string from Eagle System format
 * Example: "16/12/2025  Tue" -> Date object
 */
export function parseEagleDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // Remove day name and extra spaces
    const cleanDate = dateStr.split('  ')[0].trim();

    // Parse DD/MM/YYYY format
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }

    return null;
}

/**
 * Format date for display
 */
export function formatDate(date) {
    if (!date) return '';
    if (!(date instanceof Date)) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Format hours to display (e.g., 3.5 -> "3:30")
 */
export function formatHours(hours) {
    if (!hours || hours === 0) return '0:00';

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Parse day value from time format in Work/Leave/Absent columns
 * Examples:
 *   "1:00:00" -> 1.0 (full day)
 *   "0:04:00" -> 0.5 (half day)
 *   "SL-0:04:00" -> 0.5 (half day sick leave, prefix stripped)
 *   "AL-1:00:00" -> 1.0 (full day annual leave, prefix stripped)
 *   Excel time fraction 0.0416... -> 1.0 (full day)
 *   Excel time fraction 0.00277... -> 0.5 (half day - 4 minutes)
 */
export function parseDayValue(value) {
    if (!value && value !== 0) return 0;

    // If it's a number (Excel time fraction)
    if (typeof value === 'number') {
        // Excel stores time as fraction of 24 hours
        // 1:00:00 = 1/24 = 0.0416667
        // 0:04:00 = 4 minutes = 4/(24*60) = 0.00277778
        const hours = value * 24;

        // 1 hour = 1 day worked
        if (hours >= 0.9) return 1;
        // Around 4 minutes (0.0667 hours) = half day
        if (hours > 0 && hours < 0.9) return 0.5;
        return 0;
    }

    // If it's a string
    if (typeof value === 'string') {
        let timeStr = value.trim();

        // Strip prefix like "SL-", "AL-", "BD-", "HL-" etc.
        const prefixMatch = timeStr.match(/^[A-Z]+-(.+)$/);
        if (prefixMatch) {
            timeStr = prefixMatch[1];
        }

        // Parse HH:MM:SS or H:MM:SS format
        const timeMatch = timeStr.match(/^(\d+):(\d+):(\d+)$/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);

            // 1:00:00 = 1 day
            if (hours >= 1) return 1;
            // 0:04:00 = half day (4 minutes)
            if (minutes === 4 || (minutes > 0 && minutes < 30)) return 0.5;
            if (hours === 0 && minutes === 0) return 0;
            return 0.5; // Default for any other small time
        }

        // If just has content but doesn't match pattern, count as 1
        if (timeStr.length > 0) return 1;
    }

    // If it's a Date object
    if (value instanceof Date) {
        const hours = value.getHours();
        const minutes = value.getMinutes();

        if (hours >= 1) return 1;
        if (minutes === 4) return 0.5;
        if (hours === 0 && minutes === 0) return 0;
        return 0.5;
    }

    return 0;
}

/**
 * Parse leave value and determine if it's Sick Leave or regular Leave
 * SL- prefix = Sick Leave, everything else = regular Leave
 * @returns {{ isSickLeave: boolean, days: number }}
 */
export function parseLeaveType(value) {
    if (!value && value !== 0) return { isSickLeave: false, days: 0 };

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const isSickLeave = /^SL-/i.test(trimmed);
        const days = parseDayValue(value);
        return { isSickLeave, days };
    }

    // For non-string values, treat as regular leave
    const days = parseDayValue(value);
    return { isSickLeave: false, days };
}

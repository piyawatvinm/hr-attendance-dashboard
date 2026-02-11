import { useState } from 'react';
import './EmployeeTable.css';
import { formatHours } from '../utils/dateUtils';

export default function EmployeeTable({ employees }) {
    const [sortField, setSortField] = useState('totalOT');
    const [sortDirection, setSortDirection] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);


    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.plantDivision && emp.plantDivision.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.employeeType && emp.employeeType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.category && emp.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        let aVal, bVal;

        switch (sortField) {
            case 'name':
                aVal = a.name;
                bVal = b.name;
                break;
            case 'position':
                aVal = a.position;
                bVal = b.position;
                break;
            case 'totalHours':
                aVal = a.totals.totalHours;
                bVal = b.totals.totalHours;
                break;
            case 'totalOT':
                aVal = a.totals.totalOT;
                bVal = b.totals.totalOT;
                break;
            case 'leaveDays':
                aVal = a.totals.leaveDays || 0;
                bVal = b.totals.leaveDays || 0;
                break;
            case 'absentDays':
                aVal = a.totals.absentDays || 0;
                bVal = b.totals.absentDays || 0;
                break;
            case 'plantDivision':
                aVal = a.plantDivision || '';
                bVal = b.plantDivision || '';
                break;
            case 'employeeType':
                aVal = a.employeeType || '';
                bVal = b.employeeType || '';
                break;
            case 'category':
                aVal = a.category || '';
                bVal = b.category || '';
                break;
            case 'costCenter':
                aVal = a.costCenter || '';
                bVal = b.costCenter || '';
                break;
            default:
                aVal = a.totals.totalOT;
                bVal = b.totals.totalOT;
        }

        if (typeof aVal === 'string') {
            return sortDirection === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        } else {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedEmployees.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex);

    return (
        <div className="employee-table-container">
            <div className="table-header">
                <h3>Employee Details</h3>
                <input
                    type="text"
                    placeholder="Search by name, ID, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="table-wrapper">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')} className="sortable">
                                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>ID</th>
                            <th onClick={() => handleSort('position')} className="sortable">
                                Position {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('plantDivision')} className="sortable">
                                Plant/Division {sortField === 'plantDivision' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('employeeType')} className="sortable">
                                Employee Type {sortField === 'employeeType' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('category')} className="sortable">
                                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('costCenter')} className="sortable">
                                Cost Center {sortField === 'costCenter' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalHours')} className="sortable">
                                Days Worked {sortField === 'totalHours' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalOT')} className="sortable">
                                Total OT {sortField === 'totalOT' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>OT 1x</th>
                            <th>OT 1.5x</th>
                            <th>OT 2x</th>
                            <th>OT 3x</th>
                            <th onClick={() => handleSort('leaveDays')} className="sortable">
                                Leave {sortField === 'leaveDays' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('absentDays')} className="sortable">
                                Absent {sortField === 'absentDays' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEmployees.map((emp, index) => (
                            <tr key={emp.id} className="fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                                <td className="employee-name">{emp.name}</td>
                                <td className="employee-id">{emp.id}</td>
                                <td className="employee-position">{emp.position}</td>
                                <td>{emp.plantDivision || '-'}</td>
                                <td>{emp.employeeType || '-'}</td>
                                <td>{emp.category || '-'}</td>
                                <td>{emp.costCenter || '-'}</td>
                                <td>{emp.totals.totalHours}</td>
                                <td className="highlight">{formatHours(emp.totals.totalOT)}</td>
                                <td>{formatHours(emp.totals.ot1x)}</td>
                                <td>{formatHours(emp.totals.ot1_5x)}</td>
                                <td>{formatHours(emp.totals.ot2x)}</td>
                                <td>{formatHours(emp.totals.ot3x)}</td>
                                <td className={emp.totals.leaveDays > 0 ? 'highlight-warning' : ''}>{emp.totals.leaveDays || 0}</td>
                                <td className={emp.totals.absentDays > 0 ? 'highlight-danger' : ''}>{emp.totals.absentDays || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <div className="pagination-info">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedEmployees.length)} of {sortedEmployees.length} employees
                </div>
                <div className="pagination-controls">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        ««
                    </button>
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        ‹
                    </button>
                    <span className="pagination-pages">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        ›
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        »»
                    </button>
                </div>
            </div>
        </div>
    );
}

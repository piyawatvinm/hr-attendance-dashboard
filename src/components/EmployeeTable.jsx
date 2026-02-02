import { useState } from 'react';
import './EmployeeTable.css';
import { formatHours } from '../utils/dateUtils';

export default function EmployeeTable({ employees }) {
    const [sortField, setSortField] = useState('totalOT');
    const [sortDirection, setSortDirection] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');

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
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <th onClick={() => handleSort('totalHours')} className="sortable">
                                Total Hours {sortField === 'totalHours' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalOT')} className="sortable">
                                Total OT {sortField === 'totalOT' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>OT 1x</th>
                            <th>OT 1.5x</th>
                            <th>OT 2x</th>
                            <th>OT 3x</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEmployees.map((emp, index) => (
                            <tr key={emp.id} className="fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                                <td className="employee-name">{emp.name}</td>
                                <td>{emp.id}</td>
                                <td>{emp.position}</td>
                                <td>{formatHours(emp.totals.totalHours)}</td>
                                <td className="highlight">{formatHours(emp.totals.totalOT)}</td>
                                <td>{formatHours(emp.totals.ot1x)}</td>
                                <td>{formatHours(emp.totals.ot1_5x)}</td>
                                <td>{formatHours(emp.totals.ot2x)}</td>
                                <td>{formatHours(emp.totals.ot3x)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                Showing {sortedEmployees.length} of {employees.length} employees
            </div>
        </div>
    );
}

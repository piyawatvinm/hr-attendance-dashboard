import React from 'react';
import './SummaryTable.css';

function SummaryTable({ summaryRows }) {
    if (!summaryRows || summaryRows.length === 0) {
        return (
            <div className="summary-table-container">
                <div className="table-header">
                    <h2>📊 Summary by Department</h2>
                </div>
                <p className="no-data">Upload Master Data file to see summary by department</p>
            </div>
        );
    }

    const formatNumber = (num) => {
        if (num === 0 || num === undefined || num === null) return '-';
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatHeadcount = (num) => {
        if (num === 0 || num === undefined || num === null) return '-';
        return num.toLocaleString('en-US');
    };

    return (
        <div className="summary-table-container">
            <h2>📊 Summary by Department</h2>
            <div className="table-wrapper">
                <table className="summary-table">
                    <thead>
                        <tr>
                            <th>Employee Type</th>
                            <th>Department</th>
                            <th>Headcount</th>
                            <th>OT x1 (Holiday)</th>
                            <th>OT x1.5</th>
                            <th>OT x2</th>
                            <th>OT x3 (Holiday)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryRows.map((row, index) => {
                            if (row.type === 'data') {
                                return (
                                    <tr key={index} className="data-row">
                                        <td>{row.employeeType}</td>
                                        <td>{row.department}</td>
                                        <td className="number">{formatHeadcount(row.headcount)}</td>
                                        <td className="number">{formatNumber(row.ot1x)}</td>
                                        <td className="number">{formatNumber(row.ot1_5x)}</td>
                                        <td className="number">{formatNumber(row.ot2x)}</td>
                                        <td className="number">{formatNumber(row.ot3x)}</td>
                                    </tr>
                                );
                            } else if (row.type === 'subtotal') {
                                return (
                                    <tr key={index} className="subtotal-row">
                                        <td></td>
                                        <td className="subtotal-label">{row.label}</td>
                                        <td className="number bold">{formatHeadcount(row.headcount)}</td>
                                        <td className="number bold">{formatNumber(row.ot1x)}</td>
                                        <td className="number bold">{formatNumber(row.ot1_5x)}</td>
                                        <td className="number bold">{formatNumber(row.ot2x)}</td>
                                        <td className="number bold">{formatNumber(row.ot3x)}</td>
                                    </tr>
                                );
                            } else if (row.type === 'grandtotal') {
                                return (
                                    <tr key={index} className="grandtotal-row">
                                        <td></td>
                                        <td className="grandtotal-label">{row.label}</td>
                                        <td className="number bold">{formatHeadcount(row.headcount)}</td>
                                        <td className="number bold">{formatNumber(row.ot1x)}</td>
                                        <td className="number bold">{formatNumber(row.ot1_5x)}</td>
                                        <td className="number bold">{formatNumber(row.ot2x)}</td>
                                        <td className="number bold">{formatNumber(row.ot3x)}</td>
                                    </tr>
                                );
                            }
                            return null;
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SummaryTable;

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, LineChart, Cell, AreaChart, Area, LabelList } from 'recharts';
import './DepartmentCompliance.css';

export default function DepartmentCompliance({ stats, employees }) {
    // selectedDept: null means "All Departments Overview"
    const [selectedDept, setSelectedDept] = useState(null);
    const [activeTab, setActiveTab] = useState('headcount');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [empSortField, setEmpSortField] = useState('totalOT');
    const [empSortDirection, setEmpSortDirection] = useState('desc');

    // Reset filters when changing department
    useEffect(() => {
        setSelectedTeam(null);
        setSelectedDay(null);
        setEmpSortField('totalOT');
        setEmpSortDirection('desc');
    }, [selectedDept]);

    const handleEmpSort = (field) => {
        if (empSortField === field) {
            setEmpSortDirection(empSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setEmpSortField(field);
            setEmpSortDirection('desc');
        }
    };

    // List of unique departments from stats
    const uniqueDepts = stats ? stats.map(s => s.department) : [];

    if (!stats || stats.length === 0) {
        return (
            <div className="department-compliance-empty">
                No department compliance data available. Please upload Master Data to categorize by department.
            </div>
        );
    }

    // --- OVERVIEW DATA AGGREGATION ---
    const overviewChartData = stats.map(s => ({
        name: s.department.length > 15 ? `${s.department.slice(0, 12)}...` : s.department,
        fullName: s.department,
        'Total Headcount': s.headcount,
        'Exceeded 60 Hrs': s.violatorsCount,
        'Total Hours': Math.round(s.totalHours),
        'Excess Hours (>60)': Math.round(s.excessHours)
    }));

    const totalDepts = stats.length;
    const totalViolators = stats.reduce((sum, s) => sum + s.violatorsCount, 0);
    const totalExcessHours = Math.round(stats.reduce((sum, s) => sum + s.excessHours, 0));
    const criticalDept = stats.length > 0 ? stats[0] : null; // Sorted by violatorsCount desc in utils

    // --- DRILL-DOWN DEPARTMENT DATA AGGREGATION ---
    const activeDept = selectedDept;
    const activeDeptStats = stats.find(s => s.department === activeDept) || { violatorsCount: 0, excessHours: 0, headcount: 0 };
    const deptEmployees = employees && activeDept ? employees.filter(emp => emp.department === activeDept) : [];

    // 1. Shift Aggregation
    const shiftDataMap = {
        Morning: { name: 'Morning Shift', ot: 0, violators: 0, color: '#475569' },
        Afternoon: { name: 'Afternoon Shift', ot: 0, violators: 0, color: '#64748B' },
        Night: { name: 'Night Shift', ot: 0, violators: 0, color: '#E40029' },
        Unknown: { name: 'Not Specified', ot: 0, violators: 0, color: '#94A3B8' }
    };

    // Shift Team (A, B, C, D) Aggregation
    const teamDataMap = {
        'A': { name: 'Team A', ot: 0 },
        'B': { name: 'Team B', ot: 0 },
        'C': { name: 'Team C', ot: 0 },
        'D': { name: 'Team D', ot: 0 },
        'Unknown': { name: 'No Team', ot: 0 }
    };

    // 2. Day of Week Aggregation (Mon-Sun)
    const dayOfWeekData = [
        { name: 'Mon', fullName: 'Monday', ot: 0 },
        { name: 'Tue', fullName: 'Tuesday', ot: 0 },
        { name: 'Wed', fullName: 'Wednesday', ot: 0 },
        { name: 'Thu', fullName: 'Thursday', ot: 0 },
        { name: 'Fri', fullName: 'Friday', ot: 0 },
        { name: 'Sat', fullName: 'Saturday', ot: 0 },
        { name: 'Sun', fullName: 'Sunday', ot: 0 }
    ];

    // 3. Daily Timeline Aggregation
    const dailyOTMap = {};
    let hasShiftData = false;

    if (activeDept) {
        deptEmployees.forEach(emp => {
            const empTeam = emp.team ? String(emp.team).toUpperCase().trim() : 'Unknown';
            
            emp.dailyRecords.forEach(record => {
                if (!record.date) return;
                const otHours = record.totalOT !== undefined ? record.totalOT : ((record.ot1_5x || 0) + (record.ot1x || 0) + (record.ot2x || 0) + (record.ot3x || 0));

                // Day of Week mapping
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = days[record.date.getDay()];

                const matchesTeamFilter = !selectedTeam || empTeam === selectedTeam;
                const matchesDayFilter = !selectedDay || dayName === selectedDay;

                // Add to team aggregation (only filtered by selected day)
                if (matchesDayFilter) {
                    const tKey = teamDataMap[empTeam] ? empTeam : 'Unknown';
                    teamDataMap[tKey].ot += otHours;
                }

                // Day of Week aggregation (only filtered by selected team)
                if (matchesTeamFilter) {
                    const dayIdx = record.date.getDay();
                    const uiIdx = dayIdx === 0 ? 6 : dayIdx - 1;
                    if (dayOfWeekData[uiIdx]) {
                        dayOfWeekData[uiIdx].ot += otHours;
                    }
                }

                // Daily timeline (must match both filters)
                if (matchesTeamFilter && matchesDayFilter) {
                    const dayNum = record.date.getDate();
                    const monthStr = record.date.toLocaleDateString('en-US', { month: 'short' });
                    const dateStr = dayNum + ' ' + monthStr;
                    const sortKey = record.date.getTime();

                    if (!dailyOTMap[dateStr]) {
                        dailyOTMap[dateStr] = { name: dateStr, sortKey, OT: 0 };
                    }
                    dailyOTMap[dateStr].OT += otHours;
                }
            });
        });
    }

    // Filter employees for the details table
    const tableEmployees = activeDept ? deptEmployees.filter(emp => {
        if (selectedTeam) {
            const empTeam = emp.team ? String(emp.team).toUpperCase().trim() : 'Unknown';
            if (empTeam !== selectedTeam) return false;
        }
        if (selectedDay) {
            const workedOnDay = emp.dailyRecords.some(record => {
                if (!record.date) return false;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = days[record.date.getDay()];
                const otHours = record.totalOT !== undefined ? record.totalOT : ((record.ot1_5x || 0) + (record.ot1x || 0) + (record.ot2x || 0) + (record.ot3x || 0));
                return dayName === selectedDay && otHours > 0;
            });
            if (!workedOnDay) return false;
        }
        return true;
    }) : [];

    const sortedTableEmployees = [...tableEmployees].sort((a, b) => {
        let aVal, bVal;
        switch (empSortField) {
            case 'id':
                aVal = parseInt(a.id, 10) || 0;
                bVal = parseInt(b.id, 10) || 0;
                break;
            case 'name':
                aVal = a.name || '';
                bVal = b.name || '';
                break;
            case 'position':
                aVal = a.position || '';
                bVal = b.position || '';
                break;
            case 'team':
                aVal = a.team || '';
                bVal = b.team || '';
                break;
            case 'totalOT':
                aVal = a.totals?.totalOT || 0;
                bVal = b.totals?.totalOT || 0;
                break;
            case 'totalWorkingHours':
                aVal = a.totals?.totalWorkingHours || 0;
                bVal = b.totals?.totalWorkingHours || 0;
                break;
            case 'status':
                aVal = (a.totals?.totalWorkingHours > 60) ? 1 : 0;
                bVal = (b.totals?.totalWorkingHours > 60) ? 1 : 0;
                break;
            default:
                aVal = a.totals?.totalOT || 0;
                bVal = b.totals?.totalOT || 0;
        }

        if (typeof aVal === 'string') {
            return empSortDirection === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        } else {
            return empSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
    });

    const shiftData = Object.values(shiftDataMap)
        .map(s => ({
            ...s,
            ot: Math.round(s.ot * 10) / 10
        }))
        .filter(s => s.ot > 0 || (s.name === 'Not Specified' && !hasShiftData));

    dayOfWeekData.forEach(d => {
        d.ot = Math.round(d.ot * 10) / 10;
    });

    const teamData = Object.values(teamDataMap)
        .map(t => ({
            ...t,
            ot: Math.round(t.ot * 10) / 10
        }))
        .filter(t => t.ot > 0);

    const dailyTimelineData = Object.values(dailyOTMap)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(d => ({
            name: d.name,
            'OT Hours': Math.round(d.OT * 10) / 10
        }));

    // Identify vulnerable Day and Shift
    let maxDay = { name: '-', ot: 0 };
    dayOfWeekData.forEach(d => {
        if (d.ot > maxDay.ot) maxDay = d;
    });

    let maxTeam = { name: '-', ot: 0 };
    teamData.forEach(t => {
        if (t.ot > maxTeam.ot) maxTeam = t;
    });

    // Handle selection changes
    const handleDeptChange = (e) => {
        const value = e.target.value;
        if (value === 'ALL') {
            setSelectedDept(null);
        } else {
            setSelectedDept(value);
        }
    };

    // Smooth scroll to table helper
    const handleRowClick = (deptName) => {
        setSelectedDept(deptName);
        const cardElement = document.querySelector('.compliance-dashboard-panel');
        if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="department-compliance">
            
            {/* --- SINGLE UNIFIED COMPLIANCE PANEL --- */}
            <div className="compliance-dashboard-panel">
                <div className="rca-header">
                    <div className="rca-header-left">
                        <div className="panel-title-row">
                            {selectedDept && (
                                <button className="back-btn" onClick={() => setSelectedDept(null)}>
                                    ← Overview
                                </button>
                            )}
                            <h3>
                                {selectedDept 
                                    ? `🔍 ${selectedDept} - Compliance Drill-down` 
                                    : '📊 Department Compliance & Excess Hours'}
                            </h3>
                        </div>
                        <p className="chart-subtitle">
                            {selectedDept 
                                ? `Analyzing shifts and weekday overtime spikes to locate root cause of weekly limit alerts`
                                : 'Overview of headcount, weekly limit alerts, and overtime hours across all departments. Click any bar or table row below to drill down.'}
                        </p>
                        {selectedDept && (selectedTeam || selectedDay) && (
                            <div className="active-filters-row">
                                <span className="filter-label">Active Filters:</span>
                                {selectedTeam && (
                                    <span className="filter-badge" onClick={() => setSelectedTeam(null)}>
                                        Team {selectedTeam} <span className="remove-filter">×</span>
                                    </span>
                                )}
                                {selectedDay && (
                                    <span className="filter-badge" onClick={() => setSelectedDay(null)}>
                                        {selectedDay} <span className="remove-filter">×</span>
                                    </span>
                                )}
                                <button className="clear-all-filters-btn" onClick={() => { setSelectedTeam(null); setSelectedDay(null); }}>
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="rca-select-wrapper">
                        <label htmlFor="dept-select">Analysis Scope: </label>
                        <select 
                            id="dept-select" 
                            className="dept-select"
                            value={selectedDept || 'ALL'} 
                            onChange={handleDeptChange}
                        >
                            <option value="ALL">🏢 All Departments (Overview)</option>
                            {uniqueDepts.map((d, i) => (
                                <option key={i} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="rca-stats-grid">
                    {!selectedDept ? (
                        <>
                            <div className="rca-stat-card border-slate">
                                <span className="stat-title">Total Departments</span>
                                <span className="stat-value text-slate">{totalDepts}</span>
                                <span className="stat-desc">Monitored organization units</span>
                            </div>
                            <div className="rca-stat-card border-red">
                                <span className="stat-title">Total Exceeded 60h</span>
                                <span className="stat-value text-danger">{totalViolators}</span>
                                <span className="stat-desc">Exceeded 60 hrs weekly limit</span>
                            </div>
                            <div className="rca-stat-card border-crimson">
                                <span className="stat-title">Total Excess Hours</span>
                                <span className="stat-value text-crimson">{totalExcessHours} hrs</span>
                                <span className="stat-desc">Cumulative hours over the 60h cap</span>
                            </div>
                            <div className="rca-stat-card border-charcoal">
                                <span className="stat-title">Most Critical Dept</span>
                                <span className="stat-value text-charcoal font-sm">
                                    {criticalDept && criticalDept.violatorsCount > 0 
                                        ? (criticalDept.department.length > 15 ? `${criticalDept.department.slice(0, 12)}...` : criticalDept.department) 
                                        : 'None'}
                                </span>
                                <span className="stat-desc">
                                    {criticalDept && criticalDept.violatorsCount > 0 
                                        ? `${criticalDept.violatorsCount} exceeded limit (${criticalDept.excessHours} excess hrs)` 
                                        : 'All departments compliant'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="rca-stat-card border-slate">
                                <span className="stat-title">Dept Headcount</span>
                                <span className="stat-value text-slate">{activeDeptStats.headcount}</span>
                                <span className="stat-desc">Employees in this department</span>
                            </div>
                            <div className="rca-stat-card border-red">
                                <span className="stat-title">Dept Exceeded 60h</span>
                                <span className="stat-value text-danger">{activeDeptStats.violatorsCount}</span>
                                <span className="stat-desc">Working &gt; 60 hours this week</span>
                            </div>
                            <div className="rca-stat-card border-crimson">
                                <span className="stat-title">Peak OT Day</span>
                                <span className="stat-value text-crimson">
                                    {maxDay.ot > 0 ? maxDay.name : 'N/A'}
                                </span>
                                <span className="stat-desc">
                                    {maxDay.ot > 0 ? `${maxDay.ot} total overtime hours` : 'No OT recorded'}
                                </span>
                            </div>
                            <div className="rca-stat-card border-charcoal">
                                <span className="stat-title">Peak of Team</span>
                                <span className="stat-value text-charcoal">
                                    {maxTeam.ot > 0 ? maxTeam.name : 'N/A'}
                                </span>
                                <span className="stat-desc">
                                    {maxTeam.ot > 0 ? maxTeam.ot + ' total overtime hours' : 'No OT recorded'}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Dynamic Visual Content */}
                <div className="panel-chart-wrapper">
                    {!selectedDept ? (
                        /* OVERVIEW VIEW */
                        <div className="overview-chart-container">
                            <div className="overview-tabs-row">
                                <button
                                    className={`compliance-tab-btn ${activeTab === 'headcount' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('headcount')}
                                >
                                    👥 Headcount vs. Exceeded 60 Hrs
                                </button>
                                <button
                                    className={`compliance-tab-btn ${activeTab === 'hours' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('hours')}
                                >
                                    ⏳ Total Hours vs. Excess Hours
                                </button>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                {activeTab === 'headcount' ? (
                                    <BarChart 
                                        data={overviewChartData} 
                                        margin={{ top: 20, right: 35, left: 15, bottom: 10 }}
                                        style={{ cursor: 'pointer' }}
                                        onClick={(state) => {
                                            if (state && state.activePayload && state.activePayload.length > 0) {
                                                setSelectedDept(state.activePayload[0].payload.fullName);
                                            }
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#475569" stopOpacity={0.9}/>
                                                <stop offset="95%" stopColor="#475569" stopOpacity={0.4}/>
                                            </linearGradient>
                                            <linearGradient id="violatorGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E40029" stopOpacity={0.95}/>
                                                <stop offset="95%" stopColor="#E40029" stopOpacity={0.5}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            height={40}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            allowDecimals={false}
                                            label={{ value: 'Headcount (Persons)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            allowDecimals={false}
                                            label={{ value: 'Exceeded 60h (Persons)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--surface-glass, rgba(255, 255, 255, 0.95))',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '16px',
                                                color: 'var(--text-primary)',
                                                boxShadow: 'var(--shadow-lg)',
                                                padding: '12px 16px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}
                                            formatter={(value, name, props) => [value, props.dataKey]}
                                            labelFormatter={(label, items) => items[0]?.payload?.fullName || label}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', marginTop: '5px' }} />
                                        <Bar yAxisId="left" dataKey="Total Headcount" fill="url(#headcountGrad)" name="Total Headcount" radius={[6, 6, 0, 0]} barSize={18}>
                                            <LabelList dataKey="Total Headcount" position="top" fill="var(--text-secondary)" fontSize={9} fontWeight={700} offset={4} />
                                        </Bar>
                                        <Bar yAxisId="right" dataKey="Exceeded 60 Hrs" fill="url(#violatorGrad)" name="Exceeded 60 Hrs" radius={[6, 6, 0, 0]} barSize={18}>
                                            <LabelList dataKey="Exceeded 60 Hrs" position="top" fill="var(--kellogg-red)" fontSize={9} fontWeight={700} offset={4} formatter={(v) => v > 0 ? v : ''} />
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    <ComposedChart 
                                        data={overviewChartData} 
                                        margin={{ top: 20, right: 40, left: 20, bottom: 10 }}
                                        style={{ cursor: 'pointer' }}
                                        onClick={(state) => {
                                            if (state && state.activePayload && state.activePayload.length > 0) {
                                                setSelectedDept(state.activePayload[0].payload.fullName);
                                            }
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.9}/>
                                                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.4}/>
                                            </linearGradient>
                                            <linearGradient id="excessHoursAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E40029" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#E40029" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            height={40}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            label={{ value: 'Total Hours Worked (Hrs)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            label={{ value: 'Excess Hours (Hrs)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--surface-glass, rgba(255, 255, 255, 0.95))',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '16px',
                                                color: 'var(--text-primary)',
                                                boxShadow: 'var(--shadow-lg)',
                                                padding: '12px 16px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}
                                            labelFormatter={(label, items) => items[0]?.payload?.fullName || label}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', marginTop: '5px' }} />
                                        <Bar yAxisId="left" dataKey="Total Hours" fill="url(#hoursGrad)" name="Total Hours" radius={[6, 6, 0, 0]} barSize={20}>
                                            <LabelList dataKey="Total Hours" position="top" fill="var(--text-secondary)" fontSize={9} fontWeight={700} offset={4} formatter={(v) => v > 0 ? Math.round(v).toLocaleString() : ''} />
                                        </Bar>
                                        <Area yAxisId="right" type="monotone" dataKey="Excess Hours (>60)" stroke="#E40029" strokeWidth={3} fill="url(#excessHoursAreaGrad)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} name="Excess Hours (>60)" />
                                    </ComposedChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        /* DRILL-DOWN VIEW (RCA) */
                        <div className="rca-drilldown-container fade-in">
                            <div className="rca-charts-row">
                                {/* Team Chart */}
                                {teamData.length > 0 && (
                                    <div className="rca-chart-box">
                                        <h4>👥 Overtime Accumulation by Team (สัดส่วน OT ตามทีม ABCD)</h4>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart 
                                                data={teamData} 
                                                margin={{ top: 15, right: 10, left: 15, bottom: 5 }}
                                                style={{ cursor: 'pointer' }}
                                                onClick={(state) => {
                                                    if (state && state.activePayload && state.activePayload.length > 0) {
                                                        const clickedTeam = state.activePayload[0].payload.name;
                                                        const teamKey = clickedTeam === 'Team A' ? 'A' :
                                                                        clickedTeam === 'Team B' ? 'B' :
                                                                        clickedTeam === 'Team C' ? 'C' :
                                                                        clickedTeam === 'Team D' ? 'D' : 'Unknown';
                                                        setSelectedTeam(prev => prev === teamKey ? null : teamKey);
                                                    }
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#E40029" stopOpacity={0.95}/>
                                                        <stop offset="95%" stopColor="#E40029" stopOpacity={0.5}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                                                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} label={{ value: 'OT Hours (Hrs)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--surface-glass, rgba(255, 255, 255, 0.95))',
                                                        backdropFilter: 'blur(12px)',
                                                        WebkitBackdropFilter: 'blur(12px)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '16px',
                                                        color: 'var(--text-primary)',
                                                        boxShadow: 'var(--shadow-md)',
                                                        padding: '10px 14px',
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}
                                                />
                                                <Bar dataKey="ot" name="OT Hours" barSize={30} radius={[6, 6, 0, 0]}>
                                                    {teamData.map((entry, index) => {
                                                        const colors = {
                                                            'Team A': 'var(--kellogg-red, #E40029)',
                                                            'Team B': '#FF6B81',
                                                            'Team C': '#475569',
                                                            'Team D': '#64748B',
                                                            'No Team': '#94A3B8'
                                                        };
                                                        const baseColor = colors[entry.name] || '#94A3B8';
                                                        const teamKey = entry.name === 'Team A' ? 'A' :
                                                                        entry.name === 'Team B' ? 'B' :
                                                                        entry.name === 'Team C' ? 'C' :
                                                                        entry.name === 'Team D' ? 'D' : 'Unknown';
                                                        const isSelected = selectedTeam === teamKey;
                                                        const opacity = selectedTeam ? (isSelected ? 1.0 : 0.25) : 0.95;
                                                        return <Cell key={`cell-${index}`} fill={baseColor} fillOpacity={opacity} />;
                                                    })}
                                                    <LabelList dataKey="ot" position="top" fill="var(--text-secondary)" fontSize={10} fontWeight={700} offset={4} formatter={(v) => v > 0 ? v.toFixed(1) : ''} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Day of Week Chart */}
                                <div className="rca-chart-box">
                                    <h4>📅 Overtime Accumulation by Day (สัดส่วน OT ตามวัน)</h4>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart 
                                            data={dayOfWeekData} 
                                            margin={{ top: 15, right: 10, left: 15, bottom: 5 }}
                                            style={{ cursor: 'pointer' }}
                                            onClick={(state) => {
                                                if (state && state.activePayload && state.activePayload.length > 0) {
                                                    const clickedDay = state.activePayload[0].payload.name;
                                                    setSelectedDay(prev => prev === clickedDay ? null : clickedDay);
                                                }
                                            }}
                                        >
                                            <defs>
                                                <linearGradient id="dayOTGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#E40029" stopOpacity={0.9}/>
                                                    <stop offset="95%" stopColor="#E40029" stopOpacity={0.4}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                                            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} label={{ value: 'OT Hours (Hrs)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '11px'
                                                }}
                                            />
                                            <Bar dataKey="ot" fill="url(#dayOTGrad)" name="OT Hours" barSize={20} radius={[6, 6, 0, 0]}>
                                                {dayOfWeekData.map((entry, index) => {
                                                    const isSelected = selectedDay === entry.name;
                                                    const opacity = selectedDay ? (isSelected ? 1.0 : 0.25) : 0.9;
                                                    return <Cell key={`cell-${index}`} fill="url(#dayOTGrad)" fillOpacity={opacity} />;
                                                })}
                                                <LabelList dataKey="ot" position="top" fill="var(--text-secondary)" fontSize={10} fontWeight={700} offset={4} formatter={(v) => v > 0 ? v.toFixed(1) : ''} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Timeline Trend Line */}
                            <div className="rca-timeline-box mt-3">
                                <h4>📈 Daily Overtime Trend (แนวโน้มการทำ OT รายวัน)</h4>
                                {dailyTimelineData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={160}>
                                        <ComposedChart data={dailyTimelineData} margin={{ top: 15, right: 10, left: 15, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="rcaTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--kellogg-red, #E40029)" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="var(--kellogg-red, #E40029)" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} tickLine={false} />
                                            <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'OT Hours (Hrs)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 } }} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--surface-glass, rgba(255, 255, 255, 0.95))',
                                                    backdropFilter: 'blur(12px)',
                                                    WebkitBackdropFilter: 'blur(12px)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '16px',
                                                    color: 'var(--text-primary)',
                                                    boxShadow: 'var(--shadow-md)',
                                                    padding: '10px 14px',
                                                    fontSize: '11px',
                                                    fontWeight: '500'
                                                }}
                                            />
                                            <Area type="monotone" dataKey="OT Hours" fill="url(#rcaTrendAreaGrad)" stroke="none" />
                                            <Line type="monotone" dataKey="OT Hours" stroke="var(--kellogg-red, #E4002B)" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ stroke: 'var(--kellogg-red, #E4002B)', strokeWidth: 1.5, fill: 'var(--surface)', r: 2.5 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="rca-no-shift-data">No daily trend data available.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Department Details Table */}
            <div className="compliance-table-card">
                {!selectedDept ? (
                    <>
                        <div className="table-header-row">
                            <h3>📋 Department Breakdown Details</h3>
                            <span className="table-hint">💡 Click any department name to drill down into its root causes above</span>
                        </div>
                        <div className="table-wrapper">
                            <table className="compliance-summary-table">
                                <thead>
                                    <tr>
                                        <th>Department Name</th>
                                        <th className="num-col">Total Headcount</th>
                                        <th className="num-col">Exceeded Weekly Limit (&gt;60h)</th>
                                        <th className="num-col">Exceedance Rate (%)</th>
                                        <th className="num-col">Total Excess Hours</th>
                                        <th className="num-col">Total Hours Worked</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((s, index) => {
                                        const rate = s.headcount > 0 ? (s.violatorsCount / s.headcount) * 100 : 0;
                                        const isSelected = selectedDept === s.department;
                                        return (
                                            <tr 
                                                key={index} 
                                                className={s.violatorsCount > 0 ? 'has-violations ' + (isSelected ? 'row-selected' : '') : (isSelected ? 'row-selected' : '')}
                                                onClick={() => handleRowClick(s.department)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className="dept-name">
                                                    {s.violatorsCount > 0 && <span className="warning-dot">●</span>}
                                                    {s.department}
                                                    {isSelected && <span className="selected-tag">Active</span>}
                                                </td>
                                                <td className="num-col bold">{s.headcount}</td>
                                                <td className={s.violatorsCount > 0 ? 'num-col text-danger bold' : 'num-col'}>
                                                    {s.violatorsCount}
                                                </td>
                                                <td className="num-col">
                                                    <div className="rate-badge-wrapper">
                                                        {s.violatorsCount > 0 ? (
                                                            <span className="rate-badge danger">
                                                                {rate.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <span className="rate-badge safe">0.0%</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={s.excessHours > 0 ? 'num-col text-danger bold' : 'num-col'}>
                                                    {s.excessHours > 0 ? s.excessHours.toFixed(2) + ' hrs' : '-'}
                                                </td>
                                                <td className="num-col">{s.totalHours.toLocaleString()} hrs</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="table-header-row">
                            <h3>📋 Employees in {selectedDept}</h3>
                            <span className="table-hint">💡 Cross-filtering from the charts above is applied. Double-click table row to clear team/day filters.</span>
                        </div>
                        <div className="table-wrapper">
                            <table className="compliance-summary-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleEmpSort('id')} style={{ cursor: 'pointer' }}>
                                            Employee ID {empSortField === 'id' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleEmpSort('name')} style={{ cursor: 'pointer' }}>
                                            Name {empSortField === 'name' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleEmpSort('position')} style={{ cursor: 'pointer' }}>
                                            Position {empSortField === 'position' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="num-col" onClick={() => handleEmpSort('team')} style={{ cursor: 'pointer' }}>
                                            Team {empSortField === 'team' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="num-col" onClick={() => handleEmpSort('totalOT')} style={{ cursor: 'pointer' }}>
                                            Total OT {empSortField === 'totalOT' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="num-col" onClick={() => handleEmpSort('totalWorkingHours')} style={{ cursor: 'pointer' }}>
                                            Total Hours (Normal + OT) {empSortField === 'totalWorkingHours' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="num-col" onClick={() => handleEmpSort('status')} style={{ cursor: 'pointer' }}>
                                            Status {empSortField === 'status' && (empSortDirection === 'asc' ? '↑' : '↓')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTableEmployees.map((emp, index) => {
                                        const isOver60 = emp.totals && emp.totals.totalWorkingHours > 60;
                                        const totalWorkingHours = emp.totals?.totalWorkingHours || 0;
                                        return (
                                            <tr 
                                                key={emp.id} 
                                                className={isOver60 ? 'has-violations' : ''}
                                                onDoubleClick={() => { setSelectedTeam(null); setSelectedDay(null); }}
                                                style={{ cursor: 'default' }}
                                            >
                                                <td>{emp.id}</td>
                                                <td className="bold">{emp.name}</td>
                                                <td>{emp.position}</td>
                                                <td className="num-col">{emp.team || '-'}</td>
                                                <td className="num-col highlight">{(emp.totals?.totalOT || 0).toFixed(1)} hrs</td>
                                                <td className={isOver60 ? 'num-col text-danger bold' : 'num-col'}>
                                                    {totalWorkingHours.toFixed(1)} hrs
                                                </td>
                                                <td className="num-col">
                                                    <div className="rate-badge-wrapper">
                                                        <span className={isOver60 ? 'rate-badge danger' : 'rate-badge safe'}>
                                                            {isOver60 ? '> 60 Hrs' : 'Compliant'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {tableEmployees.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)' }}>
                                                No employees match the selected Team/Day filters in this department.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    ComposedChart, Line, Area
} from 'recharts';
import './AnalyticsDashboard.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const GRADIENTS = [
    'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
];

const AnalyticsDashboard = ({ history, users = [], mode = 'admin' }) => {
    const isManager = mode === 'manager';
    const chartTextColor = isManager ? '#475569' : 'rgba(255,255,255,0.4)';
    const chartAxisColor = isManager ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)';
    // 1. Task Distribution by Category
    const categoryData = useMemo(() => {
        const counts = {};
        history.forEach(report => {
            const items = report.data || report.tasks || report.tasks_data || [];
            items.forEach(item => {
                const cat = item.category || report.category || 'Unspecified';
                counts[cat] = (counts[cat] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [history]);

    // 2. Resource Productivity Streak (Last 7 Days)
    const activityData = useMemo(() => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        return last7Days.map(date => {
            const count = history
                .filter(r => {
                    const rDate = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
                    return rDate === date;
                })
                .reduce((sum, r) => sum + (r.data || r.tasks || r.tasks_data || []).length, 0);

            return {
                date: date.split('-').slice(1).join('/'),
                tasks: count
            };
        });

    }, [history]);

    // 3. Workforce Role Distribution
    const roleData = useMemo(() => {
        const counts = { 'Admin': 0, 'Manager': 0, 'User': 0 };
        users.forEach(u => {
            const role = u.role?.charAt(0).toUpperCase() + u.role?.slice(1).toLowerCase() || 'User';
            counts[role] = (counts[role] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [users]);

    // 4. Departmental Headcount & Activity
    const deptData = useMemo(() => {
        const depts = {};
        users.forEach(u => {
            const d = u.department || 'Undesignated';
            if (!depts[d]) depts[d] = { name: d, headcount: 0, actions: 0 };
            depts[d].headcount += 1;
        });

        history.forEach(r => {
            const user = users.find(u => u.email === r.user_email);
            const d = user?.department || 'Undesignated';
            if (depts[d]) {
                depts[d].actions += (r.data || r.tasks || r.tasks_data || []).length;
            }
        });

        return Object.values(depts).sort((a, b) => b.actions - a.actions);
    }, [users, history]);

    if (history.length === 0 && users.length === 0) {
        return (
            <div className="analytics-empty animate-fade-in">
                <div style={{fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.2}}>📊</div>
                <p>Initializing Control Systems... Waiting for data stream synchronization.</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-tooltip">
                    <p className="tooltip-label">{payload[0].payload.name || payload[0].payload.date || label}</p>
                    {payload.map((p, i) => (
                        <p key={i} className="tooltip-value" style={{ color: p.color }}>
                            {p.value} <span className="tooltip-unit">{p.name === 'headcount' ? 'Personnel' : 'Operations'}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analytics-grid animate-fade-in">
            {/* Row 1: High Level Stats */}
            <div className="chart-container span-full">
                <h4>Organizational Productivity Matrix (Last 7 Days)</h4>
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={activityData}>
                        <defs>
                            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartAxisColor} vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="tasks" stroke="var(--admin-accent)" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={3} />
                        <Bar dataKey="tasks" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Row 2: Roles & Categories */}
            <div className="chart-container">
                <h4>Workforce Composition</h4>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={roleData}
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                        >
                            {roleData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                    {roleData.map((entry, index) => (
                        <div key={index} className="legend-item">
                            <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span className="label">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chart-container">
                <h4>Operation Classification</h4>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={categoryData}
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                    {categoryData.slice(0, 4).map((entry, index) => (
                        <div key={index} className="legend-item">
                            <span className="dot" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></span>
                            <span className="label">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Row 3: Department Deep Dive */}
            <div className="chart-container span-full">
                <h4>Departmental Engagement & Headcount</h4>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={deptData} layout="vertical" margin={{ left: 40, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartAxisColor} horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isManager ? '#1e293b' : '#fff', fontSize: 11, fontWeight: 800 }}
                            width={100}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800}} />
                        <Bar name="headcount" dataKey="headcount" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
                        <Bar name="operations" dataKey="actions" fill="var(--admin-accent)" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

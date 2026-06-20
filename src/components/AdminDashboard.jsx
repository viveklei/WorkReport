import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import './AdminDashboard.css';
import AnalyticsDashboard from './AnalyticsDashboard';
import { downloadExcel, downloadIndividualPDF, downloadTeamPDF } from '../utils/exportUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const AdminDashboard = ({ onClose, mode = 'admin' }) => {
  const [activeTab, setActiveTab] = useState('overview'); // Default to overview
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserAnalysis, setSelectedUserAnalysis] = useState(null);
  const [analysisRange, setAnalysisRange] = useState('30'); // Default 30 days
  const [isSaving, setIsSaving] = useState(false);
  const [isAIVisible, setIsAIVisible] = useState(false);
  const [modalAIVisible, setModalAIVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'manager') {
          const [usersData, reportsData] = await Promise.all([
            api.getManagerWorkforce(),
            api.getManagerReports()
          ]);
          setUsers(usersData);
          setReports(reportsData);
        } else {
          const [usersData, reportsData] = await Promise.all([
            api.getAdminUsers(),
            api.getAllReports()
          ]);
          setUsers(usersData);
          setReports(reportsData);
        }
      } catch (err) {
        console.error('Admin fetch error:', err);
        if (err.status === 401 || err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Session')) {
          alert('Your session has expired. Please log in again.');
          window.location.reload(); // Will trigger logout flow in App.jsx
          return;
        }
        const msg = err.message || 'Failed to load admin data';
        setError(msg.includes('Admin access') || msg.includes('Manager access') ? msg : `Failed to load data: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mode]);

  const departments = useMemo(() => {
    const depts = new Set(users.map(u => u.department).filter(Boolean));
    return ['All Departments', ...Array.from(depts).sort()];
  }, [users]);

  const handleUpdateRole = async (email, newRole) => {
    try {
      await api.updateAdminUser(email, { role: newRole });
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`CRITICAL: Are you sure you want to permanently DELETE user ${email}? This action cannot be undone.`)) return;
    
    try {
      await api.deleteAdminUser(email);
      setUsers(prev => prev.filter(u => u.email !== email));
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleResetPassword = async (email) => {
    if (!window.confirm(`Reset password for ${email}? A temporary password or reset link will be generated.`)) return;
    
    try {
      const result = await api.resetAdminPassword(email);
      alert(result.message || 'Password reset successful. Check console for temporary credentials if applicable.');
    } catch (err) {
      alert('Failed to reset password: ' + err.message);
    }
  };

  const handleSaveEdit = async (updatedData) => {
    setIsSaving(true);
    try {
      await api.updateAdminUser(editingUser.email, updatedData);
      setUsers(prev => prev.map(u => u.email === editingUser.email ? { ...u, ...updatedData } : u));
      setEditingUser(null);
    } catch (err) {
      alert('Failed to update user profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All Departments' || u.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [users, searchTerm, deptFilter]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.report_date?.includes(searchTerm)
    );
  }, [reports, searchTerm]);

  const filteredTeamReports = useMemo(() => {
    const filteredUserEmails = new Set(filteredUsers.map(u => u.email));
    return reports.filter(r => filteredUserEmails.has(r.user_email));
  }, [reports, filteredUsers]);

  const calculateUserStats = (userEmail) => {
    const userReports = reports.filter(r => r.user_email === userEmail);
    const totalTasks = userReports.reduce((sum, r) => sum + (r.tasks_data?.length || 0), 0);
    const avgTasks = userReports.length > 0 ? (totalTasks / userReports.length).toFixed(1) : 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReports = userReports.filter(r => new Date(r.report_date) >= sevenDaysAgo).length;
    const score = Math.min(100, (recentReports * 10) + (avgTasks * 5)).toFixed(0);

    return { totalReports: userReports.length, avgTasks, score };
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayCount = reports.filter(r => r.report_date === today).length;
    const yesterdayCount = reports.filter(r => r.report_date === yesterdayStr).length;
    const trend = todayCount >= yesterdayCount ? 'up' : 'down';

    return {
      totalUsers: users.length,
      totalReports: reports.length,
      todayReports: todayCount,
      activeUsers: new Set(reports.map(r => r.user_email)).size,
      trend
    };
  }, [users, reports]);

  const getUserAnalysisData = (userEmail, days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    
    const userReports = reports
      .filter(r => r.user_email === userEmail && new Date(r.report_date) >= cutoff)
      .sort((a, b) => new Date(a.report_date) - new Date(b.report_date));

    // Group by date to avoid duplicates in chart
    const dailyData = {};
    userReports.forEach(r => {
      const date = r.report_date;
      if (!dailyData[date]) {
        dailyData[date] = { date, count: 0, tasks: 0 };
      }
      dailyData[date].count += 1;
      dailyData[date].tasks += (r.tasks_data?.length || 0);
    });

    return Object.values(dailyData);
  };

  const getUserCategoryDistribution = (userEmail) => {
    const userReports = reports.filter(r => r.user_email === userEmail);
    const distribution = {};
    
    userReports.forEach(r => {
      const cat = r.category || 'Daily';
      distribution[cat] = (distribution[cat] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  const getUserHourlyActivity = (userEmail) => {
    const userReports = reports.filter(r => r.user_email === userEmail);
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));

    userReports.forEach(r => {
      if (r.start_time) {
        const hour = parseInt(r.start_time.split(':')[0]);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hourlyData[hour].count += 1;
        }
      }
    });

    return hourlyData.filter(d => d.count > 0 || (parseInt(d.hour) > 8 && parseInt(d.hour) < 18));
  };

  const getUserPerformanceProfile = (userEmail) => {
    const userReports = reports.filter(r => r.user_email === userEmail);
    const totalReports = userReports.length;
    const categories = new Set(userReports.map(r => r.category)).size;
    const totalTasks = userReports.reduce((sum, r) => sum + (r.tasks_data?.length || 0), 0);
    
    // Normalized scores (0-100)
    return [
      { subject: 'Consistency', A: Math.min(100, (totalReports / 10) * 100), fullMark: 100 },
      { subject: 'Volume', A: Math.min(100, (totalTasks / 50) * 100), fullMark: 100 },
      { subject: 'Diversity', A: Math.min(100, (categories / 3) * 100), fullMark: 100 },
      { subject: 'Detailing', A: Math.min(100, (totalTasks / (totalReports || 1)) * 20), fullMark: 100 },
      { subject: 'Engagement', A: 85, fullMark: 100 } // Example metric
    ];
  };

  if (loading) return <div className="admin-dashboard loading animate-pulse">Initializing {mode === 'admin' ? 'Management' : 'Manager'} Console...</div>;
  if (error) return <div className="admin-dashboard error">{error}</div>;

  return (
    <div className={`admin-dashboard animate-fade-in ${mode === 'manager' ? 'mode-manager' : ''}`}>
      <div className="admin-header">
        <h2>{mode === 'admin' ? 'Industrial' : 'Dept'} <span className="accent-text">{mode === 'admin' ? 'Control Center' : 'Manager Console'}</span></h2>
        <div style={{display: 'flex', gap: '1rem'}}>
           <button className="view-btn" onClick={() => window.location.reload()}>Refresh</button>
           <button className="view-btn" style={{backgroundColor: 'rgba(255,255,255,0.05)'}} onClick={onClose}>Exit Console</button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h4>Workforce Size</h4>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-trend trend-up"><span>👥</span> Registered Accounts</div>
        </div>
        <div className="stat-card">
          <h4>Cumulative Reports</h4>
          <div className="stat-value">{stats.totalReports}</div>
          <div className="stat-trend trend-up"><span>📁</span> All-time Archive</div>
        </div>
        <div className="stat-card">
          <h4>Daily Output</h4>
          <div className="stat-value">{stats.todayReports}</div>
          <div className={`stat-trend trend-${stats.trend}`}>
             {stats.trend === 'up' ? '↑ Increasing Activity' : '↓ Below Yesterday'}
          </div>
        </div>
        <div className="stat-card">
          <h4>Active Today</h4>
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-trend"><span>⚡</span> Engaged Reporters</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Workforce</button>
        <button className={`tab-btn ${activeTab === 'team-performance' ? 'active' : ''}`} onClick={() => setActiveTab('team-performance')}>Team Performance</button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports Feed</button>
      </div>

      {activeTab === 'reports' && (
        <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center'}}>
          <button className="view-btn primary" style={{margin: 0, padding: '0.8rem 1.5rem'}} onClick={() => downloadExcel(reports, null, isAIVisible)}>
            📥 Export Master Archive ({reports.length})
          </button>
          <button className="view-btn" style={{margin: 0, padding: '0.8rem 1.5rem', borderColor: 'var(--admin-accent)'}} onClick={() => downloadExcel(filteredReports, null, isAIVisible)}>
             📊 Export Filtered ({filteredReports.length})
          </button>
          
          <div className="ai-toggle-container" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', padding: '0.6rem 1.2rem', borderRadius: '15px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: isAIVisible ? 'var(--admin-accent)' : '#fff', opacity: isAIVisible ? 1 : 0.5 }}>
              Show AI Enhanced
            </span>
            <label className="admin-switch">
              <input type="checkbox" checked={isAIVisible} onChange={(e) => setIsAIVisible(e.target.checked)} />
              <span className="admin-slider round"></span>
            </label>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <div className="admin-actions animate-fade-in">
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder={activeTab === 'users' ? "Search by name or email..." : "Search reports, dates, categories..."} 
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(activeTab === 'users' || activeTab === 'team-performance') && (
            <select 
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="admin-overview animate-fade-in">
          <AnalyticsDashboard 
            history={reports.map(r => ({ ...r, date: r.report_date }))} 
            users={users}
            mode={mode}
          />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-grid">
          {filteredUsers.map(user => {
            const userStats = calculateUserStats(user.email);
            return (
              <div key={user.id} className="user-card animate-slide-up">
                <div className="user-card-header" style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="user-avatar-large" />
                  ) : (
                    <div className="default-avatar-large">{user.name?.charAt(0) || 'U'}</div>
                  )}
                  <div className="user-main-info" style={{marginTop: 0}}>
                    <span className="user-role-tag" style={{color: user.role === 'admin' ? 'var(--admin-accent)' : '#fff'}}>
                      {user.role}
                    </span>
                    <h3>{user.name || 'Anonymous User'}</h3>
                    <p style={{fontSize: '0.85rem', opacity: 0.5, margin: 0}}>{user.department || 'No Department'}</p>
                  </div>
                </div>

                <div className="user-performance" style={{marginTop: '2rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'center'}}>
                     <span style={{fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase'}}>Productivity Score</span>
                     <span className="performance-badge">{userStats.score}%</span>
                  </div>
                  <div style={{height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden'}}>
                    <div style={{width: `${userStats.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--admin-accent), #a78bfa)', boxShadow: '0 0 15px var(--admin-accent-glow)'}}></div>
                  </div>
                </div>

                <div className="user-metric-grid">
                  <div className="metric-item">
                    <span className="label">Reports</span>
                    <span className="val">{userStats.totalReports}</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Avg Tasks</span>
                    <span className="val">{userStats.avgTasks}</span>
                  </div>
                </div>

                <div className="action-btns-grid">
                   <button className="view-btn primary" onClick={() => setSelectedUserAnalysis(user)}>🔍 Analyze</button>
                   {mode === 'admin' && (
                     <>
                       <button className="view-btn" onClick={() => setEditingUser({...user})}>Edit</button>
                       <button className="view-btn" style={{color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)'}} onClick={() => handleDeleteUser(user.email)}>Delete</button>
                       <button className="view-btn" title="Reset Password" onClick={() => handleResetPassword(user.email)}>Reset Key</button>
                     </>
                   )}
                </div>
                
                {mode === 'admin' && (
                  <div className="role-quick-toggle" style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{fontSize: '0.7rem', opacity: 0.4, fontWeight: 800}}>Quick Role:</span>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button className={`mini-toggle ${user.role === 'admin' ? 'active' : ''}`} onClick={() => handleUpdateRole(user.email, 'admin')}>Admin</button>
                      <button className={`mini-toggle ${user.role === 'manager' ? 'active' : ''}`} onClick={() => handleUpdateRole(user.email, 'manager')}>Mgr</button>
                      <button className={`mini-toggle ${user.role === 'user' ? 'active' : ''}`} onClick={() => handleUpdateRole(user.email, 'user')}>User</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '5rem', opacity: 0.5}}>
              No users found matching your filters.
            </div>
          )}
        </div>
      )}

      {activeTab === 'team-performance' && (
        <div className="team-performance-view animate-fade-in">
          <div className="team-actions-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
            <div>
              <h3 style={{margin: 0}}>{mode === 'admin' ? 'Organization-Wide' : 'Departmental'} Performance Audit</h3>
              <p style={{margin: '0.2rem 0 0', fontSize: '0.85rem', opacity: 0.5}}>Aggregated metrics and bulk extraction for {filteredUsers.length} members</p>
            </div>
            <div style={{display: 'flex', gap: '1rem'}}>
              <button 
                className="view-btn primary" 
                onClick={() => downloadTeamPDF(
                  deptFilter === 'All Departments' ? (mode === 'admin' ? 'Global Workforce' : 'Dept Team') : deptFilter, 
                  filteredTeamReports, 
                  filteredUsers, 
                  'Selected Period', 
                  isAIVisible
                )}
              >
                📥 Download Team PDF
              </button>
              <button 
                className="view-btn" 
                onClick={() => downloadExcel(
                  filteredTeamReports, 
                  `Team_Archive_${deptFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`, 
                  isAIVisible
                )}
              >
                📊 Download Team Excel
              </button>
            </div>
          </div>

          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Total Reports</th>
                  <th>Tasks Logged</th>
                  <th>Avg Tasks/Report</th>
                  <th>Productivity Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const userStats = calculateUserStats(user.email);
                  const userReports = reports.filter(r => r.user_email === user.email);
                  const totalTasks = userReports.reduce((sum, r) => sum + (r.tasks_data?.length || 0), 0);
                  
                  return (
                    <tr key={user.email}>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                          {user.photo ? (
                            <img src={user.photo} alt="" className="user-avatar-small" style={{width: '32px', height: '32px'}} />
                          ) : (
                            <div className="default-avatar-small" style={{width: '32px', height: '32px', fontSize: '0.7rem'}}>{user.name?.charAt(0)}</div>
                          )}
                          <div style={{fontWeight: 700}}>{user.name}</div>
                        </div>
                      </td>
                      <td style={{opacity: 0.6}}>{user.department || 'N/A'}</td>
                      <td>{userStats.totalReports}</td>
                      <td>{totalTasks}</td>
                      <td>{userStats.avgTasks}</td>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <div style={{flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', minWidth: '60px'}}>
                            <div style={{width: `${userStats.score}%`, height: '100%', background: 'var(--admin-accent)', borderRadius: '2px'}}></div>
                          </div>
                          <span style={{fontWeight: 800, color: 'var(--admin-accent)'}}>{userStats.score}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="reports-table-container animate-fade-in">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Submission Date</th>
                <th>Employee Identity</th>
                <th>Classification</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>
                    <div style={{fontWeight: 800}}>{report.report_date}</div>
                    <div style={{fontSize: '0.7rem', opacity: 0.5}}>{report.start_time} - {report.end_time}</div>
                  </td>
                  <td>
                    <div style={{fontWeight: 700}}>{report.user_name}</div>
                    <div style={{fontSize: '0.7rem', color: 'var(--admin-text-dim)'}}>{report.user_email}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${report.category?.toLowerCase() || 'daily'}`}>
                      {report.category}
                    </span>
                  </td>
                  <td>
                    <div style={{fontSize: '0.85rem'}}>{report.tasks_data?.length || 0} work items</div>
                    <div style={{fontSize: '0.7rem', opacity: 0.4, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {report.tasks_data?.[0]?.text || 'No description'}
                    </div>
                  </td>
                  <td>
                     <button className="view-btn" style={{padding: '0.5rem 1rem'}} onClick={() => {
                       setSelectedReport(report);
                       setModalAIVisible(isAIVisible);
                     }}>Inspect</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div style={{textAlign: 'center', padding: '5rem', opacity: 0.5}}>
              No reports found matching your filters.
            </div>
          )}
        </div>
      )}


      {editingUser && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setEditingUser(null)}>
          <div className="admin-modal small animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Profile</h3>
              <button className="close-modal" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="admin-form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.name || ''} 
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>
              <div className="admin-form-group">
                <label>Department</label>
                <input 
                  type="text" 
                  value={editingUser.department || ''} 
                  onChange={(e) => setEditingUser(prev => ({ ...prev, department: e.target.value }))} 
                />
              </div>

              {editingUser.role === 'manager' && (
                <div className="admin-form-group">
                  <label>Managed Jurisdictions</label>
                  <p style={{fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem'}}>Assign departments this manager can oversee:</p>
                  <div className="managed-depts-selector" style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {Array.from(new Set(users.map(u => u.department).filter(Boolean))).map(dept => (
                      <button 
                        key={dept} 
                        className={`dept-tag-btn ${editingUser.managed_departments?.includes(dept) ? 'active' : ''}`}
                        onClick={() => {
                          const current = editingUser.managed_departments || [];
                          const nextDepts = current.includes(dept)
                            ? current.filter(d => d !== dept)
                            : [...current, dept];
                          
                          setEditingUser(prev => ({ ...prev, managed_departments: nextDepts }));
                        }}

                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{marginTop: '2rem', display: 'flex', gap: '1rem'}}>
                <button className="view-btn primary w-full" onClick={() => handleSaveEdit(editingUser)}>Save Profile</button>
                <button className="view-btn w-full" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUserAnalysis && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setSelectedUserAnalysis(null)}>
          <div className="admin-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                {selectedUserAnalysis.photo ? (
                  <img src={selectedUserAnalysis.photo} alt="" className="user-avatar-small" />
                ) : (
                  <div className="default-avatar-small">{selectedUserAnalysis.name?.charAt(0)}</div>
                )}
                <div>
                  <h3 style={{margin: 0}}>{selectedUserAnalysis.name}</h3>
                  <p style={{margin: 0, opacity: 0.5, fontSize: '0.85rem'}}>{selectedUserAnalysis.email} &bull; {selectedUserAnalysis.department}</p>
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <select 
                  className="filter-select mini" 
                  value={analysisRange} 
                  onChange={(e) => setAnalysisRange(e.target.value)}
                  style={{margin: 0, height: '40px'}}
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last Quarter</option>
                  <option value="365">Full Year</option>
                </select>
                <button className="close-modal" onClick={() => setSelectedUserAnalysis(null)}>✕</button>
              </div>
            </div>
            
            <div className="modal-content" style={{padding: '2rem'}}>
               <div className="analysis-summary-grid">
                  <div className="analysis-stat">
                    <span className="label">Activity Level</span>
                    <span className="value">{calculateUserStats(selectedUserAnalysis.email).score}%</span>
                  </div>
                  <div className="analysis-stat">
                    <span className="label">Total Reports</span>
                    <span className="value">{reports.filter(r => r.user_email === selectedUserAnalysis.email).length}</span>
                  </div>
                  <div className="analysis-stat">
                    <button className="view-btn primary" onClick={() => downloadIndividualPDF(selectedUserAnalysis, reports.filter(r => r.user_email === selectedUserAnalysis.email), 'Selected Period', isAIVisible)}>
                      📄 PDF Report
                    </button>
                    <button className="view-btn" onClick={() => downloadExcel(reports.filter(r => r.user_email === selectedUserAnalysis.email), `Reports_${selectedUserAnalysis.name}.xlsx`, isAIVisible)}>
                      📊 Excel Data
                    </button>
                  </div>
               </div>

               <div className="analysis-chart-container">
                  <h4 style={{marginBottom: '1.5rem', opacity: 0.4, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Productivity Trend (Reports & Tasks)</h4>
                  <div style={{height: '300px', width: '100%'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getUserAnalysisData(selectedUserAnalysis.email, analysisRange)}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                          itemStyle={{color: '#fff'}}
                        />
                        <Area type="monotone" dataKey="tasks" stroke="var(--admin-accent)" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={3} />
                        <Area type="monotone" dataKey="count" stroke="#a78bfa" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="analysis-charts-grid">
                  <div className="chart-card">
                    <h4><span>🍕</span> Category Mix <span className="performance-metric-chip">{getUserCategoryDistribution(selectedUserAnalysis.email).length} Types</span></h4>
                    <div style={{height: '240px', width: '100%'}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getUserCategoryDistribution(selectedUserAnalysis.email)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {getUserCategoryDistribution(selectedUserAnalysis.email).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                            itemStyle={{color: '#fff'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4><span>🕒</span> Operational Rhythm (24h)</h4>
                    <div style={{height: '240px', width: '100%'}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getUserHourlyActivity(selectedUserAnalysis.email)}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                          <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                          />
                          <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4><span>💎</span> Performance Profile</h4>
                    <div style={{height: '240px', width: '100%'}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getUserPerformanceProfile(selectedUserAnalysis.email)}>
                          <PolarGrid stroke="rgba(255,255,255,0.2)" />
                          <PolarAngleAxis dataKey="subject" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 10}} />
                          <Radar
                            name={selectedUserAnalysis.name}
                            dataKey="A"
                            stroke="#818cf8"
                            fill="#818cf8"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>

               <div className="analysis-table-section">
                  <h4 style={{margin: '2rem 0 1rem', opacity: 0.4, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Operational Record</h4>
                  <div className="mini-table-wrapper">
                    <table className="reports-table mini">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Task Count</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.filter(r => r.user_email === selectedUserAnalysis.email).slice(0, 5).map(r => (
                          <tr key={r.id}>
                            <td>{r.report_date}</td>
                            <td><span className="badge badge-daily">{r.category}</span></td>
                            <td>{r.tasks_data?.length || 0}</td>
                            <td><button className="view-btn mini" onClick={() => {
                              setSelectedReport(r);
                              setModalAIVisible(isAIVisible);
                            }}>Inspect</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="admin-modal-overlay animate-fade-in" style={{zIndex: 3000}} onClick={() => setSelectedReport(null)}>
          <div className="admin-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ flex: 1 }}>
                <h3 style={{margin: 0, fontSize: '1.5rem'}}>{selectedReport.user_name}</h3>
                <p style={{margin: '0.2rem 0 0', fontSize: '0.9rem', opacity: 0.6}}>
                   {selectedReport.category} Report &bull; {selectedReport.report_date} &bull; {selectedReport.start_time} - {selectedReport.end_time}
                </p>
              </div>
              <div className="ai-toggle-container" style={{ marginRight: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 1rem', background: modalAIVisible ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid', borderColor: modalAIVisible ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: modalAIVisible ? 'var(--admin-accent)' : '#fff', opacity: modalAIVisible ? 1 : 0.4 }}>AI Mode</span>
                <label className="admin-switch mini">
                  <input type="checkbox" checked={modalAIVisible} onChange={(e) => setModalAIVisible(e.target.checked)} />
                  <span className="admin-slider round"></span>
                </label>
              </div>
              <button className="close-modal" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            <div className="modal-content" style={{maxHeight: '70vh', overflowY: 'auto'}}>
              {modalAIVisible && selectedReport.expanded_data && selectedReport.expanded_data.length > 0 ? (
                <div className="task-list-admin">
                  <div style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--admin-accent)', marginBottom: '1.5rem'}}>🪄 AI Combinatorial Engine</div>
                  {selectedReport.expanded_data.map((task, idx) => (
                    <div key={idx} className="task-item-admin" style={{borderLeft: '4px solid var(--admin-accent)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem'}}>
                        <span className="badge badge-daily" style={{fontSize: '0.65rem'}}>{task.category || 'Task'}</span>
                        <span className="task-time-admin" style={{marginBottom: 0}}>{task.startTime || ''} - {task.endTime || ''}</span>
                      </div>
                      <p style={{margin: 0, lineHeight: 1.6, fontSize: '1rem'}} className="task-text-admin">{task.expanded || task.text || ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="task-list-admin">
                  <div style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem'}}>📝 Original Workforce Log</div>
                  {selectedReport.tasks_data?.map((task, idx) => (
                    <div key={idx} className="task-item-admin">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem'}}>
                        <span className="badge badge-daily" style={{fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)'}}>Log Entry</span>
                        <span className="task-time-admin" style={{marginBottom: 0}}>{task.startTime} - {task.endTime}</span>
                      </div>
                      <p style={{margin: 0, lineHeight: 1.5, fontSize: '1rem'}}>{task.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

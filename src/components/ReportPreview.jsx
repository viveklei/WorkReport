import React from 'react';
import './ReportPreview.css';
import logoImg from '../assets/laserexperts.png';

const ReportPreview = ({ data, metadata, hiddenId, idPrefix = '' }) => {
    const { selectedLogos = ['laserexperts'] } = metadata;

    const allLogos = [
        { id: 'falcon', src: '/logos/falcon.png', alt: 'Falcon' },
        { id: 'laserexperts', src: logoImg, alt: 'Laser Experts India' },
        { id: 'circle', src: '/logos/circle.png', alt: 'Zuesskill' },
        { id: 'whatsapp', src: '/logos/whatsapp.jpg', alt: 'RAITO' }
    ];

    const logos = allLogos.filter(logo => selectedLogos.includes(logo.id));

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            return timeStr;
        }
    };

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const getTaskIcon = (task) => {
        const cat = (task.category || '').toLowerCase();
        const text = (task.expanded || task.original || '').toLowerCase();
        if (text.includes('lunch') || text.includes('meal')) return '🍽️';
        if (text.includes('tea') || text.includes('coffee') || text.includes('break')) return '☕';
        if (cat.includes('meeting') || text.includes('meeting') || text.includes('call')) return '🤝';
        if (cat.includes('design') || text.includes('design') || text.includes('ui') || text.includes('ux')) return '🎨';
        if (cat.includes('develop') || text.includes('develop') || text.includes('code') || text.includes('bug') || text.includes('fix')) return '💻';
        if (text.includes('report') || text.includes('document') || text.includes('email')) return '📝';
        if (text.includes('review') || text.includes('check') || text.includes('audit')) return '🔍';
        if (text.includes('client') || text.includes('customer')) return '🤝';
        if (text.includes('training') || text.includes('learn')) return '📚';
        if (text.includes('deploy') || text.includes('release') || text.includes('launch')) return '🚀';
        if (text.includes('plan') || text.includes('strateg')) return '📊';
        if (text.includes('test') || text.includes('qa') || text.includes('quality')) return '✅';
        return '⚡';
    };

    const isBreakTask = (task) => {
        const text = (task.expanded || task.original || '').toLowerCase();
        return text.includes('tea break') || text.includes('lunch break') || text.includes('lunch') || text.includes('tea');
    };

    const workTasks = data.filter(t => !isBreakTask(t));
    const actionItems = data.filter(t => t.isActionItem);

    return (
        <div className="report-render-wrapper">
            <article className="report-preview" id={hiddenId || `${idPrefix}report-preview`}>

                {/* Top accent bar */}
                <div className="rp-accent-bar" />

                {/* Branding */}
                {logos.length > 0 && (
                    <div className={`branding-bar logo-count-${logos.length}`}>
                        {logos.map((logo, i) => (
                            <img key={i} src={logo.src} alt={logo.alt} className="branding-logo" />
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="report-header">
                    <div className="user-profile-header">
                        {metadata.userPhoto && (
                            <div className="user-photo-container">
                                <img src={metadata.userPhoto} alt="Profile" className="user-report-photo" />
                            </div>
                        )}
                        <div className="user-info">
                            <h1>{metadata.userName}</h1>
                            <p className="role">
                                {metadata.userDesignation && <span>💼 {metadata.userDesignation}</span>}
                                {metadata.userDepartment && <span> &nbsp;|&nbsp; 🏢 {metadata.userDepartment}</span>}
                            </p>
                            {metadata.reportingPerson && (
                                <p className="reporting-to">👤 Reports to: <strong>{metadata.reportingPerson}</strong></p>
                            )}
                        </div>
                    </div>
                    <div className="report-meta">
                        <div className="meta-badge date-badge">
                            <span className="meta-icon">📅</span>
                            <div>
                                <div className="meta-label">Date</div>
                                <div className="meta-value">{formatDate(metadata.reportDate)}</div>
                            </div>
                        </div>
                        <div className="meta-badge cat-badge">
                            <span className="meta-icon">📋</span>
                            <div>
                                <div className="meta-label">Report Type</div>
                                <div className="meta-value">{metadata.category} Report</div>
                            </div>
                        </div>
                        {metadata.startTime && metadata.endTime && (
                            <div className="meta-badge shift-badge">
                                <span className="meta-icon">⏰</span>
                                <div>
                                    <div className="meta-label">Work Shift</div>
                                    <div className="meta-value">{formatTime(metadata.startTime)} – {formatTime(metadata.endTime)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                {data.length > 0 && (
                    <div className="rp-stats-row">
                        <div className="rp-stat">
                            <span className="rp-stat-icon">✅</span>
                            <div>
                                <div className="rp-stat-val">{workTasks.length}</div>
                                <div className="rp-stat-label">Tasks Done</div>
                            </div>
                        </div>
                        <div className="rp-stat">
                            <span className="rp-stat-icon">⏱️</span>
                            <div>
                                <div className="rp-stat-val">{data.length}</div>
                                <div className="rp-stat-label">Total Slots</div>
                            </div>
                        </div>
                        {actionItems.length > 0 && (
                            <div className="rp-stat">
                                <span className="rp-stat-icon">🔄</span>
                                <div>
                                    <div className="rp-stat-val">{actionItems.length}</div>
                                    <div className="rp-stat-label">Follow-ups</div>
                                </div>
                            </div>
                        )}
                        <div className="rp-stat">
                            <span className="rp-stat-icon">⭐</span>
                            <div>
                                <div className="rp-stat-val">100%</div>
                                <div className="rp-stat-label">Attendance</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="report-content">
                    <div className="section-title-row">
                        <span className="section-emoji">📌</span>
                        <h2>Today's Work Log</h2>
                    </div>

                    {data.length > 0 ? (
                        <div className="task-list">
                            {data.map((task, index) => {
                                const isBreak = isBreakTask(task);
                                const icon = getTaskIcon(task);
                                return (
                                    <div key={task.id || index}
                                        className={`task-item ${isBreak ? 'task-item-break' : 'task-item-work'}`}
                                    >
                                        <div className="task-left-bar" />
                                        <div className="task-content">
                                            <div className="task-top-row">
                                                <span className="task-icon">{icon}</span>
                                                <span className="task-timestamp-badge">{task.timestamp}</span>
                                                {task.category && (
                                                    <span className={`task-category-tag ${isBreak ? 'tag-break' : ''}`}>
                                                        {task.category}
                                                    </span>
                                                )}
                                                {task.isActionItem && (
                                                    <span className="tag-action">🔄 Follow-up</span>
                                                )}
                                            </div>
                                            <p className={`expanded-text ${isBreak ? 'break-text' : ''}`}>
                                                {task.expanded}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>📭 No tasks added yet. Start by entering your notes in the input panel.</p>
                        </div>
                    )}
                </div>

                {/* Pending Actions */}
                {actionItems.length > 0 && (
                    <div className="action-items-section">
                        <div className="section-title-row">
                            <span className="section-emoji">🔄</span>
                            <h3>Pending Actions &amp; Follow-ups</h3>
                        </div>
                        <ul className="action-items-list">
                            {actionItems.map((task, index) => (
                                <li key={`action-${index}`} className="action-item">
                                    <span className="action-marker">⚠️</span>
                                    <span>{task.expanded}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Signature / Sign-off */}
                <div className="rp-signoff">
                    <div className="rp-signoff-line" />
                    <div className="rp-signoff-content">
                        <div>
                            <p className="signoff-name">{metadata.userName}</p>
                            <p className="signoff-role">{metadata.userDesignation}{metadata.userDepartment ? ` | ${metadata.userDepartment}` : ''}</p>
                        </div>
                        {metadata.reportingPerson && (
                            <div className="signoff-to">
                                <p className="signoff-label">Submitted to</p>
                                <p className="signoff-name-sm">{metadata.reportingPerson}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="report-footer">
                    <div className="footer-left">
                        <p>⚡ Generated via <strong>LEI Report Panel</strong></p>
                        <p className="copyright-notice">STRICTLY FOR LEI INTERNAL USE ONLY</p>
                    </div>
                    <p className="timestamp">🕐 {new Date().toLocaleString()}</p>
                </div>

                {/* Bottom accent bar */}
                <div className="rp-accent-bar rp-accent-bar-bottom" />
            </article>

            {/* Photo Pages */}
            {metadata.workPhotos && metadata.workPhotos.length > 0 && metadata.workPhotos.map((photo, index) => (
                <div key={index} className="photo-page-separator">
                    <div className="photo-page" id={`${idPrefix}photo-page-${index}`}>
                        <div className="rp-accent-bar" />
                        <div className="photo-page-header">
                            <h2>📎 Work Evidence {metadata.workPhotos.length > 1 ? `(${index + 1} / ${metadata.workPhotos.length})` : ''}</h2>
                            <p>📅 Reference for {formatDate(metadata.reportDate)} &nbsp;|&nbsp; 👤 {metadata.userName}</p>
                        </div>
                        <div className="work-photo-full-container">
                            <img src={photo} alt={`Work Evidence ${index + 1}`} className="work-photo-full" />
                        </div>
                        <div className="photo-page-footer">
                            <p>⚡ {metadata.userName} | {metadata.userDesignation}</p>
                            <p className="copyright-notice">STRICTLY FOR LEI INTERNAL USE ONLY</p>
                        </div>
                        <div className="rp-accent-bar rp-accent-bar-bottom" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReportPreview;

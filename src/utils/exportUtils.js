import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Excel Export Utility using SheetJS
 */
export const downloadExcel = (history, filename = null, useAI = false) => {
    if (!history || history.length === 0) {
        alert("No history to export!");
        return;
    }

    try {
        const data = history.flatMap(entry => {
            const tasks = (useAI && entry.expanded_data) ? entry.expanded_data : (entry.tasks_data || entry.data || entry.tasks || []);
            const date = entry.report_date || entry.date;
            
            if (tasks.length === 0) {
                return [{
                    'Employee': entry.user_name || 'N/A',
                    'Email': entry.user_email || 'N/A',
                    'Date': date,
                    'Time Slot': 'N/A',
                    'Category': entry.category,
                    'Work Accomplishment': entry.input || ''
                }];
            }

            return tasks.map(task => ({
                'Employee': entry.user_name || 'N/A',
                'Email': entry.user_email || 'N/A',
                'Date': date,
                'Time Slot': task.timestamp || (task.startTime ? `${task.startTime}-${task.endTime}` : 'N/A'),
                'Category': task.category || entry.category,
                'Work Accomplishment': (useAI && task.expanded) ? task.expanded : (task.text || '')
            }));
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Work Reports");

        const wscols = [
            { wch: 20 }, // Employee
            { wch: 25 }, // Email
            { wch: 15 }, // Date
            { wch: 25 }, // Time Slot
            { wch: 20 }, // Category
            { wch: 100 }, // Work Accomplishment
        ];
        worksheet['!cols'] = wscols;

        const finalName = filename || `LEI_Team_Archive_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, finalName);

    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("Failed to export Excel sheet: " + error.message);
    }
};

/**
 * Professional Team-Wide PDF Export Utility
 */
export const downloadTeamPDF = (teamName, reports, users, timeframe = 'Selected Period', useAI = false) => {
  if (!reports || reports.length === 0) {
    alert("No report data available for team export.");
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // --- COVER PAGE ---
    doc.setFillColor(15, 23, 42); // Industrial Blue
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('TEAM PERFORMANCE AUDIT', pageWidth/2, 80, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(teamName.toUpperCase(), pageWidth/2, 95, { align: 'center' });
    
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.line(pageWidth/4, 105, (3*pageWidth)/4, 105);
    
    doc.setFontSize(12);
    doc.text(`TIMEFRAME: ${timeframe.toUpperCase()}`, pageWidth/2, 115, { align: 'center' });
    doc.text(`GENERATED: ${new Date().toLocaleString()}`, pageWidth/2, 122, { align: 'center' });
    doc.text(`MODE: ${useAI ? 'AI ENHANCED' : 'ORIGINAL LOGS'}`, pageWidth/2, 129, { align: 'center' });
    
    // Summary Boxes on Cover
    const activeUsers = new Set(reports.map(r => r.user_email)).size;
    const totalTasks = reports.reduce((sum, r) => {
      const tasks = (useAI && r.expanded_data) ? r.expanded_data : (r.tasks_data || []);
      return sum + (tasks.length || 0);
    }, 0);
    
    doc.rect(pageWidth/2 - 70, 145, 140, 40, 'S');
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', pageWidth/2, 155, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Reports Harvested: ${reports.length}`, pageWidth/2, 165, { align: 'center' });
    doc.text(`Active Workforce Participants: ${activeUsers}`, pageWidth/2, 173, { align: 'center' });
    doc.text(`Cumulative Operations Logged: ${totalTasks}`, pageWidth/2, 181, { align: 'center' });

    // --- AGGREGATED METRICS TABLE ---
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('WORKFORCE PRODUCTIVITY MATRIX', 20, 20);
    
    // Calculate stats per user
    const userStats = {};
    users.forEach(u => {
        const userReports = reports.filter(r => r.user_email === u.email);
        if (userReports.length > 0) {
            const tasksCount = userReports.reduce((sum, r) => {
              const tasks = (useAI && r.expanded_data) ? r.expanded_data : (r.tasks_data || []);
              return sum + (tasks.length || 0);
            }, 0);
            userStats[u.email] = {
                name: u.name,
                dept: u.department,
                reports: userReports.length,
                tasks: tasksCount,
                avg: (tasksCount / userReports.length).toFixed(1)
            };
        }
    });

    const summaryData = Object.values(userStats).map(s => [
        s.name,
        s.dept || 'N/A',
        s.reports,
        s.tasks,
        s.avg
    ]);

    autoTable(doc, {
        startY: 30,
        head: [['EMPLOYEE', 'DEPARTMENT', 'REPORTS', 'TOTAL TASKS', 'AVG PER REPORT']],
        body: summaryData,
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 5 }
    });

    // --- DETAILED BREAKDOWN PER EMPLOYEE ---
    const sortedEmails = Object.keys(userStats).sort();
    
    sortedEmails.forEach(email => {
        doc.addPage();
        const stats = userStats[email];
        const userReports = reports.filter(r => r.user_email === email).sort((a,b) => new Date(b.report_date) - new Date(a.report_date));
        
        // Mini Header
        doc.setFillColor(241, 245, 249);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(stats.name.toUpperCase(), 20, 18);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${stats.dept} | ${email}`, 20, 26);
        
        // Individual User Table
        const individualTableData = userReports.flatMap(r => {
            const tasks = (useAI && r.expanded_data) ? r.expanded_data : (r.tasks_data || []);
            return tasks.map(t => [
                r.report_date,
                t.startTime && t.endTime ? `${t.startTime}-${t.endTime}` : 'N/A',
                r.category,
                (useAI && t.expanded) ? t.expanded : (t.text || 'No description')
            ]);
        });

        autoTable(doc, {
            startY: 45,
            head: [['DATE', 'TIME SLOT', 'CATEGORY', 'OPERATION DETAILS']],
            body: individualTableData,
            headStyles: { fillColor: [71, 85, 105], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 3: { cellWidth: 'auto' } }
        });
    });

    // --- FOOTERS ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleString()} | LEI Team Audit Alpha-1`, 20, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    const safeTeamName = teamName.replace(/\s+/g, '_');
    doc.save(`LEI_TEAM_AUDIT_${safeTeamName}_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (err) {
    console.error("Team PDF Export Error:", err);
    alert("Team PDF generation failed: " + err.message);
  }
};

/**
 * Professional PDF Export Utility for Individual Analytics
 */
export const downloadIndividualPDF = (user, reports, timeframe = 'Selected Period', useAI = false) => {
  if (!user) {
    alert("No user data provided for PDF export.");
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header Branding
    doc.setFillColor(15, 23, 42); // Industrial Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LEI PERFORMANCE AUDIT', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`TIMEFRAME: ${timeframe.toUpperCase()}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`MODE: ${useAI ? 'AI ENHANCED' : 'ORIGINAL'}`, pageWidth - 20, 32, { align: 'right' });
    
    // User Profile Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE PROFILE', 20, 55);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 58, pageWidth - 20, 58);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`NAME: ${user.name || 'Anonymous User'}`, 20, 68);
    doc.text(`EMAIL: ${user.email || 'N/A'}`, 20, 74);
    doc.text(`DEPARTMENT: ${user.department || 'N/A'}`, 20, 80);
    doc.text(`DESIGNATION: ${user.designation || 'Staff'}`, 20, 86);
    
    // Summary Stats
    const safeReports = reports || [];
    const totalTasks = safeReports.reduce((sum, r) => {
      const tasks = (useAI && r.expanded_data) ? r.expanded_data : (r.tasks_data || []);
      return sum + (tasks.length || 0);
    }, 0);
    const avgTasks = safeReports.length > 0 ? (totalTasks / safeReports.length).toFixed(1) : 0;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(130, 62, 60, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 135, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reports: ${safeReports.length}`, 135, 76);
    doc.text(`Total Tasks: ${totalTasks}`, 135, 82);
    doc.text(`Avg per Report: ${avgTasks}`, 135, 88);

    // Effort Breakdown (New section)
    const catStats = {};
    safeReports.forEach(r => {
      const cat = r.category || 'Daily';
      catStats[cat] = (catStats[cat] || 0) + 1;
    });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EFFORT BREAKDOWN', 20, 100);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 102, 100, 102);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let yOffset = 110;
    Object.entries(catStats).forEach(([cat, count]) => {
      const percentage = ((count / safeReports.length) * 100).toFixed(0);
      doc.text(`• ${cat}: ${count} reports (${percentage}%)`, 25, yOffset);
      yOffset += 6;
    });

    // Detailed Activity Table
    const tableData = safeReports.flatMap(r => {
      const tasks = (useAI && r.expanded_data) ? r.expanded_data : (r.tasks_data || []);
      return tasks.map(t => [
        r.report_date || 'N/A',
        t.startTime && t.endTime ? `${t.startTime}-${t.endTime}` : 'N/A',
        r.category || 'Daily',
        (useAI && t.expanded) ? t.expanded : (t.text || 'No description')
      ]);
    });

    if (tableData.length > 0) {
      autoTable(doc, {
        startY: yOffset + 10,
        head: [['DATE', 'TIME SLOT', 'CATEGORY', 'WORK ACCOMPLISHMENT']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { horizontal: 20 },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' }
        }
      });
    } else {
      doc.setFontSize(10);
      doc.text("No detailed activity records found for this period.", 20, 110);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${new Date().toLocaleString()} | LEI Industrial Control Center`, 20, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    const safeName = (user.name || 'User').replace(/\s+/g, '_');
    doc.save(`LEI_Audit_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error("PDF Export Error:", err);
    alert("Critical failure during PDF generation: " + err.message);
  }
};

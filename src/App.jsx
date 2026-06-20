import { useState, useMemo, useEffect } from 'react';
import './App.css';
import logo from './assets/laserexperts.png';
import LoginPage from './components/LoginPage';
import ReportPreview from './components/ReportPreview';
import AdminDashboard from './components/AdminDashboard';
import { api } from './api';

import AnalyticsDashboard from './components/AnalyticsDashboard';
import { generateExpandedReport } from './utils/reportGenerator';
import { downloadExcel } from './utils/exportUtils';
import { isSunday, isFirstOfMonth, getWeekRange, getMonthRange, filterReportsByRange, formatShortDate } from './utils/dateHelpers';
import { generatePdfFromElement } from './utils/pdfGenerator';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('is_authenticated') === 'true' || localStorage.getItem('is_authenticated') === 'true';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return sessionStorage.getItem('active_user_email') || localStorage.getItem('active_user_email') || '';
  });

  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('user_role') || localStorage.getItem('user_role') || '';
  });

  const [userName, setUserName] = useState('');
  const [userDesignation, setUserDesignation] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [reportingPerson, setReportingPerson] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [theme, setTheme] = useState(() => {
    const role = sessionStorage.getItem('user_role') || localStorage.getItem('user_role');
    if (role === 'manager') return 'pink';
    return 'dark';
  });
  const [selectedLogos, setSelectedLogos] = useState(['laserexperts']);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Daily');
  const [reportHistory, setReportHistory] = useState([]);
  const [workItems, setWorkItems] = useState([{ id: 1, startTime: '09:00', endTime: '10:00', text: '', isBreak: false }]);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [workPhotos, setWorkPhotos] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportTone, setReportTone] = useState('Standard');
  const [isListening, setIsListening] = useState(false);
  const [hasPendingItems, setHasPendingItems] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showManagerDashboard, setShowManagerDashboard] = useState(false);
  const [morningMemo, setMorningMemo] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);


  useEffect(() => {
    if (isAuthenticated) {
      const fetchAllData = async () => {
        try {
          const profile = await api.getProfile();
          setUserName(profile.name || '');
          setUserDesignation(profile.designation || '');
          setUserDepartment(profile.department || '');
          setReportingPerson(profile.reporting_person || '');
          setUserPhoto(profile.photo || null);
          setUserRole(profile.role || 'user');
          sessionStorage.setItem('user_role', profile.role || 'user');
          localStorage.setItem('user_role', profile.role || 'user');

          const settings = await api.getSettings();
          const isAdmin = profile.role === 'admin' || profile.email === 'admin@lei.com';
          const isManager = profile.role === 'manager';

          if (settings.theme) {
            let targetTheme = settings.theme;

            // Security/Consistency check: 
            // Only managers can have 'pink'. If an admin or user has it, force dark.
            if (!isManager && targetTheme === 'pink') targetTheme = 'dark';

            setTheme(targetTheme);
          } else {
            setTheme(isManager ? 'pink' : 'dark');
          }
          if (settings.report_tone) setReportTone(settings.report_tone);
          if (settings.recipient_email) setRecipientEmail(settings.recipient_email);
          setUseAI(settings && settings.use_ai === 1);


          if (settings.smart_memo) {
            try {
              const memoData = JSON.parse(settings.smart_memo);
              const today = new Date().toISOString().split('T')[0];
              if (memoData.date === today && !memoData.dismissed) {
                setMorningMemo(memoData.items);
              }
            } catch (e) {
              console.error('Error parsing smart memo:', e);
            }
          }
          const draftData = await api.getDraft();
          if (draftData.tasks_data?.length > 0) {
            setWorkItems(draftData.tasks_data);
            setStartTime(draftData.start_time || '09:00');
            setEndTime(draftData.end_time || '18:00');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          if (error.status === 401 || error.status === 403 || error.message?.includes('Forbidden') || error.message?.includes('Session')) {
            alert('Your session has expired. Please log in again.');
            handleLogout();
          }
        }
      };
      fetchAllData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);


  const handleSaveProfile = async () => {
    if (!userEmail) return;
    setIsSavingProfile(true);

    try {
      await api.updateProfile({
        name: userName,
        designation: userDesignation,
        department: userDepartment,
        reporting_person: reportingPerson,
        photo: userPhoto
      });

      await api.updateSettings({
        theme,
        use_ai: useAI ? 1 : 0,
        report_tone: reportTone,
        recipient_email: recipientEmail
      });

      // Log success (removed localStorage logo save)
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setTimeout(() => setIsSavingProfile(false), 2000);
    }
  };

  // Check for carryover items from last report
  useEffect(() => {
    if (reportHistory.length > 0) {
      const lastReport = reportHistory[0];
      const items = lastReport.data || lastReport.tasks || [];
      const pending = items.filter(t => t.isActionItem);
      if (pending.length > 0 && workItems.length === 1 && workItems[0].text === '') {
        setHasPendingItems(true);
      }
    }
  }, [reportHistory, workItems]);

  // Morning Briefing dismiss logic
  const dismissMemo = async () => {
    setMorningMemo(null);
    try {
      const settings = await api.getSettings();
      let memoData = {};
      if (settings.smart_memo) memoData = JSON.parse(settings.smart_memo);
      memoData.dismissed = true;
      await api.updateSettings({ ...settings, smart_memo: memoData });
    } catch (e) {
      console.error('Error dismissing memo:', e);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = async () => {
    const isManager = String(userRole).toLowerCase() === 'manager';

    let newTheme;
    if (isManager) {
      newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'pink' : 'dark';
    } else {
      // Admins and regular users only get Dark/Light
      newTheme = theme === 'dark' ? 'light' : 'dark';
    }

    setTheme(newTheme);

    try {
      const currentSettings = await api.getSettings();
      await api.updateSettings({
        ...currentSettings,
        theme: newTheme
      });
    } catch (error) {
      console.error('Failed to save theme setting:', error);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Image must be smaller than 50MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setUserPhoto(base64);
        // Removed localStorage photo save, now handled by handleSaveProfile
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLogo = (logoId) => {
    setSelectedLogos(prev =>
      prev.includes(logoId)
        ? prev.filter(id => id !== logoId)
        : [...prev, logoId]
    );
  };

  const handleLogin = (userData, rememberMe) => {
    setIsAuthenticated(true);
    setUserEmail(userData.email);

    // Set session storage (cleared on tab close)
    sessionStorage.setItem('is_authenticated', 'true');
    sessionStorage.setItem('active_user_email', userData.email);

    // If rememberMe is false, we should ensure token is NOT in localStorage long-term
    // But since LoginPage handles the token storage, we just handle the UI preference here
    if (rememberMe) {
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('active_user_email', userData.email);
    } else {
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('active_user_email');
    }

    const role = userData.role || 'user';
    setUserRole(role);
    if (role === 'manager') setTheme('pink');
    sessionStorage.setItem('user_role', userData.role || 'user');
    localStorage.setItem('user_role', userData.role || 'user');

    // Data fetching is handled by useEffect[isAuthenticated]
  };

  // Predefined time slots for the work day
  const PREDEFINED_SLOTS = [
    { startTime: '09:00', endTime: '10:00', label: '9:00 AM – 10:00 AM', isBreak: false },
    { startTime: '10:00', endTime: '10:30', label: '10:00 AM – 10:30 AM', isBreak: false },
    { startTime: '10:30', endTime: '10:45', label: '10:30 AM – 10:45 AM  ☕ Tea Break', isBreak: true, defaultText: 'Tea Break' },
    { startTime: '10:45', endTime: '11:00', label: '10:45 AM – 11:00 AM', isBreak: false },
    { startTime: '11:00', endTime: '12:00', label: '11:00 AM – 12:00 PM', isBreak: false },
    { startTime: '12:00', endTime: '13:00', label: '12:00 PM – 1:00 PM', isBreak: false },
    { startTime: '13:00', endTime: '13:30', label: '1:00 PM – 1:30 PM  🍽 Lunch Break', isBreak: true, defaultText: 'Lunch Break' },
    { startTime: '13:30', endTime: '14:00', label: '1:30 PM – 2:00 PM', isBreak: false },
    { startTime: '14:00', endTime: '15:00', label: '2:00 PM – 3:00 PM', isBreak: false },
    { startTime: '15:00', endTime: '16:00', label: '3:00 PM – 4:00 PM', isBreak: false },
    { startTime: '16:00', endTime: '16:15', label: '4:00 PM – 4:15 PM  ☕ Tea Break', isBreak: true, defaultText: 'Tea Break' },
    { startTime: '16:15', endTime: '17:00', label: '4:15 PM – 5:00 PM', isBreak: false },
    { startTime: '17:00', endTime: '18:00', label: '5:00 PM – 6:00 PM', isBreak: false },
    { startTime: '18:00', endTime: '19:00', label: '6:00 PM – 7:00 PM', isBreak: false },
    { startTime: '19:00', endTime: '20:00', label: '7:00 PM – 8:00 PM', isBreak: false },
  ];

  const addTaskItem = (slot) => {
    const newItem = {
      id: Date.now(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      text: slot.defaultText || '',
      isBreak: slot.isBreak || false
    };
    setWorkItems(prev => [...prev, newItem]);
    setShowSlotPicker(false);
  };

  const removeTaskItem = (id) => {
    if (workItems.length > 1) {
      setWorkItems(workItems.filter(item => item.id !== id));
    } else {
      setWorkItems([{ id: Date.now(), startTime: '09:00', endTime: '10:00', text: '', isBreak: false }]);
    }
  };

  const updateTaskItem = (id, field, value) => {
    setWorkItems(workItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleBulkImport = () => {
    const text = prompt("Paste your raw notes here (one per line):");
    if (text) {
      let lastEnd = workItems[workItems.length - 1]?.endTime || '09:00';

      const newItems = text.split('\n')
        .filter(line => line.trim().length > 0)
        .map((line, index) => {
          const currentStart = lastEnd;
          const [h, m] = currentStart.split(':');
          const nextH = (parseInt(h) + 1) % 24;
          const currentEnd = `${String(nextH).padStart(2, '0')}:${m}`;
          lastEnd = currentEnd;

          return {
            id: Date.now() + index,
            startTime: currentStart,
            endTime: currentEnd,
            text: line.trim()
          };
        });
      setWorkItems(prev => [...prev.filter(i => i.text !== ''), ...newItems]);
    }
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      await api.saveDraft({
        tasks_data: workItems,
        start_time: startTime,
        end_time: endTime
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  // Auto-save draft every 30 seconds if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      api.saveDraft({
        tasks_data: workItems,
        start_time: startTime,
        end_time: endTime
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, workItems, startTime, endTime]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');

    // Clear everything
    sessionStorage.clear();
    localStorage.removeItem('work_report_token');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('active_user_email');

    window.location.reload(); // Force reload to clear all states cleanly
  };

  const handleWorkPhotoUpload = (e) => {
    const files = Array.from(e.target.files);

    // Total limit of images (current + new)
    if (workPhotos.length + files.length > 10) {
      alert("You can only upload up to 10 evidence photos.");
      return;
    }

    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is larger than 50MB. Please upload smaller images.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeWorkPhoto = (index) => {
    setWorkPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const expandedReport = useMemo(() => {
    return generateExpandedReport(workItems, userDesignation, reportTone, useAI);
  }, [workItems, userDesignation, reportTone, useAI]);

  const handleExport = async () => {
    setIsGeneratingPdf(true);
    try {
      // Archive the report to the database for Admin Console visibility
      await api.saveReport({
        report_date: reportDate,
        category: category,
        tasks_data: workItems,
        expanded_data: expandedReport,
        selected_logos: selectedLogos,
        start_time: startTime,
        end_time: endTime
      });
      const freshReports = await api.getReports();
      setReportHistory(freshReports);

      // ENSURE DOM STABILITY: Give React time to render and images to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      const filename = `Work_Report_${userName.replace(/\s+/g, '_')}_${reportDate}.pdf`;
      const elementsToCapture = ['pdf-export-report-preview', ...workPhotos.map((_, i) => `pdf-export-photo-page-${i}`)];
      await generatePdfFromElement(elementsToCapture, filename);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      if (err.status === 401 || err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Session')) {
        alert('Your session has expired. Please log in again.');
        handleLogout();
      } else {
        alert('Failed to generate PDF: ' + (err.message || 'Unknown error') + '. Please try again.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCurrentExcelExport = async () => {
    try {
      // Archive the report to the database for Admin Console visibility
      await api.saveReport({
        report_date: reportDate,
        category: category,
        tasks_data: workItems,
        expanded_data: expandedReport,
        selected_logos: selectedLogos,
        start_time: startTime,
        end_time: endTime
      });
      const freshReports = await api.getReports();
      setReportHistory(freshReports);
    } catch (err) {
      console.error('Failed to archive report:', err);
    }

    const currentEntry = {
      date: reportDate,
      category: category,
      input: workItems.map(item => `${item.startTime}-${item.endTime}: ${item.text}`).join('\n'),
      data: expandedReport
    };
    downloadExcel([currentEntry]);
  };

  const handleHistoryExport = () => {
    downloadExcel(reportHistory);
  };

  const handleWhatsApp = async () => {
    const hasContent = workItems.some(item => item.text && item.text.trim().length > 0);
    if (!hasContent) {
      alert('Please add some work before sharing.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Archive the report to the database for Admin Console visibility
      await api.saveReport({
        report_date: reportDate,
        category: category,
        tasks_data: workItems,
        expanded_data: expandedReport,
        selected_logos: selectedLogos,
        start_time: startTime,
        end_time: endTime
      });
      const freshReports = await api.getReports();
      setReportHistory(freshReports);

      // Build a professional, high-engaging WhatsApp message
      const today = new Date(reportDate);
      const dayName = today.toLocaleDateString('en-IN', { weekday: 'long' });
      const formattedDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      const getWhatsAppIcon = (text) => {
        const lowerText = (text || '').toLowerCase();
        if (lowerText.includes('lunch')) return '🍴';
        if (lowerText.includes('tea') || lowerText.includes('coffee') || lowerText.includes('break')) return '☕';
        if (lowerText.includes('meeting') || lowerText.includes('call') || lowerText.includes('sync')) return '📞';
        if (lowerText.includes('client') || lowerText.includes('customer') || lowerText.includes('visit')) return '🤝';
        if (lowerText.includes('fix') || lowerText.includes('bug') || lowerText.includes('repair')) return '🛠️';
        if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('report')) return '📊';
        if (lowerText.includes('train') || lowerText.includes('learn') || lowerText.includes('study')) return '📚';
        if (lowerText.includes('email') || lowerText.includes('send') || lowerText.includes('mail')) return '📧';
        return '✅';
      };

      const taskLines = workItems
        .filter(item => item.text && item.text.trim().length > 0)
        .map((item) => {
          const startH = parseInt(item.startTime.split(':')[0]);
          const startM = item.startTime.split(':')[1];
          const endH = parseInt(item.endTime.split(':')[0]);
          const endM = item.endTime.split(':')[1];
          const startAmPm = startH >= 12 ? 'PM' : 'AM';
          const endAmPm = endH >= 12 ? 'PM' : 'AM';
          const startHour = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH;
          const endHour = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
          const timeLabel = `${startHour}:${startM} ${startAmPm} - ${endHour}:${endM} ${endAmPm}`;
          const icon = getWhatsAppIcon(item.text);
          return `${icon} *${timeLabel}*\n   \u2022 ${item.text.trim()}`;
        });

      const totalTasks = workItems.filter(i => i.text && i.text.trim() && !i.isBreak).length;
      const divider = '═════════════════════════════';

      const summaryText =
        `📢 *${category.toUpperCase()} WORK REPORT*\n` +
        `📅 *${dayName}, ${formattedDate}*\n\n` +
        `👤 *Employee:* ${userName}\n` +
        `💼 *Designation:* ${userDesignation || 'Reporting Person'}\n` +
        `${userDepartment ? `🏢 *Department:* ${userDepartment}\n` : ''}\n` +
        `${divider}\n` +
        `📝 *ACTIVITY LOG*\n` +
        `${divider}\n\n` +
        taskLines.join('\n\n') +
        `\n\n${divider}\n` +
        `📊 *QUICK STATS*\n` +
        `• Total Tasks Completed: *${totalTasks}*\n` +
        `• Status: *Submitted Successfully*\n\n` +
        `🙏 *Thank you for your review!*\n\n` +
        `Best Regards,\n*${userName}* ⭐\n_Laser Expert India LLP_`;

      // Step 2: Use URLSearchParams for robust encoding of complex characters/emojis
      const params = new URLSearchParams();
      params.append('text', summaryText);

      // Use api.whatsapp.com which is more robust than wa.me redirect for long encoded strings
      const whatsappUrl = `https://api.whatsapp.com/send?${params.toString()}`;
      window.open(whatsappUrl, '_blank');

      // Simple notification
      alert(`✅ Report shared via WhatsApp!`);
    } catch (err) {
      console.error('WhatsApp share failed:', err);
      if (err.status === 401 || err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Session')) {
        alert('Your session has expired. Please log in again to share on WhatsApp.');
        handleLogout();
      } else {
        alert('Sharing failed: ' + (err.message || 'Unknown error') + '. Please try again.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const handleSaveReport = async () => {
    if (expandedReport.length === 0) return;

    try {
      const reportDate_local = reportDate;
      const category_local = category;
      const tasks_data_local = workItems;
      const selected_logos_local = selectedLogos;
      const start_time_local = startTime;
      const end_time_local = endTime;

      await api.saveReport({
        report_date: reportDate_local,
        category: category_local,
        tasks_data: tasks_data_local,
        expanded_data: expandedReport,
        selected_logos: selected_logos_local,
        start_time: start_time_local,
        end_time: end_time_local
      });

      // Refresh history
      const freshReports = await api.getReports();
      setReportHistory(freshReports);

      // Save to Smart Memo for "Tomorrow" via Settings
      const pendingItems = expandedReport.filter(t => t.isActionItem);
      if (pendingItems.length > 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const memo = {
          date: tomorrow.toISOString().split('T')[0],
          items: pendingItems.map(t => t.original),
          dismissed: false
        };

        const currentSettings = await api.getSettings();
        await api.updateSettings({
          ...currentSettings,
          smart_memo: memo
        });
      }

      setWorkItems([{ id: Date.now(), startTime: '09:00', endTime: '10:00', text: '' }]);
      setHasPendingItems(false);

      // Clear draft on server since it's now a full report
      await api.saveDraft({ tasks_data: [] });

      alert('Report saved to database!');
    } catch (error) {
      console.error('Error saving report:', error);
      if (error.status === 401 || error.status === 403 || error.message?.includes('Forbidden') || error.message?.includes('Session')) {
        alert('Your session has expired. Please log in again to save your report.');
        handleLogout();
      } else {
        alert('Failed to save report: ' + (error.message || 'Unknown error') + '. Please try again.');
      }
    }
  };

  const handleCarryover = () => {
    if (reportHistory.length > 0) {
      const lastReport = reportHistory[0];
      const items = lastReport.data || lastReport.tasks || [];
      const pending = items.filter(t => t.isActionItem);
      const newItems = pending.map((t, index) => {
        const h = 9 + index;
        const start = `${String(h % 24).padStart(2, '0')}:00`;
        const end = `${String((h + 1) % 24).padStart(2, '0')}:00`;
        return {
          id: Date.now() + index,
          startTime: start,
          endTime: end,
          text: t.original || t.expanded
        };
      });
      setWorkItems(newItems);
      setHasPendingItems(false);
    }
  };

  const handleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      setWorkItems(prev => {
        const last = prev[prev.length - 1];
        const nextStart = `${hours}:${minutes}`;
        const nextEnd = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:${minutes}`;

        if (last && last.text === '') {
          return prev.map(item => item.id === last.id ? { ...item, text: transcript, startTime: nextStart, endTime: nextEnd } : item);
        }
        return [...prev, { id: Date.now(), startTime: nextStart, endTime: nextEnd, text: transcript }];
      });
    };

    recognition.start();
  };

  const generatePeriodicReport = (type) => {
    const range = type === 'weekly' ? getWeekRange() : getMonthRange();
    const filtered = filterReportsByRange(reportHistory, range.start, range.end);

    if (filtered.length === 0) {
      alert(`No reports found for the last ${type === 'weekly' ? 'week' : 'month'}.`);
      return;
    }

    const allTasks = filtered.flatMap(r => r.data || r.tasks || []);
    const newItems = allTasks.map((t, index) => {
      const h = 9 + index;
      const start = `${String(h % 24).padStart(2, '0')}:00`;
      const end = `${String((h + 1) % 24).padStart(2, '0')}:00`;
      return {
        id: Date.now() + index,
        startTime: start,
        endTime: end,
        text: t.expanded
      };
    });

    setWorkItems(newItems);
    setCategory(type === 'weekly' ? 'Weekly' : 'Monthly');
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} summary generated!`);
  };

  const handleSendEmail = async () => {
    if (expandedReport.length === 0) {
      alert('Please add some work before sending email.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Archive the report to the database for Admin Console visibility
      await api.saveReport({
        report_date: reportDate,
        category: category,
        tasks_data: workItems,
        selected_logos: selectedLogos,
        start_time: startTime,
        end_time: endTime
      });
      const freshReports = await api.getReports();
      setReportHistory(freshReports);

      const subject = encodeURIComponent(`${category} Work Report - ${userName} - ${reportDate}`);
      const body = encodeURIComponent(
        `Hello, Please find my ${category.toLowerCase()} work report for ${reportDate} below.\n\n\n` +
        `Best Regards!\n\n` +
        `${userName} | ${userDesignation}${userDepartment ? ` | ${userDepartment}` : ''}\n` +
        `Laser Expert India LLP`
      );

      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
      alert('\u2705 Report archived! Please send the email that just opened.');
    } catch (err) {
      console.error('Email report failure:', err);
      alert('Failed to prepare report: ' + (err.message || 'Unknown error') + '. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure? This will delete all your session data and settings. Account data on the server will remain.")) {
      handleLogout();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="bg-animation">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  if (showAdminDashboard) {
    return (
      <div className="app-container">
        <div className="bg-animation">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} mode="admin" />
      </div>
    );
  }

  if (showManagerDashboard) {
    return (
      <div className="app-container">
        <div className="bg-animation">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <AdminDashboard onClose={() => setShowManagerDashboard(false)} mode="manager" />
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">


      {morningMemo && (
        <div className="morning-memo-overlay animate-fade-in">
          <div className="glass-card morning-memo">
            <div className="memo-header">
              <h3>☀️ Morning Briefing</h3>
              <button className="close-memo" onClick={dismissMemo}>✕</button>
            </div>
            <p className="subtitle">Outstanding items from yesterday's report:</p>
            <ul className="memo-list">
              {morningMemo.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
            <div className="memo-footer">
              <button className="primary" onClick={() => {
                const newItems = morningMemo.map((m, index) => ({
                  id: Date.now() + index,
                  startTime: '09:00',
                  endTime: '10:00',
                  text: m
                }));
                setWorkItems(prev => [...prev.filter(i => i.text !== ''), ...newItems]);
                dismissMemo();
              }}>Import All</button>
              <button className="secondary" onClick={dismissMemo}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <header className="main-header" id="header-area">
        <div className="logo-brand">
          <img src={logo} alt="Laser Experts" className="header-logo" />
          <div className="logo-text">
            LEI <span className="accent-text">Report</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🌸'}
          </button>
          <button className="primary send-mail-btn" onClick={handleSendEmail} disabled={isGeneratingPdf}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            {isGeneratingPdf ? 'Generating PDF...' : "Send Today's Mail"}
          </button>
          <button className="secondary whatsapp-btn" onClick={handleWhatsApp} disabled={isGeneratingPdf}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            Send via WhatsApp
          </button>

          {(String(userRole).trim().toLowerCase() === 'admin' || userEmail === 'admin@lei.com') && (
            <button className="primary admin-console-btn" onClick={() => setShowAdminDashboard(true)}>
              Admin Console
            </button>
          )}

          {String(userRole).trim().toLowerCase() === 'manager' && (
            <button className="primary admin-console-btn" style={{backgroundColor: '#db2777'}} onClick={() => setShowManagerDashboard(true)}>
              Manager Console
            </button>
          )}

          <button className="primary preview-btn" onClick={() => setShowPreview(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            Preview Report
          </button>
          <button className="secondary logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="bento-grid">
        {/* Input Panel */}
        <div className="glass-card input-section bento-item" id="input-area">
          <div className="section-header">
            <div className="header-with-smart">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h3>Quick Input</h3>
                <div className="report-date-picker">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="date-input-field"
                    title="Change Report Date"
                  />
                </div>
              </div>
              <div className="smart-actions">
                <label className="checkbox-item ai-toggle-label mr-2" title="Enable AI sentence enhancement">
                  <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                  <span>AI Sentences</span>
                </label>
                {hasPendingItems && (
                  <button className="smart-badge animate-pulse" onClick={handleCarryover} title="Import Pending Items">
                    📦 Carryover
                  </button>
                )}
                <button
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={handleVoice}
                  title="Speak your report"
                >
                  {isListening ? '🛑 Listening...' : '🎤 Voice Input'}
                </button>
              </div>
            </div>
            <p className="subtitle">Enter each task with its specific completion time</p>
          </div>

          <div className="task-entry-list">
            {workItems.map((item, index) => (
              <div key={item.id} className="task-entry-row animate-slide-in">
                <div className="task-row-time">
                  <div className="time-slot-inputs">
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => updateTaskItem(item.id, 'startTime', e.target.value)}
                      title="Start Time"
                    />
                    <span className="time-to">to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => updateTaskItem(item.id, 'endTime', e.target.value)}
                      title="End Time"
                    />
                  </div>
                </div>
                <div className="task-row-text">
                  <input
                    type="text"
                    placeholder="What did you work on? (e.g., Client meeting, Bug fixing...)"
                    value={item.text}
                    onChange={(e) => updateTaskItem(item.id, 'text', e.target.value)}
                  />
                </div>
                <button
                  className="remove-task-btn"
                  onClick={() => removeTaskItem(item.id)}
                  title="Remove Task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="task-entry-actions mt-4">
            <button className="add-task-btn" onClick={() => setShowSlotPicker(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add New Task
            </button>
            {showSlotPicker && (
              <div className="slot-picker-overlay" onClick={() => setShowSlotPicker(false)}>
                <div className="slot-picker-modal glass-card animate-pop-in" onClick={e => e.stopPropagation()}>
                  <div className="slot-picker-header">
                    <h4>⏰ Select Time Slot</h4>
                    <button className="close-slot-picker" onClick={() => setShowSlotPicker(false)}>✕</button>
                  </div>
                  <p className="slot-picker-subtitle">Pick a predefined time slot for your task</p>
                  <div className="slot-list">
                    {PREDEFINED_SLOTS.map((slot, idx) => {
                      const alreadyAdded = workItems.some(
                        item => item.startTime === slot.startTime && item.endTime === slot.endTime
                      );
                      return (
                        <button
                          key={idx}
                          className={`slot-option ${slot.isBreak ? 'slot-break' : 'slot-work'} ${alreadyAdded ? 'slot-added' : ''}`}
                          onClick={() => !alreadyAdded && addTaskItem(slot)}
                          title={alreadyAdded ? 'Already added' : ''}
                        >
                          <span className="slot-time">{slot.label}</span>
                          {alreadyAdded && <span className="slot-badge">✓ Added</span>}
                          {slot.isBreak && !alreadyAdded && <span className="slot-badge break-badge">Break</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <button
              className={`save-progress-btn ${isSaving ? 'saved' : ''}`}
              onClick={handleSaveProgress}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Saved!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                  Save Progress
                </>
              )}
            </button>
          </div>
          <div className="work-photo-upload mt-6">
            <div className="section-header mb-4">
              <p className="upload-text-main">Work Evidence Photos ({workPhotos.length}/10)</p>
              <p className="upload-text-sub">Add multiple photos for your report</p>
            </div>

            {workPhotos.length < 10 && (
              <label className="upload-zone animate-fade-in mb-4">
                <div className="upload-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                </div>
                <div className="upload-text">
                  <p className="upload-text-main">Click to add photos</p>
                  <p className="upload-text-sub">PNG, JPG up to 50MB each</p>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleWorkPhotoUpload} />
              </label>
            )}

            {workPhotos.length > 0 && (
              <div className="photo-preview-grid animate-fade-in">
                {workPhotos.map((photo, index) => (
                  <div key={index} className="photo-preview-card">
                    <img src={photo} alt={`Evidence ${index + 1}`} />
                    <div className="photo-overlay">
                      <button className="overlay-btn remove" onClick={() => removeWorkPhoto(index)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="glass-card config-section bento-item" id="config-area">
          <h3>Configuration</h3>
          <div className="input-group">
            <label>Employee Name</label>
            <div className="name-with-photo">
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
              <div className="photo-upload-container">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} id="photo-input" style={{ display: 'none' }} />
                <label htmlFor="photo-input" className="photo-preview" title="Upload Photo">
                  {userPhoto ? <img src={userPhoto} alt="Profile" /> : <span>+</span>}
                </label>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Report Branding (Logos)</label>
            <div className="logo-selector">
              <label className="checkbox-item">
                <input type="checkbox" checked={selectedLogos.includes('falcon')} onChange={() => toggleLogo('falcon')} />
                <span>Falcon</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked={selectedLogos.includes('laserexperts')} onChange={() => toggleLogo('laserexperts')} />
                <span>Laser Experts</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked={selectedLogos.includes('circle')} onChange={() => toggleLogo('circle')} />
                <span>Zuesskill</span>
              </label>
              <label className="checkbox-item">
                <input type="checkbox" checked={selectedLogos.includes('whatsapp')} onChange={() => toggleLogo('whatsapp')} />
                <span>RAITO</span>
              </label>
            </div>
          </div>

          <div className="input-group">
            <label>Professional Role</label>
            <input
              type="text"
              value={userDesignation}
              onChange={(e) => setUserDesignation(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </div>

          <div className="input-group">
            <label>Reporting Person (Manager)</label>
            <input
              type="text"
              value={reportingPerson}
              onChange={(e) => setReportingPerson(e.target.value)}
              placeholder="e.g. Monica Geller"
            />
          </div>

          <button
            className={`save-profile-btn ${isSavingProfile ? 'saved' : ''} mt-4`}
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Profile Saved!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                Save Profile
              </>
            )}
          </button>
        </div>

        {/* Modal-style Preview Section */}
        {showPreview && (
          <div className="preview-overlay animate-fade-in">
            <div className="preview-modal glass-card animate-pop-in">
              <div className="modal-header">
                <h3>Report Preview</h3>
                <div className="modal-actions">
                  <button className="primary download-pdf-btn" onClick={handleExport} disabled={isGeneratingPdf}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    PDF
                  </button>
                  <button className="success excel-export-btn" onClick={handleCurrentExcelExport}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    Excel
                  </button>
                  <button className="secondary history-export-btn" onClick={handleHistoryExport} title="Export All History">
                    History
                  </button>
                  <button className="close-modal" onClick={() => setShowPreview(false)}>✕</button>
                </div>
              </div>
              <div className="preview-container">
                <ReportPreview
                  data={expandedReport}
                  metadata={{ userName, userDesignation, userDepartment, reportingPerson, reportDate, category, selectedLogos, userPhoto, workPhotos, startTime, endTime }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hiding Insights & Actions section for now as requested */}
        {/* 
        <div className="glass-card stats-section bento-item" id="stats-area">
          <div className="section-header">
            <h3>Insights & Actions</h3>
            ...
          </div>
          ...
        </div>
        */}

        {/* Analytics Section - Dynamic Pop-in */}
        {showAnalytics && (
          <div className="glass-card analytics-section bento-item animate-pop-in" id="analytics-area">
            <div className="section-header">
              <h3>📊 Work Analytics</h3>
              <button className="close-drawer" onClick={() => setShowAnalytics(false)}>✕</button>
            </div>
            <div className="analytics-content">
              <AnalyticsDashboard history={reportHistory} />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer animate-fade-in">
        <p>© 2026 Proudly made by LEI Developer</p>
        <p className="footer-warning">Strictly use inside LEI only</p>
      </footer>

      {/* Hidden off-screen report preview — DEDICATED for PDF export to ensure stable dimensions and unhindered capture */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
        <ReportPreview
          data={expandedReport}
          metadata={{ userName, userDesignation, userDepartment, reportingPerson, reportDate, category, selectedLogos, userPhoto, workPhotos, startTime, endTime }}
          idPrefix="pdf-export-"
        />
      </div>
    </div>
  );
}

export default App;

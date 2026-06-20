/**
 * Utility functions for handling date logic in work reports.
 */

export const isSunday = (date = new Date()) => {
    return date.getDay() === 0;
};

export const isFirstOfMonth = (date = new Date()) => {
    return date.getDate() === 1;
};

export const getWeekRange = (date = new Date()) => {
    const end = new Date(date);
    const start = new Date(date);
    start.setDate(date.getDate() - 6);
    return { start, end };
};

export const getMonthRange = (date = new Date()) => {
    const end = new Date(date);
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(date.getFullYear(), date.getMonth(), 0);
    return { start, end: lastDayOfLastMonth };
};

export const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const filterReportsByRange = (history, start, end) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    return history.filter(report => {
        const reportTime = new Date(report.date).getTime();
        return reportTime >= startTime && reportTime <= endTime;
    });
};

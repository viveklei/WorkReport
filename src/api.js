const API_BASE_URL = '/api';



const getAuthHeaders = () => {
    const token = localStorage.getItem('work_report_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    let errorData = null;

    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.error || 'Request failed');
            error.status = response.status;
            error.code = data.code; // Capture custom error codes like AUTH_EXPIRED
            throw error;
        }
        return data;
    } else {
        const text = await response.text();
        if (!response.ok) {
            // Better handle plain text responses like "Forbidden"
            const error = new Error(text || 'Request failed');
            error.status = response.status;
            throw error;
        }
        return text;
    }
};

export const api = {
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },

    async loginWithGoogle(credential) {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });
        return handleResponse(response);
    },

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        return handleResponse(response);
    },

    async getReports() {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async saveReport(reportData) {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reportData)
        });
        return handleResponse(response);
    },

    async getSettings() {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateSettings(settings) {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
        });
        return handleResponse(response);
    },

    async getDraft() {
        const response = await fetch(`${API_BASE_URL}/draft`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async saveDraft(draftData) {
        const response = await fetch(`${API_BASE_URL}/draft`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(draftData)
        });
        return handleResponse(response);
    },

    // Admin Methods
    async getAdminUsers() {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getAllReports() {
        const response = await fetch(`${API_BASE_URL}/admin/all-reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateAdminUser(email, userData) {
        const response = await fetch(`${API_BASE_URL}/admin/update-user`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email, ...userData })
        });
        return handleResponse(response);
    },
    async deleteAdminUser(email) {
        const response = await fetch(`${API_BASE_URL}/admin/delete-user`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email })
        });
        return handleResponse(response);
    },
    async resetAdminPassword(email) {
        const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email })
        });
        return handleResponse(response);
    },

    // Manager Methods
    async getManagerWorkforce() {
        const response = await fetch(`${API_BASE_URL}/manager/workforce`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    async getManagerReports() {
        const response = await fetch(`${API_BASE_URL}/manager/reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    }
};

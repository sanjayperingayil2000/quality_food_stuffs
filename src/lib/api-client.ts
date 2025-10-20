// API service utilities for frontend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    // Get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  clearAccessToken() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Handle different types of headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // If we get a 401 and have a refresh token, try to refresh
      if (response.status === 401 && this.accessToken && endpoint !== '/auth?action=refresh') {
        const refreshResult = await this.refreshToken();
        if (!refreshResult.error && this.accessToken) {
          // Retry the original request with the new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            return { error: retryData.error || 'Request failed' };
          }
          return { data: retryData };
        } else {
          // If refresh failed, clear tokens and return error
          this.clearAccessToken();
          return { error: 'Session expired. Please login again.' };
        }
      }

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Auth methods

  async login(credentials: { email: string; password: string }) {
    const result = await this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (result.data?.accessToken) {
      this.setAccessToken(result.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', result.data.refreshToken);
      }
    }

    return result;
  }

  async refreshToken() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      return { error: 'No refresh token available' };
    }

    const result = await this.request<{ accessToken: string; refreshToken: string }>('/auth?action=refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (result.data?.accessToken) {
      this.setAccessToken(result.data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', result.data.refreshToken);
      }
    }

    return result;
  }

  async logout() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      await this.request('/auth?action=logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    this.clearAccessToken();
  }

  // User methods
  async getUsers() {
    return this.request<{ users: any[] }>('/users');
  }

  async createUser(userData: { name: string; email: string; password: string; roles?: string[] }) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(id: string) {
    return this.request<{ user: any }>(`/users/${id}`);
  }

  async updateUser(id: string, updates: Partial<{ name: string; roles: string[]; isActive: boolean }>) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings methods
  async getSettings() {
    return this.request<{ settings: any[] }>('/settings');
  }

  async createSetting(key: string, value: any) {
    return this.request<{ setting: any }>('/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  }

  async updateSetting(key: string, value: any) {
    return this.request<{ setting: any }>(`/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  // Calculation methods
  async getCalculations(filters?: { contextName?: string; userId?: string }) {
    const params = new URLSearchParams();
    if (filters?.contextName) params.append('contextName', filters.contextName);
    if (filters?.userId) params.append('userId', filters.userId);
    
    const query = params.toString();
    return this.request<{ items: any[] }>(`/calculations${query ? `?${query}` : ''}`);
  }

  async createCalculation(data: {
    contextName: string;
    inputs: Record<string, any>;
    results?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    return this.request<{ item: any }>('/calculations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCalculation(id: string) {
    return this.request<{ item: any }>(`/calculations/${id}`);
  }

  async updateCalculation(id: string, updates: {
    inputs?: Record<string, any>;
    results?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    return this.request<{ item: any }>(`/calculations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCalculation(id: string) {
    return this.request(`/calculations/${id}`, {
      method: 'DELETE',
    });
  }

  // Additional Expenses methods
  async getAdditionalExpenses(filters?: { 
    driverId?: string; 
    category?: string; 
    status?: string; 
    startDate?: string; 
    endDate?: string; 
  }) {
    const params = new URLSearchParams();
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const query = params.toString();
    return this.request<{ expenses: any[] }>(`/additional-expenses${query ? `?${query}` : ''}`);
  }

  async createAdditionalExpense(data: {
    title: string;
    description?: string;
    category: string;
    amount: number;
    currency?: string;
    date: string;
    driverId?: string;
    driverName?: string;
    designation: string;
    receiptNumber?: string;
    vendor?: string;
    isReimbursable?: boolean;
    status?: string;
  }) {
    return this.request<{ expense: any }>('/additional-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdditionalExpense(id: string) {
    return this.request<{ expense: any }>(`/additional-expenses/${id}`);
  }

  async updateAdditionalExpense(id: string, updates: {
    title?: string;
    description?: string;
    category?: string;
    amount?: number;
    currency?: string;
    date?: string;
    driverId?: string;
    driverName?: string;
    designation?: string;
    receiptNumber?: string;
    vendor?: string;
    isReimbursable?: boolean;
    status?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedReason?: string;
  }) {
    return this.request<{ expense: any }>(`/additional-expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAdditionalExpense(id: string) {
    return this.request(`/additional-expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // History methods
  async getHistory(filters?: { collectionName?: string; documentId?: string; action?: string }) {
    const params = new URLSearchParams();
    if (filters?.collectionName) params.append('collectionName', filters.collectionName);
    if (filters?.documentId) params.append('documentId', filters.documentId);
    if (filters?.action) params.append('action', filters.action);
    
    const query = params.toString();
    return this.request<{ items: any[] }>(`/history${query ? `?${query}` : ''}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;

// API service utilities for frontend
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  settingsAccess: boolean;
  phone?: string;
  state?: string;
  city?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  id: string;
  name: string;
  designation: 'driver' | 'staff' | 'ceo';
  phoneNumber: string;
  email: string;
  address: string;
  routeName?: string;
  location?: string;
  salary?: number;
  balance?: number;
  balanceHistory?: Array<{
    version: number;
    balance: number;
    updatedAt: string;
    reason?: string;
    updatedBy?: string;
  }>;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

interface Product {
  id: string;
  name: string;
  category: 'bakery' | 'fresh';
  price: number;
  description?: string;
  sku: string;
  unit: string;
  minimumQuantity: number;
  maximumQuantity?: number;
  isActive: boolean;
  expiryDays?: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  priceHistory?: Array<{
    version: number;
    price: number;
    updatedAt: string;
    reason?: string;
    updatedBy?: string;
  }>;
}

interface DailyTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  products: Array<{
    productId: string;
    productName: string;
    category: 'bakery' | 'fresh';
    quantity: number;
    unitPrice: number;
  }>;
  transfer: {
    isProductTransferred: boolean;
    transferredProducts: Array<{
      productId: string;
      productName: string;
      category: 'bakery' | 'fresh';
      quantity: number;
      unitPrice: number;
      receivingDriverId: string;
      receivingDriverName: string;
      transferredFromDriverId: string;
      transferredFromDriverName: string;
    }>;
  };
  acceptedProducts: Array<{
    productId: string;
    productName: string;
    category: 'bakery' | 'fresh';
    quantity: number;
    unitPrice: number;
  }>;
  collectionAmount: number;
  purchaseAmount: number;
  expiry: number;
  discount: number;
  petrol: number;
  balance: number;
  totalAmount: number;
  netTotal: number;
  grandTotal: number;
  expiryAfterTax: number;
  amountToBe: number;
  salesDifference: number;
  profit: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

interface AdditionalExpense {
  id: string;
  title: string;
  description?: string;
  category: 'petrol' | 'maintenance' | 'variance' | 'salary' | 'others';
  amount: number;
  currency: string;
  date: string;
  driverId?: string;
  driverName?: string;
  designation: 'driver' | 'manager' | 'ceo' | 'staff';
  receiptNumber?: string;
  vendor?: string;
  isReimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

interface Setting {
  key: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
interface Snapshot {
  name?: string;
  id?: string;
}

interface Activity {
  _id: string;
  action: string;
  collectionName: string;
  documentId?: string;
  before?: Snapshot;
  after?: Snapshot;
  actor?: string; // username or actor ID
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    // Get token from localStorage on client side
    if (globalThis.window !== undefined) {
      this.accessToken = globalThis.window.localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (globalThis.window !== undefined) {
      globalThis.window.localStorage.setItem('accessToken', token);
    }
  }

  clearAccessToken() {
    this.accessToken = null;
    if (globalThis.window !== undefined) {
      globalThis.window.localStorage.removeItem('accessToken');
      globalThis.window.localStorage.removeItem('refreshToken');
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
        for (const [key, value] of options.headers) {
          headers[key] = value;
        }
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
    const result = await this.request<AuthResponse>('/auth?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (result.data?.accessToken) {
      this.setAccessToken(result.data.accessToken);
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem('refreshToken', result.data.refreshToken);
      }
    }

    return result;
  }

  async refreshToken() {
    const refreshToken = globalThis.window?.localStorage.getItem('refreshToken');
    if (refreshToken === null) {
      return { error: 'No refresh token available' };
    }

    const result = await this.request<{ accessToken: string; refreshToken: string }>('/auth?action=refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (result.data?.accessToken) {
      this.setAccessToken(result.data.accessToken);
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem('refreshToken', result.data.refreshToken);
      }
    }

    return result;
  }

  async logout() {
    const refreshToken = globalThis.window?.localStorage.getItem('refreshToken');
    if (refreshToken !== null) {
      await this.request('/auth?action=logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    this.clearAccessToken();
  }

  // User methods
  async getUsers() {
    return this.request<{ users: User[] }>('/users');
  }

  async createUser(userData: { name: string; email: string; password: string; roles?: string[] }) {
    return this.request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(id: string) {
    return this.request<{ user: User }>(`/users/${id}`);
  }

  async updateUser(id: string, updates: Partial<{ name: string; roles: string[]; isActive: boolean; phone?: string; state?: string; city?: string; profilePhoto?: string }>) {
    return this.request<{ user: User }>(`/users/${id}`, {
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
    return this.request<{ settings: Setting[] }>('/settings');
  }

  async createSetting(key: string, value: unknown) {
    return this.request<{ setting: Setting }>('/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  }

  async updateSetting(key: string, value: unknown) {
    return this.request<{ setting: Setting }>(`/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  // Employee methods
  async getEmployees(filters?: { designation?: string; isActive?: boolean; routeName?: string }) {
    const params = new URLSearchParams();
    if (filters?.designation) params.append('designation', filters.designation);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.routeName) params.append('routeName', filters.routeName);
    
    const query = params.toString();
    return this.request<{ employees: Employee[] }>(`/employees${query ? `?${query}` : ''}`);
  }

  async getEmployee(id: string) {
    return this.request<{ employee: Employee }>(`/employees/${id}`);
  }

  async createEmployee(data: Partial<Employee>) {
    return this.request<{ employee: Employee }>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: Partial<Employee>) {
    return this.request<{ employee: Employee }>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string) {
    return this.request<{ message: string }>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Product methods
  async getProducts(filters?: { category?: string; isActive?: boolean; supplier?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.supplier) params.append('supplier', filters.supplier);
    
    const query = params.toString();
    return this.request<{ products: Product[] }>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request<{ product: Product }>(`/products/${id}`);
  }

  async createProduct(data: Partial<Product>) {
    return this.request<{ product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<Product>) {
    return this.request<{ product: Product }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Daily Trip methods
  async getDailyTrips(filters?: { driverId?: string; date?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const query = params.toString();
    return this.request<{ trips: DailyTrip[] }>(`/daily-trips${query ? `?${query}` : ''}`);
  }

  async getDailyTrip(id: string) {
    return this.request<{ trip: DailyTrip }>(`/daily-trips/${id}`);
  }

  async createDailyTrip(data: Partial<DailyTrip>) {
    return this.request<{ trip: DailyTrip }>('/daily-trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDailyTrip(id: string, data: Partial<DailyTrip>) {
    return this.request<{ trip: DailyTrip }>(`/daily-trips/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDailyTrip(id: string) {
    return this.request<{ message: string }>(`/daily-trips/${id}`, {
      method: 'DELETE',
    });
  }

  // Additional Expense methods
  async getAdditionalExpenses(filters?: { category?: string; status?: string; driverId?: string; designation?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.designation) params.append('designation', filters.designation);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const query = params.toString();
    return this.request<{ expenses: AdditionalExpense[] }>(`/additional-expenses${query ? `?${query}` : ''}`);
  }

  async getAdditionalExpense(id: string) {
    return this.request<{ expense: AdditionalExpense }>(`/additional-expenses/${id}`);
  }




  async getCalculation(id: string) {
    return this.request<{ item: Record<string, unknown> }>(`/calculations/${id}`);
  }

  async updateCalculation(id: string, updates: {
    inputs?: Record<string, unknown>;
    results?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    return this.request<{ item: Record<string, unknown> }>(`/calculations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCalculation(id: string) {
    return this.request(`/calculations/${id}`, {
      method: 'DELETE',
    });
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
    return this.request<{ expense: AdditionalExpense }>('/additional-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    return this.request<{ expense: AdditionalExpense }>(`/additional-expenses/${id}`, {
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
async getHistory<T extends Activity = Activity>(
  filters?: { collectionName?: string; documentId?: string; action?: string }
): Promise<ApiResponse<{ items: T[] }>> {
  const params = new URLSearchParams();
  if (filters?.collectionName) params.append('collectionName', filters.collectionName);
  if (filters?.documentId) params.append('documentId', filters.documentId);
  if (filters?.action) params.append('action', filters.action);

  const query = params.toString();
  return this.request<{ items: T[] }>(`/histories${query ? `?${query}` : ''}`);
}

}

export const apiClient = new ApiClient();
export default apiClient;

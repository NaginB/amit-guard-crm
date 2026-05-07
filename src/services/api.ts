import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:3000/api/v1";

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useGuardAuth = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: HeadersInit = {};

    // Add authorization header if token exists
    // Use guard token for guard-specific endpoints, admin token for others
    // If useGuardAuth is false but no admin token exists and guard token exists, use guard token
    let token: string | null = null;
    if (useGuardAuth) {
      token = localStorage.getItem("guardToken");
    } else {
      const adminToken = localStorage.getItem("token");
      token = adminToken || localStorage.getItem("guardToken"); // Fallback to guard token if admin token doesn't exist
    }

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          (errorData && (errorData.message || errorData.error)) ||
          `Request failed (${response.status})`;
        toast.error(message);
        throw new Error(message);
      }

      return await response.json();
    } catch (error: unknown) {
      const message = (error as Error)?.message || "Something went wrong";
      toast.error(message);
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      status: string;
      message: string;
      data: { token: string; role?: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{
      status: string;
      message: string;
      data: {
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
        };
      };
    }>("/auth/me");
  }

  async guardLogin(contactNumber: string, password: string) {
    return this.request<{
      status: string;
      message: string;
      data: { token: string; guard: any };
    }>("/auth/guard/login", {
      method: "POST",
      body: JSON.stringify({ contactNumber, password }),
    });
  }

  // Guard endpoints
  async getGuards() {
    return this.request<{
      status: string;
      results: number;
      data: { guards: any[] };
    }>("/guards");
  }

  async getGuard(id: string) {
    return this.request<{ status: string; data: { guard: any } }>(
      `/guards/${id}`
    );
  }

  async createGuard(guardData: any) {
    return this.request<{
      status: string;
      data: { guard: any; password?: string };
    }>("/guards", {
      method: "POST",
      body: JSON.stringify(guardData),
    });
  }

  async updateGuard(id: string, guardData: any) {
    return this.request<{ status: string; data: { guard: any } }>(
      `/guards/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(guardData),
      }
    );
  }

  async deleteGuard(id: string) {
    return this.request<{ status: string; data: null }>(`/guards/${id}`, {
      method: "DELETE",
    });
  }

  // Upload endpoints
  async uploadFile(file: File, folder?: string) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return this.request<{
      status: string;
      data: { url: string; publicId: string };
    }>("/upload/single", {
      method: "POST",
      body: JSON.stringify({ dataUrl: base64, folder }),
    });
  }

  async deleteUpload(publicId: string) {
    return this.request<{ status: string; data: { deleted: boolean } }>(
      "/upload/delete",
      {
        method: "POST",
        body: JSON.stringify({ publicId }),
      }
    );
  }

  // Inventory endpoints
  async getInventories() {
    return this.request<{
      status: string;
      data: any[];
    }>("/inventories");
  }

  async getActiveInventories() {
    return this.request<{
      status: string;
      data: any[];
    }>("/inventories/active");
  }

  async getInventory(id: string) {
    return this.request<{ status: string; data: any }>(`/inventories/${id}`);
  }

  async createInventory(inventoryData: any) {
    return this.request<{ status: string; data: any }>("/inventories", {
      method: "POST",
      body: JSON.stringify(inventoryData),
    });
  }

  async updateInventory(id: string, inventoryData: any) {
    return this.request<{ status: string; data: any }>(`/inventories/${id}`, {
      method: "PUT",
      body: JSON.stringify(inventoryData),
    });
  }

  async deleteInventory(id: string) {
    return this.request<{ status: string; data: any }>(`/inventories/${id}`, {
      method: "DELETE",
    });
  }

  async syncInventoryQuantities() {
    return this.request<{ status: string; data: any }>("/inventories/sync", {
      method: "POST",
    });
  }

  // Site methods
  async getSites(): Promise<any> {
    return this.request<any>("/sites");
  }

  async getSite(id: string): Promise<any> {
    return this.request<any>(`/sites/${id}`);
  }

  async createSite(siteData: any): Promise<any> {
    return this.request<any>("/sites", {
      method: "POST",
      body: JSON.stringify(siteData),
    });
  }

  async updateSite(id: string, siteData: any): Promise<any> {
    return this.request<any>(`/sites/${id}`, {
      method: "PUT",
      body: JSON.stringify(siteData),
    });
  }

  async deleteSite(id: string): Promise<any> {
    return this.request<any>(`/sites/${id}`, {
      method: "DELETE",
    });
  }

  async getActiveSites(): Promise<any> {
    return this.request<any>("/sites/active");
  }

  async searchSites(query: string): Promise<any> {
    return this.request<any>(
      `/sites/search?query=${encodeURIComponent(query)}`
    );
  }

  async filterSitesByType(type: string): Promise<any> {
    return this.request<any>(
      `/sites/filter/type?type=${encodeURIComponent(type)}`
    );
  }

  async filterSitesByCity(city: string): Promise<any> {
    return this.request<any>(
      `/sites/filter/city?city=${encodeURIComponent(city)}`
    );
  }

  // Project methods
  async getProjects(filters?: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/projects${queryString ? `?${queryString}` : ""}`
    );
  }

  async getProject(id: string): Promise<any> {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(projectData: any): Promise<any> {
    return this.request<any>("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any): Promise<any> {
    return this.request<any>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string): Promise<any> {
    return this.request<any>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  async getProjectStats(): Promise<any> {
    return this.request<any>("/projects/stats");
  }

  async getProjectsByGuard(guardId: string, filters?: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/projects/guard/${guardId}${queryString ? `?${queryString}` : ""}`
    );
  }

  async getProjectsBySite(siteId: string, filters?: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/projects/site/${siteId}${queryString ? `?${queryString}` : ""}`
    );
  }

  async getGuardsByProject(projectId: string): Promise<any> {
    return this.request<any>(`/projects/${projectId}/guards`);
  }

  // Attendance endpoints
  async getAttendance(filters?: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/attendance${queryString ? `?${queryString}` : ""}`
    );
  }

  async getAttendanceById(id: string): Promise<any> {
    return this.request<any>(`/attendance/${id}`);
  }

  async createAttendance(attendanceData: any): Promise<any> {
    return this.request<any>("/attendance", {
      method: "POST",
      body: JSON.stringify(attendanceData),
    });
  }

  async updateAttendance(id: string, attendanceData: any): Promise<any> {
    return this.request<any>(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(attendanceData),
    });
  }

  async deleteAttendance(id: string): Promise<any> {
    return this.request<any>(`/attendance/${id}`, {
      method: "DELETE",
    });
  }

  async getAttendanceAnalytics(filters?: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/attendance/analytics${queryString ? `?${queryString}` : ""}`
    );
  }

  async getAttendanceAssignments(): Promise<any> {
    return this.request<any>("/attendance/assignments");
  }

  async getAttendanceCalendar(
    guardId: string,
    projectId: string,
    filters?: any
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/attendance/calendar/${guardId}/${projectId}${
        queryString ? `?${queryString}` : ""
      }`
    );
  }

  async bulkUpdateAttendance(
    attendanceIds: string[],
    updateData: any
  ): Promise<any> {
    return this.request<any>("/attendance/bulk", {
      method: "PATCH",
      body: JSON.stringify({ attendanceIds, ...updateData }),
    });
  }

  // Photo-based attendance methods
  async createAttendanceWithPhoto(attendanceData: {
    guardId: string;
    siteId: string;
    photoUrl: string;
    notes?: string;
  }): Promise<any> {
    return this.request<any>(
      "/attendance/photo",
      {
        method: "POST",
        body: JSON.stringify(attendanceData),
      },
      true
    ); // Use guard authentication
  }

  async getMonthlyAttendanceCalendar(
    guardId: string,
    siteId: string,
    filters?: { year?: number; month?: number }
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<any>(
      `/attendance/calendar/${guardId}/${siteId}/monthly${
        queryString ? `?${queryString}` : ""
      }`
    );
  }

  // Weekly Off API methods
  async getWeeklyOff(guardId: string, projectId: string): Promise<any> {
    return this.request<any>(`/weekly-off/${guardId}/${projectId}`);
  }

  async upsertWeeklyOff(data: {
    guardId: string;
    projectId: string;
    siteId: string;
    weeklyOffDays: number[];
  }): Promise<any> {
    return this.request<any>("/weekly-off", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWeeklyOff(
    guardId: string,
    projectId: string,
    weeklyOffDays: number[]
  ): Promise<any> {
    return this.request<any>(`/weekly-off/${guardId}/${projectId}`, {
      method: "PUT",
      body: JSON.stringify({ weeklyOffDays }),
    });
  }

  async deleteWeeklyOff(guardId: string, projectId: string): Promise<any> {
    return this.request<any>(`/weekly-off/${guardId}/${projectId}`, {
      method: "DELETE",
    });
  }

  // Salary slip methods
  async getSalarySlip(
    guardId: string,
    siteId: string,
    year?: number,
    month?: number
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append("year", year.toString());
    if (month) queryParams.append("month", month.toString());
    const queryString = queryParams.toString();
    return this.request<any>(
      `/salary-slip/${guardId}/${siteId}${queryString ? `?${queryString}` : ""}`
    );
  }

  // Bill methods
  async generateBill(
    projectId: string,
    data: { year: number; month: number; tax?: number; notes?: string }
  ): Promise<any> {
    return this.request<any>(`/bills/${projectId}/generate`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getBill(billId: string): Promise<any> {
    return this.request<any>(`/bills/${billId}`);
  }

  async getBillsByProject(projectId: string): Promise<any> {
    return this.request<any>(`/bills/project/${projectId}`);
  }

  async updateBillStatus(
    billId: string,
    status: "Pending" | "Overdue" | "Hold" | "Paid"
  ): Promise<any> {
    return this.request<any>(`/bills/${billId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async updateBillDetails(
    billId: string,
    data: { tax?: number; notes?: string }
  ): Promise<any> {
    return this.request<any>(`/bills/${billId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteBill(billId: string): Promise<any> {
    return this.request<any>(`/bills/${billId}`, {
      method: "DELETE",
    });
  }

  async sendBillEmail(
    billId: string,
    recipientEmail: string,
    message?: string
  ): Promise<any> {
    return this.request<any>(`/bills/${billId}/send-email`, {
      method: "POST",
      body: JSON.stringify({ recipientEmail, message }),
    });
  }

  // Quick Bill endpoints
  async getQuickBills(): Promise<any> {
    return this.request<any>("/quick-bills");
  }

  async getQuickBill(id: string): Promise<any> {
    return this.request<any>(`/quick-bills/${id}`);
  }

  async createQuickBill(data: { address: string; amountPerDay: number; totalDays: number }): Promise<any> {
    return this.request<any>("/quick-bills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateQuickBill(id: string, data: any): Promise<any> {
    return this.request<any>(`/quick-bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteQuickBill(id: string): Promise<any> {
    return this.request<any>(`/quick-bills/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiService = new ApiService();
export default apiService;

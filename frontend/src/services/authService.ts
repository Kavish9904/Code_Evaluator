import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
}

export interface AdminSignupData extends SignupData {
  admin_secret: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    // Check for token in localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
      console.log(
        "[AuthService] Initialized with token:",
        this.token ? "exists" : "none"
      );
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log("[AuthService] Attempting login for:", credentials.username);
      const formData = new FormData();
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        formData
      );
      console.log("[AuthService] Login successful");
      this.setToken(response.data.access_token);
      return response.data;
    } catch (error) {
      console.error("[AuthService] Login failed:", error);
      throw this.handleError(error);
    }
  }

  public async signup(data: SignupData): Promise<User> {
    try {
      console.log("[AuthService] Attempting signup for:", data.email);
      const response = await axios.post<User>(`${API_URL}/auth/signup`, data);
      console.log("[AuthService] Signup successful");
      return response.data;
    } catch (error) {
      console.error("[AuthService] Signup failed:", error);
      throw this.handleError(error);
    }
  }

  public async adminSignup(data: AdminSignupData): Promise<User> {
    try {
      console.log("[AuthService] Attempting admin signup for:", data.email);
      const response = await axios.post<User>(
        `${API_URL}/auth/admin/signup`,
        data
      );
      console.log("[AuthService] Admin signup successful");
      return response.data;
    } catch (error) {
      console.error("[AuthService] Admin signup failed:", error);
      throw this.handleError(error);
    }
  }

  public async logout(): Promise<void> {
    try {
      console.log("[AuthService] Attempting logout");
      await axios.post(`${API_URL}/auth/logout`, null, {
        headers: this.getAuthHeader(),
      });
      this.removeToken();
      console.log("[AuthService] Logout successful");
    } catch (error) {
      console.error("[AuthService] Logout error:", error);
    } finally {
      this.removeToken();
    }
  }

  public async getCurrentUser(): Promise<User> {
    try {
      console.log("[AuthService] Fetching current user");
      const response = await axios.get<User>(`${API_URL}/auth/me`, {
        headers: this.getAuthHeader(),
      });
      console.log("[AuthService] Current user fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("[AuthService] Failed to fetch current user:", error);
      throw this.handleError(error);
    }
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public getToken(): string | null {
    return this.token;
  }

  private setToken(token: string): void {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      console.log("[AuthService] Token stored in localStorage");
    }
  }

  private removeToken(): void {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      console.log("[AuthService] Token removed from localStorage");
    }
  }

  public getAuthHeader(): { Authorization: string } | {} {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || "An error occurred";
      return new Error(message);
    }
    return new Error("An unexpected error occurred");
  }
}

export const authService = AuthService.getInstance();

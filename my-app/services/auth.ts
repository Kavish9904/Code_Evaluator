import axios from "axios";

const API_URL = "https://codeevaluator.onrender.com/api";

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  bio?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;

  private constructor() {
    // Only try to access localStorage in client-side environment
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("user");
        }
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async setAuthCookie(userId: string) {
    if (typeof window !== "undefined") {
      try {
        await fetch("/api/auth/set-cookie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error("Failed to set auth cookie:", error);
      }
    }
  }

  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Use our Next.js API route for login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const userData = await response.json();
      this.user = userData;

      // Store user data in localStorage and cookie
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(this.user));
        await this.setAuthCookie(this.user.id);
      }

      return this.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw this.handleError(error);
    }
  }

  public async signup(data: SignupData): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, data);
      this.user = response.data;

      // Store user data in localStorage and cookie
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(this.user));
        await this.setAuthCookie(this.user.id);
      }

      return this.user;
    } catch (error) {
      console.error("Signup failed:", error);
      throw this.handleError(error);
    }
  }

  public logout(): void {
    this.user = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      // The cookie will be removed by the browser when the session ends
    }
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public async isAuthenticated(): Promise<boolean> {
    // First check in-memory state
    if (this.user) {
      return true;
    }

    // If no in-memory state, check localStorage
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
          return true;
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("user");
        }
      }
    }

    // If still not authenticated, check with the server
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        this.user = userData;
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return true;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
    }

    return false;
  }

  public getAuthHeader(): { Authorization: string } {
    if (!this.user) {
      throw new Error("User not authenticated");
    }
    return {
      Authorization: `Bearer ${this.user.id}`,
    };
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || "Authentication failed";
      return new Error(message);
    }
    return new Error(error.message || "An unexpected error occurred");
  }
}

export const authService = AuthService.getInstance();

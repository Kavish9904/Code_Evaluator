import { NextResponse } from "next/server";
import axios from "axios";

const API_URL = "https://codeevaluator.onrender.com/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Keep the full email for authentication but clean it for display
    const displayUsername = username.includes("@")
      ? username.split("@")[0]
      : username;

    // Format the request data as form data
    const formData = new FormData();
    formData.append("username", username); // Use full email for authentication
    formData.append("password", password);

    // Make the request to the backend API
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Get user data after successful login
    const userResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`,
      },
    });

    // Set the auth cookie
    const cookieResponse = NextResponse.json(userResponse.data);
    cookieResponse.cookies.set("userId", userResponse.data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set the username cookie with display username (without email domain)
    cookieResponse.cookies.set("username", displayUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set the access token cookie
    cookieResponse.cookies.set("access_token", response.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return cookieResponse;
  } catch (error) {
    console.error("[Login API] Error:", error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.detail || "Login failed" },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

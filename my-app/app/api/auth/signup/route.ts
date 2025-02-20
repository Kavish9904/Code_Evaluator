import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  // Here you would create a new user in your database
  // For this example, we'll just check if all fields are provided
  if (name && email && password) {
    // In a real app, you would hash the password before storing it
    return NextResponse.json({ success: true, message: "User created successfully" })
  } else {
    return NextResponse.json({ success: false, message: "Invalid user data" }, { status: 400 })
  }
}


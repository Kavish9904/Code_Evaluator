import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // Get username from cookie if it exists
  const cookieStore = cookies();
  const username = cookieStore.get("username")?.value;

  // Return the username if found, otherwise return null
  return NextResponse.json({
    username: username || null,
  });
}

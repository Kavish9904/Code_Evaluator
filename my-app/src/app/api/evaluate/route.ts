import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Add OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  try {
    // Log the request
    console.log("API route hit");

    const body = await req.json();
    console.log("Request body:", body);

    // Send a test response
    const response = {
      passed: true,
      output: "API is working",
      receivedData: body,
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Server error",
        passed: false,
        output: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

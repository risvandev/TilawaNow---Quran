import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { 
      error: "Gone", 
      message: "The AI service is now powered by Puter.js directly in the browser. Please update your client." 
    }, 
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      status: "deprecated", 
      message: "Please use the client-side Puter SDK." 
    }, 
    { status: 410 }
  );
}

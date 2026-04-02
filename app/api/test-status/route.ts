import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    testStatus: process.env.TEST_STATUS || "",
  });
}

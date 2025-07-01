import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";

export async function GET(request) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";
import { jsonSuccess } from "@/lib/api-error";

export async function POST() {
  const response = jsonSuccess({ message: "Successfully logged out" });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}

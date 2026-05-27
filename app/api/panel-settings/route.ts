import { NextResponse } from "next/server";
import { getPanelOrdersEnabled, setPanelOrdersEnabled } from "@/lib/panelSettings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const enabled = await getPanelOrdersEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membaca setting.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ message: "Field 'enabled' (boolean) wajib." }, { status: 400 });
  }
  try {
    await setPanelOrdersEnabled(body.enabled);
    return NextResponse.json({ enabled: body.enabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update setting.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

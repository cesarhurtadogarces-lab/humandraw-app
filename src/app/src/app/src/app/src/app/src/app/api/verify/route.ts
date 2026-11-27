import { NextRequest, NextResponse } from "next/server";
import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal?: string;
}

// Almacenamiento temporal en memoria
const participants = new Map<string, { ticketNumber: string; claimedAt: string }>();

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload;
    const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`;

    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal
    )) as IVerifyResponse;

    if (!verifyRes.success) {
      return NextResponse.json(
        { verified: false, message: "La prueba de World ID no es válida." },
        { status: 400 }
      );
    }

    const existing = participants.get(payload.nullifier_hash);
    if (existing) {
      return NextResponse.json({
        verified: true,
        alreadyClaimed: true,
        ticket: existing,
      });
    }

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newRecord = {
      ticketNumber: `HD-${randomDigits}`,
      claimedAt: new Date().toISOString(),
    };

    participants.set(payload.nullifier_hash, newRecord);

    return NextResponse.json({
      verified: true,
      alreadyClaimed: false,
      ticket: newRecord,
    });
  } catch (error) {
    console.error("Error en /api/verify:", error);
    return NextResponse.json(
      { verified: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

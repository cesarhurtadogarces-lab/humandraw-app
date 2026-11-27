"use client";

import { useState } from "react";
import {
  MiniKit,
  VerifyCommandInput,
  VerificationLevel,
} from "@worldcoin/minikit-js";

interface TicketData {
  ticketNumber: string;
  nullifierHash: string;
  claimedAt: string;
}

export default function HumanDrawPage() {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [totalHumans, setTotalHumans] = useState<number>(142);

  const handleClaimTicket = async () => {
    setErrorMsg(null);

    if (!MiniKit.isInstalled()) {
      setErrorMsg("Abre HumanDraw desde World App para reclamar tu boleto.");
      return;
    }

    setLoading(true);
    setStatusMsg("Confirmando humanidad en World App...");

    const verifyPayload: VerifyCommandInput = {
      action: "reclamar-boleto",
      verification_level: VerificationLevel.Orb,
    };

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      if (finalPayload.status === "error") {
        setErrorMsg("Verificación cancelada.");
        setStatusMsg(null);
        setLoading(false);
        return;
      }

      setStatusMsg("Generando tu boleto único...");

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload,
          action: "reclamar-boleto",
        }),
      });

      const data = await res.json();

      if (data.verified && data.ticket) {
        setTicket(data.ticket);
        setTotalHumans((prev) => prev + (data.alreadyClaimed ? 0 : 1));
        setStatusMsg(
          data.alreadyClaimed
            ? "Ya habías reclamado tu boleto para este sorteo."
            : "¡Boleto emitido con éxito!"
        );
      } else {
        setErrorMsg(data.message || "No se pudo validar tu participación.");
        setStatusMsg(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión con el servidor.");
      setStatusMsg(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between p-5 max-w-md mx-auto bg-zinc-950 text-white">
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-lg tracking-tight">HumanDraw</span>
        </div>
        <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400">
          {totalHumans} humanos participando
        </span>
      </header>

      <section className="my-auto space-y-6">
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center space-y-3 shadow-2xl">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
            Sorteo Semanal #01 • Sin Bots
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            50 WLD
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            1 persona = 1 oportunidad real. Verifica tu World ID para obtener tu
            boleto gratuito.
          </p>
        </div>

        {ticket ? (
          <div className="relative bg-emerald-950/40 border-2 border-dashed border-emerald-500/60 rounded-2xl p-6 text-center space-y-3">
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Boleto Oficial Verificado
            </p>
            <div className="text-3xl font-mono font-black tracking-widest text-white">
              {ticket.ticketNumber}
            </div>
            <p className="text-xs text-zinc-400">
              Registrado el{" "}
              {new Date(ticket.claimedAt).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <button
            onClick={handleClaimTicket}
            disabled={loading}
            className="w-full py-4 px-6 bg-white text-black font-bold text-base rounded-2xl hover:bg-zinc-200 active:scale-[0.99] transition disabled:opacity-50 shadow-lg"
          >
            {loading ? "Verificando..." : "Reclamar mi Boleto Único"}
          </button>
        )}

        {statusMsg && !errorMsg && (
          <p className="text-center text-xs text-emerald-400 font-medium">
            {statusMsg}
          </p>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-center">
            <p className="text-xs text-red-300">{errorMsg}</p>
          </div>
        )}
      </section>

      <footer className="text-center pb-4">
        <p className="text-[11px] text-zinc-600">
          Protegido con Proof of Personhood de World ID
        </p>
      </footer>
    </main>
  );
}

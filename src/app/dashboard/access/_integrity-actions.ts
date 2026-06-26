"use server";

import prisma from "@/lib/prisma";
import { createHash } from "crypto";

/**
 * Integrity verification for the access journal. Recomputes the local hash chain,
 * checks each block against its sealed contents (catches any tampering), and returns
 * a short verified history so the result is tangible (you see the actual blocks).
 */

const GENESIS = "0".repeat(64);
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export interface BlockSummary {
  blockIndex: number;
  holderName: string;
  holderRole: string;
  location: string;
  result: string;
  reason: string | null;
  hashShort: string;
}

export interface IntegrityResult {
  count: number;
  valid: boolean;
  broken: { blockIndex: number; holderName: string; location: string } | null;
  history: BlockSummary[];
}

export async function verifyIntegrity(): Promise<IntegrityResult> {
  const events = await prisma.accessEvent.findMany({ orderBy: { blockIndex: "asc" } });

  let prev = GENESIS;
  let broken: IntegrityResult["broken"] = null;

  for (const e of events) {
    let ok = e.prevHash === prev && sha256(e.blockData) === e.blockHash;
    if (ok) {
      try {
        const b = JSON.parse(e.blockData) as Record<string, unknown>;
        if (
          b.result !== e.result ||
          b.badgeNumber !== e.badgeNumber ||
          b.holderRole !== e.holderRole ||
          b.readerId !== e.readerId ||
          ((b.reason ?? null) as string | null) !== (e.reason ?? null)
        ) {
          ok = false;
        }
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      broken = { blockIndex: e.blockIndex, holderName: e.holderName, location: e.location };
      break;
    }
    prev = e.blockHash;
  }

  // Most recent 12 blocks, newest first → the just-simulated block appears on top.
  const history: BlockSummary[] = events
    .slice(-12)
    .reverse()
    .map((e) => ({
      blockIndex: e.blockIndex,
      holderName: e.holderName,
      holderRole: e.holderRole,
      location: e.location,
      result: e.result,
      reason: e.reason,
      hashShort: e.blockHash.slice(0, 10),
    }));

  return { count: events.length, valid: broken === null, broken, history };
}

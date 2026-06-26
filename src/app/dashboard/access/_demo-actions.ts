"use server";

import prisma from "@/lib/prisma";
import { createHash } from "crypto";
import { Client, Wallet, convertStringToHex } from "xrpl";

/**
 * Demo: simulate a badge scan (granted/denied). It appends a real block to the
 * hash chain AND anchors the new chain head on the XRP Ledger testnet — so the jury
 * can watch a passage create a block + an on-chain proof, then verify it.
 */

const GENESIS = "0".repeat(64);
const NETWORK = process.env.XRPL_NETWORK ?? "wss://s.altnet.rippletest.net:51233";
const EXPLORER = process.env.XRPL_EXPLORER ?? "https://testnet.xrpl.org";
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function buildBlockData(b: {
  index: number; prevHash: string; timestamp: string;
  badgeNumber: string; holderName: string; holderRole: string;
  readerId: string; result: string; reason: string | null; location: string;
}): string {
  const obj: Record<string, unknown> = {
    index: b.index, prevHash: b.prevHash, timestamp: b.timestamp,
    badgeNumber: b.badgeNumber, holderName: b.holderName, holderRole: b.holderRole,
    readerId: b.readerId, result: b.result,
  };
  if (b.reason != null) obj.reason = b.reason;
  obj.location = b.location;
  return JSON.stringify(obj);
}

async function anchorHead(head: string, count: number) {
  const client = new Client(NETWORK);
  await client.connect();
  try {
    const wallet = Wallet.fromSeed(process.env.XRPL_WALLET_SEED!);
    try {
      await client.request({ command: "account_info", account: wallet.address });
    } catch {
      await client.fundWallet(wallet);
    }
    const tx = {
      TransactionType: "AccountSet" as const,
      Account: wallet.address,
      Memos: [{ Memo: { MemoType: convertStringToHex("SmartCampus/AccessChainHead"), MemoData: convertStringToHex(head) } }],
    };
    const signed = wallet.sign(await client.autofill(tx));
    const res = await client.submitAndWait(signed.tx_blob);
    await prisma.accessAnchor.create({
      data: { chainHead: head, blockCount: count, xrplTxHash: res.result.hash, xrplAddress: wallet.address },
    });
    return { txHash: res.result.hash, explorerUrl: `${EXPLORER}/transactions/${res.result.hash}` };
  } finally {
    await client.disconnect();
  }
}

export interface SimulationResult {
  blockIndex: number;
  result: "GRANTED" | "DENIED";
  reason: string | null;
  holderName: string;
  holderRole: string;
  location: string;
  blockHash: string;
  txHash: string;
  explorerUrl: string;
}

export async function simulateBadge(granted: boolean): Promise<SimulationResult> {
  // A clear story for the demo: admin on the server room (granted) vs unknown badge (denied).
  const reader =
    (await prisma.rfidReader.findFirst({ where: { securityLevel: "CRITICAL" } })) ??
    (await prisma.rfidReader.findFirst());
  if (!reader) throw new Error("Aucun lecteur RFID.");

  const holder = granted
    ? { badge: "BADGE-0001", name: "Sophie Martin", role: "ADMINISTRATEUR" }
    : { badge: "BADGE-UNKN", name: "Inconnu", role: "INCONNU" };
  const result: "GRANTED" | "DENIED" = granted ? "GRANTED" : "DENIED";
  const reason = granted ? null : "BADGE_UNKNOWN";

  const last = await prisma.accessEvent.findFirst({ orderBy: { blockIndex: "desc" } });
  const index = (last?.blockIndex ?? -1) + 1;
  const prevHash = last?.blockHash ?? GENESIS;
  const ts = new Date();

  const blockData = buildBlockData({
    index, prevHash, timestamp: ts.toISOString(),
    badgeNumber: holder.badge, holderName: holder.name, holderRole: holder.role,
    readerId: reader.id, result, reason, location: reader.location,
  });
  const blockHash = sha256(blockData);

  await prisma.accessEvent.create({
    data: {
      blockIndex: index, badgeNumber: holder.badge, holderName: holder.name, holderRole: holder.role,
      readerId: reader.id, readerName: reader.name, location: reader.location, result, reason,
      timestamp: ts, blockHash, prevHash, blockData,
    },
  });

  const anchor = await anchorHead(blockHash, index + 1);

  return {
    blockIndex: index, result, reason, holderName: holder.name, holderRole: holder.role,
    location: reader.location, blockHash, txHash: anchor.txHash, explorerUrl: anchor.explorerUrl,
  };
}

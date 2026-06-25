"use server";

import prisma from "@/lib/prisma";
import { Client, Wallet, convertStringToHex } from "xrpl";

const XRPL_TESTNET = "wss://s.altnet.rippletest.net:51233";
const XRPL_DEST   = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"; // testnet genesis

export async function recordAccessSummaryToXrpl() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

  const [total, granted, denied, unknown, lastEvent, todayTotal, todayGranted, todayDenied] =
    await Promise.all([
      prisma.accessEvent.count(),
      prisma.accessEvent.count({ where: { result: "GRANTED" } }),
      prisma.accessEvent.count({ where: { result: "DENIED" } }),
      prisma.accessEvent.count({ where: { reason: "BADGE_UNKNOWN" } }),
      prisma.accessEvent.findFirst({ orderBy: { blockIndex: "desc" } }),
      prisma.accessEvent.count({ where: { timestamp: { gte: todayStart } } }),
      prisma.accessEvent.count({ where: { result: "GRANTED", timestamp: { gte: todayStart } } }),
      prisma.accessEvent.count({ where: { result: "DENIED",  timestamp: { gte: todayStart } } }),
    ]);

  const payload = {
    v: 1,
    type: "campus.access.summary",
    campus: "Smart Campus",
    date: now.toISOString().slice(0, 10),
    ts: now.toISOString(),
    cumul: { total, granted, denied, unknown },
    today: { total: todayTotal, granted: todayGranted, denied: todayDenied },
    chain: {
      len: lastEvent?.blockIndex ?? 0,
      tip: lastEvent?.blockHash?.slice(0, 12) ?? "genesis",
    },
  };

  const client = new Client(XRPL_TESTNET);

  try {
    await client.connect();

    const { wallet } = await client.fundWallet();

    const memoType = convertStringToHex("SmartCampus/AccessSummary");
    const memoData = convertStringToHex(JSON.stringify(payload));

    const tx = {
      TransactionType: "Payment" as const,
      Account: wallet.classicAddress,
      Destination: XRPL_DEST,
      Amount: "1",
      Memos: [{ Memo: { MemoType: memoType, MemoData: memoData } }],
    };

    const prepared = await client.autofill(tx);
    const { tx_blob, hash } = wallet.sign(prepared);
    await client.submitAndWait(tx_blob);

    return {
      success: true  as const,
      txHash: hash,
      explorerUrl: `https://testnet.xrpl.org/transactions/${hash}`,
      wallet: wallet.classicAddress,
      payload,
    };
  } finally {
    await client.disconnect();
  }
}

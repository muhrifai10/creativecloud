import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import {
  transferQueue,
  TRANSFER_JOB_NAME,
  type TransferJobData,
} from "@nexusdrive/core/queues";
import { auth } from "@/auth";

const uuid = z.string().uuid();

const createSchema = z.object({
  sourceAccountId: uuid,
  sourceFileId: z.string().min(1).max(256),
  sourceFileName: z.string().min(1).max(240),
  sourceFileSize: z.coerce.number().int().min(0),
  targetAccountId: uuid,
  targetFolderId: z.string().min(1).max(256).default("root"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const activeOnly = req.nextUrl.searchParams.get("active") === "1";
  const jobs = await prisma.transferJob.findMany({
    where: {
      userId: session.user.id,
      ...(activeOnly ? { status: { in: ["pending", "processing"] } } : {}),
    },
    include: {
      sourceAccount: { select: { provider: true, accountEmail: true } },
      targetAccount: { select: { provider: true, accountEmail: true } },
    },
    orderBy: { createdAt: "desc" },
    take: activeOnly ? 20 : 100,
  });
  return NextResponse.json({ jobs: jobs.map(serialize) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data transfer tidak valid." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.sourceAccountId === d.targetAccountId) {
    return NextResponse.json({ error: "Akun sumber dan tujuan harus berbeda." }, { status: 400 });
  }

  // kepemilikan kedua akun
  const owned = await prisma.connectedAccount.findMany({
    where: { id: { in: [d.sourceAccountId, d.targetAccountId] }, userId: session.user.id },
    select: { id: true },
  });
  if (owned.length !== 2) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau bukan milik Anda." }, { status: 403 });
  }

  const job = await prisma.transferJob.create({
    data: {
      userId: session.user.id,
      sourceAccountId: d.sourceAccountId,
      sourceFileId: d.sourceFileId,
      sourceFileName: d.sourceFileName,
      sourceFileSize: BigInt(d.sourceFileSize),
      targetAccountId: d.targetAccountId,
      targetFolderId: d.targetFolderId,
      status: "pending",
    },
  });

  const queue = transferQueue();
  await queue.add(
    TRANSFER_JOB_NAME,
    { transferJobId: job.id } satisfies TransferJobData,
    { jobId: job.id, attempts: 3, backoff: { type: "exponential", delay: 5_000 } },
  );
  await queue.close();

  return NextResponse.json({ job: { id: job.id, status: job.status } });
}

function serialize(j: {
  id: string;
  sourceFileName: string;
  sourceFileSize: bigint;
  status: string;
  progressPercentage: number;
  bytesTransferred: bigint;
  errorMessage: string | null;
  startedAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  sourceAccount: { provider: string; accountEmail: string };
  targetAccount: { provider: string; accountEmail: string };
}) {
  return {
    id: j.id,
    sourceFileName: j.sourceFileName,
    sourceFileSize: Number(j.sourceFileSize),
    status: j.status,
    progressPercentage: j.progressPercentage,
    bytesTransferred: Number(j.bytesTransferred),
    errorMessage: j.errorMessage,
    startedAt: j.startedAt?.toISOString() ?? null,
    completedAt: j.completedAt?.toISOString() ?? null,
    createdAt: j.createdAt.toISOString(),
    sourceProvider: j.sourceAccount.provider,
    targetProvider: j.targetAccount.provider,
  };
}

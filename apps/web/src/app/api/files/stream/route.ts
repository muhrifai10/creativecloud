import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Readable } from "node:stream";
import { sanitizeFileName } from "@nexusdrive/core";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const q = z.object({
  accountId: z.string().uuid(),
  fileId: z.string().min(1).max(256),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const parsed = q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter unduh tidak valid." }, { status: 400 });
  }
  const { accountId, fileId } = parsed.data;

  const cached = await prisma.fileItem.findFirst({
    where: { accountId, userId: session.user.id, providerFileId: fileId },
    select: { name: true },
  });

  let provider;
  try {
    provider = await getProviderForAccount(accountId, session.user.id);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Akun tidak tersedia." }, { status: 400 });
  }

  let result;
  try {
    result = await provider.getDownloadStream(fileId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unduh gagal." }, { status: 502 });
  }

  const filename = cached?.name ? sanitizeFileName(cached.name) : "berkas";
  const nodeStream = Readable.toWeb(result.stream as Readable) as ReadableStream;

  return new NextResponse(nodeStream as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(result.size ? { "Content-Length": String(result.size) } : {}),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}

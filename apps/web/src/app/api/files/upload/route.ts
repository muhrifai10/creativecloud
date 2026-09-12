import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  bufferAndForward,
  TEMP_BUCKET,
  webToNode,
  type UniversalFileItem,
} from "@nexusdrive/core";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const SMALL_DIRECT_BYTES = 10 * 1024 * 1024;

const querySchema = z.object({
  accountId: z.string().uuid(),
  folderId: z.string().min(1).max(256).default("root"),
  filename: z.string().min(1).max(240),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    accountId: req.nextUrl.searchParams.get("accountId"),
    folderId: req.nextUrl.searchParams.get("folderId") ?? "root",
    filename: req.nextUrl.searchParams.get("filename"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter upload tidak valid." }, { status: 400 });
  }
  const { accountId, folderId, filename } = parsed.data;

  let provider;
  try {
    provider = await getProviderForAccount(accountId, session.user.id);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Akun tidak tersedia." }, { status: 400 });
  }

  if (!req.body) {
    return NextResponse.json({ error: "Body kosong." }, { status: 400 });
  }
  const incoming = webToNode(req.body);
  const contentLength = Number(req.headers.get("content-length") ?? 0) || 0;
  const key = `${session.user.id}/${randomUUID()}-${filename}`;

  let item: UniversalFileItem;
  try {
    if (contentLength > 0 && contentLength <= SMALL_DIRECT_BYTES) {
      // Jalur kecil: stream langsung ke provider, tanpa buffer R2.
      item = await provider.uploadStream(filename, incoming, folderId, contentLength);
    } else {
      // Jalur besar: stream -> R2 buffer (multipart) -> provider -> purge buffer.
      const holder: { value?: UniversalFileItem } = {};
      await bufferAndForward(
        key,
        incoming,
        async (fromR2) => {
          holder.value = await provider.uploadStream(filename, fromR2, folderId);
        },
        { bucket: TEMP_BUCKET() },
      );
      if (!holder.value) throw new Error("Provider tidak mengembalikan item.");
      item = holder.value;
    }
  } catch (e) {
    console.error("Upload error detail:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload gagal." }, { status: 502 });
  }

  await prisma.fileItem.upsert({
    where: { accountId_providerFileId: { accountId, providerFileId: item.id } },
    update: { name: item.name, sizeBytes: BigInt(item.sizeBytes), lastIndexedAt: new Date() },
    create: {
      accountId,
      userId: session.user.id,
      provider: item.provider,
      providerFileId: item.id,
      providerParentId: folderId,
      name: item.name,
      sizeBytes: BigInt(item.sizeBytes),
      mimeType: item.mimeType,
      isFolder: item.isFolder,
      pathHierarchy: `${folderId}/${item.name}`,
    },
  });

  return NextResponse.json({ item });
}

import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { createId, nowIso } from "@/lib/store/ids";
import { updateStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAuthorizedStoreAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const productId = String(formData.get("productId") ?? "");
  const alt = String(formData.get("alt") ?? "");
  const isPrimary = String(formData.get("isPrimary") ?? "false") === "true";

  if (!(file instanceof File) || !productId) {
    return NextResponse.json(
      { error: "Missing productId or image file." },
      { status: 400 },
    );
  }

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const pathname = `products/${productId}/${crypto.randomUUID()}-${safeName}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || "application/octet-stream",
  });

  const image = await updateStoreDatabase((database) => {
    if (isPrimary) {
      for (const current of database.images) {
        if (current.productId === productId) {
          current.isPrimary = false;
        }
      }
    }

    const created = {
      id: createId("img"),
      productId,
      url: blob.url,
      alt,
      sortOrder: database.images.filter((item) => item.productId === productId)
        .length,
      isPrimary,
      createdAt: nowIso(),
    };

    database.images.unshift(created);
    return created;
  });

  return NextResponse.json({ image });
}

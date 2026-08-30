import { createManaraIcon } from "@/lib/pwa/create-manara-icon";

const supportedIconSizes = [180, 192, 512] as const;

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return supportedIconSizes.map((size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const numericSize = Number(size);

  if (!supportedIconSizes.some((supportedSize) => supportedSize === numericSize)) {
    return new Response("Not found", { status: 404 });
  }

  return createManaraIcon(numericSize);
}

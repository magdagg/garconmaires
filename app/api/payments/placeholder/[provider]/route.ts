import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { provider } = await context.params;

  return NextResponse.json(
    {
      provider,
      status: "placeholder",
      message:
        "Ten operator płatności ma przygotowaną architekturę, ale wymaga podpięcia produkcyjnego API przed sprzedażą.",
    },
    { status: 501 },
  );
}

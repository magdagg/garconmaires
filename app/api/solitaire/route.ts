import {
  applySolitaireMove,
  dealSolitaireGame,
  type SolitaireGameState,
  type SolitaireMoveAction,
} from "@/lib/games/solitaire";

export const dynamic = "force-dynamic";

export async function GET() {
  const seed = Date.now();
  const game = dealSolitaireGame(seed);

  return Response.json(game);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    game: SolitaireGameState;
    action: SolitaireMoveAction;
  };

  const nextGame = applySolitaireMove(payload.game, payload.action);

  return Response.json(nextGame);
}

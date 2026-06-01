import type { Metadata } from "next";
import { SolitaireBoard } from "@/components/play/solitaire-board";
import { dealSolitaireGame } from "@/lib/games/solitaire";

export const metadata: Metadata = {
  title: "Solitaire",
  description: "The first Garçonmaires interactive card experience built around a custom monochrome deck.",
};

export default function Page() {
  const game = dealSolitaireGame();

  return (
    <SolitaireBoard
      initialGame={game}
      copy={{
        eyebrow: "Garçonmaires / Solitaire",
        title: "The first Garçonmaires deck is already on the table.",
        description:
          "This is our take on classic Klondike, now much closer to Windows XP Solitaire with draw-one or draw-three modes, undo, score, and a running timer.",
        newDeal: "New deal",
        drawOne: "Draw (1)",
        drawThree: "Draw (3)",
        undo: "Undo",
        score: "Score",
        time: "Time",
        stock: "Stock",
        waste: "Waste",
        foundations: "Foundations",
        tableau: "Tableau",
        draw: "Draw",
        recycle: "Reset",
        selected: "Selected",
        clearSelection: "Clear selection",
        instructions:
          "Click the stock to draw one or three cards depending on the active mode. You can drag tableau runs, move a foundation card back to the tableau, and undo the previous move.",
        victoryTitle: "Every card has returned to the foundations.",
        victoryBody:
          "The game is complete. The Garçonmaires deck now opens into a full celebration, and you can begin a new deal whenever you want.",
        playAgain: "Play again",
        note:
          "At this point the core loop, drag and drop, and local save state are all in place. The next step is to push the deck identity further with more distinctive court cards, richer motion, and a more ceremonial table surface.",
      }}
    />
  );
}

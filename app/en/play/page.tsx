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
          "This is the first stage of our own game inspired by solitaire. The backend now deals a classic Klondike layout, and we can keep pushing the visual layer toward a darker, more brand-led ritual.",
        newDeal: "New deal",
        stock: "Stock",
        waste: "Waste",
        foundations: "Foundations",
        tableau: "Tableau",
        draw: "Draw",
        recycle: "Reset",
        selected: "Selected",
        clearSelection: "Clear selection",
        instructions:
          "Click the stock to draw a card. Click the waste or a face-up tableau card, then click the destination pile.",
        victoryTitle: "Every card has returned to the foundations.",
        victoryBody:
          "The game is complete. The Garçonmaires deck now opens into a full celebration, and you can begin a new deal whenever you want.",
        playAgain: "Play again",
        note:
          "This stage already supports a playable loop: drawing, moving to foundations, and moving stacks across tableau columns. Next we can add drag and drop, persistent save state, and a fully custom Garçonmaires deck.",
      }}
    />
  );
}

import type { Metadata } from "next";
import { SolitaireBoard } from "@/components/play/solitaire-board";
import { dealSolitaireGame } from "@/lib/games/solitaire";

export const metadata: Metadata = {
  title: "Pasjans",
  description: "Pierwsza interaktywna gra Garçonmaires oparta na customowej talii w czerni i bieli.",
};

export default function Page() {
  const game = dealSolitaireGame();

  return (
    <SolitaireBoard
      initialGame={game}
      copy={{
        eyebrow: "Garçonmaires / Pasjans",
        title: "Pierwsza talia Garçonmaires.",
        description:
          "To nasza wersja klasycznego Klondike, z zasadami bliższymi Pasjansowi z Windows XP: rozdanie 1 lub 3, cofanie ruchów, wynik i licznik czasu.",
        newDeal: "Nowe rozdanie",
        drawOne: "Rozdanie (1)",
        drawThree: "Rozdanie (3)",
        undo: "Cofnij",
        score: "Wynik",
        time: "Czas",
        stock: "Talia",
        waste: "Stos",
        foundations: "Fundamenty",
        tableau: "Układ",
        draw: "Dobierz",
        recycle: "Obrót",
        selected: "Wybrane",
        clearSelection: "Wyczyść wybór",
        instructions:
          "Kliknij talię, aby dobrać kartę lub trzy karty, zależnie od wybranego trybu. Możesz przeciągać stosy w układzie, przenosić karty z fundamentu z powrotem na stół i cofać ostatni ruch.",
        victoryTitle: "Wszystkie karty wróciły do fundamentów.",
        victoryBody:
          "Partia została ukończona. Talia Garçonmaires otwiera się teraz w pełnej celebracji i możesz rozpocząć nowe rozdanie, gdy zechcesz.",
        playAgain: "Zagraj ponownie",
        note: "",
      }}
    />
  );
}

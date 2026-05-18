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
        title: "Pierwsza talia Garçonmaires jest już na stole.",
        description:
          "To pierwszy etap naszej własnej gry inspirowanej pasjansem. Silnik rozdaje klasyczny układ Klondike, a oprawę będziemy dalej rozwijać w kierunku monochromatycznego rytuału marki.",
        newDeal: "Nowe rozdanie",
        stock: "Talia",
        waste: "Stos",
        foundations: "Fundamenty",
        tableau: "Układ",
        draw: "Dobierz",
        recycle: "Obrót",
        selected: "Wybrane",
        clearSelection: "Wyczyść wybór",
        instructions:
          "Kliknij talię, aby dobrać kartę. Kliknij kartę ze stosu lub odkrytą kartę w układzie, a następnie kliknij miejsce docelowe.",
        victoryTitle: "Wszystkie karty wróciły do fundamentów.",
        victoryBody:
          "Partia została ukończona. Talia Garçonmaires otwiera się teraz w pełnej celebracji i możesz rozpocząć nowe rozdanie, gdy zechcesz.",
        playAgain: "Zagraj ponownie",
        note:
          "Ten etap daje już realną, grywalną pętlę: dobieranie kart, ruchy do fundamentów i przenoszenie stosów między kolumnami. Następnie możemy dołożyć drag and drop, zapis stanu gry i pełną talię Garçonmaires.",
      }}
    />
  );
}

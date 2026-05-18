"use client";

import type { DragEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { BrandIcon } from "@/components/ui/brand-logo";
import type {
  FoundationPile,
  SolitaireCard,
  SolitaireGameState,
  SolitaireMoveAction,
  SolitaireSelection,
  TableauPile,
} from "@/lib/games/solitaire";
import { cn } from "@/lib/utils";

type SolitaireBoardCopy = {
  eyebrow: string;
  title: string;
  description: string;
  newDeal: string;
  stock: string;
  waste: string;
  foundations: string;
  tableau: string;
  note: string;
  draw: string;
  recycle: string;
  selected: string;
  clearSelection: string;
  instructions: string;
  victoryTitle: string;
  victoryBody: string;
  playAgain: string;
};

type SolitaireBoardProps = {
  copy: SolitaireBoardCopy;
  initialGame: SolitaireGameState;
};

const SOLITAIRE_STORAGE_KEY = "garconmaires-solitaire-state";
const SOLITAIRE_DRAG_TYPE = "application/x-garconmaires-solitaire";
const SOLITAIRE_DRAG_FALLBACK_TYPE = "text/plain";

function getSuitMark(suit: FoundationPile["id"]) {
  switch (suit) {
    case "spades":
      return "♠";
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
  }
}

function formatCard(card: SolitaireCard) {
  return `${card.rank}${getSuitMark(card.suit)}`;
}

function isFigureRank(rank: SolitaireCard["rank"]) {
  return rank === "A" || rank === "J" || rank === "Q" || rank === "K";
}

function getSelectionLabel(selection: SolitaireSelection | null) {
  if (!selection) {
    return null;
  }

  if (selection.source === "waste") {
    return "waste";
  }

  return `${selection.pileId}:${selection.cardIndex + 1}`;
}

function serializeSelection(selection: SolitaireSelection) {
  return JSON.stringify(selection);
}

function readDragSelection(event: DragEvent<HTMLElement>) {
  const raw =
    event.dataTransfer.getData(SOLITAIRE_DRAG_TYPE) ||
    event.dataTransfer.getData(SOLITAIRE_DRAG_FALLBACK_TYPE);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SolitaireSelection;
  } catch {
    return null;
  }
}

function CardFace({
  card,
  selected = false,
}: {
  card: SolitaireCard;
  selected?: boolean;
}) {
  const faceAccent = card.color === "red" ? "text-[#8f2f3b]" : "text-black";

  return (
    <div
      className={cn(
        "relative flex h-28 w-20 overflow-hidden rounded-[1.4rem] border px-3 py-3 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-transform duration-150",
        card.faceUp
          ? "border-white/14 bg-white text-black"
          : "border-white/12 bg-[linear-gradient(180deg,#111_0%,#050505_100%)] text-white/65",
        selected && "ring-2 ring-white/70 ring-offset-2 ring-offset-black -translate-y-1",
      )}
    >
      {card.faceUp ? (
        <>
          <div className="flex w-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className={cn("text-sm font-medium", faceAccent)}>
                {formatCard(card)}
              </span>
              <span className={cn("text-lg", faceAccent)}>
                {getSuitMark(card.suit)}
              </span>
            </div>

            <div className="relative flex flex-1 items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
                <BrandIcon className="h-12 w-9 text-black" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className={cn("text-3xl", faceAccent)}>
                  {getSuitMark(card.suit)}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[10px] tracking-[0.22em] uppercase",
                    faceAccent,
                  )}
                >
                  {isFigureRank(card.rank) ? card.rank : "GM"}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between rotate-180">
              <span className={cn("text-sm font-medium", faceAccent)}>
                {formatCard(card)}
              </span>
              <span className={cn("text-lg", faceAccent)}>
                {getSuitMark(card.suit)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-[6px] rounded-[1.1rem] border border-white/10" />
          <div className="absolute inset-[10px] rounded-[0.9rem] border border-white/6" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_18%,rgba(255,255,255,0.03)_50%,transparent_82%)]" />
          <div className="relative flex w-full flex-col items-center justify-between py-1">
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">
              GM
            </span>
            <BrandIcon className="h-11 w-8 text-white/92" />
            <span className="text-[9px] tracking-[0.18em] uppercase text-white/28">
              Garçonmaires
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function FoundationSlot({
  pile,
  selected = false,
  onClick,
  onDropSelection,
}: {
  pile: FoundationPile;
  selected?: boolean;
  onClick: () => void;
  onDropSelection: (selection: SolitaireSelection, foundationId: FoundationPile["id"]) => void;
}) {
  const topCard = pile.cards.at(-1);

  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const droppedSelection = readDragSelection(event);
        if (droppedSelection) {
          onDropSelection(droppedSelection, pile.id);
        }
      }}
      className={cn(
        "flex h-28 w-20 items-center justify-center rounded-[1.4rem] border border-dashed border-white/14 bg-white/[0.02] transition-colors hover:border-white/34",
        selected && "border-white/60 bg-white/[0.05]",
      )}
    >
      {topCard ? (
        <CardFace card={topCard} />
      ) : (
        <span className="text-xl text-white/24">{getSuitMark(pile.id)}</span>
      )}
    </button>
  );
}

function TableauColumn({
  pile,
  selection,
  onCardClick,
  onColumnClick,
  onCardDragStart,
  onDropSelection,
}: {
  pile: TableauPile;
  selection: SolitaireSelection | null;
  onCardClick: (pileId: string, cardIndex: number, card: SolitaireCard) => void;
  onColumnClick: (pileId: string) => void;
  onCardDragStart: (
    event: DragEvent<HTMLElement>,
    selection: SolitaireSelection,
    card: SolitaireCard,
  ) => void;
  onDropSelection: (selection: SolitaireSelection, tableauId: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onColumnClick(pile.id)}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const droppedSelection = readDragSelection(event);
        if (droppedSelection) {
          onDropSelection(droppedSelection, pile.id);
        }
      }}
      className="flex min-h-64 flex-col items-start rounded-[1.6rem] border border-transparent p-1 text-left transition-colors hover:border-white/10"
    >
      {pile.cards.map((card, index) => {
        const selected =
          selection?.source === "tableau" &&
          selection.pileId === pile.id &&
          selection.cardIndex === index;

        return (
          <div
            key={card.id}
            className="-mt-16 first:mt-0"
            style={{
              marginTop:
                index === 0 ? 0 : card.faceUp ? "-3.2rem" : "-4.6rem",
            }}
            onClick={(event) => {
              event.stopPropagation();
              onCardClick(pile.id, index, card);
            }}
            draggable={card.faceUp}
            onDragStart={(event) =>
              onCardDragStart(
                event,
                { source: "tableau", pileId: pile.id, cardIndex: index },
                card,
              )
            }
          >
            <CardFace card={card} selected={selected} />
          </div>
        );
      })}
      {pile.cards.length === 0 ? (
        <div className="h-28 w-20 rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.02]" />
      ) : null}
    </div>
  );
}

function VictoryCelebration({
  cards,
  title,
  body,
  playAgain,
  onPlayAgain,
}: {
  cards: SolitaireCard[];
  title: string;
  body: string;
  playAgain: string;
  onPlayAgain: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-[2rem] bg-black/78 backdrop-blur-[2px]">
      <div className="absolute inset-0">
        {cards.map((card, index) => {
          const angle = (index / cards.length) * Math.PI * 2;
          const radius = 160 + (index % 6) * 26;
          const spreadX = Math.round(Math.cos(angle) * radius);
          const spreadY = Math.round(Math.sin(angle) * radius * 0.72);
          const rotate = -18 + ((index * 11) % 36);
          const delay = `${(index % 12) * 0.08}s`;

          return (
            <div
              key={`victory-${card.id}-${index}`}
              className="solitaire-victory-card absolute left-1/2 top-1/2"
              style={
                {
                  "--spread-x": `${spreadX}px`,
                  "--spread-y": `${spreadY}px`,
                  "--rotate": `${rotate}deg`,
                  "--delay": delay,
                } as React.CSSProperties
              }
            >
              <div className="scale-[0.86] origin-center">
                <CardFace card={{ ...card, faceUp: true }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative z-10 max-w-xl rounded-[2rem] border border-white/10 bg-black/72 px-8 py-10 text-center shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
          <p className="mb-4 text-[11px] tracking-[0.34em] uppercase text-white/38">
            Garçonmaires / Solitaire
          </p>
          <h2 className="font-display text-4xl leading-[1.02] text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-sm leading-8 text-white/64 sm:text-base">
            {body}
          </p>
          <button
            type="button"
            onClick={onPlayAgain}
            className="mt-8 inline-flex items-center justify-center border border-white/14 bg-white px-6 py-4 text-xs tracking-[0.28em] uppercase text-black hover:opacity-85"
          >
            {playAgain}
          </button>
        </div>
      </div>
    </div>
  );
}

function StockPile({
  count,
  emptyLabel,
  actionLabel,
  onClick,
}: {
  count: number;
  emptyLabel: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-28 w-24 items-center justify-center rounded-[1.4rem] transition-transform hover:-translate-y-0.5"
    >
      {count > 0 ? (
        <>
          <div className="absolute inset-x-3 top-3 h-28 w-20 rounded-[1.4rem] border border-white/6 bg-black/40" />
          <div className="absolute inset-x-2 top-2 h-28 w-20 rounded-[1.4rem] border border-white/8 bg-black/55" />
          <div className="absolute inset-x-1 top-1 h-28 w-20 rounded-[1.4rem] border border-white/10 bg-black/70" />
          <div className="relative">
            <CardFace
              card={{
                id: "stock-card",
                suit: "spades",
                rank: "A",
                value: 1,
                color: "black",
                faceUp: false,
              }}
            />
          </div>
          <div className="absolute bottom-3 right-2 rounded-full border border-white/10 bg-black/70 px-2 py-1 text-[10px] tracking-[0.2em] uppercase text-white/58">
            {count}
          </div>
        </>
      ) : (
        <div className="flex h-28 w-20 flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.02] text-[10px] tracking-[0.24em] uppercase text-white/34">
          <span>{emptyLabel}</span>
          <span className="mt-2 text-white/22">{actionLabel}</span>
        </div>
      )}
    </button>
  );
}

export function SolitaireBoard({
  copy,
  initialGame,
}: SolitaireBoardProps) {
  const [hydrated, setHydrated] = useState(false);
  const [game, setGame] = useState(initialGame);
  const [selection, setSelection] = useState<SolitaireSelection | null>(null);
  const [dragSelection, setDragSelection] = useState<SolitaireSelection | null>(null);
  const [isPending, startTransition] = useTransition();
  const foundationCards = game.foundations.flatMap((pile) => pile.cards);
  const isWon = foundationCards.length === 52;

  useEffect(() => {
    setHydrated(true);

    try {
      const stored = window.localStorage.getItem(SOLITAIRE_STORAGE_KEY);

      if (!stored) {
        return;
      }

      setGame(JSON.parse(stored) as SolitaireGameState);
    } catch {
      window.localStorage.removeItem(SOLITAIRE_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(SOLITAIRE_STORAGE_KEY, JSON.stringify(game));
  }, [game, hydrated]);

  const runMove = (action: SolitaireMoveAction) => {
    startTransition(async () => {
      const response = await fetch("/api/solitaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game, action }),
      });

      if (!response.ok) {
        return;
      }

      const nextGame = (await response.json()) as SolitaireGameState;
      setGame(nextGame);
      setDragSelection(null);
    });
  };

  const handleNewDeal = () => {
    setSelection(null);

    startTransition(async () => {
      const response = await fetch("/api/solitaire", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const nextGame = (await response.json()) as SolitaireGameState;
      setGame(nextGame);
      setDragSelection(null);
    });
  };

  const handleStockClick = () => {
    if (isWon) {
      return;
    }

    setSelection(null);
    runMove({ type: "draw-stock" });
  };

  const handleWasteClick = () => {
    if (isWon) {
      return;
    }

    if (!game.waste.length) {
      return;
    }

    setSelection((current) =>
      current?.source === "waste" ? null : { source: "waste" },
    );
  };

  const handleCardDragStart = (
    event: DragEvent<HTMLElement>,
    nextSelection: SolitaireSelection,
    card: SolitaireCard,
  ) => {
    if (isWon) {
      event.preventDefault();
      return;
    }

    if (!card.faceUp) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      SOLITAIRE_DRAG_TYPE,
      serializeSelection(nextSelection),
    );
    event.dataTransfer.setData(
      SOLITAIRE_DRAG_FALLBACK_TYPE,
      serializeSelection(nextSelection),
    );
    setSelection(nextSelection);
    setDragSelection(nextSelection);
  };

  const handleFoundationClick = (foundationId: FoundationPile["id"]) => {
    if (isWon) {
      return;
    }

    if (!selection) {
      return;
    }

    if (selection.source === "waste") {
      runMove({ type: "move-waste-to-foundation", foundationId });
      setSelection(null);
      return;
    }

    const sourcePile = game.tableau.find(
      (pile) => pile.id === selection.pileId,
    );
    const isTopCard =
      sourcePile && selection.cardIndex === sourcePile.cards.length - 1;

    if (isTopCard) {
      runMove({
        type: "move-tableau-to-foundation",
        sourceTableauId: selection.pileId,
        foundationId,
      });
      setSelection(null);
    }
  };

  const handleFoundationDrop = (
    droppedSelection: SolitaireSelection,
    foundationId: FoundationPile["id"],
  ) => {
    if (isWon) {
      return;
    }

    if (droppedSelection.source === "waste") {
      runMove({ type: "move-waste-to-foundation", foundationId });
      setSelection(null);
      return;
    }

    const sourcePile = game.tableau.find(
      (pile) => pile.id === droppedSelection.pileId,
    );
    const isTopCard =
      sourcePile &&
      droppedSelection.cardIndex === sourcePile.cards.length - 1;

    if (isTopCard) {
      runMove({
        type: "move-tableau-to-foundation",
        sourceTableauId: droppedSelection.pileId,
        foundationId,
      });
      setSelection(null);
    }
  };

  const handleTableauCardClick = (
    pileId: string,
    cardIndex: number,
    card: SolitaireCard,
  ) => {
    if (isWon) {
      return;
    }

    if (!card.faceUp) {
      return;
    }

    if (!selection) {
      setSelection({ source: "tableau", pileId, cardIndex });
      return;
    }

    if (
      selection.source === "tableau" &&
      selection.pileId === pileId &&
      selection.cardIndex === cardIndex
    ) {
      setSelection(null);
      return;
    }

    if (selection.source === "waste") {
      runMove({ type: "move-waste-to-tableau", tableauId: pileId });
      setSelection(null);
      return;
    }

    runMove({
      type: "move-tableau-to-tableau",
      sourceTableauId: selection.pileId,
      sourceCardIndex: selection.cardIndex,
      targetTableauId: pileId,
    });
    setSelection(null);
  };

  const handleTableauColumnClick = (pileId: string) => {
    if (isWon) {
      return;
    }

    if (!selection) {
      return;
    }

    if (selection.source === "waste") {
      runMove({ type: "move-waste-to-tableau", tableauId: pileId });
      setSelection(null);
      return;
    }

    runMove({
      type: "move-tableau-to-tableau",
      sourceTableauId: selection.pileId,
      sourceCardIndex: selection.cardIndex,
      targetTableauId: pileId,
    });
    setSelection(null);
  };

  const handleTableauDrop = (
    droppedSelection: SolitaireSelection,
    tableauId: string,
  ) => {
    if (isWon) {
      return;
    }

    if (droppedSelection.source === "waste") {
      runMove({ type: "move-waste-to-tableau", tableauId });
      setSelection(null);
      return;
    }

    runMove({
      type: "move-tableau-to-tableau",
      sourceTableauId: droppedSelection.pileId,
      sourceCardIndex: droppedSelection.cardIndex,
      targetTableauId: tableauId,
    });
    setSelection(null);
  };

  if (!hydrated) {
    return (
      <div className="site-shell px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-5">
              <p className="text-xs tracking-[0.34em] uppercase text-white/38">
                {copy.eyebrow}
              </p>
              <h1 className="font-display text-4xl leading-[1.02] text-white sm:text-5xl">
                {copy.title}
              </h1>
              <p className="max-w-xl text-sm leading-8 text-white/62 sm:text-base">
                {copy.description}
              </p>
            </div>

            <div className="h-12 w-40 rounded-full border border-white/10 bg-white/5" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#090909_0%,#040404_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-8">
            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={`solitaire-skeleton-${index + 1}`}
                  className="h-44 rounded-[1.6rem] border border-white/8 bg-white/[0.02]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs tracking-[0.34em] uppercase text-white/38">
              {copy.eyebrow}
            </p>
            <h1 className="font-display text-4xl leading-[1.02] text-white sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-xl text-sm leading-8 text-white/62 sm:text-base">
              {copy.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={handleNewDeal}
              disabled={isPending}
              className="inline-flex items-center justify-center border border-white/14 bg-white px-6 py-4 text-xs tracking-[0.28em] uppercase text-black hover:opacity-85 disabled:opacity-50"
            >
              {isPending ? `${copy.newDeal}...` : copy.newDeal}
            </button>
            {selection ? (
              <button
                type="button"
                onClick={() => setSelection(null)}
                className="text-[11px] tracking-[0.24em] uppercase text-white/42 hover:text-white"
              >
                {copy.clearSelection}
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#090909_0%,#040404_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-8">
          {isWon ? (
            <VictoryCelebration
              cards={foundationCards}
              title={copy.victoryTitle}
              body={copy.victoryBody}
              playAgain={copy.playAgain}
              onPlayAgain={handleNewDeal}
            />
          ) : null}
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-7 text-white/55">{copy.instructions}</p>
            <p className="text-[11px] tracking-[0.24em] uppercase text-white/38">
              {copy.selected}: {getSelectionLabel(selection) ?? "—"}
            </p>
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <p className="text-[11px] tracking-[0.24em] uppercase text-white/42">
                  {copy.stock}
                </p>
                <div className="flex gap-4">
                  <StockPile
                    count={game.stock.length}
                    emptyLabel={copy.stock}
                    actionLabel={game.stock.length ? copy.draw : copy.recycle}
                    onClick={handleStockClick}
                  />
                  <button
                    type="button"
                    onClick={handleWasteClick}
                    draggable={Boolean(game.waste.at(-1))}
                    onDragStart={(event) => {
                      const card = game.waste.at(-1);
                      if (!card) {
                        event.preventDefault();
                        return;
                      }
                      handleCardDragStart(event, { source: "waste" }, card);
                    }}
                    onDragEnd={() => setDragSelection(null)}
                    className={cn(
                      "flex h-28 w-20 items-center justify-center rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.02] transition-colors hover:border-white/34",
                      selection?.source === "waste" && "border-white/60 bg-white/[0.05]",
                      dragSelection?.source === "waste" && "opacity-70",
                    )}
                  >
                    {game.waste.at(-1) ? (
                      <CardFace
                        card={{ ...game.waste.at(-1)!, faceUp: true }}
                        selected={selection?.source === "waste"}
                      />
                    ) : (
                      <span className="text-[11px] tracking-[0.24em] uppercase text-white/30">
                        {copy.waste}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] tracking-[0.24em] uppercase text-white/42">
                  {copy.foundations}
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {game.foundations.map((pile) => (
                    <FoundationSlot
                      key={pile.id}
                      pile={pile}
                      selected={false}
                      onClick={() => handleFoundationClick(pile.id)}
                      onDropSelection={handleFoundationDrop}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] tracking-[0.24em] uppercase text-white/42">
                {copy.tableau}
              </p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
                {game.tableau.map((pile) => (
                  <TableauColumn
                    key={pile.id}
                    pile={pile}
                    selection={selection}
                    onCardClick={handleTableauCardClick}
                    onColumnClick={handleTableauColumnClick}
                    onCardDragStart={handleCardDragStart}
                    onDropSelection={handleTableauDrop}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-8 text-white/45">
          {copy.note}
        </p>
      </div>
    </div>
  );
}

"use client";

import type { CSSProperties, DragEvent } from "react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type {
  FoundationPile,
  SolitaireCard,
  SolitaireGameState,
  SolitaireMoveAction,
  SolitaireSelection,
  TableauPile,
} from "@/lib/games/solitaire";
import { applySolitaireMove, dealSolitaireGame } from "@/lib/games/solitaire";
import { cn } from "@/lib/utils";

type SolitaireBoardCopy = {
  eyebrow: string;
  title: string;
  description: string;
  newDeal: string;
  drawOne: string;
  drawThree: string;
  undo: string;
  score: string;
  time: string;
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

type RecycleAnimationState = {
  id: number;
  cards: SolitaireCard[];
};

type DrawAnimationState = {
  id: number;
  cards: SolitaireCard[];
};

type SolitaireHistoryEntry = {
  game: SolitaireGameState;
  score: number;
};
const SOLITAIRE_DRAG_TYPE = "application/x-garconmaires-solitaire";
const SOLITAIRE_DRAG_FALLBACK_TYPE = "text/plain";
const DECK_SHEET_WIDTH = 1448;
const DECK_SHEET_HEIGHT = 1086;
const DECK_CARD_HEIGHT = 313;
const DECK_SHEET_BY_SUIT: Record<SolitaireCard["suit"], string> = {
  spades: "/cards-spades-sheet.png",
  hearts: "/cards-hearts-sheet.png",
  diamonds: "/cards-diamonds-sheet.png",
  clubs: "/cards-clubs-sheet.png",
};
const DECK_BACK_IMAGE_SRC = "/cards-back-garconmaires.png";
const DECK_CARD_X_BY_COLUMN = [49, 329, 609, 889, 1167];
const DECK_CARD_Y_BY_ROW = [18, 364, 719];
const DECK_FACE_POSITION_BY_RANK: Record<SolitaireCard["rank"], { column: number; row: number }> = {
  A: { column: 0, row: 0 },
  "2": { column: 1, row: 0 },
  "3": { column: 2, row: 0 },
  "4": { column: 3, row: 0 },
  "5": { column: 4, row: 0 },
  "6": { column: 0, row: 1 },
  "7": { column: 1, row: 1 },
  "8": { column: 2, row: 1 },
  "9": { column: 3, row: 1 },
  "10": { column: 4, row: 1 },
  J: { column: 0, row: 2 },
  Q: { column: 1, row: 2 },
  K: { column: 2, row: 2 },
};
const DECK_FACE_Y_OFFSET_BY_RANK: Partial<Record<SolitaireCard["rank"], number>> = {
  "8": 6,
  "10": 6,
};
const FOUNDATION_DISPLAY_ORDER: FoundationPile["id"][] = [
  "hearts",
  "clubs",
  "diamonds",
  "spades",
];

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

function getSuitTone(suit: FoundationPile["id"]) {
  switch (suit) {
    case "spades":
      return {
        slotText: "text-[#f5f1e8]",
        slot: "border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%)]",
      };
    case "hearts":
      return {
        slotText: "text-[#8d2332]",
        slot: "border-[#8d2332]/22 bg-[radial-gradient(circle_at_top,rgba(141,35,50,0.18),transparent_48%)]",
      };
    case "diamonds":
      return {
        slotText: "text-[#8d2332]",
        slot: "border-[#8d2332]/22 bg-[radial-gradient(circle_at_top,rgba(141,35,50,0.18),transparent_48%)]",
      };
    case "clubs":
      return {
        slotText: "text-[#f5f1e8]",
        slot: "border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%)]",
      };
  }
}

function getSelectionLabel(selection: SolitaireSelection | null) {
  if (!selection) {
    return null;
  }

  if (selection.source === "waste") {
    return "waste";
  }

  if (selection.source === "foundation") {
    return `foundation:${selection.pileId}`;
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

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function didRevealTableauCard(
  previousGame: SolitaireGameState,
  nextGame: SolitaireGameState,
  tableauId: string,
) {
  const previousPile = previousGame.tableau.find((pile) => pile.id === tableauId);
  const nextPile = nextGame.tableau.find((pile) => pile.id === tableauId);
  const previousHiddenCandidate = previousPile?.cards.at(-2);
  const nextTopCard = nextPile?.cards.at(-1);

  return Boolean(
    previousPile &&
      nextPile &&
      previousPile.cards.length > nextPile.cards.length &&
      previousHiddenCandidate &&
      !previousHiddenCandidate.faceUp &&
      nextTopCard &&
      nextTopCard.id === previousHiddenCandidate.id &&
      nextTopCard.faceUp,
  );
}

function getScoreDelta(
  previousGame: SolitaireGameState,
  nextGame: SolitaireGameState,
  action: SolitaireMoveAction,
) {
  switch (action.type) {
    case "move-waste-to-foundation":
      return 10;
    case "move-waste-to-tableau":
      return 5;
    case "move-tableau-to-foundation":
      return 10 + (didRevealTableauCard(previousGame, nextGame, action.sourceTableauId) ? 5 : 0);
    case "move-tableau-to-tableau":
      return didRevealTableauCard(previousGame, nextGame, action.sourceTableauId) ? 5 : 0;
    case "move-foundation-to-tableau":
      return -15;
    case "draw-stock":
      return 0;
  }
}

function getDeckSpriteStyle(card: SolitaireCard): CSSProperties {
  const position = DECK_FACE_POSITION_BY_RANK[card.rank];
  const x = DECK_CARD_X_BY_COLUMN[position.column];
  const y = DECK_CARD_Y_BY_ROW[position.row] + (DECK_FACE_Y_OFFSET_BY_RANK[card.rank] ?? 0);
  const scale = 128 / DECK_CARD_HEIGHT;

  return {
    backgroundImage: `url(${DECK_SHEET_BY_SUIT[card.suit]})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${DECK_SHEET_WIDTH * scale}px ${DECK_SHEET_HEIGHT * scale}px`,
    backgroundPosition: `-${x * scale}px -${y * scale}px`,
  };
}

function getDeckBackStyle(): CSSProperties {
  return {
    backgroundImage: `url(${DECK_BACK_IMAGE_SRC})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function CardFace({
  card,
}: {
  card: SolitaireCard;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-24 w-[4.5rem] overflow-hidden rounded-[0.58rem] border border-[#808080] bg-white text-sm transition-transform duration-200 sm:h-32 sm:w-24 sm:rounded-[0.72rem]",
        "shadow-[0_2px_0_rgba(255,255,255,0.85)_inset,0_8px_16px_rgba(0,0,0,0.1)] sm:shadow-[0_2px_0_rgba(255,255,255,0.85)_inset,0_10px_22px_rgba(0,0,0,0.12)]",
      )}
    >
      {card.faceUp ? (
        <>
          <div className="absolute inset-[1px] rounded-[0.5rem] bg-white sm:rounded-[0.64rem]" />
          <div className="absolute inset-0 rounded-[0.58rem] sm:rounded-[0.72rem]" style={getDeckSpriteStyle(card)} />
        </>
      ) : (
        <div className="absolute inset-0 rounded-[0.58rem] sm:rounded-[0.78rem]" style={getDeckBackStyle()} />
      )}
    </div>
  );
}

function FoundationSlot({
  pile,
  onClick,
  onCardDragStart,
  onDropSelection,
}: {
  pile: FoundationPile;
  selected?: boolean;
  onClick: () => void;
  onCardDragStart: (
    event: DragEvent<HTMLElement>,
    selection: SolitaireSelection,
    card: SolitaireCard,
  ) => void;
  onDropSelection: (
    selection: SolitaireSelection,
    foundationId: FoundationPile["id"],
  ) => void;
}) {
  const topCard = pile.cards.at(-1);
  const suitTone = getSuitTone(pile.id);

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
        "relative flex h-24 w-[4.5rem] items-center justify-center overflow-hidden rounded-[0.58rem] border border-dashed transition-colors hover:border-white/34 sm:h-32 sm:w-24 sm:rounded-[0.78rem]",
        suitTone.slot,
      )}
    >
      {topCard ? (
        <div
          draggable
          onDragStart={(event) =>
            onCardDragStart(event, { source: "foundation", pileId: pile.id }, topCard)
          }
        >
          <CardFace card={topCard} />
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-2">
          <span className={cn("text-[1.45rem] opacity-80 sm:text-[1.9rem]", suitTone.slotText)}>
            {getSuitMark(pile.id)}
          </span>
          <span className="font-label text-[0.42rem] tracking-[0.24em] uppercase text-white/24 sm:text-[0.48rem] sm:tracking-[0.28em]">
            Base
          </span>
        </div>
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
      className="flex min-h-52 flex-col items-start rounded-[1rem] border border-transparent p-1 text-left transition-colors hover:border-white/10 sm:min-h-64 sm:rounded-[1.6rem]"
    >
      {pile.cards.map((card, index) => {
        const selected =
          selection?.source === "tableau" &&
          selection.pileId === pile.id &&
          selection.cardIndex === index;

        return (
          <div
            key={card.id}
            className="-mt-12 first:mt-0 sm:-mt-16"
            style={{
              marginTop: index === 0 ? 0 : card.faceUp ? "-3.35rem" : "-4.55rem",
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
        <div className="relative h-24 w-[4.5rem] overflow-hidden rounded-[0.58rem] border border-dashed border-white/12 bg-white/[0.02] sm:h-32 sm:w-24 sm:rounded-[0.78rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_46%)]" />
        </div>
      ) : null}
    </div>
  );
}

function VictoryCelebration({
  foundations,
  title,
  playAgain,
  onPlayAgain,
}: {
  foundations: FoundationPile[];
  title: string;
  playAgain: string;
  onPlayAgain: () => void;
}) {
  const cascadeConfigs = [
    { startX: 76, startY: 14, spanX: -74, spanY: 82, archLift: 34, rotate: -15, sway: -7 },
    { startX: 72, startY: 12, spanX: -46, spanY: 88, archLift: 32, rotate: -9, sway: -4 },
    { startX: 78, startY: 12, spanX: 4, spanY: 92, archLift: 28, rotate: 6, sway: 3 },
    { startX: 82, startY: 14, spanX: 30, spanY: 84, archLift: 32, rotate: 13, sway: 6 },
  ] as const;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-[2rem]">
      <div className="absolute inset-0">
        {foundations.map((foundation, foundationIndex) => {
          const config = cascadeConfigs[foundationIndex];

          return foundation.cards.map((card, cardIndex) => {
            const progress = foundation.cards.length <= 1 ? 0 : cardIndex / (foundation.cards.length - 1);
            const endX = config.startX + config.spanX * progress;
            const endY =
              config.startY +
              config.spanY * progress -
              Math.sin(progress * Math.PI) * config.archLift;
            const originX = config.startX - endX;
            const originY = config.startY - endY;
            const rotate = config.rotate - progress * config.rotate * 0.55;
            const delay = `${foundationIndex * 120 + cardIndex * 45}ms`;
            const bob = `${1.6 + foundationIndex * 0.18 + (cardIndex % 5) * 0.06}s`;
            const sway = `${config.sway - progress * config.sway * 0.45}deg`;

            return (
              <div
                key={`victory-${foundation.id}-${card.id}-${cardIndex + 1}`}
                className="solitaire-victory-cascade-card absolute"
                style={
                  {
                    left: `${endX}%`,
                    top: `${endY}%`,
                    "--victory-origin-x": `${originX}%`,
                    "--victory-origin-y": `${originY}%`,
                    "--victory-rotate": `${rotate}deg`,
                    "--victory-delay": delay,
                    "--victory-bob-duration": bob,
                    "--victory-sway": sway,
                  } as CSSProperties
                }
              >
                <div className="scale-[0.88] origin-center">
                  <CardFace card={{ ...card, faceUp: true }} />
                </div>
              </div>
            );
          });
        })}
      </div>

      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center px-6">
        <div className="pointer-events-auto relative z-20 flex items-center gap-4 rounded-full border border-white/12 bg-black/58 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="font-label text-[0.62rem] tracking-[0.28em] uppercase text-white/72">
            {title}
          </p>
          <button
            type="button"
            onClick={onPlayAgain}
            className="font-label inline-flex items-center justify-center rounded-full border border-white/12 bg-white px-4 py-2 text-[0.62rem] tracking-[0.24em] uppercase text-black hover:opacity-85"
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
      className="relative flex h-24 w-[5.3rem] items-center justify-center rounded-[0.58rem] transition-transform hover:-translate-y-0.5 sm:h-32 sm:w-28 sm:rounded-[0.78rem]"
    >
      {count > 0 ? (
        <>
          <div className="absolute inset-x-4 top-4 h-24 w-[4.5rem] rounded-[0.58rem] border border-white/6 bg-black/32 sm:top-5 sm:h-32 sm:w-24 sm:rounded-[0.78rem]" />
          <div className="absolute inset-x-3 top-3 h-24 w-[4.5rem] rounded-[0.58rem] border border-white/8 bg-black/48 sm:top-3.5 sm:h-32 sm:w-24 sm:rounded-[0.78rem]" />
          <div className="absolute inset-x-1.5 top-1.5 h-24 w-[4.5rem] rounded-[0.58rem] border border-white/10 bg-black/65 sm:top-2 sm:h-32 sm:w-24 sm:rounded-[0.78rem]" />
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
          <div className="font-label absolute bottom-1.5 right-1 rounded-full border border-white/10 bg-black/72 px-2 py-1 text-[0.46rem] tracking-[0.2em] uppercase text-white/58 sm:bottom-2 sm:right-1.5 sm:px-2.5 sm:text-[0.52rem] sm:tracking-[0.24em]">
            {count}
          </div>
        </>
      ) : (
        <div className="font-label flex h-24 w-[4.5rem] flex-col items-center justify-center rounded-[0.58rem] border border-dashed border-white/12 bg-white/[0.02] text-[0.46rem] tracking-[0.2em] uppercase text-white/34 sm:h-32 sm:w-24 sm:rounded-[0.78rem] sm:text-[0.52rem] sm:tracking-[0.24em]">
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
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [game, setGame] = useState(initialGame);
  const [drawCount, setDrawCount] = useState<1 | 3>(3);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<SolitaireHistoryEntry[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selection, setSelection] = useState<SolitaireSelection | null>(null);
  const [dragSelection, setDragSelection] =
    useState<SolitaireSelection | null>(null);
  const [recycleAnimation, setRecycleAnimation] =
    useState<RecycleAnimationState | null>(null);
  const [recycleAnimationId, setRecycleAnimationId] = useState(0);
  const [drawAnimation, setDrawAnimation] =
    useState<DrawAnimationState | null>(null);
  const [drawAnimationId, setDrawAnimationId] = useState(0);
  const foundationCards = game.foundations.flatMap((pile) => pile.cards);
  const orderedFoundations = FOUNDATION_DISPLAY_ORDER.map(
    (id) => game.foundations.find((pile) => pile.id === id)!,
  );
  const wastePreviewCards = game.waste.slice(-(drawCount === 1 ? 1 : 3));
  const isWon = foundationCards.length === 52;
  const canAutoComplete =
    !isWon &&
    game.stock.length === 0 &&
    game.waste.length === 0 &&
    game.tableau.every((pile) => pile.cards.every((card) => card.faceUp));
  const formattedTime = formatElapsedTime(elapsedSeconds);

  useEffect(() => {
    if (!timerRunning || isWon) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isWon, timerRunning]);

  useEffect(() => {
    if (!recycleAnimation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecycleAnimation((current) =>
        current?.id === recycleAnimation.id ? null : current,
      );
    }, 520);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recycleAnimation]);

  useEffect(() => {
    if (!drawAnimation) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDrawAnimation((current) =>
        current?.id === drawAnimation.id ? null : current,
      );
    }, 380);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [drawAnimation]);

  const runMove = useCallback((action: SolitaireMoveAction) => {
    const nextGame = applySolitaireMove(game, action);

    if (JSON.stringify(nextGame) === JSON.stringify(game)) {
      setDragSelection(null);
      return;
    }

    if (!timerRunning) {
      setTimerRunning(true);
    }

    setHistory((current) => [...current, { game, score }].slice(-200));
    setGame(nextGame);
    setScore((current) => current + getScoreDelta(game, nextGame, action));
    setDragSelection(null);
  }, [game, score, timerRunning]);

  const canApplyMove = useCallback((action: SolitaireMoveAction) => {
    const nextGame = applySolitaireMove(game, action);
    return JSON.stringify(nextGame) !== JSON.stringify(game);
  }, [game]);

  const findAutoFoundationMove = useCallback((
    nextSelection: SolitaireSelection,
  ): SolitaireMoveAction | null => {
    if (nextSelection.source === "foundation") {
      return null;
    }

    if (nextSelection.source === "waste") {
      for (const foundation of game.foundations) {
        const action: SolitaireMoveAction = {
          type: "move-waste-to-foundation",
          foundationId: foundation.id,
        };

        if (canApplyMove(action)) {
          return action;
        }
      }

      return null;
    }

    const sourcePile = game.tableau.find((pile) => pile.id === nextSelection.pileId);
    const isTopCard =
      sourcePile && nextSelection.cardIndex === sourcePile.cards.length - 1;

    if (!isTopCard) {
      return null;
    }

    for (const foundation of game.foundations) {
      const action: SolitaireMoveAction = {
        type: "move-tableau-to-foundation",
        sourceTableauId: nextSelection.pileId,
        foundationId: foundation.id,
      };

      if (canApplyMove(action)) {
        return action;
      }
    }

    return null;
  }, [canApplyMove, game.foundations, game.tableau]);

  const findAutoTableauMove = useCallback((
    nextSelection: SolitaireSelection,
  ): SolitaireMoveAction | null => {
    for (const pile of game.tableau) {
      let action: SolitaireMoveAction;

      if (nextSelection.source === "waste") {
        action = { type: "move-waste-to-tableau", tableauId: pile.id };
      } else if (nextSelection.source === "foundation") {
        action = {
          type: "move-foundation-to-tableau",
          foundationId: nextSelection.pileId,
          tableauId: pile.id,
        };
      } else {
        action = {
          type: "move-tableau-to-tableau",
          sourceTableauId: nextSelection.pileId,
          sourceCardIndex: nextSelection.cardIndex,
          targetTableauId: pile.id,
        };
      }

      if (canApplyMove(action)) {
        return action;
      }
    }

    return null;
  }, [canApplyMove, game.tableau]);

  const findAutoCompleteMove = useCallback((): SolitaireMoveAction | null => {
    for (const pile of game.tableau) {
      if (!pile.cards.length) {
        continue;
      }

      const move = findAutoFoundationMove({
        source: "tableau",
        pileId: pile.id,
        cardIndex: pile.cards.length - 1,
      });

      if (move) {
        return move;
      }
    }

    return null;
  }, [findAutoFoundationMove, game.tableau]);

  const handleNewDeal = (nextDrawCount?: 1 | 3) => {
    setSelection(null);
    setDragSelection(null);
    setRecycleAnimation(null);
    setDrawAnimation(null);
    setHistory([]);
    setScore(0);
    setElapsedSeconds(0);
    setTimerRunning(false);
    if (nextDrawCount) {
      setDrawCount(nextDrawCount);
    }
    setGame(dealSolitaireGame(Date.now()));
  };

  useEffect(() => {
    if (!canAutoComplete) {
      return;
    }

    const nextMove = findAutoCompleteMove();

    if (!nextMove) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelection(null);
      runMove(nextMove);
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canAutoComplete, findAutoCompleteMove, game, runMove]);

  const handleStockClick = () => {
    if (isWon) {
      return;
    }

    setSelection(null);

    if (game.stock.length === 0 && game.waste.length > 0) {
      setRecycleAnimationId((current) => current + 1);
      setRecycleAnimation({
        id: recycleAnimationId + 1,
        cards: game.waste
          .slice(-(drawCount === 1 ? 1 : 3))
          .map((card) => ({ ...card, faceUp: false })),
      });
    }

    if (game.stock.length > 0) {
      const cardsToDraw = Math.min(drawCount, game.stock.length);
      const nextAnimationId = drawAnimationId + 1;

      setDrawAnimationId(nextAnimationId);
      setDrawAnimation({
        id: nextAnimationId,
        cards: game.stock
          .slice(-cardsToDraw)
          .map((card) => ({ ...card, faceUp: true })),
      });
    }

    runMove({ type: "draw-stock", count: drawCount });
  };

  const handleUndo = () => {
    const previousEntry = history.at(-1);

    if (!previousEntry) {
      return;
    }

    setSelection(null);
    setDragSelection(null);
    setRecycleAnimation(null);
    setGame(previousEntry.game);
    setScore(previousEntry.score);
    setHistory((current) => current.slice(0, -1));

    if (!timerRunning) {
      setTimerRunning(true);
    }
  };

  const handleWasteClick = () => {
    if (isWon || !game.waste.length) {
      return;
    }

    if (!selection) {
      const wasteSelection: SolitaireSelection = { source: "waste" };
      const autoMove =
        findAutoFoundationMove(wasteSelection) ?? findAutoTableauMove(wasteSelection);

      if (autoMove) {
        runMove(autoMove);
        setSelection(null);
        return;
      }
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
    if (isWon || !card.faceUp) {
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

    const foundation = game.foundations.find((pile) => pile.id === foundationId);

    if (!selection) {
      if (foundation?.cards.length) {
        const autoMove = findAutoTableauMove({
          source: "foundation",
          pileId: foundationId,
        });

        if (autoMove) {
          runMove(autoMove);
          setSelection(null);
          return;
        }

        setSelection({ source: "foundation", pileId: foundationId });
      }
      return;
    }

    if (selection.source === "foundation") {
      if (selection.pileId === foundationId) {
        setSelection(null);
        return;
      }

      if (foundation?.cards.length) {
        setSelection({ source: "foundation", pileId: foundationId });
      }
      return;
    }

    if (selection.source === "waste") {
      runMove({ type: "move-waste-to-foundation", foundationId });
      setSelection(null);
      return;
    }

    const sourcePile = game.tableau.find((pile) => pile.id === selection.pileId);
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

    if (droppedSelection.source === "foundation") {
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
    if (isWon || !card.faceUp) {
      return;
    }

    if (!selection) {
      const tableauSelection: SolitaireSelection = {
        source: "tableau",
        pileId,
        cardIndex,
      };
      const autoMove = findAutoTableauMove({
        source: "tableau",
        pileId,
        cardIndex,
      });
      const autoFoundationMove = findAutoFoundationMove(tableauSelection);

      if (autoFoundationMove) {
        runMove(autoFoundationMove);
        setSelection(null);
        return;
      }

      if (autoMove) {
        runMove(autoMove);
        setSelection(null);
        return;
      }

      setSelection(tableauSelection);
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

    if (selection.source === "foundation") {
      runMove({
        type: "move-foundation-to-tableau",
        foundationId: selection.pileId,
        tableauId: pileId,
      });
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
    if (isWon || !selection) {
      return;
    }

    if (selection.source === "waste") {
      runMove({ type: "move-waste-to-tableau", tableauId: pileId });
      setSelection(null);
      return;
    }

    if (selection.source === "foundation") {
      runMove({
        type: "move-foundation-to-tableau",
        foundationId: selection.pileId,
        tableauId: pileId,
      });
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

    if (droppedSelection.source === "foundation") {
      runMove({
        type: "move-foundation-to-tableau",
        foundationId: droppedSelection.pileId,
        tableauId,
      });
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
      <div className="site-shell px-4 py-10 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
            <div className="max-w-2xl space-y-5">
              <p className="font-label text-[0.68rem] tracking-[0.34em] uppercase text-white/38">
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

          <div className="solitaire-table-surface rounded-[1.4rem] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:rounded-[2rem] md:p-8">
            <div className="grid grid-flow-col auto-cols-[4.9rem] gap-3 overflow-x-auto pb-2 sm:auto-cols-[5.7rem] md:gap-4 xl:grid-flow-row xl:grid-cols-7 xl:auto-cols-auto xl:overflow-visible xl:pb-0">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={`solitaire-skeleton-${index + 1}`}
                  className="h-36 rounded-[1rem] border border-white/8 bg-white/[0.02] sm:h-44 sm:rounded-[1.6rem]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell px-4 py-10 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="max-w-2xl space-y-4 md:space-y-5">
            <p className="font-label text-[0.68rem] tracking-[0.34em] uppercase text-white/38">
              {copy.eyebrow}
            </p>
            <h1 className="font-display text-[2.2rem] leading-[0.98] text-white sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-xl text-sm leading-7 text-white/62 sm:text-base sm:leading-8">
              {copy.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-4">
            {selection ? (
              <button
                type="button"
                onClick={() => setSelection(null)}
                className="font-label text-[0.62rem] tracking-[0.24em] uppercase text-white/42 hover:text-white"
              >
                {copy.clearSelection}
              </button>
            ) : null}
          </div>
        </div>

        <div className="solitaire-table-surface relative rounded-[1.4rem] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:rounded-[2rem] md:p-8">
          {isWon ? (
            <VictoryCelebration
              foundations={orderedFoundations}
              title={copy.victoryTitle}
              playAgain={copy.playAgain}
              onPlayAgain={handleNewDeal}
            />
          ) : null}

          <div className="mb-6 flex flex-col gap-4 md:mb-8">
            <div className="flex flex-col gap-3 border border-white/10 bg-black/36 p-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleNewDeal(1)}
                className={cn(
                  "font-label min-h-11 px-4 text-[0.68rem] tracking-[0.22em] uppercase transition-colors",
                  drawCount === 1
                    ? "bg-white text-black"
                    : "border border-white/12 text-white/72 hover:border-white/30 hover:text-white",
                )}
              >
                {copy.drawOne}
              </button>
              <button
                type="button"
                onClick={() => handleNewDeal(3)}
                className={cn(
                  "font-label min-h-11 px-4 text-[0.68rem] tracking-[0.22em] uppercase transition-colors",
                  drawCount === 3
                    ? "bg-white text-black"
                    : "border border-white/12 text-white/72 hover:border-white/30 hover:text-white",
                )}
              >
                {copy.drawThree}
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="font-label min-h-11 border border-white/12 px-4 text-[0.68rem] tracking-[0.22em] uppercase text-white/72 hover:border-white/30 hover:text-white disabled:cursor-default disabled:opacity-35"
              >
                {copy.undo}
              </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 sm:ml-auto sm:px-2">
                <p className="font-label text-[0.6rem] tracking-[0.18em] uppercase text-white/52 sm:text-[0.68rem] sm:tracking-[0.22em]">
                  {copy.score}: <span className="text-white">{score}</span>
                </p>
                <p className="font-label text-[0.6rem] tracking-[0.18em] uppercase text-white/52 sm:text-[0.68rem] sm:tracking-[0.22em]">
                  {copy.time}: <span className="text-white">{formattedTime}</span>
                </p>
                <p className="font-label text-[0.6rem] tracking-[0.18em] uppercase text-white/38 sm:text-[0.68rem] sm:tracking-[0.22em]">
                  {copy.selected}: {getSelectionLabel(selection) ?? "—"}
                </p>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-white/55">
              {copy.instructions}
            </p>
          </div>

          <div className="flex flex-col gap-8 md:gap-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="space-y-4">
                <p className="font-label text-[0.62rem] tracking-[0.24em] uppercase text-white/42">
                  {copy.stock}
                </p>
                <div className="relative flex gap-3 sm:gap-4">
                  {recycleAnimation ? (
                    <div className="pointer-events-none absolute inset-0 z-20">
                      {recycleAnimation.cards.map((card, index) => (
                        <div
                          key={`${recycleAnimation.id}-${card.id}-${index + 1}`}
                          className="solitaire-recycle-card absolute top-0"
                          style={
                            {
                              "--recycle-from-x": `${8 + index * 1.2}rem`,
                              "--recycle-to-x": `${Math.max(0, index * 0.25)}rem`,
                              "--recycle-rotate": `${6 - index * 4}deg`,
                              "--recycle-delay": `${index * 35}ms`,
                            } as CSSProperties
                          }
                        >
                          <CardFace card={{ ...card, faceUp: false }} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {drawAnimation ? (
                    <div className="pointer-events-none absolute inset-0 z-20">
                      {drawAnimation.cards.map((card, index) => (
                        <div
                          key={`${drawAnimation.id}-${card.id}-${index + 1}`}
                          className="solitaire-draw-card absolute top-0"
                          style={
                            {
                              "--draw-from-x": `${index * 0.18}rem`,
                              "--draw-from-y": `${index * 0.08}rem`,
                              "--draw-to-x": `${8 + index * 1.2}rem`,
                              "--draw-rotate": `${index === drawAnimation.cards.length - 1 ? 0 : 2 - index * 2}deg`,
                              "--draw-delay": `${index * 32}ms`,
                            } as CSSProperties
                          }
                        >
                          <CardFace card={card} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <StockPile
                    count={game.stock.length}
                    emptyLabel={copy.stock}
                    actionLabel={game.stock.length ? copy.draw : copy.recycle}
                    onClick={handleStockClick}
                  />
                  <button
                    type="button"
                    onClick={handleWasteClick}
                    className={cn(
                      "relative flex h-24 w-[6.3rem] items-center justify-center overflow-hidden rounded-[0.58rem] border border-dashed border-white/12 bg-white/[0.02] transition-colors hover:border-white/34 sm:h-32 sm:w-[8.5rem] sm:rounded-[0.78rem]",
                      dragSelection?.source === "waste" && "opacity-70",
                    )}
                  >
                    {wastePreviewCards.length ? (
                      <div className="relative h-24 w-full sm:h-32">
                        {wastePreviewCards.map((card, index) => {
                          const isTopCard = index === wastePreviewCards.length - 1;

                          return (
                            <div
                              key={`${card.id}-waste-${index + 1}`}
                              className="absolute top-0"
                              style={{
                                left: `${index * 0.9}rem`,
                                zIndex: index + 1,
                              }}
                              draggable={isTopCard}
                              onDragStart={(event) => {
                                if (!isTopCard) {
                                  event.preventDefault();
                                  return;
                                }

                                handleCardDragStart(event, { source: "waste" }, card);
                              }}
                              onDragEnd={() => {
                                if (isTopCard) {
                                  setDragSelection(null);
                                }
                              }}
                            >
                              <CardFace
                                card={{ ...card, faceUp: true }}
                                selected={isTopCard && selection?.source === "waste"}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="font-label text-[0.5rem] tracking-[0.2em] uppercase text-white/30 sm:text-[0.62rem] sm:tracking-[0.24em]">
                        {copy.waste}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-label text-[0.62rem] tracking-[0.24em] uppercase text-white/42">
                  {copy.foundations}
                </p>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                  {orderedFoundations.map((pile) => (
                    <FoundationSlot
                      key={pile.id}
                      pile={pile}
                      selected={
                        selection?.source === "foundation" &&
                        selection.pileId === pile.id
                      }
                      onClick={() => handleFoundationClick(pile.id)}
                      onCardDragStart={handleCardDragStart}
                      onDropSelection={handleFoundationDrop}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="font-label text-[0.62rem] tracking-[0.24em] uppercase text-white/42">
                {copy.tableau}
              </p>
              <div className="grid grid-flow-col auto-cols-[5rem] gap-2.5 overflow-x-auto pb-3 sm:auto-cols-[5.7rem] sm:gap-4 xl:grid-flow-row xl:grid-cols-7 xl:auto-cols-auto xl:overflow-visible xl:pb-0">
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

        <p className="max-w-3xl text-sm leading-8 text-white/45">{copy.note}</p>
      </div>
    </div>
  );
}

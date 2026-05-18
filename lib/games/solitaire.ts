export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type CardColor = "black" | "red";

export type SolitaireCard = {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  color: CardColor;
  faceUp: boolean;
};

export type TableauPile = {
  id: string;
  cards: SolitaireCard[];
};

export type FoundationPile = {
  id: Suit;
  cards: SolitaireCard[];
};

export type SolitaireGameState = {
  gameId: string;
  stock: SolitaireCard[];
  waste: SolitaireCard[];
  foundations: FoundationPile[];
  tableau: TableauPile[];
};

export type SolitaireSelection =
  | { source: "waste" }
  | { source: "tableau"; pileId: string; cardIndex: number };

export type SolitaireMoveAction =
  | { type: "draw-stock" }
  | { type: "move-waste-to-foundation"; foundationId: Suit }
  | { type: "move-waste-to-tableau"; tableauId: string }
  | { type: "move-tableau-to-foundation"; sourceTableauId: string; foundationId: Suit }
  | {
      type: "move-tableau-to-tableau";
      sourceTableauId: string;
      sourceCardIndex: number;
      targetTableauId: string;
    };

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getCardColor(suit: Suit): CardColor {
  return suit === "spades" || suit === "clubs" ? "black" : "red";
}

function createDeck() {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank, index) => ({
      id: `${suit}-${rank}`,
      suit,
      rank,
      value: index + 1,
      color: getCardColor(suit),
      faceUp: false,
    })),
  );
}

function shuffleDeck(deck: SolitaireCard[], seed: number) {
  const random = mulberry32(seed);
  const cards = [...deck];

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return cards;
}

function createGameId(seed: number) {
  return `gm-solitaire-${seed.toString(36)}`;
}

function cloneGameState(game: SolitaireGameState): SolitaireGameState {
  return {
    gameId: game.gameId,
    stock: game.stock.map((card) => ({ ...card })),
    waste: game.waste.map((card) => ({ ...card })),
    foundations: game.foundations.map((pile) => ({
      id: pile.id,
      cards: pile.cards.map((card) => ({ ...card })),
    })),
    tableau: game.tableau.map((pile) => ({
      id: pile.id,
      cards: pile.cards.map((card) => ({ ...card })),
    })),
  };
}

function revealLastTableauCard(pile: TableauPile) {
  const next = pile.cards.at(-1);

  if (next && !next.faceUp) {
    next.faceUp = true;
  }
}

function canPlaceOnFoundation(card: SolitaireCard, foundation: FoundationPile) {
  const topCard = foundation.cards.at(-1);

  if (!topCard) {
    return card.value === 1;
  }

  return topCard.suit === card.suit && topCard.value + 1 === card.value;
}

function canPlaceOnTableau(card: SolitaireCard, pile: TableauPile) {
  const topCard = pile.cards.at(-1);

  if (!topCard) {
    return card.value === 13;
  }

  return topCard.faceUp && topCard.color !== card.color && topCard.value === card.value + 1;
}

function moveWasteToFoundation(game: SolitaireGameState, foundationId: Suit) {
  const card = game.waste.at(-1);
  const foundation = game.foundations.find((pile) => pile.id === foundationId);

  if (!card || !foundation || !canPlaceOnFoundation(card, foundation)) {
    return game;
  }

  foundation.cards.push({ ...card, faceUp: true });
  game.waste.pop();
  return game;
}

function moveWasteToTableau(game: SolitaireGameState, tableauId: string) {
  const card = game.waste.at(-1);
  const pile = game.tableau.find((item) => item.id === tableauId);

  if (!card || !pile || !canPlaceOnTableau(card, pile)) {
    return game;
  }

  pile.cards.push({ ...card, faceUp: true });
  game.waste.pop();
  return game;
}

function moveTableauToFoundation(
  game: SolitaireGameState,
  sourceTableauId: string,
  foundationId: Suit,
) {
  const sourcePile = game.tableau.find((pile) => pile.id === sourceTableauId);
  const foundation = game.foundations.find((pile) => pile.id === foundationId);
  const card = sourcePile?.cards.at(-1);

  if (!sourcePile || !foundation || !card || !card.faceUp || !canPlaceOnFoundation(card, foundation)) {
    return game;
  }

  foundation.cards.push({ ...card, faceUp: true });
  sourcePile.cards.pop();
  revealLastTableauCard(sourcePile);
  return game;
}

function moveTableauToTableau(
  game: SolitaireGameState,
  sourceTableauId: string,
  sourceCardIndex: number,
  targetTableauId: string,
) {
  if (sourceTableauId === targetTableauId) {
    return game;
  }

  const sourcePile = game.tableau.find((pile) => pile.id === sourceTableauId);
  const targetPile = game.tableau.find((pile) => pile.id === targetTableauId);

  if (!sourcePile || !targetPile) {
    return game;
  }

  const movingCards = sourcePile.cards.slice(sourceCardIndex);
  const leadCard = movingCards[0];

  if (!leadCard || !leadCard.faceUp || !canPlaceOnTableau(leadCard, targetPile)) {
    return game;
  }

  targetPile.cards.push(...movingCards.map((card) => ({ ...card, faceUp: true })));
  sourcePile.cards = sourcePile.cards.slice(0, sourceCardIndex);
  revealLastTableauCard(sourcePile);
  return game;
}

function drawStock(game: SolitaireGameState) {
  if (game.stock.length === 0) {
    if (game.waste.length === 0) {
      return game;
    }

    game.stock = game.waste
      .slice()
      .reverse()
      .map((card) => ({ ...card, faceUp: false }));
    game.waste = [];
    return game;
  }

  const nextCard = game.stock.pop();

  if (nextCard) {
    game.waste.push({ ...nextCard, faceUp: true });
  }

  return game;
}

export function dealSolitaireGame(seed = Date.now()) {
  const deck = shuffleDeck(createDeck(), seed);
  const tableau: TableauPile[] = [];
  let cursor = 0;

  for (let pileIndex = 0; pileIndex < 7; pileIndex += 1) {
    const pileCards = deck
      .slice(cursor, cursor + pileIndex + 1)
      .map((card, cardIndex, cards) => ({
        ...card,
        faceUp: cardIndex === cards.length - 1,
      }));

    tableau.push({
      id: `tableau-${pileIndex + 1}`,
      cards: pileCards,
    });

    cursor += pileIndex + 1;
  }

  const stock = deck.slice(cursor).map((card) => ({
    ...card,
    faceUp: false,
  }));

  const foundations: FoundationPile[] = SUITS.map((suit) => ({
    id: suit,
    cards: [],
  }));

  return {
    gameId: createGameId(seed),
    stock,
    waste: [],
    foundations,
    tableau,
  } satisfies SolitaireGameState;
}

export function applySolitaireMove(
  game: SolitaireGameState,
  action: SolitaireMoveAction,
): SolitaireGameState {
  const nextGame = cloneGameState(game);

  switch (action.type) {
    case "draw-stock":
      return drawStock(nextGame);
    case "move-waste-to-foundation":
      return moveWasteToFoundation(nextGame, action.foundationId);
    case "move-waste-to-tableau":
      return moveWasteToTableau(nextGame, action.tableauId);
    case "move-tableau-to-foundation":
      return moveTableauToFoundation(nextGame, action.sourceTableauId, action.foundationId);
    case "move-tableau-to-tableau":
      return moveTableauToTableau(
        nextGame,
        action.sourceTableauId,
        action.sourceCardIndex,
        action.targetTableauId,
      );
  }
}

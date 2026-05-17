"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CheckoutItemInput } from "@/lib/commerce";
import type { Product } from "@/lib/data/products";

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  size: string;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string, quantity: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  checkoutItems: CheckoutItemInput[];
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("garconmaires-cart");

      if (stored) {
        setItems(JSON.parse(stored) as CartItem[]);
      }
    } catch {
      setItems([]);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem("garconmaires-cart", JSON.stringify(items));
  }, [hasHydrated, items]);

  const value: CartContextValue = {
    items,
    isOpen,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    checkoutItems: items.map((item) => ({
      productId: item.product.id,
      size: item.size,
      quantity: item.quantity,
    })),
    addItem: (product, size, quantity) => {
      setItems((current) => {
        const id = `${product.id}-${size}`;
        const existing = current.find((item) => item.id === id);

        if (existing) {
          return current.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }

        return [...current, { id, product, quantity, size }];
      });
      setIsOpen(true);
    },
    updateQuantity: (id, quantity) => {
      if (quantity <= 0) {
        setItems((current) => current.filter((item) => item.id !== id));
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        ),
      );
    },
    removeItem: (id) =>
      setItems((current) => current.filter((item) => item.id !== id)),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { clientType } from "@/components/pages/client-area-typography";
import { cn } from "@/lib/utils";

type Locale = "pl" | "en";
type Mode =
  | "dashboard"
  | "login"
  | "register"
  | "reset"
  | "new-password"
  | "verify"
  | "orders"
  | "order"
  | "details"
  | "addresses"
  | "returns";

type Customer = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingConsent: boolean;
  emailVerifiedAt: string | null;
  deletionRequestedAt: string | null;
  addresses: Address[];
};

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

type OrderSummary = {
  id: string;
  orderNumber: string;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  orderStatus: string;
  total: number;
  currency: string;
  itemCount: number;
};

type OrderItem = {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  quantity: number;
  total: number;
  currency: string;
};

type OrderDetail = OrderSummary & {
  customerEmail: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    postalCode: string;
    city: string;
    country: string;
  };
  delivery: {
    deliveryMethod: string;
    parcelLockerName: string | null;
    trackingNumber: string | null;
  };
  items: OrderItem[];
  returns: { id: string; status: string; createdAt: string; reason: string }[];
  complaints: { id: string; status: string; createdAt: string; description: string }[];
};

type AccountPayload =
  | { accountEnabled?: boolean; csrfToken?: string | null; authenticated: false; customer: null }
  | {
      accountEnabled?: boolean;
      csrfToken?: string | null;
      authenticated: false;
      verificationRequired: true;
      customer: Customer | null;
    }
  | {
      accountEnabled?: boolean;
      csrfToken?: string | null;
      authenticated: true;
      customer: Customer;
      orders: OrderSummary[];
      orderDetails: OrderDetail[];
      order: OrderDetail | null;
      returns: { id: string; orderNumber: string; type: "return"; status: string; createdAt: string; reason: string }[];
      complaints: {
        id: string;
        orderNumber: string;
        type: "complaint";
        status: string;
        createdAt: string;
        reason: string;
      }[];
    };

const copy = {
  pl: {
    account: "Konto",
    introLogin: "Zaloguj się, aby zobaczyć swoje zamówienia, zapisane adresy oraz zgłoszenia.",
    introRegister: "Załóż konto i miej swoje zamówienia, adresy oraz zgłoszenia zawsze w jednym miejscu.",
    introReset: "Podaj adres e-mail. Jeśli konto istnieje, wyślemy neutralny link do ustawienia nowego hasła.",
    introNewPassword: "Ustaw nowe hasło do konta. Link resetu pozostaje ograniczony czasowo.",
    introAccount: "Zaloguj się, aby zobaczyć swoje zamówienia, zapisane adresy oraz zgłoszenia.",
    login: "Logowanie",
    register: "Rejestracja",
    resetPassword: "Reset hasła",
    newPassword: "Nowe hasło",
    verifyEmail: "Weryfikacja e-maila",
    orders: "Zamówienia",
    details: "Dane",
    addresses: "Adresy",
    returns: "Zwroty i reklamacje",
    back: "Wróć do konta",
    signOut: "Wyloguj",
    email: "E-mail",
    emailPlaceholder: "adres e-mail",
    password: "Hasło",
    passwordConfirmation: "Potwierdź hasło",
    currentPassword: "Aktualne hasło",
    newPasswordField: "Nowe hasło",
    newPasswordConfirmation: "Potwierdź nowe hasło",
    firstName: "Imię",
    lastName: "Nazwisko",
    phone: "Telefon",
    city: "Miasto",
    postalCode: "Kod pocztowy",
    addressLine1: "Adres",
    addressLine2: "Lokal / dodatkowe informacje",
    country: "Kraj",
    marketing: "Zgoda marketingowa",
    marketingConsentCopy:
      "Chcę otrzymywać na podany adres e-mail informacje o premierach, nowych dropach, produktach i działaniach marketingowych Garçonmaires.",
    marketingConsentNote: "Zgoda jest dobrowolna i można ją wycofać w dowolnym momencie.",
    marketingConsentPrivacy: "Więcej informacji w Polityce prywatności.",
    submitLogin: "Zaloguj",
    accountSignInCta: "Zaloguj się",
    submitRegister: "Utwórz konto",
    submitReset: "Wyślij link resetu",
    submitNewPassword: "Ustaw nowe hasło",
    submitVerify: "Potwierdź e-mail",
    forgotPassword: "Nie pamiętasz hasła?",
    backToLogin: "Wróć do logowania",
    resendVerification: "Wyślij ponownie link weryfikacyjny",
    emailVerified: "E-mail potwierdzony",
    emailUnverified: "E-mail niepotwierdzony",
    signOutEverywhere: "Wyloguj ze wszystkich urządzeń",
    deleteAccount: "Poproś o usunięcie konta",
    deletionNote: "Usunięcie konta wymaga finalnej procedury RODO. Zamówienia mogą pozostać w zakresie wymaganym prawnie i księgowo.",
    deletionRequested: "Prośba o usunięcie konta została zapisana.",
    resetRequestSent: "Jeśli konto istnieje, link resetu zostanie wysłany.",
    passwordResetDone: "Hasło zostało zmienione. Możesz się zalogować.",
    accountCreatedVerify: "Konto zostało utworzone. Sprawdź skrzynkę e-mail i potwierdź adres.",
    verificationRequired: "Potwierdź adres e-mail, aby wejść do panelu konta.",
    registerUnable: "Nie udało się utworzyć konta z podanymi danymi. Jeśli masz już konto, przejdź do logowania albo resetu hasła.",
    passwordMismatch: "Hasła muszą być takie same.",
    passwordTooShort: "Hasło musi mieć co najmniej 10 znaków.",
    invalidEmail: "Podaj poprawny adres e-mail.",
    changePassword: "Zmień hasło",
    passwordChanged: "Hasło zostało zmienione.",
    logoutOtherSessions: "Wyloguj inne sesje po zmianie hasła",
    verificationDone: "Adres e-mail został potwierdzony.",
    verificationSent: "Link weryfikacyjny został wysłany, jeśli konto wymaga potwierdzenia.",
    save: "Zapisz",
    addAddress: "Zapisz adres",
    deleteAddress: "Usun",
    loading: "Ładowanie konta...",
    authGate: "Zaloguj się, aby zobaczyć swoje zamówienia, zapisane adresy oraz zgłoszenia.",
    guestCheckout: "Zakup jako gość pozostaje dostępny.",
    emptyOrders: "Brak zamówień przypisanych do tego adresu e-mail.",
    emptyRequests: "Brak aktywnych zwrotów lub reklamacji.",
    emptyAddresses: "Brak zapisanych adresow.",
    order: "Zamówienie",
    status: "Status",
    payment: "Płatność",
    fulfillment: "Realizacja",
    total: "Suma",
    items: "Produkty",
    delivery: "Dostawa",
    requestType: "Typ zgloszenia",
    requestReason: "Powód / wiadomość",
    submitRequest: "Wyślij zgłoszenie",
    returnType: "Zwrot",
    complaintType: "Reklamacja",
    complaintUploadPending: "Upload zdjęć reklamacji pozostaje oznaczony jako pending do czasu wdrożenia storage.",
    collection: "Kolekcja",
    cart: "Koszyk",
    accountDisabled: "Panel klienta pozostaje w trybie coming soon. Status zamówienia i checkout jako gość działają niezależnie od konta.",
    accountSectionLabel: "TWOJE KONTO",
  },
  en: {
    account: "Account",
    introLogin: "Sign in to view your orders, saved addresses and requests.",
    introRegister: "Create an account to keep your orders, saved addresses and requests in one place.",
    introReset: "Enter your e-mail address. If an account exists, we will send a neutral password reset link.",
    introNewPassword: "Set a new account password. The reset link is time-limited.",
    introAccount: "Sign in to view your orders, saved addresses and requests.",
    login: "Login",
    register: "Create account",
    resetPassword: "Reset password",
    newPassword: "New password",
    verifyEmail: "Verify e-mail",
    orders: "Orders",
    details: "Details",
    addresses: "Addresses",
    returns: "Returns and complaints",
    back: "Back to account",
    signOut: "Sign out",
    email: "E-mail",
    emailPlaceholder: "e-mail address",
    password: "Password",
    passwordConfirmation: "Confirm password",
    currentPassword: "Current password",
    newPasswordField: "New password",
    newPasswordConfirmation: "Confirm new password",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    city: "City",
    postalCode: "Postal code",
    addressLine1: "Address",
    addressLine2: "Apartment / extra details",
    country: "Country",
    marketing: "Marketing consent",
    marketingConsentCopy:
      "I would like to receive information about launches, new drops, products and Garçonmaires marketing activities at the e-mail address provided.",
    marketingConsentNote: "Consent is voluntary and may be withdrawn at any time.",
    marketingConsentPrivacy: "More information is available in the Privacy Policy.",
    submitLogin: "Sign in",
    accountSignInCta: "Sign in",
    submitRegister: "Create account",
    submitReset: "Send reset link",
    submitNewPassword: "Set new password",
    submitVerify: "Verify e-mail",
    forgotPassword: "Forgot password?",
    backToLogin: "Back to sign in",
    resendVerification: "Resend verification link",
    emailVerified: "E-mail verified",
    emailUnverified: "E-mail not verified",
    signOutEverywhere: "Sign out everywhere",
    deleteAccount: "Request account deletion",
    deletionNote: "Account deletion requires the final GDPR process. Order records may remain where legally or accounting required.",
    deletionRequested: "Account deletion request was recorded.",
    resetRequestSent: "If the account exists, a reset link will be sent.",
    passwordResetDone: "Password changed. You can sign in.",
    accountCreatedVerify: "Your account has been created. Check your inbox and verify your e-mail address.",
    verificationRequired: "Verify your e-mail address to enter the account panel.",
    registerUnable: "We could not create an account with these details. If you already have an account, sign in or reset your password.",
    passwordMismatch: "Passwords must match.",
    passwordTooShort: "Password must have at least 10 characters.",
    invalidEmail: "Enter a valid e-mail address.",
    changePassword: "Change password",
    passwordChanged: "Password has been changed.",
    logoutOtherSessions: "Sign out other sessions after changing password",
    verificationDone: "Your e-mail address has been verified.",
    verificationSent: "Verification link was sent if the account still needs confirmation.",
    save: "Save",
    addAddress: "Save address",
    deleteAddress: "Delete",
    loading: "Loading account...",
    authGate: "Sign in to view your orders, saved addresses and requests.",
    guestCheckout: "Guest checkout remains available.",
    emptyOrders: "No orders assigned to this e-mail address.",
    emptyRequests: "No active returns or complaints.",
    emptyAddresses: "No saved addresses.",
    order: "Order",
    status: "Status",
    payment: "Payment",
    fulfillment: "Fulfillment",
    total: "Total",
    items: "Items",
    delivery: "Delivery",
    requestType: "Request type",
    requestReason: "Reason / message",
    submitRequest: "Send request",
    returnType: "Return",
    complaintType: "Complaint",
    complaintUploadPending: "Complaint photo upload remains marked pending until storage is added.",
    collection: "Collection",
    cart: "Cart",
    accountDisabled: "The client account remains in coming soon mode. Order status and guest checkout work independently from the account.",
    accountSectionLabel: "YOUR ACCOUNT",
  },
};

const blankAddress = {
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "PL",
  phone: "",
  isDefault: true,
};

function formatMoney(value: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
  }).format(value / 100);
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function accountHref(locale: Locale, path = "") {
  return locale === "pl" ? `/konto${path}` : `/en/account${path}`;
}

function collectionHref(locale: Locale) {
  return locale === "pl" ? "/kolekcja" : "/en/collection";
}

function privacyHref(locale: Locale) {
  return locale === "pl" ? "/polityka-prywatnosci" : "/en/privacy-policy";
}

function Field({
  label,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
  required,
  tone = "dark",
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <label
      className={cn(
        "group grid gap-1.5",
        tone === "light" ? "text-black/70" : "text-white/62",
      )}
    >
      <span
        className={cn(
          "transition-colors",
          tone === "light" ? clientType.formLabelLight : clientType.formLabelDark,
          tone === "light" ? "group-focus-within:text-black" : "group-focus-within:text-white/70",
        )}
      >
        {label}
      </span>
      <input
        className={cn(
          "border-b bg-transparent py-2.5 outline-none transition-colors",
          tone === "light" ? clientType.inputLight : clientType.inputDark,
        )}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

const linkClass =
  clientType.linkDark;
const subtleButtonClass =
  `${clientType.ctaBase} border-white/18 text-white/66 hover:border-white/60 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white`;
const lightButtonClass =
  `${clientType.ctaBase} border-black bg-black text-white hover:bg-transparent hover:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black`;
const lightSubtleButtonClass =
  `${clientType.ctaBase} border-black/20 text-black/72 hover:border-black/64 hover:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black`;

type SectionNavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  direction?: "back" | "forward" | "none";
};

const lightSectionNavClass =
  clientType.navLight;
const darkSectionNavClass =
  clientType.navDark;

function SectionNav({
  items,
  tone = "dark",
}: {
  items: SectionNavItem[];
  tone?: "dark" | "light";
}) {
  const className = tone === "light" ? lightSectionNavClass : darkSectionNavClass;
  const renderLabel = (item: SectionNavItem) =>
    item.direction === "back" ? `← ${item.label}` : item.direction === "forward" ? `${item.label} →` : item.label;

  return (
    <nav
      className={cn(
        "mb-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-b pb-5",
        items.length <= 2 && "justify-between",
        tone === "light" ? "border-black/10" : "border-white/10",
      )}
      aria-label="Section navigation"
    >
      {items.map((item) =>
        item.href ? (
          <Link key={`${item.label}-${item.href}`} href={item.href} className={className}>
            {renderLabel(item)}
          </Link>
        ) : (
          <button key={item.label} type="button" onClick={item.onClick} className={className}>
            {renderLabel(item)}
          </button>
        ),
      )}
    </nav>
  );
}

function ActionButton({
  children,
  subtle = false,
  className,
  tone = "dark",
}: {
  children: ReactNode;
  subtle?: boolean;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <button
      className={cn(
        clientType.ctaBase,
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white",
        tone === "light"
          ? subtle
            ? "border-black/20 text-black/72 hover:border-black/64 hover:text-black focus-visible:outline-black"
            : "border-black bg-black text-white hover:bg-transparent hover:text-black focus-visible:outline-black"
          : subtle
            ? "border-white/18 text-white/68 hover:border-white/60 hover:text-white"
            : "border-white text-white hover:bg-white hover:text-black",
        className,
      )}
      type="submit"
    >
      {children}
    </button>
  );
}

export function CustomerAccountClient({
  locale,
  mode,
  orderNumber,
  token,
}: {
  locale: Locale;
  mode: Mode;
  orderNumber?: string;
  token?: string;
}) {
  const t = copy[locale];
  const [payload, setPayload] = useState<AccountPayload | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authForm, setAuthForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    marketingConsent: false,
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    password: "",
    passwordConfirmation: "",
    deletionNote: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirmation: "",
    logoutOtherSessions: true,
  });
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    marketingConsent: false,
  });
  const [addressForm, setAddressForm] = useState(blankAddress);
  const [serviceForm, setServiceForm] = useState({
    orderNumber: "",
    type: "return",
    productId: "",
    variantId: "",
    quantity: "1",
    reason: "",
  });

  const fetchPayload = useCallback(async () => {
    const query = orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : "";
    const response = await fetch(`/api/account/session${query}`, { cache: "no-store" });
    return (await response.json()) as AccountPayload;
  }, [orderNumber]);

  const applyPayload = useCallback((nextPayload: AccountPayload) => {
    setPayload(nextPayload);
    setCsrfToken(nextPayload.csrfToken ?? "");
    if (nextPayload.authenticated) {
      setProfileForm({
        firstName: nextPayload.customer.firstName,
        lastName: nextPayload.customer.lastName,
        phone: nextPayload.customer.phone,
        marketingConsent: nextPayload.customer.marketingConsent,
      });
      setServiceForm((current) => ({
        ...current,
        orderNumber: current.orderNumber || nextPayload.orders[0]?.orderNumber || "",
        productId: current.productId || nextPayload.order?.items[0]?.productId || "",
        variantId: current.variantId || nextPayload.order?.items[0]?.variantId || "",
      }));
    }
    setLoading(false);
  }, []);

  const load = useCallback(async () => {
    applyPayload(await fetchPayload());
  }, [applyPayload, fetchPayload]);

  useEffect(() => {
    let cancelled = false;
    void fetchPayload().then((nextPayload) => {
      if (!cancelled) {
        applyPayload(nextPayload);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applyPayload, fetchPayload]);

  const selectedOrderDetail = useMemo(() => {
    if (!payload?.authenticated) {
      return null;
    }
    if (payload.order) {
      return payload.order;
    }
    const selected = serviceForm.orderNumber || payload.orders[0]?.orderNumber;
    return payload.orderDetails.find((order) => order.orderNumber === selected) ?? null;
  }, [payload, serviceForm.orderNumber]);

  const handleAuth = async (event: FormEvent, endpoint: "login" | "register") => {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/account/${endpoint}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ ...authForm, locale }),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = String(data.error ?? "");
      setMessage(
        endpoint === "register" && error === "Invalid e-mail address."
          ? t.invalidEmail
          : endpoint === "register" && error === "Password must have at least 10 characters."
            ? t.passwordTooShort
            : endpoint === "register" && error === "Passwords do not match."
              ? t.passwordMismatch
              : endpoint === "register"
                ? t.registerUnable
                : error || "Request failed.",
      );
      return;
    }
    if (endpoint === "register" && data.awaitingVerification) {
      setPayload((current) => ({
        accountEnabled: true,
        authenticated: false,
        verificationRequired: true,
        customer: current?.customer ?? null,
      } as AccountPayload));
      setMessage(t.accountCreatedVerify);
      return;
    }
    const nextPayload = await fetchPayload();
    applyPayload(nextPayload);
    setMessage(nextPayload.authenticated ? "" : data.verificationRequired ? t.verificationRequired : "");
  };

  const logout = async () => {
    await fetch("/api/account/session", { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
    setPayload({ authenticated: false, customer: null });
  };

  const signOutEverywhere = async () => {
    await fetch("/api/account/sessions", { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
    setPayload({ authenticated: false, customer: null });
  };

  const requestReset = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/account/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ email: resetForm.email, locale }),
    });
    const data = await response.json();
    setMessage(response.ok ? t.resetRequestSent : data.error ?? "Request failed.");
  };

  const confirmReset = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/account/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        token,
        password: resetForm.password,
        passwordConfirmation: resetForm.passwordConfirmation,
      }),
    });
    const data = await response.json();
    setMessage(response.ok ? t.passwordResetDone : data.error ?? "Request failed.");
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/account/password", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-account-session": "true",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(passwordForm),
    });
    const data = await response.json();
    setMessage(response.ok ? t.passwordChanged : data.error ?? "Request failed.");
    if (response.ok) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirmation: "",
        logoutOtherSessions: true,
      });
    }
  };

  const confirmVerification = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/account/verification/confirm", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    setMessage(response.ok ? t.verificationDone : data.error ?? "Request failed.");
    if (response.ok) {
      await load();
    }
  };

  const resendVerification = async () => {
    const response = await fetch("/api/account/verification/resend", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ locale }),
    });
    const data = await response.json();
    setMessage(response.ok ? t.verificationSent : data.error ?? "Request failed.");
  };

  const requestDeletion = async () => {
    const response = await fetch("/api/account/deletion", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ note: resetForm.deletionNote }),
    });
    const data = await response.json();
    setMessage(response.ok ? t.deletionRequested : data.error ?? "Request failed.");
    if (response.ok) {
      setPayload({ authenticated: false, customer: null });
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-account-session": "true",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(profileForm),
    });
    const data = await response.json();
    setMessage(response.ok ? "" : data.error ?? "Request failed.");
    if (response.ok) {
      setPayload(data);
    }
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify(addressForm),
    });
    const data = await response.json();
    setMessage(response.ok ? "" : data.error ?? "Request failed.");
    if (response.ok) {
      setPayload(data);
      setAddressForm(blankAddress);
    }
  };

  const deleteAddress = async (id: string) => {
    const response = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken },
    });
    const data = await response.json();
    if (response.ok) {
      setPayload(data);
    }
  };

  const submitServiceRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!payload?.authenticated) {
      return;
    }

    const endpoint = serviceForm.type === "return" ? "/api/returns" : "/api/complaints";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify(
        serviceForm.type === "return"
          ? {
              orderNumber: serviceForm.orderNumber,
              customerEmail: payload.customer.email,
              selectedItems: [
                {
                  productId: serviceForm.productId,
                  variantId: serviceForm.variantId,
                  quantity: Number(serviceForm.quantity) || 1,
                },
              ],
              reason: serviceForm.reason,
            }
          : {
              orderNumber: serviceForm.orderNumber,
              customerEmail: payload.customer.email,
              productId: serviceForm.productId,
              variantId: serviceForm.variantId,
              description: serviceForm.reason,
              preferredSolution: "refund",
              imageUrls: [],
            },
      ),
    });
    const data = await response.json();
    setMessage(response.ok ? "" : data.error ?? "Request failed.");
    if (response.ok) {
      await load();
      setServiceForm((current) => ({ ...current, reason: "" }));
    }
  };

  const setAuthValue = (name: string, value: string) => setAuthForm((current) => ({ ...current, [name]: value }));
  const setResetValue = (name: string, value: string) => setResetForm((current) => ({ ...current, [name]: value }));
  const setPasswordValue = (name: string, value: string) =>
    setPasswordForm((current) => ({ ...current, [name]: value }));
  const setProfileValue = (name: string, value: string) => setProfileForm((current) => ({ ...current, [name]: value }));
  const setAddressValue = (name: string, value: string) => setAddressForm((current) => ({ ...current, [name]: value }));

  const nav = [
    [t.orders, accountHref(locale, locale === "pl" ? "/zamowienia" : "/orders")],
    [t.details, accountHref(locale, locale === "pl" ? "/dane" : "/details")],
    [t.addresses, accountHref(locale, locale === "pl" ? "/adresy" : "/addresses")],
    [t.returns, accountHref(locale, locale === "pl" ? "/zwroty" : "/returns")],
  ];
  const pageTitle =
    mode === "login"
      ? t.login
      : mode === "register"
        ? t.register
        : mode === "reset"
          ? t.resetPassword
          : mode === "new-password"
            ? t.newPassword
            : mode === "verify"
              ? t.verifyEmail
              : t.account;
  const unauthenticatedAccountSurface =
    !loading && payload?.accountEnabled !== false && mode === "dashboard" && !payload?.authenticated;
  const lightAccountSurface =
    mode === "login" ||
    mode === "register" ||
    mode === "reset" ||
    mode === "new-password" ||
    unauthenticatedAccountSurface ||
    (!loading && payload?.accountEnabled === false);
  const authIntro =
    mode === "register"
      ? t.introRegister
      : mode === "reset"
        ? t.introReset
        : mode === "new-password"
          ? t.introNewPassword
          : mode === "dashboard"
            ? t.introAccount
            : t.introLogin;
  const authLinkClass =
    clientType.linkLight;
  const accountRoot = accountHref(locale);
  const loginPath = accountHref(locale, locale === "pl" ? "/logowanie" : "/login");
  const registerPath = accountHref(locale, locale === "pl" ? "/rejestracja" : "/register");
  const cartPath = locale === "pl" ? "/koszyk" : "/en/cart";
  const registerNavLabel = locale === "pl" ? t.register : "Register";
  const sectionNavItems = payload?.authenticated
    ? [
        { label: t.orders, href: accountHref(locale, locale === "pl" ? "/zamowienia" : "/orders") },
        { label: t.details, href: accountHref(locale, locale === "pl" ? "/dane" : "/details") },
        { label: t.addresses, href: accountHref(locale, locale === "pl" ? "/adresy" : "/addresses") },
        { label: t.returns, href: accountHref(locale, locale === "pl" ? "/zwroty" : "/returns") },
        { label: t.signOut, onClick: logout, direction: "forward" as const },
      ]
    : mode === "reset" || mode === "new-password"
      ? [
          { label: t.login, href: loginPath, direction: "back" as const },
          { label: t.account, href: accountRoot, direction: "forward" as const },
        ]
      : mode === "login"
        ? [
            { label: t.account, href: accountRoot, direction: "back" as const },
            { label: registerNavLabel, href: registerPath, direction: "forward" as const },
          ]
        : mode === "register"
          ? [
              { label: t.login, href: loginPath, direction: "back" as const },
              { label: t.collection, href: collectionHref(locale), direction: "forward" as const },
            ]
          : [
              { label: t.collection, href: collectionHref(locale), direction: "back" as const },
              { label: t.cart, href: cartPath, direction: "forward" as const },
            ];

  return (
    <main
      className={cn(
        "min-h-[calc(100vh-72px)]",
        lightAccountSurface ? "bg-[#f4f1ea] text-black" : "bg-black text-white",
      )}
    >
      <section className="site-shell py-14 sm:py-20">
        <SectionNav items={sectionNavItems} tone={lightAccountSurface ? "light" : "dark"} />
        <div className={cn("border-y py-9 sm:py-11", lightAccountSurface ? "border-black/14" : "border-white/12")}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)] lg:items-end">
            <div>
              <p
                className={cn(
                  lightAccountSurface ? clientType.eyebrowLight : clientType.eyebrowDark,
                )}
              >
                Garçonmaires
              </p>
              <h1 className={cn("mt-5", clientType.displayHeading, lightAccountSurface ? "text-black" : "text-white")}>
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>

        {message ? (
          <p
            className={cn(
              "mt-6 border-y py-4 text-sm leading-7",
              lightAccountSurface ? "border-black/14 text-black/72" : "border-white/14 text-white/70",
            )}
            role="status"
          >
            {message}
          </p>
        ) : null}
        {loading ? (
          <p className={cn("mt-12 text-sm", lightAccountSurface ? "text-black/58" : "text-white/48")}>{t.loading}</p>
        ) : null}

        {!loading && payload?.accountEnabled === false ? (
          <div className="mt-12 max-w-xl border-y border-black/12 py-10">
            <p className={clientType.bodyLight}>{t.accountDisabled}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={lightButtonClass} href={collectionHref(locale)}>
                {t.collection}
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && payload?.accountEnabled !== false && mode === "reset" ? (
          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
            <div className="border-y border-black/12 py-8 lg:border-t-0 lg:pt-0">
              <p className={clientType.sectionLabelLight}>
                {t.accountSectionLabel}
              </p>
              <p className={cn("mt-5 max-w-[19rem]", clientType.bodyLight)}>
                {authIntro}
              </p>
            </div>
            <form
              className="grid w-full max-w-[40rem] gap-6 border-y border-black/14 bg-[#f8f6f1] px-5 py-9 sm:px-8 sm:py-10 lg:justify-self-end"
              onSubmit={requestReset}
            >
              <Field
                tone="light"
                label={t.email}
                name="email"
                type="email"
                value={resetForm.email}
                placeholder={t.emailPlaceholder}
                required
                onChange={setResetValue}
              />
              <ActionButton tone="light" className="mt-3 w-full sm:w-auto">
                {t.submitReset}
              </ActionButton>
            </form>
          </div>
        ) : null}

        {!loading && payload?.accountEnabled !== false && mode === "new-password" ? (
          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
            <div className="border-y border-black/12 py-8 lg:border-t-0 lg:pt-0">
              <p className={clientType.sectionLabelLight}>
                {t.accountSectionLabel}
              </p>
              <p className={cn("mt-5 max-w-[19rem]", clientType.bodyLight)}>
                {authIntro}
              </p>
            </div>
            <form
              className="grid w-full max-w-[40rem] gap-6 border-y border-black/14 bg-[#f8f6f1] px-5 py-9 sm:px-8 sm:py-10 lg:justify-self-end"
              onSubmit={confirmReset}
            >
              <Field tone="light" label={t.password} name="password" type="password" value={resetForm.password} required onChange={setResetValue} />
              <Field
                tone="light"
                label={t.passwordConfirmation}
                name="passwordConfirmation"
                type="password"
                value={resetForm.passwordConfirmation}
                required
                onChange={setResetValue}
              />
              <ActionButton tone="light" className="mt-3 w-full sm:w-auto">
                {t.submitNewPassword}
              </ActionButton>
            </form>
          </div>
        ) : null}

        {!loading && payload?.accountEnabled !== false && mode === "verify" ? (
          <form className="mt-12 grid max-w-xl gap-6" onSubmit={confirmVerification}>
            <p className="text-sm leading-7 text-white/58">{t.verifyEmail}</p>
            <ActionButton>{t.submitVerify}</ActionButton>
            {message === t.verificationDone ? (
              <Link className={subtleButtonClass} href={loginPath}>
                {t.login}
              </Link>
            ) : null}
          </form>
        ) : null}

        {!loading && payload?.accountEnabled !== false && (mode === "login" || mode === "register") ? (
          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
            <div className="border-y border-black/12 py-8 lg:border-t-0 lg:pt-0">
              <p className={clientType.sectionLabelLight}>
                {t.accountSectionLabel}
              </p>
              <p className={cn("mt-5 max-w-[19rem]", clientType.bodyLight)}>
                {authIntro}
              </p>
            </div>
            <form
              className="grid w-full max-w-[40rem] gap-6 border-y border-black/14 bg-[#f8f6f1] px-5 py-9 sm:px-8 sm:py-10 lg:justify-self-end"
              onSubmit={(event) => handleAuth(event, mode === "login" ? "login" : "register")}
            >
              {mode === "register" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field tone="light" label={t.firstName} name="firstName" value={authForm.firstName} required onChange={setAuthValue} />
                  <Field tone="light" label={t.lastName} name="lastName" value={authForm.lastName} required onChange={setAuthValue} />
                </div>
              ) : null}
              <Field tone="light" label={t.email} name="email" type="email" value={authForm.email} placeholder={t.emailPlaceholder} required onChange={setAuthValue} />
              <Field tone="light" label={t.password} name="password" type="password" value={authForm.password} required onChange={setAuthValue} />
              {mode === "register" ? (
                <Field
                  tone="light"
                  label={t.passwordConfirmation}
                  name="passwordConfirmation"
                  type="password"
                  value={authForm.passwordConfirmation}
                  required
                  onChange={setAuthValue}
                />
              ) : null}
              <div
                className={cn(
                  "pt-1",
                  mode === "register" ? "grid gap-5" : "flex flex-wrap items-center justify-between gap-5",
                )}
              >
                {mode === "login" ? (
                  <Link href={accountHref(locale, locale === "pl" ? "/reset-hasla" : "/reset-password")} className={authLinkClass}>
                    {t.forgotPassword}
                  </Link>
                ) : null}
                {mode === "register" ? (
                  <div className="grid gap-2 pt-3">
                    <div className="flex items-start gap-3">
                      <input
                        id="account-marketing-consent"
                        checked={authForm.marketingConsent}
                        className="mt-1 h-4 w-4 shrink-0 accent-black outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 focus-visible:ring-offset-[#f8f6f1]"
                        type="checkbox"
                        onChange={(event) =>
                          setAuthForm((current) => ({ ...current, marketingConsent: event.target.checked }))
                        }
                      />
                      <label htmlFor="account-marketing-consent" className="cursor-pointer">
                        <span className={cn("block", clientType.bodyLight)}>
                          {t.marketingConsentCopy}
                        </span>
                        <span className={cn("mt-2 block", clientType.bodyLightMuted)}>
                          {t.marketingConsentNote}
                        </span>
                      </label>
                    </div>
                    <Link
                      href={privacyHref(locale)}
                      className={cn(
                        "ml-7 w-fit focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black",
                        clientType.linkLight,
                      )}
                    >
                      {t.marketingConsentPrivacy}
                    </Link>
                  </div>
                ) : null}
              </div>
              <ActionButton tone="light" className="mt-3 w-full sm:w-auto">
                {mode === "login" ? t.submitLogin : t.submitRegister}
              </ActionButton>
              {payload && "verificationRequired" in payload && payload.verificationRequired ? (
                <div className="border-t border-black/12 pt-6">
                  <p className={clientType.bodyLight}>{t.verificationRequired}</p>
                  <button className={cn("mt-5", lightSubtleButtonClass)} type="button" onClick={resendVerification}>
                    {t.resendVerification}
                  </button>
                </div>
              ) : null}
            </form>
          </div>
        ) : null}

        {!loading &&
        payload?.accountEnabled !== false &&
        mode !== "login" &&
        mode !== "register" &&
        mode !== "reset" &&
        mode !== "new-password" &&
        mode !== "verify" &&
        payload &&
        "verificationRequired" in payload &&
        payload.verificationRequired ? (
          <div className="mt-14 max-w-[40rem] border-y border-black/12 bg-[#f8f6f1] px-5 py-9 sm:px-8 sm:py-10">
            <p className={cn("max-w-md", clientType.bodyLight)}>{t.verificationRequired}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button className={lightButtonClass} type="button" onClick={resendVerification}>
                {t.resendVerification}
              </button>
              <Link className={lightSubtleButtonClass} href={loginPath}>
                {t.login}
              </Link>
            </div>
          </div>
        ) : null}

        {!loading &&
        payload?.accountEnabled !== false &&
        mode !== "login" &&
        mode !== "register" &&
        mode !== "reset" &&
        mode !== "new-password" &&
        mode !== "verify" &&
        !(payload && "verificationRequired" in payload && payload.verificationRequired) &&
        !payload?.authenticated ? (
          <div className="mt-14 max-w-[40rem] border-y border-black/12 bg-[#f8f6f1] px-5 py-9 sm:px-8 sm:py-10">
            <p className={cn("max-w-md", clientType.bodyLight)}>{t.authGate}</p>
            <p className={cn("mt-4 max-w-md", clientType.bodyLightMuted)}>{t.guestCheckout}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className={lightButtonClass} href={loginPath}>
                {t.accountSignInCta}
              </Link>
              <Link className={lightSubtleButtonClass} href={registerPath}>
                {t.submitRegister}
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && payload?.accountEnabled !== false && payload?.authenticated ? (
          <div className="mt-12">
            {mode === "dashboard" ? (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]">
                <div className="border-y border-white/12 py-8">
                  <p className="text-2xl font-light">
                    {payload.customer.firstName} {payload.customer.lastName}
                  </p>
                  <p className="mt-3 text-sm text-white/46">{payload.customer.email}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/36">
                    {payload.customer.emailVerifiedAt ? t.emailVerified : t.emailUnverified}
                  </p>
                  {!payload.customer.emailVerifiedAt ? (
                    <button className={linkClass} type="button" onClick={resendVerification}>
                      {t.resendVerification}
                    </button>
                  ) : null}
                </div>
                <div className="grid border-t border-white/12">
                  {nav.map(([label, href]) => (
                    <Link key={href} href={href} className="border-b border-white/12 py-5 text-sm text-white/64 hover:text-white">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {mode === "orders" ? (
              <div className="grid border-t border-white/12">
                {payload.orders.length ? (
                  payload.orders.map((order) => (
                    <Link
                      key={order.id}
                      className="grid gap-4 border-b border-white/12 py-6 transition-colors hover:border-white/40 sm:grid-cols-[1fr_1fr_1fr_1fr]"
                      href={accountHref(locale, `${locale === "pl" ? "/zamowienia" : "/orders"}/${order.orderNumber}`)}
                    >
                      <span className="text-sm text-white">{order.orderNumber}</span>
                      <span className="text-sm text-white/48">{formatDate(order.createdAt, locale)}</span>
                      <span className="text-sm text-white/48">{order.paymentStatus} / {order.fulfillmentStatus}</span>
                      <span className="text-sm text-white/70 sm:text-right">{formatMoney(order.total, order.currency, locale)}</span>
                    </Link>
                  ))
                ) : (
                  <p className="border-b border-white/12 py-8 text-sm text-white/48">{t.emptyOrders}</p>
                )}
              </div>
            ) : null}

            {mode === "order" && payload.order ? (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]">
                <div>
                  <Link href={accountHref(locale, locale === "pl" ? "/zamowienia" : "/orders")} className={linkClass}>
                    {t.back}
                  </Link>
                  <h2 className="mt-8 text-3xl font-light">{t.order} {payload.order.orderNumber}</h2>
                  <div className="mt-8 grid border-t border-white/12">
                    {payload.order.items.map((item) => (
                      <div key={`${item.productId}-${item.variantId}`} className="grid gap-3 border-b border-white/12 py-5 sm:grid-cols-[1fr_80px_120px]">
                        <span className="text-sm text-white">{item.name}</span>
                        <span className="text-sm text-white/48">{item.size} x {item.quantity}</span>
                        <span className="text-sm text-white/70 sm:text-right">{formatMoney(item.total, item.currency, locale)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-y border-white/12 py-8 text-sm leading-7 text-white/56">
                  <p>{t.payment}: {payload.order.paymentStatus}</p>
                  <p>{t.fulfillment}: {payload.order.fulfillmentStatus}</p>
                  <p>{t.status}: {payload.order.orderStatus}</p>
                  <p>{t.delivery}: {payload.order.delivery.deliveryMethod}</p>
                  <p>{payload.order.shippingAddress.addressLine1}, {payload.order.shippingAddress.postalCode} {payload.order.shippingAddress.city}</p>
                </div>
              </div>
            ) : null}

            {mode === "details" ? (
              <div className="grid gap-12 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
                <form className="grid max-w-xl gap-6" onSubmit={saveProfile}>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label={t.firstName} name="firstName" value={profileForm.firstName} required onChange={setProfileValue} />
                    <Field label={t.lastName} name="lastName" value={profileForm.lastName} required onChange={setProfileValue} />
                  </div>
                  <Field label={t.phone} name="phone" value={profileForm.phone} onChange={setProfileValue} />
                  <label className="flex items-center gap-3 text-sm text-white/54">
                    <input
                      checked={profileForm.marketingConsent}
                      className="h-4 w-4 accent-white"
                      type="checkbox"
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, marketingConsent: event.target.checked }))
                      }
                    />
                    {t.marketing}
                  </label>
                  <ActionButton>{t.save}</ActionButton>
                  <button className={subtleButtonClass} type="button" onClick={signOutEverywhere}>
                    {t.signOutEverywhere}
                  </button>
                  <div className="border-t border-white/12 pt-6">
                    <p className="mb-4 text-xs leading-6 text-white/38">{t.deletionNote}</p>
                    <Field label={t.requestReason} name="deletionNote" value={resetForm.deletionNote} onChange={setResetValue} />
                    <button className="mt-5 font-label border border-white/16 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-white/42 transition-colors hover:border-white/50 hover:text-white" type="button" onClick={requestDeletion}>
                      {t.deleteAccount}
                    </button>
                  </div>
                </form>
                <form className="grid max-w-xl gap-6 border-y border-white/12 py-8" onSubmit={changePassword}>
                  <p className={clientType.sectionLabelDark}>{t.changePassword}</p>
                  <Field label={t.currentPassword} name="currentPassword" type="password" value={passwordForm.currentPassword} required onChange={setPasswordValue} />
                  <Field label={t.newPasswordField} name="newPassword" type="password" value={passwordForm.newPassword} required onChange={setPasswordValue} />
                  <Field label={t.newPasswordConfirmation} name="newPasswordConfirmation" type="password" value={passwordForm.newPasswordConfirmation} required onChange={setPasswordValue} />
                  <label className="flex items-center gap-3 text-sm text-white/58">
                    <input
                      checked={passwordForm.logoutOtherSessions}
                      className="h-4 w-4 accent-white"
                      type="checkbox"
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, logoutOtherSessions: event.target.checked }))
                      }
                    />
                    {t.logoutOtherSessions}
                  </label>
                  <ActionButton>{t.changePassword}</ActionButton>
                </form>
              </div>
            ) : null}

            {mode === "addresses" ? (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
                <form className="grid gap-6" onSubmit={saveAddress}>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label={t.firstName} name="firstName" value={addressForm.firstName} required onChange={setAddressValue} />
                    <Field label={t.lastName} name="lastName" value={addressForm.lastName} required onChange={setAddressValue} />
                  </div>
                  <Field label={t.addressLine1} name="addressLine1" value={addressForm.addressLine1} required onChange={setAddressValue} />
                  <Field label={t.addressLine2} name="addressLine2" value={addressForm.addressLine2} onChange={setAddressValue} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label={t.postalCode} name="postalCode" value={addressForm.postalCode} required onChange={setAddressValue} />
                    <Field label={t.city} name="city" value={addressForm.city} required onChange={setAddressValue} />
                  </div>
                  <Field label={t.phone} name="phone" value={addressForm.phone} onChange={setAddressValue} />
                  <ActionButton>{t.addAddress}</ActionButton>
                </form>
                <div className="grid border-t border-white/12">
                  {payload.customer.addresses.length ? (
                    payload.customer.addresses.map((address) => (
                      <div key={address.id} className="flex items-start justify-between gap-6 border-b border-white/12 py-6">
                        <div className="text-sm leading-7 text-white/58">
                          <p className="text-white">{address.firstName} {address.lastName}</p>
                          <p>{address.addressLine1}</p>
                          <p>{address.postalCode} {address.city}</p>
                          <p>{address.country}</p>
                        </div>
                        <button className={linkClass} type="button" onClick={() => deleteAddress(address.id)}>
                          {t.deleteAddress}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="border-b border-white/12 py-8 text-sm text-white/48">{t.emptyAddresses}</p>
                  )}
                </div>
              </div>
            ) : null}

            {mode === "returns" ? (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
                <form className="grid gap-6" onSubmit={submitServiceRequest}>
                  <label className="grid gap-2 text-[12px] text-white/48">
                    <span className="font-label uppercase tracking-[0.2em]">{t.order}</span>
                    <select
                      className="border-b border-white/18 bg-black py-3 text-sm text-white outline-none"
                      value={serviceForm.orderNumber}
                      onChange={(event) => {
                        const order = payload.orderDetails.find((item) => item.orderNumber === event.target.value);
                        setServiceForm((current) => ({
                          ...current,
                          orderNumber: event.target.value,
                          productId: order?.items[0]?.productId ?? "",
                          variantId: order?.items[0]?.variantId ?? "",
                        }));
                      }}
                    >
                      {payload.orders.map((order) => (
                        <option key={order.id} value={order.orderNumber}>{order.orderNumber}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-[12px] text-white/48">
                    <span className="font-label uppercase tracking-[0.2em]">{t.requestType}</span>
                    <select
                      className="border-b border-white/18 bg-black py-3 text-sm text-white outline-none"
                      value={serviceForm.type}
                      onChange={(event) => setServiceForm((current) => ({ ...current, type: event.target.value }))}
                    >
                      <option value="return">{t.returnType}</option>
                      <option value="complaint">{t.complaintType}</option>
                    </select>
                  </label>
                  {selectedOrderDetail?.items.length ? (
                    <label className="grid gap-2 text-[12px] text-white/48">
                      <span className="font-label uppercase tracking-[0.2em]">{t.items}</span>
                      <select
                        className="border-b border-white/18 bg-black py-3 text-sm text-white outline-none"
                        value={`${serviceForm.productId}:${serviceForm.variantId}`}
                        onChange={(event) => {
                          const [productId, variantId] = event.target.value.split(":");
                          setServiceForm((current) => ({ ...current, productId, variantId }));
                        }}
                      >
                        {selectedOrderDetail.items.map((item) => (
                          <option key={`${item.productId}:${item.variantId}`} value={`${item.productId}:${item.variantId}`}>
                            {item.name} / {item.size}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="grid gap-2 text-[12px] text-white/48">
                    <span className="font-label uppercase tracking-[0.2em]">{t.requestReason}</span>
                    <textarea
                      className="min-h-32 border-b border-white/18 bg-transparent py-3 text-sm text-white outline-none focus:border-white/70"
                      value={serviceForm.reason}
                      required
                      onChange={(event) => setServiceForm((current) => ({ ...current, reason: event.target.value }))}
                    />
                  </label>
                  <p className="text-xs leading-6 text-white/34">{t.complaintUploadPending}</p>
                  <ActionButton>{t.submitRequest}</ActionButton>
                </form>
                <div className="grid border-t border-white/12">
                  {[...payload.returns, ...payload.complaints].length ? (
                    [...payload.returns, ...payload.complaints].map((request) => (
                      <div key={`${request.type}-${request.id}`} className="border-b border-white/12 py-6 text-sm leading-7 text-white/56">
                        <p className="text-white">{request.type === "return" ? t.returnType : t.complaintType} / {request.orderNumber}</p>
                        <p>{request.status}</p>
                        <p>{formatDate(request.createdAt, locale)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="border-b border-white/12 py-8 text-sm text-white/48">{t.emptyRequests}</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

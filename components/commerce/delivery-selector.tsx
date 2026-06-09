import type { DeliveryMethodSetting } from "@/lib/store/types";
import { formatPrice } from "@/lib/utils";

type DeliverySelectorProps = {
  locale: "pl" | "en";
  title: string;
  lockerLabel: string;
  methods: DeliveryMethodSetting[];
  disabled?: boolean;
};

export function DeliverySelector({
  locale,
  title,
  lockerLabel,
  methods,
  disabled = false,
}: DeliverySelectorProps) {
  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
        {title}
      </legend>
      <div className="grid gap-3">
        {methods.map((method) => (
          <label
            key={method.id}
            className="grid gap-2 border border-white/10 p-4 text-sm text-white/70 md:grid-cols-[24px_1fr_auto]"
          >
            <input type="radio" name="deliveryMethodId" value={method.id} disabled={disabled} />
            <span>
              {locale === "en" ? method.nameEn ?? method.name : method.name}
              <span className="mt-1 block text-xs text-white/36">
                {locale === "en"
                  ? method.estimatedDeliveryTimeEn ?? method.estimatedDeliveryTime
                  : method.estimatedDeliveryTime}
              </span>
              {method.description || method.descriptionEn ? (
                <span className="mt-1 block text-xs leading-5 text-white/32">
                  {locale === "en"
                    ? method.descriptionEn ?? method.description
                    : method.description}
                </span>
              ) : null}
              <span className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
                {method.requiresParcelLocker ? <span>Parcel locker</span> : null}
                {method.requiresShippingAddress ? <span>Address</span> : null}
                {method.serviceCode ? <span>{method.serviceCode}</span> : null}
              </span>
            </span>
            <span>{formatPrice(method.price / 100, locale)}</span>
          </label>
        ))}
      </div>
      <label className="block space-y-2 text-xs tracking-[0.14em] text-white/42 uppercase">
        <span>{lockerLabel}</span>
        <input
          type="text"
          name="parcelLockerId"
          placeholder={disabled ? "Search prepared for launch" : "WAW01A"}
          disabled={disabled}
          className="h-12 w-full border border-white/10 bg-transparent px-3 text-sm tracking-normal text-white outline-none disabled:text-white/30"
        />
        <span className="block text-[11px] normal-case tracking-normal text-white/32">
          InPost parcel locker search is prepared through
          {" "}
          <code>/api/delivery/inpost/parcel-lockers</code>
          , but checkout remains locked while the store is in pre-launch.
        </span>
      </label>
    </fieldset>
  );
}

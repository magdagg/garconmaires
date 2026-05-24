type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="font-label text-[11px] tracking-[0.24em] text-white/40 uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display whitespace-pre-line text-4xl leading-[1] tracking-[-0.02em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="max-w-xl whitespace-pre-line text-sm leading-7 text-white/62 sm:text-base">
        {description}
      </p>
    </div>
  );
}

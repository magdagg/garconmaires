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
      <p className="text-xs tracking-[0.34em] text-white/40 uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display text-4xl leading-tight text-white sm:text-5xl">
        {title}
      </h2>
      <p className="max-w-xl text-sm leading-7 text-white/62 sm:text-base">
        {description}
      </p>
    </div>
  );
}

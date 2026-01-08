type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  backgroundImage?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[#1f1f1f] bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f20d0d]/20 via-transparent to-[#00f3ff]/10" />
      {backgroundImage ? (
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${backgroundImage}')` }}
          />
        </div>
      ) : null}
      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          <span className="inline-block h-2 w-2 rounded-full bg-[#ccff00]" />
          <span>{eyebrow}</span>
          <span className="h-px w-16 bg-[#2a2a2a]" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-[0.9] text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base md:text-lg text-gray-300 leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <div className="absolute -right-8 top-10 h-32 w-32 rotate-12 border-4 border-dashed border-[#1f1f1f] opacity-50" />
      <div className="absolute -left-12 bottom-0 h-24 w-24 -rotate-6 bg-gradient-to-br from-[#f20d0d]/40 to-transparent blur-3xl" />
    </section>
  );
}

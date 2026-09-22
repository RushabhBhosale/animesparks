type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  backgroundImage?: string;
};

export function PageHero({ eyebrow, title, description, backgroundImage }: PageHeroProps) {
  return (
    <section className="editorial-page-hero">
      {backgroundImage && <div className="editorial-page-hero-image" style={{ backgroundImage: `url('${backgroundImage}')` }} />}
      <div className="editorial-shell relative">
        <p className="editorial-kicker"><span className="edition-dot" /> {eyebrow}</p>
        <h1>{title}<span className="text-anime-red">.</span></h1>
        {description && <p className="editorial-page-description">{description}</p>}
      </div>
    </section>
  );
}

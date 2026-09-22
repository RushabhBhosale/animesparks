import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="editorial-footer">
      <div className="editorial-shell">
        <div className="editorial-footer-top">
          <div>
            <Link href="/" className="editorial-wordmark"><span className="editorial-logo"><Zap size={19} /></span>AnimeSparks<span className="text-anime-red">.</span></Link>
            <p>Anime, examined closely.<br />Stories, characters, and the ideas that stay with us.</p>
          </div>
          <nav aria-label="Footer explore"><h2>Explore</h2><Link href="/blogs">All blogs</Link><Link href="/categories">Editorial sections</Link><Link href="/trending">Trending</Link><Link href="/blogs/es">En español</Link></nav>
          <nav aria-label="Publication"><h2>The publication</h2><Link href="/about">About AnimeSparks</Link><Link href="/contact">Contact</Link><a href="/rss.xml">RSS feed <ArrowUpRight size={13} /></a><Link href="/sitemap">Sitemap</Link></nav>
        </div>
        <div className="editorial-footer-bottom"><span>© {new Date().getFullYear()} AnimeSparks. All rights reserved.</span><Link href="/privacy">Privacy policy</Link></div>
      </div>
    </footer>
  );
}

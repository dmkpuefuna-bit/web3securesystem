import { Link } from 'react-router-dom';
import { Wallet, Twitter, Github, MessageCircle, Send } from 'lucide-react';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Portfolio', href: '/dashboard' },
      { label: 'Watchlist', href: '/dashboard' },
      { label: 'NFT Gallery', href: '/dashboard' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '#blog' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Support', href: '/dashboard' },
      { label: 'API Docs', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
  { icon: MessageCircle, href: 'https://discord.com', label: 'Discord' },
  { icon: Send, href: 'https://telegram.com', label: 'Telegram' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg shadow-primary-500/30">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Web3<span className="gradient-text">SecureSystem</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              The enterprise-grade platform for tracking, analyzing, and
              optimizing your crypto portfolio across 9+ blockchains.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 Web3SecureSystem. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with enterprise-grade security and real-time blockchain data.
          </p>
        </div>
      </div>
    </footer>
  );
}

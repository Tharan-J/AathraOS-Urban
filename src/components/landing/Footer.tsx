"use client";

import Link from "next/link";

const footerLinks = {
    Product: [
        { label: "Overview", href: "/dashboard" },
        { label: "Mobility Intelligence", href: "/dashboard/mobility" },
        { label: "Safety Monitor", href: "/dashboard/safety" },
        { label: "Digital Twin", href: "/dashboard/twin" },
    ],
    Resources: [
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "System Status", href: "#" },
        { label: "Release Notes", href: "#" },
    ],
    Company: [
        { label: "About Aathra", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Press Kit", href: "#" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Security", href: "#" },
        { label: "Compliance", href: "#" },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t border-white/[0.04] bg-surface/30">
            <div className="max-w-7xl mx-auto px-6">
                {/* Main Footer */}
                <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-5 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan/20 to-blue/10 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d="M2 17L12 22L22 17" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d="M2 12L12 17L22 12" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-text-primary">
                                Aathra<span className="text-cyan ml-0.5 font-light">OS</span>
                            </span>
                        </Link>
                        <p className="text-xs text-text-muted leading-relaxed mb-6 max-w-[200px]">
                            The sentient operating system for next-generation smart campus infrastructure.
                        </p>
                        {/* Social icons */}
                        <div className="flex gap-3">
                            {["github", "twitter", "linkedin"].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-cyan hover:border-cyan/20 transition-all"
                                    aria-label={social}
                                >
                                    {social === "github" && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                        </svg>
                                    )}
                                    {social === "twitter" && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    )}
                                    {social === "linkedin" && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-[10px] font-bold text-text-muted/60 tracking-[2px] uppercase mb-4">
                                {category}
                            </h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="py-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-[11px] text-text-muted/50">
                        <span>© 2026 Aathra Systems Inc.</span>
                        <span className="w-px h-3 bg-white/[0.06]" />
                        <span>All rights reserved.</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                            </span>
                            <span className="text-[10px] text-success font-medium">All Systems Operational</span>
                        </div>
                        <span className="w-px h-3 bg-white/[0.06]" />
                        <span className="text-[10px] text-text-muted/40 font-mono">v2.4.1-alpha</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

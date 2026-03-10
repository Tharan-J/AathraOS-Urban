"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
    { label: "Vision", href: "#vision" },
    { label: "Architecture", href: "#architecture" },
    { label: "Features", href: "#features" },
    { label: "Demo", href: "#demo" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <motion.header
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "glass shadow-lg shadow-black/20"
                    : "bg-transparent"
                }`}
        >
            <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan to-blue opacity-20 group-hover:opacity-40 transition-opacity" />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative z-10">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
                        </svg>
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-text-primary">
                        Aathra<span className="text-cyan ml-1 font-light">OS</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-sm text-text-secondary hover:text-cyan transition-colors duration-300 relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan group-hover:w-full transition-all duration-300" />
                        </a>
                    ))}
                </div>

                {/* Login CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/login"
                        className="btn-primary text-sm flex items-center gap-2"
                    >
                        Login
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button
                    className="md:hidden text-text-secondary hover:text-cyan transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation menu"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden glass border-t border-border overflow-hidden"
                    >
                        <div className="px-6 py-6 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-sm text-text-secondary hover:text-cyan transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <Link
                                href="/login"
                                className="btn-primary text-sm text-center mt-2"
                                onClick={() => setMobileOpen(false)}
                            >
                                Login
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}

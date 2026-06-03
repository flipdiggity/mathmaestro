'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SmartLink } from './smart-link';

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-600 hover:text-slate-900"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <SmartLink
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                onNavigate={() => setOpen(false)}
              >
                {link.label}
              </SmartLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

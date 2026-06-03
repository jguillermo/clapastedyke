/**
 * Line SVG icons, one per manual flow (copied from Manual_de_usuario.html)
 * and one per game level. Injected via [innerHTML].
 * Estilo: fill:none; stroke:currentColor; stroke-width:1.7; round caps.
 */

export const ICONS: Record<string, string> = {
  f01: '<svg viewBox="0 0 24 24"><path d="M20.5 13.5l-7 7-10-10V3.5h7z"/><circle cx="8" cy="8" r="1.6"/></svg>',
  f02: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.2l2.6 2.6L16 9.4"/></svg>',
  f03: '<svg viewBox="0 0 24 24"><path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3.5 3.5v2.5h-7.5z"/><circle cx="6.5" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/></svg>',
  f04: '<svg viewBox="0 0 24 24"><path d="M3 20.5h18"/><path d="M6 20.5v-7"/><path d="M11.5 20.5V5.5"/><path d="M17 20.5v-10"/></svg>',
  f05: '<svg viewBox="0 0 24 24"><circle cx="9.5" cy="20" r="1.6"/><circle cx="17.5" cy="20" r="1.6"/><path d="M2.5 4h2.2l2.4 11.2h11l1.9-8.2H6"/></svg>',
  f06: '<svg viewBox="0 0 24 24"><path d="M12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="M3.6 7.6L12 12l8.4-4.4"/><path d="M12 12v9"/></svg>',
  f07: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c0-4.2 3.8-6.3 7.5-6.3s7.5 2.1 7.5 6.3"/></svg>',
  f08: '<svg viewBox="0 0 24 24"><path d="M8 3.5h8l-1 4H9z"/><path d="M9 7.5h6l2 8a3 3 0 01-3 3.6H10a3 3 0 01-3-3.6z"/><path d="M9.5 13.5h5"/></svg>',
  f09: '<svg viewBox="0 0 24 24"><path d="M4 9l1.2-4.5h13.6L20 9"/><path d="M4.5 9h15v10.5h-15z"/><path d="M4 9a2.4 2.4 0 004.8 0 2.4 2.4 0 004.8 0 2.4 2.4 0 004.8 0"/><path d="M9.5 19.5v-4.5h5v4.5"/></svg>',
  f10: '<svg viewBox="0 0 24 24"><path d="M6 3.5h11a2 2 0 012 2v13a2 2 0 01-2 2H6z"/><path d="M6 3.5a2 2 0 00-2 2v13"/><path d="M9 8h7M9 12h7M9 16h4"/></svg>',
  f11: '<svg viewBox="0 0 24 24"><path d="M12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="M3.6 7.6L12 12l8.4-4.4"/><path d="M12 12v9"/><path d="M7.8 5.2l8.4 4.6"/></svg>',
  f12: '<svg viewBox="0 0 24 24"><path d="M12 3.5v11"/><path d="M7.5 10.5l4.5 4.5 4.5-4.5"/><path d="M4 20.5h16"/></svg>',
  f13: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="8" cy="17" r="2.1"/></svg>',
  _def: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/></svg>',
};

/** Icon of each game level. */
export const LEVEL_ICONS: Record<string, string> = {
  basic:
    '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2.5"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M38.1 9.9l-5 5M14.9 33.1l-5 5"/></svg>',
  intermediate:
    '<svg viewBox="0 0 48 48"><path d="M14 7h16a2 2 0 012 2v25l-4-3-3 3-3-3-3 3-3-3-4 3V9a2 2 0 012-2z"/><path d="M18 15h12M18 21h12M18 27h7"/></svg>',
  advanced:
    '<svg viewBox="0 0 48 48"><path d="M24 6l16 8v20l-16 8-16-8V14z"/><path d="M8 14l16 8 16-8M24 22v20"/><path d="M16 10l16 8"/></svg>',
};

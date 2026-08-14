import { ReactNode } from 'react';

export type IconName =
  | 'new'
  | 'open'
  | 'save'
  | 'save-as'
  | 'export-pdf'
  | 'export-word'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'text-color'
  | 'highlight'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'list-bullet'
  | 'list-number'
  | 'indent-inc'
  | 'indent-dec'
  | 'quote'
  | 'table'
  | 'image'
  | 'link'
  | 'page'
  | 'header'
  | 'tools'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'close'
  | 'chevron-down'
  | 'check'
  | 'lock'
  | 'unlock'
  | 'merge'
  | 'split'
  | 'droplet'
  | 'import'
  | 'folder'
  | 'trash'
  | 'up'
  | 'down'
  | 'info'
  | 'success'
  | 'warning'
  | 'sparkles'
  | 'search'
  | 'clock'
  | 'cloud'
  | 'upload'
  | 'download'
  | 'convert'
  | 'preview'
  | 'template'
  | 'rotate'
  | 'move'
  | 'ocr'
  | 'compress'
  | 'page-number'
  | 'header-footer'
  | 'organize'
  | 'page-setup'
  | 'form'
  | 'export-img'
  | 'meta'
  | 'bates';

const PATHS: Record<IconName, ReactNode> = {
  new: (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <path d="M12 11v6M9 14h6" />
    </>
  ),
  open: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 9h18" />
    </>
  ),
  save: (
    <>
      <path d="M5 3h11l5 5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3z" />
      <path d="M8 3v5h8V3" />
      <path d="M8 21v-6h8v6" />
    </>
  ),
  'save-as': (
    <>
      <path d="M5 3h11l5 5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3z" />
      <path d="M8 3v5h8V3" />
      <path d="M8 21v-6h8v6" />
      <path d="M18 12v3" />
    </>
  ),
  'export-pdf': (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <text x="12" y="17.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor" stroke="none">
        PDF
      </text>
    </>
  ),
  'export-word': (
    <>
      <path d="M14 3v5h5" />
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <text x="12" y="17.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="currentColor" stroke="none">
        W
      </text>
    </>
  ),
  cut: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.2 7.6 20 20M8.2 16.4 20 4M14.5 12l2.5-2.5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="1.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </>
  ),
  paste: (
    <>
      <path d="M9 3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V5H9z" />
      <path d="M9 5H5.5A1.5 1.5 0 0 0 4 6.5v13A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18.5 5H15" />
    </>
  ),
  undo: <path d="M8 5 3 10l5 5M4 10h11a5 5 0 0 1 0 10h-3" />,
  redo: <path d="m16 5 5 5-5 5M20 10H9a5 5 0 0 0 0 10h3" />,
  bold: (
    <text x="12" y="17.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="currentColor" stroke="none">
      B
    </text>
  ),
  italic: (
    <text x="12" y="17.5" textAnchor="middle" fontSize="13" fontStyle="italic" fontWeight="600" fill="currentColor" stroke="none">
      I
    </text>
  ),
  underline: (
    <>
      <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" stroke="none">
        U
      </text>
      <path d="M6 21h12" />
    </>
  ),
  strike: (
    <>
      <text x="12" y="15" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor" stroke="none">
        S
      </text>
      <path d="M4 12h16" />
    </>
  ),
  'text-color': (
    <>
      <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" stroke="none">
        A
      </text>
      <path d="M4 21h16" stroke="currentColor" strokeWidth="2.6" />
    </>
  ),
  highlight: (
    <>
      <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" stroke="none">
        ab
      </text>
      <path d="M4 21h16" stroke="currentColor" strokeWidth="3.4" />
    </>
  ),
  'align-left': (
    <>
      <path d="M4 5h16M4 10h11M4 15h16M4 20h11" />
    </>
  ),
  'align-center': (
    <>
      <path d="M4 5h16M6.5 10h11M4 15h16M6.5 20h11" />
    </>
  ),
  'align-right': (
    <>
      <path d="M4 5h16M9 10h11M4 15h16M9 20h11" />
    </>
  ),
  'align-justify': <path d="M4 5h16M4 10h16M4 15h16M4 20h16" />,
  'list-bullet': (
    <>
      <circle cx="6" cy="6" r="1.4" />
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="6" cy="18" r="1.4" />
      <path d="M10 6h10M10 12h10M10 18h10" />
    </>
  ),
  'list-number': (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M3.5 5.5 5 4.5v3M3.5 13h1.8A1.2 1.2 0 0 1 5 15l-2 2h2.5M4 19l1.6-1.4" />
    </>
  ),
  'indent-inc': (
    <>
      <path d="M4 5h16M4 10h16M4 15h16M4 20h16" />
      <path d="M4 12l3-2v4z" />
    </>
  ),
  'indent-dec': (
    <>
      <path d="M4 5h16M4 10h16M4 15h16M4 20h16" />
      <path d="M10 12l-3-2v4z" />
    </>
  ),
  quote: (
    <>
      <path d="M6 17h3l2-4V7H5v6h3zM13 17h3l2-4V7h-6v6h3z" />
    </>
  ),
  table: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5 18 5-5 3 3 3-3 3 3" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1.5-1.5" />
    </>
  ),
  page: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  header: (
    <>
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none">
        H
      </text>
      <path d="M3 3h18" strokeWidth="2.4" />
    </>
  ),
  tools: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1M18.6 18.6l-2.1-2.1M7.5 7.5 5.4 5.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6l-1.4 1.4M7 16.9l-1.4 1.4M18.4 18.4l-1.4-1.4M7 7.1 5.6 5.6" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 7.7-1.5M12 15v2" />
    </>
  ),
  merge: (
    <>
      <path d="M4 4h5a6 6 0 0 1 0 12H3" />
      <path d="M20 20h-5a6 6 0 0 1 0-12h6" />
      <path d="M6 14l-2 2 2 2M18 10l2-2-2-2" />
    </>
  ),
  split: (
    <>
      <path d="M12 3v18" />
      <path d="M5 6 3 4l2-2" />
      <path d="M19 6l2-2-2-2" />
      <path d="M3 4h4M17 4h4" />
      <path d="M3 20h18" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
      <path d="M9.5 14a3 3 0 0 0 2.5 3" />
    </>
  ),
  import: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 10v6M14 10v6" />
    </>
  ),
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  rotate: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </>
  ),
  move: (
    <>
      <path d="M12 3v18M3 12h18M7 7l5-5 5 5M7 17l5 5 5-5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18a4 4 0 0 1-.9-7.9 5.5 5.5 0 0 1 10.7-1.5A4.5 4.5 0 0 1 17 18z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 21h16" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 21h16" />
    </>
  ),
  convert: (
    <>
      <path d="M4 5h9a5 5 0 0 1 0 10H8" />
      <path d="m6 8-2 2 2 2M20 19h-9a5 5 0 0 1 0-10h4" />
      <path d="m18 16 2-2-2-2" />
    </>
  ),
  preview: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  template: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  ocr: (
    <>
      <path d="M4 5h3M4 5v14M17 5h3M20 5v14M4 12h3M4 19h3M17 12h3" />
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M10 8h4M10 12h4M10 16h2" />
    </>
  ),
  compress: (
    <>
      <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
    </>
  ),
  'page-number': (
    <>
      <path d="M5 5h14M5 12h14M5 19h14" />
      <path d="M9 5v14M15 5v14" />
      <text x="12" y="16" textAnchor="middle" fontSize="6" fontWeight="700" fill="currentColor" stroke="none">
        #
      </text>
    </>
  ),
  'header-footer': (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 9h16" strokeDasharray="2 1" />
      <path d="M4 16h16" strokeDasharray="2 1" />
    </>
  ),
  organize: (
    <>
      <rect x="3.5" y="3.5" width="9" height="17" rx="1.5" />
      <path d="m16.5 8 2.5-2.5 2.5 2.5M19 5.5V13" />
      <path d="m16.5 16 2.5 2.5 2.5-2.5M19 18.5V11" />
    </>
  ),
  'page-setup': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M8 5V8H5M16 5v3h3M8 19v-3H5M16 19v-3h3" />
    </>
  ),
  form: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 3h6v3H9zM8 11h8M8 15h5M8 19h3" />
    </>
  ),
  'export-img': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  meta: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 12v4" />
    </>
  ),
  bates: (
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
      <path d="M17 15l3 3-3 3" />
    </>
  ),
};

export function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

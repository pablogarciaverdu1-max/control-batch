// Iconos de trazo copiados de los diseños.
import type { CSSProperties, ReactNode } from 'react';

interface P {
  t?: number;
  sw?: number;
  c?: string;
  style?: CSSProperties;
}

function Svg({ t = 24, sw = 2, c = 'currentColor', style, lj = true, children }: P & { lj?: boolean; children: ReactNode }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round"
      strokeLinejoin={lj ? 'round' : undefined} aria-hidden="true" style={style}>
      {children}
    </svg>
  );
}

export const ICerrar = (p: P) => <Svg sw={2.4} lj={false} {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const IAtras = (p: P) => <Svg sw={2.4} {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
export const ISiguiente = (p: P) => <Svg sw={2.6} {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const IMas = (p: P) => <Svg sw={2.6} lj={false} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IMenos = (p: P) => <Svg sw={2.8} lj={false} {...p}><path d="M5 12h14" /></Svg>;
export const ICheck = (p: P) => <Svg sw={2.6} {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const IPapelera = (p: P) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>;
export const ILapiz = (p: P) => <Svg sw={2.2} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Svg>;
export const ILapiz2 = (p: P) => <Svg sw={2.2} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></Svg>;
export const IBuscar = (p: P) => <Svg sw={2.2} lj={false} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Svg>;
export const ISinConexion = (p: P) => (
  <Svg sw={2.2} {...p}><path d="M3 3l18 18" /><path d="M8.5 8.6A5 5 0 0 0 6 18h11" /><path d="M12.6 6.1A5.5 5.5 0 0 1 17.5 11 3.5 3.5 0 0 1 20 16.6" /></Svg>
);
export const IOlla = (p: P & { vapor?: string }) => (
  <Svg {...p}><path d="M4 10h16v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" /><path d="M2 10h20" /><path d="M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2" stroke={p.vapor} /></Svg>
);
export const ICarrito = (p: P & { extra?: string }) => (
  <Svg {...p}>
    <circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.4 11.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6" />
    {p.extra && <path d="M13 9v4M11 11h4" stroke={p.extra} />}
  </Svg>
);
export const ICasa = (p: P) => <Svg sw={2.2} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>;
export const IReloj = (p: P) => <Svg lj={false} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const IEngranaje = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);
export const ISol = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></Svg>
);
export const IDeshacer = (p: P) => <Svg sw={2.6} {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Svg>;
export const IDuplicar = (p: P) => (
  <Svg sw={2.2} {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Svg>
);
export const ICalendario = (p: P) => <Svg sw={2.2} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>;
export const INube = (p: P) => <Svg sw={2.2} {...p}><path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z" /><path d="M9.5 13.5l2 2 3.5-4" /></Svg>;
export const IDescargar = (p: P) => <Svg sw={2.2} {...p}><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 19h16" /></Svg>;
export const ILlave = (p: P) => <Svg sw={2.2} {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3M14 9l2 2" /></Svg>;
export const IOjo = (p: P) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;

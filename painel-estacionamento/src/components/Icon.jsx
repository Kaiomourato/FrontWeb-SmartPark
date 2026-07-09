const PATHS = {
  // Marca / estacionamento
  parking: 'M6 4h6.5a4.5 4.5 0 0 1 0 9H10v7H6V4zm4 5h2.5a1.5 1.5 0 0 0 0-3H10v3z',
  car: 'M5 11l1.6-4.6A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.4L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h10v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5a2 2 0 0 0-2-2M7.5 14.5h0M16.5 14.5h0',
  moto: 'M5 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0zm9 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0zM7.5 17h6l1-5h2.5M11 8h3l2 4M9 8H6l-1 3',
  truck: 'M3 7h9v8H3V7zm9 3h4l3 3v2h-2m-12 0h7M7 18a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zm9 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z',

  // Navegação / locais
  pin: 'M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.3-4.3',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm3.5-12.5-2 5-5 2 2-5z',

  // Estados / status
  signalOff: 'M3 3l18 18M8.5 8.5a6 6 0 0 1 8.5 0M5.5 5.5A10 10 0 0 1 12 3c2.6 0 5 .9 6.9 2.5M12 19.5v.01',
  check: 'M5 12.5l4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6 6 18',
  clock: 'M12 7v5l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  ticket: 'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8zM9 7v10',
  hourglass: 'M6 3h12M6 21h12M7 3v3.5a5 5 0 0 0 2.5 4.3v.4A5 5 0 0 0 7 15.2V21M17 3v3.5a5 5 0 0 1-2.5 4.3v.4A5 5 0 0 1 17 15.2V21',
  flag: 'M6 21V4m0 0h11l-2 3.5L17 11H6',
  blocked: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.5 5.5l13 13',

  // Painel / navegação lateral
  gauge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 12l4-4M12 12V8',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.5v.01',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4.5 10.2l-1.7-.4-1 1.7 1.3 1.2v1l-1.3 1.2 1 1.7 1.7-.4 1 .6.5 1.6h2l.5-1.6 1-.6 1.7.4 1-1.7-1.3-1.2v-1l1.3-1.2-1-1.7-1.7.4-1-.6-.5-1.6h-2l-.5 1.6-1 .6z',
  layers: 'M12 3l8 4-8 4-8-4 8-4zm-8 8 8 4 8-4M4 15l8 4 8-4',

  // Diversos
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 9v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M17 8a3 3 0 1 1 0 6m4 6v-1a5 5 0 0 0-3.5-4.8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
  filter: 'M4 5h16M7 12h10M10 19h4',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 20h14',
  print: 'M7 8V4h10v4M7 17h10v4H7v-4zM5 8h14a2 2 0 0 1 2 2v5h-4M5 8a2 2 0 0 0-2 2v5h4M5 8h14',
  plus: 'M12 5v14M5 12h14',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
  shield: 'M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm15 3h-3a2 2 0 1 0 0 4h3',
  refresh: 'M3 12a9 9 0 0 1 15.5-6.4M21 12a9 9 0 0 1-15.5 6.4M19 5v4h-4M5 19v-4h4',
  save: 'M5 4h11l3 3v13H5V4zm3 0v5h8V4M8 13h8v7H8z',
  barChart: 'M4 20V10m6 10V4m6 16v-7',
  trendUp: 'M4 16l5-5 4 4 7-7M14 8h6v6',
};

/**
 * Conjunto de ícones SVG inline próprios do SmartPark — substitui emojis
 * genéricos por traços consistentes com a paleta e o tema "ticket de
 * estacionamento".
 */
export default function Icon({ name, size = 18, strokeWidth = 2, className = '', style }) {
  const d = PATHS[name];
  if (!d) return null;
  const filled = name === 'parking' || name === 'car' || name === 'moto' || name === 'truck' || name === 'bolt';
  return (
    <svg
      className={`icon icon-${name} ${className}`}
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

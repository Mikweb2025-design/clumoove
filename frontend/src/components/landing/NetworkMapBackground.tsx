import { useEffect, useState } from 'react';
import networkBg from '../../assets/network-bg.png';

interface NodeDef {
  id: string;
  cx: number;
  cy: number;
}

type CloudTone = 'orange' | 'navy' | 'muted';

const NODES: (NodeDef & { cloud?: CloudTone })[] = [
  { id: 'LON', cx: 485, cy: 200, cloud: 'navy' },
  { id: 'AMS', cx: 600, cy: 130 },
  { id: 'CPH', cx: 540, cy: 90 },
  { id: 'FRA', cx: 700, cy: 170 },
  { id: 'FRA2', cx: 750, cy: 270, cloud: 'orange' },
  { id: 'ZRH', cx: 650, cy: 260 },
  { id: 'MIL', cx: 600, cy: 330, cloud: 'muted' },
  { id: 'VIE', cx: 695, cy: 370, cloud: 'muted' },
  { id: 'MAD', cx: 440, cy: 430 },
  { id: 'WAW', cx: 790, cy: 310 },
  { id: 'BER', cx: 620, cy: 195 },
  { id: 'PAR', cx: 520, cy: 275 },
  { id: 'DUB', cx: 430, cy: 160 },
  { id: 'STO', cx: 590, cy: 50 },
  { id: 'BUD', cx: 740, cy: 390 },
  { id: 'LIS', cx: 385, cy: 470 },
  { id: 'ROM', cx: 640, cy: 410 },
  { id: 'ATH', cx: 740, cy: 480 },
  { id: 'HEL', cx: 690, cy: 55 },
];

const CLOUD_COLORS: Record<CloudTone, { stroke: string; fill: string }> = {
  orange: { stroke: '#ffd700', fill: 'rgba(255,215,0,0.12)' },
  navy: { stroke: '#1e3a8a', fill: 'rgba(30,58,138,0.08)' },
  muted: { stroke: '#64748b', fill: 'rgba(100,116,139,0.06)' },
};

interface ConnectionDef {
  d: string;
  dur: number;
  delay?: number;
}

const CONNECTIONS: ConnectionDef[] = [
  { d: 'M 485 200 Q 540 160 600 130', dur: 3 },
  { d: 'M 600 130 Q 650 150 700 170', dur: 2.5 },
  { d: 'M 700 170 Q 720 220 750 270', dur: 3.5 },
  { d: 'M 750 270 Q 730 320 695 370', dur: 3 },
  { d: 'M 695 370 Q 650 350 600 330', dur: 2.8 },
  { d: 'M 600 330 Q 680 300 750 270', dur: 4 },
  { d: 'M 700 170 Q 680 220 650 260', dur: 2.2 },
  { d: 'M 650 260 Q 630 300 600 330', dur: 2.5 },
  { d: 'M 750 270 Q 770 290 790 310', dur: 2 },
  { d: 'M 440 430 Q 520 380 600 330', dur: 4.5 },
  { d: 'M 600 130 Q 570 110 540 90', dur: 2 },
  { d: 'M 485 200 Q 620 180 750 270', dur: 5 },
  { d: 'M 500 300 Q 580 280 650 260', dur: 2.8 },
  { d: 'M 485 200 Q 470 230 520 275', dur: 3.5 },
  { d: 'M 520 275 Q 570 300 600 330', dur: 2.7 },
  { d: 'M 620 195 Q 600 160 600 130', dur: 2.3 },
  { d: 'M 620 195 Q 660 220 650 260', dur: 2.1 },
  { d: 'M 430 160 Q 460 180 485 200', dur: 2.5 },
  { d: 'M 590 50 Q 590 90 600 130', dur: 3.2 },
  { d: 'M 690 55 Q 700 110 700 170', dur: 3.8 },
  { d: 'M 740 390 Q 770 350 750 270', dur: 3.3 },
  { d: 'M 740 390 Q 710 380 695 370', dur: 2 },
  { d: 'M 640 410 Q 620 370 600 330', dur: 2.6 },
  { d: 'M 385 470 Q 410 450 440 430', dur: 2.4 },
  { d: 'M 740 480 Q 740 430 740 390', dur: 2.8 },
  { d: 'M 640 410 Q 690 440 740 480', dur: 3.5 },
  { d: 'M 430 160 Q 500 130 540 90', dur: 4.2 },
];

interface PacketDef {
  path: string;
  dur: number;
  delay: number;
}

const PACKETS: PacketDef[] = [
  { path: 'M 695 370 Q 600 330 485 200', dur: 10, delay: 0 },
  { path: 'M 790 310 Q 630 210 485 200', dur: 12, delay: 3 },
  { path: 'M 750 270 Q 620 180 485 200', dur: 8, delay: 1.5 },
  { path: 'M 695 370 Q 720 320 750 270 Q 620 180 485 200', dur: 14, delay: 6 },
  { path: 'M 600 330 Q 540 260 485 200', dur: 9, delay: 4.5 },
  { path: 'M 790 310 Q 770 290 750 270 Q 680 300 600 330', dur: 11, delay: 2 },
];

const EUROPE_PATHS = [
  'M520 150 Q540 130 570 125 Q600 120 630 130 Q660 140 680 150 Q700 160 720 170 Q740 180 750 200 Q760 220 755 240 Q750 260 740 280 Q730 300 710 310 Q690 320 670 325 Q650 330 630 335 Q610 340 590 345 Q570 350 550 360 Q530 370 510 380 Q490 390 480 410 Q470 430 465 450 Q460 470 455 490 Q450 510 440 525 Q430 540 420 550 Q410 560 400 565 Q390 570 380 560 Q370 550 365 530 Q360 510 358 490 Q355 470 360 450 Q365 430 375 410 Q385 390 400 370 Q415 350 430 335 Q445 320 460 305 Q475 290 490 270 Q505 250 515 230 Q525 210 525 190 Q525 170 520 150Z',
  'M570 125 Q580 110 600 100 Q620 90 640 95 Q660 100 670 115 Q680 130 685 145 Q690 160 680 170 Q670 180 655 185 Q640 190 625 185 Q610 180 600 165 Q590 150 580 140 Q570 130 570 125Z',
  'M750 200 Q770 190 790 195 Q810 200 820 220 Q830 240 825 260 Q820 280 810 295 Q800 310 780 315 Q760 320 750 310 Q740 300 745 280 Q750 260 750 240 Q750 220 750 200Z',
];

export function NetworkMapBackground() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReduce = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqReduce.addEventListener('change', handleReduce);

    const mqMobile = window.matchMedia('(max-width: 767px)');
    const handleMobile = (e: MediaQueryListEvent) => setMobile(e.matches);
    mqMobile.addEventListener('change', handleMobile);

    return () => {
      mqReduce.removeEventListener('change', handleReduce);
      mqMobile.removeEventListener('change', handleMobile);
    };
  }, []);

  const showPackets = !reducedMotion;
  const packetCount = mobile ? 3 : PACKETS.length;
  const activeNodes = mobile ? NODES.filter((n) => ['LON', 'FRA2', 'MIL', 'VIE', 'AMS', 'FRA'].includes(n.id)) : NODES;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-cover bg-center opacity-8" style={{ backgroundImage: `url(${networkBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/90 via-[var(--color-bg)]/70 to-[var(--color-bg)]/90" />
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -28; }
        }
        @keyframes packet-travel {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-dash-flow,
          .animate-packet-travel,
          .animate-packet-trail {
            animation: none !important;
          }
        }
      `}</style>
      <svg viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bg-glow-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-glow-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
        </defs>

          <circle cx="200" cy="200" r="250" fill="url(#bg-glow-blue)" />
        <circle cx="1200" cy="700" r="300" fill="url(#bg-glow-blue)" />
        <circle cx="720" cy="100" r="220" fill="url(#bg-glow-orange)" />
        <circle cx="720" cy="800" r="220" fill="url(#bg-glow-orange)" />

        <g opacity="0.03" fill="#1e3a8a">
          {EUROPE_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        <g fill="none" strokeWidth="1" strokeLinecap="round" opacity="0.2">
          {CONNECTIONS.map((c, i) => (
            <path
              key={i}
              d={c.d}
              stroke="url(#bg-glow-orange)"
              strokeDasharray="6 8"
              className={reducedMotion ? '' : 'animate-dash-flow'}
              style={reducedMotion ? {} : { animation: `dash-flow ${c.dur}s linear infinite${c.delay ? ` ${c.delay}s` : ''}` }}
            />
          ))}
        </g>

        {showPackets && PACKETS.slice(0, packetCount).map((pkt, i) => (
          <g key={i} className="animate-packet-travel" style={{ offsetPath: `path("${pkt.path}")`, offsetDistance: '0%', animation: `packet-travel ${pkt.dur}s linear infinite ${pkt.delay}s` }}>
            <rect x="-4" y="-5" width="8" height="10" rx="1.5" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.5">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${pkt.dur}s`} repeatCount="indefinite" begin={`${pkt.delay}s`} />
            </rect>
            <line x1="-2" y1="-2" x2="2" y2="-2" stroke="#ffd700" strokeWidth="0.8" opacity="0.5">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${pkt.dur}s`} repeatCount="indefinite" begin={`${pkt.delay}s`} />
            </line>
            <line x1="-2" y1="1" x2="2" y2="1" stroke="#ffd700" strokeWidth="0.8" opacity="0.5">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${pkt.dur}s`} repeatCount="indefinite" begin={`${pkt.delay}s`} />
            </line>
            <line x1="-2" y1="4" x2="0" y2="4" stroke="#ffd700" strokeWidth="0.8" opacity="0.5">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={`${pkt.dur}s`} repeatCount="indefinite" begin={`${pkt.delay}s`} />
            </line>
          </g>
        ))}

        {showPackets && PACKETS.slice(0, packetCount).map((pkt, i) => (
          <g key={`t${i}`} className="animate-packet-trail" style={{ offsetPath: `path("${pkt.path}")`, offsetDistance: '-5%', animation: `packet-travel ${pkt.dur}s linear infinite ${pkt.delay}s` }}>
            <circle cx="0" cy="0" r="2" fill="#ffd700" opacity="0.15" />
            <circle cx="0" cy="0" r="1" fill="#ffd700" opacity="0.3" />
          </g>
        ))}

        {activeNodes.map((n) => (
          <g key={n.id}>
            {n.cloud && (
              <g transform={`translate(${n.cx}, ${n.cy - 22})`}>
                <path
                  d="M-6,1 Q-7,-1 -6,-3 Q-4,-6 -1,-6 Q1,-7 3,-6 Q5,-5 6,-2 Q7,0 6,2 Q7,3 5,3 L-5,3 Q-7,3 -6,1Z"
                  fill={CLOUD_COLORS[n.cloud].fill}
                  stroke={CLOUD_COLORS[n.cloud].stroke}
                  strokeWidth="1"
                  opacity="0.5"
                />
                {showPackets && (
                  <circle className="arrive-pulse" cx="0" cy="0" r="8" fill="none" stroke={CLOUD_COLORS[n.cloud].stroke} strokeWidth="1" opacity="0">
                    <animate attributeName="r" values="6;20" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            )}
            <circle cx={n.cx} cy={n.cy} r="10" fill="url(#node-glow)">
              <animate attributeName="r" values="8;14;8" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={n.cx} cy={n.cy} r="2" fill="#ffd700">
              <animate attributeName="r" values="1.5;3.5;1.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <text x={n.cx - 4} y={n.cy - 16} fontSize="7" fill="#ffd700" fontWeight="bold" fontFamily="monospace" opacity="0.6">
              {n.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

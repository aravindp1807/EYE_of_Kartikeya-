'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Radar, BarChart3, AlertTriangle, Network } from 'lucide-react';

interface KartikeyaHubProps {
  activePanel: 'chat' | 'recon' | 'markets' | 'alerts' | 'entityGraph' | null;
  onTogglePanel: (panel: 'chat' | 'recon' | 'markets' | 'alerts' | 'entityGraph') => void;
}

export default function KartikeyaHub({ activePanel, onTogglePanel }: KartikeyaHubProps) {
  const [hubOpen, setHubOpen] = useState(true);

  // Fanning out coordinates for 5 buttons (radius ~220px to clear the larger idol)
  // Angles: 180, 202.5, 225, 247.5, 270
  const buttons = [
    { id: 'chat', icon: MessageSquare, label: 'Oracle Chat', dx: -220, dy: 0, color: '#C88C14', tooltipClass: 'bottom-full mb-3 left-1/2 -translate-x-1/2' },
    { id: 'recon', icon: Radar, label: 'Recon Intel', dx: -203, dy: -84, color: '#CC1A1A', tooltipClass: 'right-full mr-4 top-1/2 -translate-y-1/2' },
    { id: 'markets', icon: BarChart3, label: 'Markets', dx: -155, dy: -155, color: '#00C853', tooltipClass: 'right-full mr-4 top-1/2 -translate-y-1/2' },
    { id: 'alerts', icon: AlertTriangle, label: 'Global Alerts', dx: -84, dy: -203, color: '#FF2020', tooltipClass: 'right-full mr-4 top-1/2 -translate-y-1/2' },
    { id: 'entityGraph', icon: Network, label: 'Entity Graph', dx: 0, dy: -220, color: '#3D6DCC', tooltipClass: 'right-full mr-4 top-1/2 -translate-y-1/2' },
  ] as const;

  return (
    <div className="absolute bottom-12 right-12 z-[350] flex items-center justify-center pointer-events-auto">
      <AnimatePresence>
        {hubOpen && buttons.map((btn, i) => {
          const isActive = activePanel === btn.id;
          return (
            <motion.div
              key={btn.id}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{ opacity: 1, x: btn.dx, y: btn.dy, scale: 1 }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.05 }}
              className="absolute"
            >
              <div className="relative group">
                <button
                  onClick={() => onTogglePanel(btn.id)}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-lg backdrop-blur-md"
                  style={{
                    backgroundColor: isActive ? `${btn.color}40` : 'rgba(10,0,18,0.85)',
                    borderColor: isActive ? btn.color : 'rgba(200,140,20,0.4)',
                    boxShadow: isActive ? `0 0 25px ${btn.color}90` : '0 6px 16px rgba(0,0,0,0.6)'
                  }}
                >
                  <btn.icon className="w-6 h-6" style={{ color: isActive ? '#fff' : btn.color }} />
                </button>
                <div className={`absolute ${btn.tooltipClass} px-3 py-1.5 bg-black/95 text-white text-[11px] font-mono rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-[var(--gold-primary)]/50 z-50 shadow-[0_0_15px_rgba(200,140,20,0.3)]`}>
                  {btn.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.button
        onClick={() => setHubOpen(!hubOpen)}
        className="relative z-10 w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden flex items-center justify-center bg-[#030008]"
        style={{
          border: hubOpen ? '4px solid #C88C14' : '4px solid rgba(200,140,20,0.4)',
          boxShadow: hubOpen 
            ? '0 0 50px rgba(200,140,20,0.8), 0 0 100px rgba(204,26,26,0.6)' 
            : '0 0 30px rgba(200,140,20,0.4)',
          transition: 'all 0.4s ease'
        }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(200,140,20,1), 0 0 110px rgba(204,26,26,0.7)' }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-black" />
        <img src="/kartikeya-idol.jpeg?v=4" alt="Lord Kartikeya" className="relative z-10 w-full h-full object-cover opacity-100 hover:scale-110 transition-transform duration-700 ease-out" />
      </motion.button>
    </div>
  );
}

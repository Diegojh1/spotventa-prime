import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfettiProps {
  isActive: boolean;
}

export function Confetti({ isActive }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      // Crear partículas de confeti más sutiles y elegantes
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'][Math.floor(Math.random() * 5)],
        size: Math.random() * 6 + 3,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          initial={{ y: -10, x: particle.x, rotate: 0 }}
          animate={{
            y: [particle.y, 110],
            x: [particle.x, particle.x + (Math.random() - 0.5) * 20],
            rotate: [0, 360],
            scale: [1, 0.8, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 1,
            ease: "easeOut",
            delay: Math.random() * 0.3,
          }}
          onAnimationComplete={() => {
            // Remover partícula después de la animación
            setTimeout(() => {
              setParticles(prev => prev.filter(p => p.id !== particle.id));
            }, 100);
          }}
        />
      ))}
    </div>
  );
}

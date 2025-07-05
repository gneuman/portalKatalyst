import { useEffect, useState } from "react";

export default function Confetti({ show, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // Crear partículas de confeti
      const newParticles = [];
      for (let i = 0; i < 150; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 3 + 2,
          rotation: Math.random() * 360,
          color: [
            "#FF6B6B",
            "#4ECDC4",
            "#45B7D1",
            "#96CEB4",
            "#FFEAA7",
            "#DDA0DD",
            "#98D8C8",
          ][Math.floor(Math.random() * 7)],
          size: Math.random() * 10 + 5,
        });
      }
      setParticles(newParticles);

      // Timer para ocultar después de 10 segundos
      const timer = setTimeout(() => {
        onComplete();
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [show, onComplete]);

  useEffect(() => {
    if (!show || particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            rotation: particle.rotation + 2,
            vy: particle.vy + 0.1, // gravedad
          }))
          .filter((particle) => particle.y < window.innerHeight + 50)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [show, particles]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: "50%",
            transform: `rotate(${particle.rotation}deg)`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

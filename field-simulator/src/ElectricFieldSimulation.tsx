import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Charge {
  id: string;
  x: number;
  y: number;
  magnitude: number;
  isPositive: boolean;
}

interface Vector2D {
  x: number;
  y: number;
}

const ElectricFieldSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [newChargePositive, setNewChargePositive] = useState(true);
  const [showEquipotential, setShowEquipotential] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);

  // Update canvas dimensions on resize
  useEffect(() => {
    const isMobileDevice = () => window.innerWidth < 768;

    const calculateDimensions = () => {
      if (isMobileDevice()) {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      } else {
        const container = document.getElementById('canvas-container');
        if (container) {
          const style = window.getComputedStyle(container);
          const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
          
          const availableWidth = container.clientWidth - paddingX;
          const availableHeight = container.clientHeight - paddingY;
          
          return {
            width: availableWidth,
            height: availableHeight
          };
        }
        return {
          width: Math.min(1200, window.innerWidth - 40), 
          height: Math.min(800, window.innerHeight - 40)
        };
      }
    };

    const updateDimensions = () => {
      setDimensions(calculateDimensions());
    };

    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const [isTouchDragging, setIsTouchDragging] = useState(false);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setIsTouchDragging(false);
  }, []);

  // Calculate electric field at a point
  const calculateFieldAtPoint = useCallback((x: number, y: number): Vector2D => {
    let fieldX = 0;
    let fieldY = 0;
    const k = 8990; // Coulomb's constant (scaled for visualization)

    charges.forEach(charge => {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r2 = dx * dx + dy * dy;
      
      if (r2 > 100) { // Avoid singularities
        const r = Math.sqrt(r2);
        const magnitude = k * charge.magnitude / r2;
        const unitX = dx / r;
        const unitY = dy / r;
        
        if (charge.isPositive) {
          fieldX += magnitude * unitX;
          fieldY += magnitude * unitY;
        } else {
          fieldX -= magnitude * unitX;
          fieldY -= magnitude * unitY;
        }
      }
    });

    return { x: fieldX, y: fieldY };
  }, [charges]);

  const calculatePotentialAtPoint = useCallback((x: number, y: number): number => {
    let potential = 0;
    const k = 8990;

    charges.forEach(charge => {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      
      if (r > 10) {
        const sign = charge.isPositive ? 1 : -1;
        potential += k * charge.magnitude * sign / r;
      }
    });

    return potential;
  }, [charges]);

const [showControlPanel, setShowControlPanel] = useState(true);

const isPositionValid = useCallback((x: number, y: number, excludeId?: string): boolean => {
  const minDistance = 40;
  
  return !charges.some(charge => {
    if (charge.id === excludeId) return false;
    const dx = x - charge.x;
    const dy = y - charge.y;
    return Math.sqrt(dx * dx + dy * dy) < minDistance;
  });
}, [charges]);

const drawFieldLines = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    const gridSize = window.innerWidth < 768 ? 55 : 55;
    for (let x = 0; x < dimensions.width; x += gridSize) {
      for (let y = 0; y < dimensions.height; y += gridSize) {
        const field = calculateFieldAtPoint(x, y);
        const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);
        
        if (magnitude > 0.1 && magnitude < 1000) {
          const scale = Math.min(300, Math.log(magnitude + 1) * 20);
          const unitX = field.x / magnitude;
          const unitY = field.y / magnitude;
          
          // Arrow color based on field strength
          const intensity = Math.min(255, magnitude / 2);
          ctx.strokeStyle = `rgba(255, ${255 - intensity}, ${255 - intensity}, 0.8)`;
          ctx.lineWidth = 2;
          
          // Draw arrow
          ctx.beginPath();
          ctx.moveTo(x - unitX * scale / 2, y - unitY * scale / 2);
          ctx.lineTo(x + unitX * scale / 2, y + unitY * scale / 2);
          ctx.stroke();
          
          // Arrow head
          const headLength = scale / 2; 
          const angle = Math.atan2(unitY, unitX);
          ctx.beginPath();
          ctx.moveTo(x + unitX * scale / 2, y + unitY * scale / 2);
          ctx.lineTo(
            x + unitX * scale / 2 - headLength * Math.cos(angle - Math.PI / 6),
            y + unitY * scale / 2 - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(x + unitX * scale / 2, y + unitY * scale / 2);
          ctx.lineTo(
            x + unitX * scale / 2 - headLength * Math.cos(angle + Math.PI / 6),
            y + unitY * scale / 2 - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    }

  charges.forEach(charge => {
    const radius = 15 + charge.magnitude * 5;
    
    ctx.beginPath();
    ctx.arc(charge.x, charge.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = charge.isPositive ? '#ff00ff' : '#00ffff';
    ctx.fill();
    ctx.strokeStyle = charge.isPositive ? '#ff66ff' : '#66ffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const fontSize = Math.min(20, radius * 0.8);
    ctx.fillStyle = '#000';
    ctx.font = `${fontSize}px Helvetica`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chargeIndex = charges.findIndex(c => c.id === charge.id) + 1;
    ctx.fillText(`${charge.isPositive ? '+' : '-'}${chargeIndex}`, charge.x, charge.y);
  });
}, [charges, dimensions, calculateFieldAtPoint]);

  const drawEquipotential = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    const resolution = 4;
    const potentialField: number[][] = [];
    
    for (let x = 0; x < dimensions.width; x += resolution) {
      potentialField[x / resolution] = [];
      for (let y = 0; y < dimensions.height; y += resolution) {
        potentialField[x / resolution][y / resolution] = calculatePotentialAtPoint(x, y);
      }
    }
    
    // Draw contour lines
    const levels = [-1000, -500, -200, -100, -50, 0, 50, 100, 200, 500, 1000];
    
    levels.forEach(level => {
      ctx.beginPath();
      ctx.strokeStyle = level > 0 ? `rgba(255, 0, 255, 0.6)` : `rgba(0, 255, 255, 0.6)`;
      ctx.lineWidth = 2;
      
      for (let x = 0; x < dimensions.width - resolution; x += resolution) {
        for (let y = 0; y < dimensions.height - resolution; y += resolution) {
          const i = x / resolution;
          const j = y / resolution;
          
          if (potentialField[i] && potentialField[i][j] !== undefined &&
              potentialField[i + 1] && potentialField[i + 1][j] !== undefined &&
              potentialField[i][j + 1] !== undefined &&
              potentialField[i + 1][j + 1] !== undefined) {
            
            const v1 = potentialField[i][j];
            const v2 = potentialField[i + 1][j];
            const v3 = potentialField[i + 1][j + 1];
            const v4 = potentialField[i][j + 1];
            
            // Marching squares algorithm (simplified)
            const config = 
              (v1 > level ? 8 : 0) +
              (v2 > level ? 4 : 0) +
              (v3 > level ? 2 : 0) +
              (v4 > level ? 1 : 0);
            
            if (config > 0 && config < 15) {
              ctx.moveTo(x + resolution / 2, y);
              ctx.lineTo(x + resolution, y + resolution / 2);
            }
          }
        }
      }
      ctx.stroke();
    });
    
    // Draw charges on top
  charges.forEach(charge => {
    const radius = 15 + charge.magnitude * 5;
    
    ctx.beginPath();
    ctx.arc(charge.x, charge.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = charge.isPositive ? '#ff00ff' : '#00ffff';
    ctx.fill();
    ctx.strokeStyle = charge.isPositive ? '#ff66ff' : '#66ffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    const fontSize = Math.min(20, radius * 0.8);
    ctx.fillStyle = '#000';
    ctx.font = `${fontSize}px Helvetica`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chargeIndex = charges.findIndex(c => c.id === charge.id) + 1;
    ctx.fillText(`${charge.isPositive ? '+' : '-'}${chargeIndex}`, charge.x, charge.y);
  });
  }, [charges, dimensions, calculatePotentialAtPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (showEquipotential) {
      drawEquipotential(ctx);
    } else {
      drawFieldLines(ctx);
    }
  }, [charges, showEquipotential, dimensions, drawFieldLines, drawEquipotential]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    if (!isPositionValid(x, y)) {
      setShowOverlapWarning(true);
      setTimeout(() => setShowOverlapWarning(false), 2000);
      return;
    }
    
    const newCharge: Charge = {
      id: Date.now().toString(),
      x,
      y,
      magnitude: 1,
      isPositive: newChargePositive
    };
    setCharges([...charges, newCharge]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    // Check if clicking on a charge
    const clickedCharge = charges.find(charge => {
      const dx = x - charge.x;
      const dy = y - charge.y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });
    
    if (clickedCharge) {
      setIsDragging(clickedCharge.id);
      e.preventDefault();
      e.stopPropagation(); 
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    if (isPositionValid(x, y, isDragging)) {
      setCharges(charges.map(charge => 
        charge.id === isDragging 
          ? { ...charge, x, y }
          : charge
      ));
    }
  };

  const updateChargeMagnitude = (id: string, magnitude: number) => {
    setCharges(charges.map(charge => 
      charge.id === id 
        ? { ...charge, magnitude }
        : charge
    ));
  };

  const removeCharge = (id: string) => {
    setCharges(charges.filter(charge => charge.id !== id));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsTouchDragging(true);
    handleMouseDown(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isTouchDragging) {
      e.preventDefault(); // Esto previene el scroll de la página
    }
    handleMouseMove(e);
  };

  const handleTouchEnd = () => {
    setIsTouchDragging(false);
    handleMouseUp();
  };

  useEffect(() => {
    const handleTouchMoveDocument = (e: TouchEvent) => {
      if (isTouchDragging) {
        e.preventDefault();
      }
    };

    if (isTouchDragging) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('touchmove', handleTouchMoveDocument, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', handleTouchMoveDocument);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', handleTouchMoveDocument);
    };
  }, [isTouchDragging]);

<style>
  {`
    .control-panel {
      scrollbar-width: thin; 
      scrollbar-color: #ffffff #1A1A1A; 
    }

    .control-panel::-webkit-scrollbar {
      width: 8px; 
      height: 8px;
    }
    
    .control-panel::-webkit-scrollbar-track {
      background: #1A1A1A;
      border-radius: 10px;
      margin: 5px; 
    }
    
    .control-panel::-webkit-scrollbar-thumb {
      background: #ffffff;
      border-radius: 10px;
      border: 2px solid #1A1A1A;
    }

    @media (max-width: 767px) {
      .control-panel {
        -webkit-overflow-scrolling: touch; 
        overflow-y: scroll; 
        scrollbar-width: thin; 
        scrollbar-color: #ffffff #1A1A1A;
      }
      
      .control-panel::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      .control-panel::-webkit-scrollbar-thumb {
        min-height: 40px; 
      }
    }

    @supports (scrollbar-color: auto) {
      .control-panel {
        scrollbar-width: thin;
        scrollbar-color: #ffffff #1A1A1A;
      }
    }
  `}
</style>

const hoverStyles = `
  .charge-btn {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .charge-btn-positive:hover {
    background-color: #cc00cc !important;
    box-shadow: 0 4px 8px rgba(255, 0, 255, 0.3),
                0 0 0 2px rgba(255, 0, 255, 0.5);
    transform: translateY(-2px);
  }

  .charge-btn-negative:hover {
    background-color: #00cccc !important;
    box-shadow: 0 4px 8px rgba(0, 255, 255, 0.3),
                0 0 0 2px rgba(0, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  .charge-btn-negative:hover::after,
  .charge-btn-positive:hover::after  {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
    animation: ripple 1s ease-out;
  }

  .visualization-btnF, .visualization-btnP {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .visualization-btnF:hover {
    background-color: #555 !important;
    box-shadow: 0 0 15px rgba(248, 248, 255, 0.4);
    transform: translateY(-2px);
    border-color:rgb(251, 251, 251) !important;
  }

  .visualization-btnP:hover {
    background-color: #555 !important;
    box-shadow: 0 0 15px rgba(248, 248, 255, 0.4);
    transform: translateY(-2px);
    border-color:rgb(255, 255, 255) !important;
  }

  .visualization-btnF:hover::after,
  .visualization-btnP:hover::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
    animation: ripple 1s ease-out;
  }

  @keyframes ripple {
    0% {
      transform: scale(0, 0);
      opacity: 0.5;
    }
    100% {
      transform: scale(20, 20);
      opacity: 0;
    }
  }
  .reset-btn:hover {
    background-color: #333 !important;
    transform: scale(1.2);
  }
  .remove-btn:hover {
    transform: scale(1.2);
    opacity: 0.8;
  }
  .mobile-toggle-btn:hover {
    background-color: #444 !important;
  }
`;

return (  
  <>
    <style>{hoverStyles}</style>
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh', 
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'Helvetica',
      overflow: 'hidden'
    }}>
      {/* Header */}
    <header style={{
      padding: window.innerWidth < 768 ? '10px' : '15px',
      backgroundColor: '#1A1A1A',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      textAlign: 'center',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '15px',
      borderBottom: '2px solid #333'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img 
          src="https://media.istockphoto.com/id/1043738742/photo/3d-render-lightning-electric-power-symbol-retro-neon-glowing-sign-isolated-on-black.jpg?s=1024x1024&w=is&k=20&c=_DlPFycLLXCwLH0WxDj2HT3vyuwXSrMpmMla_DOTo9c=" 
          alt="Electricity Logo"
          style={{
            height: window.innerWidth < 768 ? '30px' : '40px', 
            width: window.innerWidth < 768 ? '30px' : '40px', 
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid transparent',
            background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
            padding: '2px'
          }}
        />
        <h1 style={{ 
          margin: 0,
          fontSize: window.innerWidth < 768 ? '20px' : '28px', 
          background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '1px'
        }}>
          Electric Field Simulator
        </h1>
      </div>

      {window.innerWidth < 768 && (
        <button
          onClick={() => setShowControlPanel(!showControlPanel)}
          className="mobile-toggle-btn"
          style={{
            padding: '6px 10px',
            backgroundColor: '#333',
            border: '1px solid #555',
            borderRadius: '20px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.3s ease',
            marginLeft: 'auto'
          }}
          aria-label={showControlPanel ? "Hide controls" : "Show controls"}
        >
          {showControlPanel ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 15l7-7 7 7"></path>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          )}
        </button>
      )}
    </header>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column-reverse' : 'row',
        flex: 1,
        overflow: 'hidden'
      }}>
      {/* Canvas */}
      <div 
        id="canvas-container"
        style={{ 
          flex: 1, 
          position: 'relative',
          cursor: isDragging 
            ? 'grabbing' 
            : charges.some(c => !isPositionValid(c.x, c.y, c.id)) 
              ? 'not-allowed' 
              : 'grab'
        }}
      >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          background: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
          border: '2px solid black',
          touchAction: isTouchDragging ? 'none' : 'auto' 
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      </div>

      {/* Control Panel */}
    <div className="control-panel" style={{
      width: window.innerWidth < 768 ? '100%' : '300px',
      height: window.innerWidth < 768 ? (showControlPanel ? '40vh' : '0') : '100%',
      maxHeight: window.innerWidth < 768 ? (showControlPanel ? '40vh' : '0') : 'none',
      backgroundColor: '#1A1A1A',
      padding: window.innerWidth < 768 ? (showControlPanel ? '15px 15px 25px 15px' : '0') : '0px 25px 15px 15px',
      overflowY: 'auto',
      boxSizing: 'border-box',
      boxShadow: window.innerWidth < 768 ? (showControlPanel ? '0 -5px 20px rgba(0,0,0,0.5)' : 'none') : '-5px 0 20px rgba(0,0,0,0.5)',
      scrollBehavior: 'smooth',
      overscrollBehavior: 'contain',
      WebkitOverflowScrolling: 'touch',
      transform: 'translateZ(0)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      overflow: window.innerWidth < 768 ? (showControlPanel ? 'auto' : 'hidden') : 'auto',
      borderTop: window.innerWidth < 768 ? (showControlPanel ? 'none' : 'none') : 'none',
      marginTop: window.innerWidth < 768 ? (showControlPanel ? '0' : '0') : '0',
      border: '2px solid #333'
    }}>

        {/* Add Charge Controls */}
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          marginBottom: '10px', 
          color: '#ccc',
          textAlign: 'left',
          position: 'relative',
          paddingBottom: '8px',
        }}>
          Add charge
          <span style={{
            position: 'absolute',
            bottom: 0,
            left: '2px',
            width: 'calc(100% - 5px)',
            height: '1px',
            backgroundColor: '#fff'
          }}></span>
        </h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button
          onClick={() => setNewChargePositive(true)}
          className="charge-btn-positive"
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: newChargePositive ? '#990099' : '#333',
              border: 'none',
              borderRadius: '5px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Positive (+)
          </button>
          <button
            onClick={() => setNewChargePositive(false)}
            className="charge-btn-negative"
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: !newChargePositive ? '#009999' : '#333',
              border: 'none',
              borderRadius: '5px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: 'bold',
              fontSize: '16px' 
            }}
          >
            Negative (−)
          </button>
        </div>
      </div>

        {/* Visualization Toggle */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            marginBottom: '10px', 
            color: '#ccc',
            textAlign: 'left',
            position: 'relative',
            paddingBottom: '8px'
          }}>
            Visualization
            <span style={{
              position: 'absolute',
              bottom: 0,
              left: '2px',
              width: 'calc(100% - 5px)',
              height: '1px',
              backgroundColor: '#fff'
            }}></span>
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEquipotential(false)}
            className="visualization-btnF"
            style={{
                flex: 1,
                padding: '10px',
                backgroundColor: !showEquipotential ? '#444444' : '#333333', 
                border: !showEquipotential ? '2px solid #F8F8FF' : 'none',
                borderRadius: '5px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                fontWeight: 'bold',
                fontSize: '16px' 
              }}
            >
              Field Lines
            </button>

          <button
            onClick={() => setShowEquipotential(true)}
            className="visualization-btnP"
            style={{
                flex: 1,
                padding: '10px',
                backgroundColor: showEquipotential ? '#444444' : '#333333', 
                border: showEquipotential ? '2px solid #F8F8FF' : 'none', 
                borderRadius: '5px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                fontWeight: 'bold',
                fontSize: '16px' 
              }}
            >
              Equipotential
            </button>
          </div>
        </div>

        {/* Charge List */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            position: 'relative',
            paddingBottom: '8px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              margin: '0px',
              color: '#ccc',
              textAlign: 'left'
            }}>
              Charges ({charges.length})
            </h3>
            {charges.length > 0 && (
            <button
              onClick={() => setCharges([])}
              className="reset-btn"
              style={{
                  padding: '5px 8px',
                  backgroundColor: 'transparent',
                  border: '1px solid #F8F8FF',
                  borderRadius: '4px',
                  color: '#F8F8FF',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.3s ease'
                }}
                title="Reset all charges"
              >
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M1 4v6h6"></path>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </button>
            )}
            <span style={{
              position: 'absolute',
              bottom: 0,
              left: '2px',
              width: 'calc(100% - 5px)',
              height: '1px',
              backgroundColor: '#fff'
            }}></span>
          </div>
          
          {charges.length === 0 && (
            <p style={{ color: '#666', fontSize: '16px' }}>
              No charges placed yet
            </p>
          )}
          {charges.map((charge, index) => (
            <div
              key={charge.id}
              style={{
                backgroundColor: '#222',
                padding: '10px', 
                marginBottom: '10px',
                borderRadius: '5px',
                border: `2px solid ${charge.isPositive ? '#990099' : '#009999'}`, 
                transition: 'box-shadow 0.3s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0px'
              }}>
                <span style={{ 
                  color: charge.isPositive ? '#ff00ff' : '#00ffff',
                  fontWeight: 'bold',
                  fontSize: '16px' 
                }}>
                  Charge {index + 1} ({charge.isPositive ? '+' : '−'})
                </span>
                <button
                  onClick={() => removeCharge(charge.id)}
                  className="remove-btn"
                  style={{
                      padding: '5px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                    title="Remove charge"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
              </div>
              <div>
                <label style={{ fontSize: '14px', color: '#FFFFFFB3'}}>
                  Magnitude: {charge.magnitude.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={charge.magnitude}
                  onChange={(e) => updateChargeMagnitude(charge.id, parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    marginTop: '5px',
                    cursor: 'pointer',
                    accentColor: charge.isPositive ? '#990099' : '#009999',
                    height: '6px',
                    borderRadius: '3px' 
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Clear All Button */}
      </div>
    </div>
      <footer style={{
        padding: window.innerWidth < 768 ? '12px 15px' : '15px 20px',
        backgroundColor: '#1A1A1A',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
        textAlign: 'center',
        zIndex: 100,
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderTop: '2px solid #333'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: window.innerWidth < 768 ? '12px' : '14px',
            color: '#666'
          }}>
            © {new Date().getFullYear()} Electric Field Simulator
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            fontSize: window.innerWidth < 768 ? '12px' : '14px',
            color: '#666'
          }}>
          Built with React & TypeScript
          </span>
          <span style={{
            fontSize: window.innerWidth < 768 ? '12px' : '14px',
            color: '#666'
          }}>
            v1.0.0
          </span>
        </div>
      </footer>
  </div>
  </> 
);
};

export default ElectricFieldSimulation;
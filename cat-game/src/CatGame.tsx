import React, { useEffect, useRef, useState } from 'react';

const COLORS = {
  bg: 'url("https://c4.wallpaperflare.com/wallpaper/117/928/18/pixel-art-clouds-moon-reflection-dark-background-hd-wallpaper-preview.jpg")',
  bgSize: 'cover',
  bgPosition: 'center',
  bgRepeat: 'no-repeat',
  bgAttachment: 'fixed',
  platform: '#6A0DAD',      
  platformLight: '#9B30FF',  
  platformDark: '#4B0082',  
  platformAccent: '#E6E6FA', 
  platformBorder: '#483D8B',
  player: '#FFAA5A', 
  playerOutline: '#D97C3B',
  playerDetails: '#FFD5A2',
  boss: '#5E60CE',
  bossOutline: '#3A0CA3',
  bossDetails: '#B298DC',
  bossShip: '#8A6DEC',
  healthGreen: '#1DA849',   
  healthYellow: '#FFBD17',  
  healthRed:    '#EF483C',  
  projectile: '#FFD166',
  jumpBtn: '#43AA8B',
  dodgeBtn: '#F3722C',
  attackBtn: '#F94144',
  resetBtn: '#9D4EDD',
  text: '#F8F7FF',
  controlBox: '#22223B',
};

const BASE_GAME_WIDTH = 1500;
const BASE_GAME_HEIGHT = 600;

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 28;
const PLAYER_INIT_X = 60;
const PLAYER_INIT_Y = BASE_GAME_HEIGHT - 30;
const PLAYER_SPEED = 5;
const PLAYER_JUMP_VY = -12;
const PLAYER_GRAVITY = 0.5;
const PLAYER_MAX_HEALTH = 5;
const PLAYER_DODGE_TIME = 350; // ms
const PLAYER_DODGE_COOLDOWN = 1400; // ms

const BOSS_WIDTH = 44;
const BOSS_HEIGHT = 38;
const BOSS_INIT_X = BASE_GAME_WIDTH - 750;
const BOSS_INIT_Y = BASE_GAME_HEIGHT - 600;
const BOSS_MAX_HEALTH = 12;
const BOSS_ATTACK_INTERVAL = 900;

const PROJECTILE_SPEED = 3.3;
const PROJECTILE_SIZE = 12;
const PROJECTILE_DAMAGE = 1;

const ATTACK_RANGE = 38;
const ATTACK_DAMAGE = 1;
const ATTACK_COOLDOWN = 700; // ms

// Types
type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
};

type KeyState = {
  left: boolean;
  right: boolean;
  up: boolean;
  attack: boolean;
  dodge: boolean;
};

  const PLATFORMS = [
    {
      x: 0,
      y: BASE_GAME_HEIGHT - 36,
      width: BASE_GAME_WIDTH,
      height: 36,
    },
    {
      x: 300,
      y: BASE_GAME_HEIGHT - 150,
      width: 900,
      height: 20,
    },
    {
      x: 150,
      y: BASE_GAME_HEIGHT - 250,
      width: 200,
      height: 20,
    },
    {
      x: 500,
      y: BASE_GAME_HEIGHT - 250,
      width: 200,
      height: 20,
    },
        {
      x: 850,
      y: BASE_GAME_HEIGHT - 250,
      width: 200,
      height: 20,
    },
    {
      x: 1150,
      y: BASE_GAME_HEIGHT - 250,
      width: 200,
      height: 20,
    },
    {
      x: 320,
      y: BASE_GAME_HEIGHT - 350,
      width: 200,
      height: 20,
    },
    {
      x: 670,
      y: BASE_GAME_HEIGHT - 350,
      width: 200,
      height: 20,
    },
    {
      x: 990,
      y: BASE_GAME_HEIGHT - 350,
      width: 200,
      height: 20,
    },
    {
      x: 500,
      y: BASE_GAME_HEIGHT - 450,
      width: 200,
      height: 20,
    },
    {
      x: 840,
      y: BASE_GAME_HEIGHT - 450,
      width: 200,
      height: 20,
    }
  ];

const getHealthColor = (curr: number, max: number) => {
  const ratio = curr / max;
  if (ratio > 0.6) return COLORS.healthGreen;
  if (ratio > 0.3) return COLORS.healthYellow;
  return COLORS.healthRed;
};

export default function CatGame() {
  // Player State
  const [playerX, setPlayerX] = useState(PLAYER_INIT_X);
  const [playerY, setPlayerY] = useState(PLAYER_INIT_Y);
  const [playerVY, setPlayerVY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isDodging, setIsDodging] = useState(false);
  const [dodgeCooldown, setDodgeCooldown] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(PLAYER_MAX_HEALTH);
  const [attackCooldown, setAttackCooldown] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const bossAttackTimer = useRef(0); 
  const [isPaused, setIsPaused] = useState(false);
  const [pausedByControls, setPausedByControls] = useState(false);

  // Boss State
  const [bossHealth, setBossHealth] = useState(BOSS_MAX_HEALTH);

  // Projectiles
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // Game State
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Controls State
  const keyState = useRef<KeyState>({
    left: false,
    right: false,
    up: false,
    attack: false,
    dodge: false,
  });

  // Animation
  const requestRef = useRef<number>(0);

  // Used so multiple actions can't stack
  const isBusy = isAttacking || isDodging;

  // Functions
  const resetGame = () => {
    setPlayerX(PLAYER_INIT_X);
    setPlayerY(PLAYER_INIT_Y);
    setPlayerVY(0);
    setIsJumping(false);
    setIsDodging(false);
    setDodgeCooldown(false);
    setPlayerHealth(PLAYER_MAX_HEALTH);
    setAttackCooldown(false);
    setIsAttacking(false);
    setBossHealth(BOSS_MAX_HEALTH);
    setProjectiles([]);
    setGameOver(false);
    setVictory(false);
    setIsPaused(false); 
    keyState.current = { left: false, right: false, up: false, attack: false, dodge: false };
  };


  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1
  });

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 80; 
      const controlsHeight = 80; 
      const footerHeight = 60; 
      
      const maxAvailableHeight = window.innerHeight - headerHeight - controlsHeight - footerHeight - 20;
      const maxAvailableWidth = window.innerWidth - 40; 
      
      const scaleX = maxAvailableWidth / BASE_GAME_WIDTH;
      const scaleY = maxAvailableHeight / BASE_GAME_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      
      setDimensions({
        width: BASE_GAME_WIDTH * scale,
        height: BASE_GAME_HEIGHT * scale,
        scale
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scaleValue = (value: number) => value * dimensions.scale;
  const scaledPlatformY = dimensions.height - scaleValue(36);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showControls &&
        controlsRef.current &&
        !controlsRef.current.contains(event.target as Node)
      ) {
        const controlsButton = document.querySelector('[aria-label="Show/Hide Controls"]');
        if (controlsButton && !controlsButton.contains(event.target as Node)) {
          setShowControls(false);
          if (pausedByControls) {
            setIsPaused(false);
            setPausedByControls(false);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showControls, pausedByControls]);

  // Handle keyboard
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (gameOver || victory) return;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keyState.current.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keyState.current.right = true;
        break;
      case 'ArrowUp':
      case 'Space':
      case 'KeyW':
        keyState.current.up = true;
        break;
      case 'KeyJ': // Attack
        keyState.current.attack = true;
        break;
      case 'KeyK': // Dodge
        keyState.current.dodge = true;
        break;
      case 'KeyC': 
        if (!isPaused || pausedByControls) {
          const newShowControls = !showControls;
          setShowControls(newShowControls);
          
          if (newShowControls) {
            if (!isPaused) {
              setIsPaused(true);
              setPausedByControls(true);
            }
          } else {
            if (pausedByControls) {
              setIsPaused(false);
              setPausedByControls(false);
            }
          }
        }
        break;
      case 'KeyP':
        handlePause();
        break;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keyState.current.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keyState.current.right = false;
        break;
      case 'ArrowUp':
      case 'Space':
      case 'KeyW':
        keyState.current.up = false;
        break;
      case 'KeyJ':
        keyState.current.attack = false;
        break;
      case 'KeyK':
        keyState.current.dodge = false;
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
}, [gameOver, victory, isPaused, pausedByControls, showControls]);

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Main game loop: movement, collision, etc.
  useEffect(() => {
    if (gameOver || victory) return;

    let lastTime = performance.now();
    let accumulatedTime = 0;
    const frameRate = 1000/120; 

    const animate = (time: number) => {
      if (isPaused) {
        lastTime = time; 
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;
      accumulatedTime += deltaTime;

      while (accumulatedTime >= frameRate) {
        updateGame(frameRate);
        accumulatedTime -= frameRate;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const updateGame = (dt: number) => {
      let newPX = playerX;
      let newPY = playerY;
      let newVY = playerVY;
      let jumping = isJumping;

      // -- Player Movement --
      if (!isBusy) {
        if (keyState.current.left) {
          newPX = Math.max(0, newPX - PLAYER_SPEED);
        }
        if (keyState.current.right) {
          newPX = Math.min(BASE_GAME_WIDTH - PLAYER_WIDTH, newPX + PLAYER_SPEED);
        }
      }

      // -- Jumping --
      if (!isBusy && keyState.current.up && !jumping) {
        newVY = PLAYER_JUMP_VY;
        jumping = true;
      }
      newVY += PLAYER_GRAVITY;

      newPY += newVY;

      let landed = false;
      PLATFORMS.forEach(platform => {
        const platformTop = platform.y;
        const platformLeft = platform.x;
        const platformRight = platformLeft + platform.width;
        
        if (
          newVY > 0 && 
          newPY + PLAYER_HEIGHT >= platformTop && 
          playerY + PLAYER_HEIGHT <= platformTop && 
          newPX + PLAYER_WIDTH > platformLeft && 
          newPX < platformRight
        ) {
          newPY = platformTop - PLAYER_HEIGHT;
          newVY = 0;
          jumping = false;
          landed = true;
        }
      });

      if (newPY > PLATFORMS[0].y - PLAYER_HEIGHT && !landed) {
        newPY = PLATFORMS[0].y - PLAYER_HEIGHT;
        newVY = 0;
        jumping = false;
      }

      // -- Dodging --
      if (
        !isBusy &&
        keyState.current.dodge &&
        !dodgeCooldown &&
        !jumping
      ) {
        setIsDodging(true);
        setDodgeCooldown(true);
        setTimeout(() => setIsDodging(false), PLAYER_DODGE_TIME);
        setTimeout(() => setDodgeCooldown(false), PLAYER_DODGE_COOLDOWN);
        keyState.current.dodge = false;
      }

      // -- Attacking --
      if (
        !isBusy &&
        keyState.current.attack &&
        !attackCooldown
      ) {
        setIsAttacking(true);
        setAttackCooldown(true);
        setTimeout(() => setIsAttacking(false), 220);
        setTimeout(() => setAttackCooldown(false), ATTACK_COOLDOWN);

        // Attack range check
        const playerCenterX = newPX + PLAYER_WIDTH / 2;
        const bossCenterX = BOSS_INIT_X + BOSS_WIDTH / 2;
        const dx = Math.abs(playerCenterX - bossCenterX);
        const onSameLevel = Math.abs(newPY - BOSS_INIT_Y) < 26;
        if (
          dx < ATTACK_RANGE + BOSS_WIDTH / 2 &&
          onSameLevel &&
          bossHealth > 0
        ) {
          setBossHealth((hp) => Math.max(0, hp - ATTACK_DAMAGE));
        }
        keyState.current.attack = false;
      }

      // -- Update player state --
      setPlayerX(newPX);
      setPlayerY(newPY);
      setPlayerVY(newVY);
      setIsJumping(jumping);

      // -- Projectiles --
      setProjectiles((projs) =>
        projs
          .map((p) => ({
            ...p,
            x: p.x + p.vx, 
            y: p.y + p.vy,
            active: p.y < BASE_GAME_HEIGHT && p.y > 0 && 
                    p.x > 0 && p.x < BASE_GAME_WIDTH,  
          }))
          .filter((p) => p.active)
      );

      // -- Boss attacks (fires projectiles) --
      if (!isPaused) {
        bossAttackTimer.current += dt;  
        if (bossAttackTimer.current > BOSS_ATTACK_INTERVAL && bossHealth > 0) {
          bossAttackTimer.current = 0; 

          const projX = BOSS_INIT_X + BOSS_WIDTH / 2 - PROJECTILE_SIZE / 2;
          const projY = BOSS_INIT_Y + BOSS_HEIGHT - 4;

          const targetX = playerX + PLAYER_WIDTH / 2;
          const targetY = playerY + PLAYER_HEIGHT / 2;
          const dx = targetX - (BOSS_INIT_X + BOSS_WIDTH / 2);
          const dy = targetY - (BOSS_INIT_Y + BOSS_HEIGHT / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const vx = (dx / distance) * PROJECTILE_SPEED;
          const vy = (dy / distance) * PROJECTILE_SPEED;

          setProjectiles((prev) => [
            ...prev,
            { x: projX, y: projY, vx, vy, active: true },
          ]);
        }
      }

      // -- Projectile collision (player hit) --
      if (!isDodging && !gameOver && playerHealth > 0) {
        setProjectiles((projs) => {
          let playerHit = false;
          const playerRect = {
            left: newPX,
            right: newPX + PLAYER_WIDTH,
            top: newPY,
            bottom: newPY + PLAYER_HEIGHT,
          };
          const remaining = projs.filter((proj) => {
            const projRect = {
              left: proj.x,
              right: proj.x + PROJECTILE_SIZE,
              top: proj.y,
              bottom: proj.y + PROJECTILE_SIZE,
            };
            const collide =
              projRect.left < playerRect.right &&
              projRect.right > playerRect.left &&
              projRect.top < playerRect.bottom &&
              projRect.bottom > playerRect.top;
            if (collide) playerHit = true;
            return !collide;
          });
          if (playerHit) {
            setPlayerHealth((hp) => Math.max(0, hp - PROJECTILE_DAMAGE));
          }
          return remaining;
        });
      }

      // -- Boss defeat or player defeat --
      if (bossHealth <= 0) {
        setVictory(true);
        setTimeout(() => {
          setVictory(true);
        }, 200);
        return;
      }
      if (playerHealth <= 0) {
        setGameOver(true);
        setTimeout(() => {
          setGameOver(true);
        }, 200);
        return;
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [
    playerX,
    playerY,
    playerVY,
    playerHealth,
    bossHealth,
    isJumping,
    isDodging,
    isAttacking,
    attackCooldown,
    dodgeCooldown,
    gameOver,
    victory,
    isPaused, 
  ]);

  // Soft reset on win/lose
  useEffect(() => {
    if (gameOver || victory) {
      setTimeout(() => {
        // Stop all movement
        requestRef.current && cancelAnimationFrame(requestRef.current);
      }, 250);
    }
  }, [gameOver, victory]);

  // Action Button Handlers
  const handlePause = () => {
    setIsPaused(!isPaused);
    setPausedByControls(false); 
  };

  const handleJump = () => {
    if (!isJumping && !isBusy) {
      setPlayerVY(PLAYER_JUMP_VY);
      setIsJumping(true);
    }
  };
  const handleAttack = () => {
    if (!attackCooldown && !isBusy) {
      setIsAttacking(true);
      setAttackCooldown(true);
      setTimeout(() => setIsAttacking(false), 220);
      setTimeout(() => setAttackCooldown(false), ATTACK_COOLDOWN);

      // Attack range check
      const playerCenterX = playerX + PLAYER_WIDTH / 2;
      const bossCenterX = BOSS_INIT_X + BOSS_WIDTH / 2;
      const dx = Math.abs(playerCenterX - bossCenterX);
      const onSameLevel = Math.abs(playerY - BOSS_INIT_Y) < 26;
      if (
        dx < ATTACK_RANGE + BOSS_WIDTH / 2 &&
        onSameLevel &&
        bossHealth > 0
      ) {
        setBossHealth((hp) => Math.max(0, hp - ATTACK_DAMAGE));
      }
    }
  };
  const handleDodge = () => {
    if (!isDodging && !dodgeCooldown && !isJumping && !isBusy) {
      setIsDodging(true);
      setDodgeCooldown(true);
      setTimeout(() => setIsDodging(false), PLAYER_DODGE_TIME);
      setTimeout(() => setDodgeCooldown(false), PLAYER_DODGE_COOLDOWN);
    }
  };

  // Render UI bars
  const renderHealthBars = () => (
    <div style={{
      position: 'absolute',
      top: scaleValue(10),
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      padding: `0 ${scaleValue(20)}px`,
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      {/* Player Health Bar */}
      <div style={{
        position: 'relative',
        width: scaleValue(400),
        height: scaleValue(24),
        background: 'rgba(34, 34, 59, 0.7)',
        border: `${scaleValue(2)}px solid ${COLORS.platform}`,
        borderRadius: scaleValue(12),
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${(playerHealth / PLAYER_MAX_HEALTH) * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${getHealthColor(playerHealth, PLAYER_MAX_HEALTH)} 0%, 
            ${getHealthColor(playerHealth, PLAYER_MAX_HEALTH)} 70%, 
            rgba(255,255,255,0.3) 100%)`,
          transition: 'width 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: scaleValue(10)
        }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: scaleValue(12),
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap'
          }}>
            CAT {playerHealth}/{PLAYER_MAX_HEALTH}
          </span>
        </div>
        {playerHealth < PLAYER_MAX_HEALTH && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            animation: 'shine 2s infinite'
          }} />
        )}
      </div>

      {/* Boss Health Bar */}
      {bossHealth > 0 && (
        <div style={{
          position: 'relative',
          width: scaleValue(400),
          height: scaleValue(24),
          background: 'rgba(34, 34, 59, 0.7)',
          border: `${scaleValue(2)}px solid ${COLORS.platform}`,
          borderRadius: scaleValue(12),
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: `${(bossHealth / BOSS_MAX_HEALTH) * 100}%`,
            height: '100%',
            background: `linear-gradient(270deg, ${getHealthColor(bossHealth, BOSS_MAX_HEALTH)} 0%, 
              ${getHealthColor(bossHealth, BOSS_MAX_HEALTH)} 70%, 
              rgba(255,255,255,0.3) 100%)`,
            transition: 'width 0.3s cubic-bezier(0.65, 0, 0.35, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: scaleValue(10)
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: scaleValue(12),
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
              whiteSpace: 'nowrap'
            }}>
              BOSS {bossHealth}/{BOSS_MAX_HEALTH}
            </span>
          </div>
          {bossHealth < BOSS_MAX_HEALTH && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
              animation: 'shine 2s infinite'
            }} />
          )}
        </div>
      )}
    </div>
  );

  // Main Render
  return (
<div
  style={{
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundImage: COLORS.bg,
    backgroundSize: COLORS.bgSize,
    backgroundPosition: COLORS.bgPosition,
    backgroundRepeat: COLORS.bgRepeat,
    backgroundAttachment: COLORS.bgAttachment,
    overflow: 'hidden',
  }}
>
      {/* --- Header --- */}
    <header
      style={{
        width: '100%',
        padding: '15px 20px', 
        background: '#1a1a32',
        borderBottom: '3px solid #353965',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        flexShrink: 0,
        position: 'relative' 
      }}
    >
      <div style={{ width: '180px', visibility: 'hidden' }}></div>
      
      {/* Title */}
      <div style={{ 
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center'
      }}>
        <h1
          style={{
            margin: 0,
            color: COLORS.text,
            fontFamily: 'monospace',
            fontSize: '24px',
            letterSpacing: '2px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          Little Cat
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            color: '#B6B6FF',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          Defeat the alien boss with your cat skills!
        </p>
      </div>
      
      {/* buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        justifyContent: 'flex-end', 
        width: '100%',
        paddingRight: '10px'
      }}>
      <button
        style={{
          fontFamily: 'monospace',
          background: isPaused ? COLORS.healthGreen : COLORS.resetBtn,
          color: '#fff',
          border: `2px solid ${isPaused ? '#1a7d3d' : '#3f006d'}`,
          borderRadius: '7px',
          boxShadow: isPaused ? '0 2px #1a7d3d' : '0 2px #6500bd',
          fontSize: '13px',
          padding: '6px 12px',
          letterSpacing: '2px',
          cursor: 'pointer',
          outline: 'none',
          height: '32px',
          minWidth: '70px',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease'
        }}
        onClick={handlePause}
        aria-label={isPaused ? "Resume" : "Pause"}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
        <button
          style={{
            fontFamily: 'monospace',
            background: COLORS.resetBtn,
            color: '#fff',
            border: '2px solid #3f006d',
            borderRadius: '7px',
            boxShadow: '0 2px #6500bd',
            fontSize: '13px',
            padding: '6px 12px',
            letterSpacing: '2px',
            cursor: 'pointer',
            outline: 'none',
            height: '32px',
            minWidth: '70px',
            whiteSpace: 'nowrap'
          }}
          onClick={resetGame}
          aria-label="Reset"
        >
          Reset
        </button>
        <button
          style={{
            fontFamily: 'monospace',
            background: COLORS.resetBtn,
            color: COLORS.text,
            border: '2px solid #3f006d',
            borderRadius: '7px',
            boxShadow: '0 2px #353965',
            fontSize: '13px',
            padding: '6px 12px',
            letterSpacing: '2px',
            cursor: 'pointer',
            height: '32px',
            minWidth: '70px',
            whiteSpace: 'nowrap'
          }}
          tabIndex={0}
          onClick={() => {
            const newShowControls = !showControls;
            setShowControls(newShowControls);
            
            if (newShowControls) {
              if (!isPaused) {
                setIsPaused(true);
                setPausedByControls(true);
              }
            } else {
              if (pausedByControls) {
                setIsPaused(false);
                setPausedByControls(false);
              }
            }
          }}
          aria-label="Show/Hide Controls"
        >
          Controls
        </button>

        {showControls && (
          <div
            ref={controlsRef}
            style={{
              background: '#232547',
              color: COLORS.text,
              border: '1.2px solid #353965',
              fontSize: '16px',
              fontFamily: 'monospace',
              borderRadius: '10px',
              padding: '25px 30px',
              width: 'auto',
              minWidth: '300px',
              maxWidth: '90vw',
              textAlign: 'left',
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              boxShadow: '0 4px 30px rgba(15, 24, 73, 0.7)',
              lineHeight: '1.7',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#aaa',
              padding: '0 8px'
            }} onClick={() => {
              setShowControls(false);
              if (pausedByControls) {
                setIsPaused(false);
                setPausedByControls(false);
              }
            }}>
              x
            </div>
            <h3 style={{ 
              marginTop: 0,
              marginBottom: '20px',
              color: '#fff',
              textAlign: 'center',
              borderBottom: '1px solid #353965',
              paddingBottom: '12px',
              fontSize: '20px'
            }}>
              CONTROLS
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto auto', 
              gap: '12px 20px',
              fontSize: '16px'
            }}>
              <span><b>Movement:</b></span>
              <span>←/→ or <kbd>A</kbd>/<kbd>D</kbd></span>
              
              <span><b>Jump:</b></span>
              <span><kbd>↑</kbd>/<kbd>W</kbd>/<kbd>Space</kbd></span>
              
              <span><b>Attack:</b></span>
              <span><kbd>J</kbd></span>
              
              <span><b>Dodge:</b></span>
              <span><kbd>K</kbd></span>
              
              <span><b>Toggle Controls:</b></span>
              <span><kbd>C</kbd></span>
            </div>
          </div>
        )}
      </div>
    </header>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexGrow: 1,
          overflow: 'hidden',
        }}
      ></div>

        {/* --- Top Bar: Health --- */}
        <div
          style={{
            position: 'relative',
            width: dimensions.width,
            height: dimensions.height-750,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Barras de vida */}
          {renderHealthBars()}
        </div>
        {/* --- Main Game Window --- */}
            <div
              style={{
                position: 'relative',
                width: dimensions.width,
                height: dimensions.height,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: scaledPlatformY,
            width: '100%',
            height: scaleValue(36),
            backgroundColor: '#2a0010',
            zIndex: 1,
            imageRendering: 'pixelated' as any,
            border: `${scaleValue(2)}pxdd`,
            borderTop: `${scaleValue(4)}px rgba(255, 252, 252, 0.76)`,
            borderBottom: `${scaleValue(2)}px solid rgba(26, 26, 26, 0.5)`,
            borderLeft: `${scaleValue(2)}px solid rgba(90, 90, 90, 0.5)`,
            borderRight: `${scaleValue(2)}px solid rgba(90, 90, 90, 0.5)`,
            boxShadow: `
              0 0 0 ${scaleValue(1)}px rgba(210, 210, 210, 0.3),
              0 ${scaleValue(2)}px 0 ${scaleValue(1)}px rgba(145, 140, 140, 0.61),
              0 ${scaleValue(4)}px 0 ${scaleValue(1)}px rgba(0, 0, 0, 0.3)
            `,
            filter: 'contrast(1.2)',
            opacity: 1
          }}
        />
        {PLATFORMS.slice(1).map((platform, index) => {
          const baseColor = '#2a0010';
          const darkTone = '#3a001a';
          const lightTone = '#4a0025';
          const accentTone = '#5a0030';
          const highlight = 'rgba(255, 150, 150, 0.2)'; 

          return (
            <div
              key={`platform-${index}`}
              style={{
                position: 'absolute',
                left: scaleValue(platform.x),
                top: scaleValue(platform.y),
                width: scaleValue(platform.width),
                height: scaleValue(platform.height),
                backgroundColor: baseColor,
                zIndex: 1,
                imageRendering: 'pixelated' as any,
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    ${darkTone} 0px,
                    ${darkTone} ${scaleValue(2)}px,
                    ${baseColor} ${scaleValue(2)}px,
                    ${baseColor} ${scaleValue(4)}px,
                    ${lightTone} ${scaleValue(4)}px,
                    ${lightTone} ${scaleValue(6)}px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent 0px,
                    transparent ${scaleValue(6)}px,
                    ${highlight} ${scaleValue(6)}px,
                    ${highlight} ${scaleValue(7)}px,
                    transparent ${scaleValue(7)}px,
                    transparent ${scaleValue(12)}px
                  )
                `,
                backgroundSize: `${scaleValue(12)}px ${scaleValue(12)}px`,
                border: `${scaleValue(1)}px solid ${darkTone}`,
                borderTop: `${scaleValue(2)}px solid ${accentTone}`,
                borderBottom: `${scaleValue(1)}px solidrgb(255, 255, 255)`,
                borderLeft: `${scaleValue(1)}px solid ${darkTone}`,
                borderRight: `${scaleValue(1)}px solid ${darkTone}`,
                boxShadow: `
                  0 0 0 ${scaleValue(1)}px rgba(0, 0, 0, 0.6),
                  0 ${scaleValue(2)}px 0 ${scaleValue(1)}px rgba(20, 0, 10, 0.5),
                  
                  inset 0 0 ${scaleValue(15)}px rgba(255, 255, 255, 0.1),
                  inset 0 ${scaleValue(4)}px ${scaleValue(8)}px rgba(255, 255, 255, 0.15),
                  inset 0 -${scaleValue(2)}px ${scaleValue(4)}px rgb(255, 255, 255),
                  
                  /* Destello superior */
                  0 0 ${scaleValue(10)}px rgba(255, 255, 255, 0.07),
                  0 0 ${scaleValue(5)}px rgba(255, 200, 200, 0.1)
                `,
                filter: 'contrast(1.1) brightness(0.95)',
              }}
            />
          );
        })}
{/* Boss Spaceship - Enhanced */}
          
          {/* Engine Thrusters */}
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X - 18),
              top: scaleValue(BOSS_INIT_Y + BOSS_HEIGHT + 8),
              width: scaleValue(8),
              height: scaleValue(12),
              background: 'linear-gradient(180deg, #ff4444 0%, #ff8800 50%, #ffff00 100%)',
              borderRadius: `0 0 ${scaleValue(4)}px ${scaleValue(4)}px`,
              zIndex: 3,
              animation: 'engine-flicker 0.3s infinite alternate',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X + BOSS_WIDTH + 10),
              top: scaleValue(BOSS_INIT_Y + BOSS_HEIGHT + 8),
              width: scaleValue(8),
              height: scaleValue(12),
              background: 'linear-gradient(180deg, #ff4444 0%, #ff8800 50%, #ffff00 100%)',
              borderRadius: `0 0 ${scaleValue(4)}px ${scaleValue(4)}px`,
              zIndex: 3,
              animation: 'engine-flicker 0.3s infinite alternate',
            }}
          />

          {/* Weapon Cannons */}
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X - 8),
              top: scaleValue(BOSS_INIT_Y + 15),
              width: scaleValue(6),
              height: scaleValue(16),
              background: 'linear-gradient(180deg, #666699 0%, #4a4a80 100%)',
              border: `${scaleValue(2)}px solid #333366`,
              borderRadius: `${scaleValue(3)}px`,
              zIndex: 4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X + BOSS_WIDTH + 2),
              top: scaleValue(BOSS_INIT_Y + 15),
              width: scaleValue(6),
              height: scaleValue(16),
              background: 'linear-gradient(180deg, #666699 0%, #4a4a80 100%)',
              border: `${scaleValue(2)}px solid #333366`,
              borderRadius: `${scaleValue(3)}px`,
              zIndex: 4,
            }}
          />

          {/* Ship "body" - Enhanced */}
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X - 14),
              top: scaleValue(BOSS_INIT_Y + BOSS_HEIGHT - 6),
              width: scaleValue(BOSS_WIDTH + 28),
              height: scaleValue(22),
              background: `linear-gradient(180deg, ${COLORS.bossShip} 0%, #8c8cc5 50%, #6666aa 100%)`,
              border: `${scaleValue(3)}px solid #7c7cf1`,
              borderRadius: `${scaleValue(20)}px ${scaleValue(20)}px ${scaleValue(18)}px ${scaleValue(18)}px/${scaleValue(18)}px ${scaleValue(18)}px ${scaleValue(18)}px ${scaleValue(18)}px`,
              zIndex: 4,
              boxShadow: `0 ${scaleValue(4)}px 0 #404080, 0 ${scaleValue(7)}px 0 #31314e, inset 0 ${scaleValue(2)}px 4px rgba(255,255,255,0.2)`,
            }}
          />

          {/* Ship Details */}
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X - 6),
              top: scaleValue(BOSS_INIT_Y + BOSS_HEIGHT + 2),
              width: scaleValue(BOSS_WIDTH + 12),
              height: scaleValue(4),
              background: 'linear-gradient(90deg, #4444ff 0%, #6666ff 50%, #4444ff 100%)',
              borderRadius: `${scaleValue(2)}px`,
              zIndex: 5,
              opacity: 0.8,
            }}
          />

          {/* Power Core Glow */}
          {bossHealth > 0 && (
            <div
              style={{
                position: 'absolute',
                left: scaleValue(BOSS_INIT_X + 8),
                top: scaleValue(BOSS_INIT_Y + BOSS_HEIGHT - 2),
                width: scaleValue(28),
                height: scaleValue(8),
                background: 'radial-gradient(circle, #00ffff 0%, #0088ff 50%, transparent 100%)',
                borderRadius: '50%',
                zIndex: 3,
                animation: 'power-pulse 1.5s ease-in-out infinite',
                opacity: 0.6,
              }}
            />
          )}

          {/* Boss cat - Enhanced */}
          <div
            style={{
              position: 'absolute',
              left: scaleValue(BOSS_INIT_X),
              top: scaleValue(BOSS_INIT_Y),
              width: scaleValue(BOSS_WIDTH),
              height: scaleValue(BOSS_HEIGHT),
              zIndex: 5,
              filter: bossHealth > 0 ? undefined : 'grayscale(1) brightness(0.7)',
              transition: 'filter 0.3s',
            }}
          >
            {/* Cybernetic Enhancement - Left */}
            <div
              style={{
                position: 'absolute',
                left: 2,
                top: 8,
                width: 6,
                height: 12,
                background: 'linear-gradient(45deg, #cc0000 0%, #ff3333 50%, #cc0000 100%)',
                border: '2px solid #990000',
                borderRadius: 3,
                zIndex: 3,
              }}
            />
            {/* Cybernetic Enhancement - Right */}
            <div
              style={{
                position: 'absolute',
                left: 36,
                top: 8,
                width: 6,
                height: 12,
                background: 'linear-gradient(45deg, #cc0000 0%, #ff3333 50%, #cc0000 100%)',
                border: '2px solid #990000',
                borderRadius: 3,
                zIndex: 3,
              }}
            />

            {/* Boss Head - Enhanced */}
            <div
              style={{
                position: 'absolute',
                left: scaleValue(8),
                top: scaleValue(2),
                width: scaleValue(28),
                height: scaleValue(22),
                background: `linear-gradient(135deg, ${COLORS.boss} 0%, #8899cc 50%, ${COLORS.boss} 100%)`,
                border: `${scaleValue(3)}px solid ${COLORS.bossOutline}`,
                borderRadius: scaleValue(9),
                zIndex: 1,
                boxShadow: bossHealth > 0 
                  ? `0 0 ${scaleValue(8)}px #8ecaff99, inset 0 ${scaleValue(2)}px 4px rgba(255,255,255,0.3)` 
                  : '',
              }}
            />

            {/* Ears - Enhanced */}
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: -4,
                width: 7,
                height: 14,
                background: `linear-gradient(135deg, ${COLORS.boss} 0%, #7788bb 100%)`,
                border: `2px solid ${COLORS.bossOutline}`,
                borderRadius: '50% 40% 10% 10%',
                transform: 'rotate(-17deg)',
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 30,
                top: -4,
                width: 7,
                height: 14,
                background: `linear-gradient(135deg, ${COLORS.boss} 0%, #7788bb 100%)`,
                border: `2px solid ${COLORS.bossOutline}`,
                borderRadius: '40% 50% 10% 10%',
                transform: 'rotate(17deg)',
                zIndex: 2,
              }}
            />

            {/* Eyes - More menacing */}
            <div
              style={{
                position: 'absolute',
                left: 15,
                top: 11,
                width: 4,
                height: 6,
                background: bossHealth > 0 ? '#ff0033' : '#666',
                borderRadius: 2,
                border: '1.5px solid #990000',
                boxShadow: bossHealth > 0 ? '0 0 4px #ff0033' : '',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 25,
                top: 11,
                width: 4,
                height: 6,
                background: bossHealth > 0 ? '#ff0033' : '#666',
                borderRadius: 2,
                border: '1.5px solid #990000',
                boxShadow: bossHealth > 0 ? '0 0 4px #ff0033' : '',
              }}
            />

            {/* Alien mark - Enhanced */}
            <div
              style={{
                position: 'absolute',
                left: 19,
                top: 6,
                width: 6,
                height: 4,
                background: bossHealth > 0 
                  ? 'radial-gradient(circle, #ff00ff 0%, #cc00cc 70%, #990099 100%)'
                  : '#666',
                borderRadius: '50%',
                border: '1px solid #990099',
                boxShadow: bossHealth > 0 ? '0 0 6px #ff00ff' : '',
                animation: bossHealth > 0 ? 'alien-pulse 2s ease-in-out infinite' : '',
              }}
            />

            {/* Cybernetic Scars */}
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: 15,
                width: 8,
                height: 1,
                background: '#00ffff',
                borderRadius: 0.5,
                opacity: bossHealth > 0 ? 0.8 : 0.3,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 24,
                top: 17,
                width: 6,
                height: 1,
                background: '#00ffff',
                borderRadius: 0.5,
                opacity: bossHealth > 0 ? 0.8 : 0.3,
              }}
            />

            {/* Body - Enhanced */}
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: 20,
                width: 12,
                height: 13,
                background: `linear-gradient(135deg, ${COLORS.boss} 0%, #7788bb 50%, ${COLORS.boss} 100%)`,
                border: `2px solid ${COLORS.bossOutline}`,
                borderRadius: 7,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)',
              }}
            />

            {/* Armor Plating */}
            <div
              style={{
                position: 'absolute',
                left: 18,
                top: 22,
                width: 8,
                height: 9,
                background: 'linear-gradient(45deg, #333366 0%, #4444aa 50%, #333366 100%)',
                border: '1px solid #222255',
                borderRadius: 4,
                zIndex: 2,
              }}
            />

            {/* Power Indicators */}
            {bossHealth > 0 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: 25,
                    width: 2,
                    height: 2,
                    background: '#00ff00',
                    borderRadius: '50%',
                    animation: 'status-blink 1s infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 32,
                    top: 25,
                    width: 2,
                    height: 2,
                    background: '#ff9900',
                    borderRadius: '50%',
                    animation: 'status-blink 1.5s infinite',
                  }}
                />
              </>
            )}
          </div>
          {/* --- Projectiles --- */}
          {projectiles.map(
            (proj, i) =>
              proj.active && (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: scaleValue(proj.x),
                    top: scaleValue(proj.y),
                    width: scaleValue(PROJECTILE_SIZE),
                    height: scaleValue(PROJECTILE_SIZE),
                    background:
                      'repeating-linear-gradient(45deg,#fffbe8,#fffbe8 4px,#ffd166 4px,#ffd166 8px)',
                    border: `2px solid #a87a0d`,
                    borderRadius: 7,
                    boxShadow: '0 2px 6px #000a, 0 0 2px #fffd',
                    zIndex: 20,
                    imageRendering: 'pixelated',
                    animation: 'proj-spin 0.38s linear infinite',
                  }}
                />
              )
          )}
          {/* --- Player Cat --- */}
          <div
            style={{
              position: 'absolute',
              left: scaleValue(playerX),
              top: scaleValue(playerY),
              width: scaleValue(PLAYER_WIDTH),
              height: scaleValue(PLAYER_HEIGHT),
              zIndex: 10,
              filter:
                playerHealth <= 0
                  ? 'grayscale(1) brightness(0.7)'
                  : isDodging
                  ? 'brightness(1.8) drop-shadow(0 0 8px #37ffb5)'
                  : undefined,
              transition: 'filter 0.25s',
              opacity: isDodging ? 0.65 : 1,
              animation: isAttacking
                ? 'cat-attack-flash 0.22s'
                : undefined,
            }}
          >
            {/* Sword - Simplified and optimized */}
            <div
              style={{
                position: 'absolute',
                left: isAttacking ? 22 : -6,
                top: isAttacking ? 10 : 14,
                width: 16,
                height: 3,
                zIndex: isAttacking ? 15 : 0.5,
                transform: isAttacking ? 'rotate(20deg)' : 'rotate(-10deg)',
              }}
            >
              {/* Blade */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 12,
                  height: 3,
                  background: '#f0f0f0',
                  border: '1px solid #c0c0c0',
                  borderRadius: '0 2px 2px 0',
                }}
              />
              {/* Hilt */}
              <div
                style={{
                  position: 'absolute',
                  left: 11,
                  top: -1,
                  width: 4,
                  height: 5,
                  background: '#8B4513',
                  border: '1px solid #654321',
                  borderRadius: 2,
                }}
              />
            </div>

            {/* Head */}
            <div
              style={{
                position: 'absolute',
                left: 2,
                top: 2,
                width: 19,
                height: 14,
                background: COLORS.player,
                border: `3px solid ${COLORS.playerOutline}`,
                borderRadius: 7,
                zIndex: 2,
                boxShadow: isAttacking
                  ? '0 0 7px #ffeea2'
                  : '',
              }}
            />
            {/* Ears */}
            <div
              style={{
                position: 'absolute',
                left: -3,
                top: -4,
                width: 6,
                height: 12,
                background: COLORS.player,
                border: `2px solid ${COLORS.playerOutline}`,
                borderRadius: '60% 40% 10% 10%',
                transform: 'rotate(-13deg)',
                zIndex: 3,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 16,
                top: -5,
                width: 6,
                height: 12,
                background: COLORS.player,
                border: `2px solid ${COLORS.playerOutline}`,
                borderRadius: '40% 60% 10% 10%',
                transform: 'rotate(13deg)',
                zIndex: 3,
              }}
            />
            {/* Eyes */}
            <div
              style={{
                position: 'absolute',
                left: 7,
                top: 6,
                width: 3,
                height: 4,
                background: '#fff6e0',
                borderRadius: 2,
                border: '1px solid #b95c32',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 13,
                top: 6,
                width: 3,
                height: 4,
                background: '#fff6e0',
                borderRadius: 2,
                border: '1px solid #b95c32',
              }}
            />
            {/* Simple pupils */}
            <div
              style={{
                position: 'absolute',
                left: 8,
                top: 7,
                width: 1,
                height: 2,
                background: '#000',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 14,
                top: 7,
                width: 1,
                height: 2,
                background: '#000',
                borderRadius: 1,
              }}
            />
            {/* Nose */}
            <div
              style={{
                position: 'absolute',
                left: 10,
                top: 10,
                width: 3,
                height: 2,
                background: '#e76f51',
                borderRadius: 2,
              }}
            />
            {/* Simple scar */}
            <div
              style={{
                position: 'absolute',
                left: 6,
                top: 8,
                width: 4,
                height: 1,
                background: '#d4582a',
                borderRadius: 0.5,
                transform: 'rotate(-20deg)',
              }}
            />
            {/* Tail */}
            <div
              style={{
                position: 'absolute',
                left: 19,
                top: 17,
                width: 7,
                height: 15,
                background: '#f8c07d',
                border: `2px solid #e59b3a`,
                borderRadius: '15px 60px 8px 8px',
                transform: 'rotate(19deg)',
                zIndex: 0,
              }}
            />
            {/* Body */}
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 15,
                width: 14,
                height: 10,
                background: COLORS.player,
                border: `2px solid ${COLORS.playerOutline}`,
                borderRadius: 6,
                zIndex: 1,
                boxShadow: isDodging ? '0 0 7px #58ffc7' : '',
              }}
            />
            {/* Simple armor */}
            <div
              style={{
                position: 'absolute',
                left: 9,
                top: 18,
                width: 6,
                height: 4,
                background: '#8B4513',
                borderRadius: 2,
                zIndex: 1.5,
              }}
            />
            {/* Legs */}
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 26,
                width: 4,
                height: 4,
                background: '#f8c07d',
                border: `2px solid #e59b3a`,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 15,
                top: 26,
                width: 4,
                height: 4,
                background: '#f8c07d',
                border: `2px solid #e59b3a`,
                borderRadius: 4,
              }}
            />
            {isAttacking && (
              <div
                style={{
                  position: 'absolute',
                  left: -3,
                  top: -5,
                  width: 30,
                  height: 30,
                  border: '2px solid #ff6b35',
                  borderRadius: '50%',
                  zIndex: 0,
                  opacity: 0.5,
                }}
              />
            )}
          </div>
          {/* --- Overlay Messages --- */}
          {(gameOver || victory) && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                textAlign: 'center',
                zIndex: 100,
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  fontSize: scaleValue(68),
                  fontFamily: 'monospace',
                  color: '#ffffff',
                  letterSpacing: 4,
                  textShadow: `
                    0 0 10px rgba(255, 255, 255, 0.8),
                    0 0 20px rgba(255, 255, 255, 0.6),
                    0 4px 0 #111,
                    0 10px 20px #000
                  `,
                  fontWeight: 'bold',
                  marginBottom: scaleValue(20),
                }}
              >
                {gameOver ? 'GAME OVER' : 'VICTORY!'}
              </div>
              <div style={{ 
                fontSize: scaleValue(40), 
                color: '#f0f0f0',
                textShadow: `
                  0 0 8px rgba(255, 255, 255, 0.5),
                  0 2px 0 #111,
                  0 5px 10px #000
                `,
                letterSpacing: 2,
                marginBottom: scaleValue(30),
              }}>
                {gameOver ? 'Press Reset to try again!' : 'The alien boss is defeated!'}
              </div>
              <button
                style={{
                  fontFamily: 'monospace',
                  background: COLORS.resetBtn,
                  color: '#fff',
                  border: '2px solid #3f006d',
                  borderRadius: '7px',
                  boxShadow: '0 2px #6500bd',
                  fontSize: scaleValue(20),
                  padding: `${scaleValue(10)}px ${scaleValue(25)}px`,
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onClick={resetGame}
                aria-label="Reset Game"
              >
                Reset Game
              </button>
            </div>
          )}
          {/* --- 8-bit Animations --- */}
          <style>
            {`
            @keyframes cat-attack-flash {
              0% { filter: none;}
              70% { filter: brightness(2.3) drop-shadow(0 0 ${scaleValue(9)}px #fff);}
              100% { filter: none;}
            }
            @keyframes proj-spin {
              0% { transform: rotate(0deg);}
              100% { transform: rotate(360deg);}
            }
            @keyframes shine {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            `}
          </style>
        </div>
        {/* --- Controls and Actions --- */}
        <div
          style={{
            width: '100%',
            padding: '30px 0',
            background: COLORS.controlBox,
            borderTop: '3px solid #353965',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* --- Action Buttons --- */}
          <div style={{ display: 'flex', gap: scaleValue(13), flexWrap: 'wrap', justifyContent: 'center', transform: 'translateY(-15px)'}}>
            <button
              style={{
                fontFamily: 'monospace',
                background: COLORS.jumpBtn,
                color: '#fff',
                border: '2px solid #256d54',
                borderRadius: 7,
                boxShadow: '0 2px #1e6354',
                fontSize: scaleValue(17),
                padding: `${scaleValue(5)}px ${scaleValue(19)}px`,
                marginRight: 4,
                letterSpacing: 2,
                cursor: isBusy ? 'not-allowed' : 'pointer',
                filter: isJumping ? 'brightness(1.2)' : undefined,
                transition: 'filter 0.18s',
                outline: 'none',
                opacity: isJumping ? 0.81 : 1,
              }}
              disabled={isBusy}
              tabIndex={0}
              onClick={handleJump}
              aria-label="Jump"
            >
              Jump
            </button>
            <button
              style={{
                fontFamily: 'monospace',
                background: COLORS.dodgeBtn,
                color: '#fff',
                border: '2px solid #a1491d',
                borderRadius: 7,
                boxShadow: '0 2px #a1491d',
                fontSize: scaleValue(17),
                padding: `${scaleValue(5)}px ${scaleValue(19)}px`,
                marginRight: 4,
                letterSpacing: 2,
                cursor:
                  isDodging || dodgeCooldown || isJumping || isBusy
                    ? 'not-allowed'
                    : 'pointer',
                filter: isDodging ? 'brightness(1.3)' : undefined,
                transition: 'filter 0.18s',
                outline: 'none',
                opacity: isDodging ? 0.81 : 1,
              }}
              disabled={isDodging || dodgeCooldown || isJumping || isBusy}
              tabIndex={0}
              onClick={handleDodge}
              aria-label="Dodge"
            >
              Dodge
            </button>
            <button
              style={{
                fontFamily: 'monospace',
                background: COLORS.attackBtn,
                color: '#fff',
                border: '2px solid #b71d24',
                borderRadius: 7,
                boxShadow: '0 2px #a61e2b',
                fontSize: scaleValue(17),
                padding: `${scaleValue(5)}px ${scaleValue(19)}px`,
                letterSpacing: 2,
                cursor:
                  isAttacking || attackCooldown || isBusy
                    ? 'not-allowed'
                    : 'pointer',
                filter: isAttacking ? 'brightness(1.2)' : undefined,
                transition: 'filter 0.18s',
                outline: 'none',
                opacity: isAttacking ? 0.81 : 1,
              }}
              disabled={isAttacking || attackCooldown || isBusy}
              tabIndex={0}
              onClick={handleAttack}
              aria-label="Attack"
            >
              Attack
            </button>
        </div>
      <footer
        style={{
          width: '100%',
          padding: '12px 0',
          background: '#1a1a32',
          borderTop: '1px solidrgb(255, 255, 255)',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <p style={{ margin: 0, fontSize: '12px', color: '#ffffff' }}>© {new Date().getFullYear()} Cat Game</p>
      </footer>
    </div>
        </div>
  );
}
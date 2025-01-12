import React, { useEffect, useRef, useState } from 'react';
import { Shield, Star, Zap } from 'lucide-react';

const App = () => {
  const canvasRef = useRef(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [powerUps, setPowerUps] = useState([]);
  const [isShielded, setIsShielded] = useState(false);
  const [rapidFire, setRapidFire] = useState(false);
  
  // Constants
  const playerWidth = 60;
  const playerHeight = 40;
  const bulletWidth = 5;
  const bulletHeight = 10;
  const enemyWidth = 50;
  const enemyHeight = 30;
  const powerUpSize = 20;

  const [player, setPlayer] = useState({ 
    x: 225, 
    y: 450, 
    width: playerWidth, 
    height: playerHeight,
    speed: 5
  });
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);

  // Different enemy types with their properties
  const enemyTypes = {
    basic: { color: '#0f0', points: 10, health: 1, speed: 2 },
    fast: { color: '#ff0', points: 20, health: 1, speed: 4 },
    tank: { color: '#f00', points: 30, health: 3, speed: 1 }
  };

  // Power-up types
  const powerUpTypes = {
    shield: { color: '#00ffff', duration: 10000, symbol: '🛡️' },
    rapidFire: { color: '#ff00ff', duration: 5000, symbol: '⚡' },
    extraLife: { color: '#ff69b4', symbol: '❤️' }
  };

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const interval = setInterval(() => {
      if (!isGameOver) {
        updateGame(ctx);
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [isGameOver, player, bullets, enemies, powerUps, isShielded, rapidFire]);

  const updateGame = (ctx) => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawPlayer(ctx);
    drawBullets(ctx);
    drawEnemies(ctx);
    drawPowerUps(ctx);
    moveBullets();
    checkCollisions();
  };

  const drawPlayer = (ctx) => {
    ctx.fillStyle = isShielded ? '#00ffff' : '#00f';
    ctx.beginPath();
    ctx.moveTo(player.x + playerWidth / 2, player.y);
    ctx.lineTo(player.x, player.y + playerHeight);
    ctx.lineTo(player.x + playerWidth, player.y + playerHeight);
    ctx.closePath();
    ctx.fill();

    if (isShielded) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + playerWidth / 2, player.y + playerHeight / 2, 
              playerHeight, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawBullets = (ctx) => {
    ctx.fillStyle = rapidFire ? '#ff00ff' : '#f00';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  };

  const drawEnemies = (ctx) => {
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Draw health bar for tank enemies
      if (enemy.type === 'tank' && enemy.health > 1) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(enemy.x, enemy.y - 5, 
                    (enemy.width * enemy.health) / 3, 2);
      }
    });
  };

  const drawPowerUps = (ctx) => {
    powerUps.forEach(powerUp => {
      ctx.fillStyle = powerUpTypes[powerUp.type].color;
      ctx.fillText(
        powerUpTypes[powerUp.type].symbol,
        powerUp.x,
        powerUp.y,
        powerUpSize
      );
    });
  };

  const moveBullets = () => {
    setBullets(prevBullets =>
      prevBullets
        .map(bullet => ({ ...bullet, y: bullet.y - 7 }))
        .filter(bullet => bullet.y > 0)
    );
  };

  const checkCollisions = () => {
    // Check bullet-enemy collisions
    const updatedEnemies = enemies.filter(enemy => {
      const hit = bullets.some(bullet => {
        return (
          bullet.x < enemy.x + enemyWidth &&
          bullet.x + bulletWidth > enemy.x &&
          bullet.y < enemy.y + enemyHeight &&
          bullet.y + bulletHeight > enemy.y
        );
      });

      if (hit) {
        enemy.health--;
        if (enemy.health <= 0) {
          setScore(prev => prev + enemy.points);
          // Chance to spawn power-up
          if (Math.random() < 0.2) {
            spawnPowerUp(enemy.x, enemy.y);
          }
          return false;
        }
        return true;
      }
      return true;
    });

    // Check player-powerup collisions
    setPowerUps(prevPowerUps => 
      prevPowerUps.filter(powerUp => {
        const collected = (
          player.x < powerUp.x + powerUpSize &&
          player.x + playerWidth > powerUp.x &&
          player.y < powerUp.y + powerUpSize &&
          player.y + playerHeight > powerUp.y
        );

        if (collected) {
          activatePowerUp(powerUp.type);
          return false;
        }
        return true;
      })
    );

    setEnemies(updatedEnemies);

    // Check enemy-player collisions
    const playerHit = enemies.some(enemy => {
      return (
        enemy.y + enemyHeight >= player.y &&
        enemy.x + enemyWidth > player.x &&
        enemy.x < player.x + playerWidth
      );
    });

    if (playerHit && !isShielded) {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setIsGameOver(true);
        }
        return newLives;
      });
      setEnemies([]);
    }

    // Level progression
    if (enemies.length === 0) {
      setLevel(prev => prev + 1);
      createEnemies(level + 1);
    }
  };

  const spawnPowerUp = (x, y) => {
    const types = Object.keys(powerUpTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    setPowerUps(prev => [...prev, {
      type: randomType,
      x,
      y,
      width: powerUpSize,
      height: powerUpSize
    }]);
  };

  const activatePowerUp = (type) => {
    const powerUpEffects = {
      shield: () => {
        setIsShielded(true);
        setTimeout(() => setIsShielded(false), powerUpTypes.shield.duration);
      },
      rapidFire: () => {
        setRapidFire(true);
        setTimeout(() => setRapidFire(false), powerUpTypes.rapidFire.duration);
      },
      extraLife: () => {
        setLives(prev => Math.min(prev + 1, 5));
      }
    };
    if (powerUpEffects[type]) powerUpEffects[type]();
  };
  

  const movePlayer = (direction) => {
    if (direction === 'left' && player.x > 0) {
      setPlayer(prev => ({ ...prev, x: prev.x - prev.speed }));
    } else if (direction === 'right' && player.x + playerWidth < canvasRef.current.width) {
      setPlayer(prev => ({ ...prev, x: prev.x + prev.speed }));
    }
  };

  const shootBullet = () => {
    if (!isGameOver) {
      const newBullet = {
        x: player.x + playerWidth / 2 - bulletWidth / 2,
        y: player.y,
        width: bulletWidth,
        height: bulletHeight
      };
      setBullets(prev => [...prev, newBullet]);
  
      if (rapidFire) {
        const rapidBullets = [
          { ...newBullet, x: newBullet.x - 10 },
          { ...newBullet, x: newBullet.x + 10 }
        ];
        setBullets(prev => [...prev, ...rapidBullets]);
      }
    }
  };
  
  const createEnemies = (currentLevel) => {
    const newEnemies = [];
    const numEnemies = 3 + Math.floor(currentLevel / 2);
    
    for (let i = 0; i < numEnemies; i++) {
      const type = Math.random() < 0.2 ? 'tank' :
                  Math.random() < 0.4 ? 'fast' : 'basic';
      const enemyType = enemyTypes[type];
      
      newEnemies.push({
        x: i * (500 / numEnemies),
        y: Math.random() * 150,
        width: enemyWidth,
        height: enemyHeight,
        type,
        color: enemyType.color,
        points: enemyType.points,
        health: enemyType.health,
        speed: enemyType.speed
      });
    }
    setEnemies(newEnemies);
  };

  useEffect(() => {
    createEnemies(level);
    const enemyInterval = setInterval(() => {
      setEnemies(prev =>
        prev.map(enemy => ({
          ...enemy,
          y: enemy.y + enemy.speed,
          x: enemy.x + Math.sin(enemy.y / 30) * 2  // Wavy movement
        })).filter(enemy => enemy.y < canvasRef.current.height)
      );

      setPowerUps(prev =>
        prev.map(powerUp => ({
          ...powerUp,
          y: powerUp.y + 1
        })).filter(powerUp => powerUp.y < canvasRef.current.height)
      );
    }, 50);

    return () => clearInterval(enemyInterval);
  }, [level]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        movePlayer('left');
      } else if (e.key === 'ArrowRight') {
        movePlayer('right');
      } else if (e.key === ' ') {
        shootBullet();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, bullets, rapidFire]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-indigo-600 to-blue-800">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl text-white mb-6 font-bold">Space Attack</h1>
        <div className="flex gap-4 mb-4">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
            Level: {level}
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
            Score: {score}
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            Lives: {Array(lives).fill('❤️').join('')}
          </div>
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border-4 border-gray-300 shadow-xl bg-black"
          ></canvas>
          <div className="absolute top-2 right-2 flex gap-2">
            {isShielded && <Shield className="text-cyan-400" />}
            {rapidFire && <Zap className="text-fuchsia-400" />}
          </div>
        </div>
        {isGameOver ? (
          <div className="mt-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg">
            <p className="text-xl mb-4">Game Over! Final Score: {score}</p>
            <button
              onClick={() => {
                setIsGameOver(false);
                setScore(0);
                setLevel(1);
                setLives(3);
                setEnemies([]);
                setBullets([]);
                setPowerUps([]);
                setIsShielded(false);
                setRapidFire(false);
                setPlayer({ x: 225, y: 450, width: playerWidth, height: playerHeight, speed: 5 });
                createEnemies(1);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Restart
            </button>
          </div>
        ) : (
          <div className="mt-4 text-white text-lg">
            <p>Use arrow keys to move and spacebar to shoot!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
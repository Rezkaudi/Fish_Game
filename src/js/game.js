// Game Configuration
const CONFIG = {
  BUBBLE_SPAWN_RATE: 60,
  BUBBLE_SPEED: 2,
  PLAYER_SPEED: 15,
  LETTERS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  COMMON_WORDS: ['FISH', 'OCEAN', 'WATER', 'BLUE', 'SWIM', 'DEEP', 'WAVE', 'CORAL', 'SHELL', 'PEARL'],
  LEVEL_THRESHOLD: 50
};

// Game State
class GameState {
  constructor() {
    this.score = 0;
    this.lettersCollected = 0;
    this.level = 1;
    this.gameFrame = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isMuted = false;
    this.collectedWord = '';
    this.bubbleSpawnRate = CONFIG.BUBBLE_SPAWN_RATE;
  }

  updateLevel() {
    const newLevel = Math.floor(this.lettersCollected / CONFIG.LEVEL_THRESHOLD) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.bubbleSpawnRate = Math.max(30, CONFIG.BUBBLE_SPAWN_RATE - (this.level * 5));
      this.showLevelUp();
    }
  }

  showLevelUp() {
    // Create level up notification
    const notification = document.createElement('div');
    notification.className = 'level-notification';
    notification.innerHTML = `🎉 Level ${this.level}!`;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      color: #2c3e50;
      padding: 20px 40px;
      border-radius: 25px;
      font-size: 2rem;
      font-weight: bold;
      z-index: 1001;
      animation: levelPop 2s ease-out forwards;
      box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }
}

// Canvas and Context Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game state instance
const gameState = new GameState();

// Mouse/Touch Input
const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  click: false
};

function updateMousePosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = clientX - rect.left;
  mouse.y = clientY - rect.top;
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
  mouse.click = true;
  updateMousePosition(e.clientX, e.clientY);
});

canvas.addEventListener('mouseup', () => {
  mouse.click = false;
});

canvas.addEventListener('mousemove', (e) => {
  updateMousePosition(e.clientX, e.clientY);
});

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  mouse.click = true;
  updateMousePosition(touch.clientX, touch.clientY);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  mouse.click = false;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  updateMousePosition(touch.clientX, touch.clientY);
});

// Load Images
const playerLeft = new Image();
playerLeft.src = './assist/images/red_fish_swim_left.png';

const playerRight = new Image();
playerRight.src = './assist/images/red_fish_swim_right.png';

// Audio Setup
const bubblePop1 = new Audio('./assist/sounds/bubbles-single1.wav');
const bubblePop2 = new Audio('./assist/sounds/plop.ogg');

bubblePop1.volume = 0.3;
bubblePop2.volume = 0.3;

// Player Class
class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = 50;
    this.angle = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 498;
    this.spriteHeight = 327;
    this.scale = 0.25;
    this.trail = [];
  }

  update() {
    if (gameState.isPaused) return;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    
    this.angle = Math.atan2(dy, dx);
    
    // Smooth movement
    this.x += dx / CONFIG.PLAYER_SPEED;
    this.y += dy / CONFIG.PLAYER_SPEED;
    
    // Add trail effect
    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trail.length > 10) {
      this.trail.shift();
    }
    
    // Update trail alpha
    this.trail.forEach((point, index) => {
      point.alpha = index / this.trail.length * 0.3;
    });
  }

  draw() {
    // Draw trail
    this.trail.forEach((point, index) => {
      if (index > 0) {
        ctx.save();
        ctx.globalAlpha = point.alpha;
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.arc(point.x, point.y, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Draw player
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    const image = mouse.x >= this.x ? playerRight : playerLeft;
    
    ctx.drawImage(
      image,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      -this.spriteWidth * this.scale / 2,
      -this.spriteHeight * this.scale / 2,
      this.spriteWidth * this.scale,
      this.spriteHeight * this.scale
    );
    
    ctx.restore();

    // Draw collision circle for debugging (optional)
    if (false) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Bubble Class
class Bubble {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 50;
    this.radius = 25 + Math.random() * 15;
    this.speed = CONFIG.BUBBLE_SPEED + Math.random() * 2;
    this.letter = CONFIG.LETTERS[Math.floor(Math.random() * CONFIG.LETTERS.length)];
    this.color = this.getRandomColor();
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.02 + Math.random() * 0.02;
    this.scale = 0.8 + Math.random() * 0.4;
    this.alpha = 0.9;
    this.glowIntensity = 0.5 + Math.random() * 0.5;
  }

  getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    if (gameState.isPaused) return;

    this.y -= this.speed;
    this.x += Math.sin(this.bobOffset + gameState.gameFrame * this.bobSpeed) * 0.5;
    
    // Fade out near top
    if (this.y < 100) {
      this.alpha = Math.max(0, this.y / 100);
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // Draw glow effect
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 1.5
    );
    gradient.addColorStop(0, this.color + '40');
    gradient.addColorStop(0.7, this.color + '20');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bubble
    const bubbleGradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
      this.x, this.y, this.radius
    );
    bubbleGradient.addColorStop(0, this.color + 'CC');
    bubbleGradient.addColorStop(0.7, this.color + '99');
    bubbleGradient.addColorStop(1, this.color + '66');
    
    ctx.fillStyle = bubbleGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw letter
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${this.radius * 0.8}px 'Fredoka One', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeText(this.letter, this.x, this.y);
    ctx.fillText(this.letter, this.x, this.y);
    
    ctx.restore();
  }

  checkCollision(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + player.radius;
  }
}

// Particle System for Effects
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.life = 1;
    this.decay = 0.02;
    this.size = Math.random() * 6 + 2;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay;
    this.size *= 0.99;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Game Objects
const player = new Player();
let bubbles = [];
let particles = [];

// UI Update Functions
function updateUI() {
  document.getElementById('scoreDisplay').textContent = gameState.score;
  document.getElementById('lettersDisplay').textContent = gameState.lettersCollected;
  document.getElementById('levelDisplay').textContent = gameState.level;
  document.getElementById('collectedWord').textContent = gameState.collectedWord || 'Start collecting letters!';
}

// Bubble Management
function handleBubbles() {
  // Spawn new bubbles
  if (gameState.gameFrame % gameState.bubbleSpawnRate === 0) {
    bubbles.push(new Bubble());
  }

  // Update and draw bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    bubble.update();
    bubble.draw();

    // Remove bubbles that are off screen
    if (bubble.y < -bubble.radius || bubble.alpha <= 0) {
      bubbles.splice(i, 1);
      continue;
    }

    // Check collision with player
    if (bubble.checkCollision(player)) {
      // Create particles
      for (let j = 0; j < 8; j++) {
        particles.push(new Particle(bubble.x, bubble.y, bubble.color));
      }

      // Play sound
      if (!gameState.isMuted) {
        const sound = Math.random() > 0.5 ? bubblePop1 : bubblePop2;
        sound.currentTime = 0;
        sound.play().catch(() => {}); // Ignore audio errors
      }

      // Update game state
      gameState.score += 10 * gameState.level;
      gameState.lettersCollected++;
      gameState.collectedWord += bubble.letter;
      
      // Check for complete words
      checkForWords();
      
      // Update level
      gameState.updateLevel();

      // Remove bubble
      bubbles.splice(i, 1);
    }
  }
}

// Word checking system
function checkForWords() {
  const word = gameState.collectedWord.toUpperCase();
  for (const commonWord of CONFIG.COMMON_WORDS) {
    if (word.includes(commonWord)) {
      gameState.score += commonWord.length * 50;
      showWordBonus(commonWord);
      // Remove the found word from collected letters
      gameState.collectedWord = word.replace(commonWord, '');
      break;
    }
  }
}

function showWordBonus(word) {
  const bonus = document.createElement('div');
  bonus.className = 'word-bonus';
  bonus.innerHTML = `🎯 ${word} +${word.length * 50}!`;
  bonus.style.cssText = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    color: white;
    padding: 15px 30px;
    border-radius: 20px;
    font-size: 1.5rem;
    font-weight: bold;
    z-index: 1001;
    animation: wordBounce 3s ease-out forwards;
    box-shadow: 0 10px 30px rgba(46, 204, 113, 0.5);
  `;
  
  document.body.appendChild(bonus);
  setTimeout(() => bonus.remove(), 3000);
}

// Particle System
function handleParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.update();
    particle.draw();

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Game Controls
document.getElementById('pauseBtn').addEventListener('click', () => {
  gameState.isPaused = !gameState.isPaused;
  document.getElementById('pauseModal').classList.toggle('hidden', !gameState.isPaused);
  document.getElementById('pauseBtn').textContent = gameState.isPaused ? '▶️ Resume' : '⏸️ Pause';
});

document.getElementById('resumeBtn').addEventListener('click', () => {
  gameState.isPaused = false;
  document.getElementById('pauseModal').classList.add('hidden');
  document.getElementById('pauseBtn').textContent = '⏸️ Pause';
});

document.getElementById('muteBtn').addEventListener('click', () => {
  gameState.isMuted = !gameState.isMuted;
  document.getElementById('muteBtn').textContent = gameState.isMuted ? '🔇 Muted' : '🔊 Sound';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to restart the game?')) {
    resetGame();
  }
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
  resetGame();
  document.getElementById('gameOverModal').classList.add('hidden');
});

document.getElementById('shareBtn').addEventListener('click', () => {
  const text = `I just scored ${gameState.score} points in Ocean Letter Quest! 🐠 Can you beat my score?`;
  if (navigator.share) {
    navigator.share({ title: 'Ocean Letter Quest', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Score copied to clipboard!');
    });
  }
});

// Game Reset
function resetGame() {
  gameState.score = 0;
  gameState.lettersCollected = 0;
  gameState.level = 1;
  gameState.gameFrame = 0;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.collectedWord = '';
  gameState.bubbleSpawnRate = CONFIG.BUBBLE_SPAWN_RATE;
  
  bubbles = [];
  particles = [];
  
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  
  updateUI();
}

// Loading Screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.opacity = '0';
  loadingScreen.style.transition = 'opacity 0.5s ease-out';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 500);
}

// Main Game Loop
function animate() {
  if (!gameState.isPaused) {
    // Clear canvas with ocean gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#0077be');
    gradient.addColorStop(1, '#003d5c');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw game objects
    handleBubbles();
    handleParticles();
    
    player.update();
    player.draw();

    // Update UI
    updateUI();
    
    gameState.gameFrame++;
  }

  requestAnimationFrame(animate);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes levelPop {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1) translateY(-100px); opacity: 0; }
  }
  
  @keyframes wordBounce {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
    80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(0.8) translateY(-50px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize Game
window.addEventListener('load', () => {
  // Hide loading screen after a delay
  setTimeout(hideLoadingScreen, 3000);
  
  // Start game loop
  animate();
  
  // Initial UI update
  updateUI();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch(e.code) {
    case 'Space':
      e.preventDefault();
      document.getElementById('pauseBtn').click();
      break;
    case 'KeyM':
      document.getElementById('muteBtn').click();
      break;
    case 'KeyR':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        document.getElementById('resetBtn').click();
      }
      break;
  }
});

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
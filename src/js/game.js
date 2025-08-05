// Game Configuration
const CONFIG = {
  BUBBLE_SPAWN_RATE: 60,
  BUBBLE_SPEED: 2,
  PLAYER_SPEED: 12,
  LETTERS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  COMMON_WORDS: ['FISH', 'OCEAN', 'WATER', 'BLUE', 'SWIM', 'DEEP', 'WAVE', 'CORAL', 'SHELL', 'PEARL', 'STAR', 'GOLD', 'MAGIC'],
  LEVEL_THRESHOLD: 50,
  ANIMATION_SPEED: 8
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
    this.backgroundParticles = [];
    this.initBackgroundParticles();
  }

  initBackgroundParticles() {
    for (let i = 0; i < 50; i++) {
      this.backgroundParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.5 ? '#87ceeb' : '#b0e0e6'
      });
    }
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
    const notification = document.createElement('div');
    notification.className = 'level-notification';
    notification.innerHTML = `🌟 Level ${this.level}! 🌟`;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      color: #2c3e50;
      padding: 25px 50px;
      border-radius: 30px;
      font-size: 2.5rem;
      font-weight: bold;
      z-index: 1001;
      animation: levelPop 3s ease-out forwards;
      box-shadow: 0 15px 40px rgba(255, 215, 0, 0.6);
      border: 3px solid #fff;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

// Canvas and Context Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const gameState = new GameState();

// Enhanced Mouse/Touch Input
const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  click: false,
  trail: []
};

function updateMousePosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = clientX - rect.left;
  mouse.y = clientY - rect.top;
  
  // Add mouse trail
  mouse.trail.push({ x: mouse.x, y: mouse.y, alpha: 1 });
  if (mouse.trail.length > 15) {
    mouse.trail.shift();
  }
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

// Touch events
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

// Audio Setup
const bubblePop1 = new Audio('./assist/sounds/bubbles-single1.wav');
const bubblePop2 = new Audio('./assist/sounds/plop.ogg');

bubblePop1.volume = 0.4;
bubblePop2.volume = 0.4;

// Enhanced Player Class with Sprite Animation
class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.radius = 45;
    this.angle = 0;
    this.targetAngle = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 64;
    this.spriteHeight = 64;
    this.scale = 1.5;
    this.trail = [];
    this.animationFrame = 0;
    this.facingRight = true;
    this.speed = 0;
    this.maxSpeed = CONFIG.PLAYER_SPEED;
    this.acceleration = 0.3;
    this.friction = 0.85;
    this.vx = 0;
    this.vy = 0;
    this.bubbleEffect = [];
    this.glowIntensity = 0;
  }

  update() {
    if (gameState.isPaused) return;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Smooth angle rotation
    this.targetAngle = Math.atan2(dy, dx);
    const angleDiff = this.targetAngle - this.angle;
    this.angle += Math.sin(angleDiff) * 0.1;
    
    // Enhanced movement with acceleration
    if (distance > 5) {
      this.vx += (dx / distance) * this.acceleration;
      this.vy += (dy / distance) * this.acceleration;
    }
    
    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;
    
    // Limit speed
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (this.speed > this.maxSpeed) {
      this.vx = (this.vx / this.speed) * this.maxSpeed;
      this.vy = (this.vy / this.speed) * this.maxSpeed;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Determine facing direction
    this.facingRight = this.vx > 0;
    
    // Animate sprite based on speed
    if (this.speed > 1) {
      this.animationFrame += this.speed * 0.3;
      this.frameX = Math.floor(this.animationFrame / CONFIG.ANIMATION_SPEED) % 4;
    } else {
      this.frameX = 0;
    }
    
    // Add enhanced trail
    this.trail.push({ 
      x: this.x, 
      y: this.y, 
      alpha: 1,
      size: this.radius * 0.8,
      speed: this.speed
    });
    if (this.trail.length > 20) {
      this.trail.shift();
    }
    
    // Update trail alpha and size
    this.trail.forEach((point, index) => {
      point.alpha = (index / this.trail.length) * 0.4;
      point.size *= 0.95;
    });
    
    // Add bubble effect when moving fast
    if (this.speed > 5) {
      this.bubbleEffect.push({
        x: this.x + (Math.random() - 0.5) * 30,
        y: this.y + (Math.random() - 0.5) * 30,
        size: Math.random() * 8 + 3,
        life: 1,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
    
    // Update bubble effects
    for (let i = this.bubbleEffect.length - 1; i >= 0; i--) {
      const bubble = this.bubbleEffect[i];
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;
      bubble.life -= 0.02;
      bubble.size *= 0.98;
      
      if (bubble.life <= 0) {
        this.bubbleEffect.splice(i, 1);
      }
    }
    
    // Update glow effect
    this.glowIntensity = Math.sin(gameState.gameFrame * 0.1) * 0.3 + 0.7;
  }

  draw() {
    // Draw enhanced trail
    this.trail.forEach((point, index) => {
      if (index > 0) {
        ctx.save();
        ctx.globalAlpha = point.alpha;
        
        // Gradient trail
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, point.size
        );
        gradient.addColorStop(0, `rgba(135, 206, 235, ${point.alpha})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Draw bubble effects
    this.bubbleEffect.forEach(bubble => {
      ctx.save();
      ctx.globalAlpha = bubble.life * 0.6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw glow effect
    ctx.save();
    ctx.globalAlpha = this.glowIntensity * 0.3;
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius * 2
    );
    glowGradient.addColorStop(0, '#4ecdc4');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw fish sprite with enhanced effects
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Scale based on facing direction
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }
    
    // Draw fish body (procedural since we don't have sprite sheets)
    this.drawFishSprite();
    
    ctx.restore();

    // Draw collision circle for debugging
    if (false) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawFishSprite() {
    const animOffset = Math.sin(this.animationFrame * 0.3) * 5;
    
    // Fish body
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Fish body gradient
    const bodyGradient = ctx.createRadialGradient(-10, -10, 0, 0, 0, this.radius);
    bodyGradient.addColorStop(0, '#ff8e8e');
    bodyGradient.addColorStop(0.7, '#ff6b6b');
    bodyGradient.addColorStop(1, '#e55555');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Animated tail
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.moveTo(-this.radius, 0);
    ctx.lineTo(-this.radius * 1.5, -this.radius * 0.5 + animOffset);
    ctx.lineTo(-this.radius * 1.8, 0);
    ctx.lineTo(-this.radius * 1.5, this.radius * 0.5 + animOffset);
    ctx.closePath();
    ctx.fill();
    
    // Fins
    ctx.fillStyle = '#ff7979';
    ctx.beginPath();
    ctx.ellipse(-this.radius * 0.3, -this.radius * 0.8, this.radius * 0.3, this.radius * 0.2, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(-this.radius * 0.3, this.radius * 0.8, this.radius * 0.3, this.radius * 0.2, -Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(this.radius * 0.4, -this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.radius * 0.45, -this.radius * 0.25, this.radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Scales pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-this.radius * 0.2 + i * 15, 0, this.radius * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Enhanced Bubble Class
class Bubble {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 50;
    this.radius = 20 + Math.random() * 20;
    this.speed = CONFIG.BUBBLE_SPEED + Math.random() * 3;
    this.letter = CONFIG.LETTERS[Math.floor(Math.random() * CONFIG.LETTERS.length)];
    this.color = this.getRandomColor();
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.02 + Math.random() * 0.03;
    this.scale = 0.8 + Math.random() * 0.4;
    this.alpha = 0.9;
    this.glowIntensity = 0.5 + Math.random() * 0.5;
    this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    this.rotation = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.sparkles = [];
    this.initSparkles();
  }

  getRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
      '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  initSparkles() {
    for (let i = 0; i < 5; i++) {
      this.sparkles.push({
        x: (Math.random() - 0.5) * this.radius,
        y: (Math.random() - 0.5) * this.radius,
        size: Math.random() * 3 + 1,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.1 + 0.05
      });
    }
  }

  update() {
    if (gameState.isPaused) return;

    this.y -= this.speed;
    this.x += Math.sin(this.bobOffset + gameState.gameFrame * this.bobSpeed) * 1.5;
    this.rotation += this.rotationSpeed;
    
    // Pulse effect
    const pulse = Math.sin(gameState.gameFrame * 0.1 + this.pulsePhase) * 0.1 + 1;
    this.scale = (0.8 + Math.random() * 0.4) * pulse;
    
    // Update sparkles
    this.sparkles.forEach(sparkle => {
      sparkle.phase += sparkle.speed;
    });
    
    // Fade out near top
    if (this.y < 100) {
      this.alpha = Math.max(0, this.y / 100);
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    
    // Draw enhanced glow
    const glowSize = this.radius * 2.5;
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    glowGradient.addColorStop(0, this.color + '60');
    glowGradient.addColorStop(0.5, this.color + '30');
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bubble with enhanced gradient
    const bubbleGradient = ctx.createRadialGradient(
      -this.radius * 0.3, -this.radius * 0.3, 0,
      0, 0, this.radius
    );
    bubbleGradient.addColorStop(0, this.color + 'DD');
    bubbleGradient.addColorStop(0.4, this.color + 'BB');
    bubbleGradient.addColorStop(0.8, this.color + '99');
    bubbleGradient.addColorStop(1, this.color + '77');
    
    ctx.fillStyle = bubbleGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Enhanced highlight
    const highlightGradient = ctx.createRadialGradient(
      -this.radius * 0.4, -this.radius * 0.4, 0,
      -this.radius * 0.2, -this.radius * 0.2, this.radius * 0.6
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sparkles
    this.sparkles.forEach(sparkle => {
      const sparkleAlpha = Math.sin(sparkle.phase) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = sparkleAlpha * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Draw letter with enhanced styling
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${this.radius * 0.9}px 'Fredoka One', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.strokeText(this.letter, 0, 0);
    ctx.fillText(this.letter, 0, 0);
    
    ctx.restore();
  }

  checkCollision(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + player.radius;
  }
}

// Enhanced Particle System
class Particle {
  constructor(x, y, color, type = 'normal') {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = (Math.random() - 0.5) * 12;
    this.life = 1;
    this.decay = 0.015;
    this.size = Math.random() * 8 + 3;
    this.color = color;
    this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.gravity = type === 'bubble' ? -0.1 : 0.1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= this.decay;
    this.size *= 0.99;
    this.rotation += this.rotationSpeed;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    if (this.type === 'star') {
      this.drawStar();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawStar() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

// Game Objects
const player = new Player();
let bubbles = [];
let particles = [];

// UI Update Functions
function updateUI() {
  document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
  document.getElementById('lettersDisplay').textContent = gameState.lettersCollected;
  document.getElementById('levelDisplay').textContent = gameState.level;
  document.getElementById('collectedWord').textContent = gameState.collectedWord || 'Start collecting letters!';
}

// Enhanced Bubble Management
function handleBubbles() {
  if (gameState.gameFrame % gameState.bubbleSpawnRate === 0) {
    bubbles.push(new Bubble());
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bubble = bubbles[i];
    bubble.update();
    bubble.draw();

    if (bubble.y < -bubble.radius || bubble.alpha <= 0) {
      bubbles.splice(i, 1);
      continue;
    }

    if (bubble.checkCollision(player)) {
      // Create enhanced particles
      for (let j = 0; j < 12; j++) {
        const particleType = Math.random() > 0.7 ? 'star' : 'normal';
        particles.push(new Particle(bubble.x, bubble.y, bubble.color, particleType));
      }

      // Play sound
      if (!gameState.isMuted) {
        const sound = Math.random() > 0.5 ? bubblePop1 : bubblePop2;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }

      gameState.score += 10 * gameState.level;
      gameState.lettersCollected++;
      gameState.collectedWord += bubble.letter;
      
      checkForWords();
      gameState.updateLevel();

      bubbles.splice(i, 1);
    }
  }
}

// Enhanced word checking
function checkForWords() {
  const word = gameState.collectedWord.toUpperCase();
  for (const commonWord of CONFIG.COMMON_WORDS) {
    if (word.includes(commonWord)) {
      gameState.score += commonWord.length * 100;
      showWordBonus(commonWord);
      gameState.collectedWord = word.replace(commonWord, '');
      break;
    }
  }
}

function showWordBonus(word) {
  const bonus = document.createElement('div');
  bonus.className = 'word-bonus';
  bonus.innerHTML = `✨ ${word} +${word.length * 100}! ✨`;
  bonus.style.cssText = `
    position: fixed;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    color: white;
    padding: 20px 40px;
    border-radius: 25px;
    font-size: 2rem;
    font-weight: bold;
    z-index: 1001;
    animation: wordBounce 4s ease-out forwards;
    box-shadow: 0 15px 40px rgba(46, 204, 113, 0.6);
    border: 3px solid #fff;
  `;
  
  document.body.appendChild(bonus);
  setTimeout(() => bonus.remove(), 4000);
}

// Enhanced Particle System
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

// Background effects
function drawBackground() {
  // Animated ocean gradient
  const time = gameState.gameFrame * 0.01;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, `hsl(200, 70%, ${75 + Math.sin(time) * 5}%)`);
  gradient.addColorStop(0.5, `hsl(210, 80%, ${50 + Math.sin(time * 1.2) * 5}%)`);
  gradient.addColorStop(1, `hsl(220, 90%, ${25 + Math.sin(time * 0.8) * 3}%)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Animated background particles
  gameState.backgroundParticles.forEach(particle => {
    particle.y -= particle.speed;
    if (particle.y < -10) {
      particle.y = canvas.height + 10;
      particle.x = Math.random() * canvas.width;
    }
    
    ctx.save();
    ctx.globalAlpha = particle.opacity;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw mouse trail
  mouse.trail.forEach((point, index) => {
    if (index > 0) {
      ctx.save();
      ctx.globalAlpha = (index / mouse.trail.length) * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

// Game Controls (keeping existing functionality)
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
  const text = `I just scored ${gameState.score.toLocaleString()} points in Ocean Letter Quest! 🐠✨ Can you beat my score?`;
  if (navigator.share) {
    navigator.share({ title: 'Ocean Letter Quest', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Score copied to clipboard!');
    });
  }
});

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
  player.vx = 0;
  player.vy = 0;
  player.trail = [];
  player.bubbleEffect = [];
  
  updateUI();
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.opacity = '0';
  loadingScreen.style.transition = 'opacity 0.5s ease-out';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
  }, 500);
}

// Enhanced Main Game Loop
function animate() {
  if (!gameState.isPaused) {
    drawBackground();
    handleBubbles();
    handleParticles();
    
    player.update();
    player.draw();

    updateUI();
    gameState.gameFrame++;
  }

  requestAnimationFrame(animate);
}

// Enhanced CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes levelPop {
    0% { transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); opacity: 0; }
    15% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 1; }
    30% { transform: translate(-50%, -50%) scale(0.9) rotate(-2deg); opacity: 1; }
    45% { transform: translate(-50%, -50%) scale(1.1) rotate(1deg); opacity: 1; }
    60% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(0.8) translateY(-150px) rotate(0deg); opacity: 0; }
  }
  
  @keyframes wordBounce {
    0% { transform: translate(-50%, -50%) scale(0.3) rotate(-15deg); opacity: 0; }
    20% { transform: translate(-50%, -50%) scale(1.2) rotate(5deg); opacity: 1; }
    40% { transform: translate(-50%, -50%) scale(0.9) rotate(-2deg); opacity: 1; }
    60% { transform: translate(-50%, -50%) scale(1.05) rotate(1deg); opacity: 1; }
    80% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(0.7) translateY(-100px) rotate(0deg); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize Game
window.addEventListener('load', () => {
  setTimeout(hideLoadingScreen, 3000);
  animate();
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

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
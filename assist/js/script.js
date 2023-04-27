// Canvas Setup
const canvas = document.getElementById("main");
const ctx = canvas.getContext("2d");

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
let s = "";
let iii;
let solve = [];
let score = 0;
let gameFrame = 0;
const a = ["r", "r", "e", "z", "k", "k"];

ctx.font = "40px Georgia";

// Mouse Interactivity
let canvasPosition = canvas.getBoundingClientRect();

const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  click: false,
};

const updateMousePosition = (X, Y) => {
  mouse.x = X - canvasPosition.left;
  mouse.y = Y - canvasPosition.top;
};

canvas.addEventListener("mousedown", (ev) => {
  mouse.click = true;
  updateMousePosition(ev.x, ev.y);
});

canvas.addEventListener("mouseup", () => {
  mouse.click = false;
});

canvas.addEventListener("mousemove", (ev) => {
  mouse.click && updateMousePosition(ev.x, ev.y);
});

window.addEventListener(
  "resize",
  () => (canvasPosition = canvas.getBoundingClientRect())
);

const playerLeft = new Image();
playerLeft.src = "./assist/images/red_fish_swim_left.png";

const playerRight = new Image();
playerRight.src = "./assist/images/red_fish_swim_right.png";

// Player
class Player {
  constructor() {
    this.x = canvas.width;
    this.y = canvas.height;

    this.radius = 50;
    this.angle = 0;

    this.frameX = 0;
    this.frameY = 0;
    this.frame = 0;

    this.spriteWidth = 498;
    this.spriteHeight = 327;
  }

  update() {
    const distanceX = this.x - mouse.x;
    const distanceY = this.y - mouse.y;

    this.angle = Math.atan2(distanceY, distanceX);

    if (mouse.x !== this.x) {
      this.x -= distanceX / 15;
    }

    if (mouse.y !== this.y) {
      this.y -= distanceY / 15;
    }
  }

  draw() {
    if (mouse.click) {
      // ctx.lineWidth = 0;
      // ctx.beginPath();
      // ctx.moveTo(this.x, this.y);
      // ctx.lineTo(mouse.x, mouse.y);
      // ctx.stroke();
      // ctx.closePath();

    }

    ctx.fillStyle = "transparent";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle;
    ctx.closePath();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    this.x >= mouse.x ? this.drawFish(playerLeft) : this.drawFish(playerRight);

    ctx.restore();
  }

  drawFish(playerImage) {
    ctx.drawImage(
      playerImage,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      0 - 63,
      0 - 41,
      this.spriteWidth / 4,
      this.spriteHeight / 4
    );
  }
}

const player = new Player();

// Bubbles
let bubbles = [];

class Bubble {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + 100;
    //this.a=a;

    this.radius = 30;
    this.speeds = Math.floor(Math.random() * 5 + 1);
    this.distance;

    this.touched = false;
    this.sound = Math.random() <= 0.5 ? true : false;
  }

  update() {
    this.y -= 2;

    const distanceX = this.x - player.x;
    const distanceY = this.y - player.y;
    this.distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    //ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.font = "30px Arial";
    iii = a[this.speeds];
    solve.push(iii);
    ctx.fillText(iii, this.x, this.y);
    ctx.fill();
    ctx.closePath();
    ctx.stroke();
  }
}

const bubblePop1 = document.createElement("audio");
bubblePop1.src = "./assist/sounds/bubbles-single1.wav";

const bubblePop2 = document.createElement("audio");
bubblePop2.src = "./assist/sounds/plop.ogg";

const handleBubbles = () => {
  if (gameFrame % 50 === 0) {
    bubbles = [...bubbles, new Bubble()];
  }

  for (const B of bubbles) {
    B.update();
    B.draw();
  }

  // remove bubbles that reach the top in separate loop
  // this stops rest of the bubbles from blinking - not sure why
  for (const [i, B] of bubbles.entries()) {
    B.y < 0 - this.radius * 2 && bubbles.splice(i, 1);

    // collision detection
    if (B.distance < B.radius + player.radius && bubbles[i]) {
      !B.touched && B.sound && bubblePop1.play();
      !B.touched && !B.sound && bubblePop2.play();
      !B.touched && score++;
      B.touched = true;

      s += a[B.speeds] + " ";
      bubbles.splice(i, 1);
    }
  }
};

// Animation Loop
const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  handleBubbles();

  player.update();
  player.draw();

  ctx.fillStyle = "black";

  ctx.fillText(`score: ${s}`, 10, 40);
  gameFrame++;

  requestAnimationFrame(animate);
};

animate();

const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const colors = ['#00ffc8', '#00bfa6', '#004d4d'];
const maxDistance = 120;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = 2 + Math.random() * 2;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if(this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if(this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fill();
  }
}

function connectParticles() {
  for(let a=0; a<particlesArray.length; a++) {
    for(let b=a+1; b<particlesArray.length; b++) {
      let dx = particlesArray[a].x - particlesArray[b].x;
      let dy = particlesArray[a].y - particlesArray[b].y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < maxDistance) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 200, ${(maxDistance-dist)/maxDistance*0.4})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ffc8';
        ctx.shadowBlur = 8;
        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  particlesArray.forEach(p => {
    p.update();
    p.draw();
  });
  connectParticles();
  requestAnimationFrame(animateParticles);
}

function initParticles(num=60) {
  particlesArray = [];
  for(let i=0; i<num; i++) {
    particlesArray.push(new Particle());
  }
}

initParticles();
animateParticles();

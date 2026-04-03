import './style.css'

const canvas = document.querySelector('#bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let mouse = { x: -1000, y: -1000 };
let points = [];
const spacing = 40;
const radius = 150;
const lerpFactor = 0.1;

// Handle mouse move
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Handle window resize
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  initGrid();
}

// Initialise the grid
function initGrid() {
  points = [];
  
  // Calculate offset to perfectly center the grid
  const offsetX = (width % spacing) / 2;
  const offsetY = (height % spacing) / 2;
  
  const cols = Math.floor(width / spacing) + 1;
  const rows = Math.floor(height / spacing) + 1;
  
  // Start from -1 to pad the edges
  for (let r = -1; r <= rows; r++) {
    for (let c = -1; c <= cols; c++) {
      points.push({
        x: offsetX + c * spacing,
        y: offsetY + r * spacing,
        rotation: 0,
        opacity: 0.2, // Default greyed out
        glow: 0
      });
    }
  }
}

// Lerp helper
function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function drawCross(x, y, size, rotation, opacity, glow, colorRgb) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // Set glow
  if (glow > 0) {
    ctx.shadowBlur = glow;
    ctx.shadowColor = `rgba(${colorRgb}, ${opacity})`;
  } else {
    ctx.shadowBlur = 0;
  }
  
  ctx.strokeStyle = `rgba(${colorRgb}, ${opacity})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  
  // Vertical line
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(0, size / 2);
  
  // Horizontal line
  ctx.moveTo(-size / 2, 0);
  ctx.lineTo(size / 2, 0);
  
  ctx.stroke();
  ctx.restore();
}

function update() {
  ctx.clearRect(0, 0, width, height);
  const theme = document.documentElement.getAttribute('data-theme');
  const colorRgb = theme === 'light' ? '0, 0, 0' : '255, 255, 255';
  
  points.forEach(p => {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let targetRotation = 0;
    let targetOpacity = 0.2;
    let targetGlow = 0;
    
    if (dist < radius) {
      // Proximity interaction
      const factor = 1 - (dist / radius); // 1 at center, 0 at edge
      
      // Calculate angle towards mouse
      const angleToMouse = Math.atan2(dy, dx);
      
      // If we want it to literally "into an x symbol", it's 45deg (PI/4).
      // But user said "rotate in the direction in their axis towards the mouse pointer INTO an x symbol"
      // This implies the transformation to 'x' is linked to pointing at the mouse.
      // Let's combine: base rotation towards mouse + extra 45deg to make it look like 'x' relative to the vector.
      targetRotation = angleToMouse + (Math.PI / 4) * factor;
      
      targetOpacity = 0.2 + 0.8 * factor;
      targetGlow = 15 * factor;
    } else {
      targetRotation = 0;
      targetOpacity = 0.2;
      targetGlow = 0;
    }
    
    // Smooth transitions
    p.rotation = lerp(p.rotation, targetRotation, lerpFactor);
    p.opacity = lerp(p.opacity, targetOpacity, lerpFactor);
    p.glow = lerp(p.glow, targetGlow, lerpFactor);
    
    drawCross(p.x, p.y, 12, p.rotation, p.opacity, p.glow, colorRgb);
  });
  
  requestAnimationFrame(update);
}

// Start
window.addEventListener('resize', resize);
resize();
update();

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
  });
}

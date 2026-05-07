import './style.css'

const canvas = document.querySelector('#bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let mouse = { x: -1000, y: -1000 };
let points = [];
const spacing = 40;
const radius = 150;
const lerpFactor = 0.1;

// Detect touch device
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Auto-cursor state for mobile
let autoCursor = { x: 0, y: 0, time: 0 };

// Handle mouse move (desktop)
window.addEventListener('mousemove', (e) => {
  if (!isTouchDevice) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
});

// Handle touch move (mobile — direct interaction)
window.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  if (touch) {
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
  }
}, { passive: true });

// Reset to auto-cursor when touch ends
window.addEventListener('touchend', () => {
  mouse.x = autoCursor.x;
  mouse.y = autoCursor.y;
});

// Simulate autonomous cursor movement on mobile using Lissajous curves
function updateAutoCursor() {
  if (!isTouchDevice) return;

  autoCursor.time += 0.004; // Slow, dreamy drift
  const t = autoCursor.time;

  // Lissajous figure — creates a smooth, organic loop
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.35;
  const ry = height * 0.35;

  autoCursor.x = cx + Math.sin(t * 1.3) * rx;
  autoCursor.y = cy + Math.cos(t * 0.9) * ry;

  // Only apply if user isn't actively touching
  mouse.x = lerp(mouse.x, autoCursor.x, 0.02);
  mouse.y = lerp(mouse.y, autoCursor.y, 0.02);
}

// Handle window resize
function resize() {
  width = document.documentElement.clientWidth || window.innerWidth;
  height = document.documentElement.clientHeight || window.innerHeight;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  initGrid();
}

// Initialise the grid
function initGrid() {
  points = [];
  
  // Lock grid directly to origin so there's no shifting margins at the left/top edges
  const offsetX = 0;
  const offsetY = 0;
  
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math.ceil(height / spacing) + 2;
  
  // Start further back to ensure complete coverage at the screen edges
  for (let r = -2; r <= rows; r++) {
    for (let c = -2; c <= cols; c++) {
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
  updateAutoCursor();
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

// Smooth scroll for nav links
document.querySelectorAll('.nav-item[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Reveal on scroll
const revealTargets = document.querySelectorAll('section');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('section-visible');
    }
  });
}, { threshold: 0.1 });

revealTargets.forEach(section => {
  section.classList.add('section-hidden');
  revealObserver.observe(section);
});

// Auto-expand name on mobile when hero section is visible
if (isTouchDevice) {
  const heroSection = document.getElementById('home');
  const headerLeft = document.querySelector('.header-left');

  if (heroSection && headerLeft) {
    // Start expanded since hero is visible on load
    headerLeft.classList.add('name-expanded');

    const nameObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          headerLeft.classList.add('name-expanded');
        } else {
          headerLeft.classList.remove('name-expanded');
        }
      });
    }, { threshold: 0.3 });

    nameObserver.observe(heroSection);
  }
}

// Floating Project Preview Logic
const projectPreview = document.getElementById('project-preview');
const projectPreviewImg = projectPreview?.querySelector('.project-preview-image');
const projectCards = document.querySelectorAll('.project-card[data-images]');

if (projectPreview && projectPreviewImg && !isTouchDevice) {
  let isHovering = false;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let previewInterval;
  let currentImageIndex = 0;
  
  // Smooth tracking using lerp
  function updatePreviewPosition() {
    if (!isHovering) return;
    
    currentX = lerp(currentX, targetX, 0.15);
    currentY = lerp(currentY, targetY, 0.15);
    
    projectPreview.style.left = `${currentX}px`;
    projectPreview.style.top = `${currentY}px`;
    
    requestAnimationFrame(updatePreviewPosition);
  }

  projectCards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      const imgData = card.getAttribute('data-images');
      if (imgData) {
        const images = imgData.split(',');
        currentImageIndex = 0;
        projectPreviewImg.src = images[currentImageIndex];
        projectPreview.classList.add('active');
        
        // Instantly set position on initial enter to avoid flying in from corner
        targetX = e.clientX;
        targetY = e.clientY;
        if (!isHovering) {
          currentX = targetX;
          currentY = targetY;
          projectPreview.style.left = `${currentX}px`;
          projectPreview.style.top = `${currentY}px`;
        }
        
        if (images.length > 1) {
          previewInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            projectPreviewImg.src = images[currentImageIndex];
          }, 1500); // Cycle every 1.5s
        }
        
        isHovering = true;
        requestAnimationFrame(updatePreviewPosition);
      }
    });

    card.addEventListener('mousemove', (e) => {
      // Add slight offset so it doesn't block the cursor
      targetX = e.clientX + 20; 
      targetY = e.clientY + 20;
    });

    card.addEventListener('mouseleave', () => {
      projectPreview.classList.remove('active');
      isHovering = false;
      if (previewInterval) {
        clearInterval(previewInterval);
        previewInterval = null;
      }
    });
  });
}

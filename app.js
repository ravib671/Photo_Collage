const folderInput = document.getElementById('folderInput');
const layoutSelect = document.getElementById('layoutSelect');
const sizeSelect = document.getElementById('sizeSelect');
const titleInput = document.getElementById('titleInput');
const effectSelect = document.getElementById('effectSelect');
const createBtn = document.getElementById('createBtn');
const thumbGrid = document.getElementById('thumbGrid');
const statusEl = document.getElementById('status');
const canvas = document.getElementById('collageCanvas');
const ctx = canvas.getContext('2d');
const downloadLink = document.getElementById('downloadLink');

let loadedImages = [];

const layouts = {
  mosaic4: {
    label: 'Mosaic 2x2',
    slots: [
      [0.00, 0.00, 0.50, 0.50], [0.50, 0.00, 0.50, 0.50],
      [0.00, 0.50, 0.50, 0.50], [0.50, 0.50, 0.50, 0.50],
    ],
  },
  stripe3: {
    label: 'Vertical Stripe 3',
    slots: [[0.00, 0.00, 0.33, 1.0], [0.33, 0.00, 0.34, 1.0], [0.67, 0.00, 0.33, 1.0]],
  },
  stripe4h: {
    label: 'Horizontal Stripe 4',
    slots: [[0.00, 0.00, 1.0, 0.25], [0.00, 0.25, 1.0, 0.25], [0.00, 0.50, 1.0, 0.25], [0.00, 0.75, 1.0, 0.25]],
  },
  hero4: {
    label: 'Hero + 3 Tiles',
    slots: [[0.00, 0.00, 0.65, 1.0], [0.65, 0.00, 0.35, 0.34], [0.65, 0.34, 0.35, 0.33], [0.65, 0.67, 0.35, 0.33]],
  },
  centerfocus5: {
    label: 'Center Focus 5',
    slots: [[0.00, 0.00, 0.25, 0.25], [0.75, 0.00, 0.25, 0.25], [0.00, 0.75, 0.25, 0.25], [0.75, 0.75, 0.25, 0.25], [0.20, 0.20, 0.60, 0.60]],
  },
  roundedMiddle5: {
    label: 'Rounded Middle 5',
    slots: [
      [0.00, 0.00, 0.30, 0.35], [0.70, 0.00, 0.30, 0.35],
      [0.00, 0.65, 0.30, 0.35], [0.70, 0.65, 0.30, 0.35],
      { x: 0.22, y: 0.22, width: 0.56, height: 0.56, shape: 'round' },
    ],
  },
  film6: {
    label: 'Film Strip 6',
    slots: [[0.00, 0.00, 0.5, 0.33], [0.50, 0.00, 0.5, 0.33], [0.00, 0.33, 0.5, 0.34], [0.50, 0.33, 0.5, 0.34], [0.00, 0.67, 0.5, 0.33], [0.50, 0.67, 0.5, 0.33]],
  },
  asym7: {
    label: 'Asymmetric 7',
    slots: [[0.00, 0.00, 0.4, 0.5], [0.40, 0.00, 0.6, 0.25], [0.40, 0.25, 0.3, 0.25], [0.70, 0.25, 0.3, 0.25], [0.00, 0.50, 0.3, 0.5], [0.30, 0.50, 0.4, 0.5], [0.70, 0.50, 0.3, 0.5]],
  },
  wall8: {
    label: 'Photo Wall 8',
    slots: [[0.00, 0.00, 0.25, 0.5], [0.25, 0.00, 0.25, 0.25], [0.50, 0.00, 0.25, 0.5], [0.75, 0.00, 0.25, 0.25], [0.25, 0.25, 0.25, 0.25], [0.75, 0.25, 0.25, 0.25], [0.00, 0.50, 0.5, 0.5], [0.50, 0.50, 0.5, 0.5]],
  },
  grid9: {
    label: 'Grid 3x3 (9)',
    slots: Array.from({ length: 9 }, (_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      return [col / 3, row / 3, 1 / 3, 1 / 3];
    }),
  },
  banner10: {
    label: 'Banner Mix 10',
    slots: [[0.00, 0.00, 1.0, 0.2], [0.00, 0.20, 0.2, 0.4], [0.20, 0.20, 0.3, 0.4], [0.50, 0.20, 0.3, 0.4], [0.80, 0.20, 0.2, 0.4], [0.00, 0.60, 0.25, 0.4], [0.25, 0.60, 0.25, 0.4], [0.50, 0.60, 0.2, 0.4], [0.70, 0.60, 0.15, 0.4], [0.85, 0.60, 0.15, 0.4]],
  },
};

Object.entries(layouts).forEach(([value, { label }]) => {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  layoutSelect.appendChild(option);
});

folderInput.addEventListener('change', async (event) => {
  const files = [...event.target.files].filter((file) => file.type.startsWith('image/'));
  if (!files.length) {
    loadedImages = [];
    thumbGrid.innerHTML = '';
    setStatus('No images found in selected folder.');
    return;
  }

  setStatus(`Loading ${files.length} image(s)...`);
  loadedImages = await Promise.all(files.map(loadImageFromFile));
  renderThumbnails(loadedImages);
  setStatus(`Loaded ${loadedImages.length} image(s). Choose a style and click Create Collage.`);
});

createBtn.addEventListener('click', () => {
  if (!loadedImages.length) {
    setStatus('Please choose an image folder first.');
    return;
  }

  const layout = layouts[layoutSelect.value];
  const [w, h] = sizeSelect.value.split('x').map(Number);
  const effect = effectSelect.value;
  const title = titleInput.value.trim();

  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(2, Math.round(Math.min(w, h) * 0.005));
  drawLayout(layout, loadedImages, gap, effect);

  applySelectedEffect(effect);

  if (title) {
    drawCollageTitle(title);
  }

  downloadLink.href = canvas.toDataURL('image/png');
  setStatus(`Created collage: ${layout.label} + ${effectSelect.options[effectSelect.selectedIndex].text}${title ? ' + title' : ''}.`);
});

function applySelectedEffect(effect) {
  switch (effect) {
    case 'mosaic':
      applyMosaicEffect();
      break;
    case 'landscape':
      applyLandscapeEffect();
      break;
    case 'vivid':
      applyVividEffect();
      break;
    case 'vintage':
      applyVintageEffect();
      break;
    case 'softGlow':
      applySoftGlowEffect();
      break;
    case 'vignette':
      applyVignetteEffect();
      break;
    default:
      break;
  }
}

function drawCollageTitle(title) {
  const barHeight = Math.max(58, Math.round(canvas.height * 0.09));
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

  const fontSize = Math.max(24, Math.round(canvas.width * 0.038));
  ctx.font = `700 ${fontSize}px Inter, Segoe UI, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxLength = 45;
  const safeTitle = title.length > maxLength ? `${title.slice(0, maxLength - 1)}…` : title;
  ctx.fillText(safeTitle, canvas.width / 2, canvas.height - barHeight / 2);
  ctx.restore();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function renderThumbnails(images) {
  thumbGrid.innerHTML = '';
  images.forEach(({ src }, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Selected photo ${index + 1}`;
    thumbGrid.appendChild(img);
  });
}

function normalizeSlot(slot) {
  if (Array.isArray(slot)) {
    const [x, y, width, height] = slot;
    return { x, y, width, height, shape: 'rect' };
  }

  return {
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    shape: slot.shape || 'rect',
  };
}

function drawLayout(layout, images, gap, effect) {
  layout.slots.forEach((slotInput, idx) => {
    const slot = normalizeSlot(slotInput);
    const px = Math.round(canvas.width * slot.x) + gap;
    const py = Math.round(canvas.height * slot.y) + gap;
    const pw = Math.round(canvas.width * slot.width) - gap * 2;
    const ph = Math.round(canvas.height * slot.height) - gap * 2;

    const img = images[idx % images.length].img;
    const tiltAngle = effect === 'tilted' ? ((idx % 2 === 0 ? 1 : -1) * (3 + (idx % 3))) : 0;
    const shadow3d = effect === 'shadow3d';
    drawFrame(img, px, py, pw, ph, { shape: slot.shape, tiltAngle, shadow3d });
  });
}

function drawFrame(img, x, y, width, height, options) {
  const { shape, tiltAngle, shadow3d } = options;
  ctx.save();

  if (tiltAngle) {
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((tiltAngle * Math.PI) / 180);
    x = -width / 2;
    y = -height / 2;
  }

  if (shadow3d) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;
  }

  if (shape === 'round') {
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  drawCover(img, x, y, width, height);

  if (shape === 'round') {
    ctx.lineWidth = Math.max(3, Math.round(Math.min(width, height) * 0.015));
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (shadow3d) {
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    if (shape === 'round') {
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, width, height);
    }
  }

  ctx.restore();
}

function drawCover(img, x, y, width, height) {
  const imgRatio = img.width / img.height;
  const targetRatio = width / height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}

function applyMosaicEffect() {
  const scale = Math.max(0.06, Math.min(0.12, 80 / Math.min(canvas.width, canvas.height)));
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = Math.max(1, Math.floor(canvas.width * scale));
  tempCanvas.height = Math.max(1, Math.floor(canvas.height * scale));

  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function applyLandscapeEffect() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * 1.08 + 8);
    data[i + 1] = Math.min(255, data[i + 1] * 1.06 + 4);
    data[i + 2] = Math.max(0, data[i + 2] * 0.95);
  }

  ctx.putImageData(imageData, 0, 0);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(110, 170, 255, 0.12)');
  gradient.addColorStop(1, 'rgba(255, 187, 130, 0.12)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function applyVividEffect() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = Math.min(255, avg + (data[i] - avg) * 1.35 + 10);
    data[i + 1] = Math.min(255, avg + (data[i + 1] - avg) * 1.35 + 6);
    data[i + 2] = Math.min(255, avg + (data[i + 2] - avg) * 1.35 + 12);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyVintageEffect() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(255, r * 0.95 + g * 0.35 + b * 0.1 + 10);
    data[i + 1] = Math.min(255, r * 0.2 + g * 0.85 + b * 0.08 + 4);
    data[i + 2] = Math.min(255, r * 0.12 + g * 0.25 + b * 0.62);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applySoftGlowEffect() {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = canvas.width;
  glowCanvas.height = canvas.height;
  const glowCtx = glowCanvas.getContext('2d');

  glowCtx.filter = 'blur(12px) saturate(1.2)';
  glowCtx.globalAlpha = 0.45;
  glowCtx.drawImage(canvas, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(glowCanvas, 0, 0);
  ctx.restore();
}

function applyVignetteEffect() {
  const radial = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) * 0.2,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.75,
  );

  radial.addColorStop(0, 'rgba(0, 0, 0, 0)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0.45)');

  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => resolve({ img, src, name: file.name });
    img.onerror = () => reject(new Error(`Could not load ${file.name}`));
    img.src = src;
  });
}

const folderInput = document.getElementById('folderInput');
const layoutSelect = document.getElementById('layoutSelect');
const sizeSelect = document.getElementById('sizeSelect');
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
    slots: [
      [0.00, 0.00, 0.33, 1.0], [0.33, 0.00, 0.34, 1.0], [0.67, 0.00, 0.33, 1.0],
    ],
  },
  stripe4h: {
    label: 'Horizontal Stripe 4',
    slots: [
      [0.00, 0.00, 1.0, 0.25], [0.00, 0.25, 1.0, 0.25], [0.00, 0.50, 1.0, 0.25], [0.00, 0.75, 1.0, 0.25],
    ],
  },
  hero4: {
    label: 'Hero + 3 Tiles',
    slots: [
      [0.00, 0.00, 0.65, 1.0], [0.65, 0.00, 0.35, 0.34], [0.65, 0.34, 0.35, 0.33], [0.65, 0.67, 0.35, 0.33],
    ],
  },
  centerfocus5: {
    label: 'Center Focus 5',
    slots: [
      [0.00, 0.00, 0.25, 0.25], [0.75, 0.00, 0.25, 0.25], [0.00, 0.75, 0.25, 0.25], [0.75, 0.75, 0.25, 0.25],
      [0.20, 0.20, 0.60, 0.60],
    ],
  },
  film6: {
    label: 'Film Strip 6',
    slots: [
      [0.00, 0.00, 0.5, 0.33], [0.50, 0.00, 0.5, 0.33], [0.00, 0.33, 0.5, 0.34],
      [0.50, 0.33, 0.5, 0.34], [0.00, 0.67, 0.5, 0.33], [0.50, 0.67, 0.5, 0.33],
    ],
  },
  asym7: {
    label: 'Asymmetric 7',
    slots: [
      [0.00, 0.00, 0.4, 0.5], [0.40, 0.00, 0.6, 0.25], [0.40, 0.25, 0.3, 0.25], [0.70, 0.25, 0.3, 0.25],
      [0.00, 0.50, 0.3, 0.5], [0.30, 0.50, 0.4, 0.5], [0.70, 0.50, 0.3, 0.5],
    ],
  },
  wall8: {
    label: 'Photo Wall 8',
    slots: [
      [0.00, 0.00, 0.25, 0.5], [0.25, 0.00, 0.25, 0.25], [0.50, 0.00, 0.25, 0.5], [0.75, 0.00, 0.25, 0.25],
      [0.25, 0.25, 0.25, 0.25], [0.75, 0.25, 0.25, 0.25], [0.00, 0.50, 0.5, 0.5], [0.50, 0.50, 0.5, 0.5],
    ],
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
    slots: [
      [0.00, 0.00, 1.0, 0.2], [0.00, 0.20, 0.2, 0.4], [0.20, 0.20, 0.3, 0.4], [0.50, 0.20, 0.3, 0.4], [0.80, 0.20, 0.2, 0.4],
      [0.00, 0.60, 0.25, 0.4], [0.25, 0.60, 0.25, 0.4], [0.50, 0.60, 0.2, 0.4], [0.70, 0.60, 0.15, 0.4], [0.85, 0.60, 0.15, 0.4],
    ],
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

  const layoutKey = layoutSelect.value;
  const layout = layouts[layoutKey];
  const [w, h] = sizeSelect.value.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(2, Math.round(Math.min(w, h) * 0.005));
  drawLayout(layout, loadedImages, gap);

  downloadLink.href = canvas.toDataURL('image/png');
  setStatus(`Created collage using "${layout.label}" with ${layout.slots.length} frame(s).`);
});

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

function drawLayout(layout, images, gap) {
  layout.slots.forEach((slot, idx) => {
    const [x, y, width, height] = slot;
    const px = Math.round(canvas.width * x) + gap;
    const py = Math.round(canvas.height * y) + gap;
    const pw = Math.round(canvas.width * width) - gap * 2;
    const ph = Math.round(canvas.height * height) - gap * 2;

    const img = images[idx % images.length].img;
    drawCover(img, px, py, pw, ph);
  });
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

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => resolve({ img, src, name: file.name });
    img.onerror = () => reject(new Error(`Could not load ${file.name}`));
    img.src = src;
  });
}

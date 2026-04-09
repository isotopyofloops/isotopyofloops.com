// Animated trefoil knot — isotopy
// A trefoil that continuously deforms without breaking.
// Color palette drawn from Sara White's artwork.

(function() {
  const canvas = document.getElementById('knot-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Responsive sizing
  let W, H, scale;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W, H) * 0.28;
  }
  resize();
  window.addEventListener('resize', resize);

  // Trefoil knot parametric equations with time-varying deformation
  // Standard trefoil: x = sin(t) + 2sin(2t), y = cos(t) - 2cos(2t), z = -sin(3t)
  function trefoil(t, time) {
    // Slowly vary the coefficients for continuous deformation (isotopy)
    const a1 = 1.0 + 0.15 * Math.sin(time * 0.3);
    const a2 = 2.0 + 0.25 * Math.sin(time * 0.2 + 1.0);
    const a3 = 1.0 + 0.2 * Math.sin(time * 0.25 + 2.0);

    const x = a1 * Math.sin(t) + a2 * Math.sin(2 * t);
    const y = a1 * Math.cos(t) - a2 * Math.cos(2 * t);
    const z = -a3 * Math.sin(3 * t);
    return { x, y, z };
  }

  // Rotate point around Y axis (slow tumble)
  function rotateY(p, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: p.x * cos + p.z * sin,
      y: p.y,
      z: -p.x * sin + p.z * cos
    };
  }

  // Rotate point around X axis
  function rotateX(p, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: p.x,
      y: p.y * cos - p.z * sin,
      z: p.y * sin + p.z * cos
    };
  }

  // Sara's palette: deep blues, violet, iridescent highlights
  function knotColor(z, t, time) {
    // z ranges roughly -1.5 to 1.5, normalize
    const zn = (z + 1.5) / 3.0;

    // Base: deep blue
    const r = Math.floor(8 + 25 * zn + 12 * Math.sin(t * 3 + time * 0.5));
    const g = Math.floor(10 + 30 * zn + 15 * Math.sin(t * 2 + time * 0.3 + 1.0));
    const b = Math.floor(80 + 120 * zn + 30 * Math.sin(t * 4 + time * 0.4));

    return `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
  }

  // Glow color for the bright highlights
  function glowColor(z) {
    const zn = (z + 1.5) / 3.0;
    const b = Math.floor(140 + 115 * zn);
    const g = Math.floor(20 + 60 * zn);
    return `rgba(${Math.floor(15 + 30 * zn)}, ${g}, ${b}, ${0.3 + 0.3 * zn})`;
  }

  const SEGMENTS = 360;
  let startTime = null;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const time = (timestamp - startTime) / 1000; // seconds

    ctx.clearRect(0, 0, W, H);

    // Build all points with depth info
    const points = [];
    const step = (2 * Math.PI) / SEGMENTS;
    const rotY = time * 0.12; // slow tumble
    const rotXAngle = 0.35 + 0.15 * Math.sin(time * 0.15); // gentle tilt oscillation

    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i * step;
      let p = trefoil(t, time);
      p = rotateY(p, rotY);
      p = rotateX(p, rotXAngle);

      // Simple perspective projection
      const perspective = 6;
      const pScale = perspective / (perspective + p.z);
      const sx = W / 2 + p.x * scale * pScale;
      const sy = H / 2 + p.y * scale * pScale;

      points.push({ sx, sy, z: p.z, t, pScale });
    }

    // Sort by depth (draw far points first) for proper overlap
    const indices = [];
    for (let i = 0; i < SEGMENTS; i++) indices.push(i);
    indices.sort((a, b) => points[a].z - points[b].z);

    // Draw the knot as thick line segments, depth-sorted
    for (const i of indices) {
      const p0 = points[i];
      const p1 = points[i + 1];
      if (!p1) continue;

      // Line width varies with depth (closer = thicker)
      const avgZ = (p0.z + p1.z) / 2;
      const avgScale = (p0.pScale + p1.pScale) / 2;
      const baseWidth = 2.5 + 3.5 * avgScale;

      // Outer glow
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.strokeStyle = glowColor(avgZ);
      ctx.lineWidth = baseWidth + 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Main stroke
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.strokeStyle = knotColor(avgZ, p0.t, time);
      ctx.lineWidth = baseWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner bright core (iridescent highlight)
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      const coreAlpha = 0.15 + 0.25 * ((avgZ + 1.5) / 3.0);
      ctx.strokeStyle = `rgba(120, 150, 255, ${coreAlpha})`;
      ctx.lineWidth = baseWidth * 0.3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();

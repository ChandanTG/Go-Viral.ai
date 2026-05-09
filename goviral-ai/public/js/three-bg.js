// public/js/three-bg.js – Interactive Three.js particle field background

(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // ─── Particle Field ────────────────────────────────────────
  const PARTICLE_COUNT = 1800;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);
  const sizes     = new Float32Array(PARTICLE_COUNT);
  const velocities = [];

  const palette = [
    new THREE.Color('#a855f7'),
    new THREE.Color('#3b82f6'),
    new THREE.Color('#10b981'),
    new THREE.Color('#f59e0b'),
    new THREE.Color('#ec4899'),
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    // Sphere distribution
    const r = 3 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    positions[i3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    sizes[i] = Math.random() * 2 + 0.5;

    velocities.push({
      x: (Math.random() - 0.5) * 0.003,
      y: (Math.random() - 0.5) * 0.003,
      z: (Math.random() - 0.5) * 0.003,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ─── Glowing Core Sphere ───────────────────────────────────
  const coreGeo = new THREE.SphereGeometry(0.4, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.06,
    wireframe: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Wireframe overlay
  const wireGeo = new THREE.SphereGeometry(0.42, 16, 16);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  // ─── Connection Lines ──────────────────────────────────────
  const lineCount = 120;
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
  });
  const linesGroup = new THREE.Group();
  for (let i = 0; i < lineCount; i++) {
    const p1 = Math.floor(Math.random() * PARTICLE_COUNT);
    const p2 = Math.floor(Math.random() * PARTICLE_COUNT);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(positions[p1 * 3], positions[p1 * 3 + 1], positions[p1 * 3 + 2]),
      new THREE.Vector3(positions[p2 * 3], positions[p2 * 3 + 1], positions[p2 * 3 + 2]),
    ]);
    linesGroup.add(new THREE.Line(lineGeo, lineMat));
  }
  scene.add(linesGroup);

  // ─── Mouse Interaction ─────────────────────────────────────
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.5;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.5;
  });

  // ─── Animation Loop ────────────────────────────────────────
  let frame = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    frame++;

    // Smooth camera mouse follow
    target.x += (mouse.x - target.x) * 0.05;
    target.y += (mouse.y - target.y) * 0.05;
    camera.position.x = target.x * 2;
    camera.position.y = -target.y * 2;
    camera.lookAt(scene.position);

    // Rotate particle cloud
    particles.rotation.y = t * 0.04;
    particles.rotation.x = Math.sin(t * 0.02) * 0.1;

    // Drift particles
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3]     += velocities[i].x;
      pos[i3 + 1] += velocities[i].y;
      pos[i3 + 2] += velocities[i].z;

      // Bounce back
      const dist = Math.sqrt(pos[i3]**2 + pos[i3+1]**2 + pos[i3+2]**2);
      if (dist > 7.5 || dist < 2.5) {
        velocities[i].x *= -1;
        velocities[i].y *= -1;
        velocities[i].z *= -1;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // Core pulse
    const pulse = 1 + Math.sin(t * 2) * 0.05;
    core.scale.set(pulse, pulse, pulse);
    wire.rotation.y = t * 0.3;
    wire.rotation.z = t * 0.1;
    linesGroup.rotation.y = t * 0.04;

    // Breathing opacity
    material.opacity = 0.5 + Math.sin(t * 0.5) * 0.15;

    renderer.render(scene, camera);
  }

  animate();

  // ─── Resize Handler ────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

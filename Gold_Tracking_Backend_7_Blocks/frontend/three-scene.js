/**
 * GoldTrace 3D Interactive WebGL Engine
 * Built with Three.js
 * Renders an interactive 3D Gold Ingot, 7-Stage Orbital Constellation,
 * holographic energy beams, and shimmering gold dust particles.
 */

class Gold3DScene {
  constructor(canvasContainerId, onStageSelect) {
    this.container = document.getElementById(canvasContainerId);
    this.onStageSelect = onStageSelect;
    this.currentMode = 'all'; // 'ingot', 'stages', 'all'
    this.autoRotate = true;
    this.activeStageIndex = 0;
    this.stageNodes = [];
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.tooltip = null;
    
    if (!this.container || typeof THREE === 'undefined') {
      console.warn("Three.js or container not available");
      return;
    }
    
    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 450;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 4.5, 12);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // World Group
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // Ingot
    this.createGoldIngot();

    // Stage Constellation (7 Stages)
    this.createStageConstellation();

    // Floating Gold Dust Particle Field
    this.createDustParticles();

    // Grid Base & Pedestal Glow
    this.createPedestal();

    // Tooltip Element
    this.createTooltipElement();

    // Event Listeners
    this.setupEventListeners();

    // Start Animation Loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Warm Key Light (Luxury Gold Highlight)
    const keyLight = new THREE.DirectionalLight(0xffecc4, 2.8);
    keyLight.position.set(6, 9, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    // Golden Rim / Backlight
    const rimLight = new THREE.DirectionalLight(0xd4af37, 2.2);
    rimLight.position.set(-7, 6, -6);
    this.scene.add(rimLight);

    // Fill Light (Subtle Cyan-Slate Contrast)
    const fillLight = new THREE.DirectionalLight(0x7ca1d9, 0.8);
    fillLight.position.set(0, -4, 5);
    this.scene.add(fillLight);

    // Ambient Warm Light
    const ambientLight = new THREE.AmbientLight(0x221805, 1.2);
    this.scene.add(ambientLight);

    // Point Light hovering right above the gold bar
    this.ingotGlow = new THREE.PointLight(0xffdf73, 2.5, 10);
    this.ingotGlow.position.set(0, 2, 0);
    this.scene.add(this.ingotGlow);
  }

  createGoldIngot() {
    this.ingotGroup = new THREE.Group();

    // Trapezoidal beveled gold bullion geometry
    const lengthTop = 4.2, widthTop = 1.8;
    const lengthBottom = 4.8, widthBottom = 2.4;
    const height = 1.2;

    // Build custom trapezoidal prism
    const shape = new THREE.Shape();
    // 2D outline for extrusion with bevel
    const geom = new THREE.BoxGeometry(4.4, 1.15, 2.1, 4, 4, 4);
    
    // Taper the top vertices to form authentic bullion trapezoid
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      if (y > 0) {
        pos.setX(i, pos.getX(i) * 0.88);
        pos.setZ(i, pos.getZ(i) * 0.82);
      }
    }
    geom.computeVertexNormals();

    // High luxury gold PBR material
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5ba2a,
      emissive: 0x3d2700,
      emissiveIntensity: 0.15,
      metalness: 0.94,
      roughness: 0.18,
      envMapIntensity: 2.2,
      flatShading: false
    });

    this.ingotMesh = new THREE.Mesh(geom, this.goldMaterial);
    this.ingotMesh.castShadow = true;
    this.ingotMesh.receiveShadow = true;
    this.ingotGroup.add(this.ingotMesh);

    // Engraved Gold Stamp Plate on Top
    const stampCanvas = document.createElement('canvas');
    stampCanvas.width = 1024;
    stampCanvas.height = 512;
    const ctx = stampCanvas.getContext('2d');
    
    // Background gold texture
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#f2bf38');
    grad.addColorStop(0.5, '#e0a31b');
    grad.addColorStop(1, '#b57907');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Engraving lines & stamps
    ctx.strokeStyle = '#6a4502';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 964, 452);
    ctx.strokeRect(45, 45, 934, 422);

    ctx.fillStyle = '#472d00';
    ctx.font = 'bold 44px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('• GOLDTRACE IMMUTABLE •', 512, 115);

    ctx.font = 'bold 80px "Cinzel", Georgia, serif';
    ctx.fillText('999.9', 512, 215);

    ctx.font = '600 36px "Outfit", sans-serif';
    ctx.fillText('FINE GOLD • 1000g NET', 512, 280);

    ctx.font = '400 28px "JetBrains Mono", monospace';
    ctx.fillStyle = '#6a4502';
    ctx.fillText('BATCH REF: GOLD-2026-001 • BIS CERTIFIED', 512, 360);

    ctx.beginPath();
    ctx.arc(512, 420, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2400';
    ctx.fill();

    const stampTexture = new THREE.CanvasTexture(stampCanvas);
    stampTexture.anisotropy = 8;

    const stampGeom = new THREE.PlaneGeometry(3.6, 1.45);
    const stampMat = new THREE.MeshStandardMaterial({
      map: stampTexture,
      roughness: 0.32,
      metalness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const stampMesh = new THREE.Mesh(stampGeom, stampMat);
    stampMesh.rotation.x = -Math.PI / 2;
    stampMesh.position.y = 0.585;
    this.ingotGroup.add(stampMesh);

    // Outer subtle gold aura ring
    const auraGeom = new THREE.TorusGeometry(3.8, 0.025, 16, 100);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.35 });
    this.auraMesh = new THREE.Mesh(auraGeom, auraMat);
    this.auraMesh.rotation.x = Math.PI / 2;
    this.auraMesh.position.y = -0.5;
    this.ingotGroup.add(this.auraMesh);

    this.worldGroup.add(this.ingotGroup);
  }

  createStageConstellation() {
    this.stagesGroup = new THREE.Group();
    this.stageNodes = [];

    const stageData = [
      { id: 0, name: "Mining", color: 0xe6a817, icon: "⛏", desc: "Quarry extraction & raw ore logging" },
      { id: 1, name: "Transport", color: 0x3b82f6, icon: "🚚", desc: "GPS transit & chain-of-custody" },
      { id: 2, name: "Refining", color: 0xf59e0b, icon: "⚗", desc: "Smelting & 99.50% purity assay" },
      { id: 3, name: "Hallmarking", color: 0x10b981, icon: "🛡", desc: "BIS official hallmark certificate" },
      { id: 4, name: "Melting", color: 0xec4899, icon: "🔥", desc: "Agency ingot melting & mass check" },
      { id: 5, name: "Manufacturing", color: 0x8b5cf6, icon: "💎", desc: "Jewelry craft & mass balance validation" },
      { id: 6, name: "Final HUID", color: 0x14b8a6, icon: "📜", desc: "Consumer HUID & immutable proof" }
    ];

    const radius = 5.2;
    const stageCount = stageData.length;

    // Curve points to draw glowing energy circuit between nodes
    const curvePoints = [];

    for (let i = 0; i < stageCount; i++) {
      const angle = (i / stageCount) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(i * 1.2) * 0.6; // gentle sine wave height

      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(x, y, z);

      // Core sphere
      const sphereGeom = new THREE.SphereGeometry(0.38, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: stageData[i].color,
        emissive: stageData[i].color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.castShadow = true;
      nodeGroup.add(sphere);

      // Outer glowing wireframe shell
      const shellGeom = new THREE.IcosahedronGeometry(0.55, 1);
      const shellMat = new THREE.MeshBasicMaterial({
        color: stageData[i].color,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const shell = new THREE.Mesh(shellGeom, shellMat);
      nodeGroup.add(shell);

      // Pulsing ring
      const ringGeom = new THREE.RingGeometry(0.65, 0.72, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: stageData[i].color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      nodeGroup.add(ring);

      // Point light for each stage
      const stageLight = new THREE.PointLight(stageData[i].color, 0.9, 3);
      nodeGroup.add(stageLight);

      // Store data
      nodeGroup.userData = {
        stageIndex: i,
        data: stageData[i],
        sphere,
        shell,
        ring,
        baseY: y
      };

      this.stagesGroup.add(nodeGroup);
      this.stageNodes.push(nodeGroup);
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    // Connect stages with glowing curve beam
    curvePoints.push(curvePoints[0]); // close loop
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeom = new THREE.TubeGeometry(curve, 120, 0.03, 8, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xffdf73,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75
    });
    this.pipelineTube = new THREE.Mesh(tubeGeom, tubeMat);
    this.stagesGroup.add(this.pipelineTube);

    this.worldGroup.add(this.stagesGroup);
  }

  createDustParticles() {
    const particleCount = 180;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      scales[i] = Math.random() * 0.8 + 0.2;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.worldGroup.add(this.dustParticles);
  }

  createPedestal() {
    // Elegant dark circular pedestal beneath the gold
    const pedGeom = new THREE.CylinderGeometry(5.8, 6.2, 0.3, 64);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f16,
      roughness: 0.6,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const pedestal = new THREE.Mesh(pedGeom, pedMat);
    pedestal.position.y = -1.2;
    pedestal.receiveShadow = true;
    this.worldGroup.add(pedestal);

    // Glowing border ring around pedestal
    const ringGeom = new THREE.TorusGeometry(6.0, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xcca01a, transparent: true, opacity: 0.6 });
    const pedRing = new THREE.Mesh(ringGeom, ringMat);
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.y = -1.05;
    this.worldGroup.add(pedRing);
  }

  createTooltipElement() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'three-tooltip';
    this.tooltip.style.display = 'none';
    this.container.appendChild(this.tooltip);
  }

  setupEventListeners() {
    const el = this.renderer.domElement;

    // Mouse drag rotation
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.worldGroup.rotation.y += deltaX * 0.007;
        this.worldGroup.rotation.x = Math.max(-0.6, Math.min(0.8, this.worldGroup.rotation.x + deltaY * 0.005));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
        this.autoRotate = false; // pause auto rotate on manual drag
      } else {
        this.checkRaycast(e);
      }
    });

    // Touch support for mobile / touchpads
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    el.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

        this.worldGroup.rotation.y += deltaX * 0.008;
        this.worldGroup.rotation.x = Math.max(-0.6, Math.min(0.8, this.worldGroup.rotation.x + deltaY * 0.006));

        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => { this.isDragging = false; });

    // Click on Stage Node in 3D
    el.addEventListener('click', () => {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = [];
      this.stageNodes.forEach(n => meshes.push(n.userData.sphere, n.userData.shell));
      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object.parent;
        if (hit && hit.userData && hit.userData.stageIndex !== undefined) {
          const idx = hit.userData.stageIndex;
          this.setActiveStage(idx);
          if (typeof this.onStageSelect === 'function') {
            this.onStageSelect(idx);
          }
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight || 450;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  checkRaycast(event) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = [];
    this.stageNodes.forEach(n => meshes.push(n.userData.sphere, n.userData.shell));
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitNode = intersects[0].object.parent;
      if (hitNode && hitNode.userData) {
        const data = hitNode.userData.data;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${event.clientX - this.container.getBoundingClientRect().left + 15}px`;
        this.tooltip.style.top = `${event.clientY - this.container.getBoundingClientRect().top - 30}px`;
        this.tooltip.innerHTML = `<strong>Stage ${data.id + 1}: ${data.name}</strong><br/><span>${data.desc}</span>`;
        document.body.style.cursor = 'pointer';
        return;
      }
    }

    this.tooltip.style.display = 'none';
    document.body.style.cursor = 'default';
  }

  setActiveStage(index) {
    this.activeStageIndex = index;
    this.stageNodes.forEach((node, i) => {
      const isSelected = i === index;
      node.userData.sphere.scale.setScalar(isSelected ? 1.45 : 1.0);
      node.userData.shell.scale.setScalar(isSelected ? 1.6 : 1.0);
      node.userData.sphere.material.emissiveIntensity = isSelected ? 1.4 : 0.6;
      node.userData.ring.material.opacity = isSelected ? 0.95 : 0.45;
    });

    // Smoothly rotate world to bring selected node to the foreground
    if (this.stageNodes[index]) {
      const targetAngle = -(index / this.stageNodes.length) * Math.PI * 2 + Math.PI / 2;
      this.targetRotationY = targetAngle;
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'ingot') {
      this.ingotGroup.visible = true;
      this.stagesGroup.visible = false;
      this.camera.position.set(0, 3.2, 7.5);
    } else if (mode === 'stages') {
      this.ingotGroup.visible = false;
      this.stagesGroup.visible = true;
      this.camera.position.set(0, 6, 14);
    } else {
      this.ingotGroup.visible = true;
      this.stagesGroup.visible = true;
      this.camera.position.set(0, 4.5, 12);
    }
  }

  resetCamera() {
    this.camera.position.set(0, 4.5, 12);
    this.worldGroup.rotation.set(0.1, 0, 0);
    this.autoRotate = true;
  }

  animate() {
    requestAnimationFrame(this.animate);
    const elapsedTime = this.clock.getElapsedTime();

    // Idle gentle float of Gold Bullion
    if (this.ingotGroup) {
      this.ingotGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;
      this.ingotGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.08;
    }

    // Auto rotate world if not interacting
    if (this.autoRotate && !this.isDragging) {
      this.worldGroup.rotation.y += 0.004;
    }

    // Target rotation interpolation if stage was clicked
    if (this.targetRotationY !== undefined) {
      this.worldGroup.rotation.y += (this.targetRotationY - this.worldGroup.rotation.y) * 0.05;
      if (Math.abs(this.targetRotationY - this.worldGroup.rotation.y) < 0.005) {
        delete this.targetRotationY;
      }
    }

    // Animate Stage Nodes (orbital breathing & shell spinning)
    this.stageNodes.forEach((node, i) => {
      const { shell, ring, baseY } = node.userData;
      shell.rotation.x += 0.02;
      shell.rotation.y += 0.025;
      ring.rotation.z += 0.015;
      node.position.y = baseY + Math.sin(elapsedTime * 2 + i) * 0.18;
    });

    // Shimmering dust particles
    if (this.dustParticles) {
      this.dustParticles.rotation.y = elapsedTime * 0.03;
    }

    // Aura ring pulse
    if (this.auraMesh) {
      this.auraMesh.rotation.z += 0.005;
      this.auraMesh.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.04);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Gold3DScene = Gold3DScene;

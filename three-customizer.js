import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ----------------------------------------------------
// PART 1: AMBIENT FLOATING CANDIES BACKGROUND
// ----------------------------------------------------

let ambientRenderer, ambientScene, ambientCamera;
let floatingSweets = [];

export function initAmbientBackground() {
  const container = document.getElementById('ambient-canvas-container');
  if (!container) return;

  // Clear existing
  container.innerHTML = '';

  ambientScene = new THREE.Scene();
  ambientCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  ambientCamera.position.z = 15;

  ambientRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  ambientRenderer.setSize(window.innerWidth, window.innerHeight);
  ambientRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(ambientRenderer.domElement);

  // Add soft lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  ambientScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xff7597, 0.8);
  dirLight.position.set(5, 10, 7);
  ambientScene.add(dirLight);

  const pointLight = new THREE.PointLight(0x00dec7, 0.8, 30);
  pointLight.position.set(-5, -5, 5);
  ambientScene.add(pointLight);

  // Spawn random floating shapes
  const sweetTypes = ['donut', 'macaron', 'candy'];
  const sweetColors = [0xff7597, 0x9b51e0, 0x00dec7, 0xf1c40f, 0xe74c3c, 0xffffff];

  for (let i = 0; i < 15; i++) {
    const type = sweetTypes[Math.floor(Math.random() * sweetTypes.length)];
    const color = sweetColors[Math.floor(Math.random() * sweetColors.length)];
    const sweetGroup = new THREE.Group();

    if (type === 'donut') {
      const doughGeo = new THREE.TorusGeometry(0.8, 0.3, 16, 32);
      const doughMat = new THREE.MeshPhysicalMaterial({
        color: 0xe6ad50,
        roughness: 0.6
      });
      const dough = new THREE.Mesh(doughGeo, doughMat);
      
      const icingGeo = new THREE.TorusGeometry(0.82, 0.22, 16, 32);
      const icingMat = new THREE.MeshPhysicalMaterial({
        color: color,
        roughness: 0.1,
        clearcoat: 1.0
      });
      const icing = new THREE.Mesh(icingGeo, icingMat);
      icing.scale.set(1.02, 1.02, 1.1);
      icing.position.z = 0.05;

      sweetGroup.add(dough, icing);
    } else if (type === 'macaron') {
      const shellGeo = new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const shellMat = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.4 });
      
      const topShell = new THREE.Mesh(shellGeo, shellMat);
      topShell.scale.set(1, 0.5, 1);
      topShell.position.y = 0.15;
      
      const bottomShell = topShell.clone();
      bottomShell.rotation.x = Math.PI;
      bottomShell.position.y = -0.15;

      const creamGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.15, 32);
      const creamMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.8 });
      const cream = new THREE.Mesh(creamGeo, creamMat);

      sweetGroup.add(topShell, bottomShell, cream);
    } else { // candy
      const centerGeo = new THREE.SphereGeometry(0.6, 32, 32);
      const centerMat = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.1, transmission: 0.6, thickness: 0.5 });
      const center = new THREE.Mesh(centerGeo, centerMat);

      const wrapperGeo = new THREE.ConeGeometry(0.4, 0.6, 16);
      const wrapperMat = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.2, transparent: true, opacity: 0.7 });
      
      const leftWing = new THREE.Mesh(wrapperGeo, wrapperMat);
      leftWing.rotation.z = Math.PI / 2;
      leftWing.position.x = -0.7;
      
      const rightWing = leftWing.clone();
      rightWing.rotation.z = -Math.PI / 2;
      rightWing.position.x = 0.7;

      sweetGroup.add(center, leftWing, rightWing);
    }

    // Set random transform coordinates
    sweetGroup.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10 - 5
    );

    sweetGroup.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      0
    );

    const speed = {
      x: (Math.random() - 0.5) * 0.004,
      y: (Math.random() - 0.5) * 0.004,
      rotX: (Math.random() - 0.5) * 0.015,
      rotY: (Math.random() - 0.5) * 0.015
    };

    floatingSweets.push({ mesh: sweetGroup, speed });
    ambientScene.add(sweetGroup);
  }

  // Mouse interactivity offsets
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 3;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 3;
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Slow orbit camera shift based on mouse position
    ambientCamera.position.x += (mouseX - ambientCamera.position.x) * 0.05;
    ambientCamera.position.y += (mouseY - ambientCamera.position.y) * 0.05;
    ambientCamera.lookAt(ambientScene.position);

    // Update floating meshes position
    floatingSweets.forEach(sweet => {
      sweet.mesh.position.x += sweet.speed.x;
      sweet.mesh.position.y += sweet.speed.y;
      
      sweet.mesh.rotation.x += sweet.speed.rotX;
      sweet.mesh.rotation.y += sweet.speed.rotY;

      // Wrap-around boundary controls
      if (Math.abs(sweet.mesh.position.x) > 15) sweet.speed.x *= -1;
      if (Math.abs(sweet.mesh.position.y) > 10) sweet.speed.y *= -1;
    });

    ambientRenderer.render(ambientScene, ambientCamera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    if (!ambientRenderer || !ambientCamera) return;
    ambientCamera.aspect = window.innerWidth / window.innerHeight;
    ambientCamera.updateProjectionMatrix();
    ambientRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}


// ----------------------------------------------------
// PART 2: HIGH-FIDELITY SWEET CUSTOMIZER VIEWPORT
// ----------------------------------------------------

let studioRenderer, studioScene, studioCamera, studioControls;
let activeSweetGroup = null;

export function initCustomizer3D(containerId, initialConfig) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  studioScene = new THREE.Scene();
  
  // Set up camera with dynamic depth
  studioCamera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  studioCamera.position.set(0, 3.5, 6);

  studioRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  studioRenderer.setSize(container.clientWidth, container.clientHeight);
  studioRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  studioRenderer.shadowMap.enabled = true;
  studioRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(studioRenderer.domElement);

  // Orbital Controls
  studioControls = new OrbitControls(studioCamera, studioRenderer.domElement);
  studioControls.enableDamping = true;
  studioControls.dampingFactor = 0.05;
  studioControls.minDistance = 3.5;
  studioControls.maxDistance = 10;
  studioControls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit panning under floor

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  studioScene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(5, 8, 5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.bias = -0.001;
  studioScene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xff7597, 0.4);
  fillLight.position.set(-5, 3, -5);
  studioScene.add(fillLight);

  const rimLight = new THREE.PointLight(0x00dec7, 0.6, 15);
  rimLight.position.set(0, -2, 3);
  studioScene.add(rimLight);

  // Subtle grid/pedestal for shadow projection
  const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.12 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.5;
  shadowPlane.receiveShadow = true;
  studioScene.add(shadowPlane);

  // Group to hold dynamic components
  activeSweetGroup = new THREE.Group();
  studioScene.add(activeSweetGroup);

  // Generate Initial Mesh
  updateCustomizerSweet(initialConfig);

  // Render loop
  function studioAnimate() {
    requestAnimationFrame(studioAnimate);
    
    // Slow auto-spin if the user is not actively dragging OrbitControls
    if (activeSweetGroup && !studioControls.state === -1) {
      activeSweetGroup.rotation.y += 0.004;
    }
    
    studioControls.update();
    studioRenderer.render(studioScene, studioCamera);
  }

  studioAnimate();

  // Resize handler
  const resizeObserver = new ResizeObserver(() => {
    if (!studioRenderer || !studioCamera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    studioCamera.aspect = w / h;
    studioCamera.updateProjectionMatrix();
    studioRenderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  return {
    update: updateCustomizerSweet,
    zoomIn: () => { studioCamera.position.z = Math.max(studioCamera.position.z - 1, 3.5); },
    zoomOut: () => { studioCamera.position.z = Math.min(studioCamera.position.z + 1, 10); },
    resetCamera: () => { studioCamera.position.set(0, 3.5, 6); studioControls.target.set(0, 0, 0); }
  };
}

// ----------------------------------------------------
// BUILD SWEET MODEL MESHES DYNAMICALLY
// ----------------------------------------------------

export function updateCustomizerSweet(config) {
  if (!activeSweetGroup) return;

  // Clear previous meshes
  while (activeSweetGroup.children.length > 0) {
    const obj = activeSweetGroup.children[0];
    activeSweetGroup.remove(obj);
  }

  const { type, baseColor, icingColor, sprinkles, toppings } = config;

  if (type === 'donut') {
    // 1. Dough Torus
    const doughGeo = new THREE.TorusGeometry(1.2, 0.45, 32, 64);
    const doughMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6ad50,
      roughness: 0.75,
      metalness: 0.05,
      sheen: 0.2
    });
    const dough = new THREE.Mesh(doughGeo, doughMat);
    dough.rotation.x = Math.PI / 2;
    dough.castShadow = true;
    dough.receiveShadow = true;
    activeSweetGroup.add(dough);

    // 2. Icing (Glaze)
    if (toppings.includes('icing')) {
      const icingGeo = new THREE.TorusGeometry(1.22, 0.36, 32, 64, Math.PI * 1.85);
      const icingMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(icingColor),
        roughness: 0.1,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      });
      const icing = new THREE.Mesh(icingGeo, icingMat);
      icing.rotation.x = Math.PI / 2;
      // Slightly rotate and scale up to sit on top of dough
      icing.rotation.y = -Math.PI / 15;
      icing.position.y = 0.12;
      icing.scale.set(1.01, 1.01, 1.15);
      icing.castShadow = true;
      activeSweetGroup.add(icing);

      // 3. Sprinkles (scattered on icing surface)
      if (sprinkles !== 'none') {
        const sprinkleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.14, 8);
        
        let colors = [];
        if (sprinkles === 'rainbow') {
          colors = [0xff7597, 0x00dec7, 0xf1c40f, 0x9b51e0, 0xffffff, 0xff5722];
        } else if (sprinkles === 'gold') {
          colors = [0xffd700, 0xdaa520, 0xffdf7a];
        } else if (sprinkles === 'chocolate') {
          colors = [0x3d2314, 0x5c3317, 0x24140a];
        }

        const count = 75;
        for (let i = 0; i < count; i++) {
          const sprinkleMat = new THREE.MeshPhysicalMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            roughness: 0.25,
            metalness: sprinkles === 'gold' ? 0.8 : 0.05
          });
          const spr = new THREE.Mesh(sprinkleGeo, sprinkleMat);
          
          // Distribute along torus ring
          const u = Math.random() * Math.PI * 2;
          const v = (Math.random() - 0.5) * (Math.PI * 0.4); // Limit on upper half
          
          const R = 1.22;
          const r = 0.36;

          // Torus parametric equation
          const x = (R + r * Math.cos(v)) * Math.cos(u);
          const z = (R + r * Math.cos(v)) * Math.sin(u);
          const y = r * Math.sin(v) + 0.14; // Offset height

          spr.position.set(x, y, z);
          
          // Random orientation aligned with normal or arbitrary rotation
          spr.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          spr.castShadow = true;
          activeSweetGroup.add(spr);
        }
      }
    }
  }

  else if (type === 'cupcake') {
    // 1. Baking Wrapper (pleated cylinder)
    const wrapperGeo = new THREE.CylinderGeometry(1.0, 0.8, 1.2, 32);
    // Pleated bump effect via material displacement / custom normal mesh styling
    const wrapperMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(baseColor),
      roughness: 0.15,
      metalness: 0.8, // Shiny foil cupcake holder!
      clearcoat: 0.5
    });
    const wrapper = new THREE.Mesh(wrapperGeo, wrapperMat);
    wrapper.position.y = -0.6;
    wrapper.castShadow = true;
    wrapper.receiveShadow = true;
    activeSweetGroup.add(wrapper);

    // 2. Cupcake sponge cake
    const cakeGeo = new THREE.CylinderGeometry(1.05, 0.95, 0.4, 32);
    const cakeMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5a2b, // Chocolate cupcake sponge cake
      roughness: 0.9,
      sheen: 0.1
    });
    const cake = new THREE.Mesh(cakeGeo, cakeMat);
    cake.position.y = 0.05;
    cake.castShadow = true;
    activeSweetGroup.add(cake);

    // 3. Piped Frosting (Using layered spiraling spheres or torus knots)
    const frostingGroup = new THREE.Group();
    const frostingColorObj = new THREE.Color(icingColor);
    const frostingMat = new THREE.MeshPhysicalMaterial({
      color: frostingColorObj,
      roughness: 0.35,
      clearcoat: 0.1,
      sheen: 0.8,
      sheenColor: 0xffffff
    });

    // We build 3 layers of piped frosting to make it look incredibly luscious!
    const bottomFrosting = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.32, 16, 32), frostingMat);
    bottomFrosting.rotation.x = Math.PI / 2;
    bottomFrosting.position.y = 0.3;
    bottomFrosting.castShadow = true;
    frostingGroup.add(bottomFrosting);

    const midFrosting = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.28, 16, 32), frostingMat);
    midFrosting.rotation.x = Math.PI / 2;
    midFrosting.position.y = 0.65;
    midFrosting.castShadow = true;
    frostingGroup.add(midFrosting);

    const topFrosting = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 32), frostingMat);
    topFrosting.position.y = 0.95;
    topFrosting.scale.y = 0.85;
    topFrosting.castShadow = true;
    frostingGroup.add(topFrosting);

    activeSweetGroup.add(frostingGroup);

    // 4. Sprinkles on Cupcake
    if (sprinkles !== 'none') {
      const sprColors = sprinkles === 'rainbow' ? [0xff7597, 0x00dec7, 0xf1c40f, 0x9b51e0, 0xffffff] 
                        : sprinkles === 'gold' ? [0xffd700, 0xdaa520] 
                        : [0x3d2314, 0x5c3317];
      const count = 40;
      for (let i = 0; i < count; i++) {
        const sprMat = new THREE.MeshPhysicalMaterial({ color: sprColors[Math.floor(Math.random() * sprColors.length)], roughness: 0.2 });
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), sprMat);
        
        // Distribute randomly on surface of frosting layers
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.7;
        const yVal = 0.3 + (1.0 - (radius / 0.7)) * 0.55 + (Math.random() - 0.5) * 0.1;
        
        ball.position.set(radius * Math.cos(angle), yVal, radius * Math.sin(angle));
        ball.castShadow = true;
        activeSweetGroup.add(ball);
      }
    }

    // 5. Cherry topping
    if (toppings.includes('cherry')) {
      const cherryMat = new THREE.MeshPhysicalMaterial({
        color: 0xb3001e, // Ruby red cherry
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      });
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), cherryMat);
      cherry.position.set(0, 1.25, 0.02);
      cherry.castShadow = true;
      activeSweetGroup.add(cherry);

      // Cherry stem
      const stemPoints = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        stemPoints.push(new THREE.Vector3(t * 0.16, 1.25 + t * 0.5, -t * 0.08));
      }
      const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 8, 0.015, 6, false);
      const stemMat = new THREE.MeshBasicMaterial({ color: 0x4f2b09 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      activeSweetGroup.add(stem);
    }

    // 6. Whipped Cream whipped cream blob
    if (toppings.includes('cream')) {
      const creamMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.8,
        sheen: 0.8
      });
      const creamGeo = new THREE.TorusKnotGeometry(0.15, 0.08, 32, 8, 2, 3);
      const cream = new THREE.Mesh(creamGeo, creamMat);
      cream.position.set(0, 1.1, 0);
      cream.scale.set(1.2, 1, 1.2);
      cream.castShadow = true;
      activeSweetGroup.add(cream);
      
      // Shift cherry higher if cream is present
      const cherry = activeSweetGroup.children.find(c => c.geometry && c.geometry.type === 'SphereGeometry' && c.position.y > 1.2);
      if (cherry) {
        cherry.position.y = 1.35;
      }
    }
  }

  else if (type === 'macaron') {
    // Macarons consist of: Top Shell, Cream filling, Bottom Shell
    const shellColor = new THREE.Color(baseColor);
    const fillingColor = new THREE.Color(icingColor);

    const shellMat = new THREE.MeshPhysicalMaterial({
      color: shellColor,
      roughness: 0.45,
      sheen: 0.3
    });

    // 1. Top Macaron Shell (squashed hemisphere)
    const topGeo = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const topShell = new THREE.Mesh(topGeo, shellMat);
    topShell.scale.set(1.1, 0.5, 1.1);
    topShell.position.y = 0.2;
    topShell.castShadow = true;
    activeSweetGroup.add(topShell);

    // Dynamic Ruffled Macaron Foot (the frilly edge at the base of the shell)
    const footGeo = new THREE.TorusGeometry(1.15, 0.08, 12, 48);
    const footMat = new THREE.MeshPhysicalMaterial({
      color: shellColor,
      roughness: 0.85
    });
    const topFoot = new THREE.Mesh(footGeo, footMat);
    topFoot.rotation.x = Math.PI / 2;
    topFoot.position.y = 0.19;
    topFoot.scale.set(1.02, 1.02, 0.6);
    activeSweetGroup.add(topFoot);

    // 2. Bottom Macaron Shell (flipped top shell)
    const bottomShell = topShell.clone();
    bottomShell.rotation.z = Math.PI;
    bottomShell.position.y = -0.2;
    activeSweetGroup.add(bottomShell);

    const bottomFoot = topFoot.clone();
    bottomFoot.position.y = -0.19;
    activeSweetGroup.add(bottomFoot);

    // 3. Filling Cream
    const creamMat = new THREE.MeshPhysicalMaterial({
      color: fillingColor,
      roughness: 0.95,
      sheen: 0.6
    });
    // Multi-faceted cream geometry to look piped
    const creamGeo = new THREE.CylinderGeometry(1.02, 1.02, 0.28, 24);
    const cream = new THREE.Mesh(creamGeo, creamMat);
    cream.castShadow = true;
    activeSweetGroup.add(cream);
  }

  // Position sweet nicely centered vertically
  activeSweetGroup.position.y = 0.2;
}

// ----------------------------------------------------
// PART 3: HOMEPAGE HERO DYNAMIC 3D VIEWER
// ----------------------------------------------------
export function initHomeHero3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const scene = new THREE.Scene();
  
  // Set up camera with nice depth
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 10);
  camera.position.set(0, 1.2, 3.8);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Soft ambient lighting and directional light with shadows
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(3, 5, 3);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Sweet Group container
  const sweetGroup = new THREE.Group();
  scene.add(sweetGroup);

  // 1. Dough Torus
  const doughGeo = new THREE.TorusGeometry(0.7, 0.26, 16, 32);
  const doughMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6ad50,
    roughness: 0.7,
    metalness: 0.1,
    sheen: 0.2
  });
  const dough = new THREE.Mesh(doughGeo, doughMat);
  dough.rotation.x = Math.PI / 2;
  dough.castShadow = true;
  sweetGroup.add(dough);

  // 2. Glossy Glazed Icing
  const icingGeo = new THREE.TorusGeometry(0.71, 0.2, 16, 32, Math.PI * 1.85);
  const icingMat = new THREE.MeshPhysicalMaterial({
    color: 0xff7597, // Cotton candy pink
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });
  const icing = new THREE.Mesh(icingGeo, icingMat);
  icing.rotation.x = Math.PI / 2;
  icing.position.y = 0.07;
  icing.scale.set(1.01, 1.01, 1.12);
  icing.castShadow = true;
  sweetGroup.add(icing);

  // 3. Rainbow Sprinkles
  const sprColors = [0xff7597, 0x00dec7, 0xf1c40f, 0x9b51e0, 0xffffff, 0xff5722];
  const count = 45;
  const sprinkleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.09, 8);

  for (let i = 0; i < count; i++) {
    const sprMat = new THREE.MeshPhysicalMaterial({
      color: sprColors[Math.floor(Math.random() * sprColors.length)],
      roughness: 0.2
    });
    const spr = new THREE.Mesh(sprinkleGeo, sprMat);

    const u = Math.random() * Math.PI * 2;
    const v = (Math.random() - 0.5) * (Math.PI * 0.4); // Top surface only
    
    const R = 0.71;
    const r = 0.2;

    const x = (R + r * Math.cos(v)) * Math.cos(u);
    const z = (R + r * Math.cos(v)) * Math.sin(u);
    const y = r * Math.sin(v) + 0.09;

    spr.position.set(x, y, z);
    spr.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    spr.castShadow = true;
    sweetGroup.add(spr);
  }

  // Wires mouse hover tilt offsets
  let targetRotX = 0.25; // default slight tilt
  let targetRotY = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    // Verify cursor is hovering near hero card
    const x = ((e.clientX - rect.left) / container.clientWidth - 0.5) * 2;
    const y = -((e.clientY - rect.top) / container.clientHeight - 0.5) * 2;

    targetRotY = x * 0.75;
    targetRotX = y * 0.5 + 0.25;
  });

  // Render loop
  function loop() {
    requestAnimationFrame(loop);

    // Auto rotate + smooth cursor tilt interpolation
    sweetGroup.rotation.y += 0.008;
    sweetGroup.rotation.x += (targetRotX - sweetGroup.rotation.x) * 0.08;
    sweetGroup.rotation.z += (targetRotY - sweetGroup.rotation.z) * 0.08;

    // Smooth floating bobbing
    sweetGroup.position.y = Math.sin(Date.now() * 0.002) * 0.06;

    renderer.render(scene, camera);
  }
  loop();

  // Resize listener
  const resizeObserver = new ResizeObserver(() => {
    if (!renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  resizeObserver.observe(container);
}


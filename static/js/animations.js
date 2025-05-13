// Main 3D scene constants
const COLORS = {
    primary: 0x4D9AFF,
    secondary: 0x3A75C4,
    accent: 0x28A745,
    background: 0x2C3E50,
    grid: 0xFFFFFF
};

// Initialize animation when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animations
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });
    
    // Initialize 3D animations
    createHomeAnimation();
    createAboutAnimation();
    
    // Set up navigation
    setupNavigation();
    
    // Initialize main canvas animation
    initMainCanvas();
    
    // Initialize about section canvas
    initAboutCanvas();
    
    // Listen for theme changes to update 3D scenes
    document.addEventListener('themeChanged', function(e) {
        const isDarkMode = e.detail.theme === 'dark';
        updateCanvasColors(isDarkMode);
    });
});

// Setup page navigation
function setupNavigation() {
    // Get navigation elements
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const sections = document.querySelectorAll('.section-page');
    const getStartedBtn = document.getElementById('get-started-btn');
    
    // Add click event listeners to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Hide all sections and remove active class from nav links
            sections.forEach(section => section.classList.remove('active-section'));
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            // Show target section and add active class to clicked nav link
            document.querySelector(targetId).classList.add('active-section');
            this.classList.add('active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    
    // Get Started button goes to forecast section
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            sections.forEach(section => section.classList.remove('active-section'));
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            document.getElementById('forecast-section').classList.add('active-section');
            document.getElementById('nav-forecast').classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Home Section 3D Animation - Stock Market Graph
function createHomeAnimation() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Create stock chart line
    const points = [];
    const numPoints = 50;
    
    // Create random stock-like data points
    for (let i = 0; i < numPoints; i++) {
        const x = (i - numPoints / 2) * 0.5;
        // Simulate stock movement with sine wave and random noise
        const y = Math.sin(i * 0.2) * 2 + Math.cos(i * 0.3) * 1.5 + (Math.random() - 0.5) * 0.8;
        const z = 0;
        points.push(new THREE.Vector3(x, y, z));
    }
    
    // Create curve from points
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 100, 0.1, 8, false);
    
    // Add gradient material
    const material = new THREE.MeshBasicMaterial({
        color: 0x4D9AFF,
        transparent: true,
        opacity: 0.8
    });
    
    const stockLine = new THREE.Mesh(geometry, material);
    scene.add(stockLine);
    
    // Add floating point markers
    const pointGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x4D9AFF });
    
    for (let i = 0; i < numPoints; i += 5) {
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.copy(points[i]);
        scene.add(point);
    }
    
    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x222222);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.5;
    scene.add(gridHelper);
    
    // Position camera
    camera.position.z = 15;
    camera.position.y = 2;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate the entire scene for a dynamic effect
        stockLine.rotation.y += 0.005;
        gridHelper.rotation.z += 0.002;
        
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Start animation
    animate();
}

// About Section 3D Animation - Floating Cubes
function createAboutAnimation() {
    const container = document.getElementById('about-canvas-container');
    if (!container) return;
    
    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Create a group to hold all objects
    const group = new THREE.Group();
    scene.add(group);
    
    // Create multiple floating cubes with different sizes and colors
    const cubes = [];
    const colors = [0x4D9AFF, 0x3a75c4, 0x2c3e50, 0x6c757d];
    
    for (let i = 0; i < 20; i++) {
        const size = Math.random() * 0.5 + 0.3;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.8
        });
        
        const cube = new THREE.Mesh(geometry, material);
        
        // Position cubes randomly in a spherical area
        const radius = 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        cube.position.x = radius * Math.sin(phi) * Math.cos(theta);
        cube.position.y = radius * Math.sin(phi) * Math.sin(theta);
        cube.position.z = radius * Math.cos(phi);
        
        // Add random rotation
        cube.rotation.x = Math.random() * Math.PI;
        cube.rotation.y = Math.random() * Math.PI;
        
        // Store rotation speeds
        cube.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        
        group.add(cube);
        cubes.push(cube);
    }
    
    // Position camera
    camera.position.z = 10;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate each cube based on its rotation speed
        cubes.forEach(cube => {
            cube.rotation.x += cube.userData.rotationSpeed.x;
            cube.rotation.y += cube.userData.rotationSpeed.y;
            cube.rotation.z += cube.userData.rotationSpeed.z;
        });
        
        // Rotate the entire group slowly
        group.rotation.y += 0.002;
        group.rotation.x += 0.001;
        
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Start animation
    animate();
}

// Initialize the main 3D canvas
function initMainCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    // Configure renderer
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Create sophisticated 3D stock chart visualization
    createStockChart(scene);
    
    // Set camera position
    camera.position.z = 5;
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate and animate the entire scene
        scene.rotation.y += 0.003;
        scene.rotation.x += 0.001;
        
        // Animate individual objects if needed
        animateStockChart();
        
        renderer.render(scene, camera);
    }
    
    animate();
}

// Create a sophisticated 3D stock chart
function createStockChart(scene) {
    // Group to hold all chart elements
    const chartGroup = new THREE.Group();
    chartGroup.name = "stockChart";
    
    // Generate random stock data points for visualization
    const dataPoints = 20;
    const stockData = [];
    let prevValue = 50 + Math.random() * 20;
    
    for (let i = 0; i < dataPoints; i++) {
        const change = (Math.random() - 0.5) * 10;
        prevValue += change;
        prevValue = Math.max(20, Math.min(100, prevValue)); // Keep values between 20-100
        stockData.push(prevValue);
    }
    
    // Create chart axes
    const axesHelper = createAxes();
    chartGroup.add(axesHelper);
    
    // Create a line chart
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: COLORS.primary,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    const linePoints = [];
    
    // Create candle points
    const candleMaterial = new THREE.MeshPhongMaterial({ 
        color: COLORS.primary,
        transparent: true,
        opacity: 0.8,
        emissive: COLORS.primary,
        emissiveIntensity: 0.2
    });
    
    // Add data points with bars
    for (let i = 0; i < stockData.length; i++) {
        const x = (i - dataPoints / 2) * 0.4;
        const y = (stockData[i] - 60) * 0.05;
        
        linePoints.push(x, y, 0);
        
        // Create a bar for each data point
        const barHeight = y;
        const barGeometry = new THREE.BoxGeometry(0.1, Math.abs(barHeight), 0.1);
        const bar = new THREE.Mesh(barGeometry, candleMaterial);
        
        bar.position.x = x;
        bar.position.y = barHeight / 2;
        bar.position.z = 0;
        
        chartGroup.add(bar);
        
        // Add sphere at each data point
        const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const sphere = new THREE.Mesh(sphereGeometry, new THREE.MeshPhongMaterial({ 
            color: y >= 0 ? COLORS.accent : 0xdc3545,
            emissive: y >= 0 ? COLORS.accent : 0xdc3545,
            emissiveIntensity: 0.2
        }));
        
        sphere.position.set(x, y, 0);
        chartGroup.add(sphere);
    }
    
    // Create the line
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    const line = new THREE.Line(lineGeometry, lineMaterial);
    chartGroup.add(line);
    
    // Create a grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
    gridHelper.position.y = -2;
    gridHelper.rotation.x = Math.PI / 2;
    chartGroup.add(gridHelper);
    
    // Add a moving average line (simulated)
    const maLinePoints = [];
    for (let i = 0; i < stockData.length; i++) {
        const x = (i - dataPoints / 2) * 0.4;
        
        // Calculate a simple moving average (simulated)
        let maValue = 0;
        const maWindow = 3;
        for (let j = Math.max(0, i - maWindow); j <= i; j++) {
            maValue += stockData[j];
        }
        maValue /= Math.min(i + 1, maWindow + 1);
        
        const y = (maValue - 60) * 0.05;
        maLinePoints.push(x, y, 0.1); // Slight offset on z-axis
    }
    
    const maLineGeometry = new THREE.BufferGeometry();
    maLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(maLinePoints, 3));
    const maLine = new THREE.Line(
        maLineGeometry, 
        new THREE.LineBasicMaterial({ color: 0xffc107, linewidth: 2 })
    );
    chartGroup.add(maLine);
    
    // Add chart to scene
    scene.add(chartGroup);
}

// Create 3D axes for the chart
function createAxes() {
    const axesGroup = new THREE.Group();
    
    // X-axis
    const xAxisGeometry = new THREE.BufferGeometry();
    xAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-5, 0, 0, 5, 0, 0], 3));
    const xAxis = new THREE.Line(xAxisGeometry, new THREE.LineBasicMaterial({ color: COLORS.grid }));
    axesGroup.add(xAxis);
    
    // Y-axis
    const yAxisGeometry = new THREE.BufferGeometry();
    yAxisGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, -2, 0, 0, 2, 0], 3));
    const yAxis = new THREE.Line(yAxisGeometry, new THREE.LineBasicMaterial({ color: COLORS.grid }));
    axesGroup.add(yAxis);
    
    return axesGroup;
}

// Animate the stock chart elements
function animateStockChart() {
    const chart = scene.getObjectByName("stockChart");
    if (chart) {
        // Add subtle oscillation
        chart.children.forEach((child, index) => {
            if (child.type === "Mesh") {
                child.rotation.z = Math.sin(Date.now() * 0.001 + index * 0.1) * 0.05;
                
                // Pulsate the data point spheres
                if (child.geometry.type === "SphereGeometry") {
                    const scale = 0.9 + Math.sin(Date.now() * 0.003 + index) * 0.1;
                    child.scale.set(scale, scale, scale);
                }
            }
        });
    }
}

// Initialize the about section 3D canvas
function initAboutCanvas() {
    const container = document.getElementById('about-canvas-container');
    if (!container) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // Configure renderer
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    
    // Create 3D text for "AI"
    const fontLoader = new THREE.FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
        const textGeometry = new THREE.TextGeometry('AI', {
            font: font,
            size: 1.5,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5
        });
        
        textGeometry.center();
        
        const textMaterial = new THREE.MeshPhongMaterial({ 
            color: COLORS.primary,
            specular: 0x111111,
            shininess: 30
        });
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        scene.add(textMesh);
        
        // Add particle system around the text
        addParticleSystem(scene);
    });
    
    // Set camera position
    camera.position.z = 5;
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate and animate the scene
        scene.rotation.y += 0.005;
        
        // Animate particles
        animateParticles();
        
        renderer.render(scene, camera);
    }
    
    animate();
}

// Add a particle system to represent data points
function addParticleSystem(scene) {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
        // Position particles in a spherical cloud
        const radius = 2 + Math.random() * 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Assign colors based on position
        color.setHSL(i / particleCount, 0.7, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        // Random sizes
        sizes[i] = Math.random() * 0.05 + 0.01;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Custom shader material for particles
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 }
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // Add some movement to particles
                vec3 pos = position;
                float speed = size * 2.0;
                pos.x += sin(time * speed + position.z * 5.0) * 0.1;
                pos.y += cos(time * speed + position.x * 5.0) * 0.1;
                pos.z += sin(time * speed + position.y * 5.0) * 0.1;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            
            void main() {
                // Create circular particles
                float d = distance(gl_PointCoord, vec2(0.5, 0.5));
                if (d > 0.5) discard;
                
                // Add glow effect
                float intensity = 1.0 - d * 2.0;
                gl_FragColor = vec4(vColor, intensity);
            }
        `,
        transparent: true,
        depthWrite: false,
        vertexColors: true
    });
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.name = "particleSystem";
    scene.add(particleSystem);
}

// Animate particles
function animateParticles() {
    const particleSystem = scene.getObjectByName("particleSystem");
    if (particleSystem && particleSystem.material.uniforms) {
        particleSystem.material.uniforms.time.value = performance.now() * 0.0005;
    }
}

// Update 3D scene colors when theme changes
function updateCanvasColors(isDarkMode) {
    // Update color constants
    COLORS.background = isDarkMode ? 0x121212 : 0xf8f9fa;
    COLORS.grid = isDarkMode ? 0x444444 : 0xcccccc;
    
    // Update 3D scenes
    const scenes = [scene, aboutScene]; // Assuming these are global variables
    
    scenes.forEach(scene => {
        if (!scene) return;
        
        // Update background color
        if (scene.background) {
            scene.background = new THREE.Color(COLORS.background);
        }
        
        // Update grid colors
        scene.traverse(object => {
            if (object.isGridHelper) {
                object.material.color.set(COLORS.grid);
            }
        });
    });
} 
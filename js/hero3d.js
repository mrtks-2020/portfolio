/* ============================================================
   3D particle portrait — Three.js
   Converts assets/profile.jpg into an interactive 3D point
   cloud (depth from pixel brightness). Falls back to an "MK"
   monogram cloud when no photo is present.
   ============================================================ */
(function () {
  var wrap = document.getElementById("heroCanvasWrap");
  var canvas = document.getElementById("heroCanvas");
  if (!wrap || !canvas || typeof THREE === "undefined") return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var GRID = 200;            // sample resolution (particles per side, max)
  var SPREAD = 190;          // world width of the portrait
  var DEPTH = 34;            // z-range carved from brightness
  var INTRO_MS = prefersReducedMotion ? 0 : 2200;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
  camera.position.z = 260;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);

  var group = new THREE.Group();
  scene.add(group);

  /* ---------- ambient star field ---------- */
  var starGeo = new THREE.BufferGeometry();
  var starCount = 260;
  var starPos = new Float32Array(starCount * 3);
  for (var s = 0; s < starCount; s++) {
    starPos[s * 3] = (Math.random() - 0.5) * 420;
    starPos[s * 3 + 1] = (Math.random() - 0.5) * 420;
    starPos[s * 3 + 2] = -60 - Math.random() * 240;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  var stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0x38bdf8, size: 1.1, transparent: true, opacity: 0.35, sizeAttenuation: true })
  );
  scene.add(stars);

  /* ---------- portrait particles ---------- */
  var points = null;
  var targets = null;   // final xyz per particle
  var origins = null;   // scattered start xyz per particle
  var introStart = 0;
  var introDone = prefersReducedMotion;

  function buildFromImage(img) {
    var off = document.createElement("canvas");
    off.width = GRID;
    off.height = GRID;
    var ctx = off.getContext("2d");

    // cover-fit the source into the square sample grid
    var sw = img.width, sh = img.height;
    var side = Math.min(sw, sh);
    ctx.drawImage(img, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, GRID, GRID);

    var data = ctx.getImageData(0, 0, GRID, GRID).data;
    var posArr = [], colArr = [];

    // if the image carries transparency (cutout PNG), carve by alpha alone;
    // otherwise fall back to carving near-black pixels
    var hasAlpha = false;
    for (var k = 3; k < data.length; k += 4) {
      if (data[k] < 250) { hasAlpha = true; break; }
    }

    for (var y = 0; y < GRID; y++) {
      for (var x = 0; x < GRID; x++) {
        var i = (y * GRID + x) * 4;
        var r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, a = data[i + 3] / 255;
        var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (hasAlpha ? a < 0.5 : lum < 0.05) continue;

        posArr.push(
          (x / GRID - 0.5) * SPREAD,
          (0.5 - y / GRID) * SPREAD,
          (lum - 0.45) * DEPTH
        );
        // cyan-lift very dark pixels (e.g. a dark suit) so the silhouette
        // stays readable on the dark page background
        if (lum < 0.16) {
          var m = 0.3;
          colArr.push(
            Math.min(1, (r * (1 - m) + 0.25 * m) * 1.45),
            Math.min(1, (g * (1 - m) + 0.5 * m) * 1.45),
            Math.min(1, (b * (1 - m) + 0.7 * m) * 1.45)
          );
        } else {
          // gamma lift: brightens midtones (skin) without blowing out highlights
          colArr.push(
            Math.min(1, Math.pow(r, 0.66) * 1.16),
            Math.min(1, Math.pow(g, 0.66) * 1.14),
            Math.min(1, Math.pow(b, 0.66) * 1.14)
          );
        }
      }
    }

    var count = posArr.length / 3;
    targets = new Float32Array(posArr);
    origins = new Float32Array(count * 3);
    var startPositions = new Float32Array(count * 3);

    for (var p = 0; p < count; p++) {
      // scatter start: random shell around the scene
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var rad = 180 + Math.random() * 160;
      origins[p * 3] = rad * Math.sin(phi) * Math.cos(theta);
      origins[p * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      origins[p * 3 + 2] = rad * Math.cos(phi) - 60;

      var src = introDone ? targets : origins;
      startPositions[p * 3] = src[p * 3];
      startPositions[p * 3 + 1] = src[p * 3 + 1];
      startPositions[p * 3 + 2] = src[p * 3 + 2];
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(startPositions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colArr), 3));

    var mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false
    });

    if (points) {
      group.remove(points);
      points.geometry.dispose();
      points.material.dispose();
    }
    points = new THREE.Points(geo, mat);
    group.add(points);
    introStart = performance.now();
  }

  /* ---------- monogram fallback (no photo yet) ---------- */
  function buildPlaceholder() {
    var size = 520;
    var cnv = document.createElement("canvas");
    cnv.width = size;
    cnv.height = size;
    var ctx = cnv.getContext("2d");

    ctx.clearRect(0, 0, size, size);

    // glowing ring
    ctx.strokeStyle = "rgba(56,189,248,0.55)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // MK monogram with cyan→emerald gradient
    var grad = ctx.createLinearGradient(size * 0.2, size * 0.3, size * 0.8, size * 0.75);
    grad.addColorStop(0, "#38bdf8");
    grad.addColorStop(1, "#34d399");
    ctx.fillStyle = grad;
    ctx.font = "800 210px Exo, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MK", size / 2, size / 2 + 12);

    buildFromImage(cnv);
  }

  // prefer the transparent cutout, then a plain jpg, then the monogram
  var photo = new Image();
  photo.onload = function () { buildFromImage(photo); };
  photo.onerror = function () {
    var jpg = new Image();
    jpg.onload = function () { buildFromImage(jpg); };
    jpg.onerror = buildPlaceholder;
    jpg.src = "assets/profile.jpg";
  };
  photo.src = "assets/profile.png?v=2";

  /* ---------- interaction (mouse + touch, rotation only) ---------- */
  var targetRotX = 0, targetRotY = 0;
  var dragging = false, lastX = 0, lastY = 0;
  var hintHidden = false;

  function hideHint() {
    if (hintHidden) return;
    hintHidden = true;
    var hint = document.getElementById("canvasHint");
    if (hint) hint.style.opacity = "0";
  }

  function setFromPointer(clientX, clientY) {
    var rect = wrap.getBoundingClientRect();
    var nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    var ny = -(((clientY - rect.top) / rect.height) * 2 - 1); // Y inverted vs screen space
    targetRotY = nx * 0.55;
    targetRotX = -ny * 0.35;
  }

  wrap.addEventListener("pointermove", function (e) {
    if (prefersReducedMotion) return;
    hideHint();
    if (dragging) {
      targetRotY += (e.clientX - lastX) * 0.006;
      targetRotX += (e.clientY - lastY) * 0.004;
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      setFromPointer(e.clientX, e.clientY);
    }
  });
  wrap.addEventListener("pointerdown", function (e) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    if (wrap.setPointerCapture && e.pointerId !== undefined) {
      try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* no-op */ }
    }
  });
  window.addEventListener("pointerup", function () { dragging = false; });
  wrap.addEventListener("pointerleave", function () {
    if (!dragging) { targetRotX = 0; targetRotY = 0; }
  });
  wrap.addEventListener("touchmove", function (e) {
    if (prefersReducedMotion) return;
    e.preventDefault(); // scroll stays available outside the canvas card
    hideHint();
    var t = e.touches[0];
    setFromPointer(t.clientX, t.clientY);
  }, { passive: false });

  /* ---------- sizing ---------- */
  function resize() {
    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  /* ---------- render loop (paused offscreen / hidden tab) ---------- */
  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(wrap);
  }

  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  function animate(now) {
    requestAnimationFrame(animate);
    if (!visible || document.hidden) return;

    if (points) {
      // intro: scattered shell → portrait
      if (!introDone) {
        var t = Math.min((now - introStart) / INTRO_MS, 1);
        var k = easeOutCubic(t);
        var pos = points.geometry.attributes.position;
        for (var i = 0; i < pos.count * 3; i++) {
          pos.array[i] = origins[i] + (targets[i] - origins[i]) * k;
        }
        pos.needsUpdate = true;
        if (t >= 1) introDone = true;
      }

      // rotation follows pointer; gentle idle sway on top
      var idle = prefersReducedMotion ? 0 : Math.sin(now * 0.0004) * 0.03;
      group.rotation.y += (targetRotY + idle - group.rotation.y) * 0.06;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.06;
    }

    if (!prefersReducedMotion) stars.rotation.z += 0.0003;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();

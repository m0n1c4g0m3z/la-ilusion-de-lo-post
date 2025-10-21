let numLineas = 100;
let numPuntos = 80;
let offsets = [];
let time = 0;

let humanos = [];
let numHumanos = 200;

let viewX, viewY, viewW, viewH;

let modoPlaneta = false;
let planetaRotacion = 0;

let video;
let mostrarVideo = false;

// Variables de zoom táctil
let escala = 1;
let desplazamientoX = 0;
let desplazamientoY = 0;
let toqueInicialDist = null;
let escalaInicial = 1;
let toqueAnterior = null;

function preload() {
  video = createVideo('https://dl.dropboxusercontent.com/scl/fi/qwtenazm9o9any676tnp0/P9.mp4?rlkey=irt8duuq14k1z6o7e849jokl1&st=rixixehn');
  video.hide();
  video.elt.setAttribute('playsinline', ''); // para móviles
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-holder');
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    pixelDensity(1);
  }
  background(0);
  calcularVista();

  for (let i = 0; i < numLineas; i++) {
    offsets[i] = [];
    for (let j = 0; j < numPuntos; j++) {
      offsets[i][j] = random(1000);
    }
  }

  for (let i = 0; i < numHumanos; i++) {
    humanos.push(new Humano());
  }
}

function draw() {
  background(0);

  push();
  // Aplicar zoom y desplazamiento
  translate(width / 2 + desplazamientoX, height / 2 + desplazamientoY);
  scale(escala);
  translate(-width / 2, -height / 2);

  if (mostrarVideo) {
    let aspectRatio = video.width / video.height;
    let videoH = height;
    let videoW = videoH * aspectRatio;
    image(video, (width - videoW) / 2, 0, videoW, videoH);
  }

  if (!modoPlaneta) {
    dibujarOndasNormales();
    for (let h of humanos) {
      h.update();
      h.display();
    }
  } else {
    dibujarPlaneta();
    for (let h of humanos) {
      h.update();
      h.displaySobrePlaneta();
    }
  }

  pop();
  time += 0.01;
  planetaRotacion += 0.01;
}

function keyPressed() {
  if (key === ' ') {
    mostrarVideo = !mostrarVideo;
    if (mostrarVideo) {
      video.loop();
    } else {
      video.stop();
    }
  }

  if (keyCode === RIGHT_ARROW) modoPlaneta = true;
  if (keyCode === LEFT_ARROW) modoPlaneta = false;
}

function touchStarted() {
  modoPlaneta = !modoPlaneta;
  toqueAnterior = touches[0] ? { x: touches[0].x, y: touches[0].y } : null;
  return false;
}

function touchMoved(event) {
  if (touches.length === 2) {
    const dx = touches[0].x - touches[1].x;
    const dy = touches[0].y - touches[1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (toqueInicialDist == null) {
      toqueInicialDist = dist;
      escalaInicial = escala;
    } else {
      const factor = dist / toqueInicialDist;
      escala = constrain(escalaInicial * factor, 0.5, 4);
    }
    return false;
  } else if (touches.length === 1 && toqueAnterior) {
    desplazamientoX += touches[0].x - toqueAnterior.x;
    desplazamientoY += touches[0].y - toqueAnterior.y;
    toqueAnterior = { x: touches[0].x, y: touches[0].y };
    return false;
  }
  return false;
}

function touchEnded() {
  toqueInicialDist = null;
  toqueAnterior = null;
}

function doubleClicked() {
  escala = 1;
  desplazamientoX = 0;
  desplazamientoY = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (typeof calcularVista === 'function') {
    calcularVista(width, height);
  }
}

function calcularVista() {
  let windowRatio = width / height;
  let targetRatio = 9.0 / 16.0;

  if (windowRatio > targetRatio) {
    viewH = height;
    viewW = viewH * targetRatio;
    viewX = (width - viewW) / 2;
    viewY = 0;
  } else {
    viewW = width;
    viewH = viewW / targetRatio;
    viewX = 0;
    viewY = (height - viewH) / 2;
  }
}

function dibujarOndasNormales() {
  noFill();
  stroke(255, 140);
  strokeWeight(1.2);

  for (let i = 0; i < numLineas; i++) {
    beginShape();
    for (let j = 0; j < numPuntos; j++) {
      let x = map(j, 0, numPuntos, viewX + viewW * 0.1, viewX + viewW * 0.9);
      let yOffset = noise(offsets[i][j] + time) * 100 - 50;
      let y = map(i, 0, numLineas, viewY + viewH * 0.1, viewY + viewH * 0.9) + yOffset;
      y += sin(time * 0.05 + i * 0.1) * 15;
      curveVertex(x, y);
      offsets[i][j] += 0.01;
    }
    endShape();
  }
}

function dibujarPlaneta() {
  let cx = width / 2;
  let cy = height / 2;
  let r = min(viewW, viewH) * 0.4;

  noFill();
  stroke(100, 200, 255, 150);
  strokeWeight(1);

  for (let i = 0; i < numLineas; i++) {
    let lat = map(i, 0, numLineas, -HALF_PI, HALF_PI);
    beginShape();
    for (let j = 0; j < numPuntos; j++) {
      let lon = map(j, 0, numPuntos, -PI, PI);
      let x3d = cos(lon + planetaRotacion) * cos(lat);
      let y3d = sin(lat);
      let x = cx + r * x3d;
      let y = cy + r * y3d + noise(offsets[i][j] + time) * 10;
      curveVertex(x, y);
      offsets[i][j] += 0.01;
    }
    endShape();
  }

  noFill();
  stroke(255, 60);
  ellipse(cx, cy, r * 2, r * 2 * 0.95);
}

class Humano {
  constructor() {
    this.reset();
  }

  reset() {
    this.linea = int(random(numLineas));
    this.pos = random(1);
    this.speed = random(0.001, 0.005);
    this.c = color(random(255), random(255), random(255), 180);
    this.shapeType = int(random(3));
  }

  update() {
    this.pos += this.speed;
    if (this.pos > 1) this.reset();
  }

  display() {
    let j = int(this.pos * (numPuntos - 1));
    let x = map(j, 0, numPuntos, viewX + viewW * 0.1, viewX + viewW * 0.9);
    let yOffset = noise(offsets[this.linea][j] + time) * 100 - 50;
    let y = map(this.linea, 0, numLineas, viewY + viewH * 0.1, viewY + viewH * 0.9) + yOffset;
    y += sin(time * 0.05 + this.linea * 0.1) * 15;

    fill(this.c);
    noStroke();
    let s = 8;
    switch (this.shapeType) {
      case 0: ellipse(x, y, s, s); break;
      case 1: triangle(x, y - s / 2, x - s / 2, y + s / 2, x + s / 2, y + s / 2); break;
      case 2: ellipse(x, y, s * 0.6, s); break;
    }
  }

  displaySobrePlaneta() {
    let cx = width / 2;
    let cy = height / 2;
    let r = min(viewW, viewH) * 0.4;

    let j = int(this.pos * (numPuntos - 1));
    let lat = map(this.linea, 0, numLineas, -HALF_PI, HALF_PI);
    let lon = map(j, 0, numPuntos, -PI, PI);
    let x3d = cos(lon + planetaRotacion) * cos(lat);
    let y3d = sin(lat);
    let x = cx + r * x3d;
    let y = cy + r * y3d + noise(offsets[this.linea][j] + time) * 10;

    fill(this.c);
    noStroke();
    let s = 6;
    switch (this.shapeType) {
      case 0: ellipse(x, y, s, s); break;
      case 1: triangle(x, y - s / 2, x - s / 2, y + s / 2, x + s / 2, y + s / 2); break;
      case 2: ellipse(x, y, s * 0.6, s); break;
    }
  }
}

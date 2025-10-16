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

function preload() {
  video = createVideo('https://dl.dropboxusercontent.com/scl/fi/qwtenazm9o9any676tnp0/P9.mp4?rlkey=irt8duuq14k1z6o7e849jokl1&st=rixixehn');
  video.hide();
}

function setup() {
  createCanvas(405, 720);
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

  if (mostrarVideo) {
    let aspectRatio = video.width / video.height;
    let videoH = height;
    let videoW = videoH * aspectRatio;
    image(video, (width - videoW) / 2, 0, videoW, videoH);
  }

  if (!modoPlaneta) {
    dibujarOndasNormales();
    for (let s of humanos) {
      s.update();
      s.display();
    }
  } else {
    dibujarPlaneta();
    for (let s of humanos) {
      s.update();
      s.displaySobrePlaneta();
    }
  }

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

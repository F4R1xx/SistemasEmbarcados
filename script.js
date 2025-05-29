const broker = "test.mosquitto.org";
const port = 8081;
const topicStatus = "alarme/status";
const topicControl = "alarme/control";
const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);

const container = document.getElementById("container");
const statusSection = document.getElementById("status-section");
const statusText = document.getElementById("status-text");
const holoShield = document.getElementById("holo-shield");
const btnAtivar = document.getElementById("btn-ativar");
const btnDesativar = document.getElementById("btn-desativar");
const btnToggleLog = document.getElementById("btn-toggle-log");
const btnExport = document.getElementById("btn-export");
const logEl = document.getElementById("violations-log");

const soundAtivado = document.getElementById("sound-ativado");
const soundDesativado = document.getElementById("sound-desativado");
const soundAlarme = document.getElementById("sound-alarme");

let violations = [];
let isLogVisible = false;
let rippleCanvas, rippleCtx;
let rippleAnimationId;

function setupRippleCanvas() {
  rippleCanvas = document.getElementById('ripple-canvas');
  rippleCtx = rippleCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  rippleCanvas.width = window.innerWidth;
  rippleCanvas.height = window.innerHeight;
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = Math.max(window.innerWidth, window.innerHeight);
    this.alpha = 0.7;
  }

  draw(ctx) {
    if(this.alpha <= 0) return false;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = `rgba(255, 0, 0, ${this.alpha})`;
    ctx.lineWidth = 15;
    ctx.shadowColor = 'rgba(255,0,0,0.9)';
    ctx.shadowBlur = 20;
    ctx.stroke();
    this.radius += 10;
    this.alpha -= 0.02;
    return this.alpha > 0;
  }
}

let ripples = [];

function animateRipple() {
  rippleCtx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
  ripples = ripples.filter(ripple => ripple.draw(rippleCtx));
  if (ripples.length > 0) {
    rippleAnimationId = requestAnimationFrame(animateRipple);
  } else {
    rippleCanvas.style.display = 'none';
  }
}

function addRipple() {
  ripples.push(new Ripple(window.innerWidth/2, window.innerHeight/2));
  if (!rippleAnimationId) {
    rippleCanvas.style.display = 'block';
    animateRipple();
  }
}

function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {body});
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, {body});
      }
    });
  }
}

function addLogEntry(text) {
  const div = document.createElement('div');
  div.classList.add('log-entry');
  const timeSpan = document.createElement('span');
  timeSpan.classList.add('time');
  const now = new Date();
  timeSpan.textContent = now.toLocaleString();
  div.appendChild(timeSpan);
  div.appendChild(document.createTextNode(' - ' + text));
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  violations.push({ timestamp: now, message: text });
}

// Função para exportar log em TXT
function exportLogTXT() {
  if (violations.length === 0) {
    alert('Nenhuma violação para exportar.');
    return;
  }
  // Monta o conteúdo TXT com timestamp e mensagem
  let txtContent = "";
  violations.forEach(entry => {
    txtContent += `${entry.timestamp.toLocaleString()} - ${entry.message}\n`;
  });
  // Cria um blob e link para download
  const blob = new Blob([txtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "log_violacoes.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const client = new Paho.MQTT.Client(broker, port, clientId);

client.onConnectionLost = (responseObject) => {
  if (responseObject.errorCode !== 0) {
    console.log("Conexão perdida: " + responseObject.errorMessage);
    statusText.textContent = "Conexão perdida";
    container.classList.remove("ligado");
    container.classList.add("desligado");
  }
};

client.onMessageArrived = (message) => {
  const payload = message.payloadString;
  console.log("Mensagem recebida:", payload);

  if (payload === "ATIVADO") {
    statusText.textContent = "ATIVADO";
    container.classList.add("ligado");
    container.classList.remove("desligado");
    soundAtivado.play();
  } else if (payload === "DESATIVADO") {
    statusText.textContent = "DESATIVADO";
    container.classList.add("desligado");
    container.classList.remove("ligado");
    soundDesativado.play();
  } else if (payload.startsWith("Sistema violado")) {
    addRipple();
    addLogEntry(payload);
    showNotification("Alerta de Violação", payload);
    soundAlarme.play();
  }
};

client.connect({
  onSuccess: () => {
    console.log("Conectado ao broker");
    client.subscribe(topicStatus);
  },
  useSSL: true
});

btnAtivar.addEventListener("click", () => {
  const message = new Paho.MQTT.Message("ATIVADO");
  message.destinationName = topicControl;
  client.send(message);
});

btnDesativar.addEventListener("click", () => {
  const message = new Paho.MQTT.Message("DESATIVADO");
  message.destinationName = topicControl;
  client.send(message);
});

btnToggleLog.addEventListener("click", () => {
  isLogVisible = !isLogVisible;
  if(isLogVisible) {
    logEl.style.display = 'block';
    btnToggleLog.textContent = "Ocultar Log de Violações";
  } else {
    logEl.style.display = 'none';
    btnToggleLog.textContent = "Mostrar Log de Violações";
  }
  btnToggleLog.setAttribute('aria-expanded', isLogVisible);
});

btnExport.addEventListener("click", exportLogTXT);

setupRippleCanvas();


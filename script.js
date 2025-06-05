// Broker e tópicos MQTT
const broker = "test.mosquitto.org";
const port = 8081;
const topicStatus = "alarme/status";
const topicControl = "alarme/control";
const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);

// Elementos DOM
const container = document.getElementById("container");
const statusSection = document.getElementById("status-section");
const statusText = document.getElementById("status-text");
const holoShield = document.getElementById("holo-shield");
const btnAtivar = document.getElementById("btn-ativar");
const btnDesativar = document.getElementById("btn-desativar");
const btnToggleLog = document.getElementById("btn-toggle-log");
const btnExport = document.getElementById("btn-export");
const logEl = document.getElementById("violations-log");
const btnCloseLog = document.getElementById("btn-close-log");

// Sons
const soundAtivado = document.getElementById("sound-ativado");
const soundDesativado = document.getElementById("sound-desativado");
const soundAlarme = document.getElementById("sound-alarme");

let violations = [];
let isLogVisible = false;

// Configuração do cliente MQTT com Keep Alive maior
const client = new Paho.MQTT.Client(broker, port, clientId);

// Variável para controlar o número de tentativas de reconexão
let reconnectAttempts = 0;

// Função de reconexão
function reconnectMQTT() {
  console.log(`Tentando reconectar ao broker... Tentativa ${reconnectAttempts + 1}`);
  statusText.textContent = "Reconectando..."; // Atualiza a mensagem de status para "Reconectando"
  
  client.connect({
    onSuccess: () => {
      console.log("Reconectado ao broker");
      reconnectAttempts = 0; // Reseta a contagem de tentativas de reconexão
      client.subscribe(topicStatus);
      statusText.textContent = "Conectado"; // Atualiza para "Conectado" quando a conexão for bem-sucedida
      container.classList.add("ligado");
      container.classList.remove("desligado");
    },
    onFailure: (error) => {
      console.log(`Falha na reconexão: ${error.errorMessage}`);
      reconnectAttempts++;
      setTimeout(reconnectMQTT, 5000); // Tenta reconectar a cada 5 segundos
    },
    useSSL: true,
    keepAliveInterval: 60 // Intervalo de keep alive aumentado
  });
}

// Conexão perdida
client.onConnectionLost = (responseObject) => {
  if (responseObject.errorCode !== 0) {
    console.log("Conexão perdida: " + responseObject.errorMessage);
    statusText.textContent = "Conexão perdida"; // Atualiza para "Conexão perdida"
    container.classList.remove("ligado");
    container.classList.add("desligado");
    reconnectMQTT(); // Inicia o processo de reconexão
  }
};

// Mensagens recebidas
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
    addLogEntry(payload);
    showNotification("Alerta de Violação", payload);
    soundAlarme.play();
  }
};

// Conectar ao MQTT
client.connect({
  onSuccess: () => {
    console.log("Conectado ao broker");
    client.subscribe(topicStatus);
    statusText.textContent = "Conectado"; // Exibe "Conectado" após a conexão inicial ser bem-sucedida
    container.classList.add("ligado");
    container.classList.remove("desligado");
  },
  useSSL: true,
  keepAliveInterval: 60 // Intervalo de keep alive aumentado
});

// Função para ativar o sistema
btnAtivar.addEventListener("click", () => {
  const message = new Paho.MQTT.Message("ATIVADO");
  message.destinationName = topicControl;
  client.send(message);
});

// Função para desativar o sistema
btnDesativar.addEventListener("click", () => {
  const message = new Paho.MQTT.Message("DESATIVADO");
  message.destinationName = topicControl;
  client.send(message);
});

// Função para mostrar/ocultar o log de violações
btnToggleLog.addEventListener("click", () => {
  if (logEl.style.display === "none" || logEl.style.display === "") {
    logEl.style.display = "block";
    btnToggleLog.textContent = "Ocultar Log de Violações";
    btnToggleLog.setAttribute('aria-expanded', 'true');
  } else {
    logEl.style.display = "none";
    btnToggleLog.textContent = "Mostrar Log de Violações";
    btnToggleLog.setAttribute('aria-expanded', 'false');
  }
});

// Função para fechar o log de violações
btnCloseLog.addEventListener("click", () => {
  logEl.style.display = "none";
  btnToggleLog.textContent = "Mostrar Log de Violações";
  btnToggleLog.setAttribute('aria-expanded', 'false');
});

// Função para adicionar entrada no log
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

// Função para exportar log em formato TXT
function exportLogTXT() {
  if (violations.length === 0) {
    alert('Nenhuma violação para exportar.');
    return;
  }
  let txtContent = "";
  violations.forEach(entry => {
    txtContent += `${entry.timestamp.toLocaleString()} - ${entry.message}\n`;
  });
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

// Função para mostrar notificações do navegador
function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
}

// Inicialização da animação do ripple
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
    if (this.alpha <= 0) return false;
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

setupRippleCanvas();

// Reconectar automaticamente ao cliente MQTT quando a página voltar a ser visível
document.addEventListener("visibilitychange", function() {
  if (!document.hidden) {
    reconnectMQTT();
  }
});

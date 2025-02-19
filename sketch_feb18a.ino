#define TRIG_PIN 9
#define ECHO_PIN 10
#define LED_PIN 6
#define POT_PIN A0

void setup() {
    Serial.begin(9600);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    // Leitura do Potenciômetro
    int potValue = analogRead(POT_PIN);
    int distanceThreshold = map(potValue, 0, 1023, 5, 100); 

    // Medir distância com HC-SR04
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    long duration = pulseIn(ECHO_PIN, HIGH);
    int distance = duration * 0.034 / 2; 

    // Exibe os valores no Serial Monitor
    Serial.print("Distancia: ");
    Serial.print(distance);
    Serial.print(" cm | Limite: ");
    Serial.print(distanceThreshold);

    // Testa se o LED deveria acender
    if (distance > 0 && distance <= distanceThreshold) {
        int brilho = map(distance, 0, distanceThreshold, 255, 0);
        analogWrite(LED_PIN, brilho); // Controla a intensidade
        Serial.print(" | LED Ligado: "); 
        Serial.println(brilho);
    } else {
        analogWrite(LED_PIN, 0);
        Serial.println(" | LED Desligado");
    }

    delay(100);
}
class Audio{
    constructor(posX, posY ,freq ,wave_type){
        this.started = false;
        this.audioCtx = new AudioContext();
        this.listener = this.audioCtx.listener;
        this.listener.positionX.value = 0;
        this.listener.positionY.value = -5;
        this.listener.positionZ.value = 0;

        this.listener.forwardX.value = 0;
        this.listener.forwardY.value = 1;
        this.listener.forwardZ.value = 0;
        this.listener.upX.value = 0;
        this.listener.upY.value = 0;
        this.listener.upZ.value = 1;

        this.panner = new PannerNode(this.audioCtx, {
            panningModel: "HRTF",
            distanceModel: "inverse",
            refDistance: 1,
            rolloffFactor: 1,
            positionX: posX,
            positionY: posY,
            positionZ: 0
        });

        this.gain_node = this.audioCtx.createGain();
        this.gain_node.gain.value = 0;

        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = wave_type;
        this.oscillator.frequency.value = freq;

        this.oscillator.connect(this.panner);
        this.panner.connect(this.gain_node);
        this.gain_node.connect(this.audioCtx.destination);
    }
    start(){
        if (this.audioCtx.state === "suspended"){
            this.audioCtx.resume();
        }
        if(!this.started){
            this.oscillator.start();
            this.started = true;
        }        
        this.gain_node.gain.value = 1;
    }
    stop(){
        this.gain_node.gain.value = 0;
    }
    update_freq(freq){
        this.oscillator.frequency.value = freq;
    }
}

const reset_btn = document.getElementById("reset_btn");
const mouse_pos = document.getElementById("mouse_pos");
const target_pos = document.getElementById("target_pos");
const mouse_marker = document.getElementById("mouse_marker");
const target_marker = document.getElementById("target_marker");
const distance_txt = document.getElementById("distance");
const scale_txt = document.getElementById("scale");
const history_list = document.getElementById("history_list");

let score_history = [];

const scale_ratio = 10;
var scale = 1;
var game_over = false;
var real_mouse_posX = 0;
var real_mouse_posY = 0;
const mouse_audio = new Audio(0,0,440,"square");

const window_width = 200;
const window_height = 200;
var real_target_posX = rand_int(-window_width/2 * 0.8, window_width/2 * 0.8);
var real_target_posY = rand_int(window_height * 0.2, window_height * 0.8);
const target_audio = new Audio(real_target_posX, real_target_posY, 440, "square");

function rand_int(min ,max){
    return Math.floor(Math.random() * (max-min)) + min;
}

function update_UI() {
    mouse_marker.style.display = "block";
    target_marker.style.display = game_over ? "block" : "none";

    const screenX_mouse = (real_mouse_posX + window_width / 2) / window_width * window.innerWidth;
    const screenY_mouse = (real_mouse_posY - window_height) / -window_height * window.innerHeight;

    const screenX_target = (real_target_posX + window_width / 2) / window_width * window.innerWidth;
    const screenY_target = (real_target_posY - window_height) / -window_height * window.innerHeight;

    mouse_marker.style.left = screenX_mouse + "px";
    mouse_marker.style.top = screenY_mouse + "px";
    target_marker.style.left = screenX_target + "px";
    target_marker.style.top = screenY_target + "px";

    const dx = real_mouse_posX - real_target_posX;
    const dy = real_mouse_posY - real_target_posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    distance_txt.innerText = `Distance: ${distance.toFixed(2)}`;
    scale_txt.innerText = `🔍 Audio Scale: ${scale.toFixed(2)}x`;

    // 只顯示滑鼠與目標的邏輯座標
    mouse_pos.innerText = `Mouse XY: [${real_mouse_posX.toFixed(0)}, ${real_mouse_posY.toFixed(0)}]`;
    target_pos.innerText = `Target XY: [${real_target_posX.toFixed(0)}, ${real_target_posY.toFixed(0)}]`;
}

reset_btn.addEventListener("click", () => {
    scale = 1;
    real_mouse_posX = 0;
    real_mouse_posY = 0;
    
    const newTargetX = rand_int(-window_width / 2 * 0.8, window_width / 2 * 0.8);
    const newTargetY = rand_int(window_height * 0.2, window_height * 0.8);
    
    target_audio.panner.positionX.value = newTargetX;
    target_audio.panner.positionY.value = newTargetY;
    real_target_posX = newTargetX;
    real_target_posY = newTargetY;
    
    mouse_audio.panner.positionX.value = 0;
    mouse_audio.panner.positionY.value = 0;
    
    reset_btn.style.display = "none";
    update_UI();
    game_over = false;
});

window.addEventListener("mousemove", (e) => {
    if(game_over) return;
    const x = (e.clientX / window.innerWidth) * window_width - window_width / 2;
    const y = (e.clientY / window.innerHeight) * -window_height + window_height;

    real_mouse_posX = x;
    real_mouse_posY = y;
    mouse_audio.panner.positionX.value = real_target_posX + (x - real_target_posX) * scale;
    mouse_audio.panner.positionY.value = real_target_posY + (y - real_target_posY) * scale;

    update_UI();
});

var key_pressed = "";
window.addEventListener('keydown', (event) => {
    if(key_pressed === event.code) return;
    
    key_pressed = event.code;
    if (event.code === "KeyA") {
        target_audio.stop();
        mouse_audio.start();
        setTimeout(() => {
            mouse_audio.stop();
            key_pressed = "";
        } ,300);
    }
    else if(event.code === "KeyS"){
        mouse_audio.stop();
        target_audio.start();
        setTimeout(() => {
            target_audio.stop();
            key_pressed = "";
        }, 300);
    }
});

window.addEventListener('click', function (event) {
    if (game_over || event.target.id === "reset_btn") return;

    game_over = true;
    reset_btn.style.display = "block";

    const dx = real_mouse_posX - real_target_posX;
    const dy = real_mouse_posY - real_target_posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    score_history.unshift(distance.toFixed(2));

    if (score_history.length > 5) score_history.pop();

    update_history_display();
    update_UI();
});

function update_history_display() {
    history_list.innerHTML = score_history.map((s, index) => {
        const opacity = 1 - (index * 0.15);
        return `<div style="opacity: ${opacity}">#${score_history.length - index} — <span style="color: #fbbf24">${s}</span></div>`;
    }).join("");
}

window.addEventListener("wheel", (event) => {
    event.preventDefault();
    if(event.deltaY < 0){
        mouse_audio.panner.positionX.value = target_audio.panner.positionX.value + (mouse_audio.panner.positionX.value - target_audio.panner.positionX.value) * scale_ratio;
        mouse_audio.panner.positionY.value = target_audio.panner.positionY.value + (mouse_audio.panner.positionY.value - target_audio.panner.positionY.value) * scale_ratio;
        scale *= scale_ratio;
    }
    else {
        mouse_audio.panner.positionX.value = target_audio.panner.positionX.value + (mouse_audio.panner.positionX.value - target_audio.panner.positionX.value) / scale_ratio;
        mouse_audio.panner.positionY.value = target_audio.panner.positionY.value + (mouse_audio.panner.positionY.value - target_audio.panner.positionY.value) / scale_ratio;
        scale /= scale_ratio;
    }
    update_UI();
});

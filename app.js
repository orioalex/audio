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

const mouse_pos = document.getElementById("mouse_pos");
const target_pos = document.getElementById("target_pos");
const mouse_audio_pos = document.getElementById("mouse_audio_pos");
const target_audio_pos = document.getElementById("target_audio_pos");
const mouse_marker = document.getElementById("mouse_marker");
const target_marker = document.getElementById("target_marker");
const scale_txt = document.getElementById("scale");
const scale_ratio = 2;
var scale = 1;
var real_mouse_posX = 0;
var real_mouse_posY = 0;
const mouse_audio = new Audio(0,0,440,"square");

const real_target_posX = rand_int(-20, 20);
const real_target_posY = rand_int(80, 120);
const target_audio = new Audio(real_target_posX, real_target_posY, 440, "square");

function rand_int(min ,max){
    return Math.floor(Math.random() * (max-min)) + min;
}

function update_UI() {
    mouse_marker.style.display = "block";
    target_marker.style.display = "block";

    const screenX_mouse = (real_mouse_posX + 100) / 200 * window.innerWidth;
    const screenY_mouse = (real_mouse_posY - 200) / -200 * window.innerHeight;

    const screenX_target = (real_target_posX + 100) / 200 * window.innerWidth;
    const screenY_target = (real_target_posY - 200) / -200 * window.innerHeight;

    mouse_marker.style.left = screenX_mouse + "px";
    mouse_marker.style.top = screenY_mouse + "px";

    target_marker.style.left = screenX_target + "px";
    target_marker.style.top = screenY_target + "px";

    scale_txt.innerText = `scale: ${scale.toFixed(2)}`;
    mouse_pos.innerText = `mouse position X: ${real_mouse_posX.toFixed(2)}  Y: ${real_mouse_posY.toFixed(2)}  Z: 0.00`;
    target_pos.innerText = `target position X: ${real_target_posX.toFixed(2)}  Y: ${real_target_posY.toFixed(2)}  Z: 0.00`;
    mouse_audio_pos.innerText = `mouse audio position X: ${mouse_audio.panner.positionX.value.toFixed(2)}  Y: ${mouse_audio.panner.positionY.value.toFixed(2)}  Z: 0.00`;
    target_audio_pos.innerText = `target audio position X: ${target_audio.panner.positionX.value.toFixed(2)}  Y: ${target_audio.panner.positionY.value.toFixed(2)}  Z: 0.00`;
}

window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 200 - 100;
    const y = (e.clientY / window.innerHeight) * -200 + 200;

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
    //alert("mouse clicked");
    mouse_pos.innerText = `mouse X: ${real_mouse_posX.toFixed(2)}  Y: ${real_mouse_posY.toFixed(2) }  Z: 0.00`;
    target_pos.innerText = `target X: ${real_target_posX.toFixed(2)}  Y: ${real_target_posY.toFixed(2)}  Z: 0.00`;
});

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

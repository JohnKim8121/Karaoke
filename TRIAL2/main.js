import { SuperpoweredGlue, SuperpoweredWebAudio } from './Superpowered.js';

const states = { NOTRUNNING: 'START', INITIALIZING: 'INITIALIZING', RUNNING: 'STOP' }

var state = states.NOTRUNNING;
var webaudioManager = null; // The SuperpoweredWebAudio helper class managing Web Audio for us.
var Superpowered = null; // Reference to the Superpowered module.
var audioNode = null;    // This example uses one audio node only.

function setState(newState) {
    state = newState;
    document.getElementById('btn').innerText = state;
}

function onMessageFromAudioScope(message) {
    console.log('Message received from the audio node: ' + message);
}

// when the button is clicked
async function toggleAudio() {
    if (state == states.NOTRUNNING) {
        setState(states.INITIALIZING);
        webaudioManager = new SuperpoweredWebAudio(48000, Superpowered, {
            latencyHint: 'playback',
            processorOptions: {
                bufferSize: 32  // Minimum possible buffer size
            }
        });

        let micStream = await webaudioManager.getUserMediaForAudioAsync({ 
            'fastAndTransparentAudio': true,
            'echoCancellation': false,
            'noiseSuppression': false,
            'autoGainControl': false,
            'latency': 0.001    // Request minimum latency (1ms)
        });
        if (!micStream) return;

        let currentPath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        audioNode = await webaudioManager.createAudioNodeAsync(currentPath + '/processor.js', 'MyProcessor', onMessageFromAudioScope);
        
        // Optimize the audio graph
        let audioInput = webaudioManager.audioContext.createMediaStreamSource(micStream);
        audioInput.connect(audioNode);
        audioNode.connect(webaudioManager.audioContext.destination);
        
        // Force the audio context to resume with minimum latency
        await webaudioManager.audioContext.resume();
        setState(states.RUNNING);
    } else if (state == states.RUNNING) {
        // stop everything
        webaudioManager.audioContext.close();
        webaudioManager = audioNode = null;
        setState(states.NOTRUNNING);
    }
}

async function loadJS() {
    // download and instantiate Superpowered
    Superpowered = await SuperpoweredGlue.Instantiate('ExampleLicenseKey-WillExpire-OnNextUpdate');

    // UI: innerHTML may be ugly but keeps this example small
    document.getElementById('content').innerHTML = '\
        <p>Put on your headphones first, you\'ll be deaf due audio feedback otherwise.</p>\
        <p id="audioStack" style="font-style: italic"></p>\
        <p><button id="btn">-</button></p>\
        <p>Reverb wet: <input type="range" min="0" max="100" value="50" class="reverbslider" id="wet"></p>\
        <p>Filter frequency: <input type="range" min="0" max="100" value="50" class="filterslider" id="freq"></p>\
    ';

    document.getElementById('audioStack').innerText = window.AudioWorkletNode ? 'worklet' : 'legacy';
    document.getElementById('btn').onclick = toggleAudio;
    document.getElementById('wet').oninput = function() {
        if (audioNode != null) audioNode.sendMessageToAudioScope({ 'wet': this.value });
    }
    document.getElementById('freq').oninput = function() {
        if (audioNode != null) audioNode.sendMessageToAudioScope({ 'freq': this.value });
    }

    setState(states.NOTRUNNING);
}

async function initAudio() {
    const audioContext = new AudioContext({
        latencyHint: 'interactive', // Set to lowest safe latency
        sampleRate: 48000, // Optimal sample rate for most systems
    });
    
    // Rest of the function remains the same...
}

loadJS();

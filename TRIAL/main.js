import { SuperpoweredGlue, SuperpoweredWebAudio } from '..//Superpowered.js';

const states = { NOTRUNNING: 'START', INITIALIZING: 'INITIALIZING', RUNNING: 'STOP' }

var state = states.NOTRUNNING;
var webaudioManager = null;
var Superpowered = null;
var audioNode = null;

function setState(newState) {
    state = newState;
    const btn = document.getElementById('btn');
    btn.innerText = state;
    
    // Update button appearance
    if (state === states.RUNNING) {
        btn.classList.add('running');
    } else {
        btn.classList.remove('running');
    }
}

function onMessageFromAudioScope(message) {
    console.log('Message received from the audio node: ' + message);
}

// when the button is clicked
async function toggleAudio() {
    if (state == states.NOTRUNNING) {
        setState(states.INITIALIZING);
        webaudioManager = new SuperpoweredWebAudio(48000, Superpowered);

        console.log('Requesting microphone access...');
        const constraints = {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                channelCount: 1,
                sampleRate: 48000,
                latency: 0.01,
                deviceId: undefined
            }
        };

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const microphones = devices.filter(device => device.kind === 'audioinput');
            
            console.log('Available audio input devices:', microphones);
            
            // Try to find the built-in microphone
            const builtInMic = microphones.find(mic => 
                mic.label.toLowerCase().includes('built-in') || 
                mic.label.toLowerCase().includes('internal')
            );
            
            if (builtInMic) {
                console.log('Selected microphone:', builtInMic.label);
                constraints.audio.deviceId = { exact: builtInMic.deviceId };
            }

            let micStream = await webaudioManager.getUserMediaForAudioAsync(constraints)
            .catch((error) => {
                console.log(error);
                setState(states.NOTRUNNING);
            });
            if (!micStream) {
                console.error('Failed to get microphone stream');
                return;
            }
            console.log('Microphone stream acquired successfully');

            let currentPath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
            audioNode = await webaudioManager.createAudioNodeAsync(currentPath + '/processor.js', 'MyProcessor', onMessageFromAudioScope);
            
            // Verify audio context state
            console.log('AudioContext state:', webaudioManager.audioContext.state);
            
            // Set up optimized audio context
            const audioContext = webaudioManager.audioContext;
            audioContext.latencyHint = 'interactive';
            
            let audioInput = audioContext.createMediaStreamSource(micStream);
            console.log('Audio input created from microphone stream');

            // Simplified real-time chain
            const inputGain = audioContext.createGain();
            inputGain.gain.value = 2.0;  // Increased input gain

            // Main gain
            const mainGain = audioContext.createGain();
            mainGain.gain.value = 35.0;   // Increased main gain

            // Verify audio connections
            console.log('Setting up audio connections...');
            
            // Minimal processing chain for real-time
            audioInput
                .connect(inputGain)
                .connect(mainGain)
                .connect(audioNode);
            
            audioNode.connect(audioContext.destination);
            console.log('Audio connections completed');

            setState(states.RUNNING);
            console.log('Audio system initialized and running');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setState(states.NOTRUNNING);
        }
    } else if (state == states.RUNNING) {
        console.log('Stopping audio system...');
        webaudioManager.audioContext.close();
        webaudioManager = audioNode = null;
        setState(states.NOTRUNNING);
    }
}

// Handle volume changes
function updateVolume(value) {
    if (audioNode != null) {
        const normalizedValue = value / 100; // Convert to 0-1 range
        audioNode.sendMessageToAudioScope({ 'volume': normalizedValue });
    }
}

async function loadJS() {
    // download and instantiate Superpowered
    Superpowered = await SuperpoweredGlue.Instantiate('ExampleLicenseKey-WillExpire-OnNextUpdate');

    // Check if we have microphone permissions
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        console.log('Microphone permission status:', permissionStatus.state);
    } catch (error) {
        console.log('Unable to check microphone permissions:', error);
    }

    // Set up event listeners
    document.getElementById('btn').onclick = toggleAudio;
    document.getElementById('volume').oninput = function() {
        updateVolume(this.value);
    }

    setState(states.NOTRUNNING);
}

loadJS();
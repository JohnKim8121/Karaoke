export class SuperpoweredHandler {
    constructor() {
        this.licenseKey = 'ExampleLicenseKey-WillExpire-OnNextUpdate';
        this.audioContext = null;
        this.processor = null;
        this.microphoneStream = null;
        this.microphoneSource = null;
        this.microphoneActive = false;
        this.setupEffectControls();
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 'playback',
                sampleRate: 48000
            });

            await this.audioContext.audioWorklet.addModule('superpowered/processor.js');
            this.processor = new AudioWorkletNode(this.audioContext, 'MyProcessor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                channelCount: 2,
                processorOptions: {
                    sampleRate: this.audioContext.sampleRate,
                    bufferSize: 32
                }
            });

            this.processor.connect(this.audioContext.destination);
            return true;
        } catch (error) {
            console.error('Superpowered initialization failed:', error);
            return false;
        }
    }

    async startMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    latency: 0.001
                }
            });

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.microphoneStream = stream;
            this.microphoneSource = this.audioContext.createMediaStreamSource(stream);
            
            // Make sure processor exists and is properly initialized
            if (!this.processor) {
                await this.initialize();
            }
            
            // Connect to processor's first input
            this.microphoneSource.connect(this.processor);
            this.microphoneActive = true;
            return true;
        } catch (error) {
            console.error('Failed to start microphone:', error);
            return false;
        }
    }

    stopMicrophone() {
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            if (this.microphoneSource) {
                this.microphoneSource.disconnect();
            }
            this.microphoneActive = false;
        }
    }

    setupEffectControls() {
        const mixerControls = document.querySelector('.mixer-controls');
        if (!mixerControls.querySelector('#wet')) {
            mixerControls.insertAdjacentHTML('beforeend', `
                <div class="effect-slider">
                    <label>Reverb</label>
                    <input type="range" id="wet" min="0" max="100" value="50">
                </div>
                <div class="effect-slider">
                    <label>Filter</label>
                    <input type="range" id="freq" min="0" max="100" value="50">
                </div>
            `);
        }

        document.getElementById('wet').oninput = (e) => {
            if (this.processor) {
                this.processor.port.postMessage({ wet: e.target.value });
            }
        };

        document.getElementById('freq').oninput = (e) => {
            if (this.processor) {
                this.processor.port.postMessage({ freq: e.target.value });
            }
        };
    }

    isMicrophoneActive() {
        return this.microphoneActive;
    }
}

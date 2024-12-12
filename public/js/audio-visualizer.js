export class AudioVisualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.analyser = null;
        this.dataArray = null;
        this.isActive = false;
    }

    initialize(audioContext) {
        try {
            if (!audioContext) {
                throw new Error('Audio context is required');
            }
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            
            this.isActive = true;
            this.draw();
        } catch (error) {
            console.error('Failed to initialize audio visualizer:', error);
            throw error;
        }
    }

    draw() {
        if (!this.isActive) return;

        requestAnimationFrame(() => this.draw());

        this.analyser.getByteFrequencyData(this.dataArray);
        
        this.ctx.fillStyle = 'rgb(0, 0, 0)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < this.dataArray.length; i++) {
            barHeight = this.dataArray[i] / 2;

            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#3498db');
            gradient.addColorStop(1, '#2980b9');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    connect(source) {
        source.connect(this.analyser);
        this.analyser.connect(source.context.destination);
    }

    stop() {
        this.isActive = false;
    }
}


class MyProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.volume = 1.0;
        console.log('Simple Audio processor initialized');
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (input.length === 0) {
            return true; // No input to process
        }

        const inputChannel = input[0];
        const outputChannel = output[0];

        for (let i = 0; i < inputChannel.length; i++) {
            outputChannel[i * 2] = inputChannel[i] * this.volume;       // Left channel
            outputChannel[i * 2 + 1] = inputChannel[i] * this.volume;   // Right channel
        }

        return true;
    }
}

registerProcessor('MyProcessor', MyProcessor);

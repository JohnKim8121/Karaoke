import { AudioVisualizer } from './audio-visualizer.js';
import { SuperpoweredHandler } from './superpowered-handler.js';
import { YouTubeHandler } from './youtube-handler.js';

class App {
    constructor() {
        this.superpowered = new SuperpoweredHandler();
        this.youtube = new YouTubeHandler();
        this.visualizer = new AudioVisualizer();
        this.init();
    }

    async init() {
        try {
            await this.superpowered.initialize();
            this.youtube.initialize(() => this.setupAudioRouting());
            this.setupEventListeners();
            this.setupTabSystem();
            this.setupMicButton();
            this.setupVoiceSearch();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupEventListeners() {
        // Add click handler for initial audio context
        document.addEventListener('click', async () => {
            try {
                if (!this.superpowered.audioContext) {
                    await this.superpowered.initialize();
                } else if (this.superpowered.audioContext.state === 'suspended') {
                    await this.superpowered.audioContext.resume();
                }
                console.log('Audio context state:', this.superpowered.audioContext.state);
            } catch (error) {
                console.error('Failed to initialize/resume audio context:', error);
            }
        }, { once: true });

        console.log('Debug: Setting up event listeners');
    }

    async setupAudioRouting() {
        if (!this.superpowered.audioContext) {
            console.warn('Audio context not initialized yet');
            return;
        }
        
        if (!this.youtube.player) {
            console.warn('YouTube player not initialized yet');
            return;
        }

        console.log('Audio routing setup complete');
    }

    setupTabSystem() {
        const tabs = document.querySelectorAll('.tab');
        const sections = document.querySelectorAll('.content-section');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and sections
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding section
                tab.classList.add('active');
                const sectionId = `${tab.dataset.tab}-section`;
                document.getElementById(sectionId).classList.add('active');
            });
        });
    }

    setupVoiceSearch() {
        const voiceSearchButton = document.getElementById('mic-button');
        if (voiceSearchButton) {
            voiceSearchButton.addEventListener('click', () => {
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.onresult = (event) => {
                    const query = event.results[0][0].transcript;
                    document.getElementById('search-input').value = query;
                    this.youtube.searchVideos(query);
                };
                recognition.start();
            });
        }
    }

    setupMicButton() {
        const micButton = document.getElementById('toggle-mic');
        if (micButton) {
            micButton.addEventListener('click', async () => {
                if (this.superpowered.isMicrophoneActive()) {
                    this.superpowered.stopMicrophone();
                    micButton.classList.remove('active');
                } else {
                    const started = await this.superpowered.startMicrophone();
                    if (started) {
                        micButton.classList.add('active');
                    }
                }
            });
        }
    }
}

// Initialize app after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
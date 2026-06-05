type SoundName =
    | 'footstep'
    | 'lightning'
    | 'hit'

export class AudioManager {
    private sounds = new Map<SoundName, HTMLAudioElement>()
    private backgroundMusic: HTMLAudioElement | null = null
    private lastPlayed = new Map<SoundName, number>()
    // private audioCtx: AudioContext | null = null

    loadAudioAssets(): void {

        this.load('lightning', '/sounds/lightning.wav')
        this.load('hit', '/sounds/hit.wav')
        this.loadBackgroundMusic()
    }

    private load(name: SoundName, path: string): void {
        const audio = new Audio(path)

        audio.preload = 'auto'
        audio.volume = 0.2
        if (name === 'footstep') {
            audio.volume = 0.1
        }

        this.sounds.set(name, audio)
    }

    loadBackgroundMusic(): void {
        this.backgroundMusic = new Audio('/sounds/background-music.mp3')
        this.backgroundMusic.loop = true
        this.backgroundMusic.volume = 0.08
    }

    toggleMusic(): void {
        if (!this.backgroundMusic) {
            return
        }
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().catch(() => { })
        } else {
            this.backgroundMusic.pause()
        }
    }

    playMusic(): void {
        this.backgroundMusic?.play().catch(() => { })
    }

    play(name: SoundName): void {
        const now = performance.now()

        const lastTime = this.lastPlayed.get(name) ?? 0

        if (name === 'footstep' && now - lastTime < 120) {
            return
        }

        const source = this.sounds.get(name)

        if (!source) {
            return
        }

        const sound = source.cloneNode() as HTMLAudioElement //clone is used to allow multiple sound plays at the same time

        sound.volume = source.volume

        sound.play().catch(() => {
            // browser autoplay protection
        })
    }

    /* playBeatTick(): void {
         try {
             if (!this.audioCtx) {
                 const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                 if (AudioContextClass) {
                     this.audioCtx = new AudioContextClass()
                 }
             }
 
             if (!this.audioCtx) {
                 return
             }
 
             if (this.audioCtx.state === 'suspended') {
                 this.audioCtx.resume()
             }
 
             const now = this.audioCtx.currentTime
 
             const osc = this.audioCtx.createOscillator()
             const gainNode = this.audioCtx.createGain()
 
             osc.connect(gainNode)
             gainNode.connect(this.audioCtx.destination)
 
             osc.type = 'triangle'
             // High frequency at start for a crisp click, sliding down
             osc.frequency.setValueAtTime(1000, now)
             osc.frequency.exponentialRampToValueAtTime(300, now + 0.03)
 
             // Extremely quick decay
             gainNode.gain.setValueAtTime(0.25, now)
             gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
 
             osc.start(now)
             osc.stop(now + 0.05)
         } catch (e) {
             console.error('Failed to play synthesized beat tick:', e)
         }
     } */

}

export const audioManager = new AudioManager()

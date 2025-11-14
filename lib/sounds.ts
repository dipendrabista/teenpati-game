// Sound utility for game audio effects

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private ambientSound: HTMLAudioElement | null = null;
  private ambientEnabled: boolean = true;
  private masterVolume: number = 0.5;
  private ambientLevel: number = 0.15; // base ambient loudness (0-1)
  private ambientDuck: boolean = false;
  private categoryLevels: Record<string, number> = {
    actions: 1.0,
    turn: 1.0,
    chips: 1.0,
    cards: 1.0,
    ui: 1.0,
    flow: 1.0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      // Load setting from localStorage
      const savedSetting = localStorage.getItem('soundEnabled');
      this.enabled = savedSetting !== 'false';
      
      const ambientSetting = localStorage.getItem('ambientEnabled');
      this.ambientEnabled = ambientSetting !== 'false';

      const savedVol = localStorage.getItem('volume');
      if (savedVol) {
        const v = parseFloat(savedVol);
        if (!Number.isNaN(v)) this.masterVolume = Math.max(0, Math.min(1, v));
      }
      const savedAmbientLevel = localStorage.getItem('ambientLevel');
      if (savedAmbientLevel) {
        const v = parseFloat(savedAmbientLevel);
        if (!Number.isNaN(v)) this.ambientLevel = Math.max(0, Math.min(1, v));
      }
      const savedDuck = localStorage.getItem('ambientDuck');
      if (savedDuck) {
        this.ambientDuck = savedDuck === 'true';
      }
      // Load category levels
      ['actions','turn','chips','cards','ui','flow'].forEach((cat) => {
        const key = `vol_${cat}`;
        const v = localStorage.getItem(key);
        if (v !== null) {
          const f = parseFloat(v);
          if (!Number.isNaN(f)) this.categoryLevels[cat] = Math.max(0, Math.min(1, f));
        }
      });
    }
  }

  // Initialize sound
  private getSound(name: string, src: string): HTMLAudioElement {
    if (!this.sounds.has(name)) {
      const audio = new Audio(src);
      audio.volume = this.masterVolume;
      this.sounds.set(name, audio);
    }
    return this.sounds.get(name)!;
  }

  // Play sound
  play(soundName: keyof typeof SOUNDS) {
    if (!this.enabled) return;
    
    try {
      const sound = this.getSound(soundName, SOUNDS[soundName]);
      // Apply category gain
      const cat = SOUND_TO_CATEGORY[soundName] || 'ui';
      sound.volume = Math.max(0, Math.min(1, this.masterVolume * (this.categoryLevels[cat] ?? 1)));
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore play errors (e.g., user hasn't interacted with page yet)
      });
    } catch (error) {
      console.warn('Sound play failed:', error);
    }
  }

  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', this.enabled.toString());
    }
    return this.enabled;
  }

  // Check if sound is enabled
  isEnabled() {
    return this.enabled;
  }

  // Set volume (0-1)
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('volume', this.masterVolume.toString());
    }
    this.updateAllVolumes();
    if (this.ambientSound) {
      this.ambientSound.volume = this.getEffectiveAmbientVolume();
    }
  }

  getVolume() {
    return this.masterVolume;
  }

  setAmbientLevel(level: number) {
    this.ambientLevel = Math.max(0, Math.min(1, level));
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambientLevel', this.ambientLevel.toString());
    }
    if (this.ambientSound) {
      this.ambientSound.volume = this.getEffectiveAmbientVolume();
    }
  }

  getAmbientLevel() {
    return this.ambientLevel;
  }

  setAmbientDuck(duck: boolean) {
    this.ambientDuck = !!duck;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambientDuck', this.ambientDuck.toString());
    }
    if (this.ambientSound) {
      this.ambientSound.volume = this.getEffectiveAmbientVolume();
    }
  }

  private getEffectiveAmbientVolume(): number {
    const duckFactor = this.ambientDuck ? 0.4 : 1.0;
    return Math.max(0, Math.min(1, this.ambientLevel * this.masterVolume * duckFactor));
  }

  setCategoryLevel(category: string, level: number) {
    this.categoryLevels[category] = Math.max(0, Math.min(1, level));
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vol_${category}`, this.categoryLevels[category].toString());
    }
    this.updateAllVolumes();
  }

  getCategoryLevel(category: string): number {
    return this.categoryLevels[category] ?? 1.0;
  }

  private updateAllVolumes() {
    this.sounds.forEach((sound, name) => {
      const cat = SOUND_TO_CATEGORY[name as keyof typeof SOUNDS] || 'ui';
      sound.volume = Math.max(0, Math.min(1, this.masterVolume * (this.categoryLevels[cat] ?? 1)));
    });
  }

  applyMixerPreset(preset: 'quiet' | 'balanced' | 'focus') {
    const presets: Record<string, { actions:number; turn:number; chips:number; ui:number; cards:number; flow:number; ambient:number; }> = {
      quiet:    { actions: 0.5, turn: 0.7, chips: 0.3, ui: 0.3, cards: 0.4, flow: 0.4, ambient: 0.08 },
      balanced: { actions: 0.9, turn: 1.0, chips: 0.6, ui: 0.5, cards: 0.8, flow: 0.7, ambient: 0.15 },
      focus:    { actions: 0.8, turn: 1.0, chips: 0.4, ui: 0.3, cards: 0.6, flow: 0.5, ambient: 0.10 },
    };
    const p = presets[preset];
    if (!p) return;
    this.categoryLevels.actions = p.actions;
    this.categoryLevels.turn = p.turn;
    this.categoryLevels.chips = p.chips;
    this.categoryLevels.ui = p.ui;
    this.categoryLevels.cards = p.cards;
    this.categoryLevels.flow = p.flow;
    if (typeof window !== 'undefined') {
      Object.entries(this.categoryLevels).forEach(([k, v]) => localStorage.setItem(`vol_${k}`, v.toString()));
      localStorage.setItem('ambientLevel', p.ambient.toString());
    }
    this.ambientLevel = p.ambient;
    this.updateAllVolumes();
    if (this.ambientSound) {
      this.ambientSound.volume = this.getEffectiveAmbientVolume();
    }
  }

  // Start ambient background music
  startAmbient() {
    if (!this.ambientEnabled || typeof window === 'undefined') return;

    if (!this.ambientSound) {
      // Create a simple ambient tone using Web Audio API
      // For production, you'd use an actual ambient sound file
      this.ambientSound = new Audio();
      this.ambientSound.loop = true;
      this.ambientSound.volume = this.getEffectiveAmbientVolume(); // Quiet background
      
      // Using a data URI for a simple ambient tone
      // In production, replace with: this.ambientSound.src = '/sounds/casino-ambiance.mp3';
      this.ambientSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
    }

    // Fade in
    this.ambientSound.volume = 0;
    this.ambientSound.play().catch(() => {
      // Autoplay might be blocked, that's okay
    });
    
    // Gradually increase volume
    let currentVolume = 0;
    const fadeIn = setInterval(() => {
      if (currentVolume < this.getEffectiveAmbientVolume()) {
        currentVolume += 0.01;
        if (this.ambientSound) {
          this.ambientSound.volume = currentVolume;
        }
      } else {
        clearInterval(fadeIn);
      }
    }, 100);
  }

  // Stop ambient background music
  stopAmbient() {
    if (!this.ambientSound) return;

    // Fade out
    const fadeOut = setInterval(() => {
      if (this.ambientSound && this.ambientSound.volume > 0.01) {
        this.ambientSound.volume -= 0.01;
      } else {
        if (this.ambientSound) {
          this.ambientSound.pause();
          this.ambientSound.currentTime = 0;
        }
        clearInterval(fadeOut);
      }
    }, 50);
  }

  // Toggle ambient sound
  toggleAmbient() {
    this.ambientEnabled = !this.ambientEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ambientEnabled', this.ambientEnabled.toString());
    }
    
    if (this.ambientEnabled) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
    
    return this.ambientEnabled;
  }

  // Check if ambient is enabled
  isAmbientEnabled() {
    return this.ambientEnabled;
  }
}

// Sound file paths (using data URIs for basic sounds or external URLs)
const SOUNDS = {
  // Card sounds
  cardFlip: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ==',
  dealCards: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ==',
  
  // Chip sounds
  chipBet: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==',
  chipCollect: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==',
  
  // UI sounds
  buttonClick: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==',
  hover: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==',
  error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVEREREREQ=',
  
  // Game flow sounds
  gameStart: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
  roundStart: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
  playerJoin: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
  allReady: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
  
  // Action sounds
  raise: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
  call: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==',
  show: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ==',
  fold: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVEREREREQ=',
  
  // Outcome sounds
  victory: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///8=',
  win: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///8=',
  lose: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVEREREREQ=',
  
  // Notifications
  yourTurn: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
  countdown: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==',
  timeout: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVEREREREQ=',
  notification: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4A==',
};

const SOUND_TO_CATEGORY: Record<keyof typeof SOUNDS, string> = {
  cardFlip: 'cards',
  dealCards: 'cards',
  chipBet: 'chips',
  chipCollect: 'chips',
  buttonClick: 'ui',
  hover: 'ui',
  error: 'ui',
  gameStart: 'flow',
  roundStart: 'flow',
  playerJoin: 'flow',
  allReady: 'flow',
  raise: 'actions',
  call: 'actions',
  show: 'actions',
  fold: 'actions',
  victory: 'flow',
  win: 'flow',
  lose: 'flow',
  yourTurn: 'turn',
  countdown: 'turn',
  timeout: 'turn',
  notification: 'turn',
};

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (typeof window === 'undefined') {
    // Return a dummy manager for SSR
    return {
      play: () => {},
      toggle: () => true,
      isEnabled: () => true,
      setVolume: () => {},
      startAmbient: () => {},
      stopAmbient: () => {},
      toggleAmbient: () => true,
      isAmbientEnabled: () => true,
    } as unknown as SoundManager;
  }

  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

// Convenience functions
export const playSound = (soundName: keyof typeof SOUNDS) => {
  getSoundManager().play(soundName);
};

export const toggleSound = () => {
  return getSoundManager().toggle();
};

export const isSoundEnabled = () => {
  return getSoundManager().isEnabled();
};

export const setVolume = (v: number) => {
  getSoundManager().setVolume(v);
};

export const getVolume = () => {
  return getSoundManager().getVolume();
};

export const startAmbient = () => {
  getSoundManager().startAmbient();
};

export const stopAmbient = () => {
  getSoundManager().stopAmbient();
};

export const toggleAmbient = () => {
  return getSoundManager().toggleAmbient();
};

export const isAmbientEnabled = () => {
  return getSoundManager().isAmbientEnabled();
};

export const setAmbientLevel = (v: number) => {
  getSoundManager().setAmbientLevel(v);
};

export const getAmbientLevel = () => {
  return getSoundManager().getAmbientLevel();
};

export const setAmbientDuck = (duck: boolean) => {
  getSoundManager().setAmbientDuck(duck);
};

export const setCategoryLevel = (cat: string, v: number) => {
  getSoundManager().setCategoryLevel(cat, v);
};

export const getCategoryLevel = (cat: string) => {
  return getSoundManager().getCategoryLevel(cat);
};

export const applyMixerPreset = (preset: 'quiet' | 'balanced' | 'focus') => {
  getSoundManager().applyMixerPreset(preset);
};

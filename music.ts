/// <reference path="lib/jquery.d.ts" />
enum GameSoundState {
    MENU,
    PLAYING,
}

module soundplayer {

    export var menumusic: HTMLAudioElement
    export var creating_solution_music: HTMLAudioElement
    export var box_ground_crash: HTMLAudioElement
    export var grab_box: HTMLAudioElement
    export var grab_toolbox_element: HTMLAudioElement
    export var ground_crash: HTMLAudioElement
    export var level_success: HTMLAudioElement
    export var move_crane: HTMLAudioElement
    export var play_stop: HTMLAudioElement
    export var put_box: HTMLAudioElement
    export var put_toolbox_element: HTMLAudioElement
    export var wall_crash: HTMLAudioElement
    export var smoke_sound: HTMLAudioElement
    var audio_types: string[]
    var val: number
    var audio: HTMLAudioElement
    export var sound_play_state: GameSoundState
    var sounds: HTMLAudioElement[]
    var allsounds: HTMLAudioElement[]
    var music: any
    var sound: any
    var mE: string
    var sE: string

    export function init() {
        this.audio_types = ["audio/mpeg", "audio/ogg"]
        this.audio = new Audio()
        this.soundplayer_play_state = GameSoundState.MENU
        this.mE = "musicEnabled"
        this.sE = "soundEnabled"

        for (this.val = 0; this.val < this.audio_types.length; this.val++) {
            if (this.audio.canPlayType(this.audio_types[this.val]) == "probably" || this.audio.canPlayType(this.audio_types[this.val]) == "maybe") {
                this.menumusic = new Audio('sounds/music/menu.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.creating_solution_music = new Audio('sounds/music/creating_solution_music.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.box_ground_crash = new Audio('sounds/sfx/box_ground_crash.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.grab_box = new Audio('sounds/sfx/grab_box.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.grab_toolbox_element = new Audio('sounds/sfx/grab_toolbox_element.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.ground_crash = new Audio('sounds/sfx/ground_crash.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.level_success = new Audio('sounds/sfx/level_success.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.move_crane = new Audio('sounds/sfx/move_crane.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.play_stop = new Audio('sounds/sfx/play_stop.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.put_box = new Audio('sounds/sfx/put_box.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.put_toolbox_element = new Audio('sounds/sfx/put_toolbox_element.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.wall_crash = new Audio('sounds/sfx/wall_crash.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.smoke_sound = new Audio('sounds/sfx/smoke_sound.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'))
                this.soundplayers = [this.move_crane, this.grab_box, this.ground_crash, this.box_ground_crash]
                this.allsounds = [this.move_crane, this.grab_box, this.ground_crash, this.box_ground_crash, this.grab_toolbox_element, this.level_success, this.play_stop, this.put_box, this.put_toolbox_element, this.wall_crash, this.smoke_sound]
                //setting volume
                this.menumusic.volume = 0.25
                this.creating_solution_music.volume = 0.25
                for (var i = 0; i < this.allsounds.length; i++) {
                    this.allsounds[i].playbackRate = 1.5
                }
                this.val = this.audio_types.length
            }
        }
        this.initialized = true

        this.music = JSON.parse(dataSaver.getData(this.mE))
        this.sound = JSON.parse(dataSaver.getData(this.sE))

        if (this.music == null || this.music.enabled)
            this.enableMusic()
        else
            this.disableMusic()

        if (this.sound == null || this.sound.enabled)
            this.enableSound()
        else
            this.disableSound()

        this.menumusic.addEventListener('ended', function () {
            this.currentTime = 0;
            try {
                this.play();
            } catch (ex) {
                console.error(ex.message);
            }
        }, false);

        this.creating_solution_music.addEventListener('ended', function () {
            this.currentTime = 0;
            try {
                this.play();
            } catch (ex) {
                console.error(ex.message);
            }
        });
    }

    export function togglePlaySpeed(fast: boolean): void {
        if (fast)
            this.setPlaySpeed(1.5)
        else
            this.setPlaySpeed(2.25)
    }

    export function setPlaySpeed(speed: number): void {
        for (var i = 0; i < this.soundplayers.length; i++) {
            this.soundplayers[i].playbackRate = speed;
        }
    }

    export function updateSound(): void {
        if (this.soundplayer_play_state == GameSoundState.MENU) {
            try {
                this.creating_solution_music.pause();
                this.menumusic.play();
            } catch (ex) {
                console.error(ex.message);
            }
        } else {
            try {
                this.menumusic.pause();
                this.creating_solution_music.play();
            } catch (ex) {
                console.error(ex.message);
            }
        }
    }

    export function toggleMusic(): void {
        if (this.music.enabled) {
            $('#music').css('background-image', 'url(gfx/music_disabled.png)');
            this.music.enabled = false
            this.menumusic.volume = 0
            this.creating_solution_music.volume = 0
        } else {
            $('#music').css('background-image', 'url(gfx/music_enabled.png)');
            this.music.enabled = true
            this.menumusic.volume = 0.5
            this.creating_solution_music.volume = 0.5
        }
        dataSaver.saveData(this.mE, JSON.stringify(this.music));
    }

    export function toggleSound(): void {
        if (this.sound.enabled) {
            $('#sound').css('background-image', 'url(gfx/sound_disabled.png)')
            this.sound.enabled = false
            for (var i = 0; i < this.allsounds.length; i++) {
                this.allsounds[i].volume = 0
            }
        } else {
            $('#sound').css('background-image', 'url(gfx/sound_enabled.png)')
            this.sound.enabled = true
            for (var i = 0; i < this.allsounds.length; i++) {
                this.allsounds[i].volume = 1
            }
        }
        dataSaver.saveData(this.sE, JSON.stringify(this.sound))
    }

    export function enableMusic(): void {
        $('#music').css('background-image', 'url(gfx/music_enabled.png)')
        this.music = {
            enabled: true
        }
        dataSaver.saveData(this.mE, JSON.stringify(this.music))
        this.menumusic.volume = 0.5
        this.creating_solution_music.volume = 0.5
    }

    export function disableMusic(): void {
        $('#music').css('background-image', 'url(gfx/music_disabled.png)')
        this.music = {
            enabled: false
        }
        dataSaver.saveData(this.mE, JSON.stringify(this.music));
        this.menumusic.volume = 0
        this.creating_solution_music.volume = 0
    }

    export function enableSound(): void {
        $('#sound').css('background-image', 'url(gfx/sound_enabled.png)')
        this.sound = {
            enabled: true
        }
        dataSaver.saveData(this.sE, JSON.stringify(this.music))
        for (var i = 0; i < this.allsounds.length; i++) {
            this.allsounds[i].volume = 1
        }
    }

    export function disableSound(): void {
        $('#sound').css('background-image', 'url(gfx/sound_disabled.png)')
        this.sound = {
            enabled: false
        }
        dataSaver.saveData(this.sE, JSON.stringify(this.music))
        for (var i = 0; i < this.allsounds.length; i++) {
            this.allsounds[i].volume = 0
        }
    }
}
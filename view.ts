/** View (MVC) */
/// <reference path="music.ts" />

// The Gameplay-View is in this module.
// But the "Animation" is in "animation.ts".
module view {

    var __views: IView[] = new Array();

    // must be deferred so that the html document is ready.
    export var CREDITS: ICreditsView = null
    export var MAIN_MENU: IMainMenuView = null
    export var LEVEL_PACK: ILevelPackView = null
    export var GAMEPLAY: IGameplayView = null

    export function init() {
        // This simply loads this module and goes to the "main menu" (= list of level packs)
        // This is deferred so that the DOM is ready for the binding.
        CREDITS = new CreditsView()
        MAIN_MENU = new MainMenuView()
        LEVEL_PACK = new LevelPackView()
        GAMEPLAY = new GameplayView()
        switchTo(MAIN_MENU)
    }

    export interface IView {
        setVisible(visibility: boolean)
        get(id: string): HTMLElement
    }

    interface IBinding {
        /** Same as [id:string], but typed. */
        get(id: string): HTMLElement
        bind(): void;
    }

    /*abstract*/
    class Binding implements IBinding {
        // Specialisations of Binding must:
        // 1: define fields in this form:
        //   private foo : HTMLElement = null;
        //   it will bind element with id "foo" to this.foo as HTMLElement.
        // 2: call bind() AFTER the constructor!
        //    var binding = new SomeBinding()
        //    binding.bind();

        private __bound: boolean = false;
        bind(): IBinding {
            var id: string;
            for (id in this) {
                if (this[id] === null) { //all, but "get" and "__bound"
                    if (!(this[id] = document.getElementById(id)))
                        throw 'ERROR: No Binding-Element with id "' + id + '"';
                }
            }
            this.__bound = true;
            return this;
        }

        get(id: string): HTMLElement {
            return <HTMLElement>this[id];
        }
    }

    /* abstract */
    class View implements IView {
        element: HTMLElement;
        // specialized Views should have a field "binding" : IBinding
        constructor() {
            __views.push(this);
        }
        setVisible(visibility: boolean) {
            this.element.style.display = visibility ? 'block' : 'none';
        }
        get(id: string): HTMLElement {
            return this['binding'].get(id)
        }

        /*abstract*/
        update(o: obs.IObservable, arg?: any) {
            //should be overwritten by spezialised class
        }
    }

    export function switchTo(view: IView) {
        __views.forEach((v) => {
            v.setVisible(v == view)
        });
        window.scrollTo(0, 0);
    }

    class CreditsBinding extends Binding {
        public bind(): CreditsBinding {
            super.bind()
            return this
        }
        public close_credits: HTMLElement = null
        public link_fhnw: HTMLElement = null
    }

    export interface ICreditsView extends IView {
        setOnCloseHandler(callback: ctrl.IClickHandler)
        setLanguage(en: boolean)
    }

    class CreditsView extends View implements ICreditsView {
        private binding: CreditsBinding;
        constructor() {
            super();
            this.element = document.getElementById('credits')
            this.binding = new CreditsBinding().bind()

            // translation:
            shims.setTextContent(<HTMLSpanElement>this.binding.close_credits.querySelector('span'),
                translate.credits.getText('close')
            )

            this.binding.close_credits.onclick = (ev) => {
                history.pushState({
                    state: 1
                }, "Main", "?state=1")
                animation.animateCredits('#scaledViewport', () => this.onClose(ev))
            }

        }
        private onClose: ctrl.IClickHandler = function (e) {
            console.log("Click handler not set yet!");
        };
        public setOnCloseHandler(callback: ctrl.IClickHandler) {
            this.onClose = callback
        }
        public setLanguage(en: boolean) {

        }
    }

    class MainMenuBinding extends Binding {
        public bind(): MainMenuBinding {
            super.bind()
            return this
        }
        public main_menu_header: HTMLElement = null
        public main_menu_rating: HTMLElement = null
        public show_credits: HTMLElement = null

        public pack_tutorial: HTMLDivElement = null
        public pack_easy: HTMLDivElement = null
        public pack_medium: HTMLDivElement = null
        public pack_hard: HTMLDivElement = null
        public pack_crazy: HTMLDivElement = null
        public pack_impossible: HTMLDivElement = null

        public getStar(pack: number): HTMLImageElement {
            return <HTMLImageElement>this.getPacks()[pack].querySelector('img')
        }

        public getPacks(): HTMLDivElement[] {
            return new Array(
                this.pack_tutorial,
                this.pack_easy,
                this.pack_medium,
                this.pack_hard,
                this.pack_crazy,
                this.pack_impossible
            );
        }
    }

    export interface IMainMenuView extends IView {
        setClickHandler(callback: ctrl.IClickHandler)
        /** Set the state (filled/empty) of the star of one lavel pack. */
        setStar(pack: number, filled: boolean)
        /** Set the total amount of stars earned. */
        setRating(num: number)
        setLanguageHandler(callback: (language: string) => any)
        setCreditsHandler(callback: ctrl.IClickHandler)
    }

    class MainMenuView extends View implements IMainMenuView {
        private binding: MainMenuBinding
        private callback: ctrl.IClickHandler = function (e) {
            console.log("Click handler not set yet!")
        };
        setLanguage = function (l: string) {
            console.log("Click handler not set yet!")
        };
        onCredits: ctrl.IClickHandler = function () {
            console.log("Click handler not set yet!")
        };
        public setLanguageHandler(callback: (language: string) => any) {
            this.setLanguage = callback
        }
        public setCreditsHandler(callback: ctrl.IClickHandler) {
            this.onCredits = callback
        }

        constructor() {
            super();
            this.element = document.getElementById('main_menu')
            this.binding = new MainMenuBinding().bind()

            this.binding.getPacks().forEach((v) => {
                v.onclick = (e: MouseEvent) => {
                    history.pushState({
                        state: 2
                    }, "LevelPack", "?state=2")
                    this.callback(e)
                }
            });

            // translation:


            shims.setTextContent(this.binding.main_menu_header, translate.main_menu.getText('level packs'))
            var click2play = translate.main_menu.getText('click2play')
            this.binding.getPacks().forEach((v) => {
                v.className += " shake"
                shims.setTextContent(<HTMLParagraphElement>v.querySelector('p'), click2play)
            })

            this.binding.show_credits.onclick = (ev) => {
                history.pushState({
                    state: 4
                }, "Credits", "?state=4")
                animation.animateCredits('#scaledViewport', () => this.onCredits(ev))
            }

            shims.setTextContent(this.binding.show_credits, translate.credits.getText('show'))
        }

        public setClickHandler(_cb: ctrl.IClickHandler) {
            this.callback = _cb
        }

        public setStar(pack: number, filled: boolean) {
            this.binding.getStar(pack).src = filled ? 'gfx/Star_Filled.png' : 'gfx/Star_Empty.png'
        }

        public setRating(num: number) {
            shims.setTextContent(<HTMLElement>this.binding.main_menu_rating.querySelector('span'), "" + num)
        }
    }

    class LevelPackBinding extends Binding {
        public bind(): LevelPackBinding {
            super.bind()
            return this
        }
        /*
        Some of the bound nodes are created as clones of one existing prototype node.
        Note that the numbers of the 6 levels per level pack go from 0 to 5.
        */

        public level_pack: HTMLDivElement = null
        public level_pack_title: HTMLDivElement = null
        public level_pack_rating: HTMLDivElement = null

        public level_0: HTMLDivElement = null
        public level_1: HTMLDivElement = null
        public level_2: HTMLDivElement = null
        public level_3: HTMLDivElement = null
        public level_4: HTMLDivElement = null
        public level_5: HTMLDivElement = null

        public back_to_main: HTMLDivElement = null

        public go_left: HTMLDivElement = null
        public go_right: HTMLDivElement = null

        /** 
        The DIV-node that links to a level.
        nr: 0 to 5 (left to right, top to bottom) 
        */
        public getLevel(nr: number): HTMLDivElement {
            return this["level_" + nr]
        }
        /** 
        The DIV-node that is a pile of crates.
        _level: 0 to 5 (left to right, top to bottom) 
        _pile: 0 to 7 (left to right) 
        */
        public getPile(_level: number, _pile: number): HTMLDivElement {
            var level_formation = <HTMLDivElement>this.getLevel(_level).querySelector("div.level_formation")
            var piles = level_formation.querySelectorAll("div.level_formation > div")
            return <HTMLDivElement>piles.item(_pile)
        }
        /** 
        The DIV-node that is that crate.
        _level: 0 to 5 (left to right, top to bottom) 
        _pile: 0 to 7 (left to right) 
        _crate: 0 to 5 (bottom to top)
        */
        public getCrate(_level: number, _pile: number, _crate: number): HTMLDivElement {
            var nodes = this.getPile(_level, _pile).querySelectorAll('div')
            // 5 stands for the index of the top crate (0 to 5, bottom to top).
            return <HTMLDivElement>nodes.item(5 - _crate)
        }

        public setTitle(nr: number, title: string): void {
            // It's the only <span>-node, so:
            var element = <HTMLSpanElement>this.getLevel(nr).querySelector("span")
            shims.setTextContent(element, title)
        }
        /** Gets one image that displays a star. */
        public getStar(_level: number, star: number): HTMLImageElement {
            var lvl = this.getLevel(_level)
            return <HTMLImageElement>lvl.querySelector('div > div:last-child > img:nth-child(' + star + ')')
        }
    }

    export interface ILevelPackView extends IView {
        setClickHandler(_cb: ctrl.IClickHandler): void
        setBackToMain(_cb: ctrl.IClickHandler): void
        setLevelPack(pack: level.ILevelPack)
        setStars(_level: number, star: number)
        setTotalStars(stars: number)
        setGoLeft(_cb: ctrl.IClickHandler)
        setGoRight(_cb: ctrl.IClickHandler)
    }

    /** Clone the prototype pile 7 times to get 8 piles. */
    function initLevelFormation(e: HTMLElement) {
        var level_formation = e.querySelector('div.level_formation')
        var div = level_formation.querySelector('div > div')
        for (var i = 1; i < conf.getMaxPlatforms(); i++)
            level_formation.insertBefore(div.cloneNode(true), div.nextSibling)
    }

    class LevelPackView extends View implements ILevelPackView {
        private callback: ctrl.IClickHandler = function (e) {
            console.log("Click handler not set yet!")
        }
        private back2main: ctrl.IClickHandler = function (e) {
            console.log("Click handler not set yet!")
        }
        private goLeft: ctrl.IClickHandler = function (e) {
            console.log("Click handler not set yet!")
        }
        private goRight: ctrl.IClickHandler = function (e) {
            console.log("Click handler not set yet!")
        }
        private binding: LevelPackBinding
        private pack: level.ILevelPack
        private sp: any = null
        private ep: any = null
        constructor() {
            super()
            this.element = document.getElementById('level_pack')
            // before the binding can be done we need to insert all level selectors.
            // level_0 is the prototype for level_1 to level_5.
            var lvl0 = document.getElementById("level_0")

            initLevelFormation(lvl0)

            for (var nr = 1; nr < 6; nr++) {
                var lvlX = <HTMLElement>lvl0.cloneNode(true)
                lvlX.id = "level_" + nr;
                lvlX.attributes['data-nr'].value = nr
                lvl0.parentNode.appendChild(lvlX)
            }
            this.binding = new LevelPackBinding().bind()

            for (var nr = 0; nr < 6; nr++) {
                this.binding.setTitle(nr, "Title of Level " + nr)
                this.binding.getLevel(nr).onclick = (me: MouseEvent) => {
                    history.pushState({
                        state: 3
                    }, "Gameplay", "?state=3")
                    this.callback(me)
                    soundplayer.sound_play_state = GameSoundState.PLAYING;
                    soundplayer.updateSound()
                };
            }

            this.binding.back_to_main.addEventListener('click', (e) => {
                history.pushState({
                    state: 1
                }, "Main", "?state=1")
                this.back2main(e)
            });

            // translation:
            shims.setTextContent(<HTMLSpanElement>this.binding.back_to_main.querySelector('span'),
                translate.level_pack.getText('back')
            )

            this.binding.go_left.onclick = (ev: MouseEvent) => {
                this.goLeft(ev)
            }

            this.binding.go_right.onclick = (ev: MouseEvent) => {
                this.goRight(ev)
            }

            this.binding.level_pack.ontouchstart = (ev: TouchEvent) => {
                this.sp = {
                    x: ev.touches[0].pageX,
                    y: ev.touches[0].pageY
                }
            }

            this.binding.level_pack.ontouchmove = (ev: TouchEvent) => {
                if ((this.sp.x - ev.touches[0].pageX) > 80 || (this.sp.x - ev.touches[0].pageX) < -80) {
                    this.ep = {
                        x: ev.touches[0].pageX,
                        y: ev.touches[0].pageY
                    }
                }
            }

            this.binding.level_pack.ontouchend = (ev: TouchEvent) => {
                if (this.ep != null) {
                    var x = this.ep.x - this.sp.x
                    if (x < 0) {
                        this.goRight(ev)
                        this.ep = null
                    } else {
                        this.goLeft(ev)
                        this.ep = null
                    }
                }
            }
        }

        public setLevelPack(pack: level.ILevelPack) {
            this.pack = pack
            shims.setTextContent(this.binding.level_pack_title, pack.getIdName())
            pack.getLevels().forEach((lvl, nr) => {
                var div = this.binding.getLevel(nr)
                this.binding.setTitle(nr, lvl.getTitle())
                lvl.getInitialFormation().forEach(
                    (pile, p) => {
                        this.binding.getPile(nr, p).style.display = 'inline-block'
                        pile.forEach(
                            (crate, c) => {
                                if (crate)
                                    this.binding.getCrate(nr, p, c).className = 'crate_' + crate
                                else // empty string => no crate
                                    this.binding.getCrate(nr, p, c).className = 'crate_none'
                            }
                        )
                        for (var c = pile.length; c < conf.getMaxCrateHeight(); c++) {
                            this.binding.getCrate(nr, p, c).className = 'crate_none'
                        }
                    }
                )
                for (var p = lvl.getInitialFormation().length; p < conf.getMaxPlatforms(); p++) {
                    this.binding.getPile(nr, p).style.display = 'none'
                }
            })

            this.binding.go_left.style.visibility = pack !== level.TUTORIALS ? 'visible' : 'hidden'
            this.binding.go_right.style.visibility = pack !== level.IMPOSSIBLE ? 'visible' : 'hidden'
        }

        public setClickHandler(_cb: ctrl.IClickHandler) {
            this.callback = _cb
        }

        public setBackToMain(_cb: ctrl.IClickHandler) {
            this.back2main = _cb
        }

        public setGoLeft(_cb: ctrl.IClickHandler) {
            this.goLeft = _cb
        }

        public setGoRight(_cb: ctrl.IClickHandler) {
            this.goRight = _cb
        }

        public setStars(_level: number, stars: number) {
            [1, 2, 3].forEach((i) => {
                this.binding.getStar(_level, i).src =
                    stars >= i ? 'gfx/Star_Filled.png' : 'gfx/Star_Empty.png'
            })
        }

        public setTotalStars(stars: number) {
            shims.setTextContent(<HTMLElement>this.binding.level_pack_rating.querySelector('span'),
                "" + stars)
        }
    }

    export interface IGameplayView extends IView {
        setVisible(visibility: boolean);
        /** Inject function for drag-event. */
        setOnDragHandler(h: ctrl.IOnDragHandler)
        /** Inject function for drop-event. */
        setOnDropHandler(h: ctrl.IOnDropHandler)
        /** Inject function for play/stop-click-event. */
        setOnPlayClickHandler(h: ctrl.IClickHandler)
        /** Inject function for menu-click-event. */
        setOnMenuClickHandler(h: ctrl.IClickHandler)
        /** Inject function for hints-click-event. */
        setOnHintsClickHandler(h: ctrl.IClickHandler)
        /** Inject function for replay-click-event. This can be done when the level was won. */
        setOnReplayClickHandler(h: ctrl.IClickHandler)
        /** Inject function for next-click-event. This can be done when the level was won. */
        setOnNextClickHandler(h: ctrl.IClickHandler)
        /** Inject function for fast/slow-click-event. */
        setOnFastClickHandler(h: ctrl.IClickHandler)
        /** Inject function for step-click-event. */
        setOnStepClickHandler(h: ctrl.IClickHandler)
        /** Inject function for hint-click-event. */
        setOnHideHintHandler(h: ctrl.IClickHandler)
        /** Inject function for button-clear-event. */
        setOnModalClearClickHandler(h: ctrl.IClickHandler)
        /** Inject function for button-cancel-event. */
        setOnModalCancelClickHandler(h: ctrl.IClickHandler)
        /** Inject function for clear-toolbox-event. */
        setOnClearClickHandler(h: ctrl.IClickHandler)
        /**/
        setOnForceStopHandler(h: ctrl.IClickHandler)
        getRegister(prog: number, reg: number): HTMLElement
        getRegisters(prog?: number): HTMLElement[]
        loadLevel(lvl: level.ILevel)
        centerModal(element?: any)
        showHint(id: string, text: string)
        id_hint_el: string
        hideHints();
        /** play = green / !play = stop = red */
        setPlayButtonState(play: boolean)
        /** active = fast / !active = slow */
        setFastButtonState(active: boolean)
        // "Step" button has no state!
        /** Callable Indicator to check if "drag and drop" is allowed.
        True when Drag and Drop operations are allowed. */
        setDnDAllowedIndicator(f: () => boolean)
        /** Display or hide the "You Got It"-message. 
            A rating of "4" is 3 stars and it's better than the best known solution.
        */
        setYouGotItState(visible: boolean, rating?: number): void
    }

    class GameplayBinding extends Binding {
        public bind(): GameplayBinding {
            super.bind()
            return this
        }

        public custom_modal_btn_cancel_div: HTMLElement = null
        public custom_modal_btn_clear_div: HTMLElement = null
        public custom_modal: HTMLElement = null

        public gameplay: HTMLElement = null
        public level_title: HTMLElement = null
        public btn_hints: HTMLImageElement = null
        // this is part of #gameplay, the is also a #btn_menu_2:
        public btn_menu_1: HTMLImageElement = null
        public goal: HTMLElement = null
        public goal_title: HTMLElement = null

        public btn_fast: HTMLImageElement = null
        public btn_step: HTMLImageElement = null
        public controls: HTMLElement = null
        public you_got_it_1: HTMLElement = null
        public you_got_it_title: HTMLElement = null

        public star_1: HTMLImageElement = null
        public star_2: HTMLImageElement = null
        public star_3: HTMLImageElement = null

        public shortest_solution: HTMLParagraphElement = null
        public unknown_solution: HTMLParagraphElement = null

        public you_got_it_2: HTMLElement = null
        public btn_next: HTMLImageElement = null
        public btn_replay: HTMLImageElement = null
        // this is part of #you_got_it_2, the is also a #btn_menu_1:
        public btn_menu_2: HTMLImageElement = null

        public level_info: HTMLElement = null
        public toolbox: HTMLElement = null
        public tool_right: HTMLElement = null
        public tool_grab: HTMLElement = null
        public tool_left: HTMLElement = null
        public tool_prog1: HTMLElement = null
        public tool_prog2: HTMLElement = null
        public tool_prog3: HTMLElement = null
        public tool_prog4: HTMLElement = null
        public tool_blue: HTMLElement = null
        public tool_red: HTMLElement = null
        public tool_green: HTMLElement = null
        public tool_yellow: HTMLElement = null
        public tool_empty: HTMLElement = null
        public tool_nonempty: HTMLElement = null
        public btn_clear: HTMLElement = null

        public prog_1: HTMLElement = null
        public prog_1_label: HTMLElement = null
        public reg_1_0: HTMLElement = null
        public reg_1_1: HTMLElement = null
        public reg_1_2: HTMLElement = null
        public reg_1_3: HTMLElement = null
        public reg_1_4: HTMLElement = null
        public reg_1_5: HTMLElement = null
        public reg_1_6: HTMLElement = null
        public reg_1_7: HTMLElement = null

        public prog_2: HTMLElement = null
        public prog_2_label: HTMLElement = null
        public reg_2_0: HTMLElement = null
        public reg_2_1: HTMLElement = null
        public reg_2_2: HTMLElement = null
        public reg_2_3: HTMLElement = null
        public reg_2_4: HTMLElement = null
        public reg_2_5: HTMLElement = null
        public reg_2_6: HTMLElement = null
        public reg_2_7: HTMLElement = null

        public prog_3: HTMLElement = null
        public prog_3_label: HTMLElement = null
        public reg_3_0: HTMLElement = null
        public reg_3_1: HTMLElement = null
        public reg_3_2: HTMLElement = null
        public reg_3_3: HTMLElement = null
        public reg_3_4: HTMLElement = null
        public reg_3_5: HTMLElement = null
        public reg_3_6: HTMLElement = null
        public reg_3_7: HTMLElement = null

        public prog_4: HTMLElement = null
        public prog_4_label: HTMLElement = null
        public reg_4_0: HTMLElement = null
        public reg_4_1: HTMLElement = null
        public reg_4_2: HTMLElement = null
        public reg_4_3: HTMLElement = null
        public reg_4_4: HTMLElement = null

        public play: HTMLImageElement = null

        public stage: HTMLElement = null

        public hint_right: HTMLElement = null
        public hint_down: HTMLElement = null
        public hint_up: HTMLElement = null
        public hint_level: HTMLElement = null

        public music: HTMLElement = null
        public sound: HTMLElement = null

        public getRegister(prog: number, reg: number): HTMLElement {
            return this['reg_' + prog + '_' + reg]
        }
        public getRegisters(prog?: number): HTMLElement[] {
            var result: HTMLElement[] = []
            if (prog === undefined) {
                for (var p = 1; p <= 4; p++)
                    for (var r = 0; r < (p == 4 ? 5 : 8); r++)
                        result.push(this.getRegister(p, r))
            } else {
                for (var r = 0; r < (prog == 4 ? 5 : 8); r++)
                    result.push(this.getRegister(prog, r))
            }
            return result
        }

        public getTools(): HTMLElement[] {
            return [
                this.tool_right,
                this.tool_grab,
                this.tool_left,
                this.tool_prog1,
                this.tool_prog2,
                this.tool_prog3,
                this.tool_prog4,
                this.tool_blue,
                this.tool_red,
                this.tool_green,
                this.tool_yellow,
                this.tool_empty,
                this.tool_nonempty,
            ]
        }

        public getTool(tool: any): HTMLElement {
            // "tool" could already be a string or some object with a toString() method.
            return this['tool_' + tool.toString()]
        }

        /** 
        Goal: The DIV-node that is a pile of crates.
        _pile: 0 to 5 (left to right) 
        */
        public getPile(_pile: number): HTMLDivElement {
            var level_formation = <HTMLDivElement>this.goal.querySelector("div.level_formation")
            var piles = level_formation.querySelectorAll("div.level_formation > div")
            return <HTMLDivElement>piles.item(_pile)
        }
        /** 
        Goal: The DIV-node that is that crate.
        _pile: 0 to 5 (left to right)
        _crate: 0 to 5 (bottom to top)
        */
        public getCrate(_pile: number, _crate: number): HTMLDivElement {
            var nodes = this.getPile(_pile).querySelectorAll('div')
            // 5 stands for the index of the top crate (0 to 5, bottom to top).
            return <HTMLDivElement>nodes.item(5 - _crate)
        }

    }

    class GameplayView extends View implements IGameplayView {
        private onDragHandler: ctrl.IOnDragHandler = () => {
            console.log('Nothing injected yet...')
        }
        public setOnDragHandler(h: ctrl.IOnDragHandler) {
            this.onDragHandler = h
        }

        private onDropHandler: ctrl.IOnDropHandler = () => {
            console.log('Nothing injected yet...')
            return false
        }
        public setOnDropHandler(h: ctrl.IOnDropHandler) {
            this.onDropHandler = h
        }

        private isDnDAllowed: () => boolean = function () {
            return false
        }
        setDnDAllowedIndicator(f: () => boolean) {
            this.isDnDAllowed = f
        }

        private onPlayClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnPlayClickHandler(h: ctrl.IClickHandler) {
            this.onPlayClickHandler = h
        }

        private onMenuClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }
        // note: there are two buttons: #btn_menu_1 and #btn_menu_2.
        // Both do the same!
        public setOnMenuClickHandler(h: ctrl.IClickHandler) {
            this.onMenuClickHandler = h
        }

        private onHintsClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnHintsClickHandler(h: ctrl.IClickHandler) {
            this.onHintsClickHandler = h
        }

        private onReplayClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnReplayClickHandler(h: ctrl.IClickHandler) {
            this.onReplayClickHandler = h
        }

        private onNextClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }
        // This goes to the next level, when the level has been won.
        public setOnNextClickHandler(h: ctrl.IClickHandler) {
            this.onNextClickHandler = h
        }

        private onStepClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnStepClickHandler(h: ctrl.IClickHandler) {
            this.onStepClickHandler = h
        }

        private onHideHintHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnHideHintHandler(h: ctrl.IClickHandler) {
            this.onHideHintHandler = h
        }

        private onClearClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnClearClickHandler(h: ctrl.IClickHandler) {
            this.onClearClickHandler = h
        }

        private onModalCancelClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnModalCancelClickHandler(h: ctrl.IClickHandler) {
            this.onModalCancelClickHandler = h
        }

        private onModalClearClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnModalClearClickHandler(h: ctrl.IClickHandler) {
            this.onModalClearClickHandler = h
        }

        private onFastClickHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnFastClickHandler(h: ctrl.IClickHandler) {
            this.onFastClickHandler = h
        }

        private onForceStopHandler: ctrl.IClickHandler = () => {
            console.log('Nothing injected yet...')
        }

        public setOnForceStopHandler(h: ctrl.IClickHandler) {
            this.onForceStopHandler = h
        }

        private lvl: level.ILevel
        binding: GameplayBinding
        private dragToolItem: cmd.IInstruction = null

        constructor() {
            super()
            this.lvl = null
            this.element = document.getElementById('gameplay')

            initLevelFormation(document.getElementById('goal'))

            this.binding = new GameplayBinding().bind()
            // Drag & Drop of Tools:

            var tools: cmd.ITool[] = cmd.getTools()
            tools.forEach((tool: cmd.ITool) => {
                shims.dnd.registerDrag(tool.getHTMLElement(),
                    (evt: shims.dnd.DNDEvent) => {
                        // "this" still references the Gameplay-Object
                        if (!this.isDnDAllowed())
                            return

                        var item = cmd.getInstruction(evt.getTarget().attributes['data-cmd-id'].value);
                        (<GameplayView>GAMEPLAY).dragToolItem = item

                        evt.getDataTransfer().dropEffect = 'copy'
                        evt.getDataTransfer().effectAllowed = 'copy'
                        evt.getDataTransfer().setData('Text', item.toString() + ',0,0')
                        if (evt.getDataTransfer()['setDragImage']) {
                            // Perfect for Firefox, OK for Opera and Webkit:
                            evt.getDataTransfer()['setDragImage'](evt.getTarget(), 25, 27)
                        }

                        this.onDragHandler();
                        // Note: changes to "this" would apply to the tool in the toolbox,
                        // not the one held by the mouse.
                    }); //registerDrag
            });

            var dropEvents = {
                register: <shims.dnd.DNDListener>null,
                gameplay: <shims.dnd.DNDListener>null,
                out: <shims.dnd.DNDListener>null
            }
            dropEvents.register = (evt: shims.dnd.DNDEvent) => {
                var register = evt.getTarget()
                if (!register.attributes['data-prog'])
                    register = register.parentElement
                // drop by touch evetns are often on the wrong target:
                if (!register.attributes['data-prog']) {
                    dropEvents.gameplay(evt)
                    return;
                }
                var data = evt.getDataTransfer().getData('Text').split(',')
                var item = cmd.getInstruction(data[0])
                var srcProg = parseInt(data[1]) // 0 => Toolbox
                var srcReg = parseInt(data[2])
                var destProg: number = parseInt(register.attributes['data-prog'].value)
                var destReg: number = parseInt(register.attributes['data-reg'].value)
                this.onDropHandler(item, srcProg, srcReg, destProg, destReg)
            };

            dropEvents.gameplay = (evt: shims.dnd.DNDEvent) => {
                // dropped by touch-event:
                // The target could be cond_?_? or op_?_?:
                if (this.binding.getRegisters().indexOf(evt.getTarget().parentElement) != -1) {
                    dropEvents.register(evt) // drop a tool into a register.
                    return
                }

                var data = evt.getDataTransfer().getData('Text').split(',')
                var tool = cmd.getInstruction(data[0])
                var srcProg: number = parseInt(data[1])
                var srcReg: number = parseInt(data[2])
                // Destination is not a register which is referenced as 0,0.
                if (this.onDropHandler(tool, srcProg, srcReg, 0, 0))
                    this.showSmoke(evt.getLeft(), evt.getTop())
            }

            // For some reson it will work anyway on mobile.
            // and registerDrop on "gameplay" would only disable all clickable buttons:
            if (!conf.isMobile())
                shims.dnd.registerDrop(this.binding.gameplay, dropEvents.gameplay)

            shims.dnd.registerDrop(this.binding.toolbox, dropEvents.gameplay)
            shims.dnd.registerDrop(this.binding.goal, dropEvents.gameplay)
            shims.dnd.registerDrop(this.binding.play, dropEvents.gameplay)
            shims.dnd.registerDrop(this.binding.stage, dropEvents.gameplay)
            shims.dnd.registerDrop(this.binding.level_info, dropEvents.gameplay)

            this.binding.getRegisters().forEach((reg: HTMLElement) => {
                //reg.addEventListener('drop', dropEvent , false);
                shims.dnd.registerDrop(reg, dropEvents.register)


                var _dragstart = (evt: shims.dnd.DNDEvent) => {
                    // "this" still references the Gameplay-Object
                    var item = evt.getTarget()
                    evt.getDataTransfer().dropEffect = 'move'
                    evt.getDataTransfer().effectAllowed = 'move'
                    var tool: string = cmd.NOOP.toString()
                    if (item.id.indexOf('cond') === 0)
                        tool = cmd.NOCOND.toString()
                    var srcProg = item.parentNode.attributes['data-prog'].value
                    var srcReg = item.parentNode.attributes['data-reg'].value
                    var data = tool + ',' + srcProg + ',' + srcReg
                    evt.getDataTransfer().setData('Text', data)
                    this.onDragHandler()
                };
                (<HTMLElement>reg.firstChild).className = 'cmd-nocond'
                shims.dnd.registerDrag(<HTMLElement>reg.firstElementChild, _dragstart);
                (<HTMLElement>reg.lastChild).className = 'cmd-noop'
                shims.dnd.registerDrag(<HTMLElement>reg.lastElementChild, _dragstart)
            } // lambda
            ); //forEach

            var _parent = this;

            if (window.Windows) {
                if (Windows.Phone) {
                    var hardwareButtons = Windows.Phone.UI.Input.HardwareButtons;
                    hardwareButtons.addEventListener("backpressed", function (e) {
                        e.handled = true;
                        if ($('#gameplay').is(':visible')) {
                            _parent.onForceStopHandler(e);
                            view.switchTo(view.LEVEL_PACK)
                            history.pushState({ state: 2 }, "LevelPack", "?state=2")
                            _parent.onHideHintHandler(e)
                            return true;
                        }
                        history.pushState({ state: 1 }, "Main", "?state=1")
                        _parent.onHideHintHandler(e)
                        view.switchTo(view.MAIN_MENU)
                        return true;
                    });
                }
            }
            
            $(window).on('popstate', function (e) {
                if ($('#gameplay').is(':visible')) {
                    _parent.onForceStopHandler(e);
                    view.switchTo(view.LEVEL_PACK)
                    history.pushState({
                        state: 2
                    }, "LevelPack", "?state=2")
                    _parent.onHideHintHandler(e)
                    return;
                }
                history.pushState({
                    state: 1
                }, "Main", "?state=1")
                _parent.onHideHintHandler(e)
                view.switchTo(view.MAIN_MENU)
            });

            $(document).keyup(function (e) {
                if (e.keyCode != 8 && e.keyCode != 37 && e.keyCode != 36)
                    return;
                if ($('#gameplay').is(':visible') && e.keyCode != 36) {
                    _parent.onForceStopHandler(e);
                    view.switchTo(view.LEVEL_PACK)
                    history.pushState({
                        state: 2
                    }, "LevelPack", "?state=2")
                    _parent.onHideHintHandler(e)
                    return;
                }
                history.pushState({
                    state: 1
                }, "Main", "?state=1")
                _parent.onHideHintHandler(e)
                view.switchTo(view.MAIN_MENU)
            });
            this.binding.sound.addEventListener('click', (e) => {
                soundplayer.toggleSound()
            });
            this.binding.music.addEventListener('click', (e) => {
                soundplayer.toggleMusic()
            });
            this.binding.play.addEventListener('click', (e) => {
                this.onPlayClickHandler(e)
            });
            this.binding.btn_menu_1.addEventListener('click', (e) => {
                history.pushState({
                    state: 2
                }, "LevelPack", "?state=2")
                this.onMenuClickHandler(e)
            });
            this.binding.btn_menu_2.addEventListener('click', (e) => {
                history.pushState({
                    state: 2
                }, "LevelPack", "?state=2")
                setTimeout(() => this.onMenuClickHandler(e), 100)
            });
            this.binding.btn_hints.addEventListener('click', (e) => {
                this.onHintsClickHandler(e)
            });
            this.binding.btn_next.addEventListener('click', (e) => {
                this.onNextClickHandler(e)
            });
            this.binding.btn_replay.addEventListener('click', (e) => {
                animation.fadeOut('#you_got_it_2, #you_got_it_1', () => this.onReplayClickHandler(e))
            });
            this.binding.btn_step.addEventListener('click', (e) => {
                this.onStepClickHandler(e)
            });
            this.binding.btn_fast.addEventListener('click', (e) => {
                this.onFastClickHandler(e)
            });
            this.binding.btn_clear.addEventListener('click', (e) => {
                this.onClearClickHandler(e)
            });
            this.binding.custom_modal_btn_cancel_div.addEventListener('click', (e) => {
                this.onModalCancelClickHandler(e)
            });
            this.binding.custom_modal_btn_clear_div.addEventListener('click', (e) => {
                this.onModalClearClickHandler(e)
            });

            new Array(
                this.binding.hint_right, this.binding.hint_down,
                this.binding.hint_up, this.binding.hint_level
            ).forEach((h) => {
                h.onclick = (e) => {
                    this.onHideHintHandler(e)
                }
            });

            //translation:
            var bundle = translate.gameplay
            shims.setTextContent(this.binding.goal_title, bundle.getText('goal'))
            // translation for "you got it":
            var bundle = translate.you_got_it
            shims.setTextContent(this.binding.you_got_it_title, bundle.getText('you got it'))
            shims.setTextContent(this.binding.shortest_solution, bundle.getText('shortest solution'))

            shims.setHTMLContent(this.binding.unknown_solution, bundle.getText('unknown solution'))
        } //c'tor


        getRegister(prog: number, reg: number): HTMLElement {
            return this.binding.getRegister(prog, reg)
        }
        getRegisters(prog?: number): HTMLElement[] {
            return this.binding.getRegisters(prog)
        }

        loadLevel(lvl: level.ILevel) {
            var goal = lvl.getGoal()
            this.setYouGotItState(false)
            goal.forEach(
                (pile, p) => {
                    this.binding.getPile(p).style.display = 'inline-block';
                    pile.forEach(
                        (crate, c) => {
                            if (crate)
                                this.binding.getCrate(p, c).className = 'crate_' + crate;
                            else // empty string => no crate
                                this.binding.getCrate(p, c).className = 'crate_none';
                        }
                    );
                    for (var c = pile.length; c < conf.getMaxCrateHeight(); c++) {
                        this.binding.getCrate(p, c).className = 'crate_none';
                    }
                }
            );
            for (var p = goal.length; p < conf.getMaxPlatforms(); p++) {
                this.binding.getPile(p).style.display = 'none';
            }
            cmd.getTools().forEach((t) => {
                if (lvl.getTools().indexOf(t, 0) >= 0)
                    this.binding.getTool(t).style.display = 'block'
                else
                    this.binding.getTool(t).style.display = 'none'
            });
            shims.setTextContent(this.binding.level_title, lvl.getTitle())
        }

        centerModal(element = '#custom_modal_img') {
            if ($(window).width() > $(window).height()) {
                $(element).css('width', $(window).width() / 2 + 'px');
                //$(element).css('height', $(window).height() * (845 / $(element).width()) / 2 + 'px');
                $('.custom_modal_btn').css('width', $(window).width() / 10 + 'px');
                $('#sub_custom_modal').css('width', $(window).width() / 2 + 'px');
            } else {
                $(element).css('width', $(window).width() / 1.2 + 'px');
                $('.custom_modal_btn').css('width', $(window).width() / 6 + 'px');
                $('#sub_custom_modal').css('width', $(window).width() / 1.2 + 'px');
            }

            var element_height: number = $(element).height();
            var element_width: number = $(element).width();
            var document_height: number = $(window).height();
            var document_width: number = $(window).width();

            var top: number = (document_height - element_height) / 2;
            var left: number = (document_width - element_width) / 2;

            var percent: number = 22;

            $('#custom_modal_btn_cancel_text').css('bottom', $(element).height() / 100 * percent + 'px');
            $('#custom_modal_btn_clear_text').css('bottom', $(element).height() / 100 * percent + 'px');
            $('.custom_modal_text').css('font-size', ($('#custom_modal_btn_clear_text').width() / 5) + 'px');
            $('#custom_modal_question').css('font-size', ($('#custom_modal_btn_clear_text').width() / 3) + 'px');
            $('#sub_custom_modal').css('margin-top', '-' + element_height / 3 + 'px');
            $('#sub_custom_modal').css('margin-left', left + 'px');
            $(element).css('margin-top', top + 'px');
            $(element).css('margin-left', left + 'px');
            var imgtop = $('#custom_modal_img').offset().top;
            var imgleft = $('#custom_modal_img').offset().left;
            $('#custom_modal_question').css('top', imgtop + 'px');
            $('#custom_modal_question').css('left', imgleft + 'px');
            $('#custom_modal_question').text(translate.gameplay.getText('clearmessage'));
            $('#custom_modal_btn_cancel_text').text(translate.gameplay.getText('cancel'));
            $('#custom_modal_btn_clear_text').text(translate.gameplay.getText('clear'));
        }

        private text2html(text: string): string {
            var scale = shims.getScale()
            var wh = 'width="' + Math.round(100 / 3 * scale) + '" height="' + Math.round(108 / 3 * scale) + '" style="height:auto;"'
            var html = text
            html = html.replace(/\[grab\]/g, '<img src="gfx/Command_Grab.png" alt="grab" ' + wh + ' />');
            html = html.replace(/\[right\]/g, '<img src="gfx/Command_Right.png" alt="right" ' + wh + ' />');
            html = html.replace(/\[left\]/g, '<img src="gfx/Command_Left.png" alt="left" ' + wh + ' />');
            html = html.replace(/\[yellow\]/g, '<img src="gfx/Condition_Yellow.png" alt="yellow" ' + wh + ' />');
            html = html.replace(/\[empty\]/g, '<img src="gfx/Condition_None.png" alt="none" ' + wh + ' />');
            html = html.replace(/\[prog(\d)\]/g, '<img src="gfx/Program_$1.png" alt="Prog $1" ' + wh + ' />');
            html = html.replace(/\[short(\d+)\]/ig, translate.levels.getText('short'))
            html = html.replace(/\n/g, '<br />')
            return html
        }

        /** Display a "hint" as a message near the element with the given id. 
          If id == 'gameplay', then the message is shown at the center.
          This function defines whether the hint is shown on the left, under or above the element. */
        public id_hint_el: string = "";

        public showHint(id: string, text: string) {
            this.id_hint_el = id
            this.hideHints(); // only one at a time!
            var el = document.getElementById(id)
            var scale = shims.getScale()
            var hint: HTMLElement = null
            var triangle: HTMLElement = null
            //var x = document.getElementById('x');
            // direction is the direction of the triangle (where it points to).
            var direction: string; // type of hint.
            if (id.substr(0, 4) === 'tool' || id === 'btn_step' || id === 'btn_clear')
                direction = 'right'
            else if (id === 'play' || id.substr(0, 5) === 'reg_1')
                direction = 'down';
            else if (id === 'goal' || id.substr(0, 5) === 'reg_2')
                direction = 'up';
            else
                direction = 'level';

            hint = document.getElementById('hint_' + direction);
            triangle = <HTMLElement>hint.querySelector('.triangle') // could be null!

            var textDiv = <HTMLElement>hint.querySelector('div.text')
            textDiv.innerHTML = this.text2html(text)

            // transformation is ignored/buggy in some browsers.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=591718

            var rEl = el.getBoundingClientRect();

            // draw the hint where it is not visible to get the actual size:
            textDiv.style.maxWidth = hint.style.maxWidth = Math.round(700 * scale) + 'px'
            var border = Math.ceil(4 * scale)
            textDiv.style.borderWidth = border + 'px'

            hint.style.top = hint.style.left = '-1000px'
            hint.style.fontSize = Math.round(20 * scale) + 'px'
            hint.style.display = 'block'
            if (triangle)
                triangle.style.width = triangle.style.height = Math.ceil(scale * 29) + 'px'
            var rHint = hint.getBoundingClientRect()

            if (direction === 'right') {
                hint.style.left = Math.floor(rEl.left - rHint.width) + 'px';
                hint.style.top = Math.floor(rEl.top + (rEl.height / 2) - (40 * scale)) + 'px';
                triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Right.png)'
                triangle.style.left = '-' + border + 'px'
                triangle.style.top = (scale * 20) + 'px'
            } else if (direction === 'down') {
                if (rEl.left > rHint.width) {
                    hint.style.left = Math.floor(rEl.right - rHint.width) + 'px'
                    triangle.style.left = Math.floor(rHint.width - (rEl.width / 2) - (15 * scale)) + 'px'
                } else {
                    hint.style.left = Math.floor(rEl.left) + 'px'
                    triangle.style.left = Math.floor((rEl.width / 2) - (15 * scale)) + 'px'
                }
                hint.style.top = Math.floor(rEl.top - (rHint.height)) + 'px';
                triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Down.png)'
                triangle.style.top = '-' + border + 'px'
            } else if (direction === 'up') {
                hint.style.left = Math.floor(rEl.left + rEl.width / 2 - rHint.width / 2) + 'px'
                //triangle.style.left = Math.floor((rEl.width / 2) - (15 * scale)) + 'px'
                hint.style.top = Math.ceil(rEl.bottom) + 'px';
                triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Up.png)'
                triangle.style.top = border + 'px'
            } else if ('gameplay' === id) { // hint at the center 
                hint.style.left = Math.floor((rEl.width - rHint.width) / 2 + rEl.left) + 'px'
                hint.style.top = Math.floor((rEl.height - rHint.height) / 2 + rEl.top) + 'px'
                // no triangle!
            } else { // level hint (shown when "hints"-button is clicked)
                hint.style.left = Math.floor(rEl.right - rHint.width) + 'px';
                hint.style.top = Math.floor(rEl.bottom + 10 * scale) + 'px';
                // no triangle!
            }
        }

        public hideHints() {
            ([
                this.binding.hint_right, this.binding.hint_down,
                this.binding.hint_up, this.binding.hint_level,
            ]).forEach((h) => {
                h.style.display = 'none';
            });
        }

        private showSmoke(left: number, top: number) {

            try {
                soundplayer.smoke_sound.play()
            } catch (ex) {
                console.error("Soundplay doesn'try Worker: " + ex.message)
            }

            left -= 28 // reduce by half of width
            top -= 29 // reduce by half of height

            // This cycles all 4 possible directions (up,right,down,left).
            // Each direction consits of a vertical and horizontal direction. 
            // So this repeats after 8 invokations.
            var r = Math.floor(Math.random() * 8);
            var rnd = () => {
                r = (r + 1) % 8;
                //         a random positive integer [15,35], then a factor -1 or +1:
                return (Math.round(Math.random() * 20 + 15) * ((Math.floor(r / 4) - 0.5) * 2));
            };

            var showSmoke2 = (i: number) => {
                var s = window.document.getElementById("smoke" + i);
                s.className = 'nosmoke';
                s.style.top = top + 'px';
                s.style.left = left + 'px';
                s.style.opacity = "1.0";
                var globalScale = shims.getScale()
                setTimeout(() => {
                    s.className = 'smoke';
                    s.style.top = (top + rnd() * globalScale) + 'px';
                    s.style.left = (left + rnd() * globalScale) + 'px';
                    s.style.opacity = "0.3";
                    var scale = Math.round((0.5 + Math.random()) * globalScale * 100) / 100;
                    shims.transform(s, 'scale(' + scale + ',' + scale + ') ' + 'rotate(' + (Math.round(Math.random() * 100) / 100) + 'turn)');
                }, 33);
                setTimeout(() => {
                    s.className = 'nosmoke';
                    s.style.opacity = "1.0";
                }, 500);
            };
            for (var i = 1; i <= 6; i++) showSmoke2(i);
            try {
                soundplayer.smoke_sound.play()
            } catch (ex) {
                console.error("Soundplay error: " + ex.message)
            }
        }

        /** play = green / !play = stop = red 
          note: the parameter is true when the animation is *not* playing and the button
          is displayed as a green play-button). false => stop-button.
        */
        setPlayButtonState(play: boolean) {
            this.binding.play.src =
                play ? 'gfx/Play_Button.png' : 'gfx/Stop_Button.png';

            var allowed = this.isDnDAllowed()
            var stop2change = translate.gameplay.getText('stop2change')
            var regs = this.binding.getRegisters()
            regs.concat(regs.map((r) => {
                return <HTMLImageElement>r.firstChild
            }))
                .concat(regs.map((r) => {
                    return <HTMLImageElement>r.lastChild
                }))
                .concat(this.binding.getTools())
                .forEach((x) => {
                    $(x).css('cursor', allowed ? '' : 'not-allowed');
                    x.title = allowed ? '' : stop2change
                })
        }

        /** active = fast / !active = slow */
        setFastButtonState(active: boolean) {
            this.binding.btn_fast.src = "gfx/" +
                (active ? "Fast_Button_Active.png" : "Fast_Button_Inactive.png");
        }

        private youGotItVisible = false
        private bgPos = 0
        setYouGotItState(visible: boolean, rating?: number) {
            this.youGotItVisible = visible
            this.hideHints()
            var portrait = window.innerHeight > window.innerWidth
            this.binding.you_got_it_1.style.display = visible ? 'block' : 'none'
            this.binding.you_got_it_1.style.top = '-800px'
            this.binding.you_got_it_2.style.display = visible ? 'block' : 'none'
            this.binding.you_got_it_2.style.top = portrait ? '1455px' : '-800px'
            if (!visible) return;
            this.binding.shortest_solution.style.display = 'none'
            this.binding.unknown_solution.style.display = 'none'
            if (rating === 4)
                this.binding.unknown_solution.style.display = 'block'
            else if (rating === 3)
                this.binding.shortest_solution.style.display = 'block'

            // star_1 is always filled!
            this.binding.star_2.src = 'gfx/Star_' + ((rating >= 2) ? 'Filled' : 'Empty') + '.png'
            this.binding.star_3.src = 'gfx/Star_' + ((rating >= 3) ? 'Filled' : 'Empty') + '.png'

            setTimeout(() => {
                this.binding.you_got_it_1.style.top = ''
                this.binding.you_got_it_2.style.top = ''
            }, 32)
        }
    }
}
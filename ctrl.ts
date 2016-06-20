/** Controller (MVC) 
  * Note: The animation (with physics simulation) is in animation.ts.
  */
module ctrl {

    export var GAMEPLAY: IController = null
    export var MAIN_MENU: IController = null
    export var LEVEL_PACK: IController = null

    export function init() {
        //This simply loads this module.
        //The Controllers will be created and they inject all handlers into their views.
        // this is deferred, so that the views are ready.
        GAMEPLAY = new GameplayCtrl(model.MODEL, view.GAMEPLAY)
        MAIN_MENU = new MainMenuCtrl(view.MAIN_MENU, model.MODEL)
        LEVEL_PACK = new LevelPackCtrl(view.LEVEL_PACK, model.MODEL)

        view.CREDITS.setOnCloseHandler((e) => { view.switchTo(view.MAIN_MENU) })
    }

    export interface IController { }

    class MainMenuCtrl implements IController {
        /** Constructs the controller. There is no model. */
        constructor(private _view: view.IMainMenuView, _model: model.IModel) {
            _view.setClickHandler((e) => {
                var target = <HTMLDivElement>e.target;
                if (e.target === undefined) target = <HTMLDivElement>e.srcElement;
                while (target.id.indexOf("pack_") != 0 && target.id != "editor_go")
                    target = <HTMLDivElement>target.parentElement;
                var nr: number = parseInt(target.attributes['data-nr'].value);
                var pack: level.ILevelPack = level[target.attributes['data-pack'].value];
                _model.setLevelPack(pack); // This invoces the observer-function below.
                view.switchTo(view.LEVEL_PACK);

                if (target.id == "editor_go") {
                    var l = _model.getLevelPack().getLevel(0);
                    _model.setLevel(l);
                    view.switchTo(view.GAMEPLAY);
                }
            });
            var setStars = function () {
                var allTotals = 0
                for (var i = 0; i < 6; i++) {
                    var total = _model.getTotalRating(level.getLevelPack(i))
                    allTotals += total
                    _view.setStar(i, total === 6 * 3)
                }
                _view.setRating(allTotals)
            }
            _model.subscribe(_view, function (us: model.IModel, msg?: model.msg.ModelChanged) {
                if (!msg || !(msg instanceof model.msg.ModelChanged)) return;
                if (msg.isPack() || msg.isRating())
                    setStars()
            })
            setStars()
            _view.setLanguageHandler((lang: string) => {
                if (lang === _model.getLanguage()) return
                _model.setLanguage(lang)
                setTimeout(() => { window.document.location.reload() }, 30)
            })

            _view.setCreditsHandler((ev) => {
                view.switchTo(view.CREDITS)
                animation.animateCredits('#scaledViewport', () => { });
            })
        }
    }

    class LevelPackCtrl implements IController {
        /** Constructs the controller. There is no model. */
        constructor(private _view: view.ILevelPackView, _model: model.IModel) {
            _view.setClickHandler((e) => {
                var target = <HTMLDivElement>e.target;
                if (e.target === undefined) target = <HTMLDivElement>e.srcElement;
                while (target.id.indexOf("level_") != 0)
                    target = <HTMLDivElement>target.parentElement;
                var nr: number = parseInt(target.attributes['data-nr'].value);
                var l = _model.getLevelPack().getLevel(nr);
                _model.setLevel(l);
                view.switchTo(view.GAMEPLAY);
            });

            _view.setBackToMain((e) => {
                view.switchTo(view.MAIN_MENU)
            });

            _view.setGoLeft((e) => {
                if (_model.getLevelPack().getPreviousLevelPack().getIdName() != "bonus") {
                    animation.animateLevelPackLeft('#sliding_elements', () => {
                        if (_model.getLevelPack().getPreviousLevelPack().getIdName() != "bonus") {
                            _model.setLevelPack(_model.getLevelPack().getPreviousLevelPack())
                        }
                    });
                }
            });

            _view.setGoRight((e) => {
                if (_model.getLevelPack().getNextLevelPack().getIdName() != "bonus") {
                    animation.animateLevelPackRight('#sliding_elements', () => {
                        if (_model.getLevelPack().getNextLevelPack().getIdName() != "bonus") {
                            _model.setLevelPack(_model.getLevelPack().getNextLevelPack())
                        }
                    });
                }
            });

            // Connect model.IUserSelection to view.ILevelPack:
            _model.subscribe(_view, function (us: model.IModel, msg?: model.msg.ModelChanged) {
                // "this" points to "_view", 
                if (!msg || !(msg instanceof model.msg.ModelChanged)) return;
                if (msg.isPack() || msg.isRating()) {
                    msg.isPack()
                    _view.setLevelPack(us.getLevelPack());
                    var total = 0
                    for (var i = 0; i < 6; i++) {
                        // console.log(us.getLevelPack().getIdName())
                        if (i > 2 && us.getLevelPack().getIdName() == 'bonus')
                            return;
                        if (i > 0 && us.getLevelPack().getIdName() == 'editor')
                            return;
                        var rating = _model.getRating(us.getLevelPack().getLevel(i))
                        total += rating
                        _view.setStars(i, rating)
                    }
                    _view.setTotalStars(total)
                }
            });
        }
    }
    /** Callable for Drag-Events. This is only needed to show hints. */
    export interface IOnDragHandler {
        (): void;
    }

    /** Callable for Drop-Events. I.e. when a tool is dropped on a register.
    Source or Destination set as 0, 0 is the "Toolbox". In that case the "tool" must be set properly.
    In any other case the tool can be NOOP or NOCOND, which is only used to distinguish between Operation and Condition.
     */
    export interface IOnDropHandler {
        (tool: cmd.IInstruction, srcProg: number, srcReg: number, destProg: number, destReg: number): boolean;
    }
    /** Callable for changes to the code. This is a redirected update-call. */
    export interface ICodeChangeHandler {
        (code: model.ICode, msg: model.msg.RegisterChanged): void;
    }
    /** Just a click on any element. */
    export interface IClickHandler {
        (e: Event): void;
    }

    /** A Function that is invoked by the "Game-Loop".
     * Example: Callback by animation to prepare the next frame. */
    export interface IGameLoopCallback {
        (timestamp: number): IGameLoopCallback;
    }

    enum State {
        STOPPED, RUNNING, STEPWISE, PAUSED, WIN
    }

    class GameplayCtrl implements IController {
        //the state and lvlEvent are also accessed by the GameLoop.
        state: State = State.STOPPED
        lvlEvent: level.Event = null
        custom_modal: HTMLElement = document.getElementById('custom_modal')
        private gameloop: GameLoop

        public setPlayButtonState() {
            this._view.setPlayButtonState(this.state != State.RUNNING);
        }

        constructor(private _model: model.IModel, private _view: view.IGameplayView) {
            // inform the cargo, when the level is set:
            _model.subscribe(_model.getCargo(),
                function (us: model.IModel, msg?: model.msg.ModelChanged) {
                    if (!msg || !(msg instanceof model.msg.ModelChanged)) return;
                    if (msg.isLevel())
                        (<model.ICargo>this).setLevel(us.getLevel());
                })

            _view.setOnPlayClickHandler(
                (e: MouseEvent) => {
                    try {
                        // Toggle state:
                        switch (this.state) {
                            case State.RUNNING:
                                this.state = State.STOPPED;
                                this.gameloop.reset();
                                this.lvlEvent.fireLater(level.EventType.STOP);
                                break;
                            case State.WIN:
                                this.state = State.STOPPED;
                                this.gameloop.reset();
                                this.lvlEvent.fireLater(level.EventType.STOP);
                                break;
                            case State.STOPPED:
                                _model.save(); // save the code.
                                this.gameloop = new GameLoop(this, this._model, this._view);
                            // fallthrough!
                            case State.STEPWISE:
                            case State.PAUSED:
                                this.state = State.RUNNING
                                setTimeout(() => {
                                    this.lvlEvent.fire(level.EventType.PLAY);
                                    this.gameloop.run();
                                }, 0);
                                break;
                            default: throw 'The current state of GamePlayCtrl is unknown...';
                        }
                    } finally {
                        //TODO: fix crashes on windows phone
                        try {
                            soundplayer.play_stop.play();
                        } catch (ex) {
                            console.log("Sound Error: " + ex.messsage)
                        }
                        this.setPlayButtonState();
                    }
                }
            );

            var dndAllowed = () => {
                return this.state === State.STOPPED;
            }
            _view.setDnDAllowedIndicator(dndAllowed);
            shims.dnd.setDnDAllowedIndicator(dndAllowed);

            _view.setOnFastClickHandler(function (e) {
                // Toggle the speed:
                _model.setFast(!_model.isFast());
                _view.setFastButtonState(_model.isFast());
                soundplayer.togglePlaySpeed(!_model.isFast());
            });
            _view.setFastButtonState(_model.isFast());

            _view.setOnClearClickHandler((e) => {
                if (this.state === State.RUNNING || this.state === State.WIN) return;
                this.custom_modal.style.display = 'block';
                _view.centerModal();
                addEvent(window, "resize", function () { _view.centerModal(); });
            });

            _view.setOnModalCancelClickHandler((e) => {
                this.custom_modal.style.display = 'none';
            });

            _view.setOnModalClearClickHandler((e) => {
                _model.getCode().reset()
                _view.getRegisters().forEach(function (el) {
                    var cond: HTMLElement = <HTMLElement>el.firstElementChild
                    cond.className = 'cmd-nocond'
                    var op: HTMLElement = <HTMLElement>el.lastElementChild
                    op.className = 'cmd-noop'
                })
                this.custom_modal.style.display = 'none';
                if (this.state !== State.STOPPED) {
                    this.state = State.STOPPED;
                    if (this.gameloop) this.gameloop.reset()
                    this.lvlEvent.fireLater(level.EventType.STOP)
                    this.setPlayButtonState()
                }
                this.lvlEvent.fireLater(level.EventType.CLEAR)
            });

            _view.setOnForceStopHandler((e) => {
                try {
                    switch (this.state) {
                        case State.RUNNING:
                            this.state = State.STOPPED;
                            this.gameloop.reset();
                            this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        case State.STOPPED:
                            _model.save(); // save the code.
                            this.gameloop = new GameLoop(this, this._model, this._view);
                            break;
                        case State.PAUSED:
                            this.state = State.STOPPED;
                            this.gameloop.reset();
                            this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        case State.WIN:
                            this.state = State.STOPPED;
                            this.gameloop.reset();
                            this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        default: throw 'The current state of GamePlayCtrl is unknown...';
                    }
                } finally {
                    this.setPlayButtonState();
                }
            });

            _view.setOnStepClickHandler((e) => {
                try {
                    switch (this.state) {
                        case State.RUNNING:
                            // PAUSED would actually pause the animation, but it should
                            // still finish the current step. So the "state" is set to STEPWISE:
                            this.state = State.STEPWISE
                            return
                        case State.STOPPED:
                            this.gameloop = new GameLoop(this, this._model, this._view)
                        //fallthrough
                        case State.PAUSED:
                            this.gameloop.step()
                            this.lvlEvent.fireLater(level.EventType.STEP)
                            return
                        case State.STEPWISE:
                        case State.WIN:
                        default:
                        //ingnore...
                    }
                } finally {
                    this.setPlayButtonState()
                }
            });

            _view.setOnMenuClickHandler((e) => {
                this.state = State.STOPPED
                this.lvlEvent.fireLater(level.EventType.STOP)
                _view.hideHints()
                _view.setYouGotItState(false)
                if (this.gameloop) this.gameloop.reset()
                this.setPlayButtonState()
                _model.save()
                view.switchTo(view.LEVEL_PACK)
                soundplayer.sound_play_state = GameSoundState.MENU;
                soundplayer.updateSound();
            });

            _view.setOnHintsClickHandler((e) => {
                _view.showHint('btn_hints', _model.getLevel().getHints())
            });

            _view.setOnReplayClickHandler((e) => {
                _view.setYouGotItState(false)
                this.state = State.STOPPED
                this.setPlayButtonState()
                if (this.gameloop) this.gameloop.reset()
                this.lvlEvent.fireLater(level.EventType.STOP)
                this.lvlEvent.fireLater(level.EventType.LOAD)
            });
            _view.setOnNextClickHandler((e) => {
                var lvl = _model.getLevel()
                var next = lvl.getNextLevel()
                _model.setLevelPack(next.getLevelPack())
                _model.setLevel(next)
                this.state = State.STOPPED
                this.setPlayButtonState()
                _view.loadLevel(next)
            });

            // Connect model.IUserSelection to view.IGameplayView:
            _model.subscribe(this, function (us: model.IModel, msg?: model.msg.ModelChanged) {
                if (msg && (msg instanceof model.msg.ModelChanged) && msg.isLevel()) {
                    _view.loadLevel(us.getLevel());
                    // This is the only place where lvlEvent gets replaced.
                    // in any other case it only gets "fired" with a new EventType.
                    this.lvlEvent = new level.Event(_view, _model);
                    this.lvlEvent.fireLater(level.EventType.LOAD);
                }
            });
            _view.setOnDragHandler(() => {
                this.lvlEvent.fireLater(level.EventType.DRAG);
                try {
                    soundplayer.grab_toolbox_element.play();
                } catch (ex) {
                    console.log("Sound Error: " + ex.messsage)
                }
            });
            _view.setOnDropHandler(
                (tool: cmd.IInstruction, srcProg: number, srcReg: number, destProg: number, destReg: number) => {
                    var showSmoke = false;
                    var code = _model.getCode();
                    if (!srcProg && destProg > 0) { // 1: Toolbox --> Register
                        code.setInstruction(destProg, destReg, tool);
                        try {
                            soundplayer.put_toolbox_element.play()
                        } catch (ex) {
                            console.log("Sound Error: " + ex.messsage)
                        }
                    } else if (!destProg && srcProg > 0) { // 2: Register --> (not Register)
                        // tool should be NOOP or NOCOND.
                        showSmoke = !code.getCommand(srcProg, srcReg).equals(cmd.getCommand(cmd.NOOP, cmd.NOCOND))
                        code.setInstruction(srcProg, srcReg, tool)
                    } else if (destProg == srcProg && srcProg > 0 && destProg > 0) { // 3: Same register
                        var instruction: cmd.IInstruction = null;
                        try {
                            soundplayer.put_toolbox_element.play();
                        } catch (ex) {
                            console.log("Sound Error: " + ex.messsage)
                        }
                        try {
                            if (tool.isOperation()) { // Probably NOOP
                                instruction = code.getOperation(srcProg, srcReg)
                                code.setInstruction(srcProg, srcReg, cmd.NOOP)
                            } else { // Probably NOCOND
                                instruction = code.getCondition(srcProg, srcReg)
                                code.setInstruction(srcProg, srcReg, cmd.NOCOND)
                            }
                        } finally {
                            code.setInstruction(destProg, destReg, instruction)
                            var el: HTMLElement = this._view.getRegister(srcProg, srcReg);
                            var cond: HTMLElement = <HTMLElement>el.firstElementChild;
                            cond.className = 'cmd-' + code.getCondition(srcProg, srcReg).toString();
                            var op: HTMLElement = <HTMLElement>el.lastElementChild;
                            op.className = 'cmd-' + code.getOperation(srcProg, srcReg).toString();
                        }
                    } else if (destProg > 0 && srcProg > 0) { // 4: Register --> Register
                        // The actual instruction must be read from the code.
                       var instruction: cmd.IInstruction = null;
                        try {
                            soundplayer.put_toolbox_element.play();
                        } catch (ex) {
                            console.log("Sound Error: " + ex.messsage)
                        }
                        // In this context "NOOP" actually stands for "any operation"
                        // The same is true for "NOCOND" => "any condition"
                        // It's just used to distinguish operation vs condition.
                        if (tool.isOperation()) { // Probably NOOP
                            instruction = code.getOperation(srcProg, srcReg)
                            code.setInstruction(srcProg, srcReg, cmd.NOOP)
                        } else { // Probably NOCOND
                            instruction = code.getCondition(srcProg, srcReg)
                            code.setInstruction(srcProg, srcReg, cmd.NOCOND)
                        }
                        code.setInstruction(destProg, destReg, instruction)
                    } else {
                        showSmoke = true;
                    } // else 4: Register/Toolbox --> Nirvana

                    this.lvlEvent.fireLater(level.EventType.DROP);
                    return showSmoke
                }); //setOnDropHandler

            _model.getCode().subscribe(this, (code: model.ICode, msg?: model.msg.RegisterChanged) => {
                var oldCmd = msg.getOldCommand();
                var newCmd = msg.getNewCommand();
                var prog = msg.getProgram();
                var reg = msg.getRegister();
                // console.log('prog: ' + prog + ' / reg: ' + reg);
                var el: HTMLElement = this._view.getRegister(prog, reg);
                var cond: HTMLElement = <HTMLElement>el.firstElementChild;
                cond.className = 'cmd-' + newCmd.getCondition().toString();
                var op: HTMLElement = <HTMLElement>el.lastElementChild;
                op.className = 'cmd-' + newCmd.getOperation().toString();
                // Rotate slightly:
                if (oldCmd.getOperation() != newCmd.getOperation())
                    setTimeout(() => {
                        var skew: number = Math.floor(Math.random() * 20) - 10;
                        shims.transform(op, 'rotate(' + skew + 'deg)');
                    }, 0)
            });

            _view.setOnHideHintHandler(() => {
                _view.hideHints()    
            });
        }//c'tor
    }
    /** 
    * The Game Loop controls the animation. 
    * it loops as long as the animations needs to draw new frames
    * and the stack machine has instructions to process.
    */
    class GameLoop {
        constructor(private _ctrl: GameplayCtrl,
            private _model: model.IModel,
            private _view: view.IGameplayView) {
            // requestAnimationFrame() doesn't allow to pass a thisArg, so we need to construct the function:  
            this.animationFrameLoop = (time: number) => {

                frameCount++;

                if (frameCount < 2) {
                    window.requestAnimationFrame(this.animationFrameLoop);
                    return;
                }

                frameCount = 0;

                    animationTime = time;
                    if (this.currentStep && this.currentStep.isFinished() || this.crashed >= 2) {
                        if (_model.getCargo().isGoal()) {
                            _ctrl.lvlEvent.fireLater(level.EventType.WIN)
                            // this rating goes from 1 to 4. 4 is for "unknown" solutions.
                            // the models accepts only from 0 to 3. So 4 is the same as 3.
                            var rating = _model.getLevel().getRating().rate(_model.getCode())
                            _view.setYouGotItState(true, rating)
                            _model.setRating(_model.getLevel(), Math.min(3, rating))
                            _ctrl.state = State.WIN
                            soundplayer.level_success.play();
                        } else if (this.crashed > 0) {
                            _ctrl.lvlEvent.fireLater(level.EventType.CRASH);
                        } else {// animation ended, but no win. 
                            _ctrl.lvlEvent.fire(level.EventType.END);
                        }
                        _ctrl.setPlayButtonState()
                        this.removeCurrentRegister()
                        return;// break the loop when sm is finished
                    }

                    switch (_ctrl.state) {
                        case State.STOPPED:
                        case State.WIN:
                        case State.PAUSED:
                            return;
                        default: //continue...
                    }

                    // loop the animation:
                    window.requestAnimationFrame(this.animationFrameLoop);

                    var current_register = 'current_register';
                    // all logic needed for drawing is in animate():
                    if (!this.callback) {
                        if (this.register) this.register.classList.remove(current_register);
                        try {
                            this.currentStep = this._sm.step();
                        } catch (e) {
                            _ctrl.state = State.STOPPED;
                        }
                        // highlight the current register:
                        //TODO register is undefined when fast clicking stop/play button

                        this.register = this._view.getRegister(this.currentStep.getProgram(), this.currentStep.getRegister());

                        if (this.register) this.register.classList.add(current_register);
                        // Calling a "Prog" would not be visible if it is not delayed a bit:
                        if (this.currentStep.getCommand().getOperation().getProgramNr() > 0) {
                            this.skip = time + (this._model.isFast() ? 10 : 20);
                            this.callback = (time: number) => { if (time < this.skip) return this.callback; };
                        } else {
                            if (this.currentStep.isFinished()) {
                                if (!this.callback && _ctrl.state === State.STEPWISE)
                                    _ctrl.state = State.RUNNING // indicates that the game must be stopped.
                                return;
                            } else if (this._model.getCargo().isCrashed())
                                this.crashed++;
                            this.callback = animation.ANIMATION.animate;
                        }
                    }

                    this.callback = this.callback.call(animation.ANIMATION, time);

                    // when one full step is finished but the user only played one step:
                    if (!this.callback && _ctrl.state === State.STEPWISE)
                        _ctrl.state = State.PAUSED // paused until the user play the next step.
            }; // = animationFrameLoop
                
            this.reset()
        }

        private _sm: sm.IStackMachine = null;
        private currentStep: sm.IStep = null;
        private callback: IGameLoopCallback = null;
        private crashed = 0;
        /** The div-element of the register that is currently processed. */
        private register: HTMLElement = null;
        /** amount of milliseconds that should be skipped. */
        private skip = 0;
        // the function animationFrameLoop() is defined in the constructor!
        private animationFrameLoop: (time: number) => void = null;
        public run() {
            window.requestAnimationFrame(this.animationFrameLoop);
        }
        public step() {
            this._ctrl.state = State.STEPWISE
            window.requestAnimationFrame(this.animationFrameLoop);
        }
        public reset() {
            this._sm = sm.createStackMachine(this._model.getCode(), this._model.getCargo());
            this._sm.reset();
            this._model.getCargo().reset();
            this.removeCurrentRegister();
        }

        /** No register will be highlighted.
            Removes the class "current_register" from all registers. */
        private removeCurrentRegister() {
                var nodeList = this._view.get('controls').querySelectorAll('*.current_register');
                for (var i = 0; i < nodeList.length; i++)
                    (<HTMLElement>nodeList.item(i)).classList.remove('current_register');
        }
    }

    var animationTime: number = -1;
    export function getAnimationTime(): number { return animationTime; }
}
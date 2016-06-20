/*
This unit contains the levels. Scroll down to "DEFINITIONS" to get there quickly.
*/
module level {
    export function getLevel(packNr: number, lvlNr: number): ILevel {
        return _packs[packNr].getLevel(lvlNr);
    }
    export function getLevelPack(packNr: number): ILevelPack {
        return _packs[packNr];
    }
    export function getLevelPacks(): ILevelPack[] {
        return _packs.slice(0);
    }
    export interface ILevel { //immutable
        getTitle(): string;
        getLevelPack(): ILevelPack;
        /** Number of platforms to stack crates in this level. */
        getPlatforms(): number;
        /** Index of platform over which the grappler will start (beginns at 0). */
        getStartPlatform(): number;
        /** Formation of crates. The array-length also defines the amount of platforms. 
            The values are strings: '', 'blue', 'red', 'yellow, 'green'. 
            Empty spaces must not be declared in the constructor parameter. */
        getInitialFormation(): string[][];
        /** Formation that wins the level. 
            Empty spaces must not be declared in the constructor parameter. 
            The values are strings: '', 'blue', 'red', 'yellow, 'green'. */
        getGoal(): string[][];
        /** Commands available in the toolbox. */
        getTools(): cmd.ITool[];
        /** The Rating defines how many stars are give for a solution. */
        getRating(): IRating;
        /** Text for hints button. */
        getHints(): string;
        /** When something happens that could trigger the display of a hint. */
        fireEvent(event: Event);
        /** The next level. Or the first if all have been won. */
        getNextLevel(): ILevel;
    }
    export interface IRating {
        /** Returns the number of stars (1 to 4). 
            A return value of 4 is 3 stars, but the solutions is better than the best known solution yet. 
            This never returns 0, since this can't decide whether a solution is valid.
            Only the actual simulation can decide that.
        */
        rate(code: model.ICode): number;
    }
    class Rating implements IRating {
        constructor(private r: number[]) {
            //r[0] = Maximum of registers allowed to get a 2 star rating.
            //r[1] = Maximum of registers allowed to get a 3 star rating.
            //r[2] = Best known solution.
            if ((r.length != 3) || (r[0] < r[1]) || (r[1] < r[2])) throw "bad rating for level "; //...
        }
        rate(code: model.ICode): number {
            var operations = code.getNumberOfOperations()
            if (operations < this.r[2]) return 4
            if (operations <= this.r[1]) return 3
            if (operations <= this.r[0]) return 2
            return 1
        }
    }
    /** Type of event. */
    export enum EventType {
        /** Load of level. */
        LOAD,
        /** User clicked on "Play". */
        PLAY,
        /** User stopped the animation. */
        STOP,
        /** Animation finished: User has found a valid solution. */
        WIN,
        /** Animation finished: Code caused a crash. */
        CRASH,
        /** Animation finished: Goal not reached, no more instructions. */
        END,
        /** Start of drag event. */
        DRAG,
        /** Element dropped. */
        DROP,
        /** Single step of animation. */
        STEP,
        /** All commands have been cleared. */
        CLEAR,
        /** User hides a hint by clicking on it. */
        HIDE
    }
    /** An event object that is used whenever the user loads a level. 
    The controller will pass the same object, so it can be used to store any information in it. */
    export class Event {
        public type = EventType.LOAD;
        public sm: sm.IStackMachine = null;
        public lvl: ILevel;
        constructor(public _view: view.IGameplayView, public _model: model.IModel) {
                this.lvl = _model.getLevel();
            }
            /** This informs the level about the event by passing the event-object. */
        fire(newType: EventType) {
                this.type = newType;
                this.lvl.fireEvent(this);
            }
            /** Adds the invocation of this.fire(newType) to the queue. */
        fireLater(newType: EventType) {
            setTimeout(() => {
                this.fire(newType)
            }, 33);
        }
    }
    /** A function that is called when the user does something. 
    the level can then show some special hints. 
    The parameter "event" is an object that only gets renews when a new level is loaded.
    Any information can be stored as properties to this object. 
    */
    export interface ITutorialHints {
        (event: Event): void;
    }
    /** This class defines one level. */
    class Level implements ILevel {
        private rating: Rating;
        constructor(
            // "aka" tells you the name in the original game on iPad, iff it differs.
            // The ordering of these parameters is similar to the original code.
            private title: string, //aka "name"
            private lvlPack: ILevelPack, private startPlatform: number, //starts at 0! aka "claw"
            rating: number[], //[3,2,1], aka "stars"
            //funcs = {8,8,8,5}, - we always use this!
            private tools: string[], // aka "toolbox"
            private stage: string[][], // initial formation
            private goal: string[][], private tutHints ? : ITutorialHints) {
            // Unchecked casting and leak of this-reference in c'tor: 
            // Not best practice, but I like to live dangerously...
            if ('From Beneath2' !== title) // "From Beneath2" is not really in Tutorials!
                ( < LevelPack > lvlPack).addLevel(this);
            // Note that the game is still loading. The language is not set and there is no model.
            if (stage.length != goal.length) throw 'Initial formation and Goal are not of equal length. Amount of platforms is unclear.';
            if (startPlatform > stage.length) throw 'start platform is out of bounds.';
            this.rating = new Rating(rating);
            var check = (v: string) => {
                switch (v) {
                    case '':
                    case 'red':
                    case 'yellow':
                    case 'green':
                    case 'blue':
                        return;
                }
                throw 'Level: bad value: ' + v;
            };
            stage.forEach((a) => {
                a.forEach(check)
            });
            goal.forEach((a) => {
                a.forEach(check)
            });
            if (tools) {
                tools.forEach((t) => {
                    if (!cmd.getTool(t)) throw 'Level: Unkown Tool ' + t;
                });
            }
            if (!tutHints) this.tutHints = function(e) {};
        }
        getTitle(): string {
            return this.title;
        }
        getLevelPack(): ILevelPack {
            return this.lvlPack;
        }
        getPlatforms(): number {
            return this.stage.length;
        }
        getStartPlatform(): number {
            return this.startPlatform;
        }
        getInitialFormation(): string[][] {
                var result: string[][] = new Array();
                for (var i = 0; i < this.stage.length; i++) {
                    var a = new Array < string > ()
                    result.push(a);
                    for (var j = 0; j < conf.getMaxCrateHeight(); j++) {
                        if (this.stage[i][j]) a.push(this.stage[i][j])
                        else a.push('');
                    }
                }
                return result;
            }
            /** 
             * Array of create colors that define the goal of a level.
             * The goal array contains piles that only go from 0 to 5. */
        getGoal(): string[][] {
            var result: string[][] = new Array();
            for (var i = 0; i < this.goal.length; i++) {
                var a = new Array < string > ();
                result.push(a);
                for (var j = 0; j < conf.getMaxCrateHeight(); j++) {
                    if (this.goal[i][j]) a.push(this.goal[i][j]);
                    else a.push('');
                }
            }
            return result;
        }
        getTools(): cmd.ITool[] {
            if (!this.tools) {
                return cmd.getTools();
            } else {
                var result: cmd.ITool[] = new Array();
                this.tools.forEach((t) => {
                    result.push(cmd.getTool(t));
                });
                return result;
            }
        }
        getRating() {
            return this.rating;
        }
        getHints(): string { // this is defined in the unit "translate"
            return translate.levels.getBundle(this.title).getText('hints')
        }
        fireEvent(event: Event) {
                this.tutHints.call(this, event);
            }
            /** The next level. Or the first if all have been won. */
        getNextLevel(): ILevel {
            var list = this.lvlPack.getLevels()
            if (this === list[list.length - 1]) // last of pack?
                return this.lvlPack.getNextLevelPack().getLevel(0) // first of next
            var index = list.indexOf(this)
            return list[index + 1]
        }
    }
    var _packs: ILevelPack[] = new Array();
    export interface ILevelPack { //immutable
        /** Unique name used for identifiers. This is one lowercase word.*/
        getIdName(): string;
        /** Get one level of this pack.
         * - nr: 0 to 5.
         */
        getLevel(nr: number);
        /** Array of all 6 levels in this pack. */
        getLevels(): ILevel[];
        /** The next level pack. Or the first, if this the last. */
        getNextLevelPack(): ILevelPack;
        /** The previous level pack. Or the last, if this the first. */
        getPreviousLevelPack(): ILevelPack;
    }
    class LevelPack implements ILevelPack {
        private _levels: ILevel[] = new Array();
        constructor(private idName: string) {
            _packs.push(this);
        }
        getIdName(): string {
            return this.idName;
        }
        getLevel(nr: number) {
            return this._levels[nr];
        }
        getLevels(): ILevel[] {
            return this._levels.slice(0);
        }
        addLevel(lvl: ILevel) {
            this._levels.push(lvl);
        }
        getNextLevelPack(): ILevelPack {
            var nextIndex = _packs.indexOf(this) + 1
            if (nextIndex === _packs.length) return _packs[0]
            return _packs[nextIndex]
        }
        getPreviousLevelPack(): ILevelPack {
            var prevIndex = _packs.indexOf(this) - 1
            if (prevIndex === -1) return _packs[_packs.length - 1]
            return _packs[prevIndex]
        }
    }
    // There are only for conveniance:
    var red = 'red';
    var green = 'green';
    var blue = 'blue';
    var yellow = 'yellow';
    var prog1 = 'prog1';
    var prog2 = 'prog2';
    var prog3 = 'prog3';
    var prog4 = 'prog4';
    var empty = 'empty';
    var nonempty = 'nonempty';
    var right = 'right';
    var grab = 'grab';
    var left = 'left';
    // Tools that are used in most levels:
    var BASE_TOOLS = [right, grab, left, prog1, prog2, prog3, prog4];
    var ALL_TOOLS = BASE_TOOLS.concat(blue, red, green, yellow, empty, nonempty);
    // These get stored in _packs. The ordering is preserved.
    export var TUTORIALS: ILevelPack = new LevelPack('tutorials');
    export var EASY: ILevelPack = new LevelPack('easy');
    export var MEDIUM: ILevelPack = new LevelPack('medium');
    export var HARD: ILevelPack = new LevelPack('hard');
    export var CRAZY: ILevelPack = new LevelPack('crazy');
    export var IMPOSSIBLE: ILevelPack = new LevelPack('impossible');
    export var BONUS: ILevelPack = new LevelPack('bonus');
    export var EDITOR: ILevelPack = new LevelPack('editor');

    var draggingElement = () => {
            var elemClassList = document.getElementById('dragImage').className.split(/\s+/);
            for (var i = 0; i < elemClassList.length; i++) {
                if (i == 1) {
                    var elem = elemClassList[i].replace('cmd-', '');
                }
            }
            if (elem != undefined) {
                return elem;
            } else {
                return '';
            }
        }
        /**** DEFINITIONS ****/
    export var CARGO_101: ILevel = new Level('Cargo 101', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler
        [3, 3, 3], // Max. registers for 3, 2 star rating, respectively.
        BASE_TOOLS, // available tools
        [
            [yellow],
            []
        ], // start formation
        [
            [],
            [yellow]
        ], // goal / end formation
        function(e) {
            //"is()" tells you whether there is an operation at program 1, register #.
            var is = (prog: number, r: number, i: cmd.IInstruction) => {
                return e._model.getCode().getOperation(prog, r).same(i);
            }
            var noop = (r: number, prog ? : number) => {
                if (prog == undefined || prog < 0) {
                    return is(1, r, cmd.NOOP)
                } else {
                    return is(prog, r, cmd.NOOP)
                }
            }
            var grab = (r: number) => {
                return is(1, r, cmd.GRAB)
            }
            var right = (r: number) => {
                return is(1, r, cmd.RIGHT)
            }
            var noothers = () => {
                for (var i = 1; i < 5; i++) {
                    for (var j = 0; j < 8; j++) {
                        try {
                            if (i == 1 && j > 2) {
                                if (i != 4) {
                                    if (!noop(j, i)) {
                                        return false;
                                    }
                                } else {
                                    if (j < 5) {
                                        if (!noop(j, i)) {
                                            return false;
                                        }
                                    }
                                }
                            } else if (i != 1) {
                                if (i == 4) {
                                    if (j < 5) {
                                        if (!noop(j, i)) {
                                            return false;
                                        }
                                    }
                                } else {
                                    if (!noop(j, i)) {
                                        return false;
                                    }
                                }
                            }
                        } catch (ex) {}
                    }
                    if (i == 4) {
                        return true;
                    }
                }
            }
            var bundle = translate.levels.getBundle(this.title);
            //Checks when loading and clear
            if (e.type == EventType.LOAD && noop(0) || e.type == EventType.CLEAR && noop(0)) e._view.showHint('tool_grab', bundle.getText('A'))
            else if (e.type == EventType.LOAD && noop(1) || e.type == EventType.CLEAR && noop(1)) e._view.showHint('tool_right', bundle.getText('B'))
            else if (e.type == EventType.LOAD && noop(2) || e.type == EventType.CLEAR && noop(2)) e._view.showHint('tool_grab', bundle.getText('C'))
            else if ((e.type == EventType.LOAD && grab(0) && noothers()) || (e.type == EventType.LOAD && grab(0) && right(1) && noothers()) || (e.type == EventType.LOAD && grab(0) && right(1) && grab(2) && noothers())) e._view.showHint('play', translate.levels.getText('play'))
                //While playing animation
            else if (e.type == EventType.PLAY) e._view.hideHints()
                //Checks when dragging
            else if (e.type == EventType.DRAG && noop(0) && draggingElement() == "grab" || (e.type == EventType.DRAG && !grab(0) && draggingElement() == "grab")) e._view.showHint('reg_1_0', translate.levels.getText('drop'))
            else if (e.type == EventType.DRAG && noop(1) && draggingElement() == "right" || e.type == EventType.DRAG && !right(1) && draggingElement() == "right") e._view.showHint('reg_1_1', translate.levels.getText('drop'))
            else if (e.type == EventType.DRAG && noop(2) && draggingElement() == "grab" || e.type == EventType.DRAG && !grab(2) && draggingElement() == "grab") e._view.showHint('reg_1_2', translate.levels.getText('drop'))
            else if ((e.type == EventType.DRAG && draggingElement() != "grab") || (e.type == EventType.DRAG && draggingElement() != "right")) e._view.showHint('dragImage', translate.levels.getText('dragOther'))
                //Checks dropping
            else if ((e.type == EventType.DROP && grab(0) && noothers()) || (e.type == EventType.DROP && grab(0) && right(1) && noothers()) || (e.type == EventType.DROP && grab(0) && right(1) && grab(2) && noothers())) e._view.showHint('play', translate.levels.getText('play'))
            else if (e.type == EventType.DROP && noop(0)) e._view.showHint('reg_1_0', translate.levels.getText('drop'))
            else if (e.type == EventType.DROP && noop(1)) e._view.showHint('reg_1_1', translate.levels.getText('drop'))
            else if (e.type == EventType.DROP && noop(2)) e._view.showHint('reg_1_2', translate.levels.getText('drop'))
                //Checks when ending
            else if ((e.type == EventType.END && grab(0)) || (e.type == EventType.END && right(1)) || (e.type == EventType.END && grab(2))) e._view.showHint('play', translate.levels.getText('stop'))
                //Checks when stopping
            else if (e.type == EventType.STOP && grab(0) && noop(1)) e._view.showHint('tool_right', bundle.getText('B'))
            else if (e.type == EventType.STOP && grab(0) && right(1) && noop(2)) e._view.showHint('tool_grab', bundle.getText('C'))
                // game is won!
        });
    export var TRANSPORTER: ILevel = new Level('Transporter', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler 
        [5, 5, 4], //Rating
        BASE_TOOLS, // available tools
        [
            [yellow],
            [],
            [],
            []
        ], // start formation
        [
            [],
            [],
            [],
            [yellow]
        ], // goal / end formation
        function(e) {
            var bundle = translate.levels.getBundle(this.title)
            if (e.type === EventType.LOAD && e._model.getCode().getNumberOfOperations() === 0) e._view.showHint('goal', bundle.getText('yourself'))
            else if (e.type === EventType.DROP && e._model.getCode().getOperation(1, 3).same(cmd.PROG1)) e._view.showHint('play', translate.levels.getText('play'))
            else if (e.type === EventType.PLAY) e._view.hideHints()
        });
    export var RE_COURSES: ILevel = new Level('Re-Curses', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler
        [10, 5, 5], BASE_TOOLS, // available tools
        [
            [yellow, yellow, yellow, yellow],
            []
        ], // start formation
        [
            [],
            [yellow, yellow, yellow, yellow]
        ], // goal / end formation
        function(e) {
            if (e['done']) return
            var bundle = translate.levels.getBundle(this.title)
            var code = e._model.getCode()
            var is = (prog: number, r: number, i: cmd.IInstruction) => {
                return e._model.getCode().getOperation(prog, r).same(i);
            }
            var prog1 = (r: number) => {
                return is(1, r, cmd.PROG1)
            }
            var noop = (r: number, prog ? : number) => {
                if (prog == undefined || prog < 0) {
                    return is(1, r, cmd.NOOP)
                } else {
                    return is(prog, r, cmd.NOOP)
                }
            }
            var grab = (r: number) => {
                return is(1, r, cmd.GRAB)
            }
            var noothers = () => {
                    for (var i = 1; i < 5; i++) {
                        for (var j = 0; j < 8; j++) {
                            try {
                                if (i == 1 && j > 1) {
                                    if (i != 4) {
                                        if (!noop(j, i)) {
                                            return false;
                                        }
                                    } else {
                                        if (j < 5) {
                                            if (!noop(j, i)) {
                                                return false;
                                            }
                                        }
                                    }
                                } else if (i != 1) {
                                    if (i == 4) {
                                        if (j < 5) {
                                            if (!noop(j, i)) {
                                                return false;
                                            }
                                        }
                                    } else {
                                        if (!noop(j, i)) {
                                            return false;
                                        }
                                    }
                                }
                            } catch (ex) {}
                        }
                        if (i == 4) {
                            return true;
                        }
                    }
                }
                //Checks when loading and clear
            if ((e.type === EventType.LOAD && noop(0)) || e.type === EventType.CLEAR) e._view.showHint('tool_prog1', bundle.getText('loop'))
            else if (e.type === EventType.LOAD && prog1(0) && noop(1)) e._view.showHint('reg_1_0', bundle.getText('move'))
            else if (e.type === EventType.LOAD && prog1(1)) e._view.showHint('tool_grab', bundle.getText('grab'))
            else if (e.type == EventType.LOAD && grab(0) && prog1(1)) e._view.showHint('play', translate.levels.getText('play'))
                //Checks when dragging
            else if (e.type === EventType.DRAG && noop(0) && noop(1) && draggingElement() == "prog1") e._view.showHint('reg_1_0', translate.levels.getText('drop'))
            else if (e.type === EventType.DRAG && prog1(0) && noop(1) && draggingElement() == "prog1") e._view.showHint('reg_1_1', translate.levels.getText('drop'))
            else if (e.type === EventType.DRAG && prog1(1) && noop(0) && draggingElement() == "grab") e._view.showHint('reg_1_0', translate.levels.getText('drop'))
            else if ((e.type == EventType.DRAG && draggingElement() != "grab") || (e.type == EventType.DRAG && draggingElement() != "prog1")) e._view.showHint('dragImage', translate.levels.getText('dragOther'))
                //Checks dropping
            else if (e.type === EventType.DROP && noop(1) && prog1(0) && noothers()) e._view.showHint('reg_1_0', bundle.getText('move'))
            else if (e.type === EventType.DROP && noop(0) && prog1(1) && noothers()) e._view.showHint('tool_grab', bundle.getText('grab'))
            else if (e.type == EventType.DROP && grab(0) && prog1(1) && noothers()) e._view.showHint('play', translate.levels.getText('play'))
                //While playing animation
            else if (e.type === EventType.PLAY && grab(0) && prog1(1)) {
                e['done'] = true;
                e._view.showHint('gameplay', bundle.getText('well done'))
            }
        });
    export var INVERTER: ILevel = new Level('Inverter', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler
        [15, 10, 10], //Rating
        BASE_TOOLS, // available tools
        [
            [blue, red, green, yellow],
            [],
            [],
            [],
            [],
            []
        ], // start formation
        [
            [],
            [],
            [],
            [],
            [],
            [yellow, green, red, blue]
        ], // goal / end formation
        function(e) {
            if (e['done']) return
            var bundle = translate.levels.getBundle(this.title)
            var code = e._model.getCode()
            var is = (p: number, r: number, i: cmd.IInstruction) => {
                return code.getOperation(p, r).same(i);
            }
            var nootherProg2 = () => {
                for (var i = 1; i < 5; i++) {
                    for (var j = 0; j < 8; j++) {
                        if (i == 1) {
                            if (j != 0 && j != 1) {
                                if (is(i, j, cmd.PROG2)) {
                                    return false;
                                }
                            }
                        } else {
                            if (i == 4) {
                                if (j < 6) {
                                    if (is(i, j, cmd.PROG2)) {
                                        return false;
                                    }
                                }
                            } else {
                                if (is(i, j, cmd.PROG2)) {
                                    return false;
                                }
                            }
                        }
                    }
                    if (i == 4) {
                        return true;
                    }
                }
            }
            if ((e.type === EventType.LOAD || e.type === EventType.CLEAR)) {
                code.reset()
                code.setOperation(1, 0, cmd.GRAB)
                code.setOperation(1, 1, cmd.RIGHT)
                code.setOperation(1, 2, cmd.GRAB)
                code.setOperation(1, 3, cmd.LEFT)
                code.setOperation(1, 4, cmd.GRAB)
                code.setOperation(1, 5, cmd.RIGHT)
                code.setOperation(1, 6, cmd.GRAB)
                code.setOperation(1, 7, cmd.LEFT)
            }
            if (!e['use_progs'] && code.getNumberOfOperations() === 8 && code.getOperation(1, 0).same(cmd.GRAB) && code.getOperation(1, 1).same(cmd.RIGHT) && code.getOperation(1, 2).same(cmd.GRAB) && code.getOperation(1, 3).same(cmd.LEFT) && code.getOperation(1, 4).same(cmd.GRAB) && code.getOperation(1, 5).same(cmd.RIGHT) && code.getOperation(1, 6).same(cmd.GRAB) && code.getOperation(1, 7).same(cmd.LEFT)) {
                e['use_progs'] = true
                e._view.showHint('gameplay', bundle.getText('use progs'))
            } else if (e.type === EventType.HIDE && is(1, 0, cmd.GRAB) && is(2, 0, cmd.NOOP)) {
                e._view.showHint('reg_1_0', bundle.getText('move'))
            } else if (e.type === EventType.DROP && is(1, 0, cmd.GRAB) && is(2, 0, cmd.NOOP)) {
                e._view.showHint('reg_1_0', bundle.getText('move'))
            } else if (e.type === EventType.DROP && is(2, 0, cmd.GRAB) && is(1, 1, cmd.RIGHT)) {
                e._view.showHint('reg_1_1', bundle.getText('move'))
            } else if (e.type === EventType.DROP && is(2, 1, cmd.RIGHT) && is(1, 2, cmd.GRAB)) {
                e._view.showHint('reg_1_2', bundle.getText('move'))
            } else if (e.type === EventType.DROP && is(2, 0, cmd.GRAB) && is(2, 2, cmd.GRAB) && is(1, 3, cmd.LEFT)) {
                e._view.showHint('reg_1_3', bundle.getText('move'))
            } else if (e.type === EventType.DROP && is(2, 3, cmd.LEFT) && is(1, 0, cmd.NOOP) && nootherProg2()) {
                e._view.showHint('tool_prog2', bundle.getText('drag'))
            } else if (e.type === EventType.DROP && is(1, 0, cmd.PROG2) && is(1, 1, cmd.NOOP) && nootherProg2()) {
                e._view.showHint('tool_prog2', bundle.getText('another'))
            } else if (e.type === EventType.DROP && is(1, 1, cmd.PROG2)) {
                e._view.showHint('play', bundle.getText('each time'))
            } else if (e.type === EventType.DRAG && is(1, 0, cmd.NOOP) && draggingElement() == "prog2") {
                e._view.showHint('reg_1_0', translate.levels.getText('drop'))
            } else if (e.type === EventType.DRAG && is(1, 1, cmd.NOOP) && draggingElement() == "prog2") {
                e._view.showHint('reg_1_1', translate.levels.getText('drop'))
            } else if (e.type === EventType.DRAG && !is(2, 0, cmd.GRAB) && draggingElement() == "grab") {
                e._view.showHint('reg_2_0', translate.levels.getText('drop'))
            } else if (e.type === EventType.DRAG && !is(2, 1, cmd.RIGHT) && draggingElement() == "right") {
                e._view.showHint('reg_2_1', translate.levels.getText('drop'))
            } else if (e.type === EventType.DRAG && !is(2, 2, cmd.GRAB) && draggingElement() == "grab") {
                e._view.showHint('reg_2_2', translate.levels.getText('drop'))
            } else if (e.type === EventType.DRAG && !is(2, 3, cmd.LEFT) && draggingElement() == "left") {
                e._view.showHint('reg_2_3', translate.levels.getText('drop'))
            } else if (e.type === EventType.PLAY) {
                e['done'] = true
                e._view.hideHints()
            }
        });
    /** FROM_BENEATH2 is a special Level that is shown to teach conditions.
    It is shown at the beginning ot "FROM_BENEATH".
     */
    export var FROM_BENEATH2: ILevel = new Level('From Beneath2', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler
        [8, 6, 5], //Rating
        BASE_TOOLS.concat(yellow, empty, nonempty), // available tools
        [
            [yellow, yellow, yellow, yellow],
            []
        ], // start formation
        [
            [],
            [yellow, yellow, yellow, yellow]
        ], // goal / end formation
        function(e) {
            var bundle = translate.levels.getBundle(this.title)
            var code = e._model.getCode()
            var is = (p: number, r: number, i: cmd.IInstruction) => {
                return code.getCondition(p, r).same(i);
            }
            var nootherYellow = () => {
                for (var i = 1; i < 5; i++) {
                    for (var j = 0; j < 8; j++) {
                        if (i == 1) {
                            if (j != 1) {
                                if (is(i, j, cmd.YELLOW)) {
                                    return false;
                                }
                            }
                        } else {
                            if (i == 4) {
                                if (j < 6) {
                                    if (is(i, j, cmd.YELLOW)) {
                                        return false;
                                    }
                                }
                            } else {
                                if (is(i, j, cmd.YELLOW)) {
                                    return false;
                                }
                            }
                        }
                    }
                    if (i == 4) {
                        return true;
                    }
                }
            }
            var nootherEmpty = () => {
                for (var i = 1; i < 5; i++) {
                    for (var j = 0; j < 8; j++) {
                        if (i == 1) {
                            if (j != 2) {
                                if (is(i, j, cmd.EMPTY)) {
                                    return false;
                                }
                            }
                        } else {
                            if (i == 4) {
                                if (j < 6) {
                                    if (is(i, j, cmd.EMPTY)) {
                                        return false;
                                    }
                                }
                            } else {
                                if (is(i, j, cmd.EMPTY)) {
                                    return false;
                                }
                            }
                        }
                    }
                    if (i == 4) {
                        return true;
                    }
                }
            }
            if (e.type === EventType.LOAD || e.type === EventType.CLEAR) {
                code.reset()
                code.setOperation(1, 0, cmd.GRAB)
                code.setOperation(1, 1, cmd.RIGHT)
                code.setOperation(1, 2, cmd.LEFT)
                code.setOperation(1, 3, cmd.PROG1)
            }
            if (e.type === EventType.WIN) {
                e['step'] = 100
                e._view.setYouGotItState(false) // never show this!
                    //TODO: sm is null 
                e.sm.reset();
            }
            if (e['step'] >= 22) {
                if (e.type === EventType.CLEAR) code.reset()
                if (code.getNumberOfOperations() > 0) {
                    $("#btn_step").hide();
                    $("#btn_clear").click(() => {
                        $("#btn_step").show();
                    });
                    e._view.showHint('btn_clear', bundle.getText('E'))
                } else if (e.type === EventType.CLEAR) {
                    e._view.showHint('gameplay', bundle.getText('F'))
                    FROM_BENEATH2['done'] = true
                } else if (FROM_BENEATH2['done']) {
                    //  to "From Beneath":
                    e._model.setLevel(FROM_BENEATH)
                }
            } else if (!is(1, 1, cmd.YELLOW)) {
                if (EventType.DRAG !== e.type && nootherYellow()) e._view.showHint('tool_yellow', bundle.getText('A'))
                else if (draggingElement() == 'yellow') e._view.showHint('reg_1_1', translate.levels.getText('drop'))
                else e._view.showHint('dragImage', translate.levels.getText('dragOther'))
            } else if (is(1, 1, cmd.YELLOW) && !is(1, 2, cmd.EMPTY)) {
                if (EventType.DRAG !== e.type && nootherEmpty()) e._view.showHint('tool_empty', bundle.getText('B'))
                else if (draggingElement() == 'empty') e._view.showHint('reg_1_2', translate.levels.getText('drop'))
                else e._view.showHint('dragImage', translate.levels.getText('dragOther'))
            } else if (is(1, 1, cmd.YELLOW) && is(1, 2, cmd.EMPTY)) {
                if (e.type === EventType.DROP) {
                    e['step'] = 1
                    e._view.showHint('btn_step', bundle.getText('C'))
                } else if (e.type === EventType.STEP) {
                    if (e['step'] < 22) {
                        e['step'] += 1
                        e._view.showHint('btn_step', bundle.getText('D'))
                    }
                }
            }
        });
    export var FROM_BENEATH: ILevel = new Level('From Beneath', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler
        [8, 6, 5], //Rating
        BASE_TOOLS.concat(blue, yellow, empty, nonempty), // available tools
        [
            [yellow, blue, blue, blue, blue],
            [],
            []
        ], // start formation
        [
            [],
            [blue, blue, blue, blue],
            [yellow]
        ], // goal / end formation
        function(e) {

            var code = e._model.getCode()

            if ((e.type === EventType.CLEAR || e.type === EventType.LOAD) && !FROM_BENEATH2['done']) {
                FROM_BENEATH2['done'] = false
                e._model.setLevel(FROM_BENEATH2)
            } else if (FROM_BENEATH2['done'] && (e.type === EventType.LOAD || e.type === EventType.CLEAR)) {
                var code = e._model.getCode()
                code.reset()
                code.setOperation(1, 0, cmd.GRAB)
                code.setOperation(1, 1, cmd.RIGHT)
                code.setOperation(1, 2, cmd.LEFT)
                code.setOperation(1, 3, cmd.PROG1)
                return
            }
            // switch to "From Beneath2":
            if (e.type === EventType.LOAD && code.getNumberOfOperations() === 0) {
                e._model.setLevel(FROM_BENEATH2)
            }
        });
    export var GO_LEFT: ILevel = new Level('Go Left', // Title of the level
        TUTORIALS, // Levels pack
        0, // Start platform of the grappler
        [15, 9, 9], // Rating
        BASE_TOOLS, // available tools
        [
            [],
            [red, red, red],
            [green, green, green],
            [blue, blue, blue]
        ], // start formation
        [
            [red, red, red],
            [green, green, green],
            [blue, blue, blue],
            []
        ], // goal / end formation
        function(e) {
            // the user is on his own.
        });
    export var DOUBLE_FLIP: ILevel = new Level('Double Flip', // Title of the level
        EASY, // Levels pack
        0, // Start platform of the grappler
        [12, 6, 5], //Rating
        ALL_TOOLS, // available tools
        [
            [blue, red, green, yellow],
            [],
            []
        ], // start formation
        [
            [],
            [],
            [blue, red, green, yellow]
        ] // goal / end formation
    );
    export var GO_LEFT_2: ILevel = new Level('Go Left 2', // Title of the level
        EASY, // Levels pack
        0, // Start platform of the grappler
        [8, 6, 4], //Rating
        BASE_TOOLS.concat(blue, red, green, empty, nonempty), // available tools
        [
            [],
            [red, red, red],
            [blue, blue, blue],
            [green, green, green]
        ], // start formation
        [
            [red, red, red],
            [blue, blue, blue],
            [green, green, green],
            []
        ] // goal / end formation
    );
    export var SHUFFLE_SORT: ILevel = new Level('Shuffle Sort', // Title of the level
        EASY, // Levels pack
        1, // Start platform of the grappler
        [15, 10, 9], //Rating
        BASE_TOOLS, // available tools
        [
            [],
            [blue, yellow, blue, yellow, blue, yellow],
            []
        ], // start formation
        [
            [blue, blue, blue],
            [],
            [yellow, yellow, yellow]
        ] // goal / end formation
    );
    export var GO_THE_DISTANCE: ILevel = new Level('Go the Distance', // Title of the level
        EASY, // Levels pack
        0, // Start platform of the grappler
        [12, 6, 4], //Rating
        BASE_TOOLS.concat(red, yellow, empty, nonempty), // available tools
        [
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [],
            [red, red, red, red]
        ], // start formation
        [
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [red, red, red, red],
            []
        ] // goal / end formation
    );
    export var COLOR_SORT: ILevel = new Level('Color Sort', // Title of the level
        EASY, // Levels pack
        1, // Start platform of the grappler
        [14, 10, 8], //Rating
        BASE_TOOLS.concat(red, green, empty, nonempty), // available tools
        [
            [],
            [green, green, red, green, red, red],
            []
        ], // start formation
        [
            [red, red, red],
            [],
            [green, green, green]
        ] // goal / end formation
    );
    export var WALKING_PILES: ILevel = new Level('Walking Piles', // Title of the level
        EASY, // Levels pack
        0, // Start platform of the grappler
        [13, 11, 9], //Rating
        BASE_TOOLS.concat(blue, empty), // available tools
        [
            [blue, blue, blue, blue],
            [blue, blue, blue, blue],
            [blue, blue, blue, blue],
            [],
            [],
            [],
            []
        ], // start formation
        [
            [],
            [],
            [],
            [],
            [blue, blue, blue, blue],
            [blue, blue, blue, blue],
            [blue, blue, blue, blue]
        ] // goal / end formation 
    );
    // Medium:
    export var REPEAT_INVERTER: ILevel = new Level('Repeat Inverter', // Title of the level
        MEDIUM, // Levels pack
        0, // Start platform of the grappler
        [9, 7, 5], //Rating
        ALL_TOOLS, // available tools
        [
            [yellow, red, green, blue],
            [],
            [yellow, red, green, blue],
            [],
            [yellow, red, green, blue],
            []
        ], // start formation
        [
            [],
            [blue, green, red, yellow],
            [],
            [blue, green, red, yellow],
            [],
            [blue, green, red, yellow]
        ] // goal / end formation
    );
    export var DOUBLE_SORT: ILevel = new Level('Double Sort', // Title of the level
        MEDIUM, // Levels pack
        0, // Start platform of the grappler
        [20, 14, 11], //Rating
        BASE_TOOLS.concat(blue, yellow, empty, nonempty), // available tools
        [
            [],
            [blue, blue, yellow, yellow],
            [yellow, blue, yellow, blue],
            []
        ], // start formation
        [
            [blue, blue, blue, blue],
            [],
            [],
            [yellow, yellow, yellow, yellow]
        ] // goal / end formation
    );
    export var MIRROR: ILevel = new Level('Mirror', // Title of the level
        MEDIUM, // Levels pack
        0, // Start platform of the grappler
        [9, 7, 6], //Rating
        BASE_TOOLS.concat(green, yellow, empty, nonempty), // available tools
        [
            [yellow, yellow, yellow, yellow],
            [green, green],
            [green],
            [green],
            [green, green],
            []
        ], // start formation
        [
            [],
            [green, green],
            [green],
            [green],
            [green, green],
            [yellow, yellow, yellow, yellow]
        ] // goal / end formation
    );
    export var LAY_IT_OUT: ILevel = new Level('Lay it out', // Title of the level
        MEDIUM, // Levels pack
        0, // Start platform of the grappler
        [13, 9, 7], //Rating
        BASE_TOOLS.concat(green, empty), // available tools
        [
            [green, green, green, green, green, green],
            [],
            [],
            [],
            [],
            []
        ], // start formation
        [
            [green],
            [green],
            [green],
            [green],
            [green],
            [green]
        ] // goal / end formation
    );
    export var THE_STACKER: ILevel = new Level('The Stacker', // Title of the level
        MEDIUM, // Levels pack
        0, // Start platform of the grappler
        [10, 8, 6], //Rating
        BASE_TOOLS.concat(yellow, empty), // available tools
        [
            [],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            []
        ], // start formation
        [
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [yellow, yellow, yellow, yellow, yellow, yellow]
        ] // goal / end formation
    );
    export var CLARITY: ILevel = new Level('Clarity', // Title of the level
        MEDIUM, // Levels pack
        0, // Start platform of the grappler
        [9, 7, 6], //Rating
        BASE_TOOLS.concat(red, green, empty, nonempty), // available tools
        [
            [green, red, green],
            [green, green, green, red, green],
            [red, green, red, green],
            [red, green, green],
            []
        ], // start formation
        [
            [green, red],
            [green, green, green, red],
            [red, green, red],
            [red],
            [green, green, green, green, green]
        ] // goal / end formation
    );
    export var COME_TOGETHER: ILevel = new Level('Come Together', // Title of the level
        HARD, // Levels pack
        0, // Start platform of the grappler
        [15, 9, 7], //Rating
        BASE_TOOLS.concat(yellow, empty), // available tools
        [
            [],
            [],
            [yellow, yellow, yellow],
            [yellow],
            [],
            [],
            [yellow, yellow]
        ], // start formation
        [
            [yellow, yellow, yellow, yellow, yellow, yellow],
            [],
            [],
            [],
            [],
            [],
            []
        ] // goal / end formation
    );
    export var COME_TOGETHER_2: ILevel = new Level('Come Together 2', // Title of the level
        HARD, // Levels pack
        0, // Start platform of the grappler
        [12, 10, 8], //Rating
        BASE_TOOLS.concat(green, yellow, empty, nonempty), // available tools
        [
            [],
            [yellow],
            [yellow, green, green],
            [yellow],
            [yellow, green],
            [yellow],
            [green, green, green]
        ], // start formation
        [
            [green, green, green, green, green, green],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            [yellow],
            []
        ] // goal / end formation
    );
    export var UP_THE_GREENS: ILevel = new Level('Up The Greens', // Title of the level
        HARD, // Levels pack
        0, // Start platform of the grappler
        [12, 9, 7], //Rating
        BASE_TOOLS.concat(blue, green, empty, nonempty), // available tools
        [
            [green],
            [blue, blue],
            [green],
            [],
            [blue, blue, blue],
            [green],
            [blue, blue],
            [blue, blue]
        ], // start formation
        [
            [green, blue, blue],
            [],
            [green, blue, blue, blue],
            [],
            [],
            [green, blue, blue, blue, blue],
            [],
            []
        ] // goal / end formation
    );
    export var FILL_THE_BLANKS: ILevel = new Level('Fill The Blanks', // Title of the level
        HARD, // Levels pack
        0, // Start platform of the grappler
        [20, 14, 11], //Rating
        BASE_TOOLS.concat(red, green, empty, nonempty), // available tools
        [
            [green, green, green, green],
            [red],
            [],
            [red],
            [],
            [],
            [red],
            []
        ], // start formation
        [
            [],
            [red],
            [green],
            [red],
            [green],
            [green],
            [red],
            [green]
        ] // goal / end formation
    );
    export var COUNT_THE_BLUES: ILevel = new Level('Count The Blues', // Title of the level
        HARD, // Levels pack
        0, // Start platform of the grappler
        [15, 12, 9], //Rating
        BASE_TOOLS.concat(blue, yellow, empty, nonempty), // available tools
        [
            [yellow, blue, blue],
            [],
            [],
            [],
            [yellow, blue],
            [],
            []
        ], // start formation
        [
            [],
            [blue, blue],
            [],
            [yellow],
            [],
            [blue],
            [yellow]
        ] // goal / end formation
    );
    export var MULTI_SORT: ILevel = new Level('Multi Sort', // Title of the level
        HARD, // Levels pack
        0, // Start platform of the grappler
        [16, 11, 11], //Rating
        BASE_TOOLS.concat(blue, yellow, empty, nonempty), // available tools
        [
            [],
            [blue, yellow],
            [],
            [yellow, yellow, blue],
            [yellow, blue, yellow, blue],
            [blue, yellow],
            [blue],
            []
        ], // start formation
        [
            [yellow, yellow, yellow, yellow, yellow, yellow],
            [],
            [],
            [],
            [],
            [],
            [],
            [blue, blue, blue, blue, blue, blue]
        ] // goal / end formation
    );
    export var DIVIDE_BY_TWO: ILevel = new Level('Divide by two', // Title of the level
        CRAZY, // Levels pack
        0, // Start platform of the grappler
        [20, 14, 12], //Rating
        BASE_TOOLS.concat(blue, empty), // available tools
        [
            [blue, blue, blue, blue],
            [],
            [blue, blue],
            [],
            [blue, blue, blue, blue, blue, blue],
            [],
            [blue, blue, blue, blue],
            []
        ], // start formation
        [
            [blue, blue],
            [blue, blue],
            [blue],
            [blue],
            [blue, blue, blue],
            [blue, blue, blue],
            [blue, blue],
            [blue, blue]
        ] // goal / end formation
    );
    export var THE_MERGER: ILevel = new Level('The Merger', // Title of the level
        CRAZY, // Level's pack
        0, // Start platform of the grappler 
        [9, 7, 6], // Rating
        BASE_TOOLS.concat(blue, red, empty, nonempty), // available tools
        [
            [blue, blue, blue],
            [],
            [red, red, red]
        ], // start formation
        [
            [],
            [blue, red, blue, red, blue, red],
            []
        ] // goal formation
    );
    export var EVEN_THE_ODDS: ILevel = new Level('Even the Odds', // Title of the level
        CRAZY, // Level's pack
        0, // Start platform of the grappler 
        [13, 11, 10], // Rating
        ALL_TOOLS, // available tools
        [
            [green, green, green, green, green],
            [],
            [red, red],
            [],
            [blue, blue, blue],
            [],
            [yellow, yellow, yellow, yellow],
            []
        ], // start formation
        [
            [green],
            [green, green, green, green],
            [],
            [red, red],
            [blue],
            [blue, blue],
            [],
            [yellow, yellow, yellow, yellow]
        ] // goal formation
    );
    export var GENETIC_CODE: ILevel = new Level('Genetic Code', // Title of the level
        CRAZY, // Level's pack
        0, // Start platform of the grappler 
        [29, 20, 17], // Rating
        BASE_TOOLS.concat(green, yellow, empty, nonempty), // available tools
        [
            [green, yellow, yellow, green, yellow, green],
            [],
            [yellow, yellow, yellow],
            [],
            [green, green, green]
        ], // start formation
        [
            [],
            [green, yellow, green, yellow, yellow, green],
            [],
            [green, yellow, yellow, green, yellow, green],
            []
        ] // goal formation
    );
    export var MULTI_SORT_2: ILevel = new Level('Multi Sort 2', // Title of the level
        CRAZY, // Level's pack
        0, // Start platform of the grappler 
        [25, 17, 17], // Rating
        ALL_TOOLS, // available tools
        [
            [],
            [blue, yellow, red, green, yellow],
            [],
            [red, blue, blue, green, green, yellow],
            [],
            [red, green, yellow, red, blue],
            []
        ], // start formation
        [
            [blue, blue, blue, blue],
            [],
            [red, red, red, red],
            [],
            [green, green, green, green],
            [],
            [yellow, yellow, yellow, yellow]
        ] // goal formation
    );
    export var THE_SWAP: ILevel = new Level('The Swap', // Title of the level
        CRAZY, // Level's pack
        1, // Start platform of the grappler 
        [15, 12, 10], // Rating
        BASE_TOOLS.concat(red, green, empty, nonempty), // available tools
        [
            [red, red, red],
            [],
            [green, green, green]
        ], // start formation
        [
            [green, green, green],
            [],
            [red, red, red]
        ] // goal formation
    );
    export var RESTORING_ORDER: ILevel = new Level('Restoring Order', // Title of the level
        IMPOSSIBLE, // Level's pack
        0, // Start platform of the grappler 
        [29, 20, 16], // Rating
        BASE_TOOLS.concat(blue, red, empty, nonempty), // available tools
        [
            [],
            [blue, red, blue, blue],
            [red, blue, red, blue],
            [blue, blue, blue],
            [red],
            [red, blue],
            [blue],
            []
        ], // start formation
        [
            [],
            [blue, blue, blue],
            [blue, blue],
            [blue, blue, blue],
            [],
            [blue],
            [blue],
            [red, red, red, red, red]
        ] // goal formation
    );
    export var CHANGING_PLACES: ILevel = new Level('Changing Places', // Title of the level
        IMPOSSIBLE, // Level's pack
        0, // Start platform of the grappler 
        [20, 18, 17], // Rating
        BASE_TOOLS.concat(red, green, empty, nonempty), // available tools
        [
            [red],
            [red, red, red],
            [green, green, green],
            [],
            [red, red, red, red],
            [red, red],
            [green, green, green, green],
            [green]
        ], // start formation
        [
            [red, red, red],
            [red],
            [],
            [green, green, green],
            [red, red],
            [red, red, red, red],
            [green],
            [green, green, green, green]
        ] // goal formation
    );
    export var PALETTE_SWAP: ILevel = new Level('Palette Swap', // Title of the level
        IMPOSSIBLE, // Level's pack
        1, // Start platform of the grappler 
        [29, 18, 15], // Rating
        BASE_TOOLS.concat(blue, red, empty, nonempty), // available tools
        [
            [],
            [red, blue],
            [blue, red, blue, red],
            [blue, red],
            [blue, red, blue, red],
            [],
            [blue, red, blue, red, blue, red],
            []
        ], // start formation
        [
            [],
            [blue, red],
            [red, blue, red, blue],
            [red, blue],
            [red, blue, red, blue],
            [],
            [red, blue, red, blue, red, blue],
            []
        ] // goal formation
    );
    export var MIRROR_2: ILevel = new Level('Mirror 2', // Title of the level
        IMPOSSIBLE, // Level's pack
        0, // Start platform of the grappler 
        [20, 15, 12], // Rating
        BASE_TOOLS.concat(yellow, empty), // available tools
        [
            [yellow, yellow, yellow],
            [yellow, yellow],
            [yellow],
            []
        ], // start formation
        [
            [],
            [yellow],
            [yellow, yellow],
            [yellow, yellow, yellow]
        ] // goal formation
    );
    export var CHANGING_PLACES_2: ILevel = new Level('Changing Places 2', // Title of the level
        IMPOSSIBLE, // Level's pack
        0, // Start platform of the grappler 
        [25, 19, 16], // Rating
        BASE_TOOLS.concat(red, empty), // available tools
        [
            [red, ],
            [red, red, red],
            [red],
            [red, red, red, red, red],
            [],
            [red, red],
            [red, red, red, red],
            [red, red, red]
        ], // start formation
        [
            [red, red, red],
            [red],
            [red, red, red, red, red],
            [],
            [red, red],
            [red, red, red, red],
            [red, red, red],
            [red]
        ] // goal formation
    );
    export var VERTICAL_SORT: ILevel = new Level('Vertical Sort', // Title of the level
        IMPOSSIBLE, // Level's pack
        1, // Start platform of the grappler 
        [29, 29, 20], // Rating
        BASE_TOOLS.concat(blue, green, empty, nonempty), // available tools
        [
            [],
            [green, blue, green, blue, blue],
            [blue, green, blue],
            [green, blue, blue, green],
            [blue, green],
            [blue, green, green, green, blue],
            []
        ], // start formation
        [
            [],
            [green, green, blue, blue, blue],
            [green, blue, blue],
            [green, green, blue, blue],
            [green, blue],
            [green, green, green, blue, blue],
            []
        ] // goal formation
    );
    export var COUNT_IN_BINARY: ILevel = new Level('Count in Binary', // Title of the level
        BONUS, // Level's pack
        0, // Start platform of the grappler 
        [29, 23, 17], // Rating
        BASE_TOOLS.concat(green, red, nonempty, empty), // available tools
        [
            [green, green, green, green, green, green],
            [red],
            [],
            [],
            [],
            [],
            [],
        ], // start formation
        [
            [green, green],
            [],
            [green],
            [red],
            [green],
            [],
            [green]
        ] // goal formation
    );
    /*
    export var EQUALIZER: ILevel = new Level(
        'Equalizer',  // Title of the level
        BONUS,  // Level's pack
        0, // Start platform of the grappler 
        [40, 40, 40], // Rating
        funcs = [10, 10, 10, 10, 6],
        BASE_TOOLS.concat(f5, blue, red, empty, nonempty), // available tools
        [[], [blue, blue], [blue], [blue, blue, blue, blue, blue], [], [blue, blue], [blue, blue, blue, blue], [red]], // start formation
        [[blue, blue], [blue, blue], [blue, blue], [blue, blue], [blue, blue], [blue, blue], [blue, blue], [red]] // goal formation
    );*/
    export var PARTING_THE_SEA: ILevel = new Level('Parting the Sea', // Title of the level
        BONUS, // Level's pack
        0, // Start platform of the grappler 
        [17, 17, 17], // Rating
        BASE_TOOLS.concat(blue, empty), // available tools
        [
            [],
            [blue, blue],
            [blue, blue],
            [blue, blue],
            [blue, blue],
            [blue, blue],
            []
        ], // start formation
        [
            [blue, blue, blue, blue, blue],
            [],
            [],
            [],
            [],
            [],
            [blue, blue, blue, blue, blue]
        ] // goal formation
    );
    export var THE_TRICK: ILevel = new Level('The Trick', // Title of the level
        BONUS, // Level's pack
        1, // Start platform of the grappler 
        [20, 14, 11], // Rating
        BASE_TOOLS.concat(red, yellow, empty, nonempty), // available tools
        [
            [yellow, red],
            [],
            [red, yellow]
        ], // start formation
        [
            [red, yellow],
            [],
            [yellow, red]
        ] // goal formation
    );
    export var THE_EDITOR: ILevel = new Level('Level Editor', // Title of the level
      EDITOR, // Level's pack
      1, // Start platform of the grappler 
      [20, 14, 11], // Rating
      BASE_TOOLS.concat(red, yellow, empty, nonempty), // available tools
      [
        [yellow, red],
        [],
        [red, yellow]
      ], // start formation
      [
        [red, yellow],
        [],
        [yellow, red]
      ] // goal formation
    );
}
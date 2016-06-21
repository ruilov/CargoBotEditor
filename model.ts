/** Model (MVC) */
/// <reference path="obs.ts"/>
module model {

    // If you are looking for the "Business Logic":
    // It can be found in sm.ts (stack machine).
    // This doesn't even import sm, because the state of the sm is irrelevant here.
    // The cargo is in this module. It represents the "memory" of the stack machine.

    /** The code is defined by the user and consists of operations and conditions. 
     * Access to any invalid index will throw an exception "Bad index: #x#".
     */
    export interface ICode extends obs.IObservable {
        /** Get command of some register. */
        getCommand(program: number, register: number): cmd.ICommand;
        //Note: Commands are immutable. Use setOperation() and setCondition() to change instructions in this code.
        /** Get operation-instruction of some register. */
        getOperation(program: number, register: number): cmd.IInstruction;
        /** Get condition-instruction of some register. */
        getCondition(program: number, register: number): cmd.IInstruction;
        /** Set operation of one register, while condition is left unchanged. */
        setOperation(program: number, register: number, op: cmd.IInstruction): void;
        /** Set condition of one register, while operation is left unchanged. */
        setCondition(program: number, register: number, cond: cmd.IInstruction): void;
        /** Set operation or condition of one register, while the other is left unchanged. */
        setInstruction(program: number, register: number, instruction: cmd.IInstruction): void;
        /** String representation. Example: '[left|blue]'. */
        toString(): string;
        /** short representation as string. */
        save(): string;
        /** load from string. */
        load(string);
        /** Set all to noop and nocond. */
        reset();
        /** Counts the number of operations in this code. 
        This counds only those operations set by the user (excluding "NOOP" and "EXIT"). 
        The value is used for the rating of the code. */
        getNumberOfOperations(): number;
    }

    class Code extends obs.Observable implements ICode {
        private code: cmd.ICommand[][] = new Array();
        constructor() {
            super();
            this.reset();
        }

        public reset() {
            var noop: cmd.ICommand = cmd.getCommand(cmd.NOOP, cmd.NOCOND);
            var exit: cmd.ICommand = cmd.getCommand(cmd.EXIT, cmd.NOCOND);
            this.code[0] = null;
            this.code[1] = [noop, noop, noop, noop, noop, noop, noop, noop, exit];
            this.code[2] = [noop, noop, noop, noop, noop, noop, noop, noop, exit];
            this.code[3] = [noop, noop, noop, noop, noop, noop, noop, noop, exit];
            this.code[4] = [noop, noop, noop, noop, noop, exit];
        }
        clone(code: ICode): ICode {
            var result = new Code();
            for (var p = 1; p <= 4; p++) {
                for (var r = 0; r <= (p == 4 ? 5 : 8); r++) {
                    result.code[p][r] = cmd.getCommand(code.getOperation(p, r), code.getCondition(p, r));
                }
            }
            return result;
        }

        toString(): string {
            var result = '';
            for (var p = 1; p <= 4; p++) {
                result += 'Prog' + p + ': ';
                for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                    result += this.code[p][r].toString() + ' ';
                }
                result += '\n';
            }
            return result;
        }

        getNumberOfOperations(): number {
            var result = 0;
            for (var p = 1; p <= 4; p++) {
                for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                    var op = this.code[p][r].getOperation();
                    if (!op.same(cmd.NOOP) && !op.same(cmd.EXIT))
                        result++
                }
            }
            return result;
        }

        static CmdID(c: cmd.ICommand) {


        }

        private short(s: string) {
            return s.charAt(0) + s.charAt(s.length - 1);
        }

        /** short representation as string. */
        save(): string {
            var result = '';
            for (var p = 1; p <= 4; p++) {
                for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                    var c = this.code[p][r];
                    result += this.short(c.getOperation().toString());
                    result += this.short(c.getCondition().toString());
                }
            }
            return result;
        }
        /** load from string. */
        load(code: string) {
            try {
                if (!code) throw "";
                var chars = code.split('');
                var instr = {};
                cmd.getInstructions().forEach((i) => {
                    instr[this.short(i.toString())] = i;
                });
                var p = 1;
                var r = 0;
                while (chars.length > 0) {
                    var op = chars.shift() + chars.shift();
                    var cond = chars.shift() + chars.shift();
                    this.setOperation(p, r, instr[op]);
                    this.setCondition(p, r, instr[cond]);
                    if (++r === 8) {
                        r = 0;
                        p++;
                    }
                }
            } catch (e) {
                // RESET:
                for (var p = 1; p <= 4; p++) {
                    for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                        this.setOperation(p, r, cmd.NOOP);
                        this.setCondition(p, r, cmd.NOCOND);
                    }
                }
            }
        }

        getCommand(program: number, register: number): cmd.ICommand {
            if (!this.checkIndex(program, register)) return;
            return this.code[program][register];
        }
        getOperation(program: number, register: number): cmd.IInstruction {
            if (!this.checkIndex(program, register)) return;
            return this.code[program][register].getOperation();
        }
        setOperation(program: number, register: number, op: cmd.IInstruction): void {
            if (!this.checkIndex(program, register)) return;
            var oldCmd = this.code[program][register];
            var newCmd = cmd.getCommand(op, oldCmd.getCondition());
            if (oldCmd.equals(newCmd)) return;
            this.code[program][register] = newCmd;
            this.setChanged();
            this.notify(new msg.RegisterChanged(oldCmd, newCmd, program, register));
        }
        getCondition(program: number, register: number): cmd.IInstruction {
            if (!this.checkIndex(program, register)) return;
            return this.code[program][register].getCondition();
        }
        setCondition(program: number, register: number, cond: cmd.IInstruction): void {
            if (!this.checkIndex(program, register)) return;
            var oldCmd = this.code[program][register];
            var newCmd = cmd.getCommand(oldCmd.getOperation(), cond);
            if (oldCmd.equals(newCmd)) return;
            this.code[program][register] = newCmd;
            this.setChanged();
            this.notify(new msg.RegisterChanged(oldCmd, newCmd, program, register));
        }
        setInstruction(program: number, register: number, instruction: cmd.IInstruction): void {
            if (!this.checkIndex(program, register)) return;
            if (instruction.isOperation())
                this.setOperation(program, register, instruction);
            else
                this.setCondition(program, register, instruction);
        }
        private checkIndex(program: number, register: number): boolean {
            var result: boolean = true;
            if (program < 1 || program > 4) result = false;
            if (register < 0 || register > 8) result = false;
            if (program == 4 && register > 5) result = false;
            if (!result) throw 'Bad index: ' + program + 'x' + register;
            return result;
        }
    }

    export interface ICrate {
        /** There are 3 types of each crate: 1, 2, 3. */
        getType(): number;
        /** One of 'red', 'green', 'yellow', 'blue' or '' (no crate). */
        getColor(): string;
        /** The Cargo of which this crate is part of. Returns null for NO_CRATE. */
        getCargo(): ICargo;
        /** Platform (0-n) where the crate is now. */
        getPlatform(): number;
        /** Position in height (0-6) where the create is now. 
        Note that 6 is the position when the bot holds the crate. */
        getHeight(): number;
        /** Does this crate match the given condition? */
        matches(cond: cmd.IInstruction): boolean;
    }

    class PRNG {
        // chosen by fair dice rolls. guaranteed to be random.
        private pseudoRandom = [1, 2, 3, 2, 3, 1, 3, 1, 2];
        private lastIndex: number = -1;
        reset() {
            this.lastIndex = -1;
        }
        next() {
            this.lastIndex++;
            this.lastIndex %= this.pseudoRandom.length;
            return this.pseudoRandom[this.lastIndex];
        }
    }
    /* A pseudo random number generator used to define the "type" of a crate. */
    var prng = new PRNG();

    class Crate implements ICrate {
        private type: number = prng.next();
        private isNoCrate: boolean;
        constructor(private cargo: ICargo, private color: string) {
            this.isNoCrate = this.color == '';
        }

        getType(): number {
            return this.type;
        }
        getColor(): string {
            return this.color;
        }
        getCargo(): ICargo {
            return this.cargo;
        }
        getPlatform(): number {
            if (this.cargo == null) return -1;
            return this.cargo.getPlatform(this);
        }
        getHeight(): number {
            if (this.cargo == null) return -1;
            return this.cargo.getHeight(this);
        }

        matches(cond: cmd.IInstruction): boolean {
            if (!cond || !cond.isCondition()) throw 'ERROR : Given Instruction is not a condition';
            switch (cond) {
                case cmd.NOCOND:
                    return true;
                case cmd.EMPTY:
                    return this.isNoCrate;
                case cmd.NONEMPTY:
                    return !this.isNoCrate;
                case cmd.BLUE:
                case cmd.GREEN:
                case cmd.YELLOW:
                case cmd.RED:
                    return this.color == cond.toString();
                default:
                    throw 'model.Crate: Nothing defined for Condition: ' + cond;
            }
        }
    }

    /** Null-object to prevent null references. */
    export var NO_CRATE: ICrate = new Crate(null, '');

    /** Information about the crates. 
     * The lowest crates have a "height" (as in altitude) of 0. 
     * The highest crates are at height 6, where they are held by the grappler.
     * Crates that are put down on a height of 6 will cause the pile to crash.
     */
    export interface ICargo extends obs.IObservable {
        /** Set all crates to "NO_CREATE". */
        clear();
        /** loads the initial formation from a Level. */
        setLevel(lvl: level.ILevel);
        /** Currently loaded level. */
        getLevel(): level.ILevel;
        /** loads the initial formation from a Level. */
        reset();

        /** That the grappler holds right now. 
         * Note that the empty grappler will contain the pseudo crate "NO_CRATE". 
         */
        getGrapplerContent(): ICrate;
        /** Grappler is above what platform? 
         * This is the index, which goes from 0 to (conf.getMaxPlatforms()-1). */
        getGrapplerPosition(): number;
        /** Returns actual crate at some position or NO_CRATE. */
        getCrate(platform: number, height: number): ICrate;

        /** Grab or place a crate on a platform. */
        grab();
        /** Go left to the next platform. */
        left();
        /** Go right to the next platform. */
        right();

        /** Return top crate, or NO_CRATE for empty platform. */
        findTopCrate(platform: number): ICrate;
        /** Return position in height of top crate, or -1 for empty platform. */
        findTopCrateHeight(platform: number): number;
        /** Fint a crate and return the platform. */
        getPlatform(crate: ICrate): number;
        /** Find a crate and return the position in height. */
        getHeight(crate: ICrate): number;
        /** true, when crates match the goal of this level. */
        isGoal(): boolean;
        /** True if the grappler has run into a wall or tried to move from an overloaded pile. */
        isCrashed(): boolean;
        /** True if the pile under the grappler has too many crates (i.e. 7 crates). */
        isOverloaded(): boolean;
    }

    class Cargo extends obs.Observable implements ICargo {
        private crates: ICrate[ /*platform*/][ /*height*/] = new Array();
        private grappler: number = 0;
        private static maxHeight: number = conf.getMaxCrateHeight();
        private platforms: number = conf.getMaxPlatforms();
        /** Indicates that the next move to right/left will cause a crash. 
          This is the case when cre grappler has just put a crate on top of 6  other crates. */
        private overload = false;
        /** The cargo has crashed into a wall or a pile of 7 crates. */
        private crash = false;

        private lvl: level.ILevel;

        private goal: string[][];

        constructor() {
            super();
            this.clear();
        }

        isCrashed(): boolean {
            return this.crash;
        }

        isOverloaded(): boolean {
            return this.overload;
        }

        public clear() {
            for (var p = 0; this.crates.length < this.platforms; p++) {
                this.crates.push(new Array());
                for (var i = 0; i <= Cargo.maxHeight; i++) {
                    this.crates[p].push(NO_CRATE);
                }
            }
            this.grappler = 0;
            this.overload = false;
            this.crash = false;
            this.setChanged();
            // reset() does the notification
        }

        setLevel(lvl: level.ILevel) {
            this.lvl = lvl;
            this.reset();
        }

        getLevel() {
            return this.lvl;
        }

        reset() {
            if (!this.lvl) console.log('ERROR: model.Cargo : No level set.');
            this.platforms = this.lvl.getPlatforms();
            this.clear();
            this.grappler = this.lvl.getStartPlatform();
            prng.reset();

            var init = this.lvl.getInitialFormation();
            this.goal = this.lvl.getGoal();
            for (var p = 0; p < init.length; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (init[p][h] && init[p][h] != '')
                        this.crates[p][h] = new Crate(this, init[p][h]);
                    else
                        this.crates[p][h] = NO_CRATE;
                    if (this.goal[p][h] === undefined)
                        this.goal[p][h] = ''; // this adds creates at max height.
                }
            }

            this.setChanged();
            this.notify(new msg.CargoChanged(null, null, 'reset', true));
        }

        getGrapplerContent(): ICrate {
            if (this.grappler >= 0)
                return this.crates[this.grappler][Cargo.maxHeight];
            else
                return NO_CRATE;
        }
        /** Grappler is above what platform? */
        getGrapplerPosition(): number {
            return this.grappler;
        }
        getCrate(platform: number, height: number): ICrate {
            return this.crates[platform][height];
        }

        /** Grab a crate from a platform or drop it there. */
        grab() {
            var crate1 = this.getGrapplerContent();
            if (crate1 == NO_CRATE) { // grab crate
                var top = this.findTopCrateHeight(this.grappler);
                if (top > -1 && this.crates[this.grappler][top] != NO_CRATE) {
                    this.crates[this.grappler][Cargo.maxHeight] =
                        this.crates[this.grappler][top];
                    this.crates[this.grappler][top] = NO_CRATE;
                }
            } else { // drop crate
                var top = this.findTopCrateHeight(this.grappler) + 1;
                if (top < Cargo.maxHeight) {
                    this.crates[this.grappler][top] = crate1;
                    this.crates[this.grappler][Cargo.maxHeight] = NO_CRATE;
                } else { // drop on max level is allowed, but next move will cause the crash!
                    this.overload = true;
                }
            }

            var crate2 = this.getGrapplerContent();
            this.setChanged();
            this.notify(new msg.CargoChanged(crate1, crate2, 'grab', true));
        }
        /** Go left to the next platform. */
        left() {
            var crate = this.getGrapplerContent();
            var allowed = !this.crash && !this.overload && this.grappler > 0;
            if (allowed && crate != NO_CRATE) {
                var tmp = this.crates[this.grappler - 1][Cargo.maxHeight];
                this.crates[this.grappler - 1][Cargo.maxHeight] = crate;
                this.crates[this.grappler][Cargo.maxHeight] = tmp;
            }
            this.grappler--;
            this.crash = this.crash || !allowed;
            this.setChanged();
            this.notify(new msg.CargoChanged(crate, crate, 'left', allowed));
        }
        /** Go right to the next platform. */
        right() {
            var crate = this.getGrapplerContent();
            var allowed = !this.crash && !this.overload && (this.grappler + 1 < this.platforms);
            if (allowed && crate != NO_CRATE) {
                var tmp = this.crates[this.grappler + 1][Cargo.maxHeight];
                this.crates[this.grappler + 1][Cargo.maxHeight] = crate;
                this.crates[this.grappler][Cargo.maxHeight] = tmp;
            }
            this.grappler++;
            this.crash = this.crash || !allowed;
            this.setChanged();
            this.notify(new msg.CargoChanged(crate, crate, 'right', allowed));
        }

        /** Return top crate, or NO_CRATE for empty platform. */
        findTopCrate(platform: number): ICrate {
            var top = this.findTopCrateHeight(platform);
            if (top === -1) return NO_CRATE;
            return this.crates[platform][top];
        }
        /** Return position in height of top crate, or -1 for empty platform. */
        findTopCrateHeight(platform: number): number {
            if (platform === -1 || this.crates[platform][0] == NO_CRATE) return -1;
            for (var h = 1; h <= Cargo.maxHeight; h++) {
                if (this.crates[platform][h] === NO_CRATE) {
                    return h - 1;
                }
            }
            return Cargo.maxHeight - 1;
        }

        getPlatform(crate: ICrate): number {
            if (crate === NO_CRATE) throw 'getPlatform(NO_CRATE) is not defined!';
            for (var p = 0; p < this.platforms; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (this.crates[p][h] == crate) return p;
                }
            }
            throw 'crate was not found';
        }
        getHeight(crate: ICrate): number {
            if (crate === NO_CRATE) throw 'getHeight(NO_CRATE) is not defined!';
            for (var p = 0; p < this.platforms; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (this.crates[p][h] == crate) return h;
                }
            }
            throw 'crate was not found';
        }

        isGoal(): boolean {
            for (var p = 0; p < this.platforms; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (this.crates[p][h].getColor() != this.goal[p][h]) return false;
                }
            }
            return true;
        }

    }

    export interface IModel extends obs.IObservable {
        getLevelPack(): level.ILevelPack;
        setLevelPack(pack: level.ILevelPack);
        getLevel(): level.ILevel;
        setLevel(lvl: level.ILevel);
        isFast(): boolean;
        setFast(fast: boolean);

        /** Reference to the code (not a copy). */
        getCode(): ICode;
        /** Reference to the cargo (positions of crates, not a copy). */
        getCargo(): ICargo;
        /** persist the current code. */
        save();

        /** Get the rating (=amount of stars, 0 to 3). */
        getRating(lvl: level.ILevel): number;
        /** Get the total rating of all levels in one pack(=amount of stars, 0 to 18).
            Or the total of the complete game.
         */
        getTotalRating(pack?: level.ILevelPack): number;
        /** Set the rating (=amount of stars, 0 to 3). */
        setRating(lvl: level.ILevel, rating: number);

        /** The language used by the user. If nothig is defined then the browser setting is returned. */
        getLanguage(): string
        /** Sets language. The complete game needs to be reloaded to see the translations. */
        setLanguage(lang: string)
    }

    /** The model for the whole game. Even though the views and controllers are 
     split to different objects, there is only one model. 
    */
    class Model extends obs.Observable implements IModel {

        constructor(private code: ICode, private cargo: ICargo) {
            super();
            this.fast = (dataSaver.getData('speed') == 'fast')
        }
        private pack: level.ILevelPack = null;
        private lvl: level.ILevel = null;
        private fast: boolean = false;
        private language: string;
        getLevelPack(): level.ILevelPack {
            return this.pack;
        }
        setLevelPack(pack: level.ILevelPack) {
            if (this.pack === pack) return
            this.pack = pack;
            this.setChanged();
            this.notify(new msg.ModelChanged(true, false, false, false));
        }
        getLevel(): level.ILevel {
            return this.lvl;
        }
        save() {
            dataSaver.saveData(this.lvl.getTitle(), this.code.save());
            if(this.lvl.getTitle()=="Level Editor") 
                dataSaver.saveData("editor stage",this.lvl.dataToSave());
        }

        /** Get the rating (=amount of stars, 0 to 3). */
        getRating(lvl: level.ILevel): number {
            var p = lvl.getLevelPack().getIdName()
            var l = lvl.getTitle()
            var r = JSON.parse(dataSaver.getData('rating[' + p + ']'))
            if (r && r[l]) return r[l]
            return 0
        }

        getTotalRating(pack?: level.ILevelPack): number {
            var result = 0
            var i = 0
            if (!pack) {
                level.getLevelPacks().forEach((pack) => {
                    result += this.getTotalRating(pack)
                })
            } else {
                pack.getLevels().forEach((lvl) => {
                    result += this.getRating(lvl)
                })
            }
            return result
        }

        /** Set the rating (=amount of stars, 0 to 3). */
        setRating(lvl: level.ILevel, rating: number) {
            if (rating >= 0 && rating <= 3) {
                var p = lvl.getLevelPack().getIdName()
                var r = JSON.parse(dataSaver.getData('rating[' + p + ']')) || {}
                var l = lvl.getTitle()
                r[l] = rating
                dataSaver.saveData('rating[' + p + ']', JSON.stringify(r))
            }

            this.setChanged();
            this.notify(new msg.ModelChanged(false, false, false, true));
        }

        setLevel(lvl: level.ILevel) {
            // this is also done when the same level is realoaded!
            // this way the "tutorial hints" get a level-load event.
            if (lvl.getLevelPack() != this.pack) throw 'setLevel() can only be used if the Level-Pack is already set!'
            this.lvl = lvl;
            this.code.load(dataSaver.getData(lvl.getTitle()));
            if (this.lvl.getTitle() == "Level Editor")
                this.lvl.loadFromSaved(dataSaver.getData("editor stage"));

            this.setChanged();
            this.notify(new msg.ModelChanged(false, true, false, false));
        }
        isFast() {
            return this.fast;
        }
        setFast(fast: boolean) {
            this.fast = fast
            dataSaver.saveData('speed', fast ? 'fast' : 'slow')
            this.setChanged()
            this.notify(new msg.ModelChanged(false, false, true, false))
        }
        public toggleSpeed() {
            this.setFast(!this.isFast())
        }
        getCode(): ICode {
            return this.code
        }
        getCargo(): ICargo {
            return this.cargo;
        }
        public getLanguage(): string {
            if (!this.language)
                this.language = dataSaver.getData('language')
            return this.language
        }
        public setLanguage(lang: string) {
            if (this.language === lang) return
            this.language = lang
            dataSaver.saveData('language', lang)
        }
    }

    /** Messages used to notify on model changes. */
    export module msg {
        export interface IMessage {

        }
        /** Notification about change of a register */
        export class RegisterChanged implements IMessage {
            constructor(
                private oldCmd: cmd.ICommand,
                private newCmd: cmd.ICommand,
                private prog: number,
                private reg: number) {

            }

            public getOldCommand(): cmd.ICommand {
                return this.oldCmd;
            }
            public getNewCommand(): cmd.ICommand {
                return this.newCmd;
            }

            public getProgram(): number {
                return this.prog;
            }
            public getRegister(): number {
                return this.reg;
            }
        }
        /** The Cargo was changed. */
        export class CargoChanged implements IMessage {
            constructor(
                private crate1: ICrate,
                private crate2: ICrate,
                private direction: string, // can also be 'reset'
                private allowed: boolean // true: ok / false: crash.
            ) { }
            /** crate in grappler before move. */
            public getCrate1() {
                return this.crate1;
            }
            /** crate in grappler after move. */
            public getCrate2() {
                return this.crate2;
            }
            /** Direction of grappler-movement ('left', 'right', 'grab') or 'reset'. */
            public getDirection() {
                return this.direction;
            }
            /** A return value of false indicates that the cargo bot crashed. */
            public isAllowed() {
                return this.allowed;
            }
        }

        /** This only informs what has changes, but knows nothing about the actual values. 
         *  Call model.getUserSelection() to get the current selections.  
         */
        export class ModelChanged implements IMessage {
            constructor(
                private pack: boolean,
                private level: boolean,
                private speed: boolean,
                private rating: boolean) { }
            /** Did the level pack change?  */
            public isPack(): boolean {
                return this.pack;
            }
            /** Did the level change?  */
            public isLevel(): boolean {
                return this.level;
            }
            /** Did the speed change?  */
            public isSpeed(): boolean {
                return this.speed;
            }
            /** Did a rating change?  */
            public isRating(): boolean {
                return this.rating;
            }
        }

    }


    export var MODEL: IModel = new Model(new Code(), new Cargo());

}
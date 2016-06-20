module cmd {

    /** 
     * Object can identify some value using a unique text-id. 
     * This is used because JavaScript has no Enums.
     */
    export interface IInstruction {
        toString(): string;
        same(other: IInstruction): boolean;
        /** Any operation, that is not a condition. Note: NOOP is also considered an operation! */
        isOperation(): boolean;
        /** Any condition, that is not an operation. Note: NOCOND is also considered an operation! */
        isCondition(): boolean;
        /** Number of program (1-4) or 0 for other instructions.*/
        getProgramNr(): number;
    }


    var __items = {};
    /*abstract*/
    class Instruction implements IInstruction {
        constructor(private text: string, private nr: number, private isOp: boolean) {
            if (__items[text] !== undefined)
                console.log('ERROR: Instruction "' + text + '" exists.');
            __items[text] = this;
        }
        public toString() {
            return this.text;
        }
        same(other: IInstruction): boolean {
            return this.text == other.toString();
        }

        isOperation(): boolean {
            return this.isOp;
        }
        isCondition(): boolean {
            return !this.isOp;
        }
        getProgramNr(): number {
            return this.nr;
        }
    }

    class Operation extends Instruction {
        constructor(text: string, nr?: number) {
            super(text, nr, true);
        }

        // Wonder how an operation is executed?
        // Answer: The state machine does that.
    }

    class Condition extends Instruction {
        constructor(text: string) {
            super(text, 0, false);
        }

        // Are you looking for a method to evaluate a condition?
        // It's not here. What you do is call crate.matches(cond).
    }

    export function getInstruction(text: string): IInstruction {
        if (__items[text] === undefined)
            console.log('ERROR: Instruction "' + text + '" is not defined.');
        return __items[text]
    }

    export function getInstructions(): IInstruction[] {
        var result = new Array<IInstruction>();
        for (var x in __items)
            result.push(__items[x]);
        return result;
    }

    // Operations:
    // "aka" gives the name in the original game on iPad, iff it is different.

    /** No operation (empty register). */
    export var NOOP: IInstruction = new Operation("noop");
    /** bot goes right. */
    export var RIGHT: IInstruction = new Operation("right");
    /** bot goes down and up */
    export var GRAB: IInstruction = new Operation("grab"); // aka "pickup"
    /** bot goes left. */
    export var LEFT: IInstruction = new Operation("left");
    /** Exit program call. This is automatically inserted after each program.
      Since the user can not see the register it never has a condition other than NOCOND. */
    export var EXIT: IInstruction = new Operation("exit");

    /** call prog1. */
    export var PROG1: IInstruction = new Operation("prog1", 1); // aka "f1"
    /** call prog2. */
    export var PROG2: IInstruction = new Operation("prog2", 2); // aka "f2"
    /** call prog3. */
    export var PROG3: IInstruction = new Operation("prog3", 3); // aka "f3"
    /** call prog4. */
    export var PROG4: IInstruction = new Operation("prog4", 4); // aka "f4"

    // Conditions and Colors (color of crate):
    /** no condition. */
    export var NOCOND: IInstruction = new Condition("nocond");

    /** crate of color blue. */
    export var BLUE: IInstruction = new Condition("blue");
    /** crate of color red. */
    export var RED: IInstruction = new Condition("red");
    /** crate of color green. */
    export var GREEN: IInstruction = new Condition("green");
    /** crate of color yellow. */
    export var YELLOW: IInstruction = new Condition("yellow");
    /** no crate (a.k. "none"). */
    export var EMPTY: IInstruction = new Condition("empty"); // aka "none"
    /** crate of any color. */
    export var NONEMPTY: IInstruction = new Condition("nonempty"); // aka "multi"

    //////////////////////////////////////////////////////////////////
    export interface ICommand { //immutable
        getOperation(): IInstruction; // LEFT, GRAB, RIGHT, PROG[1-4]
        getCondition(): IInstruction; // color / Empty / Nonempty
        equals(o: ICommand): boolean;
        toString(): string;
    }

    var _cmds = {}; //Pool of existing Commands
    export function getCommand(operation: IInstruction, condition: IInstruction): ICommand {
        var o: string = operation.toString();
        var c: string = condition.toString();
        if (!(o in _cmds))
            _cmds[o] = {};
        if (!(c in _cmds[o]))
            _cmds[o][c] = new Command(operation, condition);
        return _cmds[o][c];
    }

    class Command implements ICommand { // immutable
        constructor(private operation: IInstruction, private condition: IInstruction) { }
        getOperation(): IInstruction {
            return this.operation;
        }
        getCondition(): IInstruction {
            return this.condition;
        }
        equals(o: ICommand): boolean {
            return this.operation.same(o.getOperation()) &&
                this.condition.same(o.getCondition());
        }
        toString(): string {
            return '[' + this.operation.toString() + '|' + this.condition.toString() + ']';
        }
    }

    /** All IInstruction-Objects that can be put into the toolbox. */
    export function getTools(): ITool[] {
        return [
            RIGHT, GRAB, LEFT,
            PROG1, PROG2, PROG3, PROG4,
            BLUE, RED, GREEN, YELLOW,
            EMPTY, NONEMPTY
        ].map(getTool)
    }

    export interface ITool extends IInstruction {
        getHTMLElement(): HTMLElement;
    }

    var __tools = {};
    export function getTool(instruction: any): ITool {
        var id: string;
        if (typeof instruction == 'string' || instruction instanceof String) {
            id = instruction;
            instruction = getInstruction(id);
        } else {
            id = (<IInstruction>instruction).toString();
        }
        if (!__tools[id])
            __tools[id] = new Tool(getInstruction(id));
        return __tools[id];
    }

    class Tool implements ITool {
        constructor(public instruction: IInstruction) { }
        public toString() {
            return this.instruction.toString();
        }
        same(other: IInstruction): boolean {
            return this.instruction.toString() === other.toString();
        }
        private element: HTMLElement = undefined;
        public getHTMLElement(): HTMLElement {
            if (this.element === undefined) {
                // css selector: #tool_xyz
                // css class as command: 'cmd-xyz' 
                var id = 'tool_' + this.instruction.toString();
                this.element = document.getElementById(id);
            }
            if (this.element === null) console.log('ERROR: Element not found with id ' + id);
            return this.element;
        }
        public isOperation(): boolean {
            return this.instruction.isOperation();
        }
        public isCondition(): boolean {
            return this.instruction.isCondition();
        }
        public getProgramNr(): number {
            return this.instruction.getProgramNr();
        }
    }
}
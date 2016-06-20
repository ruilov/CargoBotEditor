/** The Stack Machine. */
module sm {

    /** Each Stack-Frame is just a pointer to a register, where execution should continue. */
    class StackFrame {
        constructor(private program: number, private register: number) { }
        /** Program 1 - 4 where execution will continue on exit of program.
         * End of all code is reachend when no StackFrames are left.
         */
        getProgram(): number {
            return this.program;
        }
        /** Register 0 - 8, where 8 is after the end of program. 
         * This points to the register where execution will continue on exit of program. */
        getRegister(): number {
            return this.register;
        }
    }

    /** One step of animation. 
      possible steps:
      - Grappler goes right/left or grabs.
      - A function (1-4) is called (this is a bit delayed)
     */
    export interface IStep {
        /** program 1 to 4. */
        getProgram(): number;
        /** Register 0 to 7. */
        getRegister(): number;
        /** Command of this step. */
        getCommand(): cmd.ICommand;
        /** Only the last step should have finished==true. */
        isFinished(): boolean;
    }

    class Step implements IStep { //immutable
        constructor(
            private prog: number,
            private reg: number,
            private command: cmd.ICommand,
            private finished: boolean,
            private st: StackFrame[]) { }
        getProgram(): number {
            return this.prog;
        }
        getRegister(): number {
            return this.reg;
        }
        /** Command of this step. Is null IFF this is the last step. */
        getCommand(): cmd.ICommand {
            return this.command;
        }
        /** A Copy of the stack trace of the stack machine. */
        getStackTrace(): StackFrame[] {
            return this.st.slice(0);
        }
        isFinished() {
            return this.finished;
        }
    }


    /** 
     This is a stack machine for the game. 
     Instead of a single "program counter" to point to the next instruction it uses two counters:
     nextProgram() [1-4] and nextRegister() [0-7].
     It is also special in that empty registers (noop) and program exits (at index 8) will automatically be skipped.
    
     The StackMachine creates a list of Steps that define how the grappler will work with the cargo.
    */
    export interface IStackMachine {
        reset(): void;
        step(): IStep;
    }

    class StackMachine implements IStackMachine {
        /** Stack Trace. */
        private stack: StackFrame[] = new Array();
        private nextProg: number;
        private nextReg: number;
        /** This will be executed by the next call to step(). 
            It is the next command, that is not skipped by its condition. */
        private nextCmd: cmd.ICommand;
        private finished = false;

        constructor(private code: model.ICode, private cargo: model.ICargo) { }

        reset(): void {
            this.nextProg = 1;
            this.nextReg = 0;
            this.nextCmd = this.code.getCommand(this.nextProg, this.nextReg);
            this.finished = false;

            //Skip first commands with conditions for any crate in grappler. (can't be true at start.)
            //Also skip all noop (empty) registers.
            while (!model.NO_CRATE.matches(this.nextCmd.getCondition()) ||
                this.nextCmd.getOperation() == cmd.NOOP) {
                this.nextReg++;
                this.nextCmd = this.code.getCommand(this.nextProg, this.nextReg);
                if (this.nextCmd.getOperation() == cmd.EXIT) {
                    // this.nextCmd is intentionally left as cmd.EXIT.
                    this.nextReg--;
                    this.finished = true;
                    break;
                }
            }
        }
        step(): IStep {
            var step =
                new Step(this.nextProg, this.nextReg, this.nextCmd,
                    this.finished, this.stack.slice(0));

            if (this.finished)
                return step;

            // nextCmd must be run, the condition was checked already!
            var op = this.nextCmd.getOperation();
            switch (op) {
                case cmd.LEFT:
                    this.cargo.left();
                    break;
                case cmd.RIGHT:
                    this.cargo.right();
                    break;
                case cmd.GRAB:
                    this.cargo.grab();
                    break;
                case cmd.NOOP:
                    throw 'cmd.NOOP operation should have been skipped';

                // note: entering a program is an animated step, while exit is not.
                case cmd.PROG1:
                case cmd.PROG2:
                case cmd.PROG3:
                case cmd.PROG4:
                    this.stack.push(new StackFrame(this.nextProg, this.nextReg + 1));
                    this.nextProg = op.getProgramNr();
                    this.nextReg = -1; // will be increased at least once below
                    break;

                case cmd.EXIT:
                    // this is handled below!
                    break;
                default:
                    throw 'sm.StateMachine: Nothing defined for operation ' + op;
            } // switch

            // Note: nextCmd and prevCmd are still equal here.
            // Let's find the nextCmd now.
            this.nextReg++;
            this.nextCmd = this.code.getCommand(this.nextProg, this.nextReg);
            if (this.cargo.isGoal())
                this.finished = true;

            var crate: model.ICrate;
            if (!this.cargo.isCrashed())
                crate = this.cargo.getGrapplerContent();
            else
                crate = model.NO_CRATE;

            while (!crate.matches(this.nextCmd.getCondition()) ||
                this.nextCmd.getOperation() == cmd.EXIT ||
                this.nextCmd.getOperation() == cmd.NOOP) {
                if (this.nextCmd.getOperation() == cmd.EXIT) {
                    if (this.stack.length == 0) {
                        this.nextProg = -1;
                        this.nextReg = -1;
                        this.finished = true;
                        break;
                    } else {
                        var sf: StackFrame = this.stack.pop();
                        this.nextProg = sf.getProgram();
                        this.nextReg = sf.getRegister();
                    }
                } else {
                    this.nextReg++;
                }
                this.nextCmd = this.code.getCommand(this.nextProg, this.nextReg);
            }
            return step;
        }

    }

    export function createStackMachine(code: model.ICode, cargo: model.ICargo): IStackMachine {
        return new StackMachine(code, cargo);
    }
}
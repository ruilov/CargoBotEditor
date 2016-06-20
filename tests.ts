/// <reference path="tsUnit.ts"/>
module MiscTests {
    export class ObserverTests extends tsUnit.TestClass {

        private target: obs.Observable = new obs.Observable();

        addObserver() {
            var check: number = 0;
            var callback: obs.ICallback;
            callback = (o: obs.IObservable, msg?: any) => {
                check++;
            };
            this.target.subscribe(null, callback);
            this.target.setChanged();
            this.target.notify();
            this.areIdentical(check, 1);
        }
    }
}

module CommandTests {
    export class CmdPoolTests extends tsUnit.TestClass {
        getNewCommand() {
            var c: cmd.ICommand = cmd.getCommand(cmd.GRAB, cmd.NOCOND);
            this.areIdentical(c.getOperation(), cmd.GRAB);
            this.areIdentical(c.getCondition(), cmd.NOCOND);

            c = cmd.getCommand(cmd.GRAB, cmd.BLUE);
            this.areIdentical(c.getOperation(), cmd.GRAB);
            this.areIdentical(c.getCondition(), cmd.BLUE);
        }

        getExistingCommand() {
            var c1: cmd.ICommand = cmd.getCommand(cmd.NOOP, cmd.NOCOND);
            this.areIdentical(c1.getOperation(), cmd.NOOP);
            this.areIdentical(c1.getCondition(), cmd.NOCOND);

            var c2: cmd.ICommand = cmd.getCommand(cmd.NOOP, cmd.NOCOND);
            this.areIdentical(c2.getOperation(), cmd.NOOP);
            this.areIdentical(c2.getCondition(), cmd.NOCOND);

            this.areIdentical(c1, c2);

        }
    }
}

module ViewTests {


}


module MiscTests {
    interface IFoo { }
    class Foo implements IFoo { };

    export class SomeTests extends tsUnit.TestClass {
        someTest() {
            var foo = new Foo();
        }
    }
}
/*
var test = new tsUnit.Test();

test.addTestClass(new MiscTests.ObserverTests());
test.addTestClass(new CommandTests.CmdPoolTests());
test.addTestClass(new MiscTests.SomeTests());

test.showResults(document.getElementById('results'), test.run());*/
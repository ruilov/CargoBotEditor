/* Observer Pattern. */
module obs {

    /** The "subscriber" registers a function. */
    export interface ICallback {
        (observable: IObservable, msg?: any);
    }

    /** The "publisher" can be observed. */
    export interface IObservable {
        subscribe(subscriber: any, callback: ICallback): void;
        hasChanged(): boolean;
        notify(arg?: any): void;
        setChanged();
    }

    class Subscription {
        constructor(public subscriber: any, public callback: ICallback) { }
    }

    export class Observable implements IObservable {
        private subscriptions: Subscription[] = new Array();
        private changed: boolean = false;
        constructor() { }
        subscribe(subscriber: any, callback: ICallback): void {
            this.subscriptions.push(new Subscription(subscriber, callback));
        }

        hasChanged(): boolean {
            return this.changed;
        }
        notify(msg: any = null): void {
            this.subscriptions.forEach((s) => {
                // Subscriber will be "this" in callback function:
                s.callback.call(s.subscriber, this, msg);
            });
            this.changed = false;
        }
        setChanged() {
            this.changed = true;
        }
    }
}
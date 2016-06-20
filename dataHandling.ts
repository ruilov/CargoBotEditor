/// <reference path="lib/jquery.d.ts" />
/// <reference path="lib/typings/winjs.d.ts" />
enum dataSource {
    CLOUD,
    CLOUD_LOCAL,
    LOCALSTORAGE,
}

module dataSaver {

    var savingKeys: Object = {
        settings: {
            musicEnabled: "musicEnabled",
            soundEnabled: "soundEnabled",
            speed: "speed"
        },
        levels: {
            Cargo101: "Cargo 101",
            Transporter: "Transporter",
            ReCurses: "Re-Curses",
            Inverter: "Inverter",
            FromBeneath: "From Beneath",
            FromBeneath2: "From Beneath2",
            GoLeft: "Go Left",
            DoubleFlip: "Double Flip",
            GoLeft2: "Go Left 2",
            ShuffleSort: "Shuffle Sort",
            GoTheDistance: "Go the Distance",
            ColorSort: "Color Sort",
            WalkingPiles: "Walking Piles",
            RepeatInverter: "Repeat Inverter",
            DoubleSort: "Double Sort",
            Mirror: "Mirror",
            LayItOut: "Lay it out",
            TheStacker: "The Stacker",
            Clarity: "Clarity",
            ComeTogether: "Come Together",
            ComeTogether2: "Come Together 2",
            UpTheGreens: "Up The Greens",
            FillTheBlanks: "Fill The Blanks",
            CountTheBlues: "Count The Blues",
            MultiSort: "Multi Sort",
            DivideByTwo: "Divide by two",
            TheMerger: "The Merger",
            EvenTheOdds: "Even the Odds",
            GeneticCode: "Genetic Code",
            MultiSort2: "Multi Sort 2",
            TheSwap: "The Swap",
            RestoringOrder: "Restoring Order",
            ChangingPlaces: "Changing Places",
            PaletteSwap: "Palette Swap",
            Mirror2: "Mirror 2",
            ChangingPlaces2: "Changing Places 2",
            VerticalSort: "Vertical Sort",
            CountInBinary: "Count in Binary",
            PartingTheSea: "Parting the Sea",
            TheTrick: "The Trick",
            Equalizer: "Equalizer"
        },
        ratings: {
            tutorials: "rating[tutorials]",
            easy: "rating[easy]",
            medium: "rating[medium]",
            hard: "rating[hard]",
            crazy: "rating[crazy]",
            impossible: "rating[impossible]",
            bonus: "rating[bonus]"
        }
    };
    export var keysArray: String[]

    export var counter = 0;

    function init() {
        keysArray = new Array()
        $.each(savingKeys, function (key, val) {
            $.each(val, function (key, val) {
                keysArray.push(val);
            });
        });
    }

    function keyExists(key: String): boolean {
        if (!keysArray)
            init()
        for (var i = 0; i < keysArray.length; i++) {
            if (keysArray[i] === key)
                return true
        }
        return false
    }

    export function loadWithoutWindows(): void {
        if (!keysArray)
            init()
        for (var i = 0; i < keysArray.length; i++) {
            dataSaver.counter++;
        }
    }

    export function loadIntoLocalStorage(): void {
        if (!keysArray)
            init()
        for (var i = 0; i < keysArray.length; i++){
            readItem(i)
        }
    }

    function readItem(i) {
        WinJS.Application.roaming.readText(keysArray[i] + "").then(function (data) {
            window.localStorage.setItem(keysArray[i] + "", data)
            dataSaver.counter++;
        }, function (err) {
            console.error(err)
            window.localStorage.setItem(keysArray[i].toString(), "")
        });
    }

    export function saveData(key: string, data: string): void {
        if (!keyExists(key))
            throw new Error("This key wasn't found in the list: " + key)
        window.localStorage.setItem(key, data)
        WinJS.Application.roaming.writeText(key, data).then(function (data) {
            console.info('saved data');
        });
    }

    export function getData(key: string): string {
        if (!keyExists(key))
            throw new Error("This key wasn't found in the list: " + key)
        if (window.localStorage.getItem(key) == null || window.localStorage.getItem(key) == undefined || window.localStorage.getItem(key) == 'undefined')
            return "{}"
        return window.localStorage.getItem(key)
    }
}
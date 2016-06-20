/*
Cargo-Bot by Claude Martin. 
Created at the University of Applied Sciences and Arts Northwestern Switzerland. 
*/
// The use of defer="defer" would be much nicer, but not all browsers support it.
var checkLoading = true
var finished = false
var defer = function () {
    // see https://developer.mozilla.org/en-US/docs/Web/API/document.readyState
    if (counter++ > 100) // 100 * 100ms = 10s
        console.log('Initialisation failed. Reload the page.\nInitialisierung fehlgeschlagen. Lade die Seite erneut.');
    else if (document.readyState === "complete") {
        if (checkLoading) {
            if (window.Windows) {
                dataSaver.loadIntoLocalStorage()
            } else {
                dataSaver.loadWithoutWindows();
            }
            checkLoading = false
        }
        if (dataSaver.counter == dataSaver.keysArray.length) {
            loadCargoBot()
            finished = true
        }
    }
    if (!finished)
        setTimeout(defer, 10);
}
var counter = 0;
var frameCount = 0;

// indicates about 60%:
document.onreadystatechange = function (event) {
    if (window.innerWidth < 500) {
        var logo = document.getElementById('cargo-bot-logo')
        var w = (window.innerWidth - 10);
        logo.style.width = w + 'px';
        logo.style.height = (w / 470 * 85) + 'px';
    }
    var crates = document.getElementById('progress').querySelectorAll('div');
    Array.prototype.forEach.call(crates, function (c, i) {
        if (i > 1) return; // note: splice() can't be applied to a NodeList but forEach() can.
        setTimeout(function () {
            c.className = 'full-opacity';
        }, 32 + (i * 200));
    });
    if (document.readyState !== "loading") {
        var crates = document.getElementById('progress').querySelectorAll('div');
        (<HTMLDivElement>crates[2]).className = 'full-opacity';
    }
    defer(); // this waits even longer.
} // maybe the document way already complete:
if (document.readyState !== "loading")
    document.onreadystatechange(null)

var loaded = false

WinJS.Application.onready = () => {
    loadCargoBot()
}

function loadCargoBot() {
    if (loaded) return
    loaded = true

    // falling crates:
    var bigCrates = document.querySelectorAll('.big-crate')
    for (var i = 0; i < bigCrates.length; ++i) {
        var bc = <HTMLImageElement>bigCrates[i];
        bc.style.left = (i * 15) + '%';
        bc.style.top = '-200px';
        bc.style.display = 'block';
        setTimeout((bc: HTMLImageElement) => {
            bc.style.top = (1400 + Math.random() * 400) + 'px'
            shims.transform(bc, 'scale(1.2,1.2) rotate(' + (Math.round(200 * (Math.random() - 0.5)) / 100) + 'turn)')
        }, (Math.random()) * 500 + (500 * (i % 2)), bc);
    }
    var enqueue = (f: () => void) => {
        setTimeout(
            () => {
                f()
            }, 33)
    }

    // crates that indicate loading state (0 - 4):
    //crates 0, 1, and 2 are visible already!
    var crates = document.getElementById('progress').querySelectorAll('div');

    if (!shims && !view && !ctrl && !animation)
        throw 'RequireJS did not load the modules!';

    // get the language:
    try {
        var userLang = navigator.language || navigator.userLanguage;
        var language = 'en'
        if (userLang == 'de' || userLang == 'en') {
            language = userLang;
        }
        translate.setLanguage(language)
    } catch (e) {
        translate.setLanguage('en')
    }

    // Prepare the browser:
    shims.init()
    view.init()
    ctrl.init()
    soundplayer.init()

    //initializing sound
    soundplayer.updateSound();

    //initializing history
    WinJS.Navigation.history.backStack.push({
        state: 1
    }, "Main", "?state=1")

    // history.pushState = function(arg) {
    //     console.log(["tried to push state", arg]);
    // }

    history.pushState({
        state: 1
    }, "Main", "?state=1")

    document.getElementById('cargo-bot-logo-text').style.display = 'none';
    document.getElementById('cargo-bot-logo').style.display = 'inline';

    shims.setTextContent(document.getElementById('status'), translate.loading.getText('loading'))

    //Disable Scrolling with keys
    window.addEventListener("keydown", function (e) {
        // space and arrow keys
        if ([32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);

    enqueue(() => {
        (<HTMLDivElement>crates[3]).className = 'full-opacity';
        animation.init();

        // the first image is taken out (shift) and loaded last.
        var firstImg: HTMLImageElement = new Image()
        var firstSrc = images.shift()
        // iterate over the remaining images:
        images.forEach(function (url) {
            var img = new Image()
            img.src = url
        })
        //when "first" image is loaded:
        firstImg.onload = () => { //function must be idempotent!
            var loading = document.getElementById('loading')
            loading.onclick = () => {
                animation.animateMenu(loading);
            }
            loading.style.cursor = 'pointer'
            Array.prototype.forEach.call(loading.querySelectorAll('p'),
                function (p) {
                    p.style.cursor = 'pointer';
                }
            )
            var status = document.getElementById('status')
            shims.setTextContent(status, translate.loading.getText('ready'))
            var click2start = document.getElementById('click2start')
            shims.setTextContent(click2start, translate.loading.getText('click2start'))
            click2start.style.visibility = 'visible'
        }
        firstImg.src = firstSrc // load the "first" image of the array

        enqueue(() => {
            (<HTMLDivElement>crates[4]).className = 'full-opacity';
        })
        // since the image preload could fail, we set it to "ready" after 5 seconds:
        setTimeout(firstImg.onload, 5000)
    })
}

var addEvent = function (object, type, callback) {
    if (object == null || typeof (object) == 'undefined') return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on" + type] = callback;
    }
};

var images = ([
    'gfx/Arrow_Left.png', 'gfx/Arrow_Right.png', 'gfx/Claw_Arm.png', 'gfx/Claw_Arm_Shadow.png', 'gfx/Claw_Base.png', 'gfx/Claw_Base_Shadow.png', 'gfx/Claw_Left.png', 'gfx/Claw_Left_Shadow.png', 'gfx/Claw_Middle.png', 'gfx/Claw_Middle_Shadow.png', 'gfx/Claw_Right.png', 'gfx/Claw_Right_Shadow.png', 'gfx/Clear_Button.png', 'gfx/Command_Grab.png', 'gfx/Command_Left.png', 'gfx/Command_Right.png', 'gfx/Condition_Any.png', 'gfx/Condition_Blue.png', 'gfx/Condition_Green.png', 'gfx/Condition_None.png', 'gfx/Condition_Red.png', 'gfx/Condition_Yellow.png', 'gfx/Crate_Blue_1.png', 'gfx/Crate_Blue_2.png', 'gfx/Crate_Blue_3.png', 'gfx/Crate_Goal_Blue.png', 'gfx/Crate_Goal_Green.png', 'gfx/Crate_Goal_Red.png', 'gfx/Crate_Goal_Yellow.png', 'gfx/Crate_Green_1.png', 'gfx/Crate_Green_2.png', 'gfx/Crate_Green_3.png', 'gfx/Crate_Red_1.png', 'gfx/Crate_Red_2.png', 'gfx/Crate_Red_3.png', 'gfx/Crate_Shadow.png', 'gfx/Crate_Yellow_1.png', 'gfx/Crate_Yellow_2.png', 'gfx/Crate_Yellow_3.png', 'gfx/Dialogue_Box.png', 'gfx/Dialogue_Button.png', 'gfx/Fast_Button_Active.png', 'gfx/Fast_Button_Inactive.png', 'gfx/Game_Area.png', 'gfx/Game_Area_Floor.png', 'gfx/Game_Area_Roof.png', 'gfx/Goal_Area.png', 'gfx/Hint_Triangle_Down.png', 'gfx/Hint_Triangle_Right.png', 'gfx/Hint_Triangle_Up.png', 'gfx/Hints_Button.png', 'gfx/Left.png', 'gfx/Level_Select_Frame.png', 'gfx/Logo.png', 'gfx/Menu_Game_Button.png', 'gfx/Next_Button.png', 'gfx/Pack_Crazy.png', 'gfx/Pack_Easy.png', 'gfx/Pack_Hard.png', 'gfx/Pack_Impossible.png', 'gfx/Pack_Medium.png', 'gfx/Pack_Tutorial.png', 'gfx/Platform.png', 'gfx/Platform_Shadow.png', 'gfx/Play_Button.png', 'gfx/Play_Solution_Icon.png', 'gfx/Program_1.png', 'gfx/Program_2.png', 'gfx/Program_3.png', 'gfx/Program_4.png', 'gfx/Program_5.png', 'gfx/Register_Slot.png', 'gfx/Register_Slot_Last.png', 'gfx/Right.png', 'gfx/Smoke_Particle.png', 'gfx/Star_Empty.png', 'gfx/Star_Filled.png', 'gfx/Starry_Background.png', 'gfx/Step_Button.png', 'gfx/Stop_Button.png', 'gfx/Toolbox.png', 'gfx/Two_Lives_Left.png'
])
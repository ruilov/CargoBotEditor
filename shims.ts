/*
* Shims for better browser support. 
*/

module shims {

    export function init() {
        _pageXYOffset()
        _dateNow()
        _requestAnimationFrame() // for opera
        _garbageCollection()
        _classList() // for IE9
        _array()
        _autoResize()
        dnd.init() // tablets
    }

    /** This makes sure the game is always scaled so that it fits the screen.
    This is done by using CSS "transform" on the div with id "scaledViewport". */
    export function _autoResize() {
            var dpr = 1.0// display pixel ratio
            if (typeof window['devicePixelRatio'] !== 'undefined') dpr = window['devicePixelRatio']
            else if (document.documentElement.clientWidth > 0 && window.screen.availWidth > 0)
                dpr = window.screen.availWidth / document.documentElement.clientWidth
            // see http://blogs.windows.com/windows_phone/b/wpdev/archive/2012/11/08/internet-explorer-10-brings-html5-to-windows-phone-8-in-a-big-way.aspx
            // To learn about scaling just search the web for "a pixel is not a pixel". Articles about this usualy contain that phrase.
            // The goal of this is to use only CSS pixels and map them the actual physical pixels on the screen. 

            window.onresize = function (event?: UIEvent) {
                    // The amount of visible CSS pixels is prefered, so that the scaling actually fits the viewport.
                    var clientWidth = window.innerWidth || document.documentElement.clientWidth || screen.availWidth || screen.width
                    var clientHeight = window.innerHeight || document.documentElement.clientHeight || screen.availHeight || screen.height

                    if (clientWidth > 0) {
                        var width = 1280, height = 660//landscape
                        if (clientHeight > clientWidth) {
                            // portrait:
                            width = 768; height = 1024
                        }
                        scale = Math.min(clientWidth / width, clientHeight / height)
                        scale = Math.floor(scale * 1000) / 1000;
                        (['scaledViewport', 'dragImage', 'close_credits']).forEach((s) => {
                            transform(
                                window.document.getElementById(s),
                                'scale(' + scale + ',' + scale + ')',
                                '0% 0% !important')
                        })

                        // The Wrapper-Div is just used to center the content in it:
                        var wrapper = window.document.getElementById('wrapper')
                        wrapper.style.height = (clientHeight) + 'px';
                        wrapper.style.paddingTop = Math.floor((clientHeight - height * scale) / 2) + 'px';
                        wrapper.style.paddingLeft = Math.floor((clientWidth - width * scale) / 2) + 'px';

                        var hint: HTMLElement = null
                        var triangle: HTMLElement = null
                        var direction: string

                        (['right', 'left', 'down', 'up', 'level']).forEach((s) => {
                            if ($('#hint_' + s).is(':visible')) {
                                hint = document.getElementById('hint_' + s)
                                direction = s
                            }
                        })

                        if (hint == null || hint == undefined)
                            return;

                        triangle = <HTMLElement>hint.querySelector('.triangle') // could be null!

                        var textDiv = <HTMLElement>hint.querySelector('div.text')

                        var rEl = document.getElementById(view.GAMEPLAY.id_hint_el).getBoundingClientRect();

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
                        } else if ('gameplay' === view.GAMEPLAY.id_hint_el) { // hint at the center 
                            hint.style.left = Math.floor((rEl.width - rHint.width) / 2 + rEl.left) + 'px'
                            hint.style.top = Math.floor((rEl.height - rHint.height) / 2 + rEl.top) + 'px'
                            // no triangle!
                        } else { // level hint (shown when "hints"-button is clicked)
                            hint.style.left = Math.floor(rEl.right - rHint.width) + 'px';
                            hint.style.top = Math.floor(rEl.bottom + 10 * scale) + 'px';
                            // no triangle!
                        }
                    }
            }
            window.onresize(null)
            window.addEventListener('onorientationchange', window.onresize, false);
    }
    var scale: number = 1;

    export function getScale() { return scale }

    export function setTextContent(e: HTMLElement, text: string) {
        if (typeof (e.innerText) !== 'undefined')
            e.innerText = text
        else if (typeof (e.textContent) !== 'undefined')
            e.textContent = text;
        else
            e.style.content = text;
        /*
        // http://jsperf.com/shim-for-firefox-innertext
        var element = document.createElement("div");
        if (!element.textContent && element.innerText) {
            HTMLElement.prototype.textContent = HTMLElement.prototype.innerHTML;
        }*/
    }

    export function setHTMLContent(e: HTMLElement, html: string) {
        if (typeof (e.innerHTML) !== 'undefined')
            e.innerHTML = html
        else // well, if that doesn't work then just treat it as text:
            setTextContent(e, html)
    }

    function _pageXYOffset() {
        if (typeof window.pageXOffset === 'number') return;
        //http://compatibility.shwups-cms.ch/de/polyfills/?&id=75
        window.pageXOffset === undefined && Object.defineProperty && Object.defineProperty(window, "pageXOffset", {
            get: function () { return this.document.documentElement.scrollLeft; }
        });
        //http://compatibility.shwups-cms.ch/de/polyfills/?&id=74
        window.pageYOffset === undefined && Object.defineProperty && Object.defineProperty(window, "pageYOffset", {
            get: function () { return this.document.documentElement.scrollTop; }
        });

    }

    function _dateNow() {
        // I proudly announce that I managed to do this all by myself.
        // I don't even know if any browser actually doesnt support it.
        if (!Date.now) {
            Date.now = function () {
                return new Date().getTime();
            };
        }
    }

    function _requestAnimationFrame() {
        // Code was taken from many different sources.
        // https://gist.github.com/paulirish/1579671
        // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
        // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        // Note: All major browsers but opera actually have a requestAnimationFrame-function. 
        var targetTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function (callback) {
                var currTime = Date.now();
                targetTime = Math.max(targetTime + 16, currTime);
                var id = window.setTimeout(
                    function () {
                        callback(Date.now());
                    }, targetTime - currTime);
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
    }

    function _array() {
        // IE8 lacks Array.filter().
        // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter
        if (!Array.prototype.filter) {
            Array.prototype.filter = function (fun, thisp?) {
                "use strict";

                if (this == null)
                    throw new TypeError();

                var t = Object(this);
                var len = t.length >>> 0;
                if (typeof fun != "function")
                    throw new TypeError();

                var res = [];
                for (var i = 0; i < len; i++) {
                    if (t[i]) {
                        var val = t[i]; // in case fun mutates this
                        if (fun.call(thisp, val, i, t))
                            res.push(val);
                    }
                }

                return res;
            };
        }

        //https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach
        if (!Array.prototype.forEach) {
            Array.prototype.forEach = function forEach(callback: (value: any, index?: number, array?: Array<any>) => void, thisArg?: any) {
                var T, k;
                if (this == null) {
                    throw new TypeError("this is null or not defined");
                }

                // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
                var O = Object(this);

                // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
                // 3. Let len be ToUint32(lenValue).
                var len = O.length >>> 0; // Hack to convert O.length to a UInt32

                // 4. If IsCallable(callback) is false, throw a TypeError exception.
                // See: http://es5.github.com/#x9.11
                if ({}.toString.call(callback) !== "[object Function]") {
                    throw new TypeError(callback + " is not a function");
                }

                // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if (thisArg) {
                    T = thisArg;
                }

                // 6. Let k be 0
                k = 0;

                // 7. Repeat, while k < len
                while (k < len) {

                    var kValue;

                    // a. Let Pk be ToString(k).
                    //   This is implicit for LHS operands of the in operator
                    // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                    //   This step can be combined with c
                    // c. If kPresent is true, then
                    if (Object.prototype.hasOwnProperty.call(O, k)) {

                        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                        kValue = O[k];

                        // ii. Call the Call internal method of callback with T as the this value and
                        // argument list containing kValue, k, and O.
                        callback.call(T, kValue, k, O);
                    }
                    // d. Increase k by 1.
                    k++;
                }
                // 8. return undefined
            };
        }
    }

    // gc can be called like this: window['gc']();
    // note: this only hints that gc can be run, nothing is guaranteed!
    function _garbageCollection() {
        // http://msdn.microsoft.com/en-us/library/ff520939(v=vs.85).aspx
        // http://help.dottoro.com/ljokwnuk.php
            if (window['gc']) return;
            var myGC = null;
            if (window['CollectGarbage']) // IE
                myGC = window['CollectGarbage'];
            else if (window['opera'] && window['opera']['collect'])
                window['gc'] = window['opera']['collect'];

            if (myGC) // can collect more if invoked from event-queue:
                window['gc'] = function () { setTimeout(myGC, 33); };
            else // chrome, firefox etc. dont have such a function.
                window['gc'] = function () { };
    }

    function _classList() {

        /*
         * classList.js: Cross-browser full element.classList implementation.
         * 2012-11-15
         *
         * By Eli Grey, http://eligrey.com
         * Public Domain.
         * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
         */

        /*global self, document, DOMException */

        /*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

        /* Some minor changes just so it compiles by Claude Martin. */
        if (typeof document === "undefined" || ("classList" in document.createElement("a")))
            return;

        var
            classListProp = "classList"
            , protoProp = "prototype"
            , elemCtrProto = (HTMLElement || Element)[protoProp]
            , objCtr = Object
            , strTrim = String[protoProp].trim || function () {
                return this.replace(/^\s+|\s+$/g, "");
            }
            , arrIndexOf = Array[protoProp].indexOf || function (item) {
                var
                    i = 0
                    , len = this.length
                    ;
                for (; i < len; i++) {
                    if (this[i] === item) {
                        return i;
                    }
                }
                return -1;
            }
            // Vendors: please allow content code to instantiate DOMExceptions
            , DOMEx = function (type, message) {
                this.name = type;
                this.code = DOMException[type];
                this.message = message;
            }
            , checkTokenAndGetIndex = function (classList, token) {
                if (token === "") {
                    throw new DOMEx(
                        "SYNTAX_ERR"
                        , "An invalid or illegal string was specified"
                    );
                }
                if (/\s/.test(token)) {
                    throw new DOMEx(
                        "INVALID_CHARACTER_ERR"
                        , "String contains an invalid character"
                    );
                }
                return arrIndexOf.call(classList, token);
            }
            , ClassList = function (elem) {
                var
                    trimmedClasses = strTrim.call(elem.className)
                    , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
                    , i = 0
                    , len = classes.length
                    ;
                for (; i < len; i++) {
                    this.push(classes[i]);
                }
                this._updateClassName = function () {
                    elem.className = this.toString();
                };
            }
            , classListProto = ClassList[protoProp] = []
            , classListGetter = function () {
                return new ClassList(this);
            }
            ;
        // Most DOMException implementations don't allow calling DOMException's toString()
        // on non-DOMExceptions. Error's toString() is sufficient here.
        DOMEx[protoProp] = Error[protoProp];
        classListProto['item'] = function (i) {
            return this[i] || null;
        };
        classListProto['contains'] = function (token) {
            token += "";
            return checkTokenAndGetIndex(this, token) !== -1;
        };
        classListProto['add'] = function () {
            var
                tokens = arguments
                , i = 0
                , l = tokens.length
                , token
                , updated = false
                ;
            do {
                token = tokens[i] + "";
                if (checkTokenAndGetIndex(this, token) === -1) {
                    this.push(token);
                    updated = true;
                }
            }
            while (++i < l);

            if (updated) {
                this._updateClassName();
            }
        };
        classListProto['remove'] = function () {
            var
                tokens = arguments
                , i = 0
                , l = tokens.length
                , token
                , updated = false
                ;
            do {
                token = tokens[i] + "";
                var index = checkTokenAndGetIndex(this, token);
                if (index !== -1) {
                    this.splice(index, 1);
                    updated = true;
                }
            }
            while (++i < l);

            if (updated) {
                this._updateClassName();
            }
        };
        classListProto['toggle'] = function (token, forse) {
            token += "";

            var
                result = this.contains(token)
                , method = result ?
                    forse !== true && "remove"
                    :
                    forse !== false && "add"
                ;

            if (method) {
                this[method](token);
            }

            return !result;
        };
        classListProto.toString = function () {
            return this.join(" ");
        };

        if (objCtr.defineProperty) {
            var classListPropDesc = {
                get: classListGetter
                , enumerable: true
                , configurable: true
            };
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } else if (objCtr[protoProp].__defineGetter__) {
            elemCtrProto.__defineGetter__(classListProp, classListGetter);
        }
    }

    /** transform-property on all browsers: */
    export function transform(el: HTMLElement, t: string, origin: string = '50% 50% !important') {
        var props = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
        props.forEach(function (p) {
            el.style[p] = t;
        });
        var props = ["transformOrigin", "webkitTransformOrigin", "MozTransformOrigin", "msTransformOrigin", "OTransformOrigin"];
        props.forEach(function (p) {
            el.style[p] = origin;
        });
    }

    /** "dnd" = Drag And Drop. Works with mouse, touch and pencil. */
    export module dnd {
        /** Function that indicates if DnD is allowed right now. 
            It is injected by the Controller (ctrl). 
            It needs to be exported, so that it can be called from the closures in this module. */
        export var isDnDAllowed: () => boolean = function () { return false }
        export function setDnDAllowedIndicator(f: () => boolean) {
            this.isDnDAllowed = f
        }

        export function init() {
            if (!window.navigator) window.navigator = <Navigator>{ msPointerEnabled: false };

            // "dragImage" is an element just to be displayed under the finger (or pencil) 
            // while being dragged. It will display the command that is dragged.
            // This is necessary because browsers don't support native drag and drop for touch.
            var dragImage = document.getElementById('dragImage');

            ['MSPointerUp', 'touchend', 'mouseup'].forEach((s) => {
                dragImage.addEventListener(s, function (evt: UIEvent) {
                    if (DATA_TRANSFER.isDragging && dnd.isDnDAllowed())
                            if (evt.stopPropagation)
                                evt.stopPropagation();
                            if (evt.preventDefault)
                                evt.preventDefault();
                            DATA_TRANSFER.isDragging = false;
                            dragImage.style.display = 'none';
                            setTimeout(() => {
                                var evt2 = new DNDEvent(evt, null, DATA_TRANSFER)
                                var target = evt2.getTarget()
                                if (!target['onDropListener'])
                                    target = target.parentElement
                                if (target['onDropListener'])
                                    target['onDropListener'](evt2)
                            }, 32);
                }, false);
            });
        }

        /** A Drag&Drop-Event. Designed to resemble original DragEvent.  */
        export class DNDEvent {
            private left: number;
            private top: number;
            constructor(
                private event: UIEvent,
                private target: HTMLElement,
                private dataTransfer: DataTransfer
            ) {
                this.left = -200;
                this.top = -200;

                var e: any = event;
                if (e['changedTouches'] && e['changedTouches'].item(0))
                    e = <MouseEvent>e['changedTouches'].item(0);
                else if (e['touches'] && e['touches'].item(0))
                    e = <MouseEvent>e['touches'].item(0);

                var offsetX = window.pageXOffset || window['scrollX'] || document.body.scrollLeft;
                var offsetY = window.pageYOffset || window['scrollY'] || document.body.scrollTop;

                if (e.pageX || e.pageY) {
                    this.left = e.pageX;
                    this.top = e.pageY;
                } else if ((e.clientX || e.clientY) &&
                    document.body &&
                    document.body.scrollLeft != null) {
                    this.left = e.clientX + offsetX;
                    this.top = e.clientY + offsetY;
                } else if (target) {
                    var rect = target.getBoundingClientRect();
                    this.left = offsetX + rect.left + (rect.width / 2);
                    this.top = offsetY + rect.top + (rect.height / 2);
                }

                if (!target)
                    this.target = <HTMLElement>
                        document.elementFromPoint(this.left, this.top)

            }
            public getTarget(): HTMLElement {
                return this.target;
            }
            public getDataTransfer(): DataTransfer {
                return this.dataTransfer;
            }
            public getEvent(): UIEvent {
                return this.event;
            }
            /** Absolute position "left" of event. */
            public getLeft() {
                return this.left;
            }
            /** Absolute position "top" of event. */
            public getTop() {
                return this.top;
            }

            /** Transformed position "left" of event. */
            public getScaledLeft() {
                return Math.round(this.left / scale);
            }
            /** Transformed position "top" of event. */
            public getScaledTop() {
                return Math.round(this.top / scale);
            }
        }

        export interface DNDListener {
            (event: DNDEvent): void;
        }

        /** Drag and Drop with mouse has such an object from the actual drag-event.
        But on touch it is just a fake drag-event. 
        DataTransfer can't be created as "new DataTransfer()" so we need to fake it too...
        "element" is the original element that is dragged. "isDragging" is true while dragging.
        HACK: added "data: string" to use it when the variable DATA_TRANSFER is defined
        */
        interface DataTransferShim extends DataTransfer {
            isDragging: boolean;
            element: HTMLElement;
            data: String;
        }

        /**
         HACK: -removed GENERICS from datatype definition (before: var DATA_TRANSFER = <DataTransferShim> {})
               -added "items: null" to prevent errors
         */
        var DATA_TRANSFER: DataTransferShim = {
            effectAllowed: 'all',
            dropEffect: 'move',
            types: null,
            files: null,
            data: "grab,0,0",
            clearData: function (format?: string): boolean { this.data = null; return true; },
            setData: function (format: string, data: string): boolean { this.data = data; return true; },
            getData: function (format: string): string { return this.data; },
            isDragging: false,
            element: null,
            items: null
        };

        /** Register an event listener to some html element to be invoked on the start of a drag&drop operation. */
        export function registerDrag(element: HTMLElement, listener: DNDListener) {
            // works for dragstart, touchstart and MSPointerDown

            var evetns = ['mousedown', 'touchstart'];
            if (window.navigator.msPointerEnabled)
                evetns = ['MSPointerDown']

            evetns.forEach((s) => {
                element.addEventListener(s, function (evt: DragEvent) {
                    if (!dnd.isDnDAllowed()) return
                    if (evt.dataTransfer) // dragstart:
                        DATA_TRANSFER = <DataTransferShim>evt.dataTransfer;
                    else // touchstart:
                        evt.dataTransfer = DATA_TRANSFER;
                    DATA_TRANSFER.isDragging = true
                    DATA_TRANSFER.element = element
                    listener(new DNDEvent(evt, element, DATA_TRANSFER))

                        // This is logic that should go to the view or controller...
                        // It's only here because we need some shim for Drag and Drop for touch.
                        var dragImage = document.getElementById('dragImage');
                        dragImage.className = 'tool ' + element.className.split(' ').pop()

                        if ('move' === DATA_TRANSFER.dropEffect) // a command from a register
                            // "cmd-noop" or "cmd-nocond":
                            element.className = 'cmd-no' + (element.id.match(/^[a-z]+/)[0])

                        // MSIE will use this, touch devices invoke it on "touchmove":
                        window.onmousemove = function (evt2: MouseEvent) {
                            //FIXME: check if this really was unrequired
                            //evt2 = evt2 || window.event; // MSIE
                            if (DATA_TRANSFER.isDragging) {
                                var evt3 = new DNDEvent(evt2, dragImage, DATA_TRANSFER)
                                dragImage.style.left = (Math.round(evt3.getLeft()) - 25) + 'px'
                                dragImage.style.top = (Math.round(evt3.getTop()) - 27) + 'px'
                                dragImage.style.display = 'block'
                            } else {
                                window.document.body.removeEventListener('touchmove', window.onmousemove, true)
                                window.onmousemove = null
                            }
                        }
                        window.document.body.addEventListener('touchmove', window.onmousemove, true)
                        window.onmousemove(evt)
                }, false);
            });


        }
        /** Register an event listener to some html element to be invoked on the drop of a drag&drop operation. */
        export function registerDrop(element: HTMLElement, listener: DNDListener) {

            var events = ['mouseup', 'touchend'];
            if (window.navigator.msPointerEnabled)
                events = ['MSPointerUp'];
            else
                ['dragover', 'touchmove'].forEach((s) => {
                    element.addEventListener(s, function (evt: DragEvent) {
                        if (evt.preventDefault)
                            evt.preventDefault();
                    }, false);
                });

            element['onDropListener'] = listener;

            events.forEach((s) => {
                element.addEventListener(s, function (evt: DragEvent) {
                    if (!dnd.isDnDAllowed()) return;
                    //if (evt.stopPropagation)
                        //evt.stopPropagation()
                    //if (evt.preventDefault)
                        //evt.preventDefault()

                    // Most browsers create a new DataTransfer-object (for whatever reason).
                    // This is rather annoying because one can't just add custom fields.
                    // isDragging would be such a custom field, so we simply copy it from the 
                    // reference to the original object (which would contain the same information).
                    var isDragging = DATA_TRANSFER.isDragging
                    if (evt.dataTransfer)
                        DATA_TRANSFER = <DataTransferShim>evt.dataTransfer
                    else
                        evt.dataTransfer = DATA_TRANSFER
                    DATA_TRANSFER.isDragging = isDragging

                    document.getElementById('dragImage').style.display = 'none'
                    // new we "see" what's behind the dragImage:
                    var evt2 = new DNDEvent(evt, (s === 'drop' ? element : null), DATA_TRANSFER)

                    if (!DATA_TRANSFER.isDragging) {
                        // elements with "onlick" defined want to be clicked.
                        // But some browsers (eg MSIE) would then click twice.
                        // Opera Mobile ("OPR") would not click at all:
                        if (evt2.getTarget().onclick && navigator.userAgent.match(/OPR\//) !== null) {
                            evt2.getTarget().onclick.apply(evt2.getTarget(), evt)
                        }
                    } else {
                        window.document.body.removeEventListener('touchmove', window.onmousemove, true)
                        window.onmousemove = null
                        DATA_TRANSFER.isDragging = false
                        listener(evt2)
                    }
                }, false); // "useCapture" must be false! (Or else #gameplay would capture all.)
            });
        }
    }
}
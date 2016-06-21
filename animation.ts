/// <reference path="lib/typings/box2d/box2dweb.d.ts" />

module animation {
    /** This holds the horizontal positions (x-coordinates) of all platforms. 
        The values are the center of the platforms. */
    class PlatformX {
        constructor(amountOfPlatforms: number) {
            var spd = SIZE.PLATFORM_DISTANCE;
            this._poleLeft = (SIZE.WORLD_WIDTH / 2) // center of the world
                -
                ((0.5 + (amountOfPlatforms / 2)) * spd); // offset
            for (var i = 0; i < amountOfPlatforms; i++) {
                this._x[i] = this._poleLeft + ((i + 1) * spd);
            }
            this._poleRight = this._x[amountOfPlatforms - 1] + spd;
        }
        private _poleLeft: number;
        private _poleRight: number;
        private _x = new Array<number>();

        /** x coordinate of a platform. */
        public getX(nr: number): number {
            if (nr == -1) return this._poleLeft;
            if (nr == this._x.length) return this._poleRight;
            return this._x[nr];
        }
        public poleLeft(): number {
            return this._poleLeft;
        }
        public poleRight(): number {
            return this._poleRight;
        }
    }

    /** Upper-case first charater: "blue" => "Blue" */
    function UCFirst(str: String) {
        if (!str || str.length == 0)
            return str;
        var rv: String = str.charAt(0).toUpperCase();
        for (var i = 1; i < str.length; i++)
            rv += str.charAt(i);
        return rv;
    }
    /** This simply defines what the "user data" actually holds. 
     * Box2d allows to set some optional "user data". What we need to know is the 
     * div-Element and the aproximate width and height. 
     * These are important because box2d uses the center of elements to define the position.
     * but in HTML we need the upper left corner.
     */
    class HTMLDrawData {
        public div: HTMLDivElement;
        public shadow: HTMLDivElement;
        public width: number;
        public height: number;
    }

    /** 
     * This draws the grafics using just html and css. No WebGL or Canvas-drawing needed.
     * Opera has some problems when the user is scrolling. In other browsers it looks fine.
     */
    class HTMLDraw {
        private stage: HTMLDivElement;
        private bodies: Box2D.Dynamics.b2Body[] = new Array();
        constructor() {
            this.stage = <HTMLDivElement>document.getElementById('stage');
        }
        private middleShadow: HTMLDivElement = null;
        private middleShadowShort: boolean = false; //indicates that the shadow must be shortened
        /**
         * register a body "b".
         * width and height are in meters!
         */
        public register(b: Box2D.Dynamics.b2Body, width: number, height: number, image: string) {
            this.bodies.push(b);
            var div = <HTMLDivElement>document.createElement('div');
            var mobile = conf.isMobile(); //because mobile browsers usually can't render the shadows very well.
            div.className = 'htmldraw';
            div.style.background = 'url(./gfx/' + image + '.png)';
            var both = [div];
            var shadow = null;
            if (!mobile) {
                shadow = <HTMLDivElement>document.createElement('div');
                shadow.className = 'htmlshadow';
                shadow.style.background = 'url(./gfx/' +
                    (image.match(/^Crate.*/) ? 'Crate' : image) +
                    '_Shadow.png)';
                both.push(shadow);
            }
            both.forEach((v) => {
                v.style.width = (width / SIZE.ONE_PIXEL) + 'px';
                v.style.height = (height / SIZE.ONE_PIXEL) + 'px';
            });

            // because this would overlap with the right and left claw and not reach the right claw:
            if (!mobile && image === 'Claw_Middle') {
                shadow.style.width = '65px'; //instead of 62px
                this.middleShadow = shadow;
            }

            this.stage.appendChild(div);
            if (!mobile)
                this.stage.appendChild(shadow);
            b.SetUserData({
                div: div,
                shadow: shadow,
                width: width,
                height: height
            });
        }
        public clear() {
            this.bodies.forEach((b) => {
                // This simply helps the garbage collector:
                b.SetUserData(null);
            });
            this.bodies = new Array();
        }
        public update() {
            this.bodies.forEach((b) => {
                var data = <HTMLDrawData>b.GetUserData();
                // Browser should know "rad", but "deg" just seems saver.
                var deg = Math.round(((b.GetAngle() + (2 * Math.PI)) % (2 * Math.PI)) * (180 / Math.PI) * 100) / 100;
                //data.div.style.transform = 'rotate(' + deg + 'deg)';
                //standard property would not work in chrome so we use this function:
                shims.transform(data.div, 'rotate(' + deg + 'deg)');
                var top = Math.floor((b.GetPosition().y - data.height / 2) / SIZE.ONE_PIXEL);
                var left = Math.floor((b.GetPosition().x - data.width / 2) / SIZE.ONE_PIXEL);
                data.div.style.top = top + 'px';
                data.div.style.left = left + 'px';

                if (data.shadow) { // not shown on mobile browsers.
                    // The stage is 768px wide.
                    left = Math.floor(left + (left - 384) / 15);
                    top = Math.floor(top * 1.04);
                    data.shadow.style.left = left + 'px';
                    data.shadow.style.top = top + 'px';
                    shims.transform(data.shadow, 'rotate(' + deg + 'deg) scale(1.04,1.04)');
                    //this is ugly, but it works for now.
                    if (data.shadow == this.middleShadow) {
                        if (ANIMATION['crashStart'] || ANIMATION['activity'] === Animation.ACTIVITY_OPEN)
                            this.middleShadowShort = false;
                        else if (ANIMATION['activity'] === Animation.ACTIVITY_CLOSE)
                            this.middleShadowShort = true;
                        if (this.middleShadowShort) {
                            data.shadow.style.width = '40px';
                            data.shadow.style.left = (12 + left) + 'px';
                        } else
                            data.shadow.style.width = '65px'; //instead of 62px        
                    }
                }
            });
        }
    }

    export function fadeOut(elem: any, callback?: any) {
        $(elem).animate({
            "opacity": "0"
        }, 500, function () {
            callback();
            $(elem).css('opacity', '1');
        });
    }

    export function animateMenu(elem: any) {
        $(elem).animate({
            "width": "0px",
            "height": "0px"
        }, 400, function () {
            elem.style.display = 'none';
        });
    }

    export function animateCredits(elem: any, callback: any) {
        $(elem).animate({
            "opacity": "0"
        }, 100, function () {
            animateCreditsElements()
            callback()
            $(elem).animate({
                "opacity": "1"
            }, 100);
        });
    }

    function animateCreditsElements() {
        if ($('#credits_links').is(':visible')) {
            $('#credits_links').animate({
                opacity: '0.0',
            }, function () {
                $('#credits_links').hide()
                $('#original_credits').show()
                $('#original_credits').animate({
                    opacity: '1',
                });
            });
        } else {
            $('#original_credits').animate({
                opacity: '0.0',
            }, function () {
                $('#original_credits').hide()
                $('#credits_links').show()
                $('#credits_links').animate({
                    opacity: '1',
                });
            });
        }
        if ($('#credits').is(':visible')) {
            setTimeout(animateCreditsElements, 4000);
        }
    }

    export function animateLevelPackRight(elem: any, callback: any) {
        if (window.innerHeight < window.innerWidth) {
            $(elem).animate({
                "margin-left": "-105%",
                'opacity': '0'
            }, 250, function () {
                $(elem).css({
                    'margin-left': '95%'
                });
                callback();
                $(elem).animate({
                    'margin-left': '5%',
                    'opacity': '1'
                }, 250);
            });
        } else {
            $(elem).animate({
                "margin-left": "-100%",
                'opacity': '0'
            }, 250, function () {
                $(elem).css({
                    'margin-left': '100%'
                });
                callback();
                $(elem).animate({
                    'margin-left': '0%',
                    'opacity': '1'
                }, 250);
            });
        }
    }

    export function animateLevelPackLeft(elem: any, callback: any) {
        if (window.innerHeight < window.innerWidth) {
            $(elem).animate({
                "margin-left": "95%",
                'opacity': '0'
            }, 250, function () {
                $(elem).css({
                    'margin-left': '-105%'
                });
                callback();
                $(elem).animate({
                    'margin-left': '5%',
                    'opacity': '1'
                }, 250);
            });
        } else {
            $(elem).animate({
                "margin-left": "100%",
                'opacity': '0'
            }, 250, function () {
                $(elem).css({
                    'margin-left': '-100%'
                });
                callback();
                $(elem).animate({
                    'margin-left': '0%',
                    'opacity': '1'
                }, 250);
            });
        }
    }

    /**
      Used to move one body in one direction.
      This holds all information needed to move the body. 
      Distances are in meters and time is in milliseconds. Therefore speed is in m/ms.
      The time passed to move() is the time since the start of this move.
     */
    class BodyMove {
        public static UP = 1;
        public static DOWN = 2;
        public static LEFT = 3;
        public static RIGHT = 4;
        /** initial position (meters). */
        private start: number;
        /** Speed (m/ms). */
        private speed: number;

        constructor(
            /** Body to be moved. */
            private body: Box2D.Dynamics.b2Body,
            /** final position (meters). */
            private end: number,
            /** Direction, one of [UP, DOWN, LEFT, RIGHT]. */
            private direction: number,
            /** Timestamp T0 in ms. */
            private t0: number

        ) {
            if (!body)
                throw 'BodyMove: body must not be null!';

            this.start = this.getPos();
            this.speed = Animation.getSpeed();

            if (this.direction == BodyMove.RIGHT || this.direction == BodyMove.DOWN) {
                if (end < this.start)
                    throw 'Body can\'t be moved right/down. End position is lower than current position.';
            } else {
                if (end > this.start)
                    throw 'Body can\'t be moved left/up. End position is greater than current position.';
            }

            if (isNaN(end) || isNaN(direction))
                throw 'BodyMove: NaN not allowed!';

            if ([BodyMove.UP, BodyMove.DOWN, BodyMove.LEFT, BodyMove.RIGHT].indexOf(direction) === -1)
                throw 'BodyMove: Direction unknwon: ' + direction;
        }

        /** 
        moves the body according to the time passed since the beginning of this move.
        this prepares the body for the next frame, which is scheduled to be drawn at the given time.
        returns: true if finished, false if not finished.
        */
        public move(time: number): boolean {
            var dt = time - this.t0; // delta-T
            if (dt < 1) return false; // drop it
            var pos = this.getPos();
            var finished = false;
            switch (this.direction) {
                case BodyMove.DOWN:
                    try {
                        soundplayer.move_crane.play();
                    } catch (ex) {
                        //TODO: find out why this sometimes crashes on win phone emulator
                    }
                case BodyMove.RIGHT:
                    try {
                        soundplayer.move_crane.play();
                    } catch (ex) {
                        //TODO: find out why this sometimes crashes on win phone emulator
                    }
                    pos = this.start + (this.speed * dt);
                    pos = Math.min(pos, this.end);
                    finished = pos >= this.end;
                    break;
                case BodyMove.LEFT:
                    try {
                        soundplayer.move_crane.play();
                    } catch (ex) {
                        //TODO: find out why this sometimes crashes on win phone emulator
                    }
                case BodyMove.UP:
                    pos = this.start - (this.speed * dt);
                    pos = Math.max(pos, this.end);
                    finished = pos <= this.end;
                    break;
                default:
                    throw 'direction unknown!';
            }
            this.setPos(pos);
            return finished;
        }

        private getPos() {
            switch (this.direction) {
                case BodyMove.UP:
                case BodyMove.DOWN:
                    return this.body.GetPosition().y;
                case BodyMove.RIGHT:
                case BodyMove.LEFT:
                    return this.body.GetPosition().x;
                default:
                    throw 'direction unknown!';
            }
        }

        private setPos(pos: number): void {
            switch (this.direction) {
                case BodyMove.UP:
                case BodyMove.DOWN:
                    this.body.GetPosition().y = pos;
                    break;
                case BodyMove.RIGHT:
                case BodyMove.LEFT:
                    this.body.GetPosition().x = pos;
                    break;
                default:
                    throw 'direction unknown!';
            }
            // Box2D would not know about the new position.
            // So the position-object is simply set again.
            this.body.SetPosition(this.body.GetPosition());
        }
    }

    /** The animation displays the cargo-bot when it moves the crates. */
    export interface IAnimation {
        constructor(cargo: model.ICargo);

        /** After one step of the stack machine the controller calles animate().
         * Each function returns a new function to be called. 
         * After the animation is finished a null-Pointer is returned, 
         * indicating that the controller can invoke the next satep on the stack machine. 
         * 
         */
        animate(timestamp: number): ctrl.IGameLoopCallback;
    }

    /** Some constants about the dimensions of the elements. */
    var SIZE = {
        CRATE_EDGE: 1, // 1 meter = 38px
        ONE_PIXEL: 1 / 38,
        WORLD_WIDTH: 768 / 38,
        WORLD_HEIGHT: 312 / 38,
        /** This is also the width of the poles left and right. */
        ARM_DIAMETER: 12 / 38,
        /** Distance of two adjoining platforms. */
        PLATFORM_DISTANCE: 85 / 38,
        /** Width of a red platform. It is actually a polygon, this is just for estimation.  */
        PLATFORM_WIDTH: 66 / 38,
        /** Height of a red platform. It is actually a polygon, this is just for estimation. */
        PLATFORM_HEIGHT: 12 / 38,
        /** Distance from center of platform/arm to center of claw. */
        CLAW_OPEN: 1,
        /** Distance from center of platform/arm to center of claw. */
        CLAW_CLOSED: 26.5 / 38, // half a crate plus half an arm = 25, but then the middle arm would show.
        /** Height of one claw. It is actually a polygon, this is just for estimation. */
        CLAW_HEIGHT: 54 / 38,
        /** Width of one claw. It is actually a polygon, this is just for estimation. */
        CLAW_WIDTH: 17 / 38,
        /** Width of the "middle" bar. */
        MIDDLE_WIDTH: 62 / 38
    }

    /**
    The animation handles the movements of the crates and the grappler.
    Box2d is used so the "crash" can be animated in a realistic way. 
    During animation the bodies are animated by simply altering the position.
    There is no gravity and therefore nothing to simulate.
    Gravity is activated on crash.
    
    About the dimensions and positions:
    The size is the same as in the original game. 
    But box2d uses meters instead of pixels.
    So 38 pixels equal 1 meter. 
    A crate is simply 1 m in width and height. 
    But box2d uses half of those edge lengths. 
    
    The position of a crate is it's center. 
    That's why only half of the edge length is given.
    Let's pretend this is a square box:
     _____
    |  |  |
    |--c--|
    |__|__|
    
    The center point is marked with a "c". "--" and "|" are half of the edge.
    In our case it is 0.5 meter. But all sizes have a static variable.
    
    Note: new concepts in ecmascript "enum" and "const" would be great in this code.
    But the support by browsers and the TypeScript compiler is "experimental" at best.
    So instead the constants for "SIZE", "STATE" and "ACTIVITY" are just static variables. 
    */
    export class Animation {
        constructor(private cargo: model.ICargo) {
            var ps = new Box2D.Collision.Shapes.b2PolygonShape;
            this.fixDefCrate.shape = ps;
            ps.SetAsBox(SIZE.CRATE_EDGE / 2, SIZE.CRATE_EDGE / 2);
            this.fixDefCrate.restitution = 0.0;
            this.fixDefCrate.density = 1;
            this.fixDefCrate.friction = 0.3;

            this.crateY = new Array<number>();
            this.crateY.length = conf.getMaxCrateHeight() + 1; // 7
            // set x-coordinate of crates 0 to 6:
            for (var i = 0; i <= conf.getMaxCrateHeight(); i++) {
                // Note: the factor of "1.01" is just here so that the crates do not 
                // collide when set up. With this, they are resting when the animation begins.
                // Do not change this!
                this.crateY[i] = SIZE.WORLD_HEIGHT -
                    SIZE.PLATFORM_HEIGHT -
                    (SIZE.CRATE_EDGE * 1.008 * (i + 0.5));
            }
            // the highest crate causes the pile to crash. 
            // in the grappler it is just about one pixel higher.
            this.CRATE_GRABBED_Y = this.crateY[this.crateY.length - 1] - SIZE.ONE_PIXEL;

            this.fixDefPlatform = new Box2D.Dynamics.b2FixtureDef();
            //this.fixDefPlatform.shape = new Box2D.Collision.Shapes.b2PolygonShape;
            //this.fixDefPlatform.shape.SetAsBox(SIZE.PLATFORM_WIDTH / 2, SIZE.PLATFORM_HEIGHT / 2);
            var vertices: Box2D.Common.Math.b2Vec2[] = new Array();
            //       3-------0
            //      /         \
            //     2-----------1
            vertices[0] = new Box2D.Common.Math.b2Vec2(SIZE.PLATFORM_WIDTH / (+2.5), SIZE.PLATFORM_HEIGHT / (-2));
            vertices[1] = new Box2D.Common.Math.b2Vec2(SIZE.PLATFORM_WIDTH / (+2.0), SIZE.PLATFORM_HEIGHT / (+2));
            vertices[2] = new Box2D.Common.Math.b2Vec2(SIZE.PLATFORM_WIDTH / (-2.0), SIZE.PLATFORM_HEIGHT / (+2));
            vertices[3] = new Box2D.Common.Math.b2Vec2(SIZE.PLATFORM_WIDTH / (-2.5), SIZE.PLATFORM_HEIGHT / (-2));

            this.fixDefPlatform.shape = Box2D.Collision.Shapes.b2PolygonShape.AsArray(vertices, vertices.length);
            this.fixDefPlatform.density = 10;
            this.fixDefPlatform.friction = 0.3;
            this.fixDefPlatform.restitution = 0.0;

            this.cargo.subscribe(this, this.notify);

            this.world = new Box2D.Dynamics.b2World(
                new Box2D.Common.Math.b2Vec2(0, 0) //gravity
                , true //allow sleep
            );
            this.world.SetWarmStarting(true);

            var bodyDef = new Box2D.Dynamics.b2BodyDef();
            var fixDef = new Box2D.Dynamics.b2FixtureDef(); { // ARM (of grappler)
                bodyDef = new Box2D.Dynamics.b2BodyDef();
                fixDef = new Box2D.Dynamics.b2FixtureDef();
                fixDef.density = 2;
                fixDef.friction = 0.4;
                fixDef.restitution = 0.1;
                bodyDef.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
                var ps = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape = ps;
                ps.SetAsBox(SIZE.ARM_DIAMETER / 2, SIZE.WORLD_HEIGHT / 2);
                this.arm = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            { // BASE (of grappler and poles)
                bodyDef.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
                var ps = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape = ps;
                ps.SetAsBox(0.8, 0.24);
                this.base = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                this.poleLeftBaseTop = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                this.poleLeftBaseBottom = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                this.poleRightBaseTop = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                this.poleRightBaseBottom = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            { // MIDDLE (of grappler)
                bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
                var ps = new Box2D.Collision.Shapes.b2PolygonShape()
                fixDef.shape = ps;
                ps.SetAsBox(SIZE.MIDDLE_WIDTH / 2, SIZE.ARM_DIAMETER / 2);
                this.middle = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            { // CLAWS (of grappler)
                bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
                var vertices: Box2D.Common.Math.b2Vec2[] = new Array();
                vertices[0] = new Box2D.Common.Math.b2Vec2(7 / 38, -27 / 38);
                vertices[1] = new Box2D.Common.Math.b2Vec2(7 / 38, 27 / 38);
                vertices[2] = new Box2D.Common.Math.b2Vec2(2 / 38, 27 / 38);
                vertices[3] = new Box2D.Common.Math.b2Vec2(-8 / 38, -2 / 38);
                vertices[4] = new Box2D.Common.Math.b2Vec2(0 / 38, -27 / 38);

                fixDef.shape = Box2D.Collision.Shapes.b2PolygonShape.AsArray(vertices, vertices.length);
                //fixDef.shape.SetAsBox(SIZE.CLAW_WIDTH / 2, SIZE.CLAW_HEIGHT /2);
                this.clawLeft = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                vertices.forEach(function (vec) {
                    vec.x *= -1;
                });
                vertices.reverse(); //now we have the mirrored shape.
                fixDef.shape = Box2D.Collision.Shapes.b2PolygonShape.AsVector(vertices, vertices.length);
                this.clawRight = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            { // GROUND
                bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
                bodyDef.position.x = SIZE.WORLD_WIDTH / 2;
                bodyDef.position.y = SIZE.WORLD_HEIGHT + 1;
                fixDef.density = 1;
                fixDef.friction = 0.4;
                fixDef.restitution = 0.3;
                var ps = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape = ps;
                ps.SetAsBox(SIZE.WORLD_WIDTH / 2, 1);
                this.ground = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            { // POLES
                bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
                bodyDef.position.x = SIZE.WORLD_WIDTH / 2; // This will change for each level
                bodyDef.position.y = SIZE.WORLD_HEIGHT / 2; // The same for all levels.
                fixDef.density = 1;
                fixDef.friction = 0.4;
                fixDef.restitution = 0.3;
                var ps = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape = ps;
                ps.SetAsBox(SIZE.ARM_DIAMETER / 2, SIZE.WORLD_HEIGHT / 2);
                this.poleLeft = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                this.poleRight = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            /*{ // for debugging only:
                bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
                bodyDef.position.x = SIZE.WORLD_WIDTH - 1;
                var foo = function (y) => {
                    bodyDef.position.y = y;
                    fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
                    fixDef.shape.SetAsBox(0.5, 0.5);
                    this.world.CreateBody(bodyDef).CreateFixture(fixDef);
                };
                this.crateY.forEach(foo);
                foo(this.CRATE_GRABBED_Y);
            }*/

            this.reset();

            /*{
                //setup debug draw
                var debugDraw = new Box2D.Dynamics.b2DebugDraw();
                debugDraw.SetSprite((<HTMLCanvasElement>document.getElementById("canvas")).getContext("2d"));
                debugDraw.SetDrawScale(38); // 1 meter = 38 pixels
                debugDraw.SetFillAlpha(0.3);
                debugDraw.SetLineThickness(1.0);
                debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
                this.world.SetDebugDraw(debugDraw);
            }*/
        }

        /** Meters per millisecond = crate sides per millisecond. */
        public static getSpeed() {
            if (conf.debug()) {
                if (model.MODEL.isFast())
                    return 1000 // superfast = 1000000 m/s = 3600000 kmh
                else
                    return 1 / 1000 // super slow = 1 m/s = 3.6 kmh
            } else {
                if (model.MODEL.isFast())
                    return 40 / 1000 // fast = 40 m/s = 144 kmh
                else
                    return 12 / 1000 // slow = 12 m/s = 43.2 kmh
            }
        }

        /** Current state of the animation.  */
        private state = Animation.STATE_NO_STATE;
        /** Activity is mostly relevant for such states that require multiple subanimations:
         * STATE_GRAB_TO_GET, STATE_GRAB_TO_PARK, STATE_GRAB_EMPTY 
         * Note that a crash is always delayed by one activity!
         */
        private activity = Animation.ACTIVITY_NO_ACTIVITY;

        private crashing = false;
        /** 
         * Height (0 to 7) of the crate.
         * STATE_GRAB_TO_GET: Height of crate before it is picked up.
         * STATE_GRAB_TO_PARK: Height of crate after it is put down.
         * STATE_GRAB_EMPTY: Always 0.
         */
        private grabHeight = 0;

        /** Waiting for the next state... */
        static STATE_NO_STATE = 0;
        static ACTIVITY_NO_ACTIVITY = 0;
        // States set by notify():

        /** Grappler is going left with a crate. */
        static STATE_LEFT_WITH_CRATE = 1;
        /** Empty grappler is going left. */
        static STATE_LEFT_WITHOUT_CRATE = 2;
        /** Grappler is going right with a crate. */
        static STATE_RIGHT_WITH_CRATE = 3;
        /** Empty grappler is going right. */
        static STATE_RIGHT_WITHOUT_CRATE = 4;
        /** Empty grappler is going down to grap a crate. */
        static STATE_GRAB_TO_GET = 5;
        /** Grappler with crate is going down to put the crate down. */
        static STATE_GRAB_TO_PARK = 6;
        /** Empty grappler is going down, platform is empty.  */
        static STATE_GRAB_EMPTY = 7;

        // Activities are set during animation():

        /** Grappler is going left.  */
        static ACTIVITY_LEFT = 1;
        /** Grappler is going right.  */
        static ACTIVITY_RIGHT = 2;
        /** Grappler is going down.  */
        static ACTIVITY_DOWN = 3;
        /** Grappler is going up. */
        static ACTIVITY_UP = 4;
        /** Claw is closing. */
        static ACTIVITY_CLOSE = 5;
        /** Claw is opening. */
        static ACTIVITY_OPEN = 6;
        /** Claw and crates are crashing. */
        static ACTIVITY_CRASH = 7;

        private platformX: PlatformX = null;
        private crateY: number[]; // y-coordinates of the crates.

        private CRATE_GRABBED_Y: number; // just about one pixel higher than crateX[6] 

        // Elements of box2d:
        private listener: Box2D.Dynamics.b2ContactListener;
        private world: Box2D.Dynamics.b2World;
        /** The "base" of the grappler. */
        private base: Box2D.Dynamics.b2Fixture;
        /** The "arm" of the grappler. */
        private arm: Box2D.Dynamics.b2Fixture;
        /** The "middle" part of the grappler. */
        private middle: Box2D.Dynamics.b2Fixture;
        /** The left claw of the grappler. */
        private clawLeft: Box2D.Dynamics.b2Fixture;
        /** The right claw of the grappler. */
        private clawRight: Box2D.Dynamics.b2Fixture;
        /** The left pole. */
        private poleLeft: Box2D.Dynamics.b2Fixture;
        private poleLeftBaseTop: Box2D.Dynamics.b2Fixture;
        private poleLeftBaseBottom: Box2D.Dynamics.b2Fixture;
        /** The right pole. */
        private poleRight: Box2D.Dynamics.b2Fixture;
        private poleRightBaseTop: Box2D.Dynamics.b2Fixture;
        private poleRightBaseBottom: Box2D.Dynamics.b2Fixture;
        /** The ground (floor) of the world (not visible). */
        private ground: Box2D.Dynamics.b2Fixture;
        /** Holds the Fixtures of all crates. 
        Use GetBody() and GetUserData() to get the b2Body and the ICrate, resp. */
        private crates: Box2D.Dynamics.b2Fixture[] = new Array();
        /** This defines the shape of one crate. */
        private fixDefCrate = new Box2D.Dynamics.b2FixtureDef();
        /** Fixture of the crate that is currently grabbed. */
        private grabbedCrate: Box2D.Dynamics.b2Fixture = null;
        /** platforms of this level. */
        private platforms: Box2D.Dynamics.b2Fixture[] = new Array();
        /** This defines the shape of one platform. */
        private fixDefPlatform = new Box2D.Dynamics.b2FixtureDef();

        /** prepares the animation for the next run. */
        private reset() {
            if (!this.cargo.getLevel()) return;
            var lvl = this.cargo.getLevel();
            var numPlatforms = lvl.getPlatforms();
            this.platformX = new PlatformX(numPlatforms);
            this.movements.length = 0;
            this.lastTimeStamp = 0;
            this.crashStart = 0;
            this.crashing = false;
            this.state = Animation.STATE_NO_STATE;
            this.activity = Animation.ACTIVITY_NO_ACTIVITY;
            this.grabbedCrate = null;
            this.grabHeight = 0;

            HTML_DRAW.clear();
            var stage = document.getElementById('stage');
            var els = stage.querySelectorAll('*');
            for (var i = 0; i < els.length; i++)
                stage.removeChild(els.item(i));

            {
                var x = this.platformX.getX(this.cargo.getGrapplerPosition());
                this.arm.GetBody().GetPosition().x = x;
                this.arm.GetBody().GetPosition().y = (22 / 38) - (SIZE.WORLD_HEIGHT / 2);
                this.arm.GetBody().SetAngle(0);
                HTML_DRAW.register(this.arm.GetBody(), SIZE.ARM_DIAMETER, SIZE.WORLD_HEIGHT, 'Claw_Arm');
                this.base.GetBody().GetPosition().x = x;
                this.base.GetBody().GetPosition().y = 0.12;
                HTML_DRAW.register(this.base.GetBody(), 0.8, 0.24, 'Claw_Base');
                this.middle.GetBody().GetPosition().x = x;
                this.middle.GetBody().GetPosition().y = 27 / 38;
                this.middle.GetBody().SetAngle(0);
                HTML_DRAW.register(this.middle.GetBody(), SIZE.MIDDLE_WIDTH, SIZE.ARM_DIAMETER, 'Claw_Middle');
                this.clawLeft.GetBody().GetPosition().x = x - SIZE.CLAW_OPEN;
                this.clawLeft.GetBody().GetPosition().y = 38 / 38;
                this.clawLeft.GetBody().SetAngle(0);
                HTML_DRAW.register(this.clawLeft.GetBody(), SIZE.CLAW_WIDTH, SIZE.CLAW_HEIGHT, 'Claw_Left');
                this.clawRight.GetBody().GetPosition().x = x + SIZE.CLAW_OPEN;
                this.clawRight.GetBody().GetPosition().y = 38 / 38;
                this.clawRight.GetBody().SetAngle(0);
                HTML_DRAW.register(this.clawRight.GetBody(), SIZE.CLAW_WIDTH, SIZE.CLAW_HEIGHT, 'Claw_Right');
            }

            // remove all creates and platforms:
            var fixture: Box2D.Dynamics.b2Fixture;
            while (fixture = this.crates.pop())
                fixture.GetBody().GetWorld().DestroyBody(fixture.GetBody());
            while (fixture = this.platforms.pop())
                fixture.GetBody().GetWorld().DestroyBody(fixture.GetBody());

            // set poles on both sides:
            this.poleLeft.GetBody().GetPosition().x = this.platformX.poleLeft();
            this.poleLeft.GetBody().SetPosition(this.poleLeft.GetBody().GetPosition());
            HTML_DRAW.register(this.poleLeft.GetBody(), SIZE.ARM_DIAMETER, SIZE.WORLD_HEIGHT, 'Claw_Arm');
            this.poleLeftBaseTop.GetBody().GetPosition().x = this.platformX.poleLeft();
            this.poleLeftBaseTop.GetBody().GetPosition().y = 0.12;
            this.poleLeftBaseTop.GetBody().SetPosition(this.poleLeftBaseTop.GetBody().GetPosition());
            HTML_DRAW.register(this.poleLeftBaseTop.GetBody(), 0.8, 0.24, 'Claw_Base');
            this.poleLeftBaseBottom.GetBody().GetPosition().x = this.platformX.poleLeft();
            this.poleLeftBaseBottom.GetBody().GetPosition().y = SIZE.WORLD_HEIGHT - 0.1;
            this.poleLeftBaseBottom.GetBody().SetPosition(this.poleLeftBaseBottom.GetBody().GetPosition());
            this.poleLeftBaseBottom.GetBody().SetAngle(Math.PI);
            HTML_DRAW.register(this.poleLeftBaseBottom.GetBody(), 0.8, 0.24, 'Claw_Base');

            this.poleRight.GetBody().GetPosition().x = this.platformX.poleRight();
            this.poleRight.GetBody().SetPosition(this.poleRight.GetBody().GetPosition());
            HTML_DRAW.register(this.poleRight.GetBody(), SIZE.ARM_DIAMETER, SIZE.WORLD_HEIGHT, 'Claw_Arm');
            this.poleRightBaseTop.GetBody().GetPosition().x = this.platformX.poleRight();
            this.poleRightBaseTop.GetBody().GetPosition().y = 0.12;
            this.poleRightBaseTop.GetBody().SetPosition(this.poleRightBaseTop.GetBody().GetPosition());
            HTML_DRAW.register(this.poleRightBaseTop.GetBody(), 0.8, 0.24, 'Claw_Base');
            this.poleRightBaseBottom.GetBody().GetPosition().x = this.platformX.poleRight();
            this.poleRightBaseBottom.GetBody().GetPosition().y = SIZE.WORLD_HEIGHT - 0.1;
            this.poleRightBaseBottom.GetBody().SetPosition(this.poleRightBaseBottom.GetBody().GetPosition());
            this.poleRightBaseBottom.GetBody().SetAngle(Math.PI);
            HTML_DRAW.register(this.poleRightBaseBottom.GetBody(), 0.8, 0.24, 'Claw_Base');

            var crate: model.ICrate = null;
            var crateBodyDef = new Box2D.Dynamics.b2BodyDef();
            crateBodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
            var platformBodyDef = new Box2D.Dynamics.b2BodyDef();
            platformBodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;

            var halfEdge = (SIZE.CRATE_EDGE / 2);

            for (var p = 0; p < numPlatforms; p++) {
                platformBodyDef.position.x = this.platformX.getX(p);
                platformBodyDef.position.y = SIZE.WORLD_HEIGHT - (SIZE.PLATFORM_HEIGHT / 2);
                fixture = this.world.CreateBody(platformBodyDef).CreateFixture(this.fixDefPlatform);
                this.platforms.push(fixture);

                HTML_DRAW.register(fixture.GetBody(), SIZE.PLATFORM_WIDTH, SIZE.PLATFORM_HEIGHT, 'Platform');

                // the x position is just that of the platform (centered).
                crateBodyDef.position.x = this.platformX.getX(p);
                for (var h = 0; h < conf.getMaxCrateHeight(); h++) {
                    crate = this.cargo.getCrate(p, h);
                    if (crate == model.NO_CRATE) continue;
                    // heights are precalculated:
                    crateBodyDef.position.y = this.crateY[h];
                    fixture = this.world.CreateBody(crateBodyDef).CreateFixture(this.fixDefCrate);
                    fixture.SetUserData(crate);
                    HTML_DRAW.register(fixture.GetBody(),
                        SIZE.CRATE_EDGE,
                        SIZE.CRATE_EDGE,
                        'Crate_' + UCFirst(crate.getColor()) + '_' + crate.getType());
                    this.crates.push(fixture);
                }
            }

            this.listener = new Box2D.Dynamics.b2ContactListener;
            this.listener.BeginContact = function (contact) {
                if (Math.floor(Math.random() * 2 + 1) == 2) {
                    try {
                        soundplayer.ground_crash.play();
                    } catch (ex) {
                        //TODO: find out why this sometimes crashes on win phone emulator
                    }
                } else {
                    try {
                        soundplayer.ground_crash.play();
                    } catch (ex) {
                        //TODO: find out why this sometimes crashes on win phone emulator
                    }
                }
            }
            this.world.SetContactListener(this.listener);

            this.world.DrawDebugData();
            this.world.ClearForces();
            HTML_DRAW.update();

        } // reset

        /** Callback for changes of the Cargo. The cargo already has the new state, while this animation still has the previous state. */
        private notify(cargo: model.ICargo, msg?: model.msg.CargoChanged) {
            if (!msg || !(msg instanceof model.msg.CargoChanged)) return;
            if (msg.getDirection() === 'reset') {
                this.reset();
                return;
            }

            if (!msg.isAllowed()) {
                // activity must be Animation.ACTIVITY_CRASH,
                // but before that it must go some direction...
                // "crashing" is used to know that the animation must crash later.
                this.crashing = true;
            }
            // we must be in STATE_NO_STATE and ACTIVITY_NO_ACTIVITY to allow notification:
            if (this.state !== Animation.STATE_NO_STATE ||
                this.activity !== Animation.ACTIVITY_NO_ACTIVITY ||
                this.movements.length > 0)
                throw 'Animation is notified, but state does not allow it! state := ' + this.state;

            this.grabHeight = 0;
            switch (msg.getDirection()) {
                case 'left':
                    if (msg.getCrate1() == model.NO_CRATE)
                        this.state = Animation.STATE_LEFT_WITHOUT_CRATE;
                    else
                        this.state = Animation.STATE_LEFT_WITH_CRATE;
                    this.activity = Animation.ACTIVITY_LEFT;
                    break;
                case 'right':
                    if (msg.getCrate1() == model.NO_CRATE)
                        this.state = Animation.STATE_RIGHT_WITHOUT_CRATE;
                    else
                        this.state = Animation.STATE_RIGHT_WITH_CRATE;
                    this.activity = Animation.ACTIVITY_RIGHT;
                    break;
                case 'grab':
                    // the height (-1 to 7) of the crate that was on the platform under the grappler.
                    // cargo is already the new state, while the animation is not there yet. 
                    // But topCrateHeight is corrected to represent the previous height.
                    var topCrateHeight = 0;
                    if (msg.isAllowed()) {
                        topCrateHeight = cargo.findTopCrateHeight(cargo.getGrapplerPosition());
                        // "simulate" the old cargo state:
                        if (msg.getCrate2() !== model.NO_CRATE) { // a crate was taken
                            topCrateHeight++; // plus one, because the crate in the grappler was on this platform.
                        } else
                            topCrateHeight--; // minus one, because the crate was only just put there.
                    } else { // Crash: The pile was already full with 6 crates. 7th is too much!
                        topCrateHeight = 5;
                    }

                    if (topCrateHeight == 6 && msg.getCrate1() == msg.getCrate2()) {
                        // Special case: crate is put down on top of a file of 6 other crates.
                        // That's why the crate1 and crate2 are the same.
                        // Thill will later cause the pile to crash!
                        this.state = Animation.STATE_GRAB_TO_PARK;
                        this.grabHeight = 6;
                    } else if (msg.getCrate2() === model.NO_CRATE) {
                        // Grappler is empty after this commando.
                        if (msg.getCrate1() === model.NO_CRATE)
                            this.state = Animation.STATE_GRAB_EMPTY;
                        else
                            this.state = Animation.STATE_GRAB_TO_PARK;
                        this.grabHeight = topCrateHeight + 1; // 0 to 7
                    } else {
                        // there is a crate in the crappler after this grab.
                        this.state = Animation.STATE_GRAB_TO_GET;
                        this.grabHeight = topCrateHeight; // 0 to 6
                    }
                    this.activity = Animation.ACTIVITY_DOWN;
                    break;
            } // switch

            var b: Box2D.Dynamics.b2Body;

            var timestamp = ctrl.getAnimationTime();

            // This is usually just SIZE.PLATFORM_DISTANCE, unless it will crash into a pole:
            var horizontalDistance = !this.crashing ?
                SIZE.PLATFORM_DISTANCE :
                (SIZE.PLATFORM_DISTANCE / (this.state == Animation.STATE_LEFT_WITH_CRATE ? 2.5 : 2.8));

            // we go over another switch, which should be better to read.
            // This prepares the first bodies to be moved (left/right/down). 
            switch (this.state) {
                case Animation.STATE_LEFT_WITH_CRATE:
                    if (!this.cargo.isOverloaded()) { //only if the create is not too high:
                        b = this.grabbedCrate.GetBody();
                        this.movements.push(
                            new BodyMove(
                                b,
                                b.GetPosition().x - horizontalDistance,
                                BodyMove.LEFT,
                                timestamp
                            )
                        );
                    }
                // fall through!
                case Animation.STATE_LEFT_WITHOUT_CRATE:
                    if (this.cargo.isOverloaded()) horizontalDistance /= 2;
                    [this.arm, this.base, this.middle, this.clawLeft, this.clawRight]
                        .forEach(
                        function (fix) {
                            this.movements.push(
                                new BodyMove(
                                    fix.GetBody(),
                                    fix.GetBody().GetPosition().x - horizontalDistance,
                                    BodyMove.LEFT,
                                    timestamp
                                )
                            );
                        }, this);
                    this.activity = Animation.ACTIVITY_LEFT;
                    break;
                case Animation.STATE_RIGHT_WITH_CRATE:
                    if (!this.cargo.isOverloaded()) { //only if the create is not too high:
                        b = this.grabbedCrate.GetBody();
                        this.movements.push(
                            new BodyMove(
                                b,
                                b.GetPosition().x + horizontalDistance,
                                BodyMove.RIGHT,
                                timestamp
                            )
                        );
                    }
                // fall through!
                case Animation.STATE_RIGHT_WITHOUT_CRATE:
                    if (this.cargo.isOverloaded()) horizontalDistance /= 2;
                    [this.arm, this.base, this.middle, this.clawLeft, this.clawRight]
                        .forEach(
                        function (fix) {
                            this.movements.push(
                                new BodyMove(
                                    fix.GetBody(),
                                    fix.GetBody().GetPosition().x + horizontalDistance,
                                    BodyMove.RIGHT,
                                    timestamp
                                )
                            );
                        }, this);
                    this.activity = Animation.ACTIVITY_RIGHT;
                    break;

                case Animation.STATE_GRAB_TO_GET:
                case Animation.STATE_GRAB_TO_PARK:
                case Animation.STATE_GRAB_EMPTY:
                    // this.grabHeight is the index of the crate to be grabbed.
                    // so the actual grab-distance is this:
                    var distance = this.crateY[Math.max(0, this.grabHeight)] - this.CRATE_GRABBED_Y;

                    var bodies = [this.arm, this.middle, this.clawLeft, this.clawRight];
                    if (this.grabbedCrate)
                        bodies.push(this.grabbedCrate);
                    bodies.forEach(
                        function (fix) {
                            this.movements.push(
                                new BodyMove(
                                    fix.GetBody(),
                                    fix.GetBody().GetPosition().y +
                                    distance,
                                    BodyMove.DOWN,
                                    timestamp
                                )
                            );
                        }, this);
                    this.activity = Animation.ACTIVITY_DOWN;
                    break;
                case Animation.STATE_NO_STATE:
                default:
                    this.activity = Animation.ACTIVITY_NO_ACTIVITY;
                    break;
            } // switch
        } // notify


        private movements: BodyMove[] = new Array();

        private lastTimeStamp = 0;
        private crashStart = 0;

        animate(timestamp: number): ctrl.IGameLoopCallback {
            try {
                if (this.lastTimeStamp <= 0)
                    this.lastTimeStamp = timestamp;

                // update all bodies and remove those that have finished.
                this.movements = this.movements.filter(
                    function (element) {
                        // BodyMove.move() returns true for finished. 
                        // So we use a not-operator (!) here:
                        return !element.move(timestamp);
                    }
                );

                this.world.DrawDebugData();
                this.world.ClearForces();
                HTML_DRAW.update();

                if (this.movements.length > 0)
                    return this.animate;
                // the above should be the same as arguments.callee
                // MDN: "You should avoid using arguments.callee() and just give every function (expression) a name."
                else {
                    // The state of the animation must be checked.
                    // maybe a new set of bodies must be moved.
                    // There is a uml-like diagram in the documentation that illustrates this.
                    switch (this.state) {
                        case Animation.STATE_LEFT_WITH_CRATE:
                        case Animation.STATE_LEFT_WITHOUT_CRATE:
                        case Animation.STATE_RIGHT_WITH_CRATE:
                        case Animation.STATE_RIGHT_WITHOUT_CRATE:
                            //finished after one move.
                            if (this.crashing) {
                                this.activity = Animation.ACTIVITY_CRASH;
                                try {
                                    soundplayer.wall_crash.play();
                                } catch (ex) {
                                    //TODO: find out why this sometimes crashes on win phone emulator
                                }
                            } else {
                                this.state = Animation.STATE_NO_STATE;
                                this.activity = Animation.ACTIVITY_NO_ACTIVITY;
                                return null;
                            }

                        case Animation.STATE_GRAB_EMPTY:
                        case Animation.STATE_GRAB_TO_GET:
                        case Animation.STATE_GRAB_TO_PARK:
                            // check old activity and set new activity:
                            if (this.activity === Animation.ACTIVITY_DOWN) { // check old activity
                                if (this.state === Animation.STATE_GRAB_TO_PARK) {
                                    this.activity = Animation.ACTIVITY_OPEN; // set new activity
                                    try {
                                        soundplayer.put_box.play();
                                    } catch (ex) {
                                        //TODO: find out why this sometimes crashes on win phone emulator
                                    }
                                } else { // GET or EMPTY
                                    this.activity = Animation.ACTIVITY_CLOSE; // set new activity
                                }
                            } else if (this.activity === Animation.ACTIVITY_UP) { // check old activity
                                if (this.crashing)
                                    this.activity = Animation.ACTIVITY_CRASH;
                                else
                                    this.activity = Animation.ACTIVITY_NO_ACTIVITY; // set new activity
                            } else if (this.activity === Animation.ACTIVITY_OPEN) { // check old activity
                                this.activity = Animation.ACTIVITY_UP; // set new activity
                            } else if (this.activity === Animation.ACTIVITY_CLOSE) { // check old activity
                                if (this.state === Animation.STATE_GRAB_TO_GET)
                                    this.activity = Animation.ACTIVITY_UP; // set new activity
                                else // STATE_GRAB_EMPTY
                                    this.activity = Animation.ACTIVITY_OPEN; // set new activity
                            }
                        default:
                    } // switch
                    var distance = 0;
                    var clawA = this.clawLeft.GetBody(); // clawA will move to the right
                    var clawB = this.clawRight.GetBody(); // clawB will move to the left

                    // Now the next activity is set => movements must be defined:
                    switch (this.activity) {
                        case Animation.ACTIVITY_OPEN:
                            clawA = clawB;
                            clawB = this.clawLeft.GetBody();
                            if (this.grabbedCrate) { // previously grabbed crate
                                // move it a bit (randomly):
                                var rnd = ((Math.random() - 0.499999) * 4 * SIZE.ONE_PIXEL); // [-2..+2]
                                this.movements.push(
                                    new BodyMove(
                                        this.grabbedCrate.GetBody(),
                                        this.grabbedCrate.GetBody().GetPosition().x + rnd,
                                        (rnd < 0) ? BodyMove.LEFT : BodyMove.RIGHT,
                                        timestamp
                                    )
                                );
                            }
                            this.grabbedCrate = null; // open => release the crate
                        // fall through!
                        case Animation.ACTIVITY_CLOSE:
                            distance = SIZE.CLAW_OPEN - SIZE.CLAW_CLOSED;
                            this.movements.push(
                                new BodyMove(
                                    clawA,
                                    clawA.GetPosition().x + distance,
                                    BodyMove.RIGHT,
                                    timestamp
                                )
                            );
                            this.movements.push(
                                new BodyMove(
                                    clawB,
                                    clawB.GetPosition().x - distance,
                                    BodyMove.LEFT,
                                    timestamp
                                )
                            );

                            // The claws are now closed or opened.
                            // => Find the fixture that represents the crate in the grappler:
                            if (!this.cargo.getGrapplerContent())
                                this.grabbedCrate = null;
                            else
                                this.crates.forEach(
                                    (c) => {
                                        if (c.GetUserData() == this.cargo.getGrapplerContent())
                                            this.grabbedCrate = c;
                                    });

                            // Put the crate to the exact x-position (it could have been randomly moved a bit).
                            if (this.grabbedCrate)
                                this.grabbedCrate.GetBody().GetPosition().x =
                                    this.platformX.getX(this.cargo.getGrapplerPosition())
                            break;

                        case Animation.ACTIVITY_UP:
                            // this.grabHeight is the index of the crate to be grabbed.
                            // so the actual grab-distance is this:
                            distance = this.crateY[Math.max(0, this.grabHeight)] - this.CRATE_GRABBED_Y;
                            var bodies = [this.arm, this.clawLeft, this.clawRight, this.middle];
                            if (this.grabbedCrate) {
                                try {
                                    soundplayer.grab_box.play();
                                } catch (ex) {
                                    //TODO: find out why this sometimes crashes on win phone emulator
                                }
                                bodies.push(this.grabbedCrate);
                                this.grabbedCrate.GetBody().GetPosition().y =
                                    this.CRATE_GRABBED_Y + distance;
                            }

                            bodies.forEach(
                                function (fix) {
                                    this.movements.push(
                                        new BodyMove(
                                            fix.GetBody(),
                                            fix.GetBody().GetPosition().y - distance,
                                            BodyMove.UP,
                                            timestamp
                                        )
                                    );
                                }, this);
                            break;
                        case Animation.ACTIVITY_CRASH:
                            if (this.crashStart <= 0) {
                                var impulse: Box2D.Common.Math.b2Vec2;
                                switch (this.state) {
                                    case Animation.STATE_LEFT_WITH_CRATE:
                                    case Animation.STATE_LEFT_WITHOUT_CRATE:
                                        impulse = new Box2D.Common.Math.b2Vec2(+2, 0)
                                        break;
                                    case Animation.STATE_RIGHT_WITH_CRATE:
                                    case Animation.STATE_RIGHT_WITHOUT_CRATE:
                                        impulse = new Box2D.Common.Math.b2Vec2(-2, 0)
                                        break;
                                    default:
                                        impulse = new Box2D.Common.Math.b2Vec2(0, -0.1);
                                }
                                if (this.cargo.isOverloaded())
                                    impulse = impulse.GetNegative();

                                this.state = Animation.STATE_NO_STATE;
                                this.crashStart = timestamp;
                                this.world.SetGravity(new Box2D.Common.Math.b2Vec2(0, 15));
                                this.middle.GetBody().GetPosition().y += SIZE.ARM_DIAMETER;
                                this.middle.GetBody().ApplyTorque(5 * Math.random());
                                this.middle.GetBody().SetPosition(this.middle.GetBody().GetPosition());
                                this.middle.GetBody().ApplyImpulse(impulse, this.middle.GetBody().GetPosition());
                                this.clawLeft.GetBody().GetPosition().x -= SIZE.ARM_DIAMETER;
                                this.clawLeft.GetBody().ApplyTorque(2);
                                this.clawLeft.GetBody().SetPosition(this.clawLeft.GetBody().GetPosition());
                                this.clawLeft.GetBody().ApplyImpulse(impulse, this.clawLeft.GetBody().GetPosition());
                                this.clawRight.GetBody().GetPosition().x += SIZE.ARM_DIAMETER;
                                this.clawRight.GetBody().ApplyTorque(-2);
                                this.clawRight.GetBody().SetPosition(this.clawRight.GetBody().GetPosition());
                                this.clawRight.GetBody().ApplyImpulse(impulse, this.clawRight.GetBody().GetPosition());

                                if (this.grabbedCrate) {
                                    impulse.Multiply(2);
                                    this.grabbedCrate.GetBody().ApplyImpulse(impulse, this.grabbedCrate.GetBody().GetPosition());
                                    this.grabbedCrate.GetBody().ApplyTorque(10 * Math.random());
                                }

                                // less "bouncing" at the beginning of animation:
                                this.crates.forEach((c) => {
                                    if (c != this.grabbedCrate)
                                        c.GetBody().SetAwake(false);
                                });
                            }

                            this.world.Step((timestamp - this.lastTimeStamp) / 1000, 10, 10);
                            this.world.ClearForces();

                            if (timestamp - this.crashStart > 60000) {
                                this.crashStart = 0;
                                this.activity = Animation.ACTIVITY_NO_ACTIVITY;
                                this.state = Animation.STATE_NO_STATE;
                                this.crashing = false;
                                return null;
                            }
                            return this.animate;
                        case Animation.ACTIVITY_NO_ACTIVITY:
                        default:
                            this.state = Animation.STATE_NO_STATE; // ready for new instruction.
                            return null;
                        // nothing to do. notification by the cargo will set a new state.
                    } // switch

                    return this.animate;
                } // else
            } finally {
                this.lastTimeStamp = timestamp;
            }
        } // animate

        // calculates the index of the platform located at the given x coordinate (in pixels)
        platformAtX(pixel_x: number): number {
            // 95 doesn't seem to match the definitions in the SIZE object, but emprically works
            var d = 95.0
            return Math.floor((pixel_x - d/2) / d);
        }
    }

    export var ANIMATION: Animation = null;
    var HTML_DRAW: HTMLDraw = null;

    export function init() {
        HTML_DRAW = new HTMLDraw();
        ANIMATION = new Animation(model.MODEL.getCargo());
    }
}
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="lib/typings/box2d/box2dweb.d.ts" />
var animation;
(function (animation) {
    /** This holds the horizontal positions (x-coordinates) of all platforms.
        The values are the center of the platforms. */
    var PlatformX = (function () {
        function PlatformX(amountOfPlatforms) {
            this._x = new Array();
            var spd = SIZE.PLATFORM_DISTANCE;
            this._poleLeft = (SIZE.WORLD_WIDTH / 2) // center of the world
                -
                    ((0.5 + (amountOfPlatforms / 2)) * spd); // offset
            for (var i = 0; i < amountOfPlatforms; i++) {
                this._x[i] = this._poleLeft + ((i + 1) * spd);
            }
            this._poleRight = this._x[amountOfPlatforms - 1] + spd;
        }
        /** x coordinate of a platform. */
        PlatformX.prototype.getX = function (nr) {
            if (nr == -1)
                return this._poleLeft;
            if (nr == this._x.length)
                return this._poleRight;
            return this._x[nr];
        };
        PlatformX.prototype.poleLeft = function () {
            return this._poleLeft;
        };
        PlatformX.prototype.poleRight = function () {
            return this._poleRight;
        };
        return PlatformX;
    }());
    /** Upper-case first charater: "blue" => "Blue" */
    function UCFirst(str) {
        if (!str || str.length == 0)
            return str;
        var rv = str.charAt(0).toUpperCase();
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
    var HTMLDrawData = (function () {
        function HTMLDrawData() {
        }
        return HTMLDrawData;
    }());
    /**
     * This draws the grafics using just html and css. No WebGL or Canvas-drawing needed.
     * Opera has some problems when the user is scrolling. In other browsers it looks fine.
     */
    var HTMLDraw = (function () {
        function HTMLDraw() {
            this.bodies = new Array();
            this.middleShadow = null;
            this.middleShadowShort = false; //indicates that the shadow must be shortened
            this.stage = document.getElementById('stage');
        }
        /**
         * register a body "b".
         * width and height are in meters!
         */
        HTMLDraw.prototype.register = function (b, width, height, image) {
            this.bodies.push(b);
            var div = document.createElement('div');
            var mobile = conf.isMobile(); //because mobile browsers usually can't render the shadows very well.
            div.className = 'htmldraw';
            div.style.background = 'url(./gfx/' + image + '.png)';
            var both = [div];
            var shadow = null;
            if (!mobile) {
                shadow = document.createElement('div');
                shadow.className = 'htmlshadow';
                shadow.style.background = 'url(./gfx/' +
                    (image.match(/^Crate.*/) ? 'Crate' : image) +
                    '_Shadow.png)';
                both.push(shadow);
            }
            both.forEach(function (v) {
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
        };
        HTMLDraw.prototype.clear = function () {
            this.bodies.forEach(function (b) {
                // This simply helps the garbage collector:
                b.SetUserData(null);
            });
            this.bodies = new Array();
        };
        HTMLDraw.prototype.update = function () {
            var _this = this;
            this.bodies.forEach(function (b) {
                var data = b.GetUserData();
                // Browser should know "rad", but "deg" just seems saver.
                var deg = Math.round(((b.GetAngle() + (2 * Math.PI)) % (2 * Math.PI)) * (180 / Math.PI) * 100) / 100;
                //data.div.style.transform = 'rotate(' + deg + 'deg)';
                //standard property would not work in chrome so we use this function:
                shims.transform(data.div, 'rotate(' + deg + 'deg)');
                var top = Math.floor((b.GetPosition().y - data.height / 2) / SIZE.ONE_PIXEL);
                var left = Math.floor((b.GetPosition().x - data.width / 2) / SIZE.ONE_PIXEL);
                data.div.style.top = top + 'px';
                data.div.style.left = left + 'px';
                if (data.shadow) {
                    // The stage is 768px wide.
                    left = Math.floor(left + (left - 384) / 15);
                    top = Math.floor(top * 1.04);
                    data.shadow.style.left = left + 'px';
                    data.shadow.style.top = top + 'px';
                    shims.transform(data.shadow, 'rotate(' + deg + 'deg) scale(1.04,1.04)');
                    //this is ugly, but it works for now.
                    if (data.shadow == _this.middleShadow) {
                        if (animation.ANIMATION['crashStart'] || animation.ANIMATION['activity'] === Animation.ACTIVITY_OPEN)
                            _this.middleShadowShort = false;
                        else if (animation.ANIMATION['activity'] === Animation.ACTIVITY_CLOSE)
                            _this.middleShadowShort = true;
                        if (_this.middleShadowShort) {
                            data.shadow.style.width = '40px';
                            data.shadow.style.left = (12 + left) + 'px';
                        }
                        else
                            data.shadow.style.width = '65px'; //instead of 62px        
                    }
                }
            });
        };
        return HTMLDraw;
    }());
    function fadeOut(elem, callback) {
        $(elem).animate({
            "opacity": "0"
        }, 500, function () {
            callback();
            $(elem).css('opacity', '1');
        });
    }
    animation.fadeOut = fadeOut;
    function animateMenu(elem) {
        $(elem).animate({
            "width": "0px",
            "height": "0px"
        }, 400, function () {
            elem.style.display = 'none';
        });
    }
    animation.animateMenu = animateMenu;
    function animateCredits(elem, callback) {
        $(elem).animate({
            "opacity": "0"
        }, 100, function () {
            animateCreditsElements();
            callback();
            $(elem).animate({
                "opacity": "1"
            }, 100);
        });
    }
    animation.animateCredits = animateCredits;
    function animateCreditsElements() {
        if ($('#credits_links').is(':visible')) {
            $('#credits_links').animate({
                opacity: '0.0'
            }, function () {
                $('#credits_links').hide();
                $('#original_credits').show();
                $('#original_credits').animate({
                    opacity: '1'
                });
            });
        }
        else {
            $('#original_credits').animate({
                opacity: '0.0'
            }, function () {
                $('#original_credits').hide();
                $('#credits_links').show();
                $('#credits_links').animate({
                    opacity: '1'
                });
            });
        }
        if ($('#credits').is(':visible')) {
            setTimeout(animateCreditsElements, 4000);
        }
    }
    function animateLevelPackRight(elem, callback) {
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
        }
        else {
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
    animation.animateLevelPackRight = animateLevelPackRight;
    function animateLevelPackLeft(elem, callback) {
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
        }
        else {
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
    animation.animateLevelPackLeft = animateLevelPackLeft;
    /**
      Used to move one body in one direction.
      This holds all information needed to move the body.
      Distances are in meters and time is in milliseconds. Therefore speed is in m/ms.
      The time passed to move() is the time since the start of this move.
     */
    var BodyMove = (function () {
        function BodyMove(
            /** Body to be moved. */
            body, 
            /** final position (meters). */
            end, 
            /** Direction, one of [UP, DOWN, LEFT, RIGHT]. */
            direction, 
            /** Timestamp T0 in ms. */
            t0) {
            this.body = body;
            this.end = end;
            this.direction = direction;
            this.t0 = t0;
            if (!body)
                throw 'BodyMove: body must not be null!';
            this.start = this.getPos();
            this.speed = Animation.getSpeed();
            if (this.direction == BodyMove.RIGHT || this.direction == BodyMove.DOWN) {
                if (end < this.start)
                    throw 'Body can\'t be moved right/down. End position is lower than current position.';
            }
            else {
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
        BodyMove.prototype.move = function (time) {
            var dt = time - this.t0; // delta-T
            if (dt < 1)
                return false; // drop it
            var pos = this.getPos();
            var finished = false;
            switch (this.direction) {
                case BodyMove.DOWN:
                    try {
                        soundplayer.move_crane.play();
                    }
                    catch (ex) {
                    }
                case BodyMove.RIGHT:
                    try {
                        soundplayer.move_crane.play();
                    }
                    catch (ex) {
                    }
                    pos = this.start + (this.speed * dt);
                    pos = Math.min(pos, this.end);
                    finished = pos >= this.end;
                    break;
                case BodyMove.LEFT:
                    try {
                        soundplayer.move_crane.play();
                    }
                    catch (ex) {
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
        };
        BodyMove.prototype.getPos = function () {
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
        };
        BodyMove.prototype.setPos = function (pos) {
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
        };
        BodyMove.UP = 1;
        BodyMove.DOWN = 2;
        BodyMove.LEFT = 3;
        BodyMove.RIGHT = 4;
        return BodyMove;
    }());
    /** Some constants about the dimensions of the elements. */
    var SIZE = {
        CRATE_EDGE: 1,
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
        CLAW_CLOSED: 26.5 / 38,
        /** Height of one claw. It is actually a polygon, this is just for estimation. */
        CLAW_HEIGHT: 54 / 38,
        /** Width of one claw. It is actually a polygon, this is just for estimation. */
        CLAW_WIDTH: 17 / 38,
        /** Width of the "middle" bar. */
        MIDDLE_WIDTH: 62 / 38
    };
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
    var Animation = (function () {
        function Animation(cargo) {
            this.cargo = cargo;
            /** Current state of the animation.  */
            this.state = Animation.STATE_NO_STATE;
            /** Activity is mostly relevant for such states that require multiple subanimations:
             * STATE_GRAB_TO_GET, STATE_GRAB_TO_PARK, STATE_GRAB_EMPTY
             * Note that a crash is always delayed by one activity!
             */
            this.activity = Animation.ACTIVITY_NO_ACTIVITY;
            this.crashing = false;
            /**
             * Height (0 to 7) of the crate.
             * STATE_GRAB_TO_GET: Height of crate before it is picked up.
             * STATE_GRAB_TO_PARK: Height of crate after it is put down.
             * STATE_GRAB_EMPTY: Always 0.
             */
            this.grabHeight = 0;
            this.platformX = null;
            /** Holds the Fixtures of all crates.
            Use GetBody() and GetUserData() to get the b2Body and the ICrate, resp. */
            this.crates = new Array();
            /** This defines the shape of one crate. */
            this.fixDefCrate = new Box2D.Dynamics.b2FixtureDef();
            /** Fixture of the crate that is currently grabbed. */
            this.grabbedCrate = null;
            /** platforms of this level. */
            this.platforms = new Array();
            /** This defines the shape of one platform. */
            this.fixDefPlatform = new Box2D.Dynamics.b2FixtureDef();
            this.movements = new Array();
            this.lastTimeStamp = 0;
            this.crashStart = 0;
            var ps = new Box2D.Collision.Shapes.b2PolygonShape;
            this.fixDefCrate.shape = ps;
            ps.SetAsBox(SIZE.CRATE_EDGE / 2, SIZE.CRATE_EDGE / 2);
            this.fixDefCrate.restitution = 0.0;
            this.fixDefCrate.density = 1;
            this.fixDefCrate.friction = 0.3;
            this.crateY = new Array();
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
            var vertices = new Array();
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
            this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 0) //gravity
            , true //allow sleep
            );
            this.world.SetWarmStarting(true);
            var bodyDef = new Box2D.Dynamics.b2BodyDef();
            var fixDef = new Box2D.Dynamics.b2FixtureDef();
            {
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
            {
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
            {
                bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
                var ps = new Box2D.Collision.Shapes.b2PolygonShape();
                fixDef.shape = ps;
                ps.SetAsBox(SIZE.MIDDLE_WIDTH / 2, SIZE.ARM_DIAMETER / 2);
                this.middle = this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }
            {
                bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
                var vertices = new Array();
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
            {
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
            {
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
        Animation.getSpeed = function () {
            if (conf.debug()) {
                if (model.MODEL.isFast())
                    return 1000; // superfast = 1000000 m/s = 3600000 kmh
                else
                    return 1 / 1000; // super slow = 1 m/s = 3.6 kmh
            }
            else {
                if (model.MODEL.isFast())
                    return 40 / 1000; // fast = 40 m/s = 144 kmh
                else
                    return 12 / 1000; // slow = 12 m/s = 43.2 kmh
            }
        };
        /** prepares the animation for the next run. */
        Animation.prototype.reset = function () {
            if (!this.cargo.getLevel())
                return;
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
            var fixture;
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
            var crate = null;
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
                    if (crate == model.NO_CRATE)
                        continue;
                    // heights are precalculated:
                    crateBodyDef.position.y = this.crateY[h];
                    fixture = this.world.CreateBody(crateBodyDef).CreateFixture(this.fixDefCrate);
                    fixture.SetUserData(crate);
                    HTML_DRAW.register(fixture.GetBody(), SIZE.CRATE_EDGE, SIZE.CRATE_EDGE, 'Crate_' + UCFirst(crate.getColor()) + '_' + crate.getType());
                    this.crates.push(fixture);
                }
            }
            this.listener = new Box2D.Dynamics.b2ContactListener;
            this.listener.BeginContact = function (contact) {
                if (Math.floor(Math.random() * 2 + 1) == 2) {
                    try {
                        soundplayer.ground_crash.play();
                    }
                    catch (ex) {
                    }
                }
                else {
                    try {
                        soundplayer.ground_crash.play();
                    }
                    catch (ex) {
                    }
                }
            };
            this.world.SetContactListener(this.listener);
            this.world.DrawDebugData();
            this.world.ClearForces();
            HTML_DRAW.update();
        }; // reset
        /** Callback for changes of the Cargo. The cargo already has the new state, while this animation still has the previous state. */
        Animation.prototype.notify = function (cargo, msg) {
            if (!msg || !(msg instanceof model.msg.CargoChanged))
                return;
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
                        if (msg.getCrate2() !== model.NO_CRATE) {
                            topCrateHeight++; // plus one, because the crate in the grappler was on this platform.
                        }
                        else
                            topCrateHeight--; // minus one, because the crate was only just put there.
                    }
                    else {
                        topCrateHeight = 5;
                    }
                    if (topCrateHeight == 6 && msg.getCrate1() == msg.getCrate2()) {
                        // Special case: crate is put down on top of a file of 6 other crates.
                        // That's why the crate1 and crate2 are the same.
                        // Thill will later cause the pile to crash!
                        this.state = Animation.STATE_GRAB_TO_PARK;
                        this.grabHeight = 6;
                    }
                    else if (msg.getCrate2() === model.NO_CRATE) {
                        // Grappler is empty after this commando.
                        if (msg.getCrate1() === model.NO_CRATE)
                            this.state = Animation.STATE_GRAB_EMPTY;
                        else
                            this.state = Animation.STATE_GRAB_TO_PARK;
                        this.grabHeight = topCrateHeight + 1; // 0 to 7
                    }
                    else {
                        // there is a crate in the crappler after this grab.
                        this.state = Animation.STATE_GRAB_TO_GET;
                        this.grabHeight = topCrateHeight; // 0 to 6
                    }
                    this.activity = Animation.ACTIVITY_DOWN;
                    break;
            } // switch
            var b;
            var timestamp = ctrl.getAnimationTime();
            // This is usually just SIZE.PLATFORM_DISTANCE, unless it will crash into a pole:
            var horizontalDistance = !this.crashing ?
                SIZE.PLATFORM_DISTANCE :
                (SIZE.PLATFORM_DISTANCE / (this.state == Animation.STATE_LEFT_WITH_CRATE ? 2.5 : 2.8));
            // we go over another switch, which should be better to read.
            // This prepares the first bodies to be moved (left/right/down). 
            switch (this.state) {
                case Animation.STATE_LEFT_WITH_CRATE:
                    if (!this.cargo.isOverloaded()) {
                        b = this.grabbedCrate.GetBody();
                        this.movements.push(new BodyMove(b, b.GetPosition().x - horizontalDistance, BodyMove.LEFT, timestamp));
                    }
                // fall through!
                case Animation.STATE_LEFT_WITHOUT_CRATE:
                    if (this.cargo.isOverloaded())
                        horizontalDistance /= 2;
                    [this.arm, this.base, this.middle, this.clawLeft, this.clawRight]
                        .forEach(function (fix) {
                        this.movements.push(new BodyMove(fix.GetBody(), fix.GetBody().GetPosition().x - horizontalDistance, BodyMove.LEFT, timestamp));
                    }, this);
                    this.activity = Animation.ACTIVITY_LEFT;
                    break;
                case Animation.STATE_RIGHT_WITH_CRATE:
                    if (!this.cargo.isOverloaded()) {
                        b = this.grabbedCrate.GetBody();
                        this.movements.push(new BodyMove(b, b.GetPosition().x + horizontalDistance, BodyMove.RIGHT, timestamp));
                    }
                // fall through!
                case Animation.STATE_RIGHT_WITHOUT_CRATE:
                    if (this.cargo.isOverloaded())
                        horizontalDistance /= 2;
                    [this.arm, this.base, this.middle, this.clawLeft, this.clawRight]
                        .forEach(function (fix) {
                        this.movements.push(new BodyMove(fix.GetBody(), fix.GetBody().GetPosition().x + horizontalDistance, BodyMove.RIGHT, timestamp));
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
                    bodies.forEach(function (fix) {
                        this.movements.push(new BodyMove(fix.GetBody(), fix.GetBody().GetPosition().y +
                            distance, BodyMove.DOWN, timestamp));
                    }, this);
                    this.activity = Animation.ACTIVITY_DOWN;
                    break;
                case Animation.STATE_NO_STATE:
                default:
                    this.activity = Animation.ACTIVITY_NO_ACTIVITY;
                    break;
            } // switch
        }; // notify
        Animation.prototype.animate = function (timestamp) {
            var _this = this;
            try {
                if (this.lastTimeStamp <= 0)
                    this.lastTimeStamp = timestamp;
                // update all bodies and remove those that have finished.
                this.movements = this.movements.filter(function (element) {
                    // BodyMove.move() returns true for finished. 
                    // So we use a not-operator (!) here:
                    return !element.move(timestamp);
                });
                this.world.DrawDebugData();
                this.world.ClearForces();
                HTML_DRAW.update();
                if (this.movements.length > 0)
                    return this.animate;
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
                                }
                                catch (ex) {
                                }
                            }
                            else {
                                this.state = Animation.STATE_NO_STATE;
                                this.activity = Animation.ACTIVITY_NO_ACTIVITY;
                                return null;
                            }
                        case Animation.STATE_GRAB_EMPTY:
                        case Animation.STATE_GRAB_TO_GET:
                        case Animation.STATE_GRAB_TO_PARK:
                            // check old activity and set new activity:
                            if (this.activity === Animation.ACTIVITY_DOWN) {
                                if (this.state === Animation.STATE_GRAB_TO_PARK) {
                                    this.activity = Animation.ACTIVITY_OPEN; // set new activity
                                    try {
                                        soundplayer.put_box.play();
                                    }
                                    catch (ex) {
                                    }
                                }
                                else {
                                    this.activity = Animation.ACTIVITY_CLOSE; // set new activity
                                }
                            }
                            else if (this.activity === Animation.ACTIVITY_UP) {
                                if (this.crashing)
                                    this.activity = Animation.ACTIVITY_CRASH;
                                else
                                    this.activity = Animation.ACTIVITY_NO_ACTIVITY; // set new activity
                            }
                            else if (this.activity === Animation.ACTIVITY_OPEN) {
                                this.activity = Animation.ACTIVITY_UP; // set new activity
                            }
                            else if (this.activity === Animation.ACTIVITY_CLOSE) {
                                if (this.state === Animation.STATE_GRAB_TO_GET)
                                    this.activity = Animation.ACTIVITY_UP; // set new activity
                                else
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
                            if (this.grabbedCrate) {
                                // move it a bit (randomly):
                                var rnd = ((Math.random() - 0.499999) * 4 * SIZE.ONE_PIXEL); // [-2..+2]
                                this.movements.push(new BodyMove(this.grabbedCrate.GetBody(), this.grabbedCrate.GetBody().GetPosition().x + rnd, (rnd < 0) ? BodyMove.LEFT : BodyMove.RIGHT, timestamp));
                            }
                            this.grabbedCrate = null; // open => release the crate
                        // fall through!
                        case Animation.ACTIVITY_CLOSE:
                            distance = SIZE.CLAW_OPEN - SIZE.CLAW_CLOSED;
                            this.movements.push(new BodyMove(clawA, clawA.GetPosition().x + distance, BodyMove.RIGHT, timestamp));
                            this.movements.push(new BodyMove(clawB, clawB.GetPosition().x - distance, BodyMove.LEFT, timestamp));
                            // The claws are now closed or opened.
                            // => Find the fixture that represents the crate in the grappler:
                            if (!this.cargo.getGrapplerContent())
                                this.grabbedCrate = null;
                            else
                                this.crates.forEach(function (c) {
                                    if (c.GetUserData() == _this.cargo.getGrapplerContent())
                                        _this.grabbedCrate = c;
                                });
                            // Put the crate to the exact x-position (it could have been randomly moved a bit).
                            if (this.grabbedCrate)
                                this.grabbedCrate.GetBody().GetPosition().x =
                                    this.platformX.getX(this.cargo.getGrapplerPosition());
                            break;
                        case Animation.ACTIVITY_UP:
                            // this.grabHeight is the index of the crate to be grabbed.
                            // so the actual grab-distance is this:
                            distance = this.crateY[Math.max(0, this.grabHeight)] - this.CRATE_GRABBED_Y;
                            var bodies = [this.arm, this.clawLeft, this.clawRight, this.middle];
                            if (this.grabbedCrate) {
                                try {
                                    soundplayer.grab_box.play();
                                }
                                catch (ex) {
                                }
                                bodies.push(this.grabbedCrate);
                                this.grabbedCrate.GetBody().GetPosition().y =
                                    this.CRATE_GRABBED_Y + distance;
                            }
                            bodies.forEach(function (fix) {
                                this.movements.push(new BodyMove(fix.GetBody(), fix.GetBody().GetPosition().y - distance, BodyMove.UP, timestamp));
                            }, this);
                            break;
                        case Animation.ACTIVITY_CRASH:
                            if (this.crashStart <= 0) {
                                var impulse;
                                switch (this.state) {
                                    case Animation.STATE_LEFT_WITH_CRATE:
                                    case Animation.STATE_LEFT_WITHOUT_CRATE:
                                        impulse = new Box2D.Common.Math.b2Vec2(+2, 0);
                                        break;
                                    case Animation.STATE_RIGHT_WITH_CRATE:
                                    case Animation.STATE_RIGHT_WITHOUT_CRATE:
                                        impulse = new Box2D.Common.Math.b2Vec2(-2, 0);
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
                                this.crates.forEach(function (c) {
                                    if (c != _this.grabbedCrate)
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
                    } // switch
                    return this.animate;
                } // else
            }
            finally {
                this.lastTimeStamp = timestamp;
            }
        }; // animate
        /** Waiting for the next state... */
        Animation.STATE_NO_STATE = 0;
        Animation.ACTIVITY_NO_ACTIVITY = 0;
        // States set by notify():
        /** Grappler is going left with a crate. */
        Animation.STATE_LEFT_WITH_CRATE = 1;
        /** Empty grappler is going left. */
        Animation.STATE_LEFT_WITHOUT_CRATE = 2;
        /** Grappler is going right with a crate. */
        Animation.STATE_RIGHT_WITH_CRATE = 3;
        /** Empty grappler is going right. */
        Animation.STATE_RIGHT_WITHOUT_CRATE = 4;
        /** Empty grappler is going down to grap a crate. */
        Animation.STATE_GRAB_TO_GET = 5;
        /** Grappler with crate is going down to put the crate down. */
        Animation.STATE_GRAB_TO_PARK = 6;
        /** Empty grappler is going down, platform is empty.  */
        Animation.STATE_GRAB_EMPTY = 7;
        // Activities are set during animation():
        /** Grappler is going left.  */
        Animation.ACTIVITY_LEFT = 1;
        /** Grappler is going right.  */
        Animation.ACTIVITY_RIGHT = 2;
        /** Grappler is going down.  */
        Animation.ACTIVITY_DOWN = 3;
        /** Grappler is going up. */
        Animation.ACTIVITY_UP = 4;
        /** Claw is closing. */
        Animation.ACTIVITY_CLOSE = 5;
        /** Claw is opening. */
        Animation.ACTIVITY_OPEN = 6;
        /** Claw and crates are crashing. */
        Animation.ACTIVITY_CRASH = 7;
        return Animation;
    }());
    animation.Animation = Animation;
    animation.ANIMATION = null;
    var HTML_DRAW = null;
    function init() {
        HTML_DRAW = new HTMLDraw();
        animation.ANIMATION = new Animation(model.MODEL.getCargo());
    }
    animation.init = init;
})(animation || (animation = {}));
var cmd;
(function (cmd) {
    var __items = {};
    /*abstract*/
    var Instruction = (function () {
        function Instruction(text, nr, isOp) {
            this.text = text;
            this.nr = nr;
            this.isOp = isOp;
            if (__items[text] !== undefined)
                console.log('ERROR: Instruction "' + text + '" exists.');
            __items[text] = this;
        }
        Instruction.prototype.toString = function () {
            return this.text;
        };
        Instruction.prototype.same = function (other) {
            return this.text == other.toString();
        };
        Instruction.prototype.isOperation = function () {
            return this.isOp;
        };
        Instruction.prototype.isCondition = function () {
            return !this.isOp;
        };
        Instruction.prototype.getProgramNr = function () {
            return this.nr;
        };
        return Instruction;
    }());
    var Operation = (function (_super) {
        __extends(Operation, _super);
        function Operation(text, nr) {
            _super.call(this, text, nr, true);
        }
        return Operation;
    }(Instruction));
    var Condition = (function (_super) {
        __extends(Condition, _super);
        function Condition(text) {
            _super.call(this, text, 0, false);
        }
        return Condition;
    }(Instruction));
    function getInstruction(text) {
        if (__items[text] === undefined)
            console.log('ERROR: Instruction "' + text + '" is not defined.');
        return __items[text];
    }
    cmd.getInstruction = getInstruction;
    function getInstructions() {
        var result = new Array();
        for (var x in __items)
            result.push(__items[x]);
        return result;
    }
    cmd.getInstructions = getInstructions;
    // Operations:
    // "aka" gives the name in the original game on iPad, iff it is different.
    /** No operation (empty register). */
    cmd.NOOP = new Operation("noop");
    /** bot goes right. */
    cmd.RIGHT = new Operation("right");
    /** bot goes down and up */
    cmd.GRAB = new Operation("grab"); // aka "pickup"
    /** bot goes left. */
    cmd.LEFT = new Operation("left");
    /** Exit program call. This is automatically inserted after each program.
      Since the user can not see the register it never has a condition other than NOCOND. */
    cmd.EXIT = new Operation("exit");
    /** call prog1. */
    cmd.PROG1 = new Operation("prog1", 1); // aka "f1"
    /** call prog2. */
    cmd.PROG2 = new Operation("prog2", 2); // aka "f2"
    /** call prog3. */
    cmd.PROG3 = new Operation("prog3", 3); // aka "f3"
    /** call prog4. */
    cmd.PROG4 = new Operation("prog4", 4); // aka "f4"
    // Conditions and Colors (color of crate):
    /** no condition. */
    cmd.NOCOND = new Condition("nocond");
    /** crate of color blue. */
    cmd.BLUE = new Condition("blue");
    /** crate of color red. */
    cmd.RED = new Condition("red");
    /** crate of color green. */
    cmd.GREEN = new Condition("green");
    /** crate of color yellow. */
    cmd.YELLOW = new Condition("yellow");
    /** no crate (a.k. "none"). */
    cmd.EMPTY = new Condition("empty"); // aka "none"
    /** crate of any color. */
    cmd.NONEMPTY = new Condition("nonempty"); // aka "multi"
    var _cmds = {}; //Pool of existing Commands
    function getCommand(operation, condition) {
        var o = operation.toString();
        var c = condition.toString();
        if (!(o in _cmds))
            _cmds[o] = {};
        if (!(c in _cmds[o]))
            _cmds[o][c] = new Command(operation, condition);
        return _cmds[o][c];
    }
    cmd.getCommand = getCommand;
    var Command = (function () {
        function Command(operation, condition) {
            this.operation = operation;
            this.condition = condition;
        }
        Command.prototype.getOperation = function () {
            return this.operation;
        };
        Command.prototype.getCondition = function () {
            return this.condition;
        };
        Command.prototype.equals = function (o) {
            return this.operation.same(o.getOperation()) &&
                this.condition.same(o.getCondition());
        };
        Command.prototype.toString = function () {
            return '[' + this.operation.toString() + '|' + this.condition.toString() + ']';
        };
        return Command;
    }());
    /** All IInstruction-Objects that can be put into the toolbox. */
    function getTools() {
        return [
            cmd.RIGHT, cmd.GRAB, cmd.LEFT,
            cmd.PROG1, cmd.PROG2, cmd.PROG3, cmd.PROG4,
            cmd.BLUE, cmd.RED, cmd.GREEN, cmd.YELLOW,
            cmd.EMPTY, cmd.NONEMPTY
        ].map(getTool);
    }
    cmd.getTools = getTools;
    var __tools = {};
    function getTool(instruction) {
        var id;
        if (typeof instruction == 'string' || instruction instanceof String) {
            id = instruction;
            instruction = getInstruction(id);
        }
        else {
            id = instruction.toString();
        }
        if (!__tools[id])
            __tools[id] = new Tool(getInstruction(id));
        return __tools[id];
    }
    cmd.getTool = getTool;
    var Tool = (function () {
        function Tool(instruction) {
            this.instruction = instruction;
            this.element = undefined;
        }
        Tool.prototype.toString = function () {
            return this.instruction.toString();
        };
        Tool.prototype.same = function (other) {
            return this.instruction.toString() === other.toString();
        };
        Tool.prototype.getHTMLElement = function () {
            if (this.element === undefined) {
                // css selector: #tool_xyz
                // css class as command: 'cmd-xyz' 
                var id = 'tool_' + this.instruction.toString();
                this.element = document.getElementById(id);
            }
            if (this.element === null)
                console.log('ERROR: Element not found with id ' + id);
            return this.element;
        };
        Tool.prototype.isOperation = function () {
            return this.instruction.isOperation();
        };
        Tool.prototype.isCondition = function () {
            return this.instruction.isCondition();
        };
        Tool.prototype.getProgramNr = function () {
            return this.instruction.getProgramNr();
        };
        return Tool;
    }());
})(cmd || (cmd = {}));
/** Height of top crate, which is where the grappler works. Crates that are dropped
    at this height will cause the grappler to crash.
    The value is 6. So crate 0 to crate 6 are possible, which are 7 crates.
    But crate 6 would cause a crash.
*/
var conf;
(function (conf) {
    function getMaxCrateHeight() { return 6; }
    conf.getMaxCrateHeight = getMaxCrateHeight;
    ;
    /** Maximum platforms that a level can use. */
    function getMaxPlatforms() { return 8; }
    conf.getMaxPlatforms = getMaxPlatforms;
    ;
    /** Is this a mobile (phone/tablet/handheld...)? */
    function isMobile() {
        var isMobile = false; //initiate as false
        // device detection
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge|maemo|midp|mmp|netfront|operam(ob|in)i|palm(os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows(ce|phone)|xda|xiino/i.test(navigator.userAgent)) {
            isMobile = true;
        }
        return isMobile;
    }
    conf.isMobile = isMobile;
    function debug() {
        try {
            return document.URL.match(/debug/i) !== null;
        }
        catch (e) {
            return false;
        }
    }
    conf.debug = debug;
})(conf || (conf = {}));
/** Controller (MVC)
  * Note: The animation (with physics simulation) is in animation.ts.
  */
var ctrl;
(function (ctrl) {
    ctrl.GAMEPLAY = null;
    ctrl.MAIN_MENU = null;
    ctrl.LEVEL_PACK = null;
    function init() {
        //This simply loads this module.
        //The Controllers will be created and they inject all handlers into their views.
        // this is deferred, so that the views are ready.
        ctrl.GAMEPLAY = new GameplayCtrl(model.MODEL, view.GAMEPLAY);
        ctrl.MAIN_MENU = new MainMenuCtrl(view.MAIN_MENU, model.MODEL);
        ctrl.LEVEL_PACK = new LevelPackCtrl(view.LEVEL_PACK, model.MODEL);
        view.CREDITS.setOnCloseHandler(function (e) { view.switchTo(view.MAIN_MENU); });
    }
    ctrl.init = init;
    var MainMenuCtrl = (function () {
        /** Constructs the controller. There is no model. */
        function MainMenuCtrl(_view, _model) {
            this._view = _view;
            _view.setClickHandler(function (e) {
                var target = e.target;
                if (e.target === undefined)
                    target = e.srcElement;
                while (target.id.indexOf("pack_") != 0)
                    target = target.parentElement;
                var nr = parseInt(target.attributes['data-nr'].value);
                var pack = level[target.attributes['data-pack'].value];
                _model.setLevelPack(pack); // This invoces the observer-function below.
                view.switchTo(view.LEVEL_PACK);
            });
            var setStars = function () {
                var allTotals = 0;
                for (var i = 0; i < 6; i++) {
                    var total = _model.getTotalRating(level.getLevelPack(i));
                    allTotals += total;
                    _view.setStar(i, total === 6 * 3);
                }
                _view.setRating(allTotals);
            };
            _model.subscribe(_view, function (us, msg) {
                if (!msg || !(msg instanceof model.msg.ModelChanged))
                    return;
                if (msg.isPack() || msg.isRating())
                    setStars();
            });
            setStars();
            _view.setLanguageHandler(function (lang) {
                if (lang === _model.getLanguage())
                    return;
                _model.setLanguage(lang);
                setTimeout(function () { window.document.location.reload(); }, 30);
            });
            _view.setCreditsHandler(function (ev) {
                view.switchTo(view.CREDITS);
                animation.animateCredits('#scaledViewport', function () { });
            });
        }
        return MainMenuCtrl;
    }());
    var LevelPackCtrl = (function () {
        /** Constructs the controller. There is no model. */
        function LevelPackCtrl(_view, _model) {
            this._view = _view;
            _view.setClickHandler(function (e) {
                var target = e.target;
                if (e.target === undefined)
                    target = e.srcElement;
                while (target.id.indexOf("level_") != 0)
                    target = target.parentElement;
                var nr = parseInt(target.attributes['data-nr'].value);
                var l = _model.getLevelPack().getLevel(nr);
                _model.setLevel(l);
                view.switchTo(view.GAMEPLAY);
            });
            _view.setBackToMain(function (e) {
                view.switchTo(view.MAIN_MENU);
            });
            _view.setGoLeft(function (e) {
                if (_model.getLevelPack().getPreviousLevelPack().getIdName() != "bonus") {
                    animation.animateLevelPackLeft('#sliding_elements', function () {
                        if (_model.getLevelPack().getPreviousLevelPack().getIdName() != "bonus") {
                            _model.setLevelPack(_model.getLevelPack().getPreviousLevelPack());
                        }
                    });
                }
            });
            _view.setGoRight(function (e) {
                if (_model.getLevelPack().getNextLevelPack().getIdName() != "bonus") {
                    animation.animateLevelPackRight('#sliding_elements', function () {
                        if (_model.getLevelPack().getNextLevelPack().getIdName() != "bonus") {
                            _model.setLevelPack(_model.getLevelPack().getNextLevelPack());
                        }
                    });
                }
            });
            // Connect model.IUserSelection to view.ILevelPack:
            _model.subscribe(_view, function (us, msg) {
                // "this" points to "_view", 
                if (!msg || !(msg instanceof model.msg.ModelChanged))
                    return;
                if (msg.isPack() || msg.isRating()) {
                    msg.isPack();
                    _view.setLevelPack(us.getLevelPack());
                    var total = 0;
                    for (var i = 0; i < 6; i++) {
                        console.log(us.getLevelPack().getIdName());
                        if (i > 2 && us.getLevelPack().getIdName() == 'bonus')
                            return;
                        var rating = _model.getRating(us.getLevelPack().getLevel(i));
                        total += rating;
                        _view.setStars(i, rating);
                    }
                    _view.setTotalStars(total);
                }
            });
        }
        return LevelPackCtrl;
    }());
    var State;
    (function (State) {
        State[State["STOPPED"] = 0] = "STOPPED";
        State[State["RUNNING"] = 1] = "RUNNING";
        State[State["STEPWISE"] = 2] = "STEPWISE";
        State[State["PAUSED"] = 3] = "PAUSED";
        State[State["WIN"] = 4] = "WIN";
    })(State || (State = {}));
    var GameplayCtrl = (function () {
        function GameplayCtrl(_model, _view) {
            var _this = this;
            this._model = _model;
            this._view = _view;
            //the state and lvlEvent are also accessed by the GameLoop.
            this.state = State.STOPPED;
            this.lvlEvent = null;
            this.custom_modal = document.getElementById('custom_modal');
            // inform the cargo, when the level is set:
            _model.subscribe(_model.getCargo(), function (us, msg) {
                if (!msg || !(msg instanceof model.msg.ModelChanged))
                    return;
                if (msg.isLevel())
                    this.setLevel(us.getLevel());
            });
            _view.setOnPlayClickHandler(function (e) {
                try {
                    // Toggle state:
                    switch (_this.state) {
                        case State.RUNNING:
                            _this.state = State.STOPPED;
                            _this.gameloop.reset();
                            _this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        case State.WIN:
                            _this.state = State.STOPPED;
                            _this.gameloop.reset();
                            _this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        case State.STOPPED:
                            _model.save(); // save the code.
                            _this.gameloop = new GameLoop(_this, _this._model, _this._view);
                        // fallthrough!
                        case State.STEPWISE:
                        case State.PAUSED:
                            _this.state = State.RUNNING;
                            setTimeout(function () {
                                _this.lvlEvent.fire(level.EventType.PLAY);
                                _this.gameloop.run();
                            }, 0);
                            break;
                        default: throw 'The current state of GamePlayCtrl is unknown...';
                    }
                }
                finally {
                    //TODO: fix crashes on windows phone
                    try {
                        soundplayer.play_stop.play();
                    }
                    catch (ex) {
                        console.log("Sound Error: " + ex.messsage);
                    }
                    _this.setPlayButtonState();
                }
            });
            var dndAllowed = function () {
                return _this.state === State.STOPPED;
            };
            _view.setDnDAllowedIndicator(dndAllowed);
            shims.dnd.setDnDAllowedIndicator(dndAllowed);
            _view.setOnFastClickHandler(function (e) {
                // Toggle the speed:
                _model.setFast(!_model.isFast());
                _view.setFastButtonState(_model.isFast());
                soundplayer.togglePlaySpeed(!_model.isFast());
            });
            _view.setFastButtonState(_model.isFast());
            _view.setOnClearClickHandler(function (e) {
                if (_this.state === State.RUNNING || _this.state === State.WIN)
                    return;
                _this.custom_modal.style.display = 'block';
                _view.centerModal();
                addEvent(window, "resize", function () { _view.centerModal(); });
            });
            _view.setOnModalCancelClickHandler(function (e) {
                _this.custom_modal.style.display = 'none';
            });
            _view.setOnModalClearClickHandler(function (e) {
                _model.getCode().reset();
                _view.getRegisters().forEach(function (el) {
                    var cond = el.firstElementChild;
                    cond.className = 'cmd-nocond';
                    var op = el.lastElementChild;
                    op.className = 'cmd-noop';
                });
                _this.custom_modal.style.display = 'none';
                if (_this.state !== State.STOPPED) {
                    _this.state = State.STOPPED;
                    if (_this.gameloop)
                        _this.gameloop.reset();
                    _this.lvlEvent.fireLater(level.EventType.STOP);
                    _this.setPlayButtonState();
                }
                _this.lvlEvent.fireLater(level.EventType.CLEAR);
            });
            _view.setOnForceStopHandler(function (e) {
                try {
                    switch (_this.state) {
                        case State.RUNNING:
                            _this.state = State.STOPPED;
                            _this.gameloop.reset();
                            _this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        case State.STOPPED:
                            _model.save(); // save the code.
                            _this.gameloop = new GameLoop(_this, _this._model, _this._view);
                            break;
                        case State.PAUSED:
                            _this.state = State.STOPPED;
                            _this.gameloop.reset();
                            _this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        case State.WIN:
                            _this.state = State.STOPPED;
                            _this.gameloop.reset();
                            _this.lvlEvent.fireLater(level.EventType.STOP);
                            break;
                        default: throw 'The current state of GamePlayCtrl is unknown...';
                    }
                }
                finally {
                    _this.setPlayButtonState();
                }
            });
            _view.setOnStepClickHandler(function (e) {
                try {
                    switch (_this.state) {
                        case State.RUNNING:
                            // PAUSED would actually pause the animation, but it should
                            // still finish the current step. So the "state" is set to STEPWISE:
                            _this.state = State.STEPWISE;
                            return;
                        case State.STOPPED:
                            _this.gameloop = new GameLoop(_this, _this._model, _this._view);
                        //fallthrough
                        case State.PAUSED:
                            _this.gameloop.step();
                            _this.lvlEvent.fireLater(level.EventType.STEP);
                            return;
                        case State.STEPWISE:
                        case State.WIN:
                        default:
                    }
                }
                finally {
                    _this.setPlayButtonState();
                }
            });
            _view.setOnMenuClickHandler(function (e) {
                _this.state = State.STOPPED;
                _this.lvlEvent.fireLater(level.EventType.STOP);
                _view.hideHints();
                _view.setYouGotItState(false);
                if (_this.gameloop)
                    _this.gameloop.reset();
                _this.setPlayButtonState();
                _model.save();
                view.switchTo(view.LEVEL_PACK);
                soundplayer.sound_play_state = GameSoundState.MENU;
                soundplayer.updateSound();
            });
            _view.setOnHintsClickHandler(function (e) {
                _view.showHint('btn_hints', _model.getLevel().getHints());
            });
            _view.setOnReplayClickHandler(function (e) {
                _view.setYouGotItState(false);
                _this.state = State.STOPPED;
                _this.setPlayButtonState();
                if (_this.gameloop)
                    _this.gameloop.reset();
                _this.lvlEvent.fireLater(level.EventType.STOP);
                _this.lvlEvent.fireLater(level.EventType.LOAD);
            });
            _view.setOnNextClickHandler(function (e) {
                var lvl = _model.getLevel();
                var next = lvl.getNextLevel();
                _model.setLevelPack(next.getLevelPack());
                _model.setLevel(next);
                _this.state = State.STOPPED;
                _this.setPlayButtonState();
                _view.loadLevel(next);
            });
            // Connect model.IUserSelection to view.IGameplayView:
            _model.subscribe(this, function (us, msg) {
                if (msg && (msg instanceof model.msg.ModelChanged) && msg.isLevel()) {
                    _view.loadLevel(us.getLevel());
                    // This is the only place where lvlEvent gets replaced.
                    // in any other case it only gets "fired" with a new EventType.
                    this.lvlEvent = new level.Event(_view, _model);
                    this.lvlEvent.fireLater(level.EventType.LOAD);
                }
            });
            _view.setOnDragHandler(function () {
                _this.lvlEvent.fireLater(level.EventType.DRAG);
                try {
                    soundplayer.grab_toolbox_element.play();
                }
                catch (ex) {
                    console.log("Sound Error: " + ex.messsage);
                }
            });
            _view.setOnDropHandler(function (tool, srcProg, srcReg, destProg, destReg) {
                var showSmoke = false;
                var code = _model.getCode();
                if (!srcProg && destProg > 0) {
                    code.setInstruction(destProg, destReg, tool);
                    try {
                        soundplayer.put_toolbox_element.play();
                    }
                    catch (ex) {
                        console.log("Sound Error: " + ex.messsage);
                    }
                }
                else if (!destProg && srcProg > 0) {
                    // tool should be NOOP or NOCOND.
                    showSmoke = !code.getCommand(srcProg, srcReg).equals(cmd.getCommand(cmd.NOOP, cmd.NOCOND));
                    code.setInstruction(srcProg, srcReg, tool);
                }
                else if (destProg == srcProg && srcProg > 0 && destProg > 0) {
                    var instruction = null;
                    try {
                        soundplayer.put_toolbox_element.play();
                    }
                    catch (ex) {
                        console.log("Sound Error: " + ex.messsage);
                    }
                    try {
                        if (tool.isOperation()) {
                            instruction = code.getOperation(srcProg, srcReg);
                            code.setInstruction(srcProg, srcReg, cmd.NOOP);
                        }
                        else {
                            instruction = code.getCondition(srcProg, srcReg);
                            code.setInstruction(srcProg, srcReg, cmd.NOCOND);
                        }
                    }
                    finally {
                        code.setInstruction(destProg, destReg, instruction);
                        var el = _this._view.getRegister(srcProg, srcReg);
                        var cond = el.firstElementChild;
                        cond.className = 'cmd-' + code.getCondition(srcProg, srcReg).toString();
                        var op = el.lastElementChild;
                        op.className = 'cmd-' + code.getOperation(srcProg, srcReg).toString();
                    }
                }
                else if (destProg > 0 && srcProg > 0) {
                    // The actual instruction must be read from the code.
                    var instruction = null;
                    try {
                        soundplayer.put_toolbox_element.play();
                    }
                    catch (ex) {
                        console.log("Sound Error: " + ex.messsage);
                    }
                    // In this context "NOOP" actually stands for "any operation"
                    // The same is true for "NOCOND" => "any condition"
                    // It's just used to distinguish operation vs condition.
                    if (tool.isOperation()) {
                        instruction = code.getOperation(srcProg, srcReg);
                        code.setInstruction(srcProg, srcReg, cmd.NOOP);
                    }
                    else {
                        instruction = code.getCondition(srcProg, srcReg);
                        code.setInstruction(srcProg, srcReg, cmd.NOCOND);
                    }
                    code.setInstruction(destProg, destReg, instruction);
                }
                else {
                    showSmoke = true;
                } // else 4: Register/Toolbox --> Nirvana
                _this.lvlEvent.fireLater(level.EventType.DROP);
                return showSmoke;
            }); //setOnDropHandler
            _model.getCode().subscribe(this, function (code, msg) {
                var oldCmd = msg.getOldCommand();
                var newCmd = msg.getNewCommand();
                var prog = msg.getProgram();
                var reg = msg.getRegister();
                // console.log('prog: ' + prog + ' / reg: ' + reg);
                var el = _this._view.getRegister(prog, reg);
                var cond = el.firstElementChild;
                cond.className = 'cmd-' + newCmd.getCondition().toString();
                var op = el.lastElementChild;
                op.className = 'cmd-' + newCmd.getOperation().toString();
                // Rotate slightly:
                if (oldCmd.getOperation() != newCmd.getOperation())
                    setTimeout(function () {
                        var skew = Math.floor(Math.random() * 20) - 10;
                        shims.transform(op, 'rotate(' + skew + 'deg)');
                    }, 0);
            });
            _view.setOnHideHintHandler(function () {
                _view.hideHints();
            });
        } //c'tor
        GameplayCtrl.prototype.setPlayButtonState = function () {
            this._view.setPlayButtonState(this.state != State.RUNNING);
        };
        return GameplayCtrl;
    }());
    /**
    * The Game Loop controls the animation.
    * it loops as long as the animations needs to draw new frames
    * and the stack machine has instructions to process.
    */
    var GameLoop = (function () {
        function GameLoop(_ctrl, _model, _view) {
            var _this = this;
            this._ctrl = _ctrl;
            this._model = _model;
            this._view = _view;
            this._sm = null;
            this.currentStep = null;
            this.callback = null;
            this.crashed = 0;
            /** The div-element of the register that is currently processed. */
            this.register = null;
            /** amount of milliseconds that should be skipped. */
            this.skip = 0;
            // the function animationFrameLoop() is defined in the constructor!
            this.animationFrameLoop = null;
            // requestAnimationFrame() doesn't allow to pass a thisArg, so we need to construct the function:  
            this.animationFrameLoop = function (time) {
                frameCount++;
                if (frameCount < 2) {
                    window.requestAnimationFrame(_this.animationFrameLoop);
                    return;
                }
                frameCount = 0;
                animationTime = time;
                if (_this.currentStep && _this.currentStep.isFinished() || _this.crashed >= 2) {
                    if (_model.getCargo().isGoal()) {
                        _ctrl.lvlEvent.fireLater(level.EventType.WIN);
                        // this rating goes from 1 to 4. 4 is for "unknown" solutions.
                        // the models accepts only from 0 to 3. So 4 is the same as 3.
                        var rating = _model.getLevel().getRating().rate(_model.getCode());
                        _view.setYouGotItState(true, rating);
                        _model.setRating(_model.getLevel(), Math.min(3, rating));
                        _ctrl.state = State.WIN;
                        soundplayer.level_success.play();
                    }
                    else if (_this.crashed > 0) {
                        _ctrl.lvlEvent.fireLater(level.EventType.CRASH);
                    }
                    else {
                        _ctrl.lvlEvent.fire(level.EventType.END);
                    }
                    _ctrl.setPlayButtonState();
                    _this.removeCurrentRegister();
                    return; // break the loop when sm is finished
                }
                switch (_ctrl.state) {
                    case State.STOPPED:
                    case State.WIN:
                    case State.PAUSED:
                        return;
                    default: //continue...
                }
                // loop the animation:
                window.requestAnimationFrame(_this.animationFrameLoop);
                var current_register = 'current_register';
                // all logic needed for drawing is in animate():
                if (!_this.callback) {
                    if (_this.register)
                        _this.register.classList.remove(current_register);
                    try {
                        _this.currentStep = _this._sm.step();
                    }
                    catch (e) {
                        _ctrl.state = State.STOPPED;
                    }
                    // highlight the current register:
                    //TODO register is undefined when fast clicking stop/play button
                    _this.register = _this._view.getRegister(_this.currentStep.getProgram(), _this.currentStep.getRegister());
                    if (_this.register)
                        _this.register.classList.add(current_register);
                    // Calling a "Prog" would not be visible if it is not delayed a bit:
                    if (_this.currentStep.getCommand().getOperation().getProgramNr() > 0) {
                        _this.skip = time + (_this._model.isFast() ? 10 : 20);
                        _this.callback = function (time) { if (time < _this.skip)
                            return _this.callback; };
                    }
                    else {
                        if (_this.currentStep.isFinished()) {
                            if (!_this.callback && _ctrl.state === State.STEPWISE)
                                _ctrl.state = State.RUNNING; // indicates that the game must be stopped.
                            return;
                        }
                        else if (_this._model.getCargo().isCrashed())
                            _this.crashed++;
                        _this.callback = animation.ANIMATION.animate;
                    }
                }
                _this.callback = _this.callback.call(animation.ANIMATION, time);
                // when one full step is finished but the user only played one step:
                if (!_this.callback && _ctrl.state === State.STEPWISE)
                    _ctrl.state = State.PAUSED; // paused until the user play the next step.
            }; // = animationFrameLoop
            this.reset();
        }
        GameLoop.prototype.run = function () {
            window.requestAnimationFrame(this.animationFrameLoop);
        };
        GameLoop.prototype.step = function () {
            this._ctrl.state = State.STEPWISE;
            window.requestAnimationFrame(this.animationFrameLoop);
        };
        GameLoop.prototype.reset = function () {
            this._sm = sm.createStackMachine(this._model.getCode(), this._model.getCargo());
            this._sm.reset();
            this._model.getCargo().reset();
            this.removeCurrentRegister();
        };
        /** No register will be highlighted.
            Removes the class "current_register" from all registers. */
        GameLoop.prototype.removeCurrentRegister = function () {
            var nodeList = this._view.get('controls').querySelectorAll('*.current_register');
            for (var i = 0; i < nodeList.length; i++)
                nodeList.item(i).classList.remove('current_register');
        };
        return GameLoop;
    }());
    var animationTime = -1;
    function getAnimationTime() { return animationTime; }
    ctrl.getAnimationTime = getAnimationTime;
})(ctrl || (ctrl = {}));
/// <reference path="lib/jquery.d.ts" />
/// <reference path="lib/typings/winjs.d.ts" />
var dataSource;
(function (dataSource) {
    dataSource[dataSource["CLOUD"] = 0] = "CLOUD";
    dataSource[dataSource["CLOUD_LOCAL"] = 1] = "CLOUD_LOCAL";
    dataSource[dataSource["LOCALSTORAGE"] = 2] = "LOCALSTORAGE";
})(dataSource || (dataSource = {}));
var dataSaver;
(function (dataSaver) {
    var savingKeys = {
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
    dataSaver.counter = 0;
    function init() {
        dataSaver.keysArray = new Array();
        $.each(savingKeys, function (key, val) {
            $.each(val, function (key, val) {
                dataSaver.keysArray.push(val);
            });
        });
    }
    function keyExists(key) {
        if (!dataSaver.keysArray)
            init();
        for (var i = 0; i < dataSaver.keysArray.length; i++) {
            if (dataSaver.keysArray[i] === key)
                return true;
        }
        return false;
    }
    function loadWithoutWindows() {
        if (!dataSaver.keysArray)
            init();
        for (var i = 0; i < dataSaver.keysArray.length; i++) {
            dataSaver.counter++;
        }
    }
    dataSaver.loadWithoutWindows = loadWithoutWindows;
    function loadIntoLocalStorage() {
        if (!dataSaver.keysArray)
            init();
        for (var i = 0; i < dataSaver.keysArray.length; i++) {
            readItem(i);
        }
    }
    dataSaver.loadIntoLocalStorage = loadIntoLocalStorage;
    function readItem(i) {
        WinJS.Application.roaming.readText(dataSaver.keysArray[i] + "").then(function (data) {
            window.localStorage.setItem(dataSaver.keysArray[i] + "", data);
            dataSaver.counter++;
        }, function (err) {
            console.error(err);
            window.localStorage.setItem(dataSaver.keysArray[i].toString(), "");
        });
    }
    function saveData(key, data) {
        if (!keyExists(key))
            throw new Error("This key wasn't found in the list: " + key);
        window.localStorage.setItem(key, data);
        WinJS.Application.roaming.writeText(key, data).then(function (data) {
            // console.info('saved data');
        });
    }
    dataSaver.saveData = saveData;
    function getData(key) {
        if (!keyExists(key))
            throw new Error("This key wasn't found in the list: " + key);
        if (window.localStorage.getItem(key) == null || window.localStorage.getItem(key) == undefined || window.localStorage.getItem(key) == 'undefined')
            return "{}";
        return window.localStorage.getItem(key);
    }
    dataSaver.getData = getData;
})(dataSaver || (dataSaver = {}));
/*
This unit contains the levels. Scroll down to "DEFINITIONS" to get there quickly.
*/
var level;
(function (level) {
    function getLevel(packNr, lvlNr) {
        return _packs[packNr].getLevel(lvlNr);
    }
    level.getLevel = getLevel;
    function getLevelPack(packNr) {
        return _packs[packNr];
    }
    level.getLevelPack = getLevelPack;
    function getLevelPacks() {
        return _packs.slice(0);
    }
    level.getLevelPacks = getLevelPacks;
    var Rating = (function () {
        function Rating(r) {
            this.r = r;
            //r[0] = Maximum of registers allowed to get a 2 star rating.
            //r[1] = Maximum of registers allowed to get a 3 star rating.
            //r[2] = Best known solution.
            if ((r.length != 3) || (r[0] < r[1]) || (r[1] < r[2]))
                throw "bad rating for level "; //...
        }
        Rating.prototype.rate = function (code) {
            var operations = code.getNumberOfOperations();
            if (operations < this.r[2])
                return 4;
            if (operations <= this.r[1])
                return 3;
            if (operations <= this.r[0])
                return 2;
            return 1;
        };
        return Rating;
    }());
    /** Type of event. */
    (function (EventType) {
        /** Load of level. */
        EventType[EventType["LOAD"] = 0] = "LOAD";
        /** User clicked on "Play". */
        EventType[EventType["PLAY"] = 1] = "PLAY";
        /** User stopped the animation. */
        EventType[EventType["STOP"] = 2] = "STOP";
        /** Animation finished: User has found a valid solution. */
        EventType[EventType["WIN"] = 3] = "WIN";
        /** Animation finished: Code caused a crash. */
        EventType[EventType["CRASH"] = 4] = "CRASH";
        /** Animation finished: Goal not reached, no more instructions. */
        EventType[EventType["END"] = 5] = "END";
        /** Start of drag event. */
        EventType[EventType["DRAG"] = 6] = "DRAG";
        /** Element dropped. */
        EventType[EventType["DROP"] = 7] = "DROP";
        /** Single step of animation. */
        EventType[EventType["STEP"] = 8] = "STEP";
        /** All commands have been cleared. */
        EventType[EventType["CLEAR"] = 9] = "CLEAR";
        /** User hides a hint by clicking on it. */
        EventType[EventType["HIDE"] = 10] = "HIDE";
    })(level.EventType || (level.EventType = {}));
    var EventType = level.EventType;
    /** An event object that is used whenever the user loads a level.
    The controller will pass the same object, so it can be used to store any information in it. */
    var Event = (function () {
        function Event(_view, _model) {
            this._view = _view;
            this._model = _model;
            this.type = EventType.LOAD;
            this.sm = null;
            this.lvl = _model.getLevel();
        }
        /** This informs the level about the event by passing the event-object. */
        Event.prototype.fire = function (newType) {
            this.type = newType;
            this.lvl.fireEvent(this);
        };
        /** Adds the invocation of this.fire(newType) to the queue. */
        Event.prototype.fireLater = function (newType) {
            var _this = this;
            setTimeout(function () {
                _this.fire(newType);
            }, 33);
        };
        return Event;
    }());
    level.Event = Event;
    /** This class defines one level. */
    var Level = (function () {
        function Level(
            // "aka" tells you the name in the original game on iPad, iff it differs.
            // The ordering of these parameters is similar to the original code.
            title, //aka "name"
            lvlPack, startPlatform, //starts at 0! aka "claw"
            rating, //[3,2,1], aka "stars"
            //funcs = {8,8,8,5}, - we always use this!
            tools, // aka "toolbox"
            stage, // initial formation
            goal, tutHints) {
            this.title = title;
            this.lvlPack = lvlPack;
            this.startPlatform = startPlatform;
            this.tools = tools;
            this.stage = stage;
            this.goal = goal;
            this.tutHints = tutHints;
            // Unchecked casting and leak of this-reference in c'tor: 
            // Not best practice, but I like to live dangerously...
            if ('From Beneath2' !== title)
                lvlPack.addLevel(this);
            // Note that the game is still loading. The language is not set and there is no model.
            if (stage.length != goal.length)
                throw 'Initial formation and Goal are not of equal length. Amount of platforms is unclear.';
            if (startPlatform > stage.length)
                throw 'start platform is out of bounds.';
            this.rating = new Rating(rating);
            var check = function (v) {
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
            stage.forEach(function (a) {
                a.forEach(check);
            });
            goal.forEach(function (a) {
                a.forEach(check);
            });
            if (tools) {
                tools.forEach(function (t) {
                    if (!cmd.getTool(t))
                        throw 'Level: Unkown Tool ' + t;
                });
            }
            if (!tutHints)
                this.tutHints = function (e) { };
        }
        Level.prototype.getTitle = function () {
            return this.title;
        };
        Level.prototype.getLevelPack = function () {
            return this.lvlPack;
        };
        Level.prototype.getPlatforms = function () {
            return this.stage.length;
        };
        Level.prototype.getStartPlatform = function () {
            return this.startPlatform;
        };
        Level.prototype.getInitialFormation = function () {
            var result = new Array();
            for (var i = 0; i < this.stage.length; i++) {
                var a = new Array();
                result.push(a);
                for (var j = 0; j < conf.getMaxCrateHeight(); j++) {
                    if (this.stage[i][j])
                        a.push(this.stage[i][j]);
                    else
                        a.push('');
                }
            }
            return result;
        };
        /**
         * Array of create colors that define the goal of a level.
         * The goal array contains piles that only go from 0 to 5. */
        Level.prototype.getGoal = function () {
            var result = new Array();
            for (var i = 0; i < this.goal.length; i++) {
                var a = new Array();
                result.push(a);
                for (var j = 0; j < conf.getMaxCrateHeight(); j++) {
                    if (this.goal[i][j])
                        a.push(this.goal[i][j]);
                    else
                        a.push('');
                }
            }
            return result;
        };
        Level.prototype.getTools = function () {
            if (!this.tools) {
                return cmd.getTools();
            }
            else {
                var result = new Array();
                this.tools.forEach(function (t) {
                    result.push(cmd.getTool(t));
                });
                return result;
            }
        };
        Level.prototype.getRating = function () {
            return this.rating;
        };
        Level.prototype.getHints = function () {
            return translate.levels.getBundle(this.title).getText('hints');
        };
        Level.prototype.fireEvent = function (event) {
            this.tutHints.call(this, event);
        };
        /** The next level. Or the first if all have been won. */
        Level.prototype.getNextLevel = function () {
            var list = this.lvlPack.getLevels();
            if (this === list[list.length - 1])
                return this.lvlPack.getNextLevelPack().getLevel(0); // first of next
            var index = list.indexOf(this);
            return list[index + 1];
        };
        return Level;
    }());
    var _packs = new Array();
    var LevelPack = (function () {
        function LevelPack(idName) {
            this.idName = idName;
            this._levels = new Array();
            _packs.push(this);
        }
        LevelPack.prototype.getIdName = function () {
            return this.idName;
        };
        LevelPack.prototype.getLevel = function (nr) {
            return this._levels[nr];
        };
        LevelPack.prototype.getLevels = function () {
            return this._levels.slice(0);
        };
        LevelPack.prototype.addLevel = function (lvl) {
            this._levels.push(lvl);
        };
        LevelPack.prototype.getNextLevelPack = function () {
            var nextIndex = _packs.indexOf(this) + 1;
            if (nextIndex === _packs.length)
                return _packs[0];
            return _packs[nextIndex];
        };
        LevelPack.prototype.getPreviousLevelPack = function () {
            var prevIndex = _packs.indexOf(this) - 1;
            if (prevIndex === -1)
                return _packs[_packs.length - 1];
            return _packs[prevIndex];
        };
        return LevelPack;
    }());
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
    level.TUTORIALS = new LevelPack('tutorials');
    level.EASY = new LevelPack('easy');
    level.MEDIUM = new LevelPack('medium');
    level.HARD = new LevelPack('hard');
    level.CRAZY = new LevelPack('crazy');
    level.IMPOSSIBLE = new LevelPack('impossible');
    level.BONUS = new LevelPack('bonus');
    var draggingElement = function () {
        var elemClassList = document.getElementById('dragImage').className.split(/\s+/);
        for (var i = 0; i < elemClassList.length; i++) {
            if (i == 1) {
                var elem = elemClassList[i].replace('cmd-', '');
            }
        }
        if (elem != undefined) {
            return elem;
        }
        else {
            return '';
        }
    };
    /**** DEFINITIONS ****/
    level.CARGO_101 = new Level('Cargo 101', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        //"is()" tells you whether there is an operation at program 1, register #.
        var is = function (prog, r, i) {
            return e._model.getCode().getOperation(prog, r).same(i);
        };
        var noop = function (r, prog) {
            if (prog == undefined || prog < 0) {
                return is(1, r, cmd.NOOP);
            }
            else {
                return is(prog, r, cmd.NOOP);
            }
        };
        var grab = function (r) {
            return is(1, r, cmd.GRAB);
        };
        var right = function (r) {
            return is(1, r, cmd.RIGHT);
        };
        var noothers = function () {
            for (var i = 1; i < 5; i++) {
                for (var j = 0; j < 8; j++) {
                    try {
                        if (i == 1 && j > 2) {
                            if (i != 4) {
                                if (!noop(j, i)) {
                                    return false;
                                }
                            }
                            else {
                                if (j < 5) {
                                    if (!noop(j, i)) {
                                        return false;
                                    }
                                }
                            }
                        }
                        else if (i != 1) {
                            if (i == 4) {
                                if (j < 5) {
                                    if (!noop(j, i)) {
                                        return false;
                                    }
                                }
                            }
                            else {
                                if (!noop(j, i)) {
                                    return false;
                                }
                            }
                        }
                    }
                    catch (ex) { }
                }
                if (i == 4) {
                    return true;
                }
            }
        };
        var bundle = translate.levels.getBundle(this.title);
        //Checks when loading and clear
        if (e.type == EventType.LOAD && noop(0) || e.type == EventType.CLEAR && noop(0))
            e._view.showHint('tool_grab', bundle.getText('A'));
        else if (e.type == EventType.LOAD && noop(1) || e.type == EventType.CLEAR && noop(1))
            e._view.showHint('tool_right', bundle.getText('B'));
        else if (e.type == EventType.LOAD && noop(2) || e.type == EventType.CLEAR && noop(2))
            e._view.showHint('tool_grab', bundle.getText('C'));
        else if ((e.type == EventType.LOAD && grab(0) && noothers()) || (e.type == EventType.LOAD && grab(0) && right(1) && noothers()) || (e.type == EventType.LOAD && grab(0) && right(1) && grab(2) && noothers()))
            e._view.showHint('play', translate.levels.getText('play'));
        else if (e.type == EventType.PLAY)
            e._view.hideHints();
        else if (e.type == EventType.DRAG && noop(0) && draggingElement() == "grab" || (e.type == EventType.DRAG && !grab(0) && draggingElement() == "grab"))
            e._view.showHint('reg_1_0', translate.levels.getText('drop'));
        else if (e.type == EventType.DRAG && noop(1) && draggingElement() == "right" || e.type == EventType.DRAG && !right(1) && draggingElement() == "right")
            e._view.showHint('reg_1_1', translate.levels.getText('drop'));
        else if (e.type == EventType.DRAG && noop(2) && draggingElement() == "grab" || e.type == EventType.DRAG && !grab(2) && draggingElement() == "grab")
            e._view.showHint('reg_1_2', translate.levels.getText('drop'));
        else if ((e.type == EventType.DRAG && draggingElement() != "grab") || (e.type == EventType.DRAG && draggingElement() != "right"))
            e._view.showHint('dragImage', translate.levels.getText('dragOther'));
        else if ((e.type == EventType.DROP && grab(0) && noothers()) || (e.type == EventType.DROP && grab(0) && right(1) && noothers()) || (e.type == EventType.DROP && grab(0) && right(1) && grab(2) && noothers()))
            e._view.showHint('play', translate.levels.getText('play'));
        else if (e.type == EventType.DROP && noop(0))
            e._view.showHint('reg_1_0', translate.levels.getText('drop'));
        else if (e.type == EventType.DROP && noop(1))
            e._view.showHint('reg_1_1', translate.levels.getText('drop'));
        else if (e.type == EventType.DROP && noop(2))
            e._view.showHint('reg_1_2', translate.levels.getText('drop'));
        else if ((e.type == EventType.END && grab(0)) || (e.type == EventType.END && right(1)) || (e.type == EventType.END && grab(2)))
            e._view.showHint('play', translate.levels.getText('stop'));
        else if (e.type == EventType.STOP && grab(0) && noop(1))
            e._view.showHint('tool_right', bundle.getText('B'));
        else if (e.type == EventType.STOP && grab(0) && right(1) && noop(2))
            e._view.showHint('tool_grab', bundle.getText('C'));
        // game is won!
    });
    level.TRANSPORTER = new Level('Transporter', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        var bundle = translate.levels.getBundle(this.title);
        if (e.type === EventType.LOAD && e._model.getCode().getNumberOfOperations() === 0)
            e._view.showHint('goal', bundle.getText('yourself'));
        else if (e.type === EventType.DROP && e._model.getCode().getOperation(1, 3).same(cmd.PROG1))
            e._view.showHint('play', translate.levels.getText('play'));
        else if (e.type === EventType.PLAY)
            e._view.hideHints();
    });
    level.RE_COURSES = new Level('Re-Curses', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        if (e['done'])
            return;
        var bundle = translate.levels.getBundle(this.title);
        var code = e._model.getCode();
        var is = function (prog, r, i) {
            return e._model.getCode().getOperation(prog, r).same(i);
        };
        var prog1 = function (r) {
            return is(1, r, cmd.PROG1);
        };
        var noop = function (r, prog) {
            if (prog == undefined || prog < 0) {
                return is(1, r, cmd.NOOP);
            }
            else {
                return is(prog, r, cmd.NOOP);
            }
        };
        var grab = function (r) {
            return is(1, r, cmd.GRAB);
        };
        var noothers = function () {
            for (var i = 1; i < 5; i++) {
                for (var j = 0; j < 8; j++) {
                    try {
                        if (i == 1 && j > 1) {
                            if (i != 4) {
                                if (!noop(j, i)) {
                                    return false;
                                }
                            }
                            else {
                                if (j < 5) {
                                    if (!noop(j, i)) {
                                        return false;
                                    }
                                }
                            }
                        }
                        else if (i != 1) {
                            if (i == 4) {
                                if (j < 5) {
                                    if (!noop(j, i)) {
                                        return false;
                                    }
                                }
                            }
                            else {
                                if (!noop(j, i)) {
                                    return false;
                                }
                            }
                        }
                    }
                    catch (ex) { }
                }
                if (i == 4) {
                    return true;
                }
            }
        };
        //Checks when loading and clear
        if ((e.type === EventType.LOAD && noop(0)) || e.type === EventType.CLEAR)
            e._view.showHint('tool_prog1', bundle.getText('loop'));
        else if (e.type === EventType.LOAD && prog1(0) && noop(1))
            e._view.showHint('reg_1_0', bundle.getText('move'));
        else if (e.type === EventType.LOAD && prog1(1))
            e._view.showHint('tool_grab', bundle.getText('grab'));
        else if (e.type == EventType.LOAD && grab(0) && prog1(1))
            e._view.showHint('play', translate.levels.getText('play'));
        else if (e.type === EventType.DRAG && noop(0) && noop(1) && draggingElement() == "prog1")
            e._view.showHint('reg_1_0', translate.levels.getText('drop'));
        else if (e.type === EventType.DRAG && prog1(0) && noop(1) && draggingElement() == "prog1")
            e._view.showHint('reg_1_1', translate.levels.getText('drop'));
        else if (e.type === EventType.DRAG && prog1(1) && noop(0) && draggingElement() == "grab")
            e._view.showHint('reg_1_0', translate.levels.getText('drop'));
        else if ((e.type == EventType.DRAG && draggingElement() != "grab") || (e.type == EventType.DRAG && draggingElement() != "prog1"))
            e._view.showHint('dragImage', translate.levels.getText('dragOther'));
        else if (e.type === EventType.DROP && noop(1) && prog1(0) && noothers())
            e._view.showHint('reg_1_0', bundle.getText('move'));
        else if (e.type === EventType.DROP && noop(0) && prog1(1) && noothers())
            e._view.showHint('tool_grab', bundle.getText('grab'));
        else if (e.type == EventType.DROP && grab(0) && prog1(1) && noothers())
            e._view.showHint('play', translate.levels.getText('play'));
        else if (e.type === EventType.PLAY && grab(0) && prog1(1)) {
            e['done'] = true;
            e._view.showHint('gameplay', bundle.getText('well done'));
        }
    });
    level.INVERTER = new Level('Inverter', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        if (e['done'])
            return;
        var bundle = translate.levels.getBundle(this.title);
        var code = e._model.getCode();
        var is = function (p, r, i) {
            return code.getOperation(p, r).same(i);
        };
        var nootherProg2 = function () {
            for (var i = 1; i < 5; i++) {
                for (var j = 0; j < 8; j++) {
                    if (i == 1) {
                        if (j != 0 && j != 1) {
                            if (is(i, j, cmd.PROG2)) {
                                return false;
                            }
                        }
                    }
                    else {
                        if (i == 4) {
                            if (j < 6) {
                                if (is(i, j, cmd.PROG2)) {
                                    return false;
                                }
                            }
                        }
                        else {
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
        };
        if ((e.type === EventType.LOAD || e.type === EventType.CLEAR)) {
            code.reset();
            code.setOperation(1, 0, cmd.GRAB);
            code.setOperation(1, 1, cmd.RIGHT);
            code.setOperation(1, 2, cmd.GRAB);
            code.setOperation(1, 3, cmd.LEFT);
            code.setOperation(1, 4, cmd.GRAB);
            code.setOperation(1, 5, cmd.RIGHT);
            code.setOperation(1, 6, cmd.GRAB);
            code.setOperation(1, 7, cmd.LEFT);
        }
        if (!e['use_progs'] && code.getNumberOfOperations() === 8 && code.getOperation(1, 0).same(cmd.GRAB) && code.getOperation(1, 1).same(cmd.RIGHT) && code.getOperation(1, 2).same(cmd.GRAB) && code.getOperation(1, 3).same(cmd.LEFT) && code.getOperation(1, 4).same(cmd.GRAB) && code.getOperation(1, 5).same(cmd.RIGHT) && code.getOperation(1, 6).same(cmd.GRAB) && code.getOperation(1, 7).same(cmd.LEFT)) {
            e['use_progs'] = true;
            e._view.showHint('gameplay', bundle.getText('use progs'));
        }
        else if (e.type === EventType.HIDE && is(1, 0, cmd.GRAB) && is(2, 0, cmd.NOOP)) {
            e._view.showHint('reg_1_0', bundle.getText('move'));
        }
        else if (e.type === EventType.DROP && is(1, 0, cmd.GRAB) && is(2, 0, cmd.NOOP)) {
            e._view.showHint('reg_1_0', bundle.getText('move'));
        }
        else if (e.type === EventType.DROP && is(2, 0, cmd.GRAB) && is(1, 1, cmd.RIGHT)) {
            e._view.showHint('reg_1_1', bundle.getText('move'));
        }
        else if (e.type === EventType.DROP && is(2, 1, cmd.RIGHT) && is(1, 2, cmd.GRAB)) {
            e._view.showHint('reg_1_2', bundle.getText('move'));
        }
        else if (e.type === EventType.DROP && is(2, 0, cmd.GRAB) && is(2, 2, cmd.GRAB) && is(1, 3, cmd.LEFT)) {
            e._view.showHint('reg_1_3', bundle.getText('move'));
        }
        else if (e.type === EventType.DROP && is(2, 3, cmd.LEFT) && is(1, 0, cmd.NOOP) && nootherProg2()) {
            e._view.showHint('tool_prog2', bundle.getText('drag'));
        }
        else if (e.type === EventType.DROP && is(1, 0, cmd.PROG2) && is(1, 1, cmd.NOOP) && nootherProg2()) {
            e._view.showHint('tool_prog2', bundle.getText('another'));
        }
        else if (e.type === EventType.DROP && is(1, 1, cmd.PROG2)) {
            e._view.showHint('play', bundle.getText('each time'));
        }
        else if (e.type === EventType.DRAG && is(1, 0, cmd.NOOP) && draggingElement() == "prog2") {
            e._view.showHint('reg_1_0', translate.levels.getText('drop'));
        }
        else if (e.type === EventType.DRAG && is(1, 1, cmd.NOOP) && draggingElement() == "prog2") {
            e._view.showHint('reg_1_1', translate.levels.getText('drop'));
        }
        else if (e.type === EventType.DRAG && !is(2, 0, cmd.GRAB) && draggingElement() == "grab") {
            e._view.showHint('reg_2_0', translate.levels.getText('drop'));
        }
        else if (e.type === EventType.DRAG && !is(2, 1, cmd.RIGHT) && draggingElement() == "right") {
            e._view.showHint('reg_2_1', translate.levels.getText('drop'));
        }
        else if (e.type === EventType.DRAG && !is(2, 2, cmd.GRAB) && draggingElement() == "grab") {
            e._view.showHint('reg_2_2', translate.levels.getText('drop'));
        }
        else if (e.type === EventType.DRAG && !is(2, 3, cmd.LEFT) && draggingElement() == "left") {
            e._view.showHint('reg_2_3', translate.levels.getText('drop'));
        }
        else if (e.type === EventType.PLAY) {
            e['done'] = true;
            e._view.hideHints();
        }
    });
    /** FROM_BENEATH2 is a special Level that is shown to teach conditions.
    It is shown at the beginning ot "FROM_BENEATH".
     */
    level.FROM_BENEATH2 = new Level('From Beneath2', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        var bundle = translate.levels.getBundle(this.title);
        var code = e._model.getCode();
        var is = function (p, r, i) {
            return code.getCondition(p, r).same(i);
        };
        var nootherYellow = function () {
            for (var i = 1; i < 5; i++) {
                for (var j = 0; j < 8; j++) {
                    if (i == 1) {
                        if (j != 1) {
                            if (is(i, j, cmd.YELLOW)) {
                                return false;
                            }
                        }
                    }
                    else {
                        if (i == 4) {
                            if (j < 6) {
                                if (is(i, j, cmd.YELLOW)) {
                                    return false;
                                }
                            }
                        }
                        else {
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
        };
        var nootherEmpty = function () {
            for (var i = 1; i < 5; i++) {
                for (var j = 0; j < 8; j++) {
                    if (i == 1) {
                        if (j != 2) {
                            if (is(i, j, cmd.EMPTY)) {
                                return false;
                            }
                        }
                    }
                    else {
                        if (i == 4) {
                            if (j < 6) {
                                if (is(i, j, cmd.EMPTY)) {
                                    return false;
                                }
                            }
                        }
                        else {
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
        };
        if (e.type === EventType.LOAD || e.type === EventType.CLEAR) {
            code.reset();
            code.setOperation(1, 0, cmd.GRAB);
            code.setOperation(1, 1, cmd.RIGHT);
            code.setOperation(1, 2, cmd.LEFT);
            code.setOperation(1, 3, cmd.PROG1);
        }
        if (e.type === EventType.WIN) {
            e['step'] = 100;
            e._view.setYouGotItState(false); // never show this!
            //TODO: sm is null 
            e.sm.reset();
        }
        if (e['step'] >= 22) {
            if (e.type === EventType.CLEAR)
                code.reset();
            if (code.getNumberOfOperations() > 0) {
                $("#btn_step").hide();
                $("#btn_clear").click(function () {
                    $("#btn_step").show();
                });
                e._view.showHint('btn_clear', bundle.getText('E'));
            }
            else if (e.type === EventType.CLEAR) {
                e._view.showHint('gameplay', bundle.getText('F'));
                level.FROM_BENEATH2['done'] = true;
            }
            else if (level.FROM_BENEATH2['done']) {
                //  to "From Beneath":
                e._model.setLevel(level.FROM_BENEATH);
            }
        }
        else if (!is(1, 1, cmd.YELLOW)) {
            if (EventType.DRAG !== e.type && nootherYellow())
                e._view.showHint('tool_yellow', bundle.getText('A'));
            else if (draggingElement() == 'yellow')
                e._view.showHint('reg_1_1', translate.levels.getText('drop'));
            else
                e._view.showHint('dragImage', translate.levels.getText('dragOther'));
        }
        else if (is(1, 1, cmd.YELLOW) && !is(1, 2, cmd.EMPTY)) {
            if (EventType.DRAG !== e.type && nootherEmpty())
                e._view.showHint('tool_empty', bundle.getText('B'));
            else if (draggingElement() == 'empty')
                e._view.showHint('reg_1_2', translate.levels.getText('drop'));
            else
                e._view.showHint('dragImage', translate.levels.getText('dragOther'));
        }
        else if (is(1, 1, cmd.YELLOW) && is(1, 2, cmd.EMPTY)) {
            if (e.type === EventType.DROP) {
                e['step'] = 1;
                e._view.showHint('btn_step', bundle.getText('C'));
            }
            else if (e.type === EventType.STEP) {
                if (e['step'] < 22) {
                    e['step'] += 1;
                    e._view.showHint('btn_step', bundle.getText('D'));
                }
            }
        }
    });
    level.FROM_BENEATH = new Level('From Beneath', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        var code = e._model.getCode();
        if ((e.type === EventType.CLEAR || e.type === EventType.LOAD) && !level.FROM_BENEATH2['done']) {
            level.FROM_BENEATH2['done'] = false;
            e._model.setLevel(level.FROM_BENEATH2);
        }
        else if (level.FROM_BENEATH2['done'] && (e.type === EventType.LOAD || e.type === EventType.CLEAR)) {
            var code = e._model.getCode();
            code.reset();
            code.setOperation(1, 0, cmd.GRAB);
            code.setOperation(1, 1, cmd.RIGHT);
            code.setOperation(1, 2, cmd.LEFT);
            code.setOperation(1, 3, cmd.PROG1);
            return;
        }
        // switch to "From Beneath2":
        if (e.type === EventType.LOAD && code.getNumberOfOperations() === 0) {
            e._model.setLevel(level.FROM_BENEATH2);
        }
    });
    level.GO_LEFT = new Level('Go Left', // Title of the level
    level.TUTORIALS, // Levels pack
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
    function (e) {
        // the user is on his own.
    });
    level.DOUBLE_FLIP = new Level('Double Flip', // Title of the level
    level.EASY, // Levels pack
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
    level.GO_LEFT_2 = new Level('Go Left 2', // Title of the level
    level.EASY, // Levels pack
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
    level.SHUFFLE_SORT = new Level('Shuffle Sort', // Title of the level
    level.EASY, // Levels pack
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
    level.GO_THE_DISTANCE = new Level('Go the Distance', // Title of the level
    level.EASY, // Levels pack
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
    level.COLOR_SORT = new Level('Color Sort', // Title of the level
    level.EASY, // Levels pack
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
    level.WALKING_PILES = new Level('Walking Piles', // Title of the level
    level.EASY, // Levels pack
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
    level.REPEAT_INVERTER = new Level('Repeat Inverter', // Title of the level
    level.MEDIUM, // Levels pack
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
    level.DOUBLE_SORT = new Level('Double Sort', // Title of the level
    level.MEDIUM, // Levels pack
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
    level.MIRROR = new Level('Mirror', // Title of the level
    level.MEDIUM, // Levels pack
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
    level.LAY_IT_OUT = new Level('Lay it out', // Title of the level
    level.MEDIUM, // Levels pack
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
    level.THE_STACKER = new Level('The Stacker', // Title of the level
    level.MEDIUM, // Levels pack
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
    level.CLARITY = new Level('Clarity', // Title of the level
    level.MEDIUM, // Levels pack
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
    level.COME_TOGETHER = new Level('Come Together', // Title of the level
    level.HARD, // Levels pack
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
    level.COME_TOGETHER_2 = new Level('Come Together 2', // Title of the level
    level.HARD, // Levels pack
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
    level.UP_THE_GREENS = new Level('Up The Greens', // Title of the level
    level.HARD, // Levels pack
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
    level.FILL_THE_BLANKS = new Level('Fill The Blanks', // Title of the level
    level.HARD, // Levels pack
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
    level.COUNT_THE_BLUES = new Level('Count The Blues', // Title of the level
    level.HARD, // Levels pack
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
    level.MULTI_SORT = new Level('Multi Sort', // Title of the level
    level.HARD, // Levels pack
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
    level.DIVIDE_BY_TWO = new Level('Divide by two', // Title of the level
    level.CRAZY, // Levels pack
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
    level.THE_MERGER = new Level('The Merger', // Title of the level
    level.CRAZY, // Level's pack
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
    level.EVEN_THE_ODDS = new Level('Even the Odds', // Title of the level
    level.CRAZY, // Level's pack
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
    level.GENETIC_CODE = new Level('Genetic Code', // Title of the level
    level.CRAZY, // Level's pack
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
    level.MULTI_SORT_2 = new Level('Multi Sort 2', // Title of the level
    level.CRAZY, // Level's pack
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
    level.THE_SWAP = new Level('The Swap', // Title of the level
    level.CRAZY, // Level's pack
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
    level.RESTORING_ORDER = new Level('Restoring Order', // Title of the level
    level.IMPOSSIBLE, // Level's pack
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
    level.CHANGING_PLACES = new Level('Changing Places', // Title of the level
    level.IMPOSSIBLE, // Level's pack
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
    level.PALETTE_SWAP = new Level('Palette Swap', // Title of the level
    level.IMPOSSIBLE, // Level's pack
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
    level.MIRROR_2 = new Level('Mirror 2', // Title of the level
    level.IMPOSSIBLE, // Level's pack
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
    level.CHANGING_PLACES_2 = new Level('Changing Places 2', // Title of the level
    level.IMPOSSIBLE, // Level's pack
    0, // Start platform of the grappler 
    [25, 19, 16], // Rating
    BASE_TOOLS.concat(red, empty), // available tools
    [
        [red,],
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
    level.VERTICAL_SORT = new Level('Vertical Sort', // Title of the level
    level.IMPOSSIBLE, // Level's pack
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
    level.COUNT_IN_BINARY = new Level('Count in Binary', // Title of the level
    level.BONUS, // Level's pack
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
    level.PARTING_THE_SEA = new Level('Parting the Sea', // Title of the level
    level.BONUS, // Level's pack
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
    level.THE_TRICK = new Level('The Trick', // Title of the level
    level.BONUS, // Level's pack
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
})(level || (level = {}));
/*
Cargo-Bot by Claude Martin.
Created at the University of Applied Sciences and Arts Northwestern Switzerland.
*/
// The use of defer="defer" would be much nicer, but not all browsers support it.
var checkLoading = true;
var finished = false;
var defer = function () {
    // see https://developer.mozilla.org/en-US/docs/Web/API/document.readyState
    if (counter++ > 100)
        console.log('Initialisation failed. Reload the page.\nInitialisierung fehlgeschlagen. Lade die Seite erneut.');
    else if (document.readyState === "complete") {
        if (checkLoading) {
            if (window.Windows) {
                dataSaver.loadIntoLocalStorage();
            }
            else {
                dataSaver.loadWithoutWindows();
            }
            checkLoading = false;
        }
        if (dataSaver.counter == dataSaver.keysArray.length) {
            loadCargoBot();
            finished = true;
        }
    }
    if (!finished)
        setTimeout(defer, 10);
};
var counter = 0;
var frameCount = 0;
// indicates about 60%:
document.onreadystatechange = function (event) {
    if (window.innerWidth < 500) {
        var logo = document.getElementById('cargo-bot-logo');
        var w = (window.innerWidth - 10);
        logo.style.width = w + 'px';
        logo.style.height = (w / 470 * 85) + 'px';
    }
    var crates = document.getElementById('progress').querySelectorAll('div');
    Array.prototype.forEach.call(crates, function (c, i) {
        if (i > 1)
            return; // note: splice() can't be applied to a NodeList but forEach() can.
        setTimeout(function () {
            c.className = 'full-opacity';
        }, 32 + (i * 200));
    });
    if (document.readyState !== "loading") {
        var crates = document.getElementById('progress').querySelectorAll('div');
        crates[2].className = 'full-opacity';
    }
    defer(); // this waits even longer.
}; // maybe the document way already complete:
if (document.readyState !== "loading")
    document.onreadystatechange(null);
var loaded = false;
WinJS.Application.onready = function () {
    loadCargoBot();
};
function loadCargoBot() {
    if (loaded)
        return;
    loaded = true;
    // falling crates:
    var bigCrates = document.querySelectorAll('.big-crate');
    for (var i = 0; i < bigCrates.length; ++i) {
        var bc = bigCrates[i];
        bc.style.left = (i * 15) + '%';
        bc.style.top = '-200px';
        bc.style.display = 'block';
        setTimeout(function (bc) {
            bc.style.top = (1400 + Math.random() * 400) + 'px';
            shims.transform(bc, 'scale(1.2,1.2) rotate(' + (Math.round(200 * (Math.random() - 0.5)) / 100) + 'turn)');
        }, (Math.random()) * 500 + (500 * (i % 2)), bc);
    }
    var enqueue = function (f) {
        setTimeout(function () {
            f();
        }, 33);
    };
    // crates that indicate loading state (0 - 4):
    //crates 0, 1, and 2 are visible already!
    var crates = document.getElementById('progress').querySelectorAll('div');
    if (!shims && !view && !ctrl && !animation)
        throw 'RequireJS did not load the modules!';
    // get the language:
    try {
        var userLang = navigator.language || navigator.userLanguage;
        var language = 'en';
        if (userLang == 'de' || userLang == 'en') {
            language = userLang;
        }
        translate.setLanguage(language);
    }
    catch (e) {
        translate.setLanguage('en');
    }
    // Prepare the browser:
    shims.init();
    view.init();
    ctrl.init();
    soundplayer.init();
    //initializing sound
    soundplayer.updateSound();
    //initializing history
    WinJS.Navigation.history.backStack.push({
        state: 1
    }, "Main", "?state=1");
    // history.pushState = function(arg) {
    //     console.log(["tried to push state", arg]);
    // }
    history.pushState({
        state: 1
    }, "Main", "?state=1");
    document.getElementById('cargo-bot-logo-text').style.display = 'none';
    document.getElementById('cargo-bot-logo').style.display = 'inline';
    shims.setTextContent(document.getElementById('status'), translate.loading.getText('loading'));
    //Disable Scrolling with keys
    window.addEventListener("keydown", function (e) {
        // space and arrow keys
        if ([32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
    enqueue(function () {
        crates[3].className = 'full-opacity';
        animation.init();
        // the first image is taken out (shift) and loaded last.
        var firstImg = new Image();
        var firstSrc = images.shift();
        // iterate over the remaining images:
        images.forEach(function (url) {
            var img = new Image();
            img.src = url;
        });
        //when "first" image is loaded:
        firstImg.onload = function () {
            var loading = document.getElementById('loading');
            loading.onclick = function () {
                animation.animateMenu(loading);
            };
            loading.style.cursor = 'pointer';
            Array.prototype.forEach.call(loading.querySelectorAll('p'), function (p) {
                p.style.cursor = 'pointer';
            });
            var status = document.getElementById('status');
            shims.setTextContent(status, translate.loading.getText('ready'));
            var click2start = document.getElementById('click2start');
            shims.setTextContent(click2start, translate.loading.getText('click2start'));
            click2start.style.visibility = 'visible';
        };
        firstImg.src = firstSrc; // load the "first" image of the array
        enqueue(function () {
            crates[4].className = 'full-opacity';
        });
        // since the image preload could fail, we set it to "ready" after 5 seconds:
        setTimeout(firstImg.onload, 5000);
    });
}
var addEvent = function (object, type, callback) {
    if (object == null || typeof (object) == 'undefined')
        return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    }
    else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    }
    else {
        object["on" + type] = callback;
    }
};
var images = ([
    'gfx/Arrow_Left.png', 'gfx/Arrow_Right.png', 'gfx/Claw_Arm.png', 'gfx/Claw_Arm_Shadow.png', 'gfx/Claw_Base.png', 'gfx/Claw_Base_Shadow.png', 'gfx/Claw_Left.png', 'gfx/Claw_Left_Shadow.png', 'gfx/Claw_Middle.png', 'gfx/Claw_Middle_Shadow.png', 'gfx/Claw_Right.png', 'gfx/Claw_Right_Shadow.png', 'gfx/Clear_Button.png', 'gfx/Command_Grab.png', 'gfx/Command_Left.png', 'gfx/Command_Right.png', 'gfx/Condition_Any.png', 'gfx/Condition_Blue.png', 'gfx/Condition_Green.png', 'gfx/Condition_None.png', 'gfx/Condition_Red.png', 'gfx/Condition_Yellow.png', 'gfx/Crate_Blue_1.png', 'gfx/Crate_Blue_2.png', 'gfx/Crate_Blue_3.png', 'gfx/Crate_Goal_Blue.png', 'gfx/Crate_Goal_Green.png', 'gfx/Crate_Goal_Red.png', 'gfx/Crate_Goal_Yellow.png', 'gfx/Crate_Green_1.png', 'gfx/Crate_Green_2.png', 'gfx/Crate_Green_3.png', 'gfx/Crate_Red_1.png', 'gfx/Crate_Red_2.png', 'gfx/Crate_Red_3.png', 'gfx/Crate_Shadow.png', 'gfx/Crate_Yellow_1.png', 'gfx/Crate_Yellow_2.png', 'gfx/Crate_Yellow_3.png', 'gfx/Dialogue_Box.png', 'gfx/Dialogue_Button.png', 'gfx/Fast_Button_Active.png', 'gfx/Fast_Button_Inactive.png', 'gfx/Game_Area.png', 'gfx/Game_Area_Floor.png', 'gfx/Game_Area_Roof.png', 'gfx/Goal_Area.png', 'gfx/Hint_Triangle_Down.png', 'gfx/Hint_Triangle_Right.png', 'gfx/Hint_Triangle_Up.png', 'gfx/Hints_Button.png', 'gfx/Left.png', 'gfx/Level_Select_Frame.png', 'gfx/Logo.png', 'gfx/Menu_Game_Button.png', 'gfx/Next_Button.png', 'gfx/Pack_Crazy.png', 'gfx/Pack_Easy.png', 'gfx/Pack_Hard.png', 'gfx/Pack_Impossible.png', 'gfx/Pack_Medium.png', 'gfx/Pack_Tutorial.png', 'gfx/Platform.png', 'gfx/Platform_Shadow.png', 'gfx/Play_Button.png', 'gfx/Play_Solution_Icon.png', 'gfx/Program_1.png', 'gfx/Program_2.png', 'gfx/Program_3.png', 'gfx/Program_4.png', 'gfx/Program_5.png', 'gfx/Register_Slot.png', 'gfx/Register_Slot_Last.png', 'gfx/Right.png', 'gfx/Smoke_Particle.png', 'gfx/Star_Empty.png', 'gfx/Star_Filled.png', 'gfx/Starry_Background.png', 'gfx/Step_Button.png', 'gfx/Stop_Button.png', 'gfx/Toolbox.png', 'gfx/Two_Lives_Left.png'
]);
/* Observer Pattern. */
var obs;
(function (obs) {
    var Subscription = (function () {
        function Subscription(subscriber, callback) {
            this.subscriber = subscriber;
            this.callback = callback;
        }
        return Subscription;
    }());
    var Observable = (function () {
        function Observable() {
            this.subscriptions = new Array();
            this.changed = false;
        }
        Observable.prototype.subscribe = function (subscriber, callback) {
            this.subscriptions.push(new Subscription(subscriber, callback));
        };
        Observable.prototype.hasChanged = function () {
            return this.changed;
        };
        Observable.prototype.notify = function (msg) {
            var _this = this;
            if (msg === void 0) { msg = null; }
            this.subscriptions.forEach(function (s) {
                // Subscriber will be "this" in callback function:
                s.callback.call(s.subscriber, _this, msg);
            });
            this.changed = false;
        };
        Observable.prototype.setChanged = function () {
            this.changed = true;
        };
        return Observable;
    }());
    obs.Observable = Observable;
})(obs || (obs = {}));
/** Model (MVC) */
/// <reference path="obs.ts"/>
var model;
(function (model) {
    var Code = (function (_super) {
        __extends(Code, _super);
        function Code() {
            _super.call(this);
            this.code = new Array();
            this.reset();
        }
        Code.prototype.reset = function () {
            var noop = cmd.getCommand(cmd.NOOP, cmd.NOCOND);
            var exit = cmd.getCommand(cmd.EXIT, cmd.NOCOND);
            this.code[0] = null;
            this.code[1] = [noop, noop, noop, noop, noop, noop, noop, noop, exit];
            this.code[2] = [noop, noop, noop, noop, noop, noop, noop, noop, exit];
            this.code[3] = [noop, noop, noop, noop, noop, noop, noop, noop, exit];
            this.code[4] = [noop, noop, noop, noop, noop, exit];
        };
        Code.prototype.clone = function (code) {
            var result = new Code();
            for (var p = 1; p <= 4; p++) {
                for (var r = 0; r <= (p == 4 ? 5 : 8); r++) {
                    result.code[p][r] = cmd.getCommand(code.getOperation(p, r), code.getCondition(p, r));
                }
            }
            return result;
        };
        Code.prototype.toString = function () {
            var result = '';
            for (var p = 1; p <= 4; p++) {
                result += 'Prog' + p + ': ';
                for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                    result += this.code[p][r].toString() + ' ';
                }
                result += '\n';
            }
            return result;
        };
        Code.prototype.getNumberOfOperations = function () {
            var result = 0;
            for (var p = 1; p <= 4; p++) {
                for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                    var op = this.code[p][r].getOperation();
                    if (!op.same(cmd.NOOP) && !op.same(cmd.EXIT))
                        result++;
                }
            }
            return result;
        };
        Code.CmdID = function (c) {
        };
        Code.prototype.short = function (s) {
            return s.charAt(0) + s.charAt(s.length - 1);
        };
        /** short representation as string. */
        Code.prototype.save = function () {
            var result = '';
            for (var p = 1; p <= 4; p++) {
                for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                    var c = this.code[p][r];
                    result += this.short(c.getOperation().toString());
                    result += this.short(c.getCondition().toString());
                }
            }
            return result;
        };
        /** load from string. */
        Code.prototype.load = function (code) {
            var _this = this;
            try {
                if (!code)
                    throw "";
                var chars = code.split('');
                var instr = {};
                cmd.getInstructions().forEach(function (i) {
                    instr[_this.short(i.toString())] = i;
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
            }
            catch (e) {
                // RESET:
                for (var p = 1; p <= 4; p++) {
                    for (var r = 0; r <= (p == 4 ? 4 : 7); r++) {
                        this.setOperation(p, r, cmd.NOOP);
                        this.setCondition(p, r, cmd.NOCOND);
                    }
                }
            }
        };
        Code.prototype.getCommand = function (program, register) {
            if (!this.checkIndex(program, register))
                return;
            return this.code[program][register];
        };
        Code.prototype.getOperation = function (program, register) {
            if (!this.checkIndex(program, register))
                return;
            return this.code[program][register].getOperation();
        };
        Code.prototype.setOperation = function (program, register, op) {
            if (!this.checkIndex(program, register))
                return;
            var oldCmd = this.code[program][register];
            var newCmd = cmd.getCommand(op, oldCmd.getCondition());
            if (oldCmd.equals(newCmd))
                return;
            this.code[program][register] = newCmd;
            this.setChanged();
            this.notify(new msg.RegisterChanged(oldCmd, newCmd, program, register));
        };
        Code.prototype.getCondition = function (program, register) {
            if (!this.checkIndex(program, register))
                return;
            return this.code[program][register].getCondition();
        };
        Code.prototype.setCondition = function (program, register, cond) {
            if (!this.checkIndex(program, register))
                return;
            var oldCmd = this.code[program][register];
            var newCmd = cmd.getCommand(oldCmd.getOperation(), cond);
            if (oldCmd.equals(newCmd))
                return;
            this.code[program][register] = newCmd;
            this.setChanged();
            this.notify(new msg.RegisterChanged(oldCmd, newCmd, program, register));
        };
        Code.prototype.setInstruction = function (program, register, instruction) {
            if (!this.checkIndex(program, register))
                return;
            if (instruction.isOperation())
                this.setOperation(program, register, instruction);
            else
                this.setCondition(program, register, instruction);
        };
        Code.prototype.checkIndex = function (program, register) {
            var result = true;
            if (program < 1 || program > 4)
                result = false;
            if (register < 0 || register > 8)
                result = false;
            if (program == 4 && register > 5)
                result = false;
            if (!result)
                throw 'Bad index: ' + program + 'x' + register;
            return result;
        };
        return Code;
    }(obs.Observable));
    var PRNG = (function () {
        function PRNG() {
            // chosen by fair dice rolls. guaranteed to be random.
            this.pseudoRandom = [1, 2, 3, 2, 3, 1, 3, 1, 2];
            this.lastIndex = -1;
        }
        PRNG.prototype.reset = function () {
            this.lastIndex = -1;
        };
        PRNG.prototype.next = function () {
            this.lastIndex++;
            this.lastIndex %= this.pseudoRandom.length;
            return this.pseudoRandom[this.lastIndex];
        };
        return PRNG;
    }());
    /* A pseudo random number generator used to define the "type" of a crate. */
    var prng = new PRNG();
    var Crate = (function () {
        function Crate(cargo, color) {
            this.cargo = cargo;
            this.color = color;
            this.type = prng.next();
            this.isNoCrate = this.color == '';
        }
        Crate.prototype.getType = function () {
            return this.type;
        };
        Crate.prototype.getColor = function () {
            return this.color;
        };
        Crate.prototype.getCargo = function () {
            return this.cargo;
        };
        Crate.prototype.getPlatform = function () {
            if (this.cargo == null)
                return -1;
            return this.cargo.getPlatform(this);
        };
        Crate.prototype.getHeight = function () {
            if (this.cargo == null)
                return -1;
            return this.cargo.getHeight(this);
        };
        Crate.prototype.matches = function (cond) {
            if (!cond || !cond.isCondition())
                throw 'ERROR : Given Instruction is not a condition';
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
        };
        return Crate;
    }());
    /** Null-object to prevent null references. */
    model.NO_CRATE = new Crate(null, '');
    var Cargo = (function (_super) {
        __extends(Cargo, _super);
        function Cargo() {
            _super.call(this);
            this.crates = new Array();
            this.grappler = 0;
            this.platforms = conf.getMaxPlatforms();
            /** Indicates that the next move to right/left will cause a crash.
              This is the case when cre grappler has just put a crate on top of 6  other crates. */
            this.overload = false;
            /** The cargo has crashed into a wall or a pile of 7 crates. */
            this.crash = false;
            this.clear();
        }
        Cargo.prototype.isCrashed = function () {
            return this.crash;
        };
        Cargo.prototype.isOverloaded = function () {
            return this.overload;
        };
        Cargo.prototype.clear = function () {
            for (var p = 0; this.crates.length < this.platforms; p++) {
                this.crates.push(new Array());
                for (var i = 0; i <= Cargo.maxHeight; i++) {
                    this.crates[p].push(model.NO_CRATE);
                }
            }
            this.grappler = 0;
            this.overload = false;
            this.crash = false;
            this.setChanged();
            // reset() does the notification
        };
        Cargo.prototype.setLevel = function (lvl) {
            this.lvl = lvl;
            this.reset();
        };
        Cargo.prototype.getLevel = function () {
            return this.lvl;
        };
        Cargo.prototype.reset = function () {
            if (!this.lvl)
                console.log('ERROR: model.Cargo : No level set.');
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
                        this.crates[p][h] = model.NO_CRATE;
                    if (this.goal[p][h] === undefined)
                        this.goal[p][h] = ''; // this adds creates at max height.
                }
            }
            this.setChanged();
            this.notify(new msg.CargoChanged(null, null, 'reset', true));
        };
        Cargo.prototype.getGrapplerContent = function () {
            if (this.grappler >= 0)
                return this.crates[this.grappler][Cargo.maxHeight];
            else
                return model.NO_CRATE;
        };
        /** Grappler is above what platform? */
        Cargo.prototype.getGrapplerPosition = function () {
            return this.grappler;
        };
        Cargo.prototype.getCrate = function (platform, height) {
            return this.crates[platform][height];
        };
        /** Grab a crate from a platform or drop it there. */
        Cargo.prototype.grab = function () {
            var crate1 = this.getGrapplerContent();
            if (crate1 == model.NO_CRATE) {
                var top = this.findTopCrateHeight(this.grappler);
                if (top > -1 && this.crates[this.grappler][top] != model.NO_CRATE) {
                    this.crates[this.grappler][Cargo.maxHeight] =
                        this.crates[this.grappler][top];
                    this.crates[this.grappler][top] = model.NO_CRATE;
                }
            }
            else {
                var top = this.findTopCrateHeight(this.grappler) + 1;
                if (top < Cargo.maxHeight) {
                    this.crates[this.grappler][top] = crate1;
                    this.crates[this.grappler][Cargo.maxHeight] = model.NO_CRATE;
                }
                else {
                    this.overload = true;
                }
            }
            var crate2 = this.getGrapplerContent();
            this.setChanged();
            this.notify(new msg.CargoChanged(crate1, crate2, 'grab', true));
        };
        /** Go left to the next platform. */
        Cargo.prototype.left = function () {
            var crate = this.getGrapplerContent();
            var allowed = !this.crash && !this.overload && this.grappler > 0;
            if (allowed && crate != model.NO_CRATE) {
                var tmp = this.crates[this.grappler - 1][Cargo.maxHeight];
                this.crates[this.grappler - 1][Cargo.maxHeight] = crate;
                this.crates[this.grappler][Cargo.maxHeight] = tmp;
            }
            this.grappler--;
            this.crash = this.crash || !allowed;
            this.setChanged();
            this.notify(new msg.CargoChanged(crate, crate, 'left', allowed));
        };
        /** Go right to the next platform. */
        Cargo.prototype.right = function () {
            var crate = this.getGrapplerContent();
            var allowed = !this.crash && !this.overload && (this.grappler + 1 < this.platforms);
            if (allowed && crate != model.NO_CRATE) {
                var tmp = this.crates[this.grappler + 1][Cargo.maxHeight];
                this.crates[this.grappler + 1][Cargo.maxHeight] = crate;
                this.crates[this.grappler][Cargo.maxHeight] = tmp;
            }
            this.grappler++;
            this.crash = this.crash || !allowed;
            this.setChanged();
            this.notify(new msg.CargoChanged(crate, crate, 'right', allowed));
        };
        /** Return top crate, or NO_CRATE for empty platform. */
        Cargo.prototype.findTopCrate = function (platform) {
            var top = this.findTopCrateHeight(platform);
            if (top === -1)
                return model.NO_CRATE;
            return this.crates[platform][top];
        };
        /** Return position in height of top crate, or -1 for empty platform. */
        Cargo.prototype.findTopCrateHeight = function (platform) {
            if (platform === -1 || this.crates[platform][0] == model.NO_CRATE)
                return -1;
            for (var h = 1; h <= Cargo.maxHeight; h++) {
                if (this.crates[platform][h] === model.NO_CRATE) {
                    return h - 1;
                }
            }
            return Cargo.maxHeight - 1;
        };
        Cargo.prototype.getPlatform = function (crate) {
            if (crate === model.NO_CRATE)
                throw 'getPlatform(NO_CRATE) is not defined!';
            for (var p = 0; p < this.platforms; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (this.crates[p][h] == crate)
                        return p;
                }
            }
            throw 'crate was not found';
        };
        Cargo.prototype.getHeight = function (crate) {
            if (crate === model.NO_CRATE)
                throw 'getHeight(NO_CRATE) is not defined!';
            for (var p = 0; p < this.platforms; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (this.crates[p][h] == crate)
                        return h;
                }
            }
            throw 'crate was not found';
        };
        Cargo.prototype.isGoal = function () {
            for (var p = 0; p < this.platforms; p++) {
                for (var h = 0; h <= Cargo.maxHeight; h++) {
                    if (this.crates[p][h].getColor() != this.goal[p][h])
                        return false;
                }
            }
            return true;
        };
        Cargo.maxHeight = conf.getMaxCrateHeight();
        return Cargo;
    }(obs.Observable));
    /** The model for the whole game. Even though the views and controllers are
     split to different objects, there is only one model.
    */
    var Model = (function (_super) {
        __extends(Model, _super);
        function Model(code, cargo) {
            _super.call(this);
            this.code = code;
            this.cargo = cargo;
            this.pack = null;
            this.lvl = null;
            this.fast = false;
            this.fast = (dataSaver.getData('speed') == 'fast');
        }
        Model.prototype.getLevelPack = function () {
            return this.pack;
        };
        Model.prototype.setLevelPack = function (pack) {
            if (this.pack === pack)
                return;
            this.pack = pack;
            this.setChanged();
            this.notify(new msg.ModelChanged(true, false, false, false));
        };
        Model.prototype.getLevel = function () {
            return this.lvl;
        };
        Model.prototype.save = function () {
            dataSaver.saveData(this.lvl.getTitle(), this.code.save());
        };
        /** Get the rating (=amount of stars, 0 to 3). */
        Model.prototype.getRating = function (lvl) {
            var p = lvl.getLevelPack().getIdName();
            var l = lvl.getTitle();
            var r = JSON.parse(dataSaver.getData('rating[' + p + ']'));
            if (r && r[l])
                return r[l];
            return 0;
        };
        Model.prototype.getTotalRating = function (pack) {
            var _this = this;
            var result = 0;
            var i = 0;
            if (!pack) {
                level.getLevelPacks().forEach(function (pack) {
                    result += _this.getTotalRating(pack);
                });
            }
            else {
                pack.getLevels().forEach(function (lvl) {
                    result += _this.getRating(lvl);
                });
            }
            return result;
        };
        /** Set the rating (=amount of stars, 0 to 3). */
        Model.prototype.setRating = function (lvl, rating) {
            if (rating >= 0 && rating <= 3) {
                var p = lvl.getLevelPack().getIdName();
                var r = JSON.parse(dataSaver.getData('rating[' + p + ']')) || {};
                var l = lvl.getTitle();
                r[l] = rating;
                dataSaver.saveData('rating[' + p + ']', JSON.stringify(r));
            }
            this.setChanged();
            this.notify(new msg.ModelChanged(false, false, false, true));
        };
        Model.prototype.setLevel = function (lvl) {
            // this is also done when the same level is realoaded!
            // this way the "tutorial hints" get a level-load event.
            if (lvl.getLevelPack() != this.pack)
                throw 'setLevel() can only be used if the Level-Pack is already set!';
            this.lvl = lvl;
            this.code.load(dataSaver.getData(lvl.getTitle()));
            this.setChanged();
            this.notify(new msg.ModelChanged(false, true, false, false));
        };
        Model.prototype.isFast = function () {
            return this.fast;
        };
        Model.prototype.setFast = function (fast) {
            this.fast = fast;
            dataSaver.saveData('speed', fast ? 'fast' : 'slow');
            this.setChanged();
            this.notify(new msg.ModelChanged(false, false, true, false));
        };
        Model.prototype.toggleSpeed = function () {
            this.setFast(!this.isFast());
        };
        Model.prototype.getCode = function () {
            return this.code;
        };
        Model.prototype.getCargo = function () {
            return this.cargo;
        };
        Model.prototype.getLanguage = function () {
            if (!this.language)
                this.language = dataSaver.getData('language');
            return this.language;
        };
        Model.prototype.setLanguage = function (lang) {
            if (this.language === lang)
                return;
            this.language = lang;
            dataSaver.saveData('language', lang);
        };
        return Model;
    }(obs.Observable));
    /** Messages used to notify on model changes. */
    var msg;
    (function (msg) {
        /** Notification about change of a register */
        var RegisterChanged = (function () {
            function RegisterChanged(oldCmd, newCmd, prog, reg) {
                this.oldCmd = oldCmd;
                this.newCmd = newCmd;
                this.prog = prog;
                this.reg = reg;
            }
            RegisterChanged.prototype.getOldCommand = function () {
                return this.oldCmd;
            };
            RegisterChanged.prototype.getNewCommand = function () {
                return this.newCmd;
            };
            RegisterChanged.prototype.getProgram = function () {
                return this.prog;
            };
            RegisterChanged.prototype.getRegister = function () {
                return this.reg;
            };
            return RegisterChanged;
        }());
        msg.RegisterChanged = RegisterChanged;
        /** The Cargo was changed. */
        var CargoChanged = (function () {
            function CargoChanged(crate1, crate2, direction, // can also be 'reset'
                allowed // true: ok / false: crash.
                ) {
                this.crate1 = crate1;
                this.crate2 = crate2;
                this.direction = direction;
                this.allowed = allowed;
            }
            /** crate in grappler before move. */
            CargoChanged.prototype.getCrate1 = function () {
                return this.crate1;
            };
            /** crate in grappler after move. */
            CargoChanged.prototype.getCrate2 = function () {
                return this.crate2;
            };
            /** Direction of grappler-movement ('left', 'right', 'grab') or 'reset'. */
            CargoChanged.prototype.getDirection = function () {
                return this.direction;
            };
            /** A return value of false indicates that the cargo bot crashed. */
            CargoChanged.prototype.isAllowed = function () {
                return this.allowed;
            };
            return CargoChanged;
        }());
        msg.CargoChanged = CargoChanged;
        /** This only informs what has changes, but knows nothing about the actual values.
         *  Call model.getUserSelection() to get the current selections.
         */
        var ModelChanged = (function () {
            function ModelChanged(pack, level, speed, rating) {
                this.pack = pack;
                this.level = level;
                this.speed = speed;
                this.rating = rating;
            }
            /** Did the level pack change?  */
            ModelChanged.prototype.isPack = function () {
                return this.pack;
            };
            /** Did the level change?  */
            ModelChanged.prototype.isLevel = function () {
                return this.level;
            };
            /** Did the speed change?  */
            ModelChanged.prototype.isSpeed = function () {
                return this.speed;
            };
            /** Did a rating change?  */
            ModelChanged.prototype.isRating = function () {
                return this.rating;
            };
            return ModelChanged;
        }());
        msg.ModelChanged = ModelChanged;
    })(msg = model.msg || (model.msg = {}));
    model.MODEL = new Model(new Code(), new Cargo());
})(model || (model = {}));
/// <reference path="lib/jquery.d.ts" />
var GameSoundState;
(function (GameSoundState) {
    GameSoundState[GameSoundState["MENU"] = 0] = "MENU";
    GameSoundState[GameSoundState["PLAYING"] = 1] = "PLAYING";
})(GameSoundState || (GameSoundState = {}));
var soundplayer;
(function (soundplayer) {
    var audio_types;
    var val;
    var audio;
    var sounds;
    var allsounds;
    var music;
    var sound;
    var mE;
    var sE;
    function init() {
        this.audio_types = ["audio/mpeg", "audio/ogg"];
        this.audio = new Audio();
        this.soundplayer_play_state = GameSoundState.MENU;
        this.mE = "musicEnabled";
        this.sE = "soundEnabled";
        for (this.val = 0; this.val < this.audio_types.length; this.val++) {
            if (this.audio.canPlayType(this.audio_types[this.val]) == "probably" || this.audio.canPlayType(this.audio_types[this.val]) == "maybe") {
                this.menumusic = new Audio('sounds/music/menu.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.creating_solution_music = new Audio('sounds/music/creating_solution_music.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.box_ground_crash = new Audio('sounds/sfx/box_ground_crash.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.grab_box = new Audio('sounds/sfx/grab_box.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.grab_toolbox_element = new Audio('sounds/sfx/grab_toolbox_element.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.ground_crash = new Audio('sounds/sfx/ground_crash.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.level_success = new Audio('sounds/sfx/level_success.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.move_crane = new Audio('sounds/sfx/move_crane.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.play_stop = new Audio('sounds/sfx/play_stop.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.put_box = new Audio('sounds/sfx/put_box.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.put_toolbox_element = new Audio('sounds/sfx/put_toolbox_element.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.wall_crash = new Audio('sounds/sfx/wall_crash.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.smoke_sound = new Audio('sounds/sfx/smoke_sound.' + this.audio_types[this.val].substring(6).replace('mpeg', 'mp3'));
                this.soundplayers = [this.move_crane, this.grab_box, this.ground_crash, this.box_ground_crash];
                this.allsounds = [this.move_crane, this.grab_box, this.ground_crash, this.box_ground_crash, this.grab_toolbox_element, this.level_success, this.play_stop, this.put_box, this.put_toolbox_element, this.wall_crash, this.smoke_sound];
                //setting volume
                this.menumusic.volume = 0.25;
                this.creating_solution_music.volume = 0.25;
                for (var i = 0; i < this.allsounds.length; i++) {
                    this.allsounds[i].playbackRate = 1.5;
                }
                this.val = this.audio_types.length;
            }
        }
        this.initialized = true;
        this.music = JSON.parse(dataSaver.getData(this.mE));
        this.sound = JSON.parse(dataSaver.getData(this.sE));
        if (this.music == null || this.music.enabled)
            this.enableMusic();
        else
            this.disableMusic();
        if (this.sound == null || this.sound.enabled)
            this.enableSound();
        else
            this.disableSound();
        this.menumusic.addEventListener('ended', function () {
            this.currentTime = 0;
            try {
                this.play();
            }
            catch (ex) {
                console.error(ex.message);
            }
        }, false);
        this.creating_solution_music.addEventListener('ended', function () {
            this.currentTime = 0;
            try {
                this.play();
            }
            catch (ex) {
                console.error(ex.message);
            }
        });
    }
    soundplayer.init = init;
    function togglePlaySpeed(fast) {
        if (fast)
            this.setPlaySpeed(1.5);
        else
            this.setPlaySpeed(2.25);
    }
    soundplayer.togglePlaySpeed = togglePlaySpeed;
    function setPlaySpeed(speed) {
        for (var i = 0; i < this.soundplayers.length; i++) {
            this.soundplayers[i].playbackRate = speed;
        }
    }
    soundplayer.setPlaySpeed = setPlaySpeed;
    function updateSound() {
        if (this.soundplayer_play_state == GameSoundState.MENU) {
            try {
                this.creating_solution_music.pause();
                this.menumusic.play();
            }
            catch (ex) {
                console.error(ex.message);
            }
        }
        else {
            try {
                this.menumusic.pause();
                this.creating_solution_music.play();
            }
            catch (ex) {
                console.error(ex.message);
            }
        }
    }
    soundplayer.updateSound = updateSound;
    function toggleMusic() {
        if (this.music.enabled) {
            $('#music').css('background-image', 'url(gfx/music_disabled.png)');
            this.music.enabled = false;
            this.menumusic.volume = 0;
            this.creating_solution_music.volume = 0;
        }
        else {
            $('#music').css('background-image', 'url(gfx/music_enabled.png)');
            this.music.enabled = true;
            this.menumusic.volume = 0.5;
            this.creating_solution_music.volume = 0.5;
        }
        dataSaver.saveData(this.mE, JSON.stringify(this.music));
    }
    soundplayer.toggleMusic = toggleMusic;
    function toggleSound() {
        if (this.sound.enabled) {
            $('#sound').css('background-image', 'url(gfx/sound_disabled.png)');
            this.sound.enabled = false;
            for (var i = 0; i < this.allsounds.length; i++) {
                this.allsounds[i].volume = 0;
            }
        }
        else {
            $('#sound').css('background-image', 'url(gfx/sound_enabled.png)');
            this.sound.enabled = true;
            for (var i = 0; i < this.allsounds.length; i++) {
                this.allsounds[i].volume = 1;
            }
        }
        dataSaver.saveData(this.sE, JSON.stringify(this.sound));
    }
    soundplayer.toggleSound = toggleSound;
    function enableMusic() {
        $('#music').css('background-image', 'url(gfx/music_enabled.png)');
        this.music = {
            enabled: true
        };
        dataSaver.saveData(this.mE, JSON.stringify(this.music));
        this.menumusic.volume = 0.5;
        this.creating_solution_music.volume = 0.5;
    }
    soundplayer.enableMusic = enableMusic;
    function disableMusic() {
        $('#music').css('background-image', 'url(gfx/music_disabled.png)');
        this.music = {
            enabled: false
        };
        dataSaver.saveData(this.mE, JSON.stringify(this.music));
        this.menumusic.volume = 0;
        this.creating_solution_music.volume = 0;
    }
    soundplayer.disableMusic = disableMusic;
    function enableSound() {
        $('#sound').css('background-image', 'url(gfx/sound_enabled.png)');
        this.sound = {
            enabled: true
        };
        dataSaver.saveData(this.sE, JSON.stringify(this.music));
        for (var i = 0; i < this.allsounds.length; i++) {
            this.allsounds[i].volume = 1;
        }
    }
    soundplayer.enableSound = enableSound;
    function disableSound() {
        $('#sound').css('background-image', 'url(gfx/sound_disabled.png)');
        this.sound = {
            enabled: false
        };
        dataSaver.saveData(this.sE, JSON.stringify(this.music));
        for (var i = 0; i < this.allsounds.length; i++) {
            this.allsounds[i].volume = 0;
        }
    }
    soundplayer.disableSound = disableSound;
})(soundplayer || (soundplayer = {}));
/*
* Shims for better browser support.
*/
var shims;
(function (shims) {
    function init() {
        _pageXYOffset();
        _dateNow();
        _requestAnimationFrame(); // for opera
        _garbageCollection();
        _classList(); // for IE9
        _array();
        _autoResize();
        dnd.init(); // tablets
    }
    shims.init = init;
    /** This makes sure the game is always scaled so that it fits the screen.
    This is done by using CSS "transform" on the div with id "scaledViewport". */
    function _autoResize() {
        var dpr = 1.0; // display pixel ratio
        if (typeof window['devicePixelRatio'] !== 'undefined')
            dpr = window['devicePixelRatio'];
        else if (document.documentElement.clientWidth > 0 && window.screen.availWidth > 0)
            dpr = window.screen.availWidth / document.documentElement.clientWidth;
        // see http://blogs.windows.com/windows_phone/b/wpdev/archive/2012/11/08/internet-explorer-10-brings-html5-to-windows-phone-8-in-a-big-way.aspx
        // To learn about scaling just search the web for "a pixel is not a pixel". Articles about this usualy contain that phrase.
        // The goal of this is to use only CSS pixels and map them the actual physical pixels on the screen. 
        window.onresize = function (event) {
            // The amount of visible CSS pixels is prefered, so that the scaling actually fits the viewport.
            var clientWidth = window.innerWidth || document.documentElement.clientWidth || screen.availWidth || screen.width;
            var clientHeight = window.innerHeight || document.documentElement.clientHeight || screen.availHeight || screen.height;
            if (clientWidth > 0) {
                var width = 1280, height = 660; //landscape
                if (clientHeight > clientWidth) {
                    // portrait:
                    width = 768;
                    height = 1024;
                }
                scale = Math.min(clientWidth / width, clientHeight / height);
                scale = Math.floor(scale * 1000) / 1000;
                (['scaledViewport', 'dragImage', 'close_credits']).forEach(function (s) {
                    transform(window.document.getElementById(s), 'scale(' + scale + ',' + scale + ')', '0% 0% !important');
                });
                // The Wrapper-Div is just used to center the content in it:
                var wrapper = window.document.getElementById('wrapper');
                wrapper.style.height = (clientHeight) + 'px';
                wrapper.style.paddingTop = Math.floor((clientHeight - height * scale) / 2) + 'px';
                wrapper.style.paddingLeft = Math.floor((clientWidth - width * scale) / 2) + 'px';
                var hint = null;
                var triangle = null;
                var direction;
                (['right', 'left', 'down', 'up', 'level']).forEach(function (s) {
                    if ($('#hint_' + s).is(':visible')) {
                        hint = document.getElementById('hint_' + s);
                        direction = s;
                    }
                });
                if (hint == null || hint == undefined)
                    return;
                triangle = hint.querySelector('.triangle'); // could be null!
                var textDiv = hint.querySelector('div.text');
                var rEl = document.getElementById(view.GAMEPLAY.id_hint_el).getBoundingClientRect();
                // draw the hint where it is not visible to get the actual size:
                textDiv.style.maxWidth = hint.style.maxWidth = Math.round(700 * scale) + 'px';
                var border = Math.ceil(4 * scale);
                textDiv.style.borderWidth = border + 'px';
                hint.style.top = hint.style.left = '-1000px';
                hint.style.fontSize = Math.round(20 * scale) + 'px';
                hint.style.display = 'block';
                if (triangle)
                    triangle.style.width = triangle.style.height = Math.ceil(scale * 29) + 'px';
                var rHint = hint.getBoundingClientRect();
                if (direction === 'right') {
                    hint.style.left = Math.floor(rEl.left - rHint.width) + 'px';
                    hint.style.top = Math.floor(rEl.top + (rEl.height / 2) - (40 * scale)) + 'px';
                    triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Right.png)';
                    triangle.style.left = '-' + border + 'px';
                    triangle.style.top = (scale * 20) + 'px';
                }
                else if (direction === 'down') {
                    if (rEl.left > rHint.width) {
                        hint.style.left = Math.floor(rEl.right - rHint.width) + 'px';
                        triangle.style.left = Math.floor(rHint.width - (rEl.width / 2) - (15 * scale)) + 'px';
                    }
                    else {
                        hint.style.left = Math.floor(rEl.left) + 'px';
                        triangle.style.left = Math.floor((rEl.width / 2) - (15 * scale)) + 'px';
                    }
                    hint.style.top = Math.floor(rEl.top - (rHint.height)) + 'px';
                    triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Down.png)';
                    triangle.style.top = '-' + border + 'px';
                }
                else if (direction === 'up') {
                    hint.style.left = Math.floor(rEl.left + rEl.width / 2 - rHint.width / 2) + 'px';
                    //triangle.style.left = Math.floor((rEl.width / 2) - (15 * scale)) + 'px'
                    hint.style.top = Math.ceil(rEl.bottom) + 'px';
                    triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Up.png)';
                    triangle.style.top = border + 'px';
                }
                else if ('gameplay' === view.GAMEPLAY.id_hint_el) {
                    hint.style.left = Math.floor((rEl.width - rHint.width) / 2 + rEl.left) + 'px';
                    hint.style.top = Math.floor((rEl.height - rHint.height) / 2 + rEl.top) + 'px';
                }
                else {
                    hint.style.left = Math.floor(rEl.right - rHint.width) + 'px';
                    hint.style.top = Math.floor(rEl.bottom + 10 * scale) + 'px';
                }
            }
        };
        window.onresize(null);
        window.addEventListener('onorientationchange', window.onresize, false);
    }
    shims._autoResize = _autoResize;
    var scale = 1;
    function getScale() { return scale; }
    shims.getScale = getScale;
    function setTextContent(e, text) {
        if (typeof (e.innerText) !== 'undefined')
            e.innerText = text;
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
    shims.setTextContent = setTextContent;
    function setHTMLContent(e, html) {
        if (typeof (e.innerHTML) !== 'undefined')
            e.innerHTML = html;
        else
            setTextContent(e, html);
    }
    shims.setHTMLContent = setHTMLContent;
    function _pageXYOffset() {
        if (typeof window.pageXOffset === 'number')
            return;
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
                var id = window.setTimeout(function () {
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
            Array.prototype.filter = function (fun, thisp) {
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
            Array.prototype.forEach = function forEach(callback, thisArg) {
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
        if (window['gc'])
            return;
        var myGC = null;
        if (window['CollectGarbage'])
            myGC = window['CollectGarbage'];
        else if (window['opera'] && window['opera']['collect'])
            window['gc'] = window['opera']['collect'];
        if (myGC)
            window['gc'] = function () { setTimeout(myGC, 33); };
        else
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
        var classListProp = "classList", protoProp = "prototype", elemCtrProto = (HTMLElement || Element)[protoProp], objCtr = Object, strTrim = String[protoProp].trim || function () {
            return this.replace(/^\s+|\s+$/g, "");
        }, arrIndexOf = Array[protoProp].indexOf || function (item) {
            var i = 0, len = this.length;
            for (; i < len; i++) {
                if (this[i] === item) {
                    return i;
                }
            }
            return -1;
        }, DOMEx = function (type, message) {
            this.name = type;
            this.code = DOMException[type];
            this.message = message;
        }, checkTokenAndGetIndex = function (classList, token) {
            if (token === "") {
                throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
            }
            if (/\s/.test(token)) {
                throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
            }
            return arrIndexOf.call(classList, token);
        }, ClassList = function (elem) {
            var trimmedClasses = strTrim.call(elem.className), classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [], i = 0, len = classes.length;
            for (; i < len; i++) {
                this.push(classes[i]);
            }
            this._updateClassName = function () {
                elem.className = this.toString();
            };
        }, classListProto = ClassList[protoProp] = [], classListGetter = function () {
            return new ClassList(this);
        };
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
            var tokens = arguments, i = 0, l = tokens.length, token, updated = false;
            do {
                token = tokens[i] + "";
                if (checkTokenAndGetIndex(this, token) === -1) {
                    this.push(token);
                    updated = true;
                }
            } while (++i < l);
            if (updated) {
                this._updateClassName();
            }
        };
        classListProto['remove'] = function () {
            var tokens = arguments, i = 0, l = tokens.length, token, updated = false;
            do {
                token = tokens[i] + "";
                var index = checkTokenAndGetIndex(this, token);
                if (index !== -1) {
                    this.splice(index, 1);
                    updated = true;
                }
            } while (++i < l);
            if (updated) {
                this._updateClassName();
            }
        };
        classListProto['toggle'] = function (token, forse) {
            token += "";
            var result = this.contains(token), method = result ?
                forse !== true && "remove"
                :
                    forse !== false && "add";
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
                get: classListGetter,
                enumerable: true,
                configurable: true
            };
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
        else if (objCtr[protoProp].__defineGetter__) {
            elemCtrProto.__defineGetter__(classListProp, classListGetter);
        }
    }
    /** transform-property on all browsers: */
    function transform(el, t, origin) {
        if (origin === void 0) { origin = '50% 50% !important'; }
        var props = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
        props.forEach(function (p) {
            el.style[p] = t;
        });
        var props = ["transformOrigin", "webkitTransformOrigin", "MozTransformOrigin", "msTransformOrigin", "OTransformOrigin"];
        props.forEach(function (p) {
            el.style[p] = origin;
        });
    }
    shims.transform = transform;
    /** "dnd" = Drag And Drop. Works with mouse, touch and pencil. */
    var dnd;
    (function (dnd) {
        /** Function that indicates if DnD is allowed right now.
            It is injected by the Controller (ctrl).
            It needs to be exported, so that it can be called from the closures in this module. */
        dnd.isDnDAllowed = function () { return false; };
        function setDnDAllowedIndicator(f) {
            this.isDnDAllowed = f;
        }
        dnd.setDnDAllowedIndicator = setDnDAllowedIndicator;
        function init() {
            if (!window.navigator)
                window.navigator = { msPointerEnabled: false };
            // "dragImage" is an element just to be displayed under the finger (or pencil) 
            // while being dragged. It will display the command that is dragged.
            // This is necessary because browsers don't support native drag and drop for touch.
            var dragImage = document.getElementById('dragImage');
            ['MSPointerUp', 'touchend', 'mouseup'].forEach(function (s) {
                dragImage.addEventListener(s, function (evt) {
                    if (DATA_TRANSFER.isDragging && dnd.isDnDAllowed())
                        if (evt.stopPropagation)
                            evt.stopPropagation();
                    if (evt.preventDefault)
                        evt.preventDefault();
                    DATA_TRANSFER.isDragging = false;
                    dragImage.style.display = 'none';
                    setTimeout(function () {
                        var evt2 = new DNDEvent(evt, null, DATA_TRANSFER);
                        var target = evt2.getTarget();
                        if (!target['onDropListener'])
                            target = target.parentElement;
                        if (target['onDropListener'])
                            target['onDropListener'](evt2);
                    }, 32);
                }, false);
            });
        }
        dnd.init = init;
        /** A Drag&Drop-Event. Designed to resemble original DragEvent.  */
        var DNDEvent = (function () {
            function DNDEvent(event, target, dataTransfer) {
                this.event = event;
                this.target = target;
                this.dataTransfer = dataTransfer;
                this.left = -200;
                this.top = -200;
                var e = event;
                if (e['changedTouches'] && e['changedTouches'].item(0))
                    e = e['changedTouches'].item(0);
                else if (e['touches'] && e['touches'].item(0))
                    e = e['touches'].item(0);
                var offsetX = window.pageXOffset || window['scrollX'] || document.body.scrollLeft;
                var offsetY = window.pageYOffset || window['scrollY'] || document.body.scrollTop;
                if (e.pageX || e.pageY) {
                    this.left = e.pageX;
                    this.top = e.pageY;
                }
                else if ((e.clientX || e.clientY) &&
                    document.body &&
                    document.body.scrollLeft != null) {
                    this.left = e.clientX + offsetX;
                    this.top = e.clientY + offsetY;
                }
                else if (target) {
                    var rect = target.getBoundingClientRect();
                    this.left = offsetX + rect.left + (rect.width / 2);
                    this.top = offsetY + rect.top + (rect.height / 2);
                }
                if (!target)
                    this.target = document.elementFromPoint(this.left, this.top);
            }
            DNDEvent.prototype.getTarget = function () {
                return this.target;
            };
            DNDEvent.prototype.getDataTransfer = function () {
                return this.dataTransfer;
            };
            DNDEvent.prototype.getEvent = function () {
                return this.event;
            };
            /** Absolute position "left" of event. */
            DNDEvent.prototype.getLeft = function () {
                return this.left;
            };
            /** Absolute position "top" of event. */
            DNDEvent.prototype.getTop = function () {
                return this.top;
            };
            /** Transformed position "left" of event. */
            DNDEvent.prototype.getScaledLeft = function () {
                return Math.round(this.left / scale);
            };
            /** Transformed position "top" of event. */
            DNDEvent.prototype.getScaledTop = function () {
                return Math.round(this.top / scale);
            };
            return DNDEvent;
        }());
        dnd.DNDEvent = DNDEvent;
        /**
         HACK: -removed GENERICS from datatype definition (before: var DATA_TRANSFER = <DataTransferShim> {})
               -added "items: null" to prevent errors
         */
        var DATA_TRANSFER = {
            effectAllowed: 'all',
            dropEffect: 'move',
            types: null,
            files: null,
            data: "grab,0,0",
            clearData: function (format) { this.data = null; return true; },
            setData: function (format, data) { this.data = data; return true; },
            getData: function (format) { return this.data; },
            isDragging: false,
            element: null,
            items: null
        };
        /** Register an event listener to some html element to be invoked on the start of a drag&drop operation. */
        function registerDrag(element, listener) {
            // works for dragstart, touchstart and MSPointerDown
            var evetns = ['mousedown', 'touchstart'];
            if (window.navigator.msPointerEnabled)
                evetns = ['MSPointerDown'];
            evetns.forEach(function (s) {
                element.addEventListener(s, function (evt) {
                    if (!dnd.isDnDAllowed())
                        return;
                    if (evt.dataTransfer)
                        DATA_TRANSFER = evt.dataTransfer;
                    else
                        evt.dataTransfer = DATA_TRANSFER;
                    DATA_TRANSFER.isDragging = true;
                    DATA_TRANSFER.element = element;
                    listener(new DNDEvent(evt, element, DATA_TRANSFER));
                    // This is logic that should go to the view or controller...
                    // It's only here because we need some shim for Drag and Drop for touch.
                    var dragImage = document.getElementById('dragImage');
                    dragImage.className = 'tool ' + element.className.split(' ').pop();
                    if ('move' === DATA_TRANSFER.dropEffect)
                        // "cmd-noop" or "cmd-nocond":
                        element.className = 'cmd-no' + (element.id.match(/^[a-z]+/)[0]);
                    // MSIE will use this, touch devices invoke it on "touchmove":
                    window.onmousemove = function (evt2) {
                        //FIXME: check if this really was unrequired
                        //evt2 = evt2 || window.event; // MSIE
                        if (DATA_TRANSFER.isDragging) {
                            var evt3 = new DNDEvent(evt2, dragImage, DATA_TRANSFER);
                            dragImage.style.left = (Math.round(evt3.getLeft()) - 25) + 'px';
                            dragImage.style.top = (Math.round(evt3.getTop()) - 27) + 'px';
                            dragImage.style.display = 'block';
                        }
                        else {
                            window.document.body.removeEventListener('touchmove', window.onmousemove, true);
                            window.onmousemove = null;
                        }
                    };
                    window.document.body.addEventListener('touchmove', window.onmousemove, true);
                    window.onmousemove(evt);
                }, false);
            });
        }
        dnd.registerDrag = registerDrag;
        /** Register an event listener to some html element to be invoked on the drop of a drag&drop operation. */
        function registerDrop(element, listener) {
            var events = ['mouseup', 'touchend'];
            if (window.navigator.msPointerEnabled)
                events = ['MSPointerUp'];
            else
                ['dragover', 'touchmove'].forEach(function (s) {
                    element.addEventListener(s, function (evt) {
                        if (evt.preventDefault)
                            evt.preventDefault();
                    }, false);
                });
            element['onDropListener'] = listener;
            events.forEach(function (s) {
                element.addEventListener(s, function (evt) {
                    if (!dnd.isDnDAllowed())
                        return;
                    //if (evt.stopPropagation)
                    //evt.stopPropagation()
                    //if (evt.preventDefault)
                    //evt.preventDefault()
                    // Most browsers create a new DataTransfer-object (for whatever reason).
                    // This is rather annoying because one can't just add custom fields.
                    // isDragging would be such a custom field, so we simply copy it from the 
                    // reference to the original object (which would contain the same information).
                    var isDragging = DATA_TRANSFER.isDragging;
                    if (evt.dataTransfer)
                        DATA_TRANSFER = evt.dataTransfer;
                    else
                        evt.dataTransfer = DATA_TRANSFER;
                    DATA_TRANSFER.isDragging = isDragging;
                    document.getElementById('dragImage').style.display = 'none';
                    // new we "see" what's behind the dragImage:
                    var evt2 = new DNDEvent(evt, (s === 'drop' ? element : null), DATA_TRANSFER);
                    if (!DATA_TRANSFER.isDragging) {
                        // elements with "onlick" defined want to be clicked.
                        // But some browsers (eg MSIE) would then click twice.
                        // Opera Mobile ("OPR") would not click at all:
                        if (evt2.getTarget().onclick && navigator.userAgent.match(/OPR\//) !== null) {
                            evt2.getTarget().onclick.apply(evt2.getTarget(), evt);
                        }
                    }
                    else {
                        window.document.body.removeEventListener('touchmove', window.onmousemove, true);
                        window.onmousemove = null;
                        DATA_TRANSFER.isDragging = false;
                        listener(evt2);
                    }
                }, false); // "useCapture" must be false! (Or else #gameplay would capture all.)
            });
        }
        dnd.registerDrop = registerDrop;
    })(dnd = shims.dnd || (shims.dnd = {}));
})(shims || (shims = {}));
/** The Stack Machine. */
var sm;
(function (sm) {
    /** Each Stack-Frame is just a pointer to a register, where execution should continue. */
    var StackFrame = (function () {
        function StackFrame(program, register) {
            this.program = program;
            this.register = register;
        }
        /** Program 1 - 4 where execution will continue on exit of program.
         * End of all code is reachend when no StackFrames are left.
         */
        StackFrame.prototype.getProgram = function () {
            return this.program;
        };
        /** Register 0 - 8, where 8 is after the end of program.
         * This points to the register where execution will continue on exit of program. */
        StackFrame.prototype.getRegister = function () {
            return this.register;
        };
        return StackFrame;
    }());
    var Step = (function () {
        function Step(prog, reg, command, finished, st) {
            this.prog = prog;
            this.reg = reg;
            this.command = command;
            this.finished = finished;
            this.st = st;
        }
        Step.prototype.getProgram = function () {
            return this.prog;
        };
        Step.prototype.getRegister = function () {
            return this.reg;
        };
        /** Command of this step. Is null IFF this is the last step. */
        Step.prototype.getCommand = function () {
            return this.command;
        };
        /** A Copy of the stack trace of the stack machine. */
        Step.prototype.getStackTrace = function () {
            return this.st.slice(0);
        };
        Step.prototype.isFinished = function () {
            return this.finished;
        };
        return Step;
    }());
    var StackMachine = (function () {
        function StackMachine(code, cargo) {
            this.code = code;
            this.cargo = cargo;
            /** Stack Trace. */
            this.stack = new Array();
            this.finished = false;
        }
        StackMachine.prototype.reset = function () {
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
        };
        StackMachine.prototype.step = function () {
            var step = new Step(this.nextProg, this.nextReg, this.nextCmd, this.finished, this.stack.slice(0));
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
            var crate;
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
                    }
                    else {
                        var sf = this.stack.pop();
                        this.nextProg = sf.getProgram();
                        this.nextReg = sf.getRegister();
                    }
                }
                else {
                    this.nextReg++;
                }
                this.nextCmd = this.code.getCommand(this.nextProg, this.nextReg);
            }
            return step;
        };
        return StackMachine;
    }());
    function createStackMachine(code, cargo) {
        return new StackMachine(code, cargo);
    }
    sm.createStackMachine = createStackMachine;
})(sm || (sm = {}));
var tsUnit;
(function (tsUnit) {
    var Test = (function () {
        function Test() {
            this.tests = [];
            this.testClass = new TestClass();
        }
        Test.prototype.addTestClass = function (testClass, name) {
            if (name === void 0) { name = 'Tests'; }
            this.tests.push(new TestDefintion(testClass, name));
        };
        Test.prototype.isReservedFunctionName = function (functionName) {
            for (var prop in this.testClass) {
                if (prop === functionName) {
                    return true;
                }
            }
            return false;
        };
        Test.prototype.run = function () {
            var testContext = new TestContext();
            var testResult = new TestResult();
            for (var i = 0; i < this.tests.length; ++i) {
                var testClass = this.tests[i].testClass;
                var testName = this.tests[i].name;
                for (var prop in testClass) {
                    if (!this.isReservedFunctionName(prop)) {
                        if (typeof testClass[prop] === 'function') {
                            if (typeof testClass['setUp'] === 'function') {
                                testClass['setUp']();
                            }
                            try {
                                testClass[prop](testContext);
                                testResult.passes.push(new TestDescription(testName, prop, 'OK'));
                            }
                            catch (err) {
                                testResult.errors.push(new TestDescription(testName, prop, err));
                            }
                            if (typeof testClass['tearDown'] === 'function') {
                                testClass['tearDown']();
                            }
                        }
                    }
                }
            }
            return testResult;
        };
        Test.prototype.showResults = function (target, result) {
            var template = '<article>' +
                '<h1>' + this.getTestResult(result) + '</h1>' +
                '<p>' + this.getTestSummary(result) + '</p>' +
                '<section id="tsFail">' +
                '<h2>Errors</h2>' +
                '<ul class="bad">' + this.getTestResultList(result.errors) + '</ul>' +
                '</section>' +
                '<section id="tsOkay">' +
                '<h2>Passing Tests</h2>' +
                '<ul class="good">' + this.getTestResultList(result.passes) + '</ul>' +
                '</section>' +
                '</article>';
            target.innerHTML = template;
        };
        Test.prototype.getTestResult = function (result) {
            return result.errors.length === 0 ? 'Test Passed' : 'Test Failed';
        };
        Test.prototype.getTestSummary = function (result) {
            return 'Total tests: <span id="tsUnitTotalCout">' + (result.passes.length + result.errors.length).toString() + '</span>. ' +
                'Passed tests: <span id="tsUnitPassCount" class="good">' + result.passes.length + '</span>. ' +
                'Failed tests: <span id="tsUnitFailCount" class="bad">' + result.errors.length + '</span>.';
        };
        Test.prototype.getTestResultList = function (testResults) {
            var list = '';
            var group = '';
            var isFirst = true;
            for (var i = 0; i < testResults.length; ++i) {
                var result = testResults[i];
                if (result.testName !== group) {
                    group = result.testName;
                    if (isFirst) {
                        isFirst = false;
                    }
                    else {
                        list += '</li></ul>';
                    }
                    list += '<li>' + result.testName + '<ul>';
                }
                list += '<li>' + result.funcName + '(): ' + result.message + '</li>';
            }
            return list + '</ul>';
        };
        return Test;
    }());
    tsUnit.Test = Test;
    var TestContext = (function () {
        function TestContext() {
        }
        TestContext.prototype.setUp = function () { };
        TestContext.prototype.tearDown = function () { };
        TestContext.prototype.areIdentical = function (a, b) {
            if (a !== b) {
                throw 'areIdentical failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" and ' +
                    '{' + (typeof b) + '} "' + b + '"';
            }
        };
        TestContext.prototype.areNotIdentical = function (a, b) {
            if (a === b) {
                throw 'areNotIdentical failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" and ' +
                    '{' + (typeof b) + '} "' + b + '"';
            }
        };
        TestContext.prototype.isTrue = function (a) {
            if (!a) {
                throw 'isTrue failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '"';
            }
        };
        TestContext.prototype.isFalse = function (a) {
            if (a) {
                throw 'isFalse failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '"';
            }
        };
        TestContext.prototype.isTruthy = function (a) {
            if (!a) {
                throw 'isTrue failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '"';
            }
        };
        TestContext.prototype.isFalsey = function (a) {
            if (a) {
                throw 'isFalse failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '"';
            }
        };
        TestContext.prototype.throws = function (a) {
            var isThrown = false;
            try {
                a();
            }
            catch (ex) {
                isThrown = true;
            }
            if (!isThrown) {
                throw 'did not throw an error';
            }
        };
        TestContext.prototype.fail = function () {
            throw 'fail';
        };
        return TestContext;
    }());
    tsUnit.TestContext = TestContext;
    var TestClass = (function (_super) {
        __extends(TestClass, _super);
        function TestClass() {
            _super.apply(this, arguments);
        }
        return TestClass;
    }(TestContext));
    tsUnit.TestClass = TestClass;
    var FakeFunction = (function () {
        function FakeFunction(name, delgate) {
            this.name = name;
            this.delgate = delgate;
        }
        return FakeFunction;
    }());
    tsUnit.FakeFunction = FakeFunction;
    var Fake = (function () {
        function Fake(obj) {
            for (var prop in obj) {
                if (typeof obj[prop] === 'function') {
                    this[prop] = function () { };
                }
                else {
                    this[prop] = null;
                }
            }
        }
        Fake.prototype.create = function () {
            return this;
        };
        Fake.prototype.addFunction = function (name, delegate) {
            this[name] = delegate;
        };
        Fake.prototype.addProperty = function (name, value) {
            this[name] = value;
        };
        return Fake;
    }());
    tsUnit.Fake = Fake;
    var TestDefintion = (function () {
        function TestDefintion(testClass, name) {
            this.testClass = testClass;
            this.name = name;
        }
        return TestDefintion;
    }());
    var TestError = (function () {
        function TestError(name, message) {
            this.name = name;
            this.message = message;
        }
        return TestError;
    }());
    var TestDescription = (function () {
        function TestDescription(testName, funcName, message) {
            this.testName = testName;
            this.funcName = funcName;
            this.message = message;
        }
        return TestDescription;
    }());
    tsUnit.TestDescription = TestDescription;
    var TestResult = (function () {
        function TestResult() {
            this.passes = [];
            this.errors = [];
        }
        return TestResult;
    }());
    tsUnit.TestResult = TestResult;
})(tsUnit || (tsUnit = {}));
/// <reference path="tsUnit.ts"/>
var MiscTests;
(function (MiscTests) {
    var ObserverTests = (function (_super) {
        __extends(ObserverTests, _super);
        function ObserverTests() {
            _super.apply(this, arguments);
            this.target = new obs.Observable();
        }
        ObserverTests.prototype.addObserver = function () {
            var check = 0;
            var callback;
            callback = function (o, msg) {
                check++;
            };
            this.target.subscribe(null, callback);
            this.target.setChanged();
            this.target.notify();
            this.areIdentical(check, 1);
        };
        return ObserverTests;
    }(tsUnit.TestClass));
    MiscTests.ObserverTests = ObserverTests;
})(MiscTests || (MiscTests = {}));
var CommandTests;
(function (CommandTests) {
    var CmdPoolTests = (function (_super) {
        __extends(CmdPoolTests, _super);
        function CmdPoolTests() {
            _super.apply(this, arguments);
        }
        CmdPoolTests.prototype.getNewCommand = function () {
            var c = cmd.getCommand(cmd.GRAB, cmd.NOCOND);
            this.areIdentical(c.getOperation(), cmd.GRAB);
            this.areIdentical(c.getCondition(), cmd.NOCOND);
            c = cmd.getCommand(cmd.GRAB, cmd.BLUE);
            this.areIdentical(c.getOperation(), cmd.GRAB);
            this.areIdentical(c.getCondition(), cmd.BLUE);
        };
        CmdPoolTests.prototype.getExistingCommand = function () {
            var c1 = cmd.getCommand(cmd.NOOP, cmd.NOCOND);
            this.areIdentical(c1.getOperation(), cmd.NOOP);
            this.areIdentical(c1.getCondition(), cmd.NOCOND);
            var c2 = cmd.getCommand(cmd.NOOP, cmd.NOCOND);
            this.areIdentical(c2.getOperation(), cmd.NOOP);
            this.areIdentical(c2.getCondition(), cmd.NOCOND);
            this.areIdentical(c1, c2);
        };
        return CmdPoolTests;
    }(tsUnit.TestClass));
    CommandTests.CmdPoolTests = CmdPoolTests;
})(CommandTests || (CommandTests = {}));
var MiscTests;
(function (MiscTests) {
    var Foo = (function () {
        function Foo() {
        }
        return Foo;
    }());
    ;
    var SomeTests = (function (_super) {
        __extends(SomeTests, _super);
        function SomeTests() {
            _super.apply(this, arguments);
        }
        SomeTests.prototype.someTest = function () {
            var foo = new Foo();
        };
        return SomeTests;
    }(tsUnit.TestClass));
    MiscTests.SomeTests = SomeTests;
})(MiscTests || (MiscTests = {}));
/*
var test = new tsUnit.Test();

test.addTestClass(new MiscTests.ObserverTests());
test.addTestClass(new CommandTests.CmdPoolTests());
test.addTestClass(new MiscTests.SomeTests());

test.showResults(document.getElementById('results'), test.run());*/ 
// NOTE: The text is just text. It can be used as html or as plain text in the code.
// There is no general rule if it is html or plain text, but in many cases 
// it is passed to shims.setTextContent(), in which case it is used as plain text.
// Hints are always plain text, with special placeholders (e.g. [grab]).
var translate;
(function (translate) {
    /**
     Sets the language to 'en' for English or 'de' for German.
     this unit needs to know the language to be used.
     if the user changes the language then a reload is needed.
     However, at the start up the user language may be unknown until the model is loaded.
     So 'en' is used until then.
    */
    function setLanguage(l) {
        if (l)
            language = l;
    }
    translate.setLanguage = setLanguage;
    var language = 'en';
    function getLanguage() {
        if (!language)
            return 'en';
        return language;
    }
    var Bundle = (function () {
        function Bundle() {
            this._bundles = {};
            this._texts = {};
        }
        Bundle.prototype.getBundle = function (id) {
            return this._bundles[id];
        };
        Bundle.prototype.getText = function (id, lang) {
            if (lang === void 0) { lang = getLanguage(); }
            return this._texts[id][lang];
        };
        Bundle.prototype.getMultiLangText = function (id) {
            return this._texts[id];
        };
        Bundle.prototype.setBundle = function (id, bundle) {
            return this._bundles[id] = bundle;
        };
        Bundle.prototype.setText = function (id, text) {
            this._texts[id] = text;
        };
        return Bundle;
    }());
    function getBundle(id) {
        return this[id];
    }
    translate.getBundle = getBundle;
    translate.loading = new Bundle();
    translate.credits = new Bundle();
    translate.main_menu = new Bundle();
    translate.level_pack = new Bundle();
    translate.gameplay = new Bundle();
    translate.you_got_it = new Bundle();
    translate.levels = new Bundle();
    translate.loading.setText('loading', {
        en: 'Loading',
        de: 'Lädt'
    });
    translate.loading.setText('ready', {
        en: 'Ready',
        de: 'Bereit'
    });
    translate.loading.setText('click2start', {
        en: 'Click to start the game.',
        de: 'Klick, um das Spiel zu starten.'
    });
    //credits.setText('',{en:'',de:''})
    translate.credits.setText('close', {
        en: 'Back to the game',
        de: 'Zurück zum Spiel'
    });
    // used on the button to show the credits:
    translate.credits.setText('show', {
        en: 'About this game',
        de: 'Über dieses Spiel'
    });
    // The longer text of the credits is in default.html and only one language is displayed.
    translate.main_menu.setText('level packs', {
        en: 'Level Packs',
        de: 'Level Packs'
    }); // header
    translate.main_menu.setText('click2play', {
        en: 'Click to Play',
        de: 'Klick zum Spielen'
    });
    translate.level_pack.setText('back', {
        en: 'BACK',
        de: 'ZURÜCK'
    });
    translate.gameplay.setText('goal', {
        en: 'GOAL',
        de: 'ZIEL'
    });
    translate.gameplay.setText('clearmessage', {
        en: 'Are you sure you want to clear your progress?',
        de: 'Bist du sicher, dass du deinen Fortschritt löschen möchtest?'
    });
    translate.gameplay.setText('stop2change', {
        en: 'Stop the animation to change the code.',
        de: 'Stoppe die Animation, um den Code zu ändern.'
    });
    translate.gameplay.setText('cancel', {
        en: 'CANCEL',
        de: 'ABBRUCH'
    });
    translate.gameplay.setText('clear', {
        en: 'CLEAR',
        de: 'CLEAR'
    });
    translate.you_got_it.setText('you got it', {
        en: 'YOU GOT IT',
        de: 'GESCHAFFT!'
    });
    translate.you_got_it.setText('shortest solution', {
        en: 'You found the shortest solution!',
        de: 'Du hast die kürzeste Lösung gefunden.'
    });
    // Note: this is html:
    translate.you_got_it.setText('unknown solution', {
        en: 'Congratulations, you found<br />an unknown solution.',
        de: 'Gratulation, du hast eine<br />unbekannte Lösung gefunden.'
    });
    // Here come the levels. We just need to make sure there is no circular dependancy!
    // That's why translate.ts knows nothing of level.ts.
    // Each level has an entry mapped to "hints", that can be displayed by clicking the "hints"-button.
    translate.levels.setText('dragOther', {
        en: 'Drag another element!',
        de: 'Nimm ein anderes Element!'
    });
    translate.levels.setText('drop', {
        en: 'Drop it here.',
        de: 'Lege es hier ab.'
    });
    translate.levels.setText('play', {
        en: 'Press play.',
        de: 'Drücke "Play".'
    });
    translate.levels.setText('stop', {
        en: 'Your program finished\nexecuting. Press stop',
        de: 'Dein Programm ist beendet.\nDrücke "Stopp"'
    });
    translate.levels.setText('short', {
        en: 'The shortest solution uses $1 registers.',
        de: 'Die kürzeste Lösung benötigt $1 Register.'
    });
    var cargo101 = new Bundle();
    translate.levels.setBundle('Cargo 101', cargo101);
    cargo101.setText('hints', {
        en: 'down, right, down',
        de: 'runter, rechts, runter'
    });
    cargo101.setText('A', {
        en: 'Program your claw,\ndrag [grab] to Prog 1.',
        de: 'Programmiere deinen Greifarm,\nziehe [grab] zu Prog 1.'
    });
    cargo101.setText('B', {
        en: 'Drag [right] to Prog 1.',
        de: 'Ziehe [right] zu Prog 1.'
    });
    cargo101.setText('C', {
        en: 'Drag [grab] to Prog 1.',
        de: 'Ziehe [grab] zu Prog 1.'
    });
    var transporter = new Bundle();
    translate.levels.setBundle('Transporter', transporter);
    transporter.setText('hints', {
        en: 'Reuse the solution from level 1 and loop through it.\n\n[short 4]',
        de: 'Verwende die Lösung aus dem Level 1 und bilde eine Schlaufe.\n\n[short 4]'
    });
    transporter.setText('yourself', {
        en: 'Now try it yourself. Move the\ncrate further as shown above',
        de: 'Jetzt versuche es selbst.\nVerschiebe die Kiste weiter,\nwie oben gezeigt'
    });
    var recurses = new Bundle();
    translate.levels.setBundle('Re-Curses', recurses);
    recurses.setText('hints', {
        en: 'Move one crate to the right, go back to the original position, and then loop.\n\n[short 5]',
        de: 'Bewege eine Kiste nach rechts, gehe zurück zur ersten Position und bilde eine Schlaufe.\n\n[short 5]'
    });
    recurses.setText('loop', {
        en: 'Create a loop\nDrag [prog1] to Prog1',
        de: 'Mach eine Schlaufe\nZiehe [prog1] zu Prog1'
    });
    recurses.setText('move', {
        en: 'You can also move\ncommands around. Pick it\nup from here to move it',
        de: 'Du kannst auch Befehle\nverschieben. Greife es hier,\num es zu bewegen'
    });
    recurses.setText('grab', {
        en: 'Drag [grab] to Prog1',
        de: 'Ziehe [grab] zu Prog1'
    });
    recurses.setText('well done', {
        en: 'Well done, the program is now looping\nTry to solve this level now using a loop',
        de: 'Gut gemacht! Die Schlaufe funktioniert.\nVersuche nun den Level mit einer Schlaufe zu lösen'
    });
    var inverter = new Bundle();
    translate.levels.setBundle('Inverter', inverter);
    inverter.setText('hints', {
        en: 'Move all four blocks one spot to the right, and repeat.\n\n[short 10]',
        de: 'Bewege alle vier Kisten um einen Platz nach rechts, wiederhole.\n\n[short 10]'
    });
    inverter.setText('use progs', {
        en: 'Use Progs to make your solutions shorter.\nShorter programs are awarded more stars',
        de: 'Verwende "Progs", um deine Lösungen\nzu verkürzen. Kürzere Programme erhalten\nmehr Sterne'
    });
    inverter.setText('move', {
        en: 'Move to Prog2',
        de: 'Verschiebe zu Prog2'
    });
    inverter.setText('drag', {
        en: 'Drag [prog2] to Prog1',
        de: 'Ziehe [prog2] zu Prog1'
    });
    inverter.setText('another', {
        en: 'Drag another one',
        de: 'Ziehe noch eines'
    });
    inverter.setText('each time', {
        en: 'Each time Prog2 is executed, its entire sequence is executed\n\n' + 'Press play to see how it works,\nand try to solve this level using Prog2',
        de: 'Jedes mal wenn Prog2 ausgeführt wird,\nwird die komplette Sequenz ausgeführt\n\n' + 'Drücke "Play" um zu sehen wie es funktioniert\nund versuche den Level mit Prog2 zu lösen.'
    });
    var fb2 = new Bundle();
    translate.levels.setBundle('From Beneath2', fb2);
    fb2.setText('A', {
        en: 'Conditional modifiers\nDrag [yellow] onto [right] in Prog1.\nIt will only execute if the claw\nis holding a yellow <img src="gfx/Crate_Yellow_2.png" width="20" height="20" alt="yellow" /> crate',
        de: 'Bedingungsüberprüfung\nZieh [yellow] auf [right] in Prog1.\nEs wird nur ausgefürht, \nwenn der Kran eine gelbe \n<img src="gfx/Crate_Yellow_2.png" width="20" height="20" alt="yellow" /> Kiste hält'
    });
    fb2.setText('B', {
        en: 'Drag [empty] onto [left] in Prog1.\nIt will only execute if the claw\nis not holding any crates',
        de: 'Zieh [empty] auf [left] in Prog1.\nEs wird nur ausgefürht wenn\nder Kran keine Kiste hält'
    });
    fb2.setText('C', {
        en: 'This is the step button. Press it to\nexecute a single instruction.',
        de: 'Das is der Schrittknopf. Drücke ihn\nund es wird ein Befehl ausgefürht.'
    });
    fb2.setText('D', {
        en: 'Press it at your own pace\nuntil the program is done',
        de: 'Drück ihn in deinem eigenen\nTempo bis das Programm beendet ist '
    });
    fb2.setText('E', {
        en: 'That\'s it!\n\nOne last thing: use this button\nto clear your work. Try it now.',
        de: 'Das ist es! \n\nEine letzte Sache: verwende diesen\nKnopf um deine Arbeit zu löschen.\nVersuche es jetzt.'
    });
    fb2.setText('F', {
        en: 'Good job, you\'ve completed the\ntutorial. Now go and have fun!\n(click/touch to continue)',
        de: 'Gut gemacht, du hast das Tutorial beendet.\nGeh und hab Spass.\n(Click/Touch um fortzufahren)'
    });
    translate.levels.setBundle('From Beneath', new Bundle()).setText('hints', {
        en: 'Go right once if holding blue, twice if holding yellow, and left if holding none.\nRepeat.\n\n[short 5]',
        de: 'Gehe um eins nach rechts bei blau, um zwei bei gelb und nach links, wenn leer.\nWiederhole.\n\n[short 5]'
    });
    translate.levels.setBundle('Go Left', new Bundle()).setText('hints', {
        en: 'Move each pile to the left. Repeat.\n\n[short 9]',
        de: 'Bewege jeden Stapel nach links. Wiederhole.\n\n[short 9]'
    });
    translate.levels.setBundle('Double Flip', new Bundle()).setText('hints', {
        en: 'Go right once if holding any, twice if holding blue, and left if holding none. Repeat.\n\n[short 5]',
        de: 'Gehe um eins nach rechts bei irgend einer Farbe, um zwei bei blau und nach links, wenn leer. Wiederhole.\n\n[short 5]'
    });
    translate.levels.setBundle('Go Left 2', new Bundle()).setText('hints', {
        en: 'Go right if holding none, and left if holding any. Repeat.\n\n[short 4]',
        de: 'Gehe nach rechts, wenn leer, nach links bei irgendeiner Farbe. Wiederhole.\n\n[short 4]'
    });
    translate.levels.setBundle('Shuffle Sort', new Bundle()).setText('hints', {
        // Original games uses "F2" instead of "Prog2"
        en: 'Alternate left and right, and make sure to use Prog2 to shorten your solution.\n\n[short 9]',
        de: 'Abwechselnd links und rechts, und verwende Prog2 um die Lösung kurz zu halten.\n\n[short 9]'
    });
    translate.levels.setBundle('Go the Distance', new Bundle()).setText('hints', {
        en: 'Go right if holding none, and left if holding red. Repeat.\n\n[short 4]',
        de: 'Gehe nach rechts, wenn leer und nach links, wenn rot. Wiederhole.\n\n[short 4]'
    });
    translate.levels.setBundle('Color Sort', new Bundle()).setText('hints', {
        // Original games uses "F1" instead of "Prog1"
        en: 'Go over each of the 3 piles and drop or pick up based on the color. When over the left pile drop if red, when over the right pile drop if green.\n\nThe shortest known solution uses 8 registers, all in Prog1.',
        de: 'Gehe über alle drei Stapel und greife aufgrund der Farbe. Wenn links, setze ab bei rot, wenn rechts, setze ab bei grün.\n\nDie kürzeste bekannte Lösung verwendet 8 Register, alle in Prog1.'
    });
    translate.levels.setBundle('Walking Piles', new Bundle()).setText('hints', {
        en: 'For a 3 star solution, move each pile 3 slots to the right, and then repeat. This method can be implemented with 10 registers.\n\nThe shortest known solution uses 9 registers (with an approach that is very specific to this configuration)',
        de: 'Für drei Sterne bewegst du jeden Stapel um drei Stellen nach Rechts. Diese Methode kann mit 10 Registern implementiert werden.\n\nDie kürzeste bekannte Lösung verwendet 9 Register (ein sehr spezifischer Ansatz für diese Konfiguration)'
    });
    translate.levels.setBundle('Repeat Inverter', new Bundle()).setText('hints', {
        en: 'It can be done with the usual 5 instructions and clever usage of conditional modifiers. Solutions with up to 7 instructions earn 3 stars.',
        de: 'Es kann mit den üblichen 5 Instruktionen und schlauer Verwendung von Bedingungen gelöst werden. Lösungen mit bis zu 7 Instruktionen erhalten 3 Sterne.'
    });
    translate.levels.setBundle('Double Sort', new Bundle()).setText('hints', {
        en: 'Sort, go right, sort, go left. Repeat. Use at most 14 instructions for 3 stars.\n\n[short 11]',
        de: 'Sortiere, nach rechts, sortiere, nach links. Wiederhole. Verwende höchstens 14 Instruktionen für 3 Sterne.\n\n[short 11]'
    });
    translate.levels.setBundle('Mirror', new Bundle()).setText('hints', {
        // Original games uses "F1" instead of "Prog1"
        en: 'Use at most 7 registers for 3 stars. There are various known solutions with 6 registers in Prog1, but no known solution with only 5.',
        de: 'Verwende höchstens 7 Instruktionen für 3 Sterne. Es sind mehrere Lösungen mit 6 Registern in Prog1 bekannt, aber keine mit nur 5.'
    });
    translate.levels.setBundle('Lay it out', new Bundle()).setText('hints', {
        en: 'Move the pile one slot to the right and bring one crate back to the left.\n\n\n\n[short 7]',
        de: 'Bewege den Stapel um eins nach rechts und bringe eine Kiste zurück nach links.\n\n\n\n[short 7]'
    });
    translate.levels.setBundle('The Stacker', new Bundle()).setText('hints', {
        en: 'Go left until you find an empty slot, and then move the last yellow crate one slot to the right. Repeat.\n\n[short 6]',
        de: 'Gehe nach links bis zum ersten leeren Platz, und bewege die letzte gelbe Kiste eins nach rechts. Wiederhole.\n\n[short 6]'
    });
    translate.levels.setBundle('Clarity', new Bundle()).setText('hints', {
        en: 'A disguised version of Mirror.',
        de: 'Eine verschleierte Version von Mirror.'
    });
    translate.levels.setBundle('Come Together', new Bundle()).setText('hints', {
        // Original games uses "F2" instead of "Prog2"
        en: 'You can go right and find a yellow crate, but when bringing it back how do you know when to stop so that you don\'t crash into the wall?\n\nIn Prog2 use the programming stack to count the number of times you have to go right until you find a yellow crate, then go back left that same number of times.\nAnother way to look at it: Prog2 is a recursive function that goes right until it finds a crate, and then it goes back to the original position.It can be implemented with 4 registers.\n\nThe shortest known solution uses a total of 7 registers',
        de: 'Du gehst nach rechts und findest eine gelbe Kiste. Aber wenn du zurück gehst — wie weisst du, wann du anhalten musst um nicht gegen die Wand zu fahren?\n\nIn Prog2, verwende den Aufruf-Stack, um die Anzahl Bewegungen nach rechts zu zählen bis eine Kiste gefunden ist, dann gehe geich oft nach links.\nEine andere Ansichtsweise: Prog2 ist eine rekursive Funktion die nach rechts geht bis eine gelbe Kiste gefunden wurde, und dann geht sie zurück zur Anfangsposition. Dies benötigt 4 Register.\n\Die kürzeste Lösung benötigt insgesamt 7 Register.'
    });
    translate.levels.setBundle('Come Together 2', new Bundle()).setText('hints', {
        en: 'Another stack puzzle. Re-use the solution from the previous level with a small modification.\n\n[short 8]',
        de: 'Ein weiteres Aufruf-Stack-Puzzle. Verwende nochmals die Lösung vom letzten Level mit einer kleinen Anpassung.\n\n[short 8]'
    });
    translate.levels.setBundle('Up The Greens', new Bundle()).setText('hints', {
        en: 'Very similar to the previous two levels but let the stack unwind and reset when you find a green. To do this only go left if holding a blue.\n\n[short 7]',
        de: 'Sehr ähnlich zu den vorherigen zwei Levels aber lasse den Aufruf-Stack bei einer grünen Kiste abbauen. Dazu gehst du nur nach links bei blau.\n\n[short 7]'
    });
    translate.levels.setBundle('Fill The Blanks', new Bundle()).setText('hints', {
        en: 'As in the "Lay It Out" level, move the entire pile one slot to the right and bring one crate back to the left, except in the first iteration.n\n[short 11]',
        de: 'Wie im Level "Lay It Out". Bewege den ganzen Stabel um eins nach rechts und bringe eine Kiste zurück nach links, ausser beim ersten Durchgang.n\n[short 11]'
    });
    translate.levels.setBundle('Count The Blues', new Bundle()).setText('hints', {
        en: 'Another stack puzzle. The number of blues indicates how many times to go right with the yellow.\n\n[short 9]',
        de: 'Ein weiteres Aufruf-Stack-Puzzle. Die Anzahl blauer Kisten gibt an, wie weit die gelbe Kiste nach rechts soll.\n\n[short 9]'
    });
    translate.levels.setBundle('Multi Sort', new Bundle()).setText('hints', {
        en: 'Come Together for yellows, The Stacker for blues. Go forward until you find a crate. If blue, move it one slot further and come all the way back (using the stack) empty handed. If yellow, bring it back and drop it. Repeat.\n\n[short 11]',
        de: '<i>Come Together</i> für Gelb, <i>The Stacker</i> für Blau. Gehe vorwärts bis du eine Kiste findest. Wenn blau, dann eins weiter und dann ohne Kiste alles zurück (mit dem Aufruf-Stack). Wenn gelb, dann bring sie zurück und stell sie hin. Wiederhole.\n\n[short 11]'
    });
    //TODO : More translation needed!
    translate.levels.setBundle('Divide by two', new Bundle()).setText('hints', {
        en: 'Wind up the stack for every two crates. Move one crate back each time it unwinds.\n\n[short 12]',
        de: 'Wickle den Stapel für alle zwei Kisten ab. Bewege jedes Mal eine Kiste zurück, wenn sie sich abwickelt.\n\n[short 12]'
    });
    translate.levels.setBundle('The Merger', new Bundle()).setText('hints', {
        en: 'Use the stack once in each blue, and unwind it in each red.\n\n[short 6].',
        de: 'Verwende den Stapel einmal für jede Blaue Kiste, und stell es bei jeder roten Kiste ab.\n\n[short 6].'
    });
    translate.levels.setBundle('Even the Odds', new Bundle()).setText('hints', {
        en: 'If the pile has an odd number of crates, leave one crate behind, otherwise move all of them. Use a sequence of moves that undoes itself when repeated to move the crates right, and make sure to execute it an even number of times.\n\n[short 10].',
        de: 'Wenn der Stapel eine ungerade Zahl von Kisten hat, lass eine Kiste zurück, ansonst bewegst du alle. Verwende eine Folge von Bewegungen, die sich, wenn wiederholt, aufmacht, um die rechten Kisten zu bewegen und um sicher zu gehen, dass es eine gerade Anzahl Durchführungen gibt.\n\n[short 10].'
    });
    translate.levels.setBundle('Genetic Code', new Bundle()).setText('hints', {
        en: 'The left pile gives instructions for how to construct the right pile. Wind up the entire stack on the left and unwind on the right.\n\n[short 17].',
        de: 'Der linke Stapel erteilt Weisungen dafür, wie man den rechten Stapel baut. Wickle den kompletten Stapel links ab und stellen ihn rechts ab.\n\n[short 17].'
    });
    translate.levels.setBundle('Multi Sort 2', new Bundle()).setText('hints', {
        en: 'Go over each pile and either pick up conditional on none if over the even slots, or drop conditional on the corresponding color if over the odd slots.\n\n[short 17].',
        de: 'Geh durch jeden Stapel und entweder nimmst du keine Kiste (bei gleicher Anzahl) oder beim Fall der entprechenden Farbe wenn du über die sonderbaren Ablagefächer gehst.\n\n[short 17].'
    });
    translate.levels.setBundle('The Swap', new Bundle()).setText('hints', {
        en: 'Merge the piles in the middle, change parity, and unmerge.\n\n[short 10].',
        de: 'Füg die Stapel in der Mitte zusammen und ändere die gerade Anzahl und nimm sie auseinander.\n\n[short 10].'
    });
    translate.levels.setBundle('Restoring Order', new Bundle()).setText('hints', {
        en: 'For each pile move the reds one slot to the right and the blues one slot to the left, but make sure to wind up a stack for the blues so that you can put them back afterwards. Repeat for each pile.\n\n[short 16].',
        de: 'Für jeden Stapel bewege die roten Kisten einen Platz nach rechts und die blauen Kisten nach links, aber stell sicher, dass du jeden Stapel durchgest, so dass du sie später alle zurückstellen kannst. Wiederholen für jeden Stapel.\n\n[short 16].'
    });
    translate.levels.setBundle('Changing Places', new Bundle()).setText('hints', {
        en: 'Switch each pair of piles, in place. First move the left pile to the right, winding up the stack. Then move all crates to the left slot. Finally, unwind the stack moving a crate to the right each time.\n\n[short 17].',
        de: 'Wechsle den Platz von jedem Stapel. Bewege zuerst den linken Stapel nach rechts, wickle den Stapel auf. Dann bewegst du alle Kisten zum linken Ablagefach. Wickle schließlich den Stapel ab und bewegen jeweils eine Kiste nach rechts.\n\n[short 17].'
    });
    translate.levels.setBundle('Palette Swap', new Bundle()).setText('hints', {
        en: 'Go left and go right. Each time you do so, wind up the stack. When no more crates are left, unwind the stack going left and going right. Repeat. \n\n[short 15].',
        de: 'Geh nach links und rechts. Jedes Mal wenn du dies machst, wickelst du den Stapel ab. Wenn keine Kisten mehr übrig sind, wickelst du den Stapel ab und gehst nach links und dann nach rechts. Wiederhol das Ganze. \n\n[short 15].'
    });
    translate.levels.setBundle('Mirror 2', new Bundle()).setText('hints', {
        en: 'Move the top crate of the 2nd pile one slot to the right, and bring the left pile all the way to the right.\n\n[short 12].',
        de: 'Bewege die oberste Kiste des 2. Stapels ein Ablagefach nach rechts und bring den linken Stapel den ganzen Weg nach rechts.\n\n[short 12].'
    });
    translate.levels.setBundle('Changing Places 2', new Bundle()).setText('hints', {
        en: 'As in Changing Places, swap piles. Do that once for each pair of consecutive piles and you\'re done.\n\n[short 16].',
        de: 'Wie im Level Changing Places, tauschst die Stapel. Mach das einmal für jedes aufeinanderfolgende Paar.\n\n[short 16].'
    });
    translate.levels.setBundle('Vertical Sort', new Bundle()).setText('hints', {
        en: 'Draw on ideas from previous sort levels.',
        de: 'Stütz dich sich auf Ideen von vorherigen Sortierlevels.'
    });
    translate.levels.setBundle('Count in Binary', new Bundle()).setText('hints', {
        en: 'Count up all the numbers in binary: 1, 10, 11, 100,...',
        de: 'Zähl alle Zahlen in binär zusammen: 1, 10, 11, 100, ...'
    });
    translate.levels.setBundle('Parting the Sea', new Bundle()).setText('hints', {
        en: '<i>You are on your own.</i>',
        de: '<i>Du bist auf dich alleine gestellt.</i>'
    });
    translate.levels.setBundle('The Trick', new Bundle()).setText('hints', {
        en: 'Bring the right pile to the middle, then the left pile to the middle. Finally unmerge the piles to their respective sides. \n\n[short 11].',
        de: 'Bring zuerst den richtigen Stapel zur Mitte und dann den linken Stapel. Sortiere so, dass die Stapel zu ihrer richtigen Seite kommen. \n\n[short 11].'
    });
})(translate || (translate = {}));
/** View (MVC) */
/// <reference path="music.ts" />
// The Gameplay-View is in this module.
// But the "Animation" is in "animation.ts".
var view;
(function (view_1) {
    var __views = new Array();
    // must be deferred so that the html document is ready.
    view_1.CREDITS = null;
    view_1.MAIN_MENU = null;
    view_1.LEVEL_PACK = null;
    view_1.GAMEPLAY = null;
    function init() {
        // This simply loads this module and goes to the "main menu" (= list of level packs)
        // This is deferred so that the DOM is ready for the binding.
        view_1.CREDITS = new CreditsView();
        view_1.MAIN_MENU = new MainMenuView();
        view_1.LEVEL_PACK = new LevelPackView();
        view_1.GAMEPLAY = new GameplayView();
        switchTo(view_1.MAIN_MENU);
    }
    view_1.init = init;
    /*abstract*/
    var Binding = (function () {
        function Binding() {
            // Specialisations of Binding must:
            // 1: define fields in this form:
            //   private foo : HTMLElement = null;
            //   it will bind element with id "foo" to this.foo as HTMLElement.
            // 2: call bind() AFTER the constructor!
            //    var binding = new SomeBinding()
            //    binding.bind();
            this.__bound = false;
        }
        Binding.prototype.bind = function () {
            var id;
            for (id in this) {
                if (this[id] === null) {
                    if (!(this[id] = document.getElementById(id)))
                        throw 'ERROR: No Binding-Element with id "' + id + '"';
                }
            }
            this.__bound = true;
            return this;
        };
        Binding.prototype.get = function (id) {
            return this[id];
        };
        return Binding;
    }());
    /* abstract */
    var View = (function () {
        // specialized Views should have a field "binding" : IBinding
        function View() {
            __views.push(this);
        }
        View.prototype.setVisible = function (visibility) {
            this.element.style.display = visibility ? 'block' : 'none';
        };
        View.prototype.get = function (id) {
            return this['binding'].get(id);
        };
        /*abstract*/
        View.prototype.update = function (o, arg) {
            //should be overwritten by spezialised class
        };
        return View;
    }());
    function switchTo(view) {
        __views.forEach(function (v) {
            v.setVisible(v == view);
        });
        window.scrollTo(0, 0);
    }
    view_1.switchTo = switchTo;
    var CreditsBinding = (function (_super) {
        __extends(CreditsBinding, _super);
        function CreditsBinding() {
            _super.apply(this, arguments);
            this.close_credits = null;
            this.link_fhnw = null;
        }
        CreditsBinding.prototype.bind = function () {
            _super.prototype.bind.call(this);
            return this;
        };
        return CreditsBinding;
    }(Binding));
    var CreditsView = (function (_super) {
        __extends(CreditsView, _super);
        function CreditsView() {
            var _this = this;
            _super.call(this);
            this.onClose = function (e) {
                console.log("Click handler not set yet!");
            };
            this.element = document.getElementById('credits');
            this.binding = new CreditsBinding().bind();
            // translation:
            shims.setTextContent(this.binding.close_credits.querySelector('span'), translate.credits.getText('close'));
            this.binding.close_credits.onclick = function (ev) {
                history.pushState({
                    state: 1
                }, "Main", "?state=1");
                animation.animateCredits('#scaledViewport', function () { return _this.onClose(ev); });
            };
        }
        CreditsView.prototype.setOnCloseHandler = function (callback) {
            this.onClose = callback;
        };
        CreditsView.prototype.setLanguage = function (en) {
        };
        return CreditsView;
    }(View));
    var MainMenuBinding = (function (_super) {
        __extends(MainMenuBinding, _super);
        function MainMenuBinding() {
            _super.apply(this, arguments);
            this.main_menu_header = null;
            this.main_menu_rating = null;
            this.show_credits = null;
            this.pack_tutorial = null;
            this.pack_easy = null;
            this.pack_medium = null;
            this.pack_hard = null;
            this.pack_crazy = null;
            this.pack_impossible = null;
        }
        MainMenuBinding.prototype.bind = function () {
            _super.prototype.bind.call(this);
            return this;
        };
        MainMenuBinding.prototype.getStar = function (pack) {
            return this.getPacks()[pack].querySelector('img');
        };
        MainMenuBinding.prototype.getPacks = function () {
            return new Array(this.pack_tutorial, this.pack_easy, this.pack_medium, this.pack_hard, this.pack_crazy, this.pack_impossible);
        };
        return MainMenuBinding;
    }(Binding));
    var MainMenuView = (function (_super) {
        __extends(MainMenuView, _super);
        function MainMenuView() {
            var _this = this;
            _super.call(this);
            this.callback = function (e) {
                console.log("Click handler not set yet!");
            };
            this.setLanguage = function (l) {
                console.log("Click handler not set yet!");
            };
            this.onCredits = function () {
                console.log("Click handler not set yet!");
            };
            this.element = document.getElementById('main_menu');
            this.binding = new MainMenuBinding().bind();
            this.binding.getPacks().forEach(function (v) {
                v.onclick = function (e) {
                    history.pushState({
                        state: 2
                    }, "LevelPack", "?state=2");
                    _this.callback(e);
                };
            });
            // translation:
            shims.setTextContent(this.binding.main_menu_header, translate.main_menu.getText('level packs'));
            var click2play = translate.main_menu.getText('click2play');
            this.binding.getPacks().forEach(function (v) {
                v.className += " shake";
                shims.setTextContent(v.querySelector('p'), click2play);
            });
            this.binding.show_credits.onclick = function (ev) {
                history.pushState({
                    state: 4
                }, "Credits", "?state=4");
                animation.animateCredits('#scaledViewport', function () { return _this.onCredits(ev); });
            };
            shims.setTextContent(this.binding.show_credits, translate.credits.getText('show'));
        }
        MainMenuView.prototype.setLanguageHandler = function (callback) {
            this.setLanguage = callback;
        };
        MainMenuView.prototype.setCreditsHandler = function (callback) {
            this.onCredits = callback;
        };
        MainMenuView.prototype.setClickHandler = function (_cb) {
            this.callback = _cb;
        };
        MainMenuView.prototype.setStar = function (pack, filled) {
            this.binding.getStar(pack).src = filled ? 'gfx/Star_Filled.png' : 'gfx/Star_Empty.png';
        };
        MainMenuView.prototype.setRating = function (num) {
            shims.setTextContent(this.binding.main_menu_rating.querySelector('span'), "" + num);
        };
        return MainMenuView;
    }(View));
    var LevelPackBinding = (function (_super) {
        __extends(LevelPackBinding, _super);
        function LevelPackBinding() {
            _super.apply(this, arguments);
            /*
            Some of the bound nodes are created as clones of one existing prototype node.
            Note that the numbers of the 6 levels per level pack go from 0 to 5.
            */
            this.level_pack = null;
            this.level_pack_title = null;
            this.level_pack_rating = null;
            this.level_0 = null;
            this.level_1 = null;
            this.level_2 = null;
            this.level_3 = null;
            this.level_4 = null;
            this.level_5 = null;
            this.back_to_main = null;
            this.go_left = null;
            this.go_right = null;
        }
        LevelPackBinding.prototype.bind = function () {
            _super.prototype.bind.call(this);
            return this;
        };
        /**
        The DIV-node that links to a level.
        nr: 0 to 5 (left to right, top to bottom)
        */
        LevelPackBinding.prototype.getLevel = function (nr) {
            return this["level_" + nr];
        };
        /**
        The DIV-node that is a pile of crates.
        _level: 0 to 5 (left to right, top to bottom)
        _pile: 0 to 7 (left to right)
        */
        LevelPackBinding.prototype.getPile = function (_level, _pile) {
            var level_formation = this.getLevel(_level).querySelector("div.level_formation");
            var piles = level_formation.querySelectorAll("div.level_formation > div");
            return piles.item(_pile);
        };
        /**
        The DIV-node that is that crate.
        _level: 0 to 5 (left to right, top to bottom)
        _pile: 0 to 7 (left to right)
        _crate: 0 to 5 (bottom to top)
        */
        LevelPackBinding.prototype.getCrate = function (_level, _pile, _crate) {
            var nodes = this.getPile(_level, _pile).querySelectorAll('div');
            // 5 stands for the index of the top crate (0 to 5, bottom to top).
            return nodes.item(5 - _crate);
        };
        LevelPackBinding.prototype.setTitle = function (nr, title) {
            // It's the only <span>-node, so:
            var element = this.getLevel(nr).querySelector("span");
            shims.setTextContent(element, title);
        };
        /** Gets one image that displays a star. */
        LevelPackBinding.prototype.getStar = function (_level, star) {
            var lvl = this.getLevel(_level);
            return lvl.querySelector('div > div:last-child > img:nth-child(' + star + ')');
        };
        return LevelPackBinding;
    }(Binding));
    /** Clone the prototype pile 7 times to get 8 piles. */
    function initLevelFormation(e) {
        var level_formation = e.querySelector('div.level_formation');
        var div = level_formation.querySelector('div > div');
        for (var i = 1; i < conf.getMaxPlatforms(); i++)
            level_formation.insertBefore(div.cloneNode(true), div.nextSibling);
    }
    var LevelPackView = (function (_super) {
        __extends(LevelPackView, _super);
        function LevelPackView() {
            var _this = this;
            _super.call(this);
            this.callback = function (e) {
                console.log("Click handler not set yet!");
            };
            this.back2main = function (e) {
                console.log("Click handler not set yet!");
            };
            this.goLeft = function (e) {
                console.log("Click handler not set yet!");
            };
            this.goRight = function (e) {
                console.log("Click handler not set yet!");
            };
            this.sp = null;
            this.ep = null;
            this.element = document.getElementById('level_pack');
            // before the binding can be done we need to insert all level selectors.
            // level_0 is the prototype for level_1 to level_5.
            var lvl0 = document.getElementById("level_0");
            initLevelFormation(lvl0);
            for (var nr = 1; nr < 6; nr++) {
                var lvlX = lvl0.cloneNode(true);
                lvlX.id = "level_" + nr;
                lvlX.attributes['data-nr'].value = nr;
                lvl0.parentNode.appendChild(lvlX);
            }
            this.binding = new LevelPackBinding().bind();
            for (var nr = 0; nr < 6; nr++) {
                this.binding.setTitle(nr, "Title of Level " + nr);
                this.binding.getLevel(nr).onclick = function (me) {
                    history.pushState({
                        state: 3
                    }, "Gameplay", "?state=3");
                    _this.callback(me);
                    soundplayer.sound_play_state = GameSoundState.PLAYING;
                    soundplayer.updateSound();
                };
            }
            this.binding.back_to_main.addEventListener('click', function (e) {
                history.pushState({
                    state: 1
                }, "Main", "?state=1");
                _this.back2main(e);
            });
            // translation:
            shims.setTextContent(this.binding.back_to_main.querySelector('span'), translate.level_pack.getText('back'));
            this.binding.go_left.onclick = function (ev) {
                _this.goLeft(ev);
            };
            this.binding.go_right.onclick = function (ev) {
                _this.goRight(ev);
            };
            this.binding.level_pack.ontouchstart = function (ev) {
                _this.sp = {
                    x: ev.touches[0].pageX,
                    y: ev.touches[0].pageY
                };
            };
            this.binding.level_pack.ontouchmove = function (ev) {
                if ((_this.sp.x - ev.touches[0].pageX) > 80 || (_this.sp.x - ev.touches[0].pageX) < -80) {
                    _this.ep = {
                        x: ev.touches[0].pageX,
                        y: ev.touches[0].pageY
                    };
                }
            };
            this.binding.level_pack.ontouchend = function (ev) {
                if (_this.ep != null) {
                    var x = _this.ep.x - _this.sp.x;
                    if (x < 0) {
                        _this.goRight(ev);
                        _this.ep = null;
                    }
                    else {
                        _this.goLeft(ev);
                        _this.ep = null;
                    }
                }
            };
        }
        LevelPackView.prototype.setLevelPack = function (pack) {
            var _this = this;
            this.pack = pack;
            shims.setTextContent(this.binding.level_pack_title, pack.getIdName());
            pack.getLevels().forEach(function (lvl, nr) {
                var div = _this.binding.getLevel(nr);
                _this.binding.setTitle(nr, lvl.getTitle());
                lvl.getInitialFormation().forEach(function (pile, p) {
                    _this.binding.getPile(nr, p).style.display = 'inline-block';
                    pile.forEach(function (crate, c) {
                        if (crate)
                            _this.binding.getCrate(nr, p, c).className = 'crate_' + crate;
                        else
                            _this.binding.getCrate(nr, p, c).className = 'crate_none';
                    });
                    for (var c = pile.length; c < conf.getMaxCrateHeight(); c++) {
                        _this.binding.getCrate(nr, p, c).className = 'crate_none';
                    }
                });
                for (var p = lvl.getInitialFormation().length; p < conf.getMaxPlatforms(); p++) {
                    _this.binding.getPile(nr, p).style.display = 'none';
                }
            });
            this.binding.go_left.style.visibility = pack !== level.TUTORIALS ? 'visible' : 'hidden';
            this.binding.go_right.style.visibility = pack !== level.IMPOSSIBLE ? 'visible' : 'hidden';
        };
        LevelPackView.prototype.setClickHandler = function (_cb) {
            this.callback = _cb;
        };
        LevelPackView.prototype.setBackToMain = function (_cb) {
            this.back2main = _cb;
        };
        LevelPackView.prototype.setGoLeft = function (_cb) {
            this.goLeft = _cb;
        };
        LevelPackView.prototype.setGoRight = function (_cb) {
            this.goRight = _cb;
        };
        LevelPackView.prototype.setStars = function (_level, stars) {
            var _this = this;
            [1, 2, 3].forEach(function (i) {
                _this.binding.getStar(_level, i).src =
                    stars >= i ? 'gfx/Star_Filled.png' : 'gfx/Star_Empty.png';
            });
        };
        LevelPackView.prototype.setTotalStars = function (stars) {
            shims.setTextContent(this.binding.level_pack_rating.querySelector('span'), "" + stars);
        };
        return LevelPackView;
    }(View));
    var GameplayBinding = (function (_super) {
        __extends(GameplayBinding, _super);
        function GameplayBinding() {
            _super.apply(this, arguments);
            this.custom_modal_btn_cancel_div = null;
            this.custom_modal_btn_clear_div = null;
            this.custom_modal = null;
            this.gameplay = null;
            this.level_title = null;
            this.btn_hints = null;
            // this is part of #gameplay, the is also a #btn_menu_2:
            this.btn_menu_1 = null;
            this.goal = null;
            this.goal_title = null;
            this.btn_fast = null;
            this.btn_step = null;
            this.controls = null;
            this.you_got_it_1 = null;
            this.you_got_it_title = null;
            this.star_1 = null;
            this.star_2 = null;
            this.star_3 = null;
            this.shortest_solution = null;
            this.unknown_solution = null;
            this.you_got_it_2 = null;
            this.btn_next = null;
            this.btn_replay = null;
            // this is part of #you_got_it_2, the is also a #btn_menu_1:
            this.btn_menu_2 = null;
            this.level_info = null;
            this.toolbox = null;
            this.tool_right = null;
            this.tool_grab = null;
            this.tool_left = null;
            this.tool_prog1 = null;
            this.tool_prog2 = null;
            this.tool_prog3 = null;
            this.tool_prog4 = null;
            this.tool_blue = null;
            this.tool_red = null;
            this.tool_green = null;
            this.tool_yellow = null;
            this.tool_empty = null;
            this.tool_nonempty = null;
            this.btn_clear = null;
            this.prog_1 = null;
            this.prog_1_label = null;
            this.reg_1_0 = null;
            this.reg_1_1 = null;
            this.reg_1_2 = null;
            this.reg_1_3 = null;
            this.reg_1_4 = null;
            this.reg_1_5 = null;
            this.reg_1_6 = null;
            this.reg_1_7 = null;
            this.prog_2 = null;
            this.prog_2_label = null;
            this.reg_2_0 = null;
            this.reg_2_1 = null;
            this.reg_2_2 = null;
            this.reg_2_3 = null;
            this.reg_2_4 = null;
            this.reg_2_5 = null;
            this.reg_2_6 = null;
            this.reg_2_7 = null;
            this.prog_3 = null;
            this.prog_3_label = null;
            this.reg_3_0 = null;
            this.reg_3_1 = null;
            this.reg_3_2 = null;
            this.reg_3_3 = null;
            this.reg_3_4 = null;
            this.reg_3_5 = null;
            this.reg_3_6 = null;
            this.reg_3_7 = null;
            this.prog_4 = null;
            this.prog_4_label = null;
            this.reg_4_0 = null;
            this.reg_4_1 = null;
            this.reg_4_2 = null;
            this.reg_4_3 = null;
            this.reg_4_4 = null;
            this.play = null;
            this.stage = null;
            this.hint_right = null;
            this.hint_down = null;
            this.hint_up = null;
            this.hint_level = null;
            this.music = null;
            this.sound = null;
        }
        GameplayBinding.prototype.bind = function () {
            _super.prototype.bind.call(this);
            return this;
        };
        GameplayBinding.prototype.getRegister = function (prog, reg) {
            return this['reg_' + prog + '_' + reg];
        };
        GameplayBinding.prototype.getRegisters = function (prog) {
            var result = [];
            if (prog === undefined) {
                for (var p = 1; p <= 4; p++)
                    for (var r = 0; r < (p == 4 ? 5 : 8); r++)
                        result.push(this.getRegister(p, r));
            }
            else {
                for (var r = 0; r < (prog == 4 ? 5 : 8); r++)
                    result.push(this.getRegister(prog, r));
            }
            return result;
        };
        GameplayBinding.prototype.getTools = function () {
            return [
                this.tool_right,
                this.tool_grab,
                this.tool_left,
                this.tool_prog1,
                this.tool_prog2,
                this.tool_prog3,
                this.tool_prog4,
                this.tool_blue,
                this.tool_red,
                this.tool_green,
                this.tool_yellow,
                this.tool_empty,
                this.tool_nonempty,
            ];
        };
        GameplayBinding.prototype.getTool = function (tool) {
            // "tool" could already be a string or some object with a toString() method.
            return this['tool_' + tool.toString()];
        };
        /**
        Goal: The DIV-node that is a pile of crates.
        _pile: 0 to 5 (left to right)
        */
        GameplayBinding.prototype.getPile = function (_pile) {
            var level_formation = this.goal.querySelector("div.level_formation");
            var piles = level_formation.querySelectorAll("div.level_formation > div");
            return piles.item(_pile);
        };
        /**
        Goal: The DIV-node that is that crate.
        _pile: 0 to 5 (left to right)
        _crate: 0 to 5 (bottom to top)
        */
        GameplayBinding.prototype.getCrate = function (_pile, _crate) {
            var nodes = this.getPile(_pile).querySelectorAll('div');
            // 5 stands for the index of the top crate (0 to 5, bottom to top).
            return nodes.item(5 - _crate);
        };
        return GameplayBinding;
    }(Binding));
    var GameplayView = (function (_super) {
        __extends(GameplayView, _super);
        function GameplayView() {
            var _this = this;
            _super.call(this);
            this.onDragHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onDropHandler = function () {
                console.log('Nothing injected yet...');
                return false;
            };
            this.isDnDAllowed = function () {
                return false;
            };
            this.onPlayClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onMenuClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onHintsClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onReplayClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onNextClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onStepClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onHideHintHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onClearClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onModalCancelClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onModalClearClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onFastClickHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.onForceStopHandler = function () {
                console.log('Nothing injected yet...');
            };
            this.dragToolItem = null;
            /** Display a "hint" as a message near the element with the given id.
              If id == 'gameplay', then the message is shown at the center.
              This function defines whether the hint is shown on the left, under or above the element. */
            this.id_hint_el = "";
            this.youGotItVisible = false;
            this.bgPos = 0;
            this.lvl = null;
            this.element = document.getElementById('gameplay');
            initLevelFormation(document.getElementById('goal'));
            this.binding = new GameplayBinding().bind();
            // Drag & Drop of Tools:
            var tools = cmd.getTools();
            tools.forEach(function (tool) {
                shims.dnd.registerDrag(tool.getHTMLElement(), function (evt) {
                    // "this" still references the Gameplay-Object
                    if (!_this.isDnDAllowed())
                        return;
                    var item = cmd.getInstruction(evt.getTarget().attributes['data-cmd-id'].value);
                    view_1.GAMEPLAY.dragToolItem = item;
                    evt.getDataTransfer().dropEffect = 'copy';
                    evt.getDataTransfer().effectAllowed = 'copy';
                    evt.getDataTransfer().setData('Text', item.toString() + ',0,0');
                    if (evt.getDataTransfer()['setDragImage']) {
                        // Perfect for Firefox, OK for Opera and Webkit:
                        evt.getDataTransfer()['setDragImage'](evt.getTarget(), 25, 27);
                    }
                    _this.onDragHandler();
                    // Note: changes to "this" would apply to the tool in the toolbox,
                    // not the one held by the mouse.
                }); //registerDrag
            });
            var dropEvents = {
                register: null,
                gameplay: null,
                out: null
            };
            dropEvents.register = function (evt) {
                var register = evt.getTarget();
                if (!register.attributes['data-prog'])
                    register = register.parentElement;
                // drop by touch evetns are often on the wrong target:
                if (!register.attributes['data-prog']) {
                    dropEvents.gameplay(evt);
                    return;
                }
                var data = evt.getDataTransfer().getData('Text').split(',');
                var item = cmd.getInstruction(data[0]);
                var srcProg = parseInt(data[1]); // 0 => Toolbox
                var srcReg = parseInt(data[2]);
                var destProg = parseInt(register.attributes['data-prog'].value);
                var destReg = parseInt(register.attributes['data-reg'].value);
                _this.onDropHandler(item, srcProg, srcReg, destProg, destReg);
            };
            dropEvents.gameplay = function (evt) {
                // dropped by touch-event:
                // The target could be cond_?_? or op_?_?:
                if (_this.binding.getRegisters().indexOf(evt.getTarget().parentElement) != -1) {
                    dropEvents.register(evt); // drop a tool into a register.
                    return;
                }
                var data = evt.getDataTransfer().getData('Text').split(',');
                var tool = cmd.getInstruction(data[0]);
                var srcProg = parseInt(data[1]);
                var srcReg = parseInt(data[2]);
                // Destination is not a register which is referenced as 0,0.
                if (_this.onDropHandler(tool, srcProg, srcReg, 0, 0))
                    _this.showSmoke(evt.getLeft(), evt.getTop());
            };
            // For some reson it will work anyway on mobile.
            // and registerDrop on "gameplay" would only disable all clickable buttons:
            if (!conf.isMobile())
                shims.dnd.registerDrop(this.binding.gameplay, dropEvents.gameplay);
            shims.dnd.registerDrop(this.binding.toolbox, dropEvents.gameplay);
            shims.dnd.registerDrop(this.binding.goal, dropEvents.gameplay);
            shims.dnd.registerDrop(this.binding.play, dropEvents.gameplay);
            shims.dnd.registerDrop(this.binding.stage, dropEvents.gameplay);
            shims.dnd.registerDrop(this.binding.level_info, dropEvents.gameplay);
            this.binding.getRegisters().forEach(function (reg) {
                //reg.addEventListener('drop', dropEvent , false);
                shims.dnd.registerDrop(reg, dropEvents.register);
                var _dragstart = function (evt) {
                    // "this" still references the Gameplay-Object
                    var item = evt.getTarget();
                    evt.getDataTransfer().dropEffect = 'move';
                    evt.getDataTransfer().effectAllowed = 'move';
                    var tool = cmd.NOOP.toString();
                    if (item.id.indexOf('cond') === 0)
                        tool = cmd.NOCOND.toString();
                    var srcProg = item.parentNode.attributes['data-prog'].value;
                    var srcReg = item.parentNode.attributes['data-reg'].value;
                    var data = tool + ',' + srcProg + ',' + srcReg;
                    evt.getDataTransfer().setData('Text', data);
                    _this.onDragHandler();
                };
                reg.firstChild.className = 'cmd-nocond';
                shims.dnd.registerDrag(reg.firstElementChild, _dragstart);
                reg.lastChild.className = 'cmd-noop';
                shims.dnd.registerDrag(reg.lastElementChild, _dragstart);
            } // lambda
             // lambda
            ); //forEach
            var _parent = this;
            if (window.Windows) {
                if (Windows.Phone) {
                    var hardwareButtons = Windows.Phone.UI.Input.HardwareButtons;
                    hardwareButtons.addEventListener("backpressed", function (e) {
                        e.handled = true;
                        if ($('#gameplay').is(':visible')) {
                            _parent.onForceStopHandler(e);
                            view.switchTo(view.LEVEL_PACK);
                            history.pushState({ state: 2 }, "LevelPack", "?state=2");
                            _parent.onHideHintHandler(e);
                            return true;
                        }
                        history.pushState({ state: 1 }, "Main", "?state=1");
                        _parent.onHideHintHandler(e);
                        view.switchTo(view.MAIN_MENU);
                        return true;
                    });
                }
            }
            $(window).on('popstate', function (e) {
                if ($('#gameplay').is(':visible')) {
                    _parent.onForceStopHandler(e);
                    view.switchTo(view.LEVEL_PACK);
                    history.pushState({
                        state: 2
                    }, "LevelPack", "?state=2");
                    _parent.onHideHintHandler(e);
                    return;
                }
                history.pushState({
                    state: 1
                }, "Main", "?state=1");
                _parent.onHideHintHandler(e);
                view.switchTo(view.MAIN_MENU);
            });
            $(document).keyup(function (e) {
                if (e.keyCode != 8 && e.keyCode != 37 && e.keyCode != 36)
                    return;
                if ($('#gameplay').is(':visible') && e.keyCode != 36) {
                    _parent.onForceStopHandler(e);
                    view.switchTo(view.LEVEL_PACK);
                    history.pushState({
                        state: 2
                    }, "LevelPack", "?state=2");
                    _parent.onHideHintHandler(e);
                    return;
                }
                history.pushState({
                    state: 1
                }, "Main", "?state=1");
                _parent.onHideHintHandler(e);
                view.switchTo(view.MAIN_MENU);
            });
            this.binding.sound.addEventListener('click', function (e) {
                soundplayer.toggleSound();
            });
            this.binding.music.addEventListener('click', function (e) {
                soundplayer.toggleMusic();
            });
            this.binding.play.addEventListener('click', function (e) {
                _this.onPlayClickHandler(e);
            });
            this.binding.btn_menu_1.addEventListener('click', function (e) {
                history.pushState({
                    state: 2
                }, "LevelPack", "?state=2");
                _this.onMenuClickHandler(e);
            });
            this.binding.btn_menu_2.addEventListener('click', function (e) {
                history.pushState({
                    state: 2
                }, "LevelPack", "?state=2");
                setTimeout(function () { return _this.onMenuClickHandler(e); }, 100);
            });
            this.binding.btn_hints.addEventListener('click', function (e) {
                _this.onHintsClickHandler(e);
            });
            this.binding.btn_next.addEventListener('click', function (e) {
                _this.onNextClickHandler(e);
            });
            this.binding.btn_replay.addEventListener('click', function (e) {
                animation.fadeOut('#you_got_it_2, #you_got_it_1', function () { return _this.onReplayClickHandler(e); });
            });
            this.binding.btn_step.addEventListener('click', function (e) {
                _this.onStepClickHandler(e);
            });
            this.binding.btn_fast.addEventListener('click', function (e) {
                _this.onFastClickHandler(e);
            });
            this.binding.btn_clear.addEventListener('click', function (e) {
                _this.onClearClickHandler(e);
            });
            this.binding.custom_modal_btn_cancel_div.addEventListener('click', function (e) {
                _this.onModalCancelClickHandler(e);
            });
            this.binding.custom_modal_btn_clear_div.addEventListener('click', function (e) {
                _this.onModalClearClickHandler(e);
            });
            new Array(this.binding.hint_right, this.binding.hint_down, this.binding.hint_up, this.binding.hint_level).forEach(function (h) {
                h.onclick = function (e) {
                    _this.onHideHintHandler(e);
                };
            });
            //translation:
            var bundle = translate.gameplay;
            shims.setTextContent(this.binding.goal_title, bundle.getText('goal'));
            // translation for "you got it":
            var bundle = translate.you_got_it;
            shims.setTextContent(this.binding.you_got_it_title, bundle.getText('you got it'));
            shims.setTextContent(this.binding.shortest_solution, bundle.getText('shortest solution'));
            shims.setHTMLContent(this.binding.unknown_solution, bundle.getText('unknown solution'));
        } //c'tor
        GameplayView.prototype.setOnDragHandler = function (h) {
            this.onDragHandler = h;
        };
        GameplayView.prototype.setOnDropHandler = function (h) {
            this.onDropHandler = h;
        };
        GameplayView.prototype.setDnDAllowedIndicator = function (f) {
            this.isDnDAllowed = f;
        };
        GameplayView.prototype.setOnPlayClickHandler = function (h) {
            this.onPlayClickHandler = h;
        };
        // note: there are two buttons: #btn_menu_1 and #btn_menu_2.
        // Both do the same!
        GameplayView.prototype.setOnMenuClickHandler = function (h) {
            this.onMenuClickHandler = h;
        };
        GameplayView.prototype.setOnHintsClickHandler = function (h) {
            this.onHintsClickHandler = h;
        };
        GameplayView.prototype.setOnReplayClickHandler = function (h) {
            this.onReplayClickHandler = h;
        };
        // This goes to the next level, when the level has been won.
        GameplayView.prototype.setOnNextClickHandler = function (h) {
            this.onNextClickHandler = h;
        };
        GameplayView.prototype.setOnStepClickHandler = function (h) {
            this.onStepClickHandler = h;
        };
        GameplayView.prototype.setOnHideHintHandler = function (h) {
            this.onHideHintHandler = h;
        };
        GameplayView.prototype.setOnClearClickHandler = function (h) {
            this.onClearClickHandler = h;
        };
        GameplayView.prototype.setOnModalCancelClickHandler = function (h) {
            this.onModalCancelClickHandler = h;
        };
        GameplayView.prototype.setOnModalClearClickHandler = function (h) {
            this.onModalClearClickHandler = h;
        };
        GameplayView.prototype.setOnFastClickHandler = function (h) {
            this.onFastClickHandler = h;
        };
        GameplayView.prototype.setOnForceStopHandler = function (h) {
            this.onForceStopHandler = h;
        };
        GameplayView.prototype.getRegister = function (prog, reg) {
            return this.binding.getRegister(prog, reg);
        };
        GameplayView.prototype.getRegisters = function (prog) {
            return this.binding.getRegisters(prog);
        };
        GameplayView.prototype.loadLevel = function (lvl) {
            var _this = this;
            var goal = lvl.getGoal();
            this.setYouGotItState(false);
            goal.forEach(function (pile, p) {
                _this.binding.getPile(p).style.display = 'inline-block';
                pile.forEach(function (crate, c) {
                    if (crate)
                        _this.binding.getCrate(p, c).className = 'crate_' + crate;
                    else
                        _this.binding.getCrate(p, c).className = 'crate_none';
                });
                for (var c = pile.length; c < conf.getMaxCrateHeight(); c++) {
                    _this.binding.getCrate(p, c).className = 'crate_none';
                }
            });
            for (var p = goal.length; p < conf.getMaxPlatforms(); p++) {
                this.binding.getPile(p).style.display = 'none';
            }
            cmd.getTools().forEach(function (t) {
                if (lvl.getTools().indexOf(t, 0) >= 0)
                    _this.binding.getTool(t).style.display = 'block';
                else
                    _this.binding.getTool(t).style.display = 'none';
            });
            shims.setTextContent(this.binding.level_title, lvl.getTitle());
        };
        GameplayView.prototype.centerModal = function (element) {
            if (element === void 0) { element = '#custom_modal_img'; }
            if ($(window).width() > $(window).height()) {
                $(element).css('width', $(window).width() / 2 + 'px');
                //$(element).css('height', $(window).height() * (845 / $(element).width()) / 2 + 'px');
                $('.custom_modal_btn').css('width', $(window).width() / 10 + 'px');
                $('#sub_custom_modal').css('width', $(window).width() / 2 + 'px');
            }
            else {
                $(element).css('width', $(window).width() / 1.2 + 'px');
                $('.custom_modal_btn').css('width', $(window).width() / 6 + 'px');
                $('#sub_custom_modal').css('width', $(window).width() / 1.2 + 'px');
            }
            var element_height = $(element).height();
            var element_width = $(element).width();
            var document_height = $(window).height();
            var document_width = $(window).width();
            var top = (document_height - element_height) / 2;
            var left = (document_width - element_width) / 2;
            var percent = 22;
            $('#custom_modal_btn_cancel_text').css('bottom', $(element).height() / 100 * percent + 'px');
            $('#custom_modal_btn_clear_text').css('bottom', $(element).height() / 100 * percent + 'px');
            $('.custom_modal_text').css('font-size', ($('#custom_modal_btn_clear_text').width() / 5) + 'px');
            $('#custom_modal_question').css('font-size', ($('#custom_modal_btn_clear_text').width() / 3) + 'px');
            $('#sub_custom_modal').css('margin-top', '-' + element_height / 3 + 'px');
            $('#sub_custom_modal').css('margin-left', left + 'px');
            $(element).css('margin-top', top + 'px');
            $(element).css('margin-left', left + 'px');
            var imgtop = $('#custom_modal_img').offset().top;
            var imgleft = $('#custom_modal_img').offset().left;
            $('#custom_modal_question').css('top', imgtop + 'px');
            $('#custom_modal_question').css('left', imgleft + 'px');
            $('#custom_modal_question').text(translate.gameplay.getText('clearmessage'));
            $('#custom_modal_btn_cancel_text').text(translate.gameplay.getText('cancel'));
            $('#custom_modal_btn_clear_text').text(translate.gameplay.getText('clear'));
        };
        GameplayView.prototype.text2html = function (text) {
            var scale = shims.getScale();
            var wh = 'width="' + Math.round(100 / 3 * scale) + '" height="' + Math.round(108 / 3 * scale) + '" style="height:auto;"';
            var html = text;
            html = html.replace(/\[grab\]/g, '<img src="gfx/Command_Grab.png" alt="grab" ' + wh + ' />');
            html = html.replace(/\[right\]/g, '<img src="gfx/Command_Right.png" alt="right" ' + wh + ' />');
            html = html.replace(/\[left\]/g, '<img src="gfx/Command_Left.png" alt="left" ' + wh + ' />');
            html = html.replace(/\[yellow\]/g, '<img src="gfx/Condition_Yellow.png" alt="yellow" ' + wh + ' />');
            html = html.replace(/\[empty\]/g, '<img src="gfx/Condition_None.png" alt="none" ' + wh + ' />');
            html = html.replace(/\[prog(\d)\]/g, '<img src="gfx/Program_$1.png" alt="Prog $1" ' + wh + ' />');
            html = html.replace(/\[short(\d+)\]/ig, translate.levels.getText('short'));
            html = html.replace(/\n/g, '<br />');
            return html;
        };
        GameplayView.prototype.showHint = function (id, text) {
            this.id_hint_el = id;
            this.hideHints(); // only one at a time!
            var el = document.getElementById(id);
            var scale = shims.getScale();
            var hint = null;
            var triangle = null;
            //var x = document.getElementById('x');
            // direction is the direction of the triangle (where it points to).
            var direction; // type of hint.
            if (id.substr(0, 4) === 'tool' || id === 'btn_step' || id === 'btn_clear')
                direction = 'right';
            else if (id === 'play' || id.substr(0, 5) === 'reg_1')
                direction = 'down';
            else if (id === 'goal' || id.substr(0, 5) === 'reg_2')
                direction = 'up';
            else
                direction = 'level';
            hint = document.getElementById('hint_' + direction);
            triangle = hint.querySelector('.triangle'); // could be null!
            var textDiv = hint.querySelector('div.text');
            textDiv.innerHTML = this.text2html(text);
            // transformation is ignored/buggy in some browsers.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=591718
            var rEl = el.getBoundingClientRect();
            // draw the hint where it is not visible to get the actual size:
            textDiv.style.maxWidth = hint.style.maxWidth = Math.round(700 * scale) + 'px';
            var border = Math.ceil(4 * scale);
            textDiv.style.borderWidth = border + 'px';
            hint.style.top = hint.style.left = '-1000px';
            hint.style.fontSize = Math.round(20 * scale) + 'px';
            hint.style.display = 'block';
            if (triangle)
                triangle.style.width = triangle.style.height = Math.ceil(scale * 29) + 'px';
            var rHint = hint.getBoundingClientRect();
            if (direction === 'right') {
                hint.style.left = Math.floor(rEl.left - rHint.width) + 'px';
                hint.style.top = Math.floor(rEl.top + (rEl.height / 2) - (40 * scale)) + 'px';
                triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Right.png)';
                triangle.style.left = '-' + border + 'px';
                triangle.style.top = (scale * 20) + 'px';
            }
            else if (direction === 'down') {
                if (rEl.left > rHint.width) {
                    hint.style.left = Math.floor(rEl.right - rHint.width) + 'px';
                    triangle.style.left = Math.floor(rHint.width - (rEl.width / 2) - (15 * scale)) + 'px';
                }
                else {
                    hint.style.left = Math.floor(rEl.left) + 'px';
                    triangle.style.left = Math.floor((rEl.width / 2) - (15 * scale)) + 'px';
                }
                hint.style.top = Math.floor(rEl.top - (rHint.height)) + 'px';
                triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Down.png)';
                triangle.style.top = '-' + border + 'px';
            }
            else if (direction === 'up') {
                hint.style.left = Math.floor(rEl.left + rEl.width / 2 - rHint.width / 2) + 'px';
                //triangle.style.left = Math.floor((rEl.width / 2) - (15 * scale)) + 'px'
                hint.style.top = Math.ceil(rEl.bottom) + 'px';
                triangle.style.backgroundImage = 'url(gfx/Hint_Triangle_Up.png)';
                triangle.style.top = border + 'px';
            }
            else if ('gameplay' === id) {
                hint.style.left = Math.floor((rEl.width - rHint.width) / 2 + rEl.left) + 'px';
                hint.style.top = Math.floor((rEl.height - rHint.height) / 2 + rEl.top) + 'px';
            }
            else {
                hint.style.left = Math.floor(rEl.right - rHint.width) + 'px';
                hint.style.top = Math.floor(rEl.bottom + 10 * scale) + 'px';
            }
        };
        GameplayView.prototype.hideHints = function () {
            ([
                this.binding.hint_right, this.binding.hint_down,
                this.binding.hint_up, this.binding.hint_level,
            ]).forEach(function (h) {
                h.style.display = 'none';
            });
        };
        GameplayView.prototype.showSmoke = function (left, top) {
            try {
                soundplayer.smoke_sound.play();
            }
            catch (ex) {
                console.error("Soundplay doesn'try Worker: " + ex.message);
            }
            left -= 28; // reduce by half of width
            top -= 29; // reduce by half of height
            // This cycles all 4 possible directions (up,right,down,left).
            // Each direction consits of a vertical and horizontal direction. 
            // So this repeats after 8 invokations.
            var r = Math.floor(Math.random() * 8);
            var rnd = function () {
                r = (r + 1) % 8;
                //         a random positive integer [15,35], then a factor -1 or +1:
                return (Math.round(Math.random() * 20 + 15) * ((Math.floor(r / 4) - 0.5) * 2));
            };
            var showSmoke2 = function (i) {
                var s = window.document.getElementById("smoke" + i);
                s.className = 'nosmoke';
                s.style.top = top + 'px';
                s.style.left = left + 'px';
                s.style.opacity = "1.0";
                var globalScale = shims.getScale();
                setTimeout(function () {
                    s.className = 'smoke';
                    s.style.top = (top + rnd() * globalScale) + 'px';
                    s.style.left = (left + rnd() * globalScale) + 'px';
                    s.style.opacity = "0.3";
                    var scale = Math.round((0.5 + Math.random()) * globalScale * 100) / 100;
                    shims.transform(s, 'scale(' + scale + ',' + scale + ') ' + 'rotate(' + (Math.round(Math.random() * 100) / 100) + 'turn)');
                }, 33);
                setTimeout(function () {
                    s.className = 'nosmoke';
                    s.style.opacity = "1.0";
                }, 500);
            };
            for (var i = 1; i <= 6; i++)
                showSmoke2(i);
            try {
                soundplayer.smoke_sound.play();
            }
            catch (ex) {
                console.error("Soundplay error: " + ex.message);
            }
        };
        /** play = green / !play = stop = red
          note: the parameter is true when the animation is *not* playing and the button
          is displayed as a green play-button). false => stop-button.
        */
        GameplayView.prototype.setPlayButtonState = function (play) {
            this.binding.play.src =
                play ? 'gfx/Play_Button.png' : 'gfx/Stop_Button.png';
            var allowed = this.isDnDAllowed();
            var stop2change = translate.gameplay.getText('stop2change');
            var regs = this.binding.getRegisters();
            regs.concat(regs.map(function (r) {
                return r.firstChild;
            }))
                .concat(regs.map(function (r) {
                return r.lastChild;
            }))
                .concat(this.binding.getTools())
                .forEach(function (x) {
                $(x).css('cursor', allowed ? '' : 'not-allowed');
                x.title = allowed ? '' : stop2change;
            });
        };
        /** active = fast / !active = slow */
        GameplayView.prototype.setFastButtonState = function (active) {
            this.binding.btn_fast.src = "gfx/" +
                (active ? "Fast_Button_Active.png" : "Fast_Button_Inactive.png");
        };
        GameplayView.prototype.setYouGotItState = function (visible, rating) {
            var _this = this;
            this.youGotItVisible = visible;
            this.hideHints();
            var portrait = window.innerHeight > window.innerWidth;
            this.binding.you_got_it_1.style.display = visible ? 'block' : 'none';
            this.binding.you_got_it_1.style.top = '-800px';
            this.binding.you_got_it_2.style.display = visible ? 'block' : 'none';
            this.binding.you_got_it_2.style.top = portrait ? '1455px' : '-800px';
            if (!visible)
                return;
            this.binding.shortest_solution.style.display = 'none';
            this.binding.unknown_solution.style.display = 'none';
            if (rating === 4)
                this.binding.unknown_solution.style.display = 'block';
            else if (rating === 3)
                this.binding.shortest_solution.style.display = 'block';
            // star_1 is always filled!
            this.binding.star_2.src = 'gfx/Star_' + ((rating >= 2) ? 'Filled' : 'Empty') + '.png';
            this.binding.star_3.src = 'gfx/Star_' + ((rating >= 3) ? 'Filled' : 'Empty') + '.png';
            setTimeout(function () {
                _this.binding.you_got_it_1.style.top = '';
                _this.binding.you_got_it_2.style.top = '';
            }, 32);
        };
        return GameplayView;
    }(View));
})(view || (view = {}));
//# sourceMappingURL=cb.js.map
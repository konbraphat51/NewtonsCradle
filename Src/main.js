const ROOF_Y = 100;

const STRING_LENGTH = 100;

const RADIUS = 20;

const SPRING = 10;

const COLORS = ["red", "green", "blue", "yellow", "purple", "orange", "pink", "brown", "gray"]

var balls_n = 5;
var balls = [];

class Pin{
    constructor(x) {
        this.x = x;
        this.y = ROOF_Y;
    }
}

class Ball {
    constructor(x, y, radius, mass, pin) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.mass = mass;
        this.pin = pin
        this.f_contact = 0;
        this.velocity = 0;
    }

    Draw() {
        DrawCircle(this.x, this.y, this.radius);
    }
}

function Reset(){
    balls = []
    clearInterval();
}

function OnBallsNChanged() {
    Reset();

    balls_elem = document.getElementById("balls").value;
    balls_n = balls_elem -0;

    AllocateBalls();
}

function AllocateBalls() {
    const center = CANVAS_X / 2;
    const interval = RADIUS * 2;
    const y = ROOF_Y + STRING_LENGTH;

    for (var i = 0; i < balls_n; i++) {
        var x = center + interval * (i - balls_n);

        var pin = new Pin(x);
        balls.push(new Ball(x, y, RADIUS, 100, pin));
    }
    console.log(balls.length);
}

function Draw(){
    //clear
    SetColor("white");
    DrawRect(0, 0, CANVAS_X, CANVAS_Y);

    //draw balls
    for (var i = 0; i < balls_n; i++) {
        SetColor(GetColor(i));
        balls[i].Draw();
    }

    //draw strings
    for (var i = 0; i < balls_n; i++) {
        SetColor("black");
        DrawLine(balls[i].x, balls[i].y, balls[i].pin.x, balls[i].pin.y);
    }
}

function GetColor(i){
    return COLORS[i % COLORS.length];
}

function SimulatePhysics(){

}

function SimulateContactForce(){
    //initialize all balls
    for (var i = 0; i < balls_n; i++) {
        balls[i].f_contact = 0;
    }

    //by Descrete Element Method
    for (var i = 0; i < balls_n-1; i++) {
        var force = 0;

        var distance = Math.sqrt((balls[i].x - balls[i+1].x)**2 + (balls[i].y - balls[i+1].y)**2);
        var overlap = balls[i].radius + balls[i+1].radius - distance;
        if (overlap < 0){
            overlap = 0;
        }

        force -= SPRING * overlap;

    }
}



async function main() {
    //initialize
    OnBallsNChanged();

    await MainLoop();
}

async function MainLoop(){
    Draw();
    SimulatePhysics();

    await sleep(1000 / FPS);
}
//Base
const FPS = 60;
const SPF = 1 / FPS;

//String
const ROOF_Y = 100;
const STRING_LENGTH_INITIAL = 100;

//Ball
const RADIUS_INITIAL = 20;
const COLORS = ["red", "green", "blue", "yellow", "purple", "orange", "pink", "brown", "gray"]
const MASS_INITIAL = 100;

//physics consts
var BALL2BALL_SPRING = 1e4;   //バネ係数
var BALL2BALL_ELASTIC = 1e3;  //弾性係数
var STRING2BALL_SPRING = 1e4; 
var STRING2BALL_ELASTIC = 1e3;
var GRAVITY = [0, 1e2];

//HTML ids
const ID_BALLS = "balls";
const ID_BALL2BALL_SPRING = "ball2ball_spring";
const ID_BALL2BALL_ELASTIC = "ball2ball_elastic";
const ID_STRING2BALL_SPRING = "string2ball_spring";
const ID_STRING2BALL_ELASTIC = "string2ball_elastic";
const ID_GRAVITY_X = "gravity_x";
const ID_GRAVITY_Y = "gravity_y";

const ID_BALL_LENGTH = "ball_length_";
const ID_BALL_MASS = "ball_mass_";
const ID_BALL_RADIUS = "ball_radius_";

//Control
function ControlForce(distance) {
    //the infinite integration should converge to 0 (Or it will keep swinging)
    return (1 / (1 + distance)**2) * 1e7;
}

var balls_n = 5;
var balls = [];

class Pin{
    constructor(position) {
        this.position = position
    }

    Draw() {
        SetColor("black");
        DrawCircle(this.position[0], this.position[1], 2);
    }
}

class Ball {
    constructor(position, radius, mass, string_length, pin) {
        this.position = position;
        this.radius = radius;
        this.mass = mass;
        this.string_length = string_length;
        this.pin = pin;
        this.f = [0, 0];
        this.velocity = [0, 0];
    }

    Draw() {
        DrawCircle(this.position[0], this.position[1], this.radius);
    }

    GiveForce(force) {
        this.f = PlusVec(this.f, force);
    }

    ResetForce() {
        this.f = [0, 0];
    }
}

function PutAdjustmentFields() {
    //balls_n
    PutNumberInputField(ID_BALLS, "number of balls", OnBallsNChanged, balls_n, 1, 100, 1);

    //BALL2BALL
    PutNumberInputFieldE(ID_BALL2BALL_SPRING, "ball2ball_spring", OnParametersChanged, BALL2BALL_SPRING);
    PutNumberInputFieldE(ID_BALL2BALL_ELASTIC, "ball2ball_elastic", OnParametersChanged, BALL2BALL_ELASTIC);

    //STRING2BALL
    PutNumberInputFieldE(ID_STRING2BALL_SPRING, "string2ball_spring", OnParametersChanged, STRING2BALL_SPRING);
    PutNumberInputFieldE(ID_STRING2BALL_ELASTIC, "string2ball_elastic", OnParametersChanged, STRING2BALL_ELASTIC);

    //GRAVITY
    PutNumberInputField(ID_GRAVITY_X, "gravity_x", OnParametersChanged, GRAVITY[0]);
    PutNumberInputField(ID_GRAVITY_Y, "gravity_y", OnParametersChanged, GRAVITY[1]);

    //balls parameters
    for (var i = 0; i < balls_n; i++) {
        PutNumberInputField(ID_BALL_RADIUS + i, "ball_radius_" + i, OnParametersChanged, RADIUS_INITIAL, 1, 1000, 1);
        PutNumberInputField(ID_BALL_MASS + i, "ball_mass_" + i, OnParametersChanged, MASS_INITIAL, 1, 1000, 1);
        PutNumberInputField(ID_BALL_LENGTH + i, "ball_string_length_" + i, OnParametersChanged, STRING_LENGTH_INITIAL, 1, 1000, 1);
    }
}

function Clear(){
    balls = []
}

function OnParametersChanged() {
    GetParameters();
    GetBallParameters();
}

function OnBallsNChanged() {
    //get balls number
    balls_n = GetNumberInputFieldValue(ID_BALLS, true);

    EraceAllHTML();
    PutAdjustmentFields();

    Initialize();
}

function Initialize() {
    Clear();

    GetParameters();

    AllocateBalls();

    GetBallParameters();
}

function GetParameters() {
    //BALL2BALL
    BALL2BALL_SPRING = GetNumberInputFieldValueE(ID_BALL2BALL_SPRING);
    BALL2BALL_ELASTIC = GetNumberInputFieldValueE(ID_BALL2BALL_ELASTIC);

    //STRING2BALL
    STRING2BALL_SPRING = GetNumberInputFieldValueE(ID_STRING2BALL_SPRING);
    STRING2BALL_ELASTIC = GetNumberInputFieldValueE(ID_STRING2BALL_ELASTIC);

    //GRAVITY
    GRAVITY[0] = GetNumberInputFieldValue(ID_GRAVITY_X, true);
    GRAVITY[1] = GetNumberInputFieldValue(ID_GRAVITY_Y, true);
}

function GetBallParameters() {
    //need to be seperated from GetParameters() because balls should be initialized

    //balls
    for (var i = 0; i < balls_n; i++) {
        balls[i].radius = GetNumberInputFieldValue(ID_BALL_RADIUS + i, true);
        balls[i].mass = GetNumberInputFieldValue(ID_BALL_MASS + i, true);
        balls[i].string_length = GetNumberInputFieldValue(ID_BALL_LENGTH + i, true);
    }
}

function AllocateBalls() {
    const center = GetCanvasSize()[0] / 2;
    const interval = RADIUS_INITIAL * 2;
    const y = ROOF_Y + STRING_LENGTH_INITIAL;

    for (var i = 0; i < balls_n; i++) {
        var x = center + interval * (i - balls_n);

        var pin = new Pin([x, ROOF_Y]);
        balls.push(new Ball([x, y], RADIUS_INITIAL, MASS_INITIAL, STRING_LENGTH_INITIAL, pin));
    }
}

function Draw(){
    //clear
    SetColor("white");
    DrawRect(0, 0, GetCanvasSize()[0], GetCanvasSize()[1]);

    //draw balls & pins
    for (var i = 0; i < balls_n; i++) {
        //ball
        SetColor(GetColor(i));
        balls[i].Draw();

        //pin
        balls[i].pin.Draw();
    }

    //draw strings
    for (var i = 0; i < balls_n; i++) {
        SetColor("black");
        DrawLine(balls[i].position[0], balls[i].position[1], balls[i].pin.position[0], balls[i].pin.position[1]);
    }
}

function GetColor(i){
    return COLORS[i % COLORS.length];
}

function SimulatePhysics(){
    SimulateContactForce();
    SimulateGravity();

    //should be last
    SimulateStringConstraint();

    //move
    SimulateMovement();
}

function CalculateContactForce(spring, elastic, overlap, speed_relative){
    //Descrete Element Method
    const force_spring = spring * overlap;
    const force_elastic = elastic * speed_relative;

    return -force_elastic - force_spring;
}

function SimulateContactForce(){
    //per pair of balls
    for (var cnt = 0; cnt < balls.length -1; cnt++) {
        //balls[cnt] and balls[cnt + 1] are neighbors
        const ball0 = balls[cnt];
        const ball1 = balls[cnt + 1];

        //0-to-1 side: +
        //calculate relative amounts based on ball0

        //calculate overlap
        const distance = GetDistance(ball0.position, ball1.position);
        //for ball0(left side), overlap is to-right, so positive.
        var overlap = ball0.radius + ball1.radius - distance;
        if (overlap <= 0){
            //not contacting
            continue;
        }

        //calculate relative speed
        const zero2one = MinusVec(ball1.position, ball0.position);
        const speed_relative = DotVec(zero2one, MinusVec(ball0.velocity, ball1.velocity)) / GetVecLength(zero2one);

        //calculate force
        const force_sc = CalculateContactForce(BALL2BALL_SPRING, BALL2BALL_ELASTIC, overlap, speed_relative);
        const force = ChangeVecLength(zero2one, force_sc);

        //give force to the balls
        ball0.GiveForce(force);
        ball1.GiveForce(MultiplyVec(-1, force));
    }
}

function SimulateGravity() {
    for (var cnt = 0; cnt < balls.length; cnt++) {
        balls[cnt].GiveForce(MultiplyVec(balls[cnt].mass, GRAVITY));
    }
}

//This function should be last before the movement simulation
function SimulateStringConstraint(){
    //for each ball
    for(var cnt = 0; cnt < balls.length; cnt++){
        //calculate string force
        const ball = balls[cnt];
        const pin = ball.pin;

        //to pin direction: +

        //calculate overlap
        const pin2ball = MinusVec(ball.position, pin.position);
        const string_tip_position = PlusVec(pin.position, ChangeVecLength(pin2ball, ball.string_length));
        var overlap = GetDistance(string_tip_position, ball.position);
        if (ball.string_length < GetVecLength(pin2ball)){
            //too far
            overlap = -overlap;
        }

        //calculate relative speed
        const speed_relative = DotVec(MultiplyVec(-1, pin2ball), ball.velocity) / GetVecLength(pin2ball);

        //calculate force
        const force_sc = CalculateContactForce(STRING2BALL_SPRING, STRING2BALL_ELASTIC, overlap, speed_relative);

        //calculate force direction)
        const force = ChangeVecLength(MultiplyVec(-1, pin2ball), force_sc);

        //give force to the ball
        ball.GiveForce(force);
    }
}

function SimulateMovement() {
    //per ball
    for (var cnt = 0; cnt < balls.length; cnt++) {
        var ball = balls[cnt];

        //move the ball by F = ma
        const acceleration = MultiplyVec(1 / ball.mass, ball.f);

        ball.velocity = PlusVec(ball.velocity, MultiplyVec(SPF, acceleration));

        const displacement = MultiplyVec(SPF, ball.velocity);

        ball.position = PlusVec(ball.position, displacement);

        //reset force
        ball.ResetForce();
    }
}

function Control(){
    if (GetMouse()){
        //get key position
        const mouse_position = [GetMouseX(), GetMouseY()];

        //get nearest ball
        var nearest_ball_index = 0;
        var temp = 1e10;
        for (var i = 0; i < balls_n; i++) {
            const distance = GetDistance(mouse_position, balls[i].position);
            
            if (distance < temp){
                temp = distance;
                nearest_ball_index = i;
            }
        }

        //>>calculate control force for the ball
        const pin_position = balls[nearest_ball_index].pin.position;

        const pin2mouse = MinusVec(mouse_position, pin_position);        
        const control_force_sc = ControlForce(GetVecLength(pin2mouse));
        const control_force = MultiplyVec(control_force_sc, pin2mouse);

        balls[nearest_ball_index].GiveForce(control_force);
        //<<
    }
}

PutAdjustmentFields();

async function main() {
    Initialize();

    await MainLoop();
}

async function MainLoop(){
    while(true){
        Draw();
        Control();
        SimulatePhysics();

        await Sleep(1000 / FPS);
    }
}
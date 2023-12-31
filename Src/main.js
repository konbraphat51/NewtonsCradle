//Base
const FPS = 1000;
const SPF = 1 / FPS;

//String
const ROOF_Y = 100;
const STRING_LENGTH_INITIAL = 100;

//Ball
const RADIUS_INITIAL = 20;
const COLORS = ["red", "green", "blue", "yellow", "purple", "orange", "pink", "brown", "gray"]
const MASS_INITIAL = 100;

//physics consts
var BALL2BALL_SPRING = 5e6;         //バネ係数
var BALL2BALL_RESTITUTION = 1;    //反発係数
var STRING2BALL_SPRING = 1e6; 
var STRING2BALL_RESTITUTION = 0;
var GRAVITY = [0, 4e3];

//HTML ids
const ID_BALLS = "balls";
const ID_BALL2BALL_SPRING = "ball2ball_spring";
const ID_BALL2BALL_RESTITUTION = "ball2ball_restitution";
const ID_STRING2BALL_SPRING = "string2ball_spring";
const ID_STRING2BALL_RESTITUTION = "string2ball_restitution";
const ID_GRAVITY_X = "gravity_x";
const ID_GRAVITY_Y = "gravity_y";

function CalculateViscosity(spring, restitution, mass) {
    //https://thesis.ceri.go.jp/db/files/00102920001.pdf
    let damping = Math.sqrt(Math.log(restitution)**2 / (Math.log(restitution)**2 + Math.PI**2));
    if (Approximate(restitution, 0)) {
        //same speed INF/INF = 1
        damping = 1
    }
    return 2 * damping * Math.sqrt(mass * spring);
}

const ID_BALL_LENGTH = "ball_length_";
const ID_BALL_MASS = "ball_mass_";
const ID_BALL_RADIUS = "ball_radius_";

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
    PutNumberInputField(ID_BALLS, "number of balls", balls_n, 1, 100, 1, OnBallsNChanged);

    //BALL2BALL
    PutNumberInputFieldE(ID_BALL2BALL_SPRING, "ball2ball_spring", BALL2BALL_SPRING, OnParametersChanged);
    PutNumberInputField(ID_BALL2BALL_RESTITUTION, "ball2ball_restitution", BALL2BALL_RESTITUTION, -1e18, 1e10, 0.01, OnParametersChanged);

    //STRING2BALL
    PutNumberInputFieldE(ID_STRING2BALL_SPRING, "string2ball_spring", STRING2BALL_SPRING, OnParametersChanged);
    PutNumberInputField(ID_STRING2BALL_RESTITUTION, "string2ball_restitution", STRING2BALL_RESTITUTION, -1e18, 1e10, 0.01, OnParametersChanged);

    //GRAVITY
    PutNumberInputField(ID_GRAVITY_X, "gravity_x", GRAVITY[0], -1e18, 1e18, 1, OnParametersChanged);
    PutNumberInputField(ID_GRAVITY_Y, "gravity_y", GRAVITY[1], -1e18, 1e18, 1, OnParametersChanged);

    //balls parameters
    for (let i = 0; i < balls_n; i++) {
        PutNumberInputField(ID_BALL_RADIUS + i, "ball_radius_" + i, RADIUS_INITIAL, 1, 1000, 1, OnParametersChanged);
        PutNumberInputField(ID_BALL_MASS + i, "ball_mass_" + i, MASS_INITIAL, 1, 1000, 1, OnParametersChanged);
        PutNumberInputField(ID_BALL_LENGTH + i, "ball_string_length_" + i, STRING_LENGTH_INITIAL, 1, 1000, 1, OnParametersChanged);
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
    BALL2BALL_RESTITUTION = GetNumberInputFieldValue(ID_BALL2BALL_RESTITUTION, true);

    //STRING2BALL
    STRING2BALL_SPRING = GetNumberInputFieldValueE(ID_STRING2BALL_SPRING);
    STRING2BALL_RESTITUTION = GetNumberInputFieldValue(ID_STRING2BALL_RESTITUTION, true);

    //GRAVITY
    GRAVITY[0] = GetNumberInputFieldValue(ID_GRAVITY_X, true);
    GRAVITY[1] = GetNumberInputFieldValue(ID_GRAVITY_Y, true);
}

function GetBallParameters() {
    //need to be seperated from GetParameters() because balls should be initialized

    //balls
    for (let i = 0; i < balls_n; i++) {
        balls[i].radius = GetNumberInputFieldValue(ID_BALL_RADIUS + i, true);
        balls[i].mass = GetNumberInputFieldValue(ID_BALL_MASS + i, true);
        balls[i].string_length = GetNumberInputFieldValue(ID_BALL_LENGTH + i, true);
    }
}

function AllocateBalls() {
    const center = GetCanvasSize()[0] / 2;
    const interval = RADIUS_INITIAL * 2;
    const y = ROOF_Y + STRING_LENGTH_INITIAL;

    for (let i = 0; i < balls_n; i++) {
        let x = center + interval * (i - balls_n/2);

        let pin = new Pin([x, ROOF_Y]);
        balls.push(new Ball([x, y], RADIUS_INITIAL, MASS_INITIAL, STRING_LENGTH_INITIAL, pin));
    }
}

function Draw(){
    //clear
    SetColor("white");
    DrawRect(0, 0, GetCanvasSize()[0], GetCanvasSize()[1]);

    //roof
    SetColor("black");
    DrawLine(0, ROOF_Y, GetCanvasSize()[0], ROOF_Y);

    //draw balls & pins
    for (let i = 0; i < balls_n; i++) {
        //ball
        SetColor(GetColor(i));
        balls[i].Draw();

        //pin
        balls[i].pin.Draw();
    }

    //draw strings
    for (let i = 0; i < balls_n; i++) {
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

function CalculateContactForce(spring, restitution, overlap, speed_relative, mass){
    //Descrete Element Method
    const force_spring = spring * overlap;
    const vigosity = CalculateViscosity(spring, restitution, mass);
    //Log(vigosity)
    const force_elastic = vigosity * speed_relative;

    return -force_elastic - force_spring;
}

function SimulateContactForce(){
    //for all combinations of balls
    for (let cnt0 = 0; cnt0 < balls.length -1; cnt0++) for (let cnt1 = cnt0+1; cnt1 < balls.length; cnt1++) { 
        //balls[cnt] and balls[cnt + 1] are neighbors
        const ball0 = balls[cnt0];
        const ball1 = balls[cnt1];

        //0-to-1 side: +
        //calculate relative amounts based on ball0

        //calculate overlap
        const distance = GetDistance(ball0.position, ball1.position);
        //for ball0(left side), overlap is to-right, so positive.
        let overlap = ball0.radius + ball1.radius - distance;
        if (overlap <= 0){
            //not contacting
            continue;
        }

        //calculate relative speed
        const zero2one = MinusVec(ball1.position, ball0.position);
        const speed_relative = DotVec(zero2one, MinusVec(ball0.velocity, ball1.velocity)) / GetVecLength(zero2one);

        //calculate force
        const force_sc0 = CalculateContactForce(BALL2BALL_SPRING, BALL2BALL_RESTITUTION, overlap, speed_relative, ball0.mass);
        const force0 = ChangeVecLength(zero2one, force_sc0);

        const force_sc1 = CalculateContactForce(BALL2BALL_SPRING, BALL2BALL_RESTITUTION, overlap, speed_relative, ball1.mass);
        const force1 = ChangeVecLength(MultiplyVec(-1, zero2one), force_sc1);

        //give force to the balls
        ball0.GiveForce(force0);
        ball1.GiveForce(force1);
    }
}

function SimulateGravity() {
    for (let cnt = 0; cnt < balls.length; cnt++) {
        balls[cnt].GiveForce(MultiplyVec(balls[cnt].mass, GRAVITY));
    }
}

//This function should be last before the movement simulation
function SimulateStringConstraint(){
    //for each ball
    for(let cnt = 0; cnt < balls.length; cnt++){
        //calculate string force
        const ball = balls[cnt];
        const pin = ball.pin;

        //to pin direction: +

        //calculate overlap
        const pin2ball = MinusVec(ball.position, pin.position);
        const string_tip_position = PlusVec(pin.position, ChangeVecLength(pin2ball, ball.string_length));
        let overlap = GetDistance(string_tip_position, ball.position);
        if (ball.string_length < GetVecLength(pin2ball)){
            //too far
            overlap = -overlap;
        }

        //calculate relative speed
        const speed_relative = DotVec(MultiplyVec(-1, pin2ball), ball.velocity) / GetVecLength(pin2ball);

        //calculate force
        const force_sc = CalculateContactForce(STRING2BALL_SPRING, STRING2BALL_RESTITUTION, overlap, speed_relative, ball.mass);

        //calculate force direction)
        const force = ChangeVecLength(MultiplyVec(-1, pin2ball), force_sc);

        //give force to the ball
        ball.GiveForce(force);
    }
}

function SimulateMovement() {
    //per ball
    for (let cnt = 0; cnt < balls.length; cnt++) {
        let ball = balls[cnt];

        //move the ball by F = ma
        const acceleration = MultiplyVec(1 / ball.mass, ball.f);

        ball.velocity = PlusVec(ball.velocity, MultiplyVec(SPF, acceleration));

        const displacement = MultiplyVec(SPF, ball.velocity);

        ball.position = PlusVec(ball.position, displacement);

        //reset force
        ball.ResetForce();
    }
}

//0->not clicking, 1->ball selected, 2->pin selected
var is_selecting = 0;
var selected_index = -1;
function Control(){
    if (GetMouse()){
        //get mouse position
        const mouse_position = GetMousePosition();

        if (is_selecting == 0) {
            //click starting
            is_selecting = true;

            //get nearest ball/pin
            let nearest_ball_index = 0;
            let nearest_ball_distance = 1e10;
            let nearest_pin_index = 0;
            let nearest_pin_distance = 1e10;
            for (let i = 0; i < balls_n; i++) {
                //ball
                let distance = GetDistance(mouse_position, balls[i].position);
                
                if (distance < nearest_ball_distance){
                    nearest_ball_distance = distance;
                    nearest_ball_index = i;
                }

                //pin
                distance = GetDistance(mouse_position, balls[i].pin.position);
                if (distance < nearest_pin_distance) {
                    nearest_pin_distance = distance;
                    nearest_pin_index = i;
                }
            }

            if (nearest_ball_distance < nearest_pin_distance) {
                //select ball
                is_selecting = 1;
                selected_index = nearest_ball_index
            } else {
                //select pin
                is_selecting = 2;
                selected_index = nearest_pin_index;
            }
        }
        
        if (is_selecting == 1){
            const pin2mouse = MinusVec(mouse_position, balls[selected_index].pin.position);
            const desired_position = PlusVec(ChangeVecLength(pin2mouse, balls[selected_index].string_length), balls[selected_index].pin.position);

            balls[selected_index].position = desired_position;

            //ball is stopping
            balls[selected_index].velocity = [0,0]
        } else if (is_selecting == 2) {
            let position = mouse_position;

            //snap align
            const snap_distance = 10;
            if (Math.abs(position[1] - ROOF_Y) < snap_distance) {
                position[1] = ROOF_Y;
            }

            //move pin
            balls[selected_index].pin.position = mouse_position;
        }
    } else {
        is_selecting = 0;
    }
}

StopAllTouchDefaults();

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
const canvas = document.getElementById("canvas")

const ctx = canvas.getContext("2d")

const dt = 0.016 / 2 / 2 // static dt so that pid is deterministic, divide by 2 for double iteration, then again for viewing ease
const outputToPhysical = 200 // represents voltage to velocity
let lastAngle = 0
const state = {
    theta: 0,
    omega: 0
}
let initial = 40 * Math.PI / 180
let goal = 120 * Math.PI / 180

const x0Elem = document.getElementById("x0")
const xfElem = document.getElementById("xf")
const gElem = document.getElementById("g")
const lenElem = document.getElementById("len")
const mElem = document.getElementById("m")
const fricElem = document.getElementById("fric")
const kGElem = document.getElementById("kg")
const kPElem = document.getElementById("kp")
const kDElem = document.getElementById("kd")

const x0 = () => x0Elem.checked
const xf = () => xfElem.checked
const g = () => parseFloat(gElem.value)
const len = () => parseFloat(lenElem.value)
const m = () => parseFloat(mElem.value)
const fric = () => parseFloat(fricElem.value)
const kG = () => parseFloat(kGElem.value)
const kP = () => parseFloat(kPElem.value)
const kD = () => parseFloat(kDElem.value)

const rerun = () => {
    lastAngle = initial
    state.theta = initial
    state.omega = 0
}

[gElem, lenElem, mElem, fricElem, kGElem, kPElem, kDElem].forEach(elem => elem.addEventListener("input", rerun))

rerun()

let mouseDown = false
canvas.addEventListener("mousedown", () => mouseDown = true)
canvas.addEventListener("mouseup", () => mouseDown = false)

canvas.addEventListener("mousemove", (e) => {
    if (!mouseDown) return

    const dx = e.offsetX - 0.5 * canvas.width
    const dy = -(e.offsetY - 0.5 * canvas.height)

    const angle = Math.atan2(dy, dx) + 0.5 * Math.PI
    
    if(x0()){
        initial = angle
    } else if(xf()){
        goal = angle
    }

    rerun()
})

const calculateError = (position) => {
    const error = goal - position

    return error
}

const calculateOutput = () => {
    const ff = Math.sin(state.theta)

    const proportional = calculateError(state.theta)

    const oldError = calculateError(lastAngle)
    const newError = calculateError(state.theta)

    const derivative = (newError - oldError) / dt

    return kG() * ff + kP() * proportional + kD() * derivative
}

const applyOutput = () => {
    if (mouseDown) return

    const momentOfInertia = m() * len() * len()

    const gravity = -(m() * g() * Math.sin(state.theta)) / momentOfInertia
    const friction = fric() * Math.sin(state.omega)
    const output = calculateOutput()
    
    state.omega += dt * (gravity - friction + output * outputToPhysical) / momentOfInertia
    state.theta += dt * state.omega
}

const render = () => {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.height)

    for(let i = 0;i<2;i++){
        applyOutput()
    }
    lastAngle = state.theta
    
    const stateP0 = {
        x: 0.5 * canvas.width,
        y: 0.5 * canvas.height
    }

    const stateP1 = {
        x: stateP0.x + 100 * len() * Math.cos(state.theta - 0.5 * Math.PI),
        y: stateP0.y - 100 * len() * Math.sin(state.theta - 0.5 * Math.PI)
    }

    ctx.fillStyle = "red"

    ctx.beginPath()
    ctx.arc(stateP0.x, stateP0.y, 2, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.arc(stateP1.x, stateP1.y, 4, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = "red"

    ctx.beginPath()
    ctx.moveTo(stateP0.x, stateP0.y)
    ctx.lineTo(stateP1.x, stateP1.y)
    ctx.closePath()
    ctx.stroke()

    const goalP0 = {
        x: 0.5 * canvas.width,
        y: 0.5 * canvas.height
    }

    const goalP1 = {
        x: goalP0.x + 100 * len() * Math.cos(goal - 0.5 * Math.PI),
        y: goalP0.y - 100 * len() * Math.sin(goal - 0.5 * Math.PI)
    }

    ctx.fillStyle = "green"

    ctx.beginPath()
    ctx.arc(goalP0.x, goalP0.y, 2, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.arc(goalP1.x, goalP1.y, 2, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = "green"

    ctx.beginPath()
    ctx.moveTo(goalP0.x, goalP0.y)
    ctx.lineTo(goalP1.x, goalP1.y)
    ctx.closePath()
    ctx.stroke()

    requestAnimationFrame(render)
}

render()
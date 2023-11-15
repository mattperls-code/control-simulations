const canvas = document.getElementById("canvas")

const ctx = canvas.getContext("2d")

let graphPoints = []

const graphScale = {
    bottom: -180,
    top: 180,
    left: 0,
    right: 3,
    independent: "Time (sec)",
    dependent: "Position (deg)",
    marginLeft: 250,
    marginRight: 290,
    marginTop: 100,
    marginBottom: 220
}

const dataPointToRenderSpace = (x, y) => {
    const percentX = (x - graphScale.left) / (graphScale.right - graphScale.left)
    const percentY = (y - graphScale.bottom) / (graphScale.top - graphScale.bottom)

    return {
        x: graphScale.marginLeft + percentX * (canvas.width - graphScale.marginLeft - graphScale.marginRight),
        y: canvas.height - (graphScale.marginBottom + percentY * (canvas.height - graphScale.marginTop - graphScale.marginBottom))
    }
}

const dt = 0.016 / 2 / 2 // static dt so that pid is deterministic, divide by 2 for double iteration, then again for viewing ease
const outputToPhysical = 100 // represents voltage to velocity
const state = {
    time: 0,
    position: 0,
    velocity: 0
}
let goal = 0

const x0Elem = document.getElementById("x0")
const v0Elem = document.getElementById("v0")
const xfElem = document.getElementById("xf")
const fricElem = document.getElementById("fric")
const trackElem = document.getElementById("track")
const kPElem = document.getElementById("kp")
const kDElem = document.getElementById("kd")
const wrapElem = document.getElementById("wrap")

const x0 = () => parseFloat(x0Elem.value)
const v0 = () => parseFloat(v0Elem.value)
const xf = () => parseFloat(xfElem.value)
const fric = () => parseFloat(fricElem.value)
const track = () => trackElem.checked
const kP = () => parseFloat(kPElem.value)
const kD = () => parseFloat(kDElem.value)
const wrap = () => wrapElem.checked

const rerun = () => {
    graphPoints = []

    graphScale.left = 0
    graphScale.right = 3

    state.time = 0
    state.position = x0()
    state.velocity = v0()
    goal = xf()
}

[x0Elem, v0Elem, xfElem, fricElem, trackElem, kPElem, kDElem, wrapElem].forEach(elem => elem.addEventListener("input", rerun))

rerun()

const filledGraph = () => graphPoints.length + 1 > (graphScale.right - graphScale.left) / dt

const calculateError = (position) => {
    let error = goal - position

    if(wrap()){
        while (error < -180) error += 360
        while (error > 180) error -= 360
    }

    return error
}

const calculateOutput = () => {
    const proportional = calculateError(state.position)

    let derivative = 0
    if(graphPoints.length > 1){
        const oldError = calculateError(graphPoints[graphPoints.length - 2].y)
        const newError = calculateError(graphPoints[graphPoints.length - 1].y)

        derivative = (newError - oldError) / dt
    }

    return kP() * proportional + kD() * derivative
}

const applyOutput = () => {
    state.time += dt
    state.velocity += dt * (calculateOutput() * outputToPhysical - fric() * Math.sign(state.velocity))
    state.position += dt * state.velocity

    if(wrap()){
        while (state.position < -180) state.position += 360
        while (state.position > 180) state.position -= 360
    }
}

const plotPoint = () => {
    graphPoints.push({ x: state.time, y: state.position })
}

const render = () => {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.height)

    const topLeft = dataPointToRenderSpace(graphScale.left, graphScale.top)
    const bottomLeft = dataPointToRenderSpace(graphScale.left, graphScale.bottom)
    const bottomRight = dataPointToRenderSpace(graphScale.right, graphScale.bottom)

    ctx.lineWidth = 1
    ctx.strokeStyle = "black"
    ctx.beginPath()
    ctx.moveTo(topLeft.x, topLeft.y)
    ctx.lineTo(bottomLeft.x, bottomLeft.y)
    ctx.lineTo(bottomRight.x, bottomRight.y)
    ctx.lineTo(bottomLeft.x, bottomLeft.y)
    ctx.closePath()
    ctx.stroke()

    const goalStart = dataPointToRenderSpace(graphScale.left, goal)
    const goalEnd = dataPointToRenderSpace(graphScale.right, goal)
    ctx.strokeStyle = "green"
    ctx.beginPath()
    ctx.moveTo(goalStart.x, goalStart.y)
    ctx.lineTo(goalEnd.x, goalEnd.y)
    ctx.closePath()
    ctx.stroke()

    ctx.font = "20px arial"

    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "green"
    ctx.fillText("Goal", goalEnd.x + 20, goalEnd.y)

    ctx.textAlign = "right"
    ctx.fillText(goal, goalStart.x - 5, goalStart.y)

    ctx.textBaseline = "bottom"
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.fillText(graphScale.dependent, topLeft.x, topLeft.y - 20)

    ctx.textBaseline = "middle"
    ctx.textAlign = "left"
    ctx.fillText(graphScale.independent, bottomRight.x + 20, bottomRight.y)

    ctx.textAlign = "right"
    ctx.fillText(graphScale.bottom, bottomLeft.x - 5, bottomLeft.y)

    ctx.textBaseline = "top"
    ctx.fillText(graphScale.top, topLeft.x - 5, topLeft.y)

    ctx.textAlign = "left"
    ctx.fillText(graphScale.left.toFixed(1), bottomLeft.x, bottomLeft.y + 5)

    ctx.textAlign = "right"
    ctx.fillText(graphScale.right.toFixed(1), bottomRight.x, bottomRight.y + 5)

    for(let i = 0;i<2;i++){
        if(track()){
            if(filledGraph()){
                graphPoints.shift()
        
                graphScale.left += dt
                graphScale.right += dt
            }
    
            applyOutput()
            plotPoint()
        } else {
            if(!filledGraph()){
                applyOutput()
                plotPoint()
            }
        }
    }

    ctx.fillStyle = "red"
    graphPoints.forEach(point => {
        const { x, y } = dataPointToRenderSpace(point.x, Math.max(Math.min(point.y, graphScale.top), graphScale.bottom))

        ctx.beginPath()
        ctx.arc(x, y, 1, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.fill()
    })

    ctx.lineWidth = 4
    ctx.strokeStyle = "red"
    ctx.beginPath()
    ctx.moveTo(0.5 * canvas.width - 50 * Math.cos(state.position * Math.PI / 180), canvas.height - 100 + 50 * Math.sin(state.position * Math.PI / 180))
    ctx.lineTo(0.5 * canvas.width + 50 * Math.cos(state.position * Math.PI / 180), canvas.height - 100 - 50 * Math.sin(state.position * Math.PI / 180))
    ctx.closePath()
    ctx.stroke()

    ctx.fillStyle = "red"
    ctx.beginPath()
    ctx.arc(0.5 * canvas.width + 50 * Math.cos(state.position * Math.PI / 180), canvas.height - 100 - 50 * Math.sin(state.position * Math.PI / 180), 4, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    ctx.lineWidth = 4
    ctx.strokeStyle = "green"
    ctx.beginPath()
    ctx.moveTo(0.5 * canvas.width - 50 * Math.cos(goal * Math.PI / 180), canvas.height - 100 + 50 * Math.sin(goal * Math.PI / 180))
    ctx.lineTo(0.5 * canvas.width + 50 * Math.cos(goal * Math.PI / 180), canvas.height - 100 - 50 * Math.sin(goal * Math.PI / 180))
    ctx.closePath()
    ctx.stroke()

    ctx.fillStyle = "green"
    ctx.beginPath()
    ctx.arc(0.5 * canvas.width + 50 * Math.cos(goal * Math.PI / 180), canvas.height - 100 - 50 * Math.sin(goal * Math.PI / 180), 4, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()

    requestAnimationFrame(render)
}

render()
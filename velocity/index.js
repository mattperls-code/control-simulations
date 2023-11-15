const canvas = document.getElementById("canvas")

const ctx = canvas.getContext("2d")

let graphPoints = []

const graphScale = {
    bottom: 0,
    top: 10000,
    left: 0,
    right: 1,
    independent: "Time (sec)",
    dependent: "Velocity (rpm)",
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
    velocity: 0
}
let goal = 0

const v0Elem = document.getElementById("v0")
const vfElem = document.getElementById("vf")
const fricElem = document.getElementById("fric")
const trackElem = document.getElementById("track")
const kPElem = document.getElementById("kp")
const kFFElem = document.getElementById("kff")

const v0 = () => parseFloat(v0Elem.value)
const vf = () => parseFloat(vfElem.value)
const fric = () => parseFloat(fricElem.value)
const track = () => trackElem.checked
const kP = () => parseFloat(kPElem.value)
const kFF = () => parseFloat(kFFElem.value)

const rerun = () => {
    graphPoints = []

    graphScale.left = 0
    graphScale.right = 1

    state.time = 0
    state.velocity = v0()
    goal = vf()
}

[v0Elem, vfElem, fricElem, trackElem, kPElem, kFFElem].forEach(elem => elem.addEventListener("input", rerun))

rerun()

const filledGraph = () => graphPoints.length + 1 > (graphScale.right - graphScale.left) / dt

const calculateError = (position) => {
    const error = goal - position
    
    return error
}

const calculateOutput = () => {
    const proportional = calculateError(state.velocity)

    return kP() * proportional + kFF() * goal
}

const applyOutput = () => {
    state.time += dt
    state.velocity += dt * (calculateOutput() * outputToPhysical - fric() * state.velocity)
}

const plotPoint = () => {
    graphPoints.push({ x: state.time, y: state.velocity })
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

    requestAnimationFrame(render)
}

render()
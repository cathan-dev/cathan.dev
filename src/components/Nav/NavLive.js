const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_MINUTE = 60 * 1000
const MS_PER_SECOND = 1000

const navLiveElements = {
    liveTimer: document.querySelector(".nav-live-timer")
}

const navLiveData = {
    calcDays: "",
    calcHours: "",
    calcMinutes: "",
    calcSeconds: ""
}

function getTimeSince() {
    return Math.max(0, Date.now() - Date.parse(navLiveElements.liveTimer.dataset.since))
}

function calcData(timeSince) {
    navLiveData.calcDays = Math.trunc(timeSince / MS_PER_DAY).toString()
    timeSince = timeSince % MS_PER_DAY

    navLiveData.calcHours = Math.trunc(timeSince / MS_PER_HOUR).toString().padStart(2, "0")
    timeSince = timeSince % MS_PER_HOUR

    navLiveData.calcMinutes = Math.trunc(timeSince / MS_PER_MINUTE).toString().padStart(2, "0")
    timeSince = timeSince % MS_PER_MINUTE

    navLiveData.calcSeconds = Math.trunc(timeSince / MS_PER_SECOND).toString().padStart(2, "0")
}

function setTimer() {
    const timerString = navLiveData.calcDays + "d " + navLiveData.calcHours + ":" + navLiveData.calcMinutes + ":" + navLiveData.calcSeconds
    navLiveElements.liveTimer.textContent = timerString
}

function updateTimer() {
    calcData(getTimeSince())
    setTimer()
}

function main() {
    updateTimer()

    setInterval(updateTimer, 1000)
}

main()
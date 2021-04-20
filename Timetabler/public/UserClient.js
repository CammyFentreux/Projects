'use strict'
const calendar = getParameterByName("calendar");

function generateTimeTable() {
    const table     = document.getElementById("tblTimetable")
    const days      = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const timeRange = [9, 10, 11, 12, 1, 2, 3, 4, 5]

    generateTimeTableHead(table, days)
    generateTimeTableBody(table, days, timeRange)

}

function generateTimeTableHead(table, days) {
    let thead = table.createTHead()
    let row = thead.insertRow()
    for (let day of days) {
        let th = document.createElement("th")
        th.appendChild(document.createTextNode(day))
        row.appendChild(th)
    }
}

function generateTimeTableBody(table, days, timeRange) {
    let tbody = document.createElement("tbody")

    for (let increment of timeRange) {
        let row = tbody.insertRow()

        for (let day of days) {
            if (day === "") {
                let th = document.createElement("th")
                th.appendChild(document.createTextNode(increment))
                row.appendChild(th)
            } else {
                const cell = row.insertCell()
                cell.classList.add('timetable-region')
                cell.id = day + increment
                cell.setAttribute('tabindex', '0')
                queryAvailability(day.toLowerCase() + increment, cell)
            }
        }
    }

    table.appendChild(tbody)
}

function saveAvailabilities() {
    xhttpRequest('/clearUserAvailability', (xhttp) => {
        if (xhttp.responseText === "success") {
            let frees  = document.querySelectorAll("td.freetime")
            let busies = document.querySelectorAll("td.busy")

            for (let cell of frees) {
                saveAvailability(1, cell.id)
            }

            for (let cell of busies) {
                saveAvailability(0, cell.id)
            }
        } else {
            console.log("Save Failed on clearUserAvailability")
            console.error(err)
        }
    }, "calendar=" + calendar)
}

function saveAvailability(free, datetime) {
    xhttpRequest('/saveUserAvailability', (xhttp) => {
        if (xhttp.responseText === "success") {
            console.log("Save Successful")
        } else {
            console.log("Save Failed on saveUserAvailability")
            console.error(err)
        }
    }, "calendar=" + calendar + "&datetime=" + datetime.toLowerCase() + "&free=" + free)
}

function queryAvailability(datetime, cell) {
    xhttpRequest('/getUserAvailability', function(xhttp) {
        if (xhttp.responseText !== "empty") {
            cell.classList.add(xhttp.responseText === "1" ? "freetime" : "busy")
        }
    }, "calendar=" + calendar + "&datetime=" + datetime)
}

function toggleTblCellClass(cell) {
  if (cell.classList.contains('freetime')) {
    cell.classList.remove('freetime')
    cell.classList.add('busy')
  } else if (cell.classList.contains('busy')) {
    cell.classList.remove('busy')
  } else {
    cell.classList.add('freetime')
  }
}

window.addEventListener('load', () => {
    generateTimeTable()
    document.getElementById("saveBtn").addEventListener("click", saveAvailabilities)
    document.getElementById("lightDarkSwitch").addEventListener("click", function() {
        let body = document.getElementsByTagName("body")[0];
        if (body.classList.contains('dark')) {
            this.innerText = "Dark Mode";
            body.classList.remove('dark');
        } else {
            this.innerText = "Light Mode";
            body.classList.add('dark');
        }
    })
    document.getElementById("logoutBtn").addEventListener("click", function() {
        xhttpRequest('logout', function(xhttp) {
            window.location.href = "./login";
        })
    })
})

let isDragging = false


window.addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('timetable-region')) {
    e.target.setAttribute('current-drag', 'true')
    isDragging = true
    e.preventDefault()
    return toggleTblCellClass(e.target)
  }
})
window.addEventListener('mousemove', function(e) {
  if (isDragging && e.target.classList.contains('timetable-region') && e.target.getAttribute('current-drag') !== 'true') {
    e.target.setAttribute('current-drag', 'true')
    e.preventDefault()
    return toggleTblCellClass(e.target)
  }
})
window.addEventListener('mouseup', function(e) {
  if (isDragging) {
    isDragging = false
    document.querySelectorAll('.timetable-region[current-drag]')
      .forEach(e => e.removeAttribute('current-drag'))
  }
})

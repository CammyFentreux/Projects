'use strict'
const data = "{\n" +
		"  \"availability\": [{\n" +
		"    \"id\": \"0\",\n" +
		"    \"user\": \"bob\",\n" +
		"    \"calendar\": \"monday\",\n" +
		"    \"datetime\": \"9\",\n" +
		"    \"free\": \"1\"\n" +
		"  }, {\n" +
		"    \"id\": \"1\",\n" +
		"    \"user\": \"bob\",\n" +
		"    \"calendar\": \"monday\",\n" +
		"    \"datetime\": \"10\",\n" +
		"    \"free\": \"0\"\n" +
		"  }, {\n" +
		"    \"id\": \"2\",\n" +
		"    \"user\": \"gerald\",\n" +
		"    \"calendar\": \"monday\",\n" +
		"    \"datetime\": \"9\",\n" +
		"    \"free\": \"1\"\n" +
		"  }, {\n" +
		"    \"id\": \"3\",\n" +
		"    \"user\": \"gerald\",\n" +
		"    \"calendar\": \"monday\",\n" +
		"    \"datetime\": \"11\",\n" +
		"    \"free\": \"0\"\n" +
		"  }]\n" +
		"}"
const user = "bob"

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
        cell.setAttribute('tabindex', '0')

        const initialClass = queryAvailability(increment, day, user)
        if (initialClass.length > 0)
          cell.classList.add(initialClass)
			}
		}
	}

	table.appendChild(tbody)
}

function queryAvailability(datetime, calendar, user) {
	return ""
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

document.addEventListener('DOMContentLoaded', () => {
	generateTimeTable()
})

let isDragging = false


window.addEventListener('mousedown', function(e) {
  if (e.target.classList.contains('timetable-region') && e.target.getAttribute('current-drag') !== 'true') {
    isDragging = true
    e.target.setAttribute('current-drag', 'true')
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
window.addEventListener('click', function(e) {
  if (e.target.classList.contains('timetable-region') && e.target.getAttribute('current-drag') !== 'true') {
    e.target.setAttribute('current-drag', 'true')
    e.preventDefault()
    return toggleTblCellClass(e.target)
  }
})

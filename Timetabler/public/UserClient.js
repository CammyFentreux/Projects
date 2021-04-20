'use strict'
const calendar = getParameterByName("calendar");
let isDragging = false

/**
 * Generates a timetable of variable time frame
 * <p>
 * The table is created in a `<table>` with an id of 'tblTimetable'
 * @see generateTimeTableHead
 * @see generateTimeTableBody
 */
function generateTimeTable() {
	const table     = document.getElementById("tblTimetable")
	const days      = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

	const timeRange = [9, 10, 11, 12, 1, 2, 3, 4, 5]
	generateTimeTableHead(table, days)

	generateTimeTableBody(table, days, timeRange)

}
/**
 * Generates the header of a timetable
 *
 * @param table  The `<table>` element to be built upon
 * @param days   An array of strings representing each column header. The first element should be appropriate for an filler column, allowing the left-most column row headers in the body
 * @see generateTimeTable
 */
function generateTimeTableHead(table, days) {
	let thead = table.createTHead()
	let row = thead.insertRow()

	for (let day of days) {  // for every day, create a table header and add a text node with the name of the day
		let th = document.createElement("th")
		th.appendChild(document.createTextNode(day))
		row.appendChild(th)
	}

}
/**
 * Generates the body of a timetable.
 * <p>
 * The left-most column contains row headers denoting the time for each row
 *
 * @param table      The `<table>` element to be built upon
 * @param days       An array of strings representing each column header. The first element should be appropriate for a header of the row headers
 * @param timeRange  An array of times with length corresponding to the number of rows
 * @see generateTimeTable
 */
function generateTimeTableBody(table, days, timeRange) {

	let tbody = document.createElement("tbody")
	for (let increment of timeRange) {

		let row = tbody.insertRow()
		for (let day of days) {
			if (day === "") {  // create row headers
				const th = document.createElement("th")
				th.appendChild(document.createTextNode(increment))
				row.appendChild(th)
			} else {           // create normal cells
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
/**
 * Saves the current calendar
 * <p>
 * Neutral cells -those with no class of 'busy' or 'freetime'- are not saved
 * TODO: This can probably be refactored to send everything at once. See issue #23
 * @see saveAvailability
 */
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
/**
 * Saves a single cell of the calendar
 *
 * @param free      An int that should be either 1 or 0, denoting if a cell is free or busy
 * @param datetime  A string containing one of the row headers concatenated to one of the column headers, eg: "monday9" for monday at 9
 */
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
/**
 * Queries the freeness/busyness of a single cell
 *
 * @param datetime  A string containing one of the row headers concatenated to one of the column headers, eg: "monday9" for monday at 9
 * @param cell      The cell to set availability for
 */
function queryAvailability(datetime, cell) {
	xhttpRequest('/getUserAvailability', function(xhttp) {
		if (xhttp.responseText !== "empty") {
			cell.classList.add(xhttp.responseText === "1" ? "freetime" : "busy")
		}
	}, "calendar=" + calendar + "&datetime=" + datetime)

}
/**
 * Toggles the freeness of a cell.
 * <p>
 * Neutral gray ("") -> free green ("freetime") -> busy red ("busy"), then back to neutral
 * @param cell
 */
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

// ------------- Events -------------
// Sets up the page on load
window.addEventListener('load', () => {
	generateTimeTable()
	// Set click events to UI elements
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
			window.location.href = "./login"
		})
	})
})

// Checks for when the mouse clicked to begin the drag selection of cells
window.addEventListener('mousedown', function(e) {
	if (e.target.classList.contains('timetable-region')) {
		e.target.setAttribute('current-drag', 'true')
		isDragging = true
		e.preventDefault()
		return toggleTblCellClass(e.target)
	}
})
// Checks for when the mouse moves while clicked. Toggles the state of every cell entered, once per click and drag cycle
window.addEventListener('mousemove', function(e) {
	// if a drag is in progress and the mouse is over a cell and the cell has not yet been dragged over:
	if (isDragging && e.target.classList.contains('timetable-region') && e.target.getAttribute('current-drag') !== 'true') {
		e.target.setAttribute('current-drag', 'true')
		e.preventDefault()
		return toggleTblCellClass(e.target)
	}
})
// Checks for when the mouse is released, ending a drag selection of cells
window.addEventListener('mouseup', function(e) {
	if (isDragging) {
		isDragging = false
		document.querySelectorAll('.timetable-region[current-drag]')
				.forEach(e => e.removeAttribute('current-drag'))
	}
})

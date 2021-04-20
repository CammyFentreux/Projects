'use strict'
const calendar = getParameterByName("calendar");
let isDragging = false

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
		}
	}, "calendar=" + calendar)
}

/**
 * Saves a single cell of the calendar
 *
 * @param {number|string} free      An int that should be either 1 or 0, denoting if a cell is free or busy
 * @param {string}        datetime  A string containing one of the row headers concatenated to one of the column headers, eg: "monday9" for monday at 9
 */
function saveAvailability(free, datetime) {
	xhttpRequest('/saveUserAvailability', (xhttp) => {
		if (xhttp.responseText === "success") {
			console.log("Save Successful")
		} else {
			console.log("Save Failed on saveUserAvailability")
		}
	}, "calendar=" + calendar + "&datetime=" + datetime + "&free=" + free)
}

/**
 * Queries the freeness/busyness of a single cell
 *
 * @param {HTMLTableCellElement} cell  The cell to set availability for
 */
function queryAvailability(cell) {
	xhttpRequest('/getUserAvailability', function(xhttp) {
		if (xhttp.responseText !== "empty") {
			cell.classList.add(xhttp.responseText === "1" ? "freetime" : "busy")
		}
	}, "calendar=" + calendar + "&datetime=" + cell.id)
}

/**
 * Toggles the freeness of a cell.
 * <p>
 * Neutral gray ("") -> free green ("freetime") -> busy red ("busy"), then back to neutral
 *
 * @param {HTMLTableCellElement}cell
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
	document.getElementById("lightDarkSwitch").addEventListener("click", toggleDarkMode)
	document.getElementById("logoutBtn").addEventListener("click", function() {
		xhttpRequest('logout', function(xhttp) {
			window.location.href = "./login"
		})
	})
})

// Checks for when the mouse clicked to begin the drag selection of cells
window.addEventListener('mousedown', function(e) {
	if (e.target.classList.contains('timetable-region')) {
		isDragging = true
		e.target.setAttribute('current-drag', 'true')
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
		document.querySelectorAll('.timetable-region[current-drag]').forEach(e => e.removeAttribute('current-drag'))
	}
})

const calendar = getParameterByName("calendar")
const visibleAvailabilityUsernames = []
const visibleAvailabilityIDs = []

/**
 * Queries the freeness/busyness of a single cell
 *
 * @param {HTMLTableCellElement} cell  The cell to set availability for
 */
function queryAllAvailabilities(cell) {
	xhttpRequest('/getAllAvailabilities', (xhttp) => {
		if (xhttp.responseText !== "Error" && xhttp.responseText !== "Empty") {
			cell.style.backgroundColor = calculateCellColour(JSON.parse(xhttp.responseText))
		}
	}, "calendar=" + calendar + "&datetime=" + cell.id)
}

function queryAvailability(cell) {
	xhttpRequest('/getAvailabilities', (xhttp) => {
		if (xhttp.responseText !== "Error" && xhttp.responseText !== "Empty") {
			cell.style.backgroundColor = calculateCellColour(JSON.parse(xhttp.responseText))
		}
	}, "calendar=" + calendar + "&datetime=" + cell.id + "&subset=" + visibleAvailabilityUsernames)
}

function queryAccess() {
	xhttpRequest('/getCalendarAccess', (xhttp) => {
		populateUserList(JSON.parse(xhttp.responseText))
	}, "calendar=" + calendar)
}

function populateUserList(users) {
	const heatmapControl = document.getElementById('heatmapControlPanel')
	for (const {username, id} of users) {
		const input     = document.createElement('input')
		const label     = document.createElement('label')
		label.innerText = username
		input.name      = username
		input.id_       = id
		input.checked   = true
		input.onclick   = onCheckboxClick

		input.setAttribute('type', 'checkbox')
		visibleAvailabilityUsernames.push(username)
		visibleAvailabilityIDs.push(id)

		heatmapControl.appendChild(input)
		heatmapControl.appendChild(label)
	}
}

function calculateCellColour(availabilities) {
	// todo: get and use total users of calendar for percentage calculation
	let intensity = 0
	for (let availability of availabilities) {
		intensity += availability.free === 1? 1 : -1
	}
	let intensity_ = (Math.abs(intensity) / visibleAvailabilityUsernames.length)
	let [neutralRGB, intenseRGB] = getRGB(intensity > 0? "freetime" : "busy"),
			working = ""
	for (let i = 0; i < neutralRGB.length; i++) {
		working += (neutralRGB[i] + (intenseRGB[i] * intensity_))
		if (i < neutralRGB.length - 1) working += ","
	}
	return `\\rgb(${working})`
}

function getRGB(type) {
	let body = document.getElementsByTagName("body")[0]

	if (body.classList.contains('dark')) {
		return [[55, 55, 55], type === "freetime"? [4, 70, -4] : [145, -23, -23]]
	} else {  // TODO: currently doesn't work since this is all only called on load
		return [[190, 190, 190], type === "freetime"? [-84, -3, -93] : [32, -156, -156]]
	}
}

/**
 * Generates the body of a timetable.
 * <p>
 * The left-most column contains row headers denoting the time for each row
 *
 * @param {HTMLTableElement} table      The `<table>` element to be built upon
 * @param {string[]}         days       An array of strings representing each column header. The first element should be appropriate for a header of the row headers
 * @param {string[]}         timeRange  An array of times with length corresponding to the number of rows
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
				cell.id    = (day + increment).toLowerCase()
				cell.classList.add('timetable-region')
				cell.setAttribute('tabindex', '0')
				queryAllAvailabilities(cell)
			}
		}
	}
	table.appendChild(tbody)
}

// ---------- Events ----------
// Sets up the page on load

function onCheckboxClick({target}) {
	if (target.checked) {
		visibleAvailabilityUsernames.push(target.name)
		visibleAvailabilityIDs.push(target.id_)
	} else {
		let index = visibleAvailabilityUsernames.indexOf(target.name)
		if (index > -1) {
			visibleAvailabilityUsernames.splice(index,1)
			visibleAvailabilityIDs.splice(index,1)
		}
	}

	for (let cell of document.getElementsByTagName('td')) {
		cell.style.backgroundColor = "\\rgb(55,55,55)"
		queryAvailability(cell)
	}
}

window.addEventListener('load', () => {
	document.getElementById("userBtn").addEventListener("click", function() {
        window.location.href="./user?calendar=" + calendar
    })
	queryAccess()
})

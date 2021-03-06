const calendar = getParameterByName("calendar")
const visibleAvailabilityUsernames = []

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
	const heatmapControl = document.getElementById('controlPanelUsers')
	for (const {username, id} of users) {
		const input      = document.createElement('input')
		const label      = document.createElement('label')
		const button     = document.createElement('button')
		const div        = document.createElement('div')
		button.innerText = "X"
		button.type      = "button"
		button.onclick   = revokeAccess
		button.name      = username
		label.innerText  = username
		div.id           = username
		input.name       = username
		input.checked    = true
		input.onclick    = onCheckboxClick

		input.setAttribute('type', 'checkbox')
		button.classList.add("revokeAccessBtn")
		div.classList.add('userEntryHeatmap')
		visibleAvailabilityUsernames.push(username)

		div.appendChild(button)
		label.appendChild(input)
		div.appendChild(label)
		heatmapControl.appendChild(div)
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

function revokeAccess({target}) {
	xhttpRequest('/revokeAccess', (xhttp) => {
		if (xhttp.responseText === "Error") {
			console.log("Error revoking access from " + target.name)
		} else {
			document.getElementById(target.name).remove()
			console.log("Revoked access from " + target.name)

		}
	}, "calendar=" + calendar + "&username=" + target.name)
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
	} else {
		let index = visibleAvailabilityUsernames.indexOf(target.name)
		if (index > -1) {
			visibleAvailabilityUsernames.splice(index,1)
		}
	}

	for (let cell of document.getElementsByTagName('td')) {
		cell.style.backgroundColor = "\\rgb(55,55,55)"
		queryAvailability(cell)
	}
}

window.addEventListener('load', () => {
	queryAccess()
	document.getElementById("userBtn").addEventListener("click", function() {
        window.location.href="./user?calendar=" + calendar
    })
    document.getElementById("generateInviteLink").addEventListener("click", function() {
        xhttpRequest('/createInviteLink', function(xhttp) {
            if (xhttp.responseText.substring(0, 7) === "success") {
                document.getElementById("inviteByLink").value = "https://" + window.location.hostname + "/joinCalendar?calendar=" + encodeURIComponent(calendar) + "&inviteHash=" + encodeURIComponent(xhttp.responseText.substring(9))
            }
        }, "calendar=" + calendar)
    })
	setupView()
})

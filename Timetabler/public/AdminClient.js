const calendar = getParameterByName("calendar");

/**
 * Queries the freeness/busyness of a single cell
 *
 * @param {HTMLTableCellElement} cell  The cell to set availability for
 */
function queryAvailability(cell) {
	xhttpRequest('/getAllAvailabilities', (xhttp) => {
		if (xhttp.responseText !== "Error" && xhttp.responseText !== "Empty") {
			cell.style.backgroundColor = calculateCellColour(cell, JSON.parse(xhttp.responseText))
		}
	}, "calendar=" + calendar + "&datetime=" + cell.id)
}

function calculateCellColour(cell, availabilities) {
	// todo: get and use total users of calendar for percentage calculation
	let intensity = 0
	if (cell.id === "monday9") console.log(availabilities)
	for (let availability of availabilities) {
		intensity += availability.free === 1? 1 : -1
		if (cell.id === "monday9") console.log(intensity, availability)
	}
	if (cell.id === "monday9") console.log(intensity)
	let intensity_ = (Math.abs(intensity) / availabilities.length)
	if (cell.id === "monday9") console.log(intensity_)
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
		return [[55, 55, 55], type === "freetime"? [59, 125, 52] : [200, 32, 32]]
	} else {  // TODO: currently doesn't work since this is all only called on load
		return [[190, 190, 190], type === "freetime"? [106, 187, 97] : [222, 34, 34]]
	}
}


// ---------- Events ----------
// Sets up the page on load
window.addEventListener('load', () => {
	generateTimeTable()
	// Set click events to UI elements
	document.getElementById("lightDarkSwitch").addEventListener("click", toggleDarkMode)
	document.getElementById("logoutBtn").addEventListener("click", function() {
		xhttpRequest('logout', function(xhttp) {
			window.location.href = "./login"
		})
	})
})

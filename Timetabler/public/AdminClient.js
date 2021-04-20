const calendar = getParameterByName("calendar");

/**
 * Queries the freeness/busyness of a single cell
 *
 * @param {HTMLTableCellElement} cell  The cell to set availability for
 */
function queryAvailability(cell) {
	xhttpRequest('/getAllAvailabilities', (xhttp) => {
		if (xhttp.responseText !== "Error" && xhttp.responseText !== "Empty") {
			const results = JSON.parse(xhttp.responseText)
			let intensity = 0
			for (let result of results) {
				intensity += result.free === 1? 1 : -1
			}
			// cell.setAttribute("style", `background-color: red;`);
			let colour = 255 * (Math.abs(intensity) / results.length)
			console.log(intensity, results.length)
			// console.log(colour)
			cell.style.backgroundColor = `\\rgb(${intensity < 0? colour : 0},${intensity > 0? colour : 0},0)`// intensity > 0? "red" : intensity === 0? "gray" : "green"
		}
	}, "calendar=" + calendar + "&datetime=" + cell.id)
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

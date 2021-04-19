
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
				let cell = row.insertCell()
				cell.onclick = (ev => {
					let td = ev.target
					switch (td.className) {
						case "":
							td.className = "freetime"
							break
						case "freetime":
							td.className = "busy"
							break
						case "busy":
							td.className = ""
							break
						default:
							console.error("tblTimeTable cell has invalid class")
					}
				})
			}
		}
	}
	table.appendChild(tbody)
}

document.addEventListener('DOMContentLoaded', () => {
	generateTimeTable()
})


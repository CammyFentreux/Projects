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
				// let result = makeDataQuery(increment, day, user)
				// if ()

				let cell = row.insertCell()
				cell.onclick = (ev => toggleTblCellClass(ev.target))
			}
		}
	}

	table.appendChild(tbody)
}

// function makeDataQuery(datetime, calendar, user) {}

function toggleTblCellClass(cell) {
	switch (cell.className) {
		case "":
			cell.className = "freetime"
			break
		case "freetime":
			cell.className = "busy"
			break
		case "busy":
			cell.className = ""
			break
		default:
			console.error("tblTimeTable cell has invalid class")
	}
}

document.addEventListener('DOMContentLoaded', () => {
	generateTimeTable()
})

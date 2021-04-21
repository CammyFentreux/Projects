window.addEventListener('load', function() {
    document.getElementById('homeBtn').addEventListener('click', function() {
        window.location.href = "./"
    })
})

/**
 * Generates a timetable of variable time frame
 * <p>
 * The table is created in a `<table>` with an id of 'tblTimetable'
 * @see generateTimeTableHead
 * @see generateTimeTableBody
 */
function generateTimeTable() {
    const table = document.getElementById("tblTimetable"),
          days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          timeRange = [9, 10, 11, 12, 1, 2, 3, 4, 5]
    generateTimeTableHead(table, days)
    generateTimeTableBody(table, days, timeRange)
}

/**
 * Generates the header of a timetable
 *
 * @param {HTMLTableElement} table  The `<table>` element to be built upon
 * @param {string[]}         days   An array of strings representing each column header. The first element should be appropriate for an filler column, allowing the left-most column row headers in the body
 * @see generateTimeTable
 */
function generateTimeTableHead(table, days) {
    let thead = table.createTHead(),
        row = thead.insertRow()

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
                queryAvailability(cell)
            }
        }
    }
    table.appendChild(tbody)
}


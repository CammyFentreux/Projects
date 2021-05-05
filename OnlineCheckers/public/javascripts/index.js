const LENGTH = 8

window.addEventListener('load', () => {
	const table = document.getElementById('board')
	createBoard(table)
})

function createBoard(table) {
	for (let i = 0; i < LENGTH; i++) {
		const row = document.createElement('tr')

		for (let j = 0; j < LENGTH; j++) {
			const cell = document.createElement('td')

			if ((i <= 2 || i >= LENGTH - 3) && (i % 2 !== j % 2) ) {
				const div = document.createElement('div')
				div.classList.add("piece")
				if (i <= 2) {
					div.classList.add("p1")
				} else {
					div.classList.add("p2")
				}
				cell.appendChild(div)
			}

			row.appendChild(cell)
		}
	table.appendChild(row)
	}
}

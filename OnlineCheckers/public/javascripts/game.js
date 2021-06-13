const lobbyCode = getParameterByName('lobbyCode')
let board

function createBoard() {
	xhttpRequest('/requestBoard', (res) => {
		const pieces = JSON.parse(res.responseText)
		console.log(pieces)

		for (let i = 0; i < LENGTH; i++) {
			const row = document.createElement('tr')

			for (let j = 0; j < LENGTH; j++) {
				const cell = document.createElement('td')
				if (pieces[`${i},${j}`] !== undefined) {
					const div = document.createElement('div')
					div.classList.add(pieces[`${i},${j}`])
					cell.appendChild(div)
				}
				row.appendChild(cell)
			}
			board.appendChild(row)
		}
	}, `lobbyCode=${lobbyCode}`)
}

window.addEventListener('load', () => {
	createBoard()
	board = document.getElementById('board')
})

function getParameterByName(name, url = window.location.href) {
	name = name.replace(/[\[\]]/g, '\\$&')
	let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
			results = regex.exec(url)
	if (!results) return null
	if (!results[2]) return ''
	return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
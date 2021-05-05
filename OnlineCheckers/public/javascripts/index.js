const LENGTH = 8
const roomCode = getParameterByName('roomCode')
let table

window.addEventListener('load', () => {
	table = document.getElementById('board')
	createBoard()
})

function createBoard() {
	for (let i = 0; i < LENGTH; i++) {
		const row = document.createElement('tr')

		for (let j = 0; j < LENGTH; j++) {
			const cell = document.createElement('td')

			if ((i <= 2 || i >= LENGTH - 3) && (i % 2 !== j % 2) ) {
				const div = document.createElement('div')
				div.classList.add("piece")
				div.addEventListener('click', () => {
					xhttpRequest('/requestMoves', displayMoves, `x=${i}&y=${j}&roomCode=${roomCode}`, div)
				})

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

function displayMoves(xhttp, piece) {
	console.log(xhttp.responseText)
}

function xhttpRequest(url, cFunction, sendStr, cFunctionParams) {
	let xhttp
	xhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP")
	xhttp.onreadystatechange = function() {
		if (this.readyState === 4 && this.status === 200) {
			if (typeof cFunctionParams == 'undefined') {
				cFunction(this)
			} else {
				cFunction(this, cFunctionParams)
			}
		}
	}
	xhttp.open("POST", url, true)
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
	xhttp.send(sendStr)
}

function getParameterByName(name, url = window.location.href) {
	name = name.replace(/[\[\]]/g, '\\$&')
	let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
			results = regex.exec(url)
	if (!results) return null
	if (!results[2]) return ''
	return decodeURIComponent(results[2].replace(/\+/g, ' '))
}


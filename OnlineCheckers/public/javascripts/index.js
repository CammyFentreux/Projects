

function createLobby() {
	xhttpRequest('/createLobby', (res) => {
		document.location.href=`./game?lobbyCode=${res.responseText}`
	}, `length=${LENGTH}`)
}




const LENGTH = 8

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
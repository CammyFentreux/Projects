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

/**
 * Toggles a dark theme
 */
function toggleDarkMode() {
    let body = document.getElementsByTagName("body")[0]

    if (body.classList.contains('dark')) {
        this.innerText = "Dark Mode"
        body.classList.remove('dark')
    } else {
        this.innerText = "Light Mode"
        body.classList.add('dark')
    }
}

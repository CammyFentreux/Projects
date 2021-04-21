function acceptInvite(calendar) {
    xhttpRequest('/acceptInvite', function(xhttp) {
        window.location.reload()
    }, "calendar=" + calendar)
}

function declineInvite(calendar) {
    xhttpRequest('/declineInvite', function(xhttp) {
        window.location.reload()
    }, "calendar=" + calendar)
}

window.addEventListener('load', function() {
    var els = document.getElementsByClassName("acceptInvite")
    for (var el of els) {
        el.addEventListener('click', function() {
            acceptInvite(el.dataset.calendar)
        })
    }

    var els = document.getElementsByClassName("declineInvite")
    for (var el of els) {
        el.addEventListener('click', function() {
            declineInvite(el.dataset.calendar)
        })
    }
});

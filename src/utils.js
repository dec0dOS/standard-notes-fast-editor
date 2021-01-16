/**
 * This file handles part of the editor's utils
 */
function getPlatform() {
    var userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.indexOf(" electron/") > -1) {
        return "Desktop";
    } else if (
        (/(Version\/\d+.*\/\d+.0.0.0 Mobile|; ?wv|(iPhone|iPad|Macintosh).*AppleWebKit(?!.*Safari))/i.test(navigator.userAgent))
    ) {
        if ((navigator.userAgent.indexOf("iP") > -1) || (navigator.userAgent.indexOf("Macintosh") > -1)) {
            return "iOS";
        } else
            return "Android";
    } else {
        return "Browser";
    }
}
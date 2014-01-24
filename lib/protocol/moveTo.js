module.exports = function moveTo (element, xoffset, yoffset, callback) {

    var data = {};

    if (typeof element === "string") {
        data.element = element;
    } else if (typeof element === "function") {
        callback = element;
    }

    if (typeof xoffset === "number") {
        data.xoffset = xoffset;
    } else if (typeof xoffset === "function") {
        callback = xoffset;
    }

    if (typeof yoffset === "number") {
        data.yoffset = yoffset;
    } else if (typeof yoffset === "function") {
        callback = yoffset;
    }

    this.requestHandler.create(
        "/session/:sessionId/moveto",
        data,
        callback
    );

};
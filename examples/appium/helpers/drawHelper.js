var h = 200;
var k = 450;
var r = 100;

/**
 * simple helper function to draw a circle
 * @param  {Number} h    horizontal center of the circle
 * @param  {Number} k    vertical center of the circle
 * @return {Actions[]}   list of actions for touchAction command
 */
module.exports.circleAction = function (h, k) {
    var theta = 0;
    var r = 100;
    var prev = { action: 'press', x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) };
    var actions = [];

    actions.push(prev);
    for (theta; theta < 2*Math.PI; theta+=2*Math.PI/36) {
        var next = { x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) };
        actions.push({ action: 'moveTo', x: next.x - prev.x, y: next.y - prev.y });
        prev = next;
    }

    actions.push('release');
    return actions;
}

/**
 * helper function to draw an arc
 * @param  {Numver} start start point
 * @param  {Number} end   end point
 * @return {Actions[]}    list of action for touchAction command
 */
module.exports.arcAction = function(start, end) {
    var theta = start;
    var prev = { action: 'press', x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) };
    var actions = [];
    actions.push(prev);

    for (; theta < end; theta += 2 * Math.PI / 100) {
        var next = { x: h + r * Math.cos(theta), y: k + r * Math.sin(theta) };
        actions.push({ action: 'moveTo', x: next.x - prev.x, y: next.y - prev.y });
        prev = next;
    }

    actions.push('release');
    return actions;
}

/**
 * helper function to draw an curved arc
 * @param  {Numver} start start point
 * @param  {Number} end   end point
 * @return {Actions[]}    list of action for touchAction command
 */
module.exports.innerArcAction = function(start, end) {
    var theta = start;
    var step = 4 * Math.PI / 100;

    var prev = { action: 'press', x: h - r * Math.cos(theta), y: k + r * Math.sin(theta) };
    var actions = [];
    actions.push(prev);

    for (; theta < end; theta += step) {
        var rad = 7.5991 * Math.pow(theta - start - Math.PI, 2) + 25;
        var next = { x: h - rad * Math.cos(theta), y: k + rad * Math.sin(theta) };
        actions.push({ action: 'moveTo', x: next.x - prev.x, y: next.y - prev.y });
        prev = next;
    }

    actions.push('release');
    return actions;
}

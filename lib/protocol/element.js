module.exports = function element (value, callback) {

    var using,
        requestOptions = {
        path:"/session/:sessionId/element",
        method:"POST"
    };

    // check value type
    if(value.indexOf('#') === 0 && value.search(/(\s|>|\.|[|])/) === -1) {
        using = 'id';
        value = value.slice(1);
    } else if(value.indexOf('//') === 0) {
        using = 'xpath';
    } else if(value.indexOf('=') === 0) {
        using = 'link text';
        value = value.slice(1);
    } else if(value.indexOf('*=') === 0) {
        using = 'partial link text';
        value = value.slice(2);
    } else if(value.search(/<[a-zA-Z-]+( \/)*>/g) >= 0) {
        using = 'tag name';
        value = value.replace(/<|>|\/|\s/g,'');
    } else if(value.search(/\[name=("|')([a-zA-z0-9-_]+)("|')\]/) >= 0) {
        using = 'name';
        value = value.match(/\[name=("|')([a-zA-z0-9-_]+)("|')\]/)[2];
    } else {
        using = 'css selector';
    }

    this.requestHandler.create(requestOptions,{'using':using, 'value':value},callback);

};
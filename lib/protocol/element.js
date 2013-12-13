module.exports = function element (value, callback) {

    var using,
        requestOptions = {
        path:"/session/:sessionId/element",
        method:"POST"
    };

    // check value type
    if(value.indexOf('.') === 0 || (value.indexOf('#') === 0 && value.indexOf(' ') > 0)) {
        using = 'css value';
    } else if(value.indexOf('#') === 0 && value.match(/(\s|>|\.|[|])/).length === 0) {
        using = 'id';
        value = value.slice(0,1);
    } else if(value.indexOf('//') === 0) {
        using = 'xpath';
    } else if(value.indexOf('=') === 0) {
        using = 'link text';
        value = value.slice(0,1);
    } else if(value.indexOf('*=') === 0) {
        using = 'partial link text';
        value = value.slice(0,2);
    } else if(value.match(/<[a-zA-Z-]+( \/)*>/g).length) {
        using = 'tag name';
        value = value.replace(/<|>|\/|\s/g,'');
    } else if(value.match(/\[name=("|')([a-zA-z0-9-_]+)("|')\]/).length > 0) {
        using = 'name';
        value = value.match(/\[name=("|')([a-zA-z0-9-_]+)("|')\]/)[2];
    } else {
        this.log.error('Please provide any of the following using strings as the first parameter: class name, css selector, id, name, link text, partial link text, tag name or xpath');
        process.exit(1);
    }

    this.requestHandler.create(requestOptions,{"using":using, "value":value},callback);

};
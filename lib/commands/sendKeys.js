exports.command = function(cssSelector, keys, callback)
{
    var self = this;
    self.element("css selector", cssSelector,
        function(result)
        {
            if (result.status == 0)
            {
                self.elementIdKeys(
                    result.value.ELEMENT,
                    keys,
                    function(result)
                    {
                        if (typeof callback === "function")
                        {
                            callback();
                        }
                    }
                );
            }
            else
            {
                if (typeof callback === "function")
                {
                    callback(result);
                }
            }
        }
    );

};


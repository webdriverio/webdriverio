find build/template/components -name '*.js' -exec sed -i '' \
    -e "s|from 'lit'|from 'https://esm.sh/lit@3.1.0'|g" \
    -e "s|from 'lit/decorators.js'|from 'https://esm.sh/lit@3.1.0/decorators.js'|g" \
    {} +

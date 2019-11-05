const fs = require('fs');
const path = require('path');

const makeArgsPath = function () {
    return path.join(process.cwd(), `data/args-${process.env.NODE_ENV}.json`);
};

const argsPath = makeArgsPath();
if (!fs.existsSync(argsPath)) {
    console.log(`ignored args file: '${argsPath}' because it is not found.`);
    return;
}
    
let data_args = require(argsPath);
for (let k in data_args) {
    exports[k] = data_args[k];
}

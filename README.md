Overview
========

A module that is meant to be integrated into node stratum pool, that will enable block diagnostics for pool operators and coin developers. Specifically it has been implemented to easily plug into nomp.

NOMP Integration
================

1. Add the package to the `package.json` dependencies:
```JSON
"dependencies": {
    ...
    "nodestratumpool_block_diagnostics": "git+https://github.com/hashtobewild/nodestratumpool_block_diagnostics.git",
    ...
}
```

2. Add a field to the s-nomp main `config.json` file, to control global activation:
```JSON
{
    ...
    "blockDiagnostics": false,
    ...
}
```

3. Add configuration options to the individual coin configuration files you wish to enable diagnostics for:
```JSON
{
    ...
    "blockDiagnostics": {
        "enabled": false,
            "modules": {
                "getBlockTemplateResult": {
                "enabled": false
            },
            "submitBlockSent": {
                "enabled": false
            },
            "submitBlockResult": {
                "enabled": false
            }
        },
        "log": false,
        "logPath": ""
    }
    ...
}
```

Node Stratum Pool Integration
=============================

1. Require the module in `lib/pool.js` in the top of the file:
```JavaScript
var requiredBlockDiagnostics = require('nodestratumpool_block_diagnostics');
```

2. Add an initialization function:
```JavaScript
function SetupBlockDiagnostics() {
    this.blockDiagnostics = new requiredBlockDiagnostics.BlockDiagnostics(options);
}
```

3. Call in the function you just created from `this.start = function(){...}`
```JavaScript
this.start = function () {
    SetupBlockDiagnostics();
    ...
};
```

4. Add the diagnostics calls as needed..

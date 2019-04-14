Overview
========

A module that is meant to be integrated into node stratum pool, that will enable block diagnostics for pool operators and coin developers. Specifically it has been implemented to easily plug into nomp. 

If you find it interesting, or useful, please star the repo and click on watch for updates ;)


NOMP(s-nomp) Integration
========================

1. Add configuration options to the pool configuration files you wish to enable diagnostics for:
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

1. Add the package to the `package.json` dependencies:
```JSON
"dependencies": {
    ...
    "nodestratumpool_block_diagnostics": "git+https://github.com/hashtobewild/nodestratumpool_block_diagnostics.git",
    ...
}
```

2. Require the module in `lib/pool.js` in the top of the file:
```JavaScript
var requiredBlockDiagnostics = require('nodestratumpool_block_diagnostics');
```

3. Add an initialization function:
```JavaScript
function SetupBlockDiagnostics() {
    this.blockDiagnostics = new requiredBlockDiagnostics.BlockDiagnostics(options);
}
```

4. Call in the function you just created from `this.start = function(){...}`
```JavaScript
this.start = function () {
    SetupBlockDiagnostics();
    ...
};
```

5. Add the diagnostics calls as needed...

Sample Integration
==================
I've included a complete sample integration in `BlockDiagnostics` branches of the following GitHub repos:

* [s-nomp](https://github.com/hashtobewild/s-nomp)
* [node-stratum-pool](https://github.com/hashtobewild/node-stratum-pool)

For easy reference, I have also included sample configuration files in the [samples](./samples) directory.
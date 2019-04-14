// Copyright (c) 2018-2019 The Genesis Network Developers and Louwtjie (Loki) Taljaard a.k.a HashToBeWild
// Distributed under the MIT/X11 software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

"use strict";
const fs = require("fs");

// -------------------------- Description ----------------------------------------------------
// This module enables running diagnostics on block data.
// To avoid heavy disk io, disk logging is only done when the block height changes, so it keeps 
// a local cache of data before dumping it to disk.
// When adding to this module, please favour clarity over brevity

// -------------------------- Internals ------------------------------------------------------
var globalOptions;
var coinOptions;
var options;
var blockDiagnosticItems;
var lastBlockWritten;

// -------------------------- Constructor ----------------------------------------------------
// The parameter is the pool options object
function BlockDiagnostics(inOptions) {
  // System wide options 
  globalOptions = inOptions;
  // Coin options
  coinOptions = globalOptions.coin
  ? globalOptions.coin
  : { };
  // Local options
  options = coinOptions.blockDiagnostics
    ? coinOptions.blockDiagnostics
    : { enabled: false };
  // Cache of diagnostics
  blockDiagnosticItems = {};
  // Last item dumped to disk
  lastBlockWritten = 0;
  init();
}

// -------------------------- Init -----------------------------------------------------------
var init = function() {
  // Stuff to run when starting...
  // First check base state
  if (!canRunCoin() || !canLog())
  {
    return;
  }

  // Check that the log path exists
  ensurePathExists(options.logPath + "/" + coinOptions.name, 484, function(err){
    // we may want to do something interesting here later...
  });
};

// -------------------------- Managers -------------------------------------------------------
// Done this way, so you can set up "groups of tests" for each diagnostic
var runSampleDiagnostics = function(stateObject) {
  return new Promise(function(resolve, reject) {
    // Add the result of each test to the list of results
    // If you want to be able to use the results gathered so far pass the whole stateObject...
    // Sample:
    stateObject.results.push(sampleTest(stateObject));
    // Otherwise, only pass the actual source object being checked
    // Sample:
    stateObject.results.push(sampleTest(stateObject.source));
    // Return the state object for further processing
    resolve(stateObject);
  });
};

var runGetBlockTemplateDiagnostics = function(stateObject) {
  return new Promise(function(resolve, reject) {
    // Return the state object for further processing
    resolve(stateObject);
  });
};

var runSubmitBlockDiagnostics = function(stateObject) {
  return new Promise(function(resolve, reject) {
    // Return the state object for further processing
    resolve(stateObject);
  });
};

var runSubmitBlockResultDiagnostics = function(stateObject) {
  return new Promise(function(resolve, reject) {
    // Return the state object for further processing
    resolve(stateObject);
  });
};

// -------------------------- Helpers --------------------------------------------------------
// from: https://stackoverflow.com/a/21196961
function ensurePathExists(path, mask, cb) {
  if (typeof mask == 'function') { // allow the `mask` parameter to be optional
      cb = mask;
      mask = 484;
  }
  fs.mkdir(path, mask, function(err) {
      if (err) {
          if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
          else cb(err); // something else went wrong
      } else cb(null); // successfully created folder
  });
}

// Get a specific diagnostic module's config
var getModuleConfig = function(moduleName){
  if (options && options.modules && options.modules[moduleName]){
    return options.modules[moduleName];
  }
  else
  {
    return {};
  }
};

// Globally enabled?
var canRunGlobal = function() {
  if (globalOptions && globalOptions.blockDiagnostics){
    return true;
  }
  return false;
};

// Enabled for this coin?
var canRunCoin = function() {
  if (canRunGlobal()){
    if (coinOptions && coinOptions.blockDiagnostics && coinOptions.blockDiagnostics.enabled){
      return true;
    }
  }
  return false;
};

// Specific module enabled?
var canRunModule = function(moduleName) {
  if (canRunCoin()){
    if (options && options.modules && options.modules[moduleName] && options.modules[moduleName].enabled){
      return true;
    }
  }
  return false;
};

// Are we able to log?
var canLog = function() {
  if (canRunCoin()){
    if (options && options.log && options.logPath && options.logPath != ""){
      return true;
    }
  }
  return false;
};

// Where to store the diagnostic logs
var getBlockFilePath = function(dumpBlockHeight) {
  var basePath = options.logPath + "/" + coinOptions.name;
  var filePath = dumpBlockHeight + ".json";
  return basePath + "/" + filePath;
};

// Cache the diagnostic logs
var logObject = function(loggedObject) {
  return new Promise(function(resolve, reject) {
    // Ensure that everything is in place... or create stubs
    if (!blockDiagnosticItems[loggedObject.height]){
      blockDiagnosticItems[loggedObject.height] = buildBaseFileObject(loggedObject.height);
    }
    if (!blockDiagnosticItems[loggedObject.height].diagnostics[loggedObject.name]){
      blockDiagnosticItems[loggedObject.height].diagnostics[loggedObject.name] = [];
    }
    // Make sure this block has not been finalized
    if (blockDiagnosticItems[loggedObject.height].timeend && blockDiagnosticItems[loggedObject.height].timeend == -1){
      // We're done with this block...
    }
    else{
      // Add the item to the current block diagnostic data
      blockDiagnosticItems[loggedObject.height].diagnostics[loggedObject.name].push(loggedObject);
      // See if we need to dump the previous block
      var dumpBlockHeight = loggedObject.height - 1;
      if (blockDiagnosticItems[dumpBlockHeight]){
        return writeBlockDiagnostics(dumpBlockHeight, loggedObject);
      }
      else
      {
        resolve(loggedObject);
      }
    }
  });
};

// Manage writing the block diagnostic data to disk
// Remeber this only happens when a new block is seen!
// this accepts a diagnostic object as a parameter, so it can pass that value through
var writeBlockDiagnostics = function(dumpBlockHeight, loggedObject) {
  return new Promise(function(resolve, reject) {
    // Pre-Flight check(s)
    if(!blockDiagnosticItems[dumpBlockHeight] || blockDiagnosticItems[dumpBlockHeight] != -1)
    {
      resolve(loggedObject);
    }
    else
    {
      // finalize the cached data
      finalizeCacheItem(dumpBlockHeight);
      var logFileData = blockDiagnosticItems[dumpBlockHeight];
      var logFilePath = getBlockFilePath(dumpBlockHeight);
      return writeDiagnosticsFile(logFilePath, logFileData);
    }
  });
};

// The actual process of writing the file to disk. 
var writeDiagnosticsFile = function(logFilePath, loggedObject) {
  return new Promise(function(resolve, reject) {
    // One file per block
    fs.writeFile(logFilePath, logFileData, function(err) {
      if(err) {
        reject(buildBaseError("Unable to write the file"));
      }
      else
      {
        cleanCache(dumpBlockHeight)
        resolve(loggedObject);
      }
    }); 
  });
};

// Make sure we don't get more data for this block
var finalizeCacheItem = function(dumpBlockHeight){
  var finaliseTime = new Date().getTime();
  blockDiagnosticItems[dumpBlockHeight].timeend = finaliseTime;
};

// Make sure we do not turn into a memory hog...
var cleanCache = function(dumpedLoggedObject){
  var finaliseTime = dumpedLoggedObject.timeend;
  // Squash the cached item and prevent new items from being added for this block
  blockDiagnosticItems[dumpBlockHeight].timeend = {"timeend": finaliseTime};
  // check for squashed items, older than 5 blocks ago and remove them, 
  // this should be enough time safely (-ish) assume that something wont try to send us more data 
  if (blockDiagnosticItems[dumpBlockHeight - 5]){
    delete blockDiagnosticItems[dumpBlockHeight - 5];
  }
};

// -------------------------- Data Models ----------------------------------------------------
// A standardised error
var buildBaseError = function(message) {
  return {
    // The time at which error was created
    "timestamp": new Date().getTime(),
    // The error message
    "error": message,
    // Any data that is significant to this error
    "metadata": {}
  };
};


// The layout of the block file
var buildBaseFileObject = function(blockHeight) {
  return {
    // Block height
    "height": blockHeight,
    // The time at which the block diagnostic data was created
    "timestart": new Date().getTime(),
    // The time at which block diagnostic data was finalized 
    "timeend": -1,
    // The diagnostic entries
    "diagnostics": {},
    // Any data that is significant to this file (notes etc. in future?)
    "metadata": {}
  };
};

// A description of the diagnostic process(es) run
var buildBaseDiagnosticObject = function(moduleName, blockHeight, inputObject) {
  return {
    // the block height for this run
    "height": blockHeight ? blockHeight : -1,
    // Which diagnostic is this?
    "name": moduleName ? moduleName : "unknown",
    // The module configuration used
    "config": getModuleConfig(moduleName),
    // The time at which the test started
    "timestart": new Date().getTime(),
    // The time at which the test was completed
    "timeend": new Date().getTime(),
    // The source object, that the test was run against
    "source": inputObject,
    // The result objects of all the tests that were run
    "results": []
  };
};

// Individual results
var buildBaseResultObject = function(testName) {
  return {
    // What is the test called?
    "name": testName ? testName : "unknown",
    // The time at which the step started
    "timestart": new Date().getTime(),
    // The time at which the step was completed
    "timeend": -1,
    // Was the test a success?
    "success": false,
    // Any data that is significant to the result of the test
    "metadata": {}
  };
};

// -------------------------- Diagnostic Functions -------------------------------------------
// Please try to ensure that each diagnostic only checks one thing. if you want to check more, 
// create more test functions, so that the the file does not get bloated with duplicate code
var sampleDiagnostic = function(inputObject) {
  // All of the tests should return a test result object, as defined in buildBaseResultObject
  // Build the result object and give it a name
  var result = buildBaseResultObject("sampletest");

  // Do some suff... and set the test result
  // The tests should result in a boolean value returned in the success field
  if (inputObject) {
    result.success = true;
  } else {
    result.success = false;
  }

  // If the test returns metadata, attach the data to the object in the metadata field
  result.metadata["somethingimportant"] = "Because I said so";

  // For rudimentary benchmarking, you can set the time at which the step completed
  result.timeend = new Date().getTime();

  // return the result object
  return result;
};

// -------------------------- Exported Functions ---------------------------------------------
// Naming convention:
// [Function] [Data Description] [Sent/Result]
// [Function] will currently only ever be "Diagnose", but this may be extended
// [Data Description] should refer to the daemon call used, for the sake of clarity
// [Sent/Result] refers to whether we are processing what we [Sent] to the daemon, or what the [Result] was that we got back from the daemon
// Example 1: DiagnoseGetBlockTemplateResult
// Uses the [Diagnose] function(s) on the [GetBlockTemplate] data returned from the daemon [Result] 
// Example 2: DiagnoseSubmitBlockSent
// Uses the [Diagnose] functions(s) on the [SubmitBlock] data [Sent] to the daemon

BlockDiagnostics.prototype.DiagnoseGetBlockTemplateResult = function(
  // The result of the getblocktemplate call
  inputData
) {
  return new Promise(function(resolve, reject) {
    var diagnosticName = "getBlockTemplateResult";
    if (!canRunModule(diagnosticName)) {
      // If we are not allowed to run, give back what we got...
      resolve(inputData);
    } else {
      var stateObject = buildBaseDiagnosticObject(diagnosticName, inputdata.height, inputData);
      runGetBlockTemplateDiagnostics(stateObject)
        .then(logObject)
        .then(function(result) {
          resolve(result);
        })
        .catch(function(rejection) {
          reject(rejection);
        });
    }
  });
};

BlockDiagnostics.prototype.DiagnoseSubmitBlockSent = function(
  // The submitblock data
  inputData
) {
  return new Promise(function(resolve, reject) {
    var diagnosticName = "submitBlockSent";
    if (!canRunModule(diagnosticName)) {
      // If we are not allowed to run, give back what we got...
      resolve(inputData);
    } else {
      var stateObject = buildBaseDiagnosticObject(diagnosticName, inputdata.height, inputData);
      runSubmitBlockDiagnostics(stateObject)
        .then(logObject)
        .then(function(result) {
          resolve(result);
        })
        .catch(function(rejection) {
          reject(rejection);
        });
    }
  });
};

BlockDiagnostics.prototype.DiagnoseSubmitBlockResult = function(
  // The submitblock result data
  inputData
) {
  return new Promise(function(resolve, reject) {
    var diagnosticName = "submitBlockResult";
    if (!canRunModule(diagnosticName)) {
      // If we are not allowed to run, give back what we got...
      resolve(inputData);
    } else {
      var stateObject = buildBaseDiagnosticObject(diagnosticName, inputdata.height, inputData);
      runSubmitBlockResultDiagnostics(stateObject)
        .then(logObject)
        .then(function(result) {
          resolve(result);
        })
        .catch(function(rejection) {
          reject(rejection);
        });
    }
  });
};

// -------------------------- Exports --------------------------------------------------------
exports.BlockDiagnostics = BlockDiagnostics;

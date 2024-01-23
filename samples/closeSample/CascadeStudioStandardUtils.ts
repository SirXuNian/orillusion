// Miscellaneous Helper Functions used in the Standard Library
import { oc } from "@orillusion/opencascade";


// Caching functions to speed up evaluation of slow redundant operations


class _CascadeStudioStandardUtils {
  public argCache: any = {};
  public usedHashes: any = {};
  public opNumber = 0;
  public currentOp = '';
  public currentLineNumber: any;
  /** Hashes input arguments and checks the cache for that hash.  
  * It returns a copy of the cached object if it exists, but will 
  * call the `cacheMiss()` callback otherwise. The result will be 
  * added to the cache if `GUIState["Cache?"]` is true. */
  public CacheOp(command, args, cacheMiss) {
    //toReturn = cacheMiss();
    this.currentOp = command;
    this.currentLineNumber = CascadeStudioStandardUtils.getCallingLocation()[0];
    // postMessage({ "type": "Progress", "payload": { "opNumber": this.opNumber++, "opType": command } }); // Poor Man's Progress Indicator
    let toReturn: any = null;
    let curHash = CascadeStudioStandardUtils.ComputeHash(command, args); this.usedHashes[curHash] = curHash;
    let check = CascadeStudioStandardUtils.CheckCache(curHash);
    if (check) {
      //console.log("HIT    "+ ComputeHash(args) +  ", " +ComputeHash(args, true));
      toReturn = new oc.TopoDS_Shape(check);
      toReturn['hash'] = check.hash;
    } else {
      //console.log("MISSED " + ComputeHash(args) + ", " + ComputeHash(args, true));
      toReturn = cacheMiss();
      toReturn['hash'] = curHash;
      CascadeStudioStandardUtils.AddToCache(curHash, toReturn);
    }
    // postMessage({ "type": "Progress", "payload": { "opNumber": this.opNumber, "opType": null } }); // Poor Man's Progress Indicator
    return toReturn;
  }
  /** Returns the cached object if it exists, or null otherwise. */
  public CheckCache(hash) { return this.argCache[hash] || null; }
  /** Adds this `shape` to the cache, indexable by `hash`. */
  public AddToCache(hash, shape) {
    let cacheShape: any = new oc.TopoDS_Shape(shape);
    cacheShape.hash = hash; // This is the cached version of the object
    this.argCache[hash] = cacheShape;
    return hash;
  }

  /** This function computes a 32-bit integer hash given a set of `arguments`.  
   * If `raw` is true, the raw set of sanitized arguments will be returned instead. */
  public ComputeHash(command, args, raw?) {
    let argsString = JSON.stringify(args);
    argsString = argsString.replace(/(\"ptr\"\:(-?[0-9]*?)\,)/g, '');
    argsString = argsString.replace(/(\"ptr\"\:(-?[0-9]*))/g, '');
    if (argsString.includes("ptr")) { console.error("YOU DONE MESSED UP YOUR REGEX."); }
    let hashString = command + argsString;// + GUIState["MeshRes"];
    if (raw) { return hashString; }
    return CascadeStudioStandardUtils.stringToHash(hashString);
  }

  // Random Javascript Utilities

  /** This function recursively traverses x and calls `callback()` on each subelement. */
  public recursiveTraverse(x, callback) {
    if (Object.prototype.toString.call(x) === '[object Array]') {
      x.forEach(function (x1) {
        CascadeStudioStandardUtils.recursiveTraverse(x1, callback)
      });
    } else if ((typeof x === 'object') && (x !== null)) {
      if (x.HashCode) {
        callback(x);
      } else {
        for (let key in x) {
          if (x.hasOwnProperty(key)) {
            CascadeStudioStandardUtils.recursiveTraverse(x[key], callback)
          }
        }
      }
    } else {
      callback(x);
    }
  }

  /** This function returns a version of the `inputArray` without the `objectToRemove`. */
  public Remove(inputArray, objectToRemove) {
    return inputArray.filter((el) => {
      return el.hash !== objectToRemove.hash ||
        el.ptr !== objectToRemove.ptr;
    });
  }

  /** This function returns true if item is indexable like an array. */
  public isArrayLike(item) {
    return (
      Array.isArray(item) ||
      (!!item &&
        typeof item === "object" &&
        item.hasOwnProperty("length") &&
        typeof item.length === "number" &&
        item.length > 0 &&
        (item.length - 1) in item
      )
    );
  }

  /**  Mega Brittle Line Number Finding algorithm for Handle Backpropagation; only works in Chrome and FF.
   * Eventually this should be replaced with Microsoft's Typescript interpreter, but that's a big dependency...*/
  public getCallingLocation() {
    let errorStack: any = (new Error).stack;
    //console.log(errorStack);
    //console.log(navigator.userAgent);
    let lineAndColumn = ["0", "0"];

    let matchingString = ", <anonymous>:";
    if (navigator.userAgent.includes("Chrom")) {
      matchingString = ", <anonymous>:";
    } else if (navigator.userAgent.includes("Moz")) {
      matchingString = "eval:";
    } else {
      lineAndColumn[0] = "-1";
      lineAndColumn[1] = "-1";
      return lineAndColumn;
    }

    errorStack.split("\n").forEach((line) => {
      if (line.includes(matchingString)) {
        lineAndColumn = line.split(matchingString)[1].split(':');
      }
    });

    return [parseFloat(lineAndColumn[0]), parseFloat(lineAndColumn[1])];
  }

  /** This function converts either single dimensional 
   * array or a gp_Pnt to a gp_Pnt.  Does not accept 
   * `TopoDS_Vertex`'s yet! */
  public convertToPnt(pnt) {
    let point = pnt; // Accept raw gp_Points if we got 'em
    if (point.length) {
      point = new oc.gp_Pnt(point[0], point[1], (point[2]) ? point[2] : 0);
    }
    return point;
  }

  /** This function converts a string to a 32bit integer. */
  public stringToHash(string) {
    let hash = 0;
    if (string.length == 0) return hash;
    for (let i = 0; i < string.length; i++) {
      let char = string.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  public CantorPairing(x, y) {
    return ((x + y) * (x + y + 1)) / 2 + y;
  }
}

export let CascadeStudioStandardUtils = new _CascadeStudioStandardUtils();
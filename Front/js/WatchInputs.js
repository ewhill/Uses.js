var UsesJS = {
  /*
  * events (array):
  * - This array will hold our events as they take place and be sent to the
  * - server via the 'report' function (just below).
  */
  events: [],
  
  /*
  * options (object):
  * - This object holds the options for the Uses.js library. These options can
  * - be overridden via the init (see below) function.
  */
  options: {
    serverURL:  "http://127.0.0.1:58888",
    
    /*
    * uniqueId (string):
    * - This is the unique id that will identify your session to the server.
    * - It can be generated and grabbed from the server or it can be entirely
    * - made up. It simply is a calling card, if you will.
    */
    uniqueId: "abcdefghijklmnopqrstuvwxyz0123456789",
    
    /*
    * EVENT_TYPES (array):
    * - This array holds all events which we wish to monitor via the 'monitor'
    * - function (below). Add any others you deem necessary (mousemove, etc.)
    */
    EVENT_TYPES: [
      "KEYDOWN",
      "KEYUP",
      "CLICK",
      "TAP"
    ],
    
    /*
    * reportDelay (integer):
    * - This integer variable is the interval in milliseconds that the 'report'
    * - function (just below) will be called, sending the 'events' data to the 
    * - server.
    */
    reportDelay: 30000,
    
    /*
    * report (function):
    * - Our main reporting function to send the event log to the server.
    */
    report: () => {
      /*
      * Send the POST request to the server with the 'events' data as a JSON 
      * string in the request body.
      * Note: we are not concerned with errors or warnings here; if the request
      * fails, we will simply try again next time.
      */
      if(UsesJS.events.length < 1) {
        if(typeof UsesJS.options.reportSuccess == "function") {
          UsesJS.options.reportSuccess(resp);
        }
        return;
      }
      
      var lastIndex = UsesJS.events.length;
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.addEventListener("load", function() {
        var resp = JSON.parse(this.responseText);
        if(resp.report && resp.report == "ok") {
          UsesJS.events = UsesJS.events.slice(lastIndex);
          if(typeof UsesJS.options.reportSuccess == "function") {
            UsesJS.options.reportSuccess(resp);
          }
        }
      });
      xmlhttp.open("POST", UsesJS.options.serverURL+"/report");
      xmlhttp.setRequestHeader("Content-Type", "application/json");
      xmlhttp.send(JSON.stringify({
        'id': UsesJS.options.uniqueId,
        'events': UsesJS.events
      }));
    },
    
    reportSuccess: () => {}
  },
  
  /*
  * --------------------------------------------------------------------------
  * The following two functions 'indexOf' and 'getCssPath' are adapted from 
  * this stackoverflow article: https://stackoverflow.com/questions/46812289/
  * how-to-build-a-css-selector-from-event-object-in-js
  * --------------------------------------------------------------------------
  */
  // Find the index of the given element in its parent
  indexOfElem: (e) => {
      var parent = e.parentNode;
      var child, index = 1; 
      for (child = parent.firstElementChild;
           child;
           child = child.nextElementSibling) {
          if (child === e) {
              return index;
          }
          ++index;
      }
      return -1;
  },
  
  getCssPath: (e) => {
    var element = e.target || e.srcElement;
    var selector = element.tagName + ":nth-child(" + 
      UsesJS.indexOfElem(element) + ")";
      
    while ((element = element.parentElement) !== null) {
        if (element.tagName === "BODY") {
          selector = "BODY > " + selector;
          break;
        }
        
        selector = element.tagName + ":nth-child(" + 
          UsesJS.indexOfElem(element) + ") > " + selector;
    }
    
    return selector;
  },
  /*
  * --------------------------------------------------------------------------
  * --------------------------------------------------------------------------
  */
  
  monitor: (e) => {
    //push to our event log array
    UsesJS.events.push({
      /*
      * Note: we don't need all the properties from the native event, 
      * - so most are omitted in favor of simplified data and network
      * - performance
      */
      
      // The window path (including hash) where the event takes place
      'path': window.location.toString(),
      
      // The type of event ('keyup', 'keydown', 'tap', 'click', etc.)
      'type': e.type,
      
      // The recorded delay between when page loaded and when event took 
      // place (in ms)
      'timestamp': parseInt(e.timeStamp),
      
      // The css path to the element which the event targeted
      'selector': UsesJS.getCssPath(e)
    });
    
    // Keyboard events get logged with extra properties...
    if(e.type.toLowerCase().indexOf("key") > -1) {
      // For all the extra properties, check to ensure that they exist
      // before adding them. This avoids uncaught exceptions and should
      // ensure cross-browser compatability (in theory) since some 
      // browsers differ on which properties the keyboard event has.
      UsesJS.events[UsesJS.events.length-1].which = e.which;
      UsesJS.events[UsesJS.events.length-1].key = e.key;
      UsesJS.events[UsesJS.events.length-1].keyCode = e.keyCode;
      UsesJS.events[UsesJS.events.length-1].ctrlKey = e.ctrlKey;
      UsesJS.events[UsesJS.events.length-1].altKey = e.altKey;
      UsesJS.events[UsesJS.events.length-1].shiftKey = e.shiftKey;
    }
  },
  
  init: (passedOptions) => {
    // If we are given 'passedOptions' to initialize from...
    if(passedOptions && typeof passedOptions == "object") {
      //merge the given options over our default options
      for(var o in passedOptions) {
        if(passedOptions.hasOwnProperty(o)) {
          UsesJS.options[o] = passedOptions[o];
        }
      }
    }
    
    /*
    * Set up the reporting on a 'reportDelay' delay and interval and 
    * register the report function to be called before leaving the page.
    * This ensures that the analytics data will always make it to our
    * server, even if the user leaves the page before the interval fires.
    */
    UsesJS.reportInterval = setInterval(UsesJS.options.report, UsesJS.options.reportDelay);
    window.onbeforeunload = UsesJS.options.report;
    
    /*
    * Register our 'monitor' function to all the event types in "EVENT_TYPES",
    * such that the function is called when the event fires.
    */
    for(var i=0; i<UsesJS.options.EVENT_TYPES.length; i++) {
      document.addEventListener(UsesJS.options.EVENT_TYPES[i].toLowerCase(), UsesJS.monitor);
    }
  }
};
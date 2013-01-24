/*
 * Mobile Range Slider 
 * A Touch Slider for Webkit / Mobile Safari
 *
 * https://github.com/ubilabs/mobile-range-slider
 *
 * Full rewrite of https://github.com/alexgibson/WKSlider
 *
 * @author Ubilabs http://ubilabs.net, 2012
 * @license MIT License http://www.opensource.org/licenses/mit-license.php
 */

// function.bind() polyfill
// taken from: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError(
        "Function.prototype.bind - what is trying to be bound is not callable"
      );
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
      fToBind = this, 
      fNOP = function() { },
      fBound = function() {
        return fToBind.apply(
          this instanceof fNOP ? this : oThis || window,
          aArgs.concat( Array.prototype.slice.call(arguments) )
        );
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


(function(undefined) {
  
  // mapping of event handlers
  var events = {
    start: ['touchstart', 'mousedown'],
    move: ['touchmove', 'mousemove'],
    end: ['touchend', 'touchcancel', 'mouseup']
  };

  // constructor
  function MobileRangeSlider(element, options) {

    this.element = element;
    
    this.options = {};
    
    options = options || {};
    
    var property;
    
    for (property in this.defaultOptions){
      if (options[property] !== undefined){
        // set options passed to constructor
        this.options[property] = options[property];
      } else {
        // set default options
        this.options[property] = this.defaultOptions[property];
      }
    }
    // detect support for Webkit CSS 3d transforms
    this.supportsWebkit3dTransform = (
      'WebKitCSSMatrix' in window && 
      'm11' in new WebKitCSSMatrix()
    );
    
    // store references to DOM elements
    if (typeof element === 'string'){
      this.element = document.getElementById(element);
      this.element.className = this.element.className + ' mobile-range-slider';
    }
        
    this.knob = this.element.getElementsByClassName('knobMax')[0];
    this.knob0 = this.element.getElementsByClassName('knobMin')[0];
    this.track = this.element.getElementsByClassName('track')[0];
    this.sizeBar = this.element.getElementsByClassName('size')[0];
    
    // set context for event handlers
    this.start = this.start.bind(this);
    this.move = this.move.bind(this);
    this.end = this.end.bind(this);
    // set the inital value
    this.addEvents("start");
    this.widths = this.widthsCalc();

    this.setStartingValues();
    // update postion on page resize
    window.addEventListener("resize", this.update.bind(this));
    
  };

  // default options
  MobileRangeSlider.prototype.defaultOptions = {
    value: 0, // initial value
    valueMin: 0,
    valueMax: 100,
    min: 0, // minimum value
    max: 100, // maximum value,
    step: 1,
    arrValues: [],
    change: null, // change callback,
    formatter: null
  };

  MobileRangeSlider.prototype.widthsCalc = function() {
      return {
        knob: this.knob.offsetWidth,
        track : this.track.offsetWidth,
        range : this.options.max - this.options.min,
        bar : this.track.offsetWidth - this.knob.offsetWidth,
        positionStep : (this.track.offsetWidth - this.knob.offsetWidth) / (Math.round((this.options.max - this.options.min) / this.options.step))
      }
    };

  // add event handlers for a given name
  MobileRangeSlider.prototype.addEvents = function(name){
    var list = events[name], 
      handler = this[name],
      eventType;
    
    for (eventType in list){
      this.knob.addEventListener(list[eventType], handler, false);
      this.knob0.addEventListener(list[eventType], handler, false);
    }
  };
  
  // remove event handlers for a given name
  MobileRangeSlider.prototype.removeEvents = function(name){ 
    var list = events[name],
      handler = this[name],
      eventType;
      
    for (eventType in list){
      this.knob.removeEventListener(list[eventType], handler, false);
      this.knob0.removeEventListener(list[eventType], handler, false);
    }
  };
  
  // start to listen for move events
  MobileRangeSlider.prototype.start = function(event) {
    this.addEvents("move");
    this.addEvents("end");
    this.handle(event);
  };
  
  // handle move events
  MobileRangeSlider.prototype.move = function(event) {
    this.handle(event);
  }; 

  // stop listening for move events
  MobileRangeSlider.prototype.end = function() {
    this.removeEvents("move");
    this.removeEvents("end");
  };
  
  // update the knob position
  MobileRangeSlider.prototype.update = function() {
    this.widths = this.widthsCalc();
    this.setMinMaxValues(this.valueMin, this.valueMax);
  };
  
  MobileRangeSlider.prototype.setStartingValues = function() {
    this.valueMin = this.options.valueMin;
    this.valueMax = this.options.valueMax;
    var
      positionMin = Math.round((this.valueMin - this.options.min) * this.widths.bar / this.widths.range),
      positionMax = Math.round((this.valueMax - this.options.min) * this.widths.bar / this.widths.range);

    this.setKnobPosition(positionMin, this.knob0);
    this.draw (positionMax, this.knob);
  };
  MobileRangeSlider.prototype.setMinMaxValues = function (min, max) {
    //this.valueMin = min;
    this.setValue(min, this.knob0);
    this.setValue(max, this.knob);

    this.setKnobPosition(this.calcPosition(min), this.knob0);
    this.draw (this.calcPosition(max), this.knob);
  };

  // set the new value of the slider
  MobileRangeSlider.prototype.setValue = function(value, knob) {
    //position = Math.round(position / positionStep) * positionStep;
    //newValue = Math.round(position /positionStep) * this.options.step + this.options.min;
    newValue = Math.round(value / this.options.step) * this.options.step;
    (knob == this.knob) ? this.valueMax = newValue : this.valueMin = newValue;
  };

  // handle a mouse event
  MobileRangeSlider.prototype.handle = function(event){
    event.preventDefault();
    if (event.targetTouches){ event = event.targetTouches[0]; }
    var position = event.pageX,
      knob = event.target,
      element,
      value,
      positionStep = this.widths.bar / (Math.round(this.widths.range / this.options.step));

    for (element = knob; element; element = element.offsetParent){
      position -= element.offsetLeft;
    }

    // keep knob in the bounds
    position += this.widths.knob / 2;
    position = Math.min(position, this.widths.track);
    position = Math.max(position - this.widths.knob, 0);

    //Keep Knobs from hitting each other
    if (knob == this.knob) { //Max
      position = Math.max(position, this.findKnobPosition(this.knob0) + this.widths.knob);

    } else {
      position = Math.min(position, this.findKnobPosition(this.knob) - this.widths.knob);
    }

    position = Math.round(position / positionStep) * positionStep;
    value = this.options.min + Math.round(position * this.widths.range / this.widths.bar);
    //var percent = position / this.widths.track;
    //value = this.calcValue(percent);

    (knob == this.knob) ? this.valueMax = value : this.valueMin = value;
    this.draw(position, knob);
    //this.setValue(value, knob);
  };
  MobileRangeSlider.prototype.findKnobPosition = function(knob){
    var trn = knob.style.webkitTransform;
    var pos = trn.indexOf('px');
    return parseFloat(trn.substring(12,pos));
  };
  MobileRangeSlider.prototype.setKnobPosition = function(x, knob){
    // use Webkit CSS 3d transforms for hardware acceleration if available
    if (this.supportsWebkit3dTransform) {
      knob.style.webkitTransform = 'translate3d(' + x + 'px, 0, 0)';
    } else {
      knob.style.webkitTransform = 
      knob.style.MozTransform = 
      knob.style.msTransform = 
      knob.style.OTransform = 
      knob.style.transform = 'translateX(' + x + 'px)';
    }
  };
  MobileRangeSlider.prototype.resizeBar = function (x, knob) {
    var knobMinPos,
        knobMaxPos;
    if (knob == this.knob) {
      knobMinPos = this.findKnobPosition(this.knob0);
      knobMaxPos = x;
    } else {
      knobMinPos = x;
      knobMaxPos = this.findKnobPosition(this.knob);
    }
    var wouldWidth = knobMaxPos - knobMinPos;
    var roundWidth = this.widths.knob * 0.5;
    this.sizeBar.style.left = (knobMinPos + roundWidth*0.5) + 'px';
    this.sizeBar.style.width = ((wouldWidth+ (roundWidth<<1)) - roundWidth*0.5) + 'px';
  };
  MobileRangeSlider.prototype.draw = function(position, knob) {
    this.resizeBar(position, knob);
    this.setKnobPosition(position, knob);
    this.callback(this.valueMin, this.valueMax);
  };
  MobileRangeSlider.prototype.calcValue = function (percent) {
    var arr = this.options.arrValues.sort(function (a,b){
      return a-b;
    }), n = arr.length * percent;
    var m1 = arr[Math.floor(n)] * (1 - (n%1));
    var m2 = arr[Math.ceil(n)] * (n%1);
    return m1+m2;
  };
  MobileRangeSlider.prototype.calcPosition = function(value) {
    if (value === undefined) { value = this.options.min; }

    value = Math.min(value, this.options.max);
    value = Math.max(value, this.options.min);

    var
      position = Math.round((value - this.options.min) * this.widths.bar / this.widths.range),
      positionStep = this.widths.bar / (Math.round(this.widths.range / this.options.step));
    position = Math.round(position / positionStep) * positionStep;
    return position;
  };
  // call callback with new value
  MobileRangeSlider.prototype.callback = function(min, max) {
    this.element.getElementsByClassName('min')[0].innerHTML = this.options.formatter(min);
    this.element.getElementsByClassName('max')[0].innerHTML = this.options.formatter(max);
    if (this.options.change && typeof this.options.change == 'function'){
      this.options.change(min, max);
    }
  };

  //public function
  window.MobileRangeSlider = MobileRangeSlider;
})();
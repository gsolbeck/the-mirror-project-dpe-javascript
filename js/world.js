"use strict";

function World( options )  {
    // Set options to the options supplied
    // or an empty object if none are provided.
    options = options || {};

    // FPS calc.
    var self = this,
        lastLoop = new Date,
        thisLoop,
        count = 0,
        animContext;

    var active = false;

    // Options.
    this.g = options.g || 0.035;
    this.arcHeight = options.arcHeight || 200;
    this.arcVariant = options.arcVariant || 10;

    this.frameTime = 0;
    this.animList = [];

    this.wordClassIndex = 0;
    this.wordClasses = [];

    this.setWordClass = function(target){
        var wc = target.id;
        if(target.checked === false){
            this.wordClasses.splice(this.wordClasses.indexOf(wc), 1);
        } else {
            this.wordClasses.push(wc);
        }
    }

    this.nextClass = function() {

        // Resetting lines for next pass/class.
        var lines = document.querySelectorAll('.world .line');
        [].forEach.call(lines, function(line){
            line.classList.remove('was-target', 'is-swapping');
        });

        // Are there any more classes?
        if(this.wordClassIndex < this.wordClasses.length-1){
            this.wordClassIndex++;
            log('Next class: ', this.wordClasses[this.wordClassIndex]);
            this.dispatchEvent({
                type:'classchange',
                newClass: this.wordClasses[this.wordClassIndex]
            });
            this.next();
        } else {
            log('Fin');
            // No? Then we stop.
            active = false;
            this.dispatchEvent({type:'complete'});
        }
    };

    this.next = function(lastSource) {

        var tmpSource = this.sourcePoem,
            tmpTarget = this.targetPoem,
            wordClass = this.wordClasses[this.wordClassIndex],
            source, target, swap, lineIndex;

        // Swap source and target or set them in the first instance.
        this.sourcePoem = tmpTarget;
        this.targetPoem = tmpSource;

        // Get line index.
        lineIndex = parseInt(this.sourcePoem.dataset.lastIndex);

        // Get the next source that hasn't been swapped during this pass/class.
        source = this.sourcePoem.querySelector('.line:not(.is-swapping):nth-child(n+'+(lineIndex+1)+') span[data-tag="'+wordClass+'"]:not(.was-target)');
        if(!source){
            source = this.sourcePoem.querySelector('.line:not(.is-swapping):nth-child(n+1) span[data-tag="'+wordClass+'"]:not(.was-target)');
        }
        target = lastSource || this.targetPoem.querySelector('span[data-tag="'+wordClass+'"]');

        // Do we have a viable swap? (we need both source and target, fo' sho').
        if(!source || !target){
            // If we have no swap and have the previous source we fade that
            // back in and then start the process with a new class.
            if(lastSource){
                TweenLite.to(lastSource, 0.25, { opacity: 1, onComplete: this.nextClass, onCompleteScope: this });
            } else {
                // log('nextClass', source, target);
                // If there is no last source then we may have just
                // started a new class and immediately found no viable swaps.
                log('Nothing found for: ', wordClass);
                this.nextClass();
            }
            return;
        } else {
            // Set the source line index.
            var k = 1, e = source.parentNode;
            while (e = e.previousSibling) { ++k;}
            this.sourcePoem.dataset['lastIndex'] = k;
        }

        if (settings.fileExportEnabled) {
            target.classList.add('was-target');
            target.textContent = source.textContent;
            this.next(source);
        } else {
            // Instance of a line swap. Listening for completion.
            swap = new SwapLines(this, source, target);
            swap.addEventListener('complete', function(){
                // We recursively call next() here and pass the last source
                // incase we discover there is no viable swap and need to fade
                // the last source back in.
                self.next.call(self, source);
            });
        }

    };

    this.animate = function() {
        if (!active) {
            count = 0;
            return;
        }

        // FPS calc.
        var thisFrameTime = (thisLoop=new Date) - lastLoop;
        this.frameTime += (thisFrameTime - this.frameTime) / 25;
        lastLoop = thisLoop;
        count++;

        requestAnimationFrame( this.animate.bind(this) );
        this.draw();
    }

    this.draw = function() {

        var j = this.animList.length;
        while(j--){
            if(this.animList[j].detach){
                // Clears any remaining canvas gumph.
                this.animList[j].clear();
                this.animList.splice(j, 1);
            }
        }

        for (var i = 0, len = this.animList.length; i < len; i++) {
            // Behaviours make calculations on velocity, etc.
            this.animList[i].behaveAll(count);
            // Draw renders.
            this.animList[i].draw();
        }

    }

    this.start = function(){

        // Add mode to body.
        document.body.classList.add(options.animationMode.split(":")[0]);

        active = true;
        this.wordClassIndex = 0;

        this.sourcePoem = lr.poem2 || document.querySelector('.poem2');
        this.sourcePoem.dataset.lastIndex = 0;
        this.targetPoem = lr.poem1 || document.querySelector('.poem1');
        this.targetPoem.dataset.lastIndex = 0;

        this.next();
        this.animate();
    };

    this.setAnimationMode = function(mode) {
        options.animationMode = mode;
    }

    this.setArcVariant = function(h){
        this.arcVariant = parseInt(h);
    }

    this.setArcHeight = function(h){
        this.arcHeight = parseInt(h);
    }

    this.setGravity = function(g){
        this.g = parseFloat(g);
    }

    this.setWordClasses = function(classes) {
        this.wordClasses = classes;
    }

    this.getAnimContext = function(){
        var canvas;
        if(!animContext){
            canvas = document.getElementById('animations');
            canvas.width = document.documentElement.clientWidth;
            canvas.height = document.documentElement.clientHeight;
            animContext = canvas.getContext('2d');
        }
        return animContext;
    };
}

EventDispatcher.prototype.apply( World.prototype );

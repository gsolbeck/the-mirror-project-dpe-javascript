"use strict";

function SwapLines(world, source, target){

    var self = this;

    this.world = world;
    this.source = source;
    this.target = target;
    this.sourceBbox = source.getBoundingClientRect();
    this.targetBbox = target.getBoundingClientRect();

    // Direction of travel.
    this.rtl = this.sourceBbox.left > this.targetBbox.left;

    this.initTarget(target);
    this.initSource(source);

    /*
    this.sourceLine.addEventListener('ground', function(e){
        var replacement = source.textContent,
            isStringChanging = false, letter;

        // If the capitalisation is different.
        if(options.doCorrectCaps && isSourceCapitalised !== isTargetCapitalised){
            letter = source.textContent.substr(0,1);
            replacement = (isSourceCapitalised) ? letter.toLowerCase() : letter.toUpperCase();
            replacement += source.textContent.substr(1)
            isStringChanging = true;
        }

       targetLine.swap(source.textContent, replacement);
    });
    */

};


SwapLines.prototype.initSource = function(source){

    var self = this,
        sourceDup,
        bbox = this.sourceBbox,
        arcHeight = this.world.arcHeight,
        h,
        v1,
        v2,
        groundY;

    sourceDup = Utils.duplicate(source);
    // FIXME: Is this class needed?
    sourceDup.classList.add('source--is-duplicate');

    // Ensure arcHeight will reach target if it is above source.
    arcHeight = (arcHeight-(this.sourceBbox.top-this.targetBbox.top)<0)
        ? this.sourceBbox.top-this.targetBbox.top+1 : arcHeight;

    h = this.targetBbox.left-this.sourceBbox.left;
    v1 = arcHeight;
    v2 = arcHeight-(this.sourceBbox.top-this.targetBbox.top);

    // Put each letter into starting position, ignoring parent.
    [].forEach.call(sourceDup.children, function(el){
        el.style.transform = "translate3d("
            + bbox.left + "px,"
            + bbox.top + "px, 0)";
    });

    this.sourceLine = new SourceLine(this.world, sourceDup);
    this.sourceLine.addEventListener('rendered', this.handleRendered.bind(this));
    this.sourceLine.render(this.rtl, h, v1, v2, this.targetBbox.top);

    this.sourceLine.addEventListener('progress', this.handleProgress.bind(this));
    this.sourceLine.addEventListener('complete', this.handleComplete.bind(this));
    this.sourceLine.addEventListener('ground-letter', this.handleGroundLetter.bind(this));
};

SwapLines.prototype.handleRendered = function(e){
    var sourceLine = e.target;

    sourceLine.throw(this.rtl);
    this.source.classList.add('source');
};

SwapLines.prototype.initTarget = function(target){
    var targetDup = Utils.duplicate(target);
    target.parentNode.insertBefore(targetDup, target);
    target.parentNode.removeChild(target);
    this.targetLine = new TargetLine(targetDup);
};

SwapLines.prototype.handleProgress = function(e){
    // targetLineAnimations(e.framesRemaining);
    var framesRemaining = e.framesRemaining,
        fps = (1000/this.world.frameTime).toFixed(1),
        timeRemaining = (framesRemaining/fps)*1000,
        difference = this.targetBbox.width-this.sourceBbox.width,
        sourceText = this.sourceLine.wordEl.textContent;

    // If rtl and difference is minus (i.e. we're creating space for the
    // incoming word) then animation needs to be complete by the time
    // the first letter lands.
    this.targetLine.fillSpace((0.5+difference)|0, (0.5+timeRemaining/2)|0, sourceText);
    this.targetLine.fadeOut(this.rtl, (0.5+timeRemaining/2)|0, sourceText);
    // FIXME: Might just need deleting.
    // this.removeEventListener('progress', handleProgress);
};

SwapLines.prototype.handleComplete = function(e){
    var sourceDup = this.sourceLine.wordEl,
        capitalisedString = this.getCapitalisedString();

    sourceDup.parentNode.removeChild(sourceDup);

    this.targetLine.clean(sourceDup.textContent, capitalisedString);

    this.source.classList.remove('source');
    this.source.classList.add('was-source');

    this.dispatchEvent({type:'complete'});
};

SwapLines.prototype.handleGroundLetter = function(e){
    var letterEl = e.pO.el;
    this.targetLine.showLetter(letterEl.textContent, this.rtl);
    letterEl.classList.add('is-grounded');
};

SwapLines.prototype.getCapitalisedString = function(){

    var replacement = this.source.textContent,
        letter, source = this.source, target = this.target,
        firstLetterSource = source.textContent.substr(0,1),
        firstLetterTarget = target.textContent.substr(0,1),
        isSourceCapitalised = firstLetterSource === firstLetterSource.toUpperCase(),
        isTargetCapitalised = firstLetterTarget === firstLetterTarget.toUpperCase();

    if(isSourceCapitalised !== isTargetCapitalised){
        letter = source.textContent.substr(0,1);
        replacement = (isSourceCapitalised) ? letter.toLowerCase() : letter.toUpperCase();
        replacement += source.textContent.substr(1)
    }

    return replacement;
}

EventDispatcher.prototype.apply( SwapLines.prototype );

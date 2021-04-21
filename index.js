// Both of these are generated using functions in ./tools.js but I'm too lazy
// to actually implement those into this component, so I just used the base64
// representations for convenience. Actually, the tools themselves are larger
// than these data urls so just consider this part minified ;)

const DISPLACEMENT_MAP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACZ0lEQVR4Xu3SZVaVAQAA0fd2TiNICdKNdHc3KCAp3d1dooLyuZCZH7OBOTccBBFBEAqFjPkgHLwLgIw/HPwTABvAXwGwAbwJgA3gVQBsAH8EwAbwWwBsAL8EwAbwIgA2gJ8CYAN4FgAbwJMA2AAeBcAG8CAANoB7AbAB3AmADeBWAGwANwJgA7gWABvAlQDYAC4FwAZwIQA2gHMBsAGcCYAN4FQAbAAnAmADOBYAG8CRANgADgXABnAgADaAfQGwAewJgA1gVwBsADsCYAPYFgAbwJYA2AA2BcAGsCEANoB1AbABrAmADWBVAGwAKwJgA1gWABvAkgDYABYFwAbwQwBsAAsCYAOYFwAbwJwA2ABmBcAGMCMANoBpAbABfBcAG8CUANgAJgXABjAhADaAbwJgA/gqADaAcQGwAYwJgA1gVABsACMCYAMYFgAbwJAA2AAGBcAGMCAANoB+AbAB9AmADaBXAGwAPQJgA+gWABtAlwDYADoFwAbQIQA2gHYBsAG0CYANoFUAbAAtAmADaBYAG0CTANgAGgXABtAgADaAegGwAdQJgA2gVgBsADUCYAOoFgAbQJUA2AAqBcAGUCEANoByAbABfBEAG0CZANgASgXABlAiADaAYgGwARQJgA2gUABsAAUCYAPIFwAbQJ4A2AByBcAGkCMANoBsAbABZAmADSBTAGwAnwXABpAhADaAdAGwAXwSABtAmgDYAFIFwAaQIgA2gGQBsAEkCYAN4KMA2AASBcAGkCAANoAPAmADiBcAG0CcANgAYgXABhAjADaAaAGwAUQJgA0gUgBsABECIAP4D1H744HzsN5iAAAAAElFTkSuQmCC';
const BAYER_DITHER_MAP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAu0lEQVQ4T6WSMQqFMBBEE2wDXiVgG8gtglilCuIpcoogVqlEPIVgK3gVIa2Qzw9YbIpttlqGgbcMM5wxlr33LMbI/nccx3I/PQwD0LXPj+OgAaSUBWCtLZ+2bSv308uyAF37/HkeGkAIASL0fQ8yT9MEdO3z67poAKUUiDDPM8i87zvQtc/f96UBmqZBazTG4Ds4z5MG6LoOrTGEgO8gpUQDtG2L1uicw3dw3zcNoLVGa1zXFd9BzpkE+AFp94/4eKx9+AAAAABJRU5ErkJggg==';

const template = document.createElement('template');
template.innerHTML = `
    <div id="container">
        <div id="content">
            <slot></slot>
        </div>

        <div id="dither-map-1"></div>
        <div id="dither-map-2"></div>
    </div>
    <svg id="filter">
        <defs>
            <filter id="pixelate" x="0" y="0" width="100%" height="100%">
                <feImage width="2" height="2" result="single-map" href="${DISPLACEMENT_MAP}"/>
                <feTile in="single-map" result="full-map"/>
                <feDisplacementMap in="SourceGraphic" in2="full-map" xChannelSelector="R" yChannelSelector="G" scale="4"/>
            </filter>
        </defs>
    </svg>
    <style>
        :host {
            --dither-map: url(${BAYER_DITHER_MAP});
            display: block;
            overflow: hidden;
            background-color: inherit;
        }

        #container {
            --pixel-size: 2;
            width: calc(100% + var(--pixel-size) * 1px);
            height: calc(100% + var(--pixel-size) * 1px);
            position: relative;
            background-color: inherit;
            overflow: hidden;
            filter: url(#pixelate) brightness(10000);
        }

        #content {
            width: 100%;
            height: 100%;
            background-color: inherit;
        }

        :host([accurate-pixelation]) #content {
            filter: blur(calc((var(--pixel-size) - 1) / 2 * 1px));
        }

        #dither-map-1, #dither-map-2 {
            position: absolute;
            top: 0;
            left: 0;
            width: calc(100% / var(--pixel-size));
            height: calc(100% / var(--pixel-size));
            background-image: var(--dither-map);
            image-rendering: pixelated;
            pointer-events: none;
            transform: scale(var(--pixel-size));
            transform-origin: 0 0;
        }

        #dither-map-1 { mix-blend-mode: lighten; }
        #dither-map-2 { mix-blend-mode: difference; }

        #filter {
            display: none;
            color-interpolation-filters: srgb;
        }
    </style>
`;

// Above template is probably not very enlightening, so let me try to explain
// how this works. There's a dithering effect at play as well as a pixelation
// effect, and they are pretty much independent. The dithering is basically a
// combination of two overlaying dither maps with a different mix-blend-mode,
// and a container with a super strong brightness filter. The mix-blend-modes
// are "lighten" (for the bottom one) and "difference" (for the top one). The
// formulas are max(Cb, Cs) and | Cb - Cs | respectively, where Cb stands for
// "channel backdrop", i.e. the value for either r, g, or b and Cs stands for
// the same channel for the source color (i.e. the overlaying dither map). So
// the process goes as follows:
//
//    if a channel in the backdrop is lighter than the one in the dither map:
//        max(Cb, Cs) computes to the value of the backdrop
//        | Cb - Cs | computes to something larger than 0
//        the brightness filter bumps that to 255
//    if a channel in the backdrop is darker than the one in the dither map:
//        max(Cb, Cs) computes to the value of the dither map
//        | Cb - Cs | computes to 0
//        the brightness filter does nothing to it, keeping it at 0.
//
// Now all of the color channels are set to either 0 or 255, keeping only the
// brightest colors (yellow, cyan, green, magenta, etcetera) as well as black
// and white. Dither complete!
//
// The second part of the process is the pixelation effect to allow for pixel
// sizes larger than 1. This is a bit more straight forward; it's just an SVG
// filter with a displacement map that maps each pixel to the bottom right of
// the displacement map. If you want to know how displacement maps work, read
// MDN or the specs because I'm pretty tired of making sure each line in this
// block of comments (and all the other blocks, for that matter) are the same
// length.

customElements.define('fe-dither', class extends HTMLElement {
    #elements = {
        pixelate: null,
        filter: null,
        container: null
    };

    static get observedAttributes(){ return ['pixel-size']; }

    constructor(){
        super();
        const shadow = this.attachShadow({mode: 'closed'});
        shadow.appendChild(template.content.cloneNode(true));
        Object.keys(this.#elements).forEach(id => {
            this.#elements[id] = shadow.getElementById(id);
        });
    }

    attributeChangedCallback(attribute, oldValue, newValue){
        switch(attribute){
            case 'pixel-size': this.#updatePixelSize(newValue);
        }
    }

    get pixelSize(){ return this.getAttribute('pixel-size'); }
    set pixelSize(value){ this.setAttribute('pixel-size', value); }

    #updatePixelSize(value){
        const size = parseInt(value);
        if(Number.isNaN(size) || size < 1) return this.pixelSize = 1;
        const {filter, container} = this.#elements;
        container.style.setProperty('--pixel-size', size);
        if(size == 1) return filter.remove();
        const feImage = filter.querySelector('feImage');
        const feDisplacementMap = filter.querySelector('feDisplacementMap');
        feImage.setAttribute('width', size);
        feImage.setAttribute('height', size);
        feDisplacementMap.setAttribute('scale', 2 * size);
        container.after(filter);
    }

});

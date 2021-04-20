// Generate a Bayer Matrix of a specific size. The actual side lengths of the
// matrix are 2^[size]. The elements normally range from 0 to [size] but here
// we will scale them up so they range from 0 to 255. This way, we can use it
// as a dithermap, mapping the numbers onto a canvas with the exact greyscale
// values. Note that [size] must be 4 or less for the Bayer map to make sense
// in the context of dithering

function getBayerMatrix(size){
    const factor = 2 ** (8 - 2 * size);
    return Array.from({length: 2 ** size}, (_, x) => {
        return Array.from({length: 2 ** size}, (_, y) => {
            // some complicated formula... Stole it from wikipedia.
            // M(x, y) = bit_reverse(bit_interleave(bitwise_xor(x, y), x))
            const a = (x ^ y).toString(2).padStart(size, 0);
            const b = y.toString(2).padStart(size, 0);
            let i = size;
            let c = '';
            while(i--) c += a[i] + b[i];
            return factor * parseInt(c, 2);
        });
    });
};

// Creates a Bayer dither map. First argument is the size of the Bayer matrix
// being used, second is the pixel size allowing for a more pixelated looking
// dithering effect.

function getBayerDitherMap(size = 4, pixelSize = 1){
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 2 ** size * pixelSize;
    canvas.height = 2 ** size * pixelSize;

    const bayerMatrix = getBayerMatrix(size);

    bayerMatrix.forEach((column, x) => column.forEach((value, y) => {
        const hexColor = '#' + value.toString(16).padStart(2, 0).repeat(3);
        context.fillStyle = hexColor;
        context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }));

    return canvas;
};

// This function simply creates a canvas from a width, height, and a callback
// which takes (x, y) as parameters. The callback should return the color for
// the pixel at (x, y) in the form of an object literal with properties r, g,
// b, and a. If a property is missing from the returned object, it falls back
// to a default of 128 for r, g, and b, and 255 for a.

function getCanvasFrom({width, height}, callback){
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    const data = Uint8ClampedArray.from(
        Array.from({length: width}, (_, y) => {
            return Array.from({length: height}, (_, x) => {
                const {r, g, b, a} = callback(x, y);
                return [r ?? 128, g ?? 128, b ?? 128, a ?? 255];
            }).flat();
        }).flat()
    );
    const imagedata = new ImageData(data, width, height);
    context.putImageData(imagedata, 0, 0);

    return canvas;
};

// Gets a displacement map for an feDisplacementMap with side lengths [size].
// It maps each pixel to the most bottom right pixel. It seems like this only
// works properly if size == 128. This is probably because 127 is prime which
// means there will be rounding errors whenever size is not 128.

function getDisplacementMap(size){
    return getCanvasFrom({width: size, height: size}, (x, y) => {
        const r = 255 - 127 / (size - 1) * x;
        const g = 255 - 127 / (size - 1) * y;
        return {r, g};
    });
};

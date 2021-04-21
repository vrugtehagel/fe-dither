# fe-dither

This is a simple web component that allows you to dither, well, anything. Include the index.js file (as a module script) and you can use it like this:

```html
<fe-dither pixel-size="2">
    <!-- the content you want to dither -->
</fe-dither>
```

The cool part is that you can do anything with its content; animate colors, move things around, etcetera, and it'll all just work. Even the scrollbars get dithered! This is all due to the fact that there's no JavaScript involved in the rendering; the JavaScript file is basically just setting up the necessary HTML and CSS, defining the web component and making it configurable (though there are not that many options yet). This is cool and all, but it's actually also efficient because it means the rendering is pretty fast (as it uses the GPU), and you don't have to worry about this component impacting your frame budget.

## Pixel size
The `pixel-size` attribute controls the size of the pixelation effect. The default is 2, meaning every rendered pixel (square) is 2px by 2px. Setting it to 1 would result in the finest dithering effect you can achieve, and setting it to high values make everything inside it illegible.

## Dither map
There's also the `--dither-map` CSS variable you can set on the `fe-dither` element. This is the map used for dithering, it defaults to a 16 x 16 bayer dithering map (resulting in ordered dithering). If you want something else, like blue noise, you can just create a data URL for a blue noise map and set this `--dither-map` variable to that. When doing so, assume the `pixel-size` is 1; the component itself takes care of making sure the dither map and pixel size align.

## Accurate pixelation
The pixelation effect is quite inaccurate for larger pixel sizes. Hence, here's an option (as an attribute) to fix this problem; it blurs the content before applying the pixelation effect, resulting in more accurate pixelated colors. Note that for large pixel values, this makes things considerably heavier because browsers don't like to blur stuff.

## Notes
While it conceptually works in all modern browsers, it should be noted that this component probably only works in Chrome in its current state. It uses fancy syntax features like private class properties, this component is more of a proof of concept. Feel free to extend it and/or transpile it if you want it to work in more browsers. 

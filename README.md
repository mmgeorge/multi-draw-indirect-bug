# multi-draw-indirect-bug
Calling `drawIndirect` multiple times in a renderPass appears to not being working in chrome 118.0.5990.0. See index.html / [index.js]([url](https://github.com/mmgeorge/multi-draw-indirect-bug/blob/master/index.js#L133-L138)https://github.com/mmgeorge/multi-draw-indirect-bug/blob/master/index.js#L133-L138): 

```js
 // This does NOT work. It looks like the first drawIndirect takes priority
pass.drawIndirect(indirectBuffer, 0); // <- Comment out line to shift triangle
pass.drawIndirect(indirectBuffer, 4 * 4);

// This works: 
// pass.draw(3, 1, 0, 0);
// pass.draw(3, 1, 0, 1);
```


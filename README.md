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
### Expected: 

<img src="https://github.com/mmgeorge/multi-draw-indirect-bug/assets/16738762/56da9887-8e20-4a01-a041-3a20c9cfcfa4" width=250>

### Actual: 

<img src="https://github.com/mmgeorge/multi-draw-indirect-bug/assets/16738762/eadc790a-f00a-4a18-9a53-74df8d42b896" width=250>

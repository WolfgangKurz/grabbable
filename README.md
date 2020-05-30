# Grabbable 2.1
Drag &amp; drop reordering TypeScript/JavaScript library.

No dependencies, No CSS files, and free.

## Browser Usage
Just call `grabbable()` on parent node after load `grabbable.js` file.
```javascript
var context = ParentNode.grabbable();

// ...
context.destroy();
```

## TypeScript Usage
Now, Grabbable supports TypeScript environment.

In TypeScript, Grabbable exports class with `.d.ts` file.

NPM publish not planned at now.

```typescript
import Grabbable, { GrabbableOption } from ".../grabbable";

const opts: GrabbableOption = {};

const context = new Grabbable(ParentNode, opts);
// or
const context = (ParentNode as HTMLElement).grabbable(opts);

// ...
context.destroy();
```

## Binding Grabbable
If you want to configure more specifically, pass some options when call `grabbable()`.

| Key        | Type                                                        | Default | Description |
|---         |---                                                          |---      |--- |
| callback   | `(HTMLElement, newIndex: number, oldIndex: number) => void` | `null`  | Callback function will be called if element position changed.
| style      | `{ [key: string]: string }`                                 | `{}`    | Use when customize placeholder's style.
| rememberId | `string`                                                    | `""`    | If you set, Grabbable will save &amp; restore position automatically via `localStorage` with `rememberId` key.

## Grabbable Context
`grabbable()` and TypeScript's `new Grabbable()` returns Grabbable context, can control grabbable element.

| Method        | Description |
|---         |--- |
| `elementList() => HTMLElement[]` | Returns ordered child elements list. |
| `update() => void` | Update grabbable binding child elements, with current DOM childrens. |
| `destroy() => void` | Unbind all child elements, and unload Grabbable context. |

/*!
 * Grabbable 2.1.0
 * ----------------------------------------------------
 * Copyright 2016-2020 Wolfgang Kurz
 * Released under the MIT license
 * https://github.com/WolfgangKurz/grabbable
 */

export type GrabbableCallback = (element: HTMLElement, newIndex: number, oldIndex: number) => void;

export interface GrabbableOption {
	style?: { [key: string]: string };
	callback?: GrabbableCallback;
	rememberId?: string;
}

const $ = <E extends Element = Element> (selectors: string) => document.querySelector<E>(selectors);
const $_ = <K extends keyof HTMLElementTagNameMap> (tagName: K) => document.createElement(tagName);

const GrabbablePlaceholderId: string = "grabbable_placeholder";
const GrabbableChildStyle: string = `
.grabbable > * {
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	cursor: -webkit-grab;
	cursor: grab;
}`;

interface EventMap {
	[key: string]: (e: DragEvent, context: Grabbable) => void;
}

function dismissEvent (e: Event) {
	e.preventDefault();
	e.stopPropagation();
}

/**
 * `Grabbable` class
 */
export default class Grabbable {
	private customizedStyle: { [key: string]: string } = {};
	private callback: GrabbableCallback | null = null;
	private rememberId: string = "";

	private DragId: string = "grabbable-0";

	private target: HTMLElement;
	private Placeholder: HTMLElement;

	private elemList: HTMLElement[] = [];
	private eventMap: EventMap = {};

	private destroyed = false;

	/**
	 * Bind `Grabbable` instance
	 * @param target Grabbable warpping element
	 * @param option Options for this instance
	 */
	constructor (target: HTMLElement, option?: GrabbableOption) {
		this.target = target;
		if (this.target.getAttribute("data-grabbable") !== null)
			throw new Error("Grabbable instance already binded for this element.");
		target.setAttribute("data-grabbable", "");

		if (option) {
			if (option.style) this.customizedStyle = option.style;
			if (option.callback) this.callback = option.callback;
			if (option.rememberId) this.rememberId = option.rememberId;
		}

		// Initialize event map object
		// This makes "Grabbable" instance into destroyable.
		const $this = this;
		this.eventMap.dragstart = function(this: HTMLElement, e: DragEvent) {
			$this.DragStart.call(this, e, $this);
		}
		this.eventMap.dragover = function(this: HTMLElement, e: DragEvent) {
			$this.DragOver.call(this, e, $this);
		}
		this.eventMap.drag = function(this: HTMLElement, e: DragEvent) {
			$this.Drag.call(this, e, $this);
		}
		this.eventMap.drop = function(this: HTMLElement, e: DragEvent) {
			$this.Drop.call(this, e, $this);
		}
		this.eventMap.resetdrop = function(this: HTMLElement, e: DragEvent) {
			$this.OutrangeDrop.call(this, e, $this);
		}

		this.target.classList.add("grabbable");

		// Bind element childs
		this.registerChilds();
		this.updateChildList();

		// Global document event
		if (!document.grabbableDocument) {
			document.grabbableDocument = [];

			document.addEventListener("dragover", (e) => {
				e.preventDefault();
				e.stopPropagation();
			});
		}

		if (document.grabbableDocument.indexOf(this) === -1) {
			document.grabbableDocument.push(this);
			document.addEventListener("drop", this.eventMap.resetdrop as EventListener);
		}

		let styleElem: HTMLStyleElement | null = $("style[data-grabbable]");
		if (!styleElem) {
			styleElem = $_("style");
			styleElem.setAttribute("data-grabbable", "");
			styleElem.type = "text/css";
			styleElem.innerHTML = GrabbableChildStyle;

			const body = $("body");
			if (body) body.appendChild(styleElem);
		}

		// Create dummy element
		this.Placeholder = (() => {
			const dummy = $_("div");
			dummy.grabbablePlaceholder = true;
			dummy.setAttribute("data-grabbable", "dummy");

			dummy.style.border = this.customizedStyle.border || "1px solid #d4d4d4";
			dummy.style.background = this.customizedStyle.background || "repeating-linear-gradient(-45deg, #fff, #fff 4px, #d4d4d4 4px, #d4d4d4 5px)"

			for (const key in this.customizedStyle)
				dummy.style[key as any] = this.customizedStyle[key];

			dummy.style.position = "relative";
			dummy.addEventListener("drop", (e) => {
				if (!dummy) return;
				if (!e.dataTransfer) return;
				if (e.dataTransfer.getData("text") !== this.DragId) return;

				e.preventDefault();
				e.stopPropagation();

				const p = dummy.parentNode;
				if (!p) return;

				let movedElem: HTMLElement | null = null;
				for (const elem of this.TemporaryBox.children) {
					if (!(elem instanceof HTMLElement)) continue;
					if (!this.elemList.includes(elem)) continue;

					p.insertBefore(elem, dummy);
					movedElem = elem;
					break; // Drag & Drop works with only 1 element at one time.
				}

				dummy.style.display = "none";

				if (movedElem)
					this.callCallback(movedElem);
			});
			return dummy;
		})();

		// Restore from localStorage
		if (this.rememberId) {
			if (!window.localStorage) {
				console.warn("Grabbable got auto-remember list option, but localStorage not supported.");
				return;
			}

			try {
				const stored = window.localStorage.getItem(this.rememberId);
				if (!stored) return;

				const parsed = JSON.parse(stored) as number[];
				const list = [...this.target.children].filter(x => x.getAttribute("data-grabbable-index") !== null);
				for (const index of parsed) this.target.appendChild(list[index]);
			} catch (e) {
				console.warn("Grabbable got auto-remember list option, but stored data is invalid.")
			}
		}
	}

	/**
	 * Unbind all childs and parent.
	 */
	public destroy () {
		if (this.destroyed) return;
		this.destroyed = true;

		for (const el of this.target.children) {
			if (!(el instanceof HTMLElement)) continue;
			if (el.getAttribute("data-grabbable") === "dummy") continue;

			el.removeEventListener("dragstart", this.eventMap.dragstart as EventListener);
			el.removeEventListener("dragover", this.eventMap.dragover as EventListener);
			el.removeEventListener("drag", this.eventMap.drag as EventListener);
			el.removeEventListener("drop", this.eventMap.drop as EventListener);
			el.removeAttribute("draggable");
			el.grabbableChild = undefined;
		}

		if (document.grabbableDocument) {
			const index = document.grabbableDocument.indexOf(this);
			if (index >= 0) {
				document.removeEventListener("drop", this.eventMap.resetdrop as EventListener);
				document.grabbableDocument.splice(index, 1);
			}
		}

		const pp = this.Placeholder.parentNode;
		if (pp) pp.removeChild(this.Placeholder);

		this.target.classList.remove("grabbable");
		this.target.removeAttribute("data-grabbable");
	}

	/**
	 * Returns binded child element list.
	 */
	public elementList () {
		return [...this.elemList];
	}

	private UpdatePlaceholder (el: HTMLElement) {
		if (this.destroyed) return;

		this.TemporaryBox.style.left = el.offsetLeft + "px";
		this.TemporaryBox.style.top = el.offsetTop + "px";
		this.Placeholder.style.width = el.offsetWidth + "px";
		this.Placeholder.style.height = el.offsetHeight + "px";

		const s = window.getComputedStyle(el);
		this.Placeholder.style.display = s.display;
		this.Placeholder.style.margin = `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`;
		this.Placeholder.style.padding = `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`;
	}
	private get TemporaryBox (): HTMLElement {
		let tb = $("#" + GrabbablePlaceholderId) as (HTMLElement | null);
		if (tb) return tb;

		tb = $_("div");
		tb.id = GrabbablePlaceholderId;
		tb.style.position = "absolute";
		tb.style.width = "1px";
		tb.style.height = "1px";
		tb.style.opacity = "0";
		tb.style.overflow = "hidden";

		const body = $("body");
		if (body) body.appendChild(tb);
		return tb;
	}

	/**
	 * Drag start
	 */
	private DragStart (this: HTMLElement, e: DragEvent, context: this): void {
		if (e.dataTransfer) {
			context.DragId = "draggable-" + Math.random();
			e.dataTransfer.setData("text", context.DragId);
		}
	}

	/**
	 * Cursor enter while dragging
	 */
	private DragOver (this: HTMLElement, e: DragEvent, context: this) {
		console.log("DragOver");
		if (
			!e.dataTransfer ||
			e.dataTransfer.getData("text") !== context.DragId ||
			!this.parentNode
		) return;

		dismissEvent(e);

		this.parentNode.insertBefore(
			context.Placeholder,
			this.previousElementSibling === context.Placeholder
				? this.nextElementSibling
				: this
		);
	}

	/**
	 * Dragging
	 */
	private Drag (this: HTMLElement, e: DragEvent, context: this) {
		if (
			!e.dataTransfer ||
			e.dataTransfer.getData("text") !== context.DragId ||
			!this.parentNode ||
			this.parentNode === context.TemporaryBox ||
			this === context.Placeholder
		) return;

		dismissEvent(e);

		context.UpdatePlaceholder(this);
		this.parentNode.insertBefore(context.Placeholder, this);
		context.TemporaryBox.appendChild(this);
	}

	/**
	 * Dropped to inside of wrapper.
	 */
	private Drop (this: HTMLElement, e: DragEvent, context: this) {
		if (!e.dataTransfer) return;

		dismissEvent(e);

		if (context.DragId !== e.dataTransfer.getData("text"))
			document.dispatchEvent(new DragEvent(e.type, e));
		else
			context.Placeholder.dispatchEvent(new DragEvent(e.type, e));
	}

	/**
	 * Dropped to out of wrapper.
	 */
	private OutrangeDrop (e: DragEvent, context: this) {
		if (
			!e.dataTransfer ||
			e.dataTransfer.getData("text") !== context.DragId
		) return;

		dismissEvent(e);

		if (context.Placeholder) {
			const p = context.Placeholder.parentNode as HTMLElement;

			let movedElem: HTMLElement | null = null;
			for (const elem of context.TemporaryBox.children) {
				if (!(elem instanceof HTMLElement)) continue;

				if (context.elemList.includes(elem)) {
					p.insertBefore(elem, context.Placeholder);
					movedElem = elem;
					break;
				}
			}

			context.Placeholder.style.display = "none";
			if (movedElem)
				context.callCallback(movedElem);
		}
	}

	/**
	 * Rebind child elements as Grabbable.
	 */
	public update () {
		if (this.destroyed) return;

		this.registerChilds();
		this.updateChildList();
	}

	/**
	 * Register/Update child elements.
	 */
	private registerChilds (): void {
		let count = 0;
		for (const el of this.target.children) {
			if (!(el instanceof HTMLElement)) continue;
			if (el.grabbableChild) count++;
		}

		for (const el of this.target.children) {
			if (!(el instanceof HTMLElement)) continue;
			if (el.grabbableChild || el.grabbablePlaceholder) continue;

			el.draggable = true;
			el.grabbableChild = true;
			el.setAttribute("data-grabbable-index", "" + (count++));

			el.addEventListener("dragstart", this.eventMap.dragstart as EventListener);
			el.addEventListener("dragover", this.eventMap.dragover as EventListener);
			el.addEventListener("drag", this.eventMap.drag as EventListener);
			el.addEventListener("drop", this.eventMap.drop as EventListener);
		}
	}

	/**
	 * Update child element array list.
	 */
	private updateChildList (): void {
		const newList: HTMLElement[] = [];
		const elems = this.target.children;
		for (const elem of elems) {
			if (elem instanceof HTMLElement && elem.grabbableChild)
				newList.push(elem);
		}
		this.elemList = newList;
	}

	/**
	 * Call dragged event and callback.
	 */
	private callCallback (elem: HTMLElement) {
		const evt = document.createEvent("HTMLEvents");
		evt.initEvent("dragged", false, true);
		elem.dispatchEvent(evt);

		const oldOrder = this.elemList.indexOf(elem);
		this.updateChildList();
		const newOrder = this.elemList.indexOf(elem);

		if (oldOrder === newOrder) return;
		if (this.callback)
			this.callback.call(this, this.target, newOrder, oldOrder);

		if (this.rememberId && window.localStorage) {
			const list = this.elemList
				.map(x => x.getAttribute("data-grabbable-index"))
				.filter(x => x !== null)
				.map(x => parseInt(x as string, 10));
			window.localStorage.setItem(this.rememberId, JSON.stringify(list));
		}
	}
}

HTMLElement.prototype.grabbable = function(options?: GrabbableOption) {
	return new Grabbable(this, options);
};

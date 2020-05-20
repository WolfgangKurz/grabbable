import Grabbable, { GrabbableOption } from "./grabbable";

declare global {
	export interface HTMLElement {
		/**
		 * Bind element with `Grabbable` from `HTMLElement`.
		 */
		grabbable (options?: GrabbableOption): Grabbable;

		/**
		 * Is this element `Grabbable` binded?
		 */
		grabbableChild?: true;

		/**
		 * Is this element dummy of `Grabbable`?
		 */
		grabbablePlaceholder?: true;
	}

	export interface Document {
		/**
		 * Is document `Grabbable` binded?
		 */
		grabbableDocument?: Grabbable[];
	}
}

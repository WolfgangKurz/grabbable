/*!
 * Grabbable 2.1.0
 * ----------------------------------------------------
 * Copyright 2016-2020 Wolfgang Kurz
 * Released under the MIT license
 * https://github.com/WolfgangKurz/grabbable
 */
export declare type GrabbableCallback = (element: HTMLElement, newIndex: number, oldIndex: number) => void;
export interface GrabbableOption {
    style?: {
        [key: string]: string;
    };
    callback?: GrabbableCallback;
    rememberId?: string;
}
export default class Grabbable {
    private customizedStyle;
    private callback;
    private rememberId;
    private DragId;
    private target;
    private Placeholder;
    private elemList;
    private eventMap;
    private destroyed;
    constructor(target: HTMLElement, option?: GrabbableOption);
    destroy(): void;
    elementList(): HTMLElement[];
    private UpdatePlaceholder;
    private get TemporaryBox();
    private DragStart;
    private DragOver;
    private Drag;
    private Drop;
    private OutrangeDrop;
    update(): void;
    private registerChilds;
    private updateChildList;
    private callCallback;
}

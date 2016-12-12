/*!
 * grabbable
 * Version: 1.0.4
 *
 * Copyright 2016 Wolfgang Kurz
 * Released under the MIT license
 * https://github.com/WolfgangKurz/grabbable
 */
"use strict";
!function(){
	var grabbableStyle = function(){
		var style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = ".grabbable > * { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; cursor: -webkit-grab; cursor: grab } "
			+ ".grabbable > .grabbable-dummy {"
			+ " border: 1px solid #d4d4d4;"
			+ " background: repeating-linear-gradient( -45deg, #fff, #fff 4px, #d4d4d4 4px, #d4d4d4 5px );"
			+ "}";
		document.querySelector("body").appendChild(style);
	};
	var callCallback = function(elem){
		if(document.createEventObject) {
			elem.fireEvent("ondragged");
		} else {
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("dragged", false, true);
			elem.dispatchEvent(evt);
		}
	};

	var dummy = null, bg = null;
	var createDummy = function(){
		bg = document.createElement("div");
		bg.style.position = "absolute";
		bg.style.width = "1px";
		bg.style.height = "1px";
		bg.style.overflow = "hidden";

		dummy = document.createElement("div");
		dummy.className = "grabbable-dummy";
		dummy.style.position = "relative";
		dummy.addEventListener("drop", function(e){
			var data = e.dataTransfer.getData("text");
			if(data!="draggable") return;

			e.preventDefault();
			e.stopPropagation();

			while(bg.children.length>0){
				var elem = bg.children[0];
				this.parentNode.insertBefore(elem, this);
			}

			dummy.style.display = "none";
			callCallback(dummy.parentNode);
		});

		var x = document.querySelector("body");
		x.appendChild(dummy);
		x.appendChild(bg);
	};
	var updateDummy = function(el){
		bg.style.left = el.offsetLeft+"px";
		bg.style.top = el.offsetTop+"px";
		dummy.style.width = el.offsetWidth+"px";
		dummy.style.height = el.offsetHeight+"px";

		var style = window.getComputedStyle(el);
		dummy.style.display = style.display;
		dummy.style.margin = style.marginTop+" "+style.marginRight+" "+style.marginBottom+" "+style.marginLeft;
		dummy.style.padding = style.paddingTop+" "+style.paddingRight+" "+style.paddingBottom+" "+style.paddingLeft;
	};
	var initGrabbable = function(){
		grabbableStyle();
		createDummy();
	};

	var prevent = function(e){
		e.preventDefault();
		e.stopPropagation();
	};
	var allowDrop = function(e){
		e.preventDefault();

		e.stopPropagation();

		if(this.previousElementSibling!=dummy)
			this.parentNode.insertBefore(dummy, this);
		else
			this.parentNode.insertBefore(dummy, this.nextElementSibling);
	}
	var dragOn = function(e){
		e.dataTransfer.setData("text", "draggable");
	};
	var resetDrop = function(e){
		var data = e.dataTransfer.getData("text");
		if(data!="draggable") return;

		prevent(e);

		while(bg.children.length>0){
			var elem = bg.children[0];
			dummy.parentNode.insertBefore(elem, dummy);
		}
		dummy.style.display = "none";
		callCallback(dummy.parentNode);
	};

	if(document.readyState=="complete") initGrabbable();
	else document.addEventListener("DOMContentLoaded", function(){ initGrabbable() });

	HTMLElement.prototype.grabbable = function(){
		if( (" "+this.className+" ").indexOf(" grabbable ")<0 )
			this.className += " grabbable";

		for(var i=0; i<this.children.length; i++){
			var el = this.children[i];
			if(typeof el.draggabled=="undefined"){
				if(el==dummy) continue;

				el.draggable = true;

				el.addEventListener("dragstart", dragOn);
				el.addEventListener("dragover", allowDrop);
				el.addEventListener("drag", function(){
					if(this.parentNode==bg) return;
					if(this==dummy) return;

					updateDummy(this);
					this.parentNode.insertBefore(dummy, this);
					bg.appendChild(this);
				});
				el.addEventListener("drop", function(e){
					prevent(e);

					if(document.createEventObject) dummy.fireEvent("ondrop", e);
					else dummy.dispatchEvent(new DragEvent(e.type, e));
				});
				el.draggabled = true;
			}
		}

		if(typeof document.draggabled=="undefined"){
			document.addEventListener("dragover", prevent);
			document.addEventListener("drop", resetDrop);
			document.draggabled = true;
		}
	};
}()

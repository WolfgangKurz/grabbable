"use strict";
!function(){
	var grabbableStyle = function(){
		var style = document.createElement("style");
		style.type = "text/css";
		style.innerHTML = ".grabbable > * { cursor: grab } "
			+ ".grabbable > .grabbable-dummy {"
			+ " border: 1px solid #d4d4d4;"
			+ " background: repeating-linear-gradient( -45deg, #fff, #fff 4px, #d4d4d4 4px, #d4d4d4 5px );"
			+ "}";
		document.querySelector("body").appendChild(style);
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
			e.preventDefault();
			e.stopPropagation();

			var obj = JSON.parse(e.dataTransfer.getData("text"));
			var elem = document.querySelector("#"+obj.element.replace("$","\\$"));

			this.parentNode.insertBefore(elem, this);

			if(obj.prevId.length>0) elem.id = obj.prevId;
			else elem.removeAttribute("id");

			dummy.style.display = "none";
		});

		var x = document.querySelector("body");
		x.appendChild(dummy);
		x.appendChild(bg);
	};
	var updateDummy = function(el){
		bg.style.left = el.offsetLeft+"px";
		bg.style.top = el.offsetTop+"px";
		dummy.style.width = el.offsetWidth+"px";
		dummy.style.height = el.offsetWidth+"px";

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

		var obj = JSON.parse(e.dataTransfer.getData("text"));
		if(this.previousElementSibling!=dummy)
			this.parentNode.insertBefore(dummy, this);
		else
			this.parentNode.insertBefore(dummy, this.nextElementSibling);
	}
	var dragOn = function(e){
		updateDummy(this);

		var id = "_GRABBABLE$"+Math.random().toFixed(8).substr(2);
		var obj = {
			element: id,
			prevId: this.id
		};
		e.dataTransfer.setData("text", JSON.stringify(obj));

		this.parentNode.insertBefore(dummy, this);
		bg.appendChild(this);
		this.id = id;
	};
	var resetDrop = function(e){
		prevent(e);

		var obj = JSON.parse(e.dataTransfer.getData("text"));
		var elem = document.querySelector("#"+obj.element.replace("$","\\$"));
		dummy.parentNode.insertBefore(elem, dummy);
		dummy.style.display = "none";
	};

	if(document.readyState=="complete") initGrabbable();
	else document.addEventListener("DOMContentLoaded", function(){ initGrabbable() });

	HTMLElement.prototype.grabbable = function(){
		this.className += " grabbable";

		for(var i=0; i<this.children.length; i++){
			var el = this.children[i];
			el.draggable = true;
			el.addEventListener("dragstart", dragOn);
			el.addEventListener("dragover", allowDrop);
			el.addEventListener("dragdrop", prevent);
		}
		document.addEventListener("dragover", prevent);
		document.addEventListener("drop", resetDrop);
	};
}()

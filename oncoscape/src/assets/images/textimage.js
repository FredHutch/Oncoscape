var componentApp = (function(componentApp) {
	
	componentApp.textimageComponent = (function(textimageComponent) {
		
		var addEvent = function(elem,evtType,func){
			if(elem.addEventListener){ elem.addEventListener(evtType,func,false); }
			else if(elem.attachEvent){ elem.attachEvent("on"+evtType, func); }
			else { elem["on"+evtType] = func; }
		};
		
		textimageComponent.hasInitializedMouseovers = textimageComponent.hasInitializedMouseovers || false;
		
		var initializeMouseovers = function() {

			if(document.querySelector && !textimageComponent.hasInitializedMouseovers) {
				addEvent(window, "load", function(){ addMouseovers(); });
			} 
			textimageComponent.hasInitializedMouseovers = true;
			return;
			
		};
		
		var addMouseovers = function() {

			var theImages = document.querySelectorAll(".rolloverImage");
			for(var i = 0, len = theImages.length; i < len; i++) {
				var image = theImages[i];
				/* Set a static width/height so the image doesn't change size when the src changes */
				image.setAttribute("width", image.offsetWidth);
				image.setAttribute("height", image.offsetHeight);
				/* Mouseenter and mouseleave are unsupported by most browsers currently */
				addEvent(image, "mouseover", toggleMouseover);
				addEvent(image, "mouseout", toggleMouseover);
			}
			
		};
		
		var toggleMouseover = function(e) {

			var that = e.target || e.srcElement;
			var currentSrc = that.getAttribute("src");
			
			if(that.dataset) {
				that.setAttribute("src", that.dataset.hover);
				that.dataset.hover = currentSrc;
			} else {
				that.setAttribute("src", that.getAttribute("data-hover"));
				that.setAttribute("data-hover", currentSrc);
			}
			
		}
		
		initializeMouseovers();
		
		return textimageComponent;

	})(componentApp.textimageComponent || {});
	
	return componentApp;
	
})(componentApp || {});

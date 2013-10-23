( function( w ) {

	String.prototype.trim = function(){
		return this.replace(/^\s+|\s+$/g, '');
	};

	function getClassName( classNameString ) {
		return classNameString.split( '.' ).join( ' ' ).trim();
	}

	function renderRules( rules, options ) {
		rules.forEach( function( ruleDef ) {
			var parent = document.body, isDirty, ruleParts = ruleDef.children, j;

			ruleParts.forEach( function( childDesc, j ) {
				var tagName, child = childDesc.el, el, el2,
					selectedNode = document.querySelectorAll( childDesc.selector ),
					tagName = child.tagName, label;

				// Add the rule to the last child
				if ( j === ruleDef.children.length - 1 ) {
					label = ruleDef.selector;
					if ( tagName === 'TABLE' ) {
						el = document.createElement( 'td' );
						el.appendChild( document.createTextNode( label ) );
						el2 = document.createElement( 'tr' );
						el2.appendChild( el );
						child.appendChild( el2 );
					} else {
						if ( tagName === 'INPUT' ) {
							child.value = label;
						} else {
							child.appendChild( document.createTextNode( label ) );
						}
					}
				}

				// FIXME: don't add html / body
				// Element must not exist to be added
				if ( selectedNode.length === 0 ) {
					if ( tagName === 'LI' && parent.nodeName !== 'UL' && parent.nodeName !== 'OL' ) {
						el = document.createElement( 'ul' );
						//parent.appendChild( el );
						parent = el;
					}
					if ( tagName !== 'BODY' && tagName !== 'HTML' ) {
						parent.appendChild( child );
						if ( options.closeOnHide ) {
							child.addEventListener( 'click', function( ev ) {
								ev.preventDefault();
								child.parentNode.removeChild( child );
							} );
						}
						parent = child;
					} else {
						// Not sure how to deal with styles that manipulate BODY and HTML tag yet..
						isDirty = true;
					}
				} else {
					parent = selectedNode[0];
				}
			} );
		} );
	}

	function parseSelector( nodeDescription ) {
		var firstChar, id, className, tagName = 'DIV',
			parts, attrs, regex = /\[.*?\=.*?\]|\[.*\]/g, i, args, attr,
			node;

		// find attrs 
		attrs = nodeDescription.match( regex );
		// strip them
		nodeDescription = nodeDescription.replace( regex, '' );

		// extract id
		parts = nodeDescription.split( '#' );
		nodeDescription = parts[0];
		if ( parts[1] ) {
			parts = parts[1].split( '.' );
			id = parts[0];
			if ( parts[1] ) {
				nodeDescription += '.' + parts.slice( 1 ).join( '.' );
			}
		}

		// make sure wasnt just an id
		if ( nodeDescription ) {
			firstChar = nodeDescription.charAt( 0 );
			// Now we either have tag or class
			if ( firstChar === '.' ) {
				className = getClassName( nodeDescription );
			} else {
				// FIXME: what about id in string?
				parts = nodeDescription.split( '.' );
				tagName = parts[ 0 ].toUpperCase();
				// Deal with *
				tagName = tagName === '*' ? 'SPAN' : tagName;
				className = getClassName( parts.slice( 1 ).join( '.' ) );
			}
		}

		// create the node
		node = document.createElement( tagName );
		if ( className ) {
			node.setAttribute( 'class', className );
		}

		if ( id ) {
			node.setAttribute( 'id', id );
		}

		if ( attrs ) {
			for ( i = 0; i < attrs.length; i++ ) {
				attr = attrs[i];
				args = attr.replace( /[\[\]'\"^,\$\*\#\?]/gi, '' ).split( '=' );
				node.setAttribute( args[0], args[1] || '' );
			}
		}
	
		return node;
	}

	function addSelector( rules, selector ) {
		var nodeSelectors = selector.replace( /  /gi, ' ' ).split( ' ' ), i,
			children = [],
			nodeSelector, fullSelector = '';
		for( i = 0; i < nodeSelectors.length; i++ ) {
			nodeSelector = nodeSelectors[i];
			if ( nodeSelector ) {
				fullSelector += ' ' + nodeSelector;

				// Special case childs
				nodeSelector = nodeSelector.replace( /[>+~]/gi, '' );
				if ( nodeSelector ) {
					children.push( { el: parseSelector( nodeSelector ), selector: fullSelector } );
				}
			}
		}
		rules.push( {
			children: children,
			selector: fullSelector
		} );
	}

	function parseRules( cssRules ) {
		var rules = [], i;

		for( i = 0; i < cssRules.length; i++) {
			var selectors, rule = cssRules[i];
			if ( rule.cssRules ) {
				rules = rules.concat( parseRules( rule.cssRules ) );
			} else if ( !rule.keyText && rule.selectorText ){
				selectors = rule.selectorText.split( ',' );
				selectors.forEach( function( selector ) {
					if ( selector.indexOf( ':' ) === -1 ) {
						addSelector( rules, selector );
					} else {
						//console.log( 'Ignored: ' + selector );
					}
				} );
			}
		}
		return rules;
	}

	function init( options ) {
		var stylesheet, cssRules;
		for( i = 0; i < document.styleSheets.length; i++ ) {
			stylesheet = document.styleSheets[i];
			cssRules = stylesheet.cssRules;
			// Render the nodes
			if ( cssRules ) {
				renderRules( parseRules( cssRules ), options || {} );
			}
		}
	}
	init( { closeOnHide: true } );
	w.lsg = { init: init };
} ( window ) );

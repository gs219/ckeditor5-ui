/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module ui/colorgrid/colorgrid
 */

import View from '../view';
import ColorTileView from './colortileview';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '../focuscycler';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import '../../theme/components/colorgrid/colorgrid.css';
import Template from '../template';

/**
 * A grid of {@link module:ui/colorgrid/colortile~ColorTileView color tiles}.
 *
 * @extends module:ui/view~View
 */
export default class ColorGridView extends View {
	/**
	 * Creates an instance of a color grid containing {@link module:ui/colorgrid/colortile~ColorTileView tiles}.
	 *
	 * @param {module:utils/locale~Locale} [locale] The localization services instance.
	 * @param {Object} options Component configuration
	 * @param {Array.<module:ui/colorgrid/colorgrid~ColorDefinition>} [options.colorDefinitions] Array with definitions
	 * required to create the {@link module:ui/colorgrid/colortile~ColorTileView tiles}.
	 * @param {Number} options.columns A number of columns to display the tiles.
	 * @param {String} options.recentlyUsedLabel A label for a color grid.
	 */
	constructor( locale, options ) {
		super( locale );

		const colorDefinitions = options && options.colorDefinitions || [];
		const viewStyleAttribute = {};

		/**
		 * Number of columns in the color grid
		 *
		 * @type {Number}
		 */
		this.columns = options.columns;

		/**
		 * The label used to describe given color grid.
		 *
		 * @type {String}
		 */
		this.recentlyUsedLabel = options.recentlyUsedLabel;

		/**
		 * The color of the currently selected color tile in {@link #items}.
		 *
		 * @member {module:ui/colorgrid~ColorGridView#selectedColor}
		 * @type {String}
		 */
		this.set( 'selectedColor' );

		/**
		 * Collection of the child tile views.
		 *
		 * @readonly
		 * @member {module:ui/viewcollection~ViewCollection}
		 */
		this.items = this.createCollection();

		/**
		 * Tracks information about DOM focus in the grid.
		 *
		 * @readonly
		 * @member {module:utils/focustracker~FocusTracker}
		 */
		this.focusTracker = new FocusTracker();

		/**
		 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
		 *
		 * @readonly
		 * @member {module:utils/keystrokehandler~KeystrokeHandler}
		 */
		this.keystrokes = new KeystrokeHandler();

		/**
		 * Helps cycling over focusable {@link #items} in the grid.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/focuscycler~FocusCycler}
		 */
		this._focusCycler = new FocusCycler( {
			focusables: this.items,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate grid items backwards using the arrowup key.
				focusPrevious: 'arrowleft',

				// Navigate grid items forwards using the arrowdown key.
				focusNext: 'arrowright',
			}
		} );

		colorDefinitions.forEach( item => {
			const colorTile = new ColorTileView();

			colorTile.set( {
				color: item.color,
				label: item.label,
				tooltip: true,
				hasBorder: item.options.hasBorder
			} );

			colorTile.on( 'execute', () => {
				this.fire( 'execute', {
					value: item.color,
					hasBorder: item.options.hasBorder,
					label: item.label
				} );
			} );

			this.items.add( colorTile );
		} );

		const children = [ this.generateItemsTemplate() ];
		if ( this.recentlyUsedLabel ) {
			children.unshift( this.generateLabelTemplate() );
		}

		this.setTemplate( {
			tag: 'div',
			children,
			attributes: {
				class: [
					'ck',
					'ck-color-grid'
				],
				style: viewStyleAttribute
			}
		} );

		this.on( 'change:selectedColor', ( evt, name, selectedColor ) => {
			for ( const item of this.items ) {
				item.isOn = item.color === selectedColor;
			}
		} );

		this.items.on( 'add', ( evt, item ) => {
			if ( item.color === this.selectedColor ) {
				item.isOn = true;
			}
		} );
	}

	/**
	 * Focuses the first focusable in {@link #items}.
	 */
	focus() {
		if ( this.items.length ) {
			this.items.first.focus();
		}
	}

	/**
	 * Focuses the last focusable in {@link #items}.
	 */
	focusLast() {
		if ( this.items.length ) {
			this.items.last.focus();
		}
	}

	/**
	 * @inheritDoc
	 */
	render() {
		super.render();

		// Items added before rendering should be known to the #focusTracker.
		for ( const item of this.items ) {
			this.focusTracker.add( item.element );
		}

		this.items.on( 'add', ( evt, item ) => {
			this.focusTracker.add( item.element );
		} );

		this.items.on( 'remove', ( evt, item ) => {
			this.focusTracker.remove( item.element );
		} );

		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element );
	}

	generateItemsTemplate() {
		return new Template( {
			tag: 'div',
			children: this.items,
			attributes: {
				class: [
					'ck',
					'ck-color-grid__items'
				],
				style: {
					gridTemplateColumns: `repeat( ${ this.columns }, 1fr)`
				}
			}
		} );
	}

	generateLabelTemplate() {
		return new Template( {
			tag: 'div',
			children: [
				this.recentlyUsedLabel
			],
			attributes: {
				class: [
					'ck',
					'ck-color-grid__label'
				]
			}
		} );
	}
}

/**
 * A color definition used to create a {@link module:ui/colorgrid/colortile~ColorTileView}.
 *
 *		{
 *			color: hsl(0, 0%, 75%),
 *			label: 'Light Grey',
 *			options: {
 *				hasBorder: true
 *			}
 *		}
 *
 * @typedef {Object} module:ui/colorgrid/colorgrid~ColorDefinition
 * @type Object
 *
 * @property {String} color String representing a color.
 * It is used as value of background-color style in {@link module:ui/colorgrid/colortile~ColorTileView}.
 * @property {String} label String used as label for {@link module:ui/colorgrid/colortile~ColorTileView}.
 * @property {Object} options Additional options passed to create a {@link module:ui/colorgrid/colortile~ColorTileView}.
 * @property {Boolean} options.hasBorder A flag that indicates if special a CSS class should be added
 * to {@link module:ui/colorgrid/colortile~ColorTileView}, which renders a border around it.
 */

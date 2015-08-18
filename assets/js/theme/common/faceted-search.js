import { hooks, api } from 'bigcommerce/stencil-utils';
import $ from 'jquery';
import _ from 'lodash';
import Url from 'url';
import History from 'browserstate/history.js/scripts/bundled-uncompressed/html4+html5/jquery.history';
import collapsible from './collapsible';

function goToUrl(url) {
    History.pushState({}, document.title, url);
}

/**
 * Faceted search view component
 */
export default class FacetedSearch {
    /**
     * @param {object} requestOptions - Object with options for the ajax requests
     * @param {function} callback - Function to execute after fetching templates
     * @param {object} options - Configurable options
     * @example
     *
     * let requestOptions = {
     *      templates: {
     *          productListing: 'category/product-listing',
     *          sidebar: 'category/sidebar'
     *     }
     * };
     *
     * let templatesDidLoad = function(content) {
     *     $productListingContainer.html(content.productListing);
     *     $facetedSearchContainer.html(content.sidebar);
     * };
     *
     * let facetedSearch = new FacetedSearch(requestOptions, templatesDidLoad);
     */
    constructor(requestOptions, callback, options) {

        let defaultOptions = {
           accordionToggleSelector: '#facetedSearch .accordion-navigation, #facetedSearch .facetedSearch-toggle',
           blockerSelector: '#facetedSearch .blocker',
           clearFacetSelector: '#facetedSearch .facetedSearch-clearLink',
           componentSelector: '#facetedSearch-navList',
           facetNavListSelector: '#facetedSearch .navList',
           showMoreToggleSelector: '#facetedSearch .accordion-content .toggleLink'
        };

        // Private properties
        this.requestOptions = requestOptions;
        this.callback = callback;
        this.options = _.extend({}, defaultOptions, options);
        this.collapsedFacets = [];
        this.collapsedFacetItems = [];

        // Init collapsibles
        collapsible();

        // Show limited items by default
        $(this.options.facetNavListSelector).each((index, navList) => {
            this.collapseFacetItems($(navList));
        });

        // Mark initially collapsed accordions
        $(this.options.accordionToggleSelector).each((index, accordionToggle) => {
            let $accordionToggle = $(accordionToggle),
                collapsible = $accordionToggle.data('collapsible');

            if (collapsible.isCollapsed) {
                this.collapsedFacets.push(collapsible.targetId);
            }
        });

        // Collapse all facets if initially hidden
        // NOTE: Need to execute after Collapsible gets bootstrapped
        setTimeout(() => {
            if ($(this.options.componentSelector).is(':hidden')) {
                this.collapseAllFacets();
            }
        });

        // Observe user events
        this.onStateChange = this.onStateChange.bind(this);
        this.onToggleClick = this.onToggleClick.bind(this);
        this.onAccordionToggle = this.onAccordionToggle.bind(this);
        this.onClearFacet = this.onClearFacet.bind(this);
        this.onFacetClick = this.onFacetClick.bind(this);
        this.onRangeSubmit = this.onRangeSubmit.bind(this);
        this.onSortBySubmit = this.onSortBySubmit.bind(this);

        this.bindEvents();
    }

    // Public methods
    refreshView(content) {
        if (content) {
            this.callback(content);
        }

        collapsible();

        // Restore view state
        this.restoreCollapsedFacets();
        this.restoreCollapsedFacetItems();

        // Bind events
        this.bindEvents();
    }

    updateView() {
        $(this.options.blockerSelector).show();

        api.getPage(History.getState().url, this.requestOptions, (err, content) => {
            $(this.options.blockerSelector).hide();

            if (err) {
                throw new Error(err);
            }

            // Refresh view with new content
            this.refreshView(content);
        });
    }

    expandFacetItems($navList) {
        let id = $navList.attr('id'),
            $navItems = $navList.children(),
            $toggle = $navList.next(this.showMoreToggleSelector);

        // Show all items
        $navItems.show();

        // Set toggle state
        $toggle.addClass('is-open');

        // Remove
        this.collapsedFacetItems = _.without(this.collapsedFacetItems, id);
    }

    collapseFacetItems($navList) {
        let $navItems = $navList.children(),
            $toggle = $navList.next(this.showMoreToggleSelector),
            id = $navList.attr('id'),
            itemsCount = $navItems.length,
            maxItemsCount = parseInt($navList.data('count') || 0, 10);

        $navItems.show();

        // Set toggle state
        $toggle.removeClass('is-open');

        // Show only limited number of items, hide the rest
        if (itemsCount > maxItemsCount) {
            $navItems
                .slice(maxItemsCount, itemsCount)
                .hide();

            this.collapsedFacetItems = _.union(this.collapsedFacetItems, [id]);
        } else {
            this.collapsedFacetItems = _.without(this.collapsedFacetItems, id);
        }
    }

    toggleFacetItems($navList) {
        let id = $navList.attr('id');

        // Toggle depending on `collapsed` flag
        if (_.contains(this.collapsedFacetItems, id)) {
            this.expandFacetItems($navList);

            return true;
        } else {
            this.collapseFacetItems($navList);

            return false;
        }
    }

    expandFacet($accordionToggle) {
        let collapsible = $accordionToggle.data('collapsible');

        collapsible.open();
    }

    collapseFacet($accordionToggle) {
        let collapsible = $accordionToggle.data('collapsible');

        collapsible.close();
    }

    collapseAllFacets() {
        let $accordionToggles = $(this.options.accordionToggleSelector);

        $accordionToggles.each((index, accordionToggle) => {
            let $accordionToggle = $(accordionToggle);

            this.collapseFacet($accordionToggle);
        });
    }

    expandAllFacets() {
        let $accordionToggles = $(this.options.accordionToggleSelector);

        $accordionToggles.each((index, accordionToggle) => {
            let $accordionToggle = $(accordionToggle);

            this.expandFacet($accordionToggle);
        });
    }

    // Private methods
    restoreCollapsedFacetItems() {
        let $navLists = $(this.options.facetNavListSelector);

        // Restore collapsed state for each facet
        $navLists.each((index, navList) => {
            let $navList = $(navList),
                id = $navList.attr('id'),
                shouldCollapse = _.contains(this.collapsedFacetItems, id);

            if (shouldCollapse) {
                this.collapseFacetItems($navList);
            } else {
                this.expandFacetItems($navList);
            }
        });
    }

    restoreCollapsedFacets() {
        let $accordionToggles = $(this.options.accordionToggleSelector);

        $accordionToggles.each((index, accordionToggle) => {
            let $accordionToggle = $(accordionToggle),
                collapsible = $accordionToggle.data('collapsible'),
                id = collapsible.targetId,
                shouldCollapse = _.contains(this.collapsedFacets, id);

            if (shouldCollapse) {
                this.collapseFacet($accordionToggle);
            } else {
                this.expandFacet($accordionToggle);
            }
        });
    }

    bindEvents() {
        // Clean-up
        this.unbindEvents();

        // DOM events
        $(window).on('statechange', this.onStateChange);
        $(document).on('click', this.options.showMoreToggleSelector, this.onToggleClick);
        $(document).on('toggle.collapsible', this.options.accordionToggleSelector, this.onAccordionToggle);
        $(this.options.clearFacetSelector).on('click', this.onClearFacet)

        // Hooks
        hooks.on('facetedSearch-facet-clicked', this.onFacetClick);
        hooks.on('facetedSearch-range-submitted', this.onRangeSubmit);
        hooks.on('sortBy-submitted', this.onSortBySubmit);
    }

    unbindEvents() {
        // DOM events
        $(window).off('statechange', this.onStateChange);
        $(document).off('click', this.options.showMoreToggleSelector, this.onToggleClick);
        $(document).off('toggle.collapsible', this.options.accordionToggleSelector, this.onAccordionToggle);
        $(this.options.clearFacetSelector).off('click', this.onClearFacet)

        // Hooks
        hooks.off('facetedSearch-facet-clicked', this.onFacetClick);
        hooks.off('facetedSearch-range-submitted', this.onRangeSubmit);
        hooks.off('sortBy-submitted', this.onSortBySubmit);
    }

    onClearFacet(event) {
        let $link = $(event.currentTarget),
            url = $link.attr('href');

        event.preventDefault();
        event.stopPropagation();

        // Update URL
        goToUrl(url);
    }

    onToggleClick(event) {
        let $toggle = $(event.currentTarget),
            $navList = $($toggle.attr('href'));

        // Prevent default
        event.preventDefault();

        // Toggle visible items
        this.toggleFacetItems($navList);
    }

    onFacetClick(event) {
        let $link = $(event.currentTarget),
            url = $link.attr('href');

        event.preventDefault();

        $link.toggleClass('is-selected');

        // Update URL
        goToUrl(url);
    }

    onRangeSubmit(event) {
        let url = Url.parse(location.href),
            queryParams = $(event.currentTarget).serialize();

        event.preventDefault();

        goToUrl(Url.format({ pathname: url.pathname, search: '?' + queryParams }));
    }

    onSortBySubmit(event) {
        let url = Url.parse(location.href, true),
            queryParams = $(event.currentTarget).serialize().split('=');

        url.query[queryParams[0]] = queryParams[1];
        delete url.query['page'];

        event.preventDefault();

        goToUrl(Url.format({ pathname: url.pathname, query: url.query }));
    }

    onStateChange(event) {
        this.updateView();
    }

    onAccordionToggle(event) {
        let $accordionToggle = $(event.currentTarget),
            collapsible = $accordionToggle.data('collapsible'),
            id = collapsible.targetId;

        if (collapsible.isCollapsed) {
            this.collapsedFacets = _.union(this.collapsedFacets, [id]);
        } else {
            this.collapsedFacets = _.without(this.collapsedFacets, id);
        }
    }
}

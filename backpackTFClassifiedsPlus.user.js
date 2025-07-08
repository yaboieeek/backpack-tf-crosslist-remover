// ==UserScript==
// @name         backpackTFClassifieds+
// @namespace    https://steamcommunity.com/profiles/76561198967088046
// @version      1.1.1
// @description  adds some cool features to classifieds pages
// @author       eeek
// @match        https://backpack.tf/classifieds?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=backpack.tf
// @source       https://github.com/yaboieeek/backpackTFClassifiedsPlus/
// @updateURL https://github.com/yaboieeek/backpackTFClassifiedsPlus/raw/refs/heads/main/backpackTFClassifiedsPlus.user.js
// @downloadURL https://github.com/yaboieeek/backpackTFClassifiedsPlus/raw/refs/heads/main/backpackTFClassifiedsPlus.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    class Listing{
        listingData;
        listingElement;

        constructor(listingElement, listingData) {
            this.listingData = listingData;
            this.listingElement = listingElement;

            listingElement.addEventListener('dblclick', () => this.truncateTheListing()); // cus some people would want to see some messages
        }
        //// we dont need to make a dedicated method for truncating listing messages on different types of listings
        truncateTheListing() {
            this.listingElement.querySelector('p') && this.listingElement.querySelector('p').classList.toggle('truncated');
        }

        //// r these absctract methods? I think they are
        toggleVisibility() {}
        highlight() {};

    }

    class MarketplaceListing extends Listing {
        isMarketplace;

        constructor (listingElement, listingData) {
            super(listingElement, listingData);
            this.isMarketplace = true;
            this.highlight()
        }

        toggleVisibility() {
            this.listingElement.classList.toggle('marketplace-hidden');
        }

        highlight() {
            this.listingElement.style.backgroundColor = 'rgba(255,0,0, .15)'
        }
    }

    class SpellListing extends Listing {
        isSpelled;
        constructor (listingElement, listingData) {
            super(listingElement, listingData);
            this.isSpelled = true;
            this.highlight()

        }

        toggleVisibility() {
            this.listingElement.classList.toggle('spell-hidden');
        }

        highlight() {
            this.listingElement.style.backgroundColor = 'rgba(255,135,155, .15)'
        }
    }

    class StrangeListing extends Listing {
        isStrange;
        constructor (listingElement, listingData) {
            super(listingElement, listingData);
            this.isStrange = true;
            this.highlight()
        }

        toggleVisibility() {
            this.listingElement.classList.toggle('strange-hidden');
        }

        highlight() {
            this.listingElement.style.backgroundColor = 'rgba(255,165,0, .15)'
        }
    }

    class BlockedUserListing extends Listing{
        isBlockedUserListing;
        constructor(listingElement, listingData) {
            super(listingElement, listingData);
            this.isBlockedUserListing = true;
            this.highlight();
        }

        toggleVisibility() {
            this.listingElement.classList.toggle('blocked-toggle');
        }

        highlight() {
            this.listingElement.style.backgroundColor = 'rgba(0,0,0, .1)'
        }
    }

    class ListingsFactory {
    static createListing(listingElement) {
        const listingData = listingElement.querySelector('.item').dataset;

        if (listingData.listing_price === '' ) {
            return new MarketplaceListing(listingElement, listingData);

        } else if (listingData.spell_1 && (listingData.listing_intent === 'buy')){
            return new SpellListing(listingElement, listingData);

        } else if ((listingData.listing_intent === 'buy') && ((listingData.quality_elevated) || (listingData.effect_id && listingData.quality === '11'))) {
            return new StrangeListing(listingElement, listingData);
        }

        return new Listing(listingElement, listingData);
    }
    }


    class PageControl {
        lastPage;
        currentPage;

        constructor() {
            this.initializeControls();
        }

        initializeControls() {
            //////////// Couldn't find an object with last page in it so getting it from 'go to the last page' element
            const lastPageElement = document.querySelector('.pagination').lastElementChild.querySelector('a');
            const lastPageURL = new URL(lastPageElement, window.location.origin);
            const url = new URL(window.location.href);

            const [lastPage, currentPage] = [
                +lastPageURL.searchParams.get('page'),
                +url.searchParams.get('page') || 1]; /////getting current page from url, if there's no page in url we set it as 1

            [this.lastPage, this.currentPage] = [lastPage, currentPage];

            this.setupKeyboardNavigation()
            this.addSidebars()
        }
        setupKeyboardNavigation() {
            const [LEFT, RIGHT] = ['ArrowLeft', 'ArrowRight'];
            window.addEventListener('keydown', (e) => {
                if (!e.ctrlKey) return; /// cus without control it'd not be good
                switch (e.key) {
                        ///// if u press left u go back, if u press right u go forward
                    case LEFT: {
                        this.goToPreviousPage(); break
                    }
                    case RIGHT: {
                        this.goToNextPage(); break;
                    }

                }
            })
        }
        gotoPage(page) {
            const url = new URL(window.location.href);
            url.searchParams.set('page', page);
            window.location.href = url.toString();
        }

        goToNextPage() {
            if (this.currentPage <= this.lastPage) this.gotoPage(this.currentPage + 1);
        }

        goToPreviousPage() {
            if (this.currentPage > 1) this.gotoPage(this.currentPage - 1);
        }
        scrollToListings () {
            const listingsContainer = document.querySelectorAll('.row')[1];
            //////get the position of listings on the page and scroll the window to them
            const listingsContainerOffset = listingsContainer.getBoundingClientRect().top + window.pageYOffset - 40; // 38 is header height in px but i might be wrong and i am in fact just lazy to get a proper height
            window.scrollTo({top: listingsContainerOffset});
        }

        addSidebars() {
            const [leftSidebar, rightSidebar] = [
            document.createElement('div'),
            document.createElement('div')
            ];

            leftSidebar.classList.add('sidebar', 'left-sidebar');
            rightSidebar.classList.add('sidebar', 'right-sidebar');

            // leftSidebar.innerHTML = '<span style ="position:fixed; top: 80%"></span>';
            // rightSidebar.innerHTML = '<span style ="position:fixed; top: 80%"></span>';;

            leftSidebar.addEventListener('click', () => this.goToPreviousPage());
            rightSidebar.addEventListener('click', () => this.goToNextPage());
            leftSidebar.style = `left: 0;`
            rightSidebar.style = `right: 0;`
            document.querySelector('#page-content').append(leftSidebar, rightSidebar);
        }
    }

    class ListingsFiltersControl {
        // blockedUsers = GM_getValue('blockedUsers') || []

        constructor(listings = [], scroll) {
            this.listings = listings;
            this.hidingCfg = {
                'strange_unusuals': GM_getValue('strange_unusuals')|| false,
                spells            : GM_getValue('spells')          || false,
                'mp_listings'     : GM_getValue('mp_listings')     || false,
                // 'blocked_listings': GM_getValue('blocked_listings')|| false,
                truncating       : GM_getValue('truncating')       || false,
                autoscroll       : GM_getValue('autoscroll')       || false,
        }
            this.createList();
            this.initDefaults(scroll); /// cus scroll is something from another class
            this.addRevealButtons();
        }

        createList() {
            const targetElement = document.querySelectorAll('.panel-extras')[2];
            const [toggleSelectButton, blockedUsersButton, filtersContainer] = [document.createElement('button'),document.createElement('button'), document.createElement('div')];

            toggleSelectButton.innerText = 'View settings';
            toggleSelectButton.className = 'dropdown-filters';
            filtersContainer.className = 'hidden filters-container';

            const buttons = Object.keys(this.hidingCfg).map((category, index) => {
                const categoryToString = category.replace('_', ' ');
                const finalObject = {type: 'checkbox', name: category, label: ''};
                console.log(index, category);
                finalObject.label = `Enable ${categoryToString}`;
                if (index < 3) finalObject.label = `Hide ${categoryToString}`;
                return finalObject;
            }).map((config) => {
                const [
                    inputContainer,
                    checkbox,
                    label
                ] = [
                    document.createElement('div'),
                    document.createElement('input'),
                    document.createElement('label'),
                ]
                inputContainer.className = 'checkbox-item';
                Object.assign(checkbox, {
                    type:     config.type,
                    name:     config.name,
                    id:       `filter-${config.name}`,
                    style:    `width: 1.2em`,
                    checked:  this.hidingCfg[config.name]
                });

                label.htmlFor = `filter-${config.name}`;
                label.textContent = config.label;
                label.style = 'font-weight: 500; width: calc(80% - 1.2em )';

                inputContainer.append(checkbox, label);

                checkbox.addEventListener('change', () => this.applyChanges(config.name))
                return inputContainer

            });
            const [mpCheckbox, strageCheckbox, spellCheckbox, truncateCheckbox] = buttons;


            /////// basically this one is proper toggling of dropdown element with categories
            window.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('dropdown-filters')) {
                    filtersContainer.classList.toggle('hidden')
                    return;
                };

                const isFilter = target.closest('label, input, .checkbox-item');

                if (isFilter && filtersContainer.contains(isFilter)) return;

                (isFilter === null) && filtersContainer.classList.add('hidden');
            })

            filtersContainer.append(...buttons);
            targetElement.append(toggleSelectButton, filtersContainer);

        }
        applyChanges(category) {
            GM_setValue(category, !GM_getValue(category));
            this.hidingCfg[category] = !this.hidingCfg[category];
        }
        initDefaults(scroll) {
            for (const listing of this.listings) {
                this.hidingCfg['mp_listings'] && listing.isMarketplace && listing.toggleVisibility();
                this.hidingCfg.spells && listing.isSpelled && listing.toggleVisibility();
                this.hidingCfg['strange_unusuals'] && listing.isStrange && listing.toggleVisibility();
                this.hidingCfg.truncating && listing.truncateTheListing();
            }
            this.hidingCfg.autoscroll && scroll.scrollToListings();
        }

    addRevealButtons() { //////////// it will only add buttons if certain listings appear
        //////////// not sure if it's ok but as long as it works all g
        const [mp, spell, strange] = [
            this.listings.filter(listing => listing.isMarketplace),
            this.listings.filter(listing => listing.isSpelled),
            this.listings.filter(listing => listing.isStrange)
        ];

        ////we need to place mp button on the left cus mp orders cant be buy orders
        const [sellOrderHeader, buyOrderHeader] = [
        document.querySelectorAll('.panel-heading')[1].querySelector('.panel-extras'),
        document.querySelectorAll('.panel-heading')[2].querySelector('.panel-extras'),
        ];

        const createButtons = (category, categoryName) => {
            const button = document.createElement('button');
            button.style = 'color: black; line-height: 1';

            button.innerHTML = `Toggle <b>${category.length} ${categoryName}</b> listing${category.length > 1 ? 's' : ''}`;
            button.className = 'toggle-button';

            button.addEventListener('click', () => {for (const listing of category) {listing.toggleVisibility()}});

           //append mp on the left
            if (categoryName === 'mp') {
                sellOrderHeader.append(button);
                return;
            }
            // append other buttons on the right
            buyOrderHeader.append(button);
        }
        if (mp.length >= 1)       createButtons(mp, 'mp');
        if (spell.length >= 1 )   createButtons(spell, 'spell');
        if (strange.length >= 1 ) createButtons(strange, 'strange');
    }
    }


///////// no more fancy notifications for faster navigation
    const scroll = new PageControl();

    const listings = [...document.querySelectorAll('.listing')]
    .map(listing => ListingsFactory.createListing(listing));
    new ListingsFiltersControl(listings, scroll);


    document.head.innerHTML += `<style>
    .hidden, .marketplace-hidden, .spell-hidden, .strange-hidden{
        display: none;
}
.filters-container {
    margin-top: 24px;
    border-radius: 4px;
    border: 1px solid rgba(0,0,0, .15);
    background-color: white;
    position: absolute; z-index: 999;
    width: 220px;
    padding: 4px 0;
}

.checkbox-item {
    padding: 0 12px;
    width: 100%;
    user-select: none
    }
.checkbox-item:hover {
    background-color: #54748b;
    color: white
}
.dropdown-filters{
    line-height: 1
}
.truncated {
    width: 25em;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;}

.sidebar {
    position: fixed;
    background-color: rgba(255,255,255, .01);
    top: 0;
    width: 10%;
    height: 100%;
    text-align: center;
    font-size: 96px;
    font-weight: bold;
    user-select: none;
}

.sidebar:hover {
    color: white;
    background-color: rgba(255,255,255, .3)
}
.toggle-button {
    width: max-content;
}
footer {
    position: relative;
    z-index: 1
}
.panel-heading {
    flex-direction: column !important
}
.panel-extras {
    flex-flow: end;
    font-size: 13px !important;
    color: black;display: flex; flex-flow: row-reverse
}
</style>`

const importantStuff = 'https://youtu.be/YWyHZNBz6FE?si=nPqzkUKc3kCtJQ2Z';
})();

// ==UserScript==
// @name         backpackTFClassifieds+
// @namespace    https://steamcommunity.com/profiles/76561198967088046
// @version      1.3.0
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
    // GM_setValue('blockedUsers', []);  // <----- BLOCKED-USERS-RESET (uncomment, run the script, comment)
    class DarkMode {
        isDarkmode;

        constructor() {
            this.isDarkmode = GM_getValue('isDarkmode') || false;
            this.bodyElement = document.querySelector('body.app-440');
            this.isDarkmode && this.bodyElement.classList.toggle('dark-mode');
            // this.createTheToggler();
        }
        createTheToggler() {
            const targetElement = document.querySelector('#main-navbar .navbar-right');
            const button = document.createElement('button');
            button.innerText = this.isDarkmode ? '🌑' : '🌞' ;
            button.style = 'line-height: 1; height: 40px; width: 60px; padding: 0;';
            targetElement.append(button);
            button.addEventListener('click', () => {
                this.changeTheScheme();
                this.updateButtonState(button);
            });
        }
        changeTheScheme() {
            this.isDarkmode = !this.isDarkmode;
            GM_setValue('isDarkmode', this.isDarkmode);
            this.bodyElement.classList.toggle('dark-mode');
        }
        updateButtonState(button) {
            button.innerText = this.isDarkmode ? '🌑' : '🌞' ;
        }

    }


    class Listing{
        listingData;
        listingElement;

        constructor(listingElement, listingData) {
            this.listingData = listingData;
            this.listingElement = listingElement;
            this.addBlockStateButton();
            this.listingElement.addEventListener('dblclick', () => this.truncateTheListing()); // cus some people would want to see some messages
        }
        //// we dont need to make a dedicated method for truncating listing messages on different types of listings
        truncateTheListing() {
            this.listingElement.querySelector('p') && this.listingElement.querySelector('p').classList.toggle('truncated');
        }
        //// for some reason can't just be clicked smh my head, time element is initializing
        toggleDateTime() {
            this.listingElement.querySelector('.data1').style = 'display: none';
            this.listingElement.querySelector('.data2').style = 'display: inline';
        }

        addBlockStateButton() {
            const userNameContainer = this.listingElement.querySelector('.user-handle');
            const blockButton = document.createElement('button');

            blockButton.innerText = 'Block';
            blockButton.title  = `Block ${this.listingData.listing_name}?`;
            blockButton.className = 'block-name-button';

            blockButton.addEventListener('click', (e) => {
                this.showConfirmationModal(blockButton);
            });
            userNameContainer.append(blockButton);
        }

        ////we can block any user we see, so declaring these block features in parent class
        blockUser(userName, userId) {
            const blockedUsers = GM_getValue('blockedUsers') || [];
            console.log(blockedUsers);
            GM_setValue('blockedUsers', [...blockedUsers, {userName: userName, id: userId}])
        }

        unblockUser(userID){
           const blockedUsers = GM_getValue('blockedUsers') || [];
            GM_setValue('blockedUsers', blockedUsers.filter(user => user.id !== userID));
        }

        showConfirmationModal(blockButton) {
            const userName = this.listingData.listing_name;
            const [confirmationContainer,
                   buttonsContainer,
                   confirmButton,
                   cancelButton] = [document.createElement('div'), document.createElement('div'), document.createElement('button'), document.createElement('button')];

            confirmationContainer.classList.add('block-user-modal');
            buttonsContainer.className = 'block-buttons-container';
            confirmButton.classList.add('confirm-button', 'block-button');
            cancelButton.classList.add('cancel-button', 'block-button');
            confirmationContainer.innerHTML = `<span>Block this user?</span>`;
            buttonsContainer.append(confirmButton, cancelButton);

            confirmationContainer.append(buttonsContainer);
            this.listingElement.querySelector('.click-data-toggle').append(confirmationContainer);
            confirmButton.innerText = 'Block';
            cancelButton.innerText = 'Cancel';

            confirmButton.addEventListener('click', () => {
                this.blockUser(userName, this.listingData.listing_account_id);
                window.location.reload();
            });
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.preventPropagation();
                this.destroyTheModal(confirmationContainer);}
                                         );

            window.addEventListener('click', (e) => {
               (e.target !== blockButton) && this.destroyTheModal(confirmationContainer);
            })

        }
        destroyTheModal(modal) {
            modal.remove()
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
            this.listingElement.classList.toggle('blocked-hidden');
        }

        highlight() {
            this.listingElement.style.backgroundColor = 'rgba(0,0,0, .1)'
        }
        ////since the logic for blocked user changes, we are redeclaring methods and block/unblock logic
        addBlockStateButton() {
            const userNameContainer = this.listingElement.querySelector('.user-handle');
            const blockButton = document.createElement('button');

            blockButton.innerText = 'Unblock';
            blockButton.title = `Unblock ${this.listingData.listing_name}?`;
            blockButton.className = 'block-name-button';

            blockButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showConfirmationModal(blockButton);
            });
            userNameContainer.append(blockButton);
        }

        showConfirmationModal(blockButton) {
            ///this is too messy, will clean it up eventually
            const userName = this.listingData.listing_name;
            const [confirmationContainer,
                   buttonsContainer,
                   confirmButton,
                   cancelButton] = [document.createElement('div'), document.createElement('div'), document.createElement('button'), document.createElement('button')];

            confirmationContainer.classList.add('block-user-modal');
            buttonsContainer.className = 'block-buttons-container';
            confirmButton.classList.add('confirm-button', 'block-button');
            cancelButton.classList.add('cancel-button', 'block-button');
            confirmationContainer.innerHTML = `<span>Unblock this user?</span>`;
            buttonsContainer.append(confirmButton, cancelButton);

            confirmationContainer.append(buttonsContainer);
            this.listingElement.querySelector('.click-data-toggle').append(confirmationContainer);
            confirmButton.innerText = 'Unblock';
            cancelButton.innerText = 'Cancel';

            confirmButton.addEventListener('click', () => {
                this.unblockUser(this.listingData.listing_account_id); ///// unblocking user instead of blocking, because he already is in a blocklist
                window.location.reload();
            });
            cancelButton.addEventListener('click', () => this.destroyTheModal(confirmationContainer));

            window.addEventListener('click', (e) => {
               (e.target !== blockButton) && this.destroyTheModal(confirmationContainer);
            })
        }
    }

    class ListingsFactory {
    static blockedUsersArray = GM_getValue('blockedUsers') || [];
    static createListing(listingElement) {
        const listingData = listingElement.querySelector('.item').dataset;
        if (listingData.listing_price === '' ) {
            return new MarketplaceListing(listingElement, listingData);

        } else if (listingData.spell_1 && (listingData.listing_intent === 'buy')){
            return new SpellListing(listingElement, listingData);

        } else if ((listingData.listing_intent === 'buy') && ((listingData.quality_elevated) || (listingData.effect_id && listingData.quality === '11'))) {
            return new StrangeListing(listingElement, listingData);
        } else if (ListingsFactory.blockedUsersArray.some(userData => userData.id === listingData.listing_account_id)) {
            return new BlockedUserListing(listingElement, listingData);
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
        blockedUsers = GM_getValue('blockedUsers') || [];
        firstHeaderIndex = 0;
        secondHeaderIndex = 1;

        constructor(listings = [], scroll) {
            this.listings = listings;
            this.hidingCfg = {
                strange_unusuals : GM_getValue('strange_unusuals')|| false,
                spells           : GM_getValue('spells')          || false,
                mp_listings      : GM_getValue('mp_listings')     || false,
                truncating       : GM_getValue('truncating')      || false,
                bump_to_listed   : GM_getValue('bump_to_listed')      || false,
                autoscroll       : GM_getValue('autoscroll')      || false,
                'blocked_users': GM_getValue('blocked_users')|| false,
        }


            this.firstHeaderIndex = document.querySelectorAll('.panel-extras')[0].parentElement.innerText === 'Advertisement' ? 1 : 0;

            this.secondHeaderIndex = this.firstHeaderIndex + 1;
            this.createList();
            this.initDefaults(scroll); /// cus scroll is something from another class
            this.addRevealButtons();
        }

        createList() {
            const targetElement = document.querySelectorAll('.panel-extras')[this.secondHeaderIndex];

            const [toggleSelectButton, blockedUsersButton, filtersContainer] = [document.createElement('button'),document.createElement('button'), document.createElement('div')];

            toggleSelectButton.innerText = 'View settings';
            toggleSelectButton.className = 'dropdown-filters';
            filtersContainer.className = 'hidden filters-container';
            const buttonsLength = Object.keys(this.hidingCfg).length;
            const buttons = Object.keys(this.hidingCfg).slice(0, buttonsLength - 1).map((category, index) => {
                const categoryToString = category.replace(/_/g, ' ');
                const finalObject = {type: 'checkbox', name: category, label: ''};
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
                this.hidingCfg.mp_listings && listing.isMarketplace && listing.toggleVisibility();
                this.hidingCfg.spells && listing.isSpelled && listing.toggleVisibility();
                this.hidingCfg.strange_unusuals && listing.isStrange && listing.toggleVisibility();
                this.hidingCfg.bump_to_listed && listing.toggleDateTime();
                this.hidingCfg.truncating && listing.truncateTheListing();
                listing.isBlockedUserListing && listing.toggleVisibility();
            }
            this.hidingCfg.autoscroll && scroll.scrollToListings();
        }

    addRevealButtons() { //////////// it will only add buttons if certain listings appear
        //////////// not sure if it's ok but as long as it works all g
        const [mp, spell, strange, blocked] = [
            this.listings.filter(listing => listing.isMarketplace),
            this.listings.filter(listing => listing.isSpelled),
            this.listings.filter(listing => listing.isStrange),
            this.listings.filter(listing => listing.isBlockedUserListing),
        ];

        ////we need to place mp button on the left cus mp orders cant be buy orders
        const [sellOrderHeader, buyOrderHeader] = [
        document.querySelectorAll('.panel-heading')[this.firstHeaderIndex].querySelector('.panel-extras'),
        document.querySelectorAll('.panel-heading')[this.secondHeaderIndex].querySelector('.panel-extras'),
        ];

        const createButtons = (category, categoryName) => {
            const button = document.createElement('button');
            button.style = 'color: black; line-height: 1';

            button.innerHTML = `Toggle <b>${category.length} ${categoryName}</b> listing${category.length > 1 ? 's' : ''}`;
            button.className = 'toggle-button';

            button.addEventListener('click', () => {for (const listing of category) {listing.toggleVisibility()}});

           //append mp on the left
            if (['mp', 'blocked'].includes(categoryName)) {
                sellOrderHeader.append(button);
                return;
            }
            // append other buttons on the right
            buyOrderHeader.append(button);
        }
        if (mp.length >= 1)       createButtons(mp, 'mp');
        if (spell.length >= 1 )   createButtons(spell, 'spell');
        if (strange.length >= 1 ) createButtons(strange, 'strange');
        if (blocked.length >= 1 ) createButtons(blocked, 'blocked');
     }
    }


///////// no more fancy notifications for faster navigation
    const scroll = new PageControl();
    new DarkMode();
    const listings = [...document.querySelectorAll('.listing')]
    .map(listing => ListingsFactory.createListing(listing));
    new ListingsFiltersControl(listings, scroll);

    const darkModeStyle = document.createElement('style');
    darkModeStyle.innerHTML =
        `
        .dark-mode {

            background: #111 !important;
            border-color: transparent !important;
            & .app-440 .navbar-fixed-top, .app-440 .navbar-fixed-top .navbar-header {
                background: black !important;
            }
            & .panel-body {
                background: #151515 !important;
                color: #ccd !important
            }

            & .modal-content, .modal-footer {
                background-color: #111 !important;
            }

            & .listing   {
                padding: 6px 12px !important;
                background-color: #222 !important;
                & .listing-body{
                    & .listing-header {
                        border-bottom: 1px solid #2b2b2b;
                    }
                }
                & h5 {
                    font-size: 15px;
                    color: #ddd
                    }
                & .quote-box {
                    background-color: #333;
                    color: #ddd;
                    border-color: transparent
                }
            }

            & .dropdown-menu {
                background: #333 !important;
            }
            & li > a {
                color: white !important
            }
            & .form-control {
                background-color: #2d2d2d;
                color: #bbb;
                border-width: 0;
            }
            & .btn-default {
                border: none;
                color: #a7a7a7;
                background-color: #343434;

                & :hover {
                    filter: brightness(1.2) !important;
                }
            }

            & .panel-filter  {
                border: none;
                & .panel-heading .panel-title {
                    color: #ddd;
                    background: #222;
                }

            }
            &.pagination > li > a, .pagination .disabled a {
                background: black !important;
                border-color: #555 !important;
            }
            & .well {
                background-color: black
            }
            & #search-crumbs .btn-default {
                margin-bottom: 4px;
            }
            & .awesome3 {
                color: #888 !important
            }
        }
        `
    // document.head.append(darkModeStyle);
    document.head.innerHTML += `<style>
:root {
    --bg-black: #000;
    --bg-dark: #202020;
    --bg-darker: #111111;
    --bg-darkest: #010101;
    --white: white;
    --light: #777;
    --lightest: #cdd;
    --quote-color: #c0c0c0;
}
    .hidden, .marketplace-hidden, .spell-hidden, .strange-hidden, .blocked-hidden{
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
    width: 24em;
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
.block-user-modal {
    cursor: default;
    display: flex;
    flex-direction: column;
      color: #444;
      font-size: 20px;
      position: absolute;
      height: 100px;
      width: 200px;
      background: white;
      transform: translateX(50%);
      z-index: 999;
      border: 1px solid rgba(0,0,0,.1);
      border-radius: 5px;
      text-align: center;
}

.block-buttons-container {
    display: flex;
    margin-top: auto;
    width: 100%;
    padding: 12px 0;
    justify-content: space-around;


}


.block-button {
    color: white;
    border-radius: 4px;
    width: 40%; height: 40px;
    text-justify: center;
    font-size: 20px;
    border: none;

    &:hover {
        filter: brightness(1.75);
        color: black
    }
}

.confirm-button {
    background: #840000;
}

.cancel-button {
     border: 4px solid rgba(0,0,0,.15);
     background: transparent;
     color: #bbb;
}
.block-name-button {
    margin-left: 2px;
    border: 1px solid rgba(0,0,0,.15);
    border-radius: 2px;
    font-size: 10px;
    background: transparent;

}
}
</style>`

const importantStuff = 'https://youtu.be/YWyHZNBz6FE?si=nPqzkUKc3kCtJQ2Z';
})();

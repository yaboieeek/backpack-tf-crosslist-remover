// ==UserScript==
// @name         backpackTFClassifieds+
// @namespace    https://steamcommunity.com/profiles/76561198967088046
// @version      1.5.1
// @description  adds some cool features to classifieds pages
// @author       eeek
// @match        https://backpack.tf/classifieds?*
// @match        https://backpack.tf/stats/*
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
            this.highlight();
            this.makeTheNameClickable();
        }

        toggleVisibility() {
            this.listingElement.classList.toggle('strange-hidden');
        }

        highlight() {
            this.listingElement.style.backgroundColor = 'rgba(255,165,0, .15)'
        }

        makeTheNameClickable() {
            if (this.listingData.quality !== '5') return;
            const title = this.listingElement.querySelector('.listing-title');
            title.classList.add('clickable-name');
            title.title = 'Redirect to Non-Strange unusual';
            title.addEventListener('click', () => {
                window.open(`https://backpack.tf/stats/Unusual/${encodeURIComponent(this.listingData.name)}/Tradable/Craftable/${encodeURIComponent(this.listingData?.effect_id ?? '')}`);
            })
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

    class initializeStatPage {
        ///Storing image data as a string because holy shit that looks cool (the idea is taken from steamdetective :P)
        sites = [
            {
                baseLink: 'https://marketplace.tf/items/tf2/',
                siteName: 'Marketplace.tf',
                siteIcon: '/images/marketplace-medium.png?v=2'
            },
            {
                baseLink: 'https://stntrading.eu/item/tf2/Unusual+',
                siteName: 'STN.tf',
                siteIcon:'data:image/jpeg;base64,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'
            },
            {
                baseLink: 'https://mannco.store/item/440-',
                siteName: 'Mannco.store',
                siteIcon: 'data:image/png;base64,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'
            },
            {
                baseLink: 'https://gladiator.tf/sales?item=',
                siteName: 'Gladiator.tf',
                siteIcon: 'data:image/png;base64,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'
            },

        ];
        itemData;
        hasMpLink;
        constructor() {
            this.itemData = document.querySelector('.stats-header-item > .item').dataset;
            this.itemNameElement = document.querySelector('.stats-header-title');
            this.hasMpLink = !!document.querySelector('.price-boxes a[title*="Marketplace"], .price-boxes a[data-original-title*="Marketplace"]');
            console.log(this.hasMpLink);
            this.magicalButtonThatAllowsUsToGoToTheUnusualPageOnAStrangeUnusual();
            this.makeButtonsAndAppend(this.sites, this.itemData);
        }

        magicalButtonThatAllowsUsToGoToTheUnusualPageOnAStrangeUnusual() {
            if (!this.itemNameElement.innerText.toLowerCase().includes('strange')) return;

            this.itemNameElement.classList.add('clickable-name');
            this.itemNameElement.title = 'Redirect to Non-Strange unusual';
            this.itemNameElement.addEventListener('click', () => {window.location.href = window.location.href.replace('Strange%20', '')})
        }

        generateSiteButton(siteData, itemData) {
            const buttonHTML = `
            <div class="icon">
                <img src="${siteData.siteIcon}" alt="${siteData.siteName} icon" style="border-radius: 5px;padding: 0;margin-top: -5px;">
                    </div>
                    <div class="text">
                    <div class="value" style = 'font-size: 12px'>
                        View this item on
                    </div>
                    <div class="subtitle" style = 'font-size: 18px; font-weight: bold; color: #666 '>
                        ${siteData.siteName}
                    </div>
                </div>
            ` ///////// because why would i reinvent the bicycle
            const link = document.createElement('a');
            link.className = 'price-box';
            link.dataset.tip = 'top';
            link.title = siteData.siteName;
            link.href = this.generateSiteLink(siteData, itemData);
            link.target = 'blank';
            link.innerHTML = buttonHTML;
            return link;
        }

        generateSiteLink({baseLink, siteName}, {name, effect_name = ''}) {
            let link = baseLink;
            switch(siteName) {
                case 'STN.tf': {
                    link += effect_name.split(' ').join('+') + '+' + name.split(' ').join('+');
                    break;
                }
                case 'Mannco.store': {
                    link += effect_name.replace(/['!]/g, '').split(' ').join('-') + '-unusual-' + name.split(' ').join('-');
                    break;
                }
                case 'Gladiator.tf': {
                    link += effect_name + ' ' + name;
                    break;
                }
                 default: {
                     link += effect_name +' ' + name;
                     break;
                 }
            }
            console.log(link);
            return link;
        }
        makeButtonsAndAppend(sitesDataArray = [], itemData) {
            console.log(!!itemData.effect_name);
            if (sitesDataArray === []) return;
            if (!itemData.effect_name) return;
            const buttons = sitesDataArray
            .filter(siteData => !(this.hasMpLink && siteData.siteName === 'Marketplace.tf'))
            .map(siteData => {
               return this.generateSiteButton(siteData, itemData);
            });
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style = 'width: 100%; height: min-content';
            buttonsContainer.append(...buttons);

            document.querySelector('.price-boxes').append(buttonsContainer);
        }
    }

///////// initialize the classifieds part
    if (window.location.href.match(/https:\/\/backpack\.tf\/classifieds\?*/)) {
        const scroll = new PageControl();
        new DarkMode();
        const listings = [...document.querySelectorAll('.listing')]
        .map(listing => ListingsFactory.createListing(listing));
        new ListingsFiltersControl(listings, scroll);
    }

///////// initialize the stats part
    if (window.location.href.match(/^https:\/\/backpack\.tf\/stats\/?.*$/)) {
        new initializeStatPage();
    }

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

.clickable-name {
    cursor: pointer;
    padding: 0.2em;
    &:hover {
        background: linear-gradient(to right, rgba(207, 106, 50, .3),rgba(88, 52, 113, .4)  40% );
        border-radius: 0.5em;
    }
}
}
</style>`

const importantStuff = 'https://youtu.be/YWyHZNBz6FE?si=nPqzkUKc3kCtJQ2Z';
})();

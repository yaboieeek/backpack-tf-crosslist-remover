// ==UserScript==
// @name         backpack.tf crosslist remover
// @namespace    https://steamcommunity.com/profiles/76561198967088046
// @version      1.0.0
// @description  removes crosslistings
// @author       eeek
// @match        https://backpack.tf/classifieds?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=backpack.tf
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    const NOTIFICATIONS_ENABLED = true, HIGHLIGHT = true; // disable notifications/mp crosslist highlight

    //////////// this for fancy notifications
    const iziToastCDN = document.createElement('script');
    iziToastCDN.src = 'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/js/iziToast.min.js';
    iziToastCDN.integrity = 'sha512-Zq9o+E00xhhR/7vJ49mxFNJ0KQw1E1TMWkPTxrWcnpfEFDEXgUiwJHIKit93EW/XxE31HSI5GEOW06G6BF1AtA==';
    iziToastCDN.crossOrigin = 'anonymous';
    iziToastCDN.referrerPolicy = 'no-referrer';
    const iziCSS = document.createElement('link');
    iziCSS.rel = 'stylesheet';
    iziCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/izitoast/1.4.0/css/iziToast.min.css';
    document.head.append(iziToastCDN, iziCSS);
    ////////////


    class ListingsManager {
        listings = [];
        hideListingsByDefault = GM_getValue('hideMP') || false;
        hidden;
        controlButton;

        constructor() {

            this.hidden = this.hideListingsByDefault;
            console.log('Hiding listings by default: ' + this.hideListingsByDefault +
                        '\nHiding status: ' + this.hidden);
            this.initListings();
        }

        initListings() {
            this.listings = [...document.querySelectorAll('.listing')]
                .map(element => new Listing(element))
                .filter(listing => listing.isMarketplace);

            if (this.listings.length === 0) {
                if (!NOTIFICATIONS_ENABLED) return;

                iziToast.show({
                    message: 'No <b>MP listings</b> on this page',
                    timeout: 1500,
                    escapeHTML: false
                })
                return;
            };
            console.log(this.listings.length);

            this.createControlButtons();
            this.hidden && this.toggleMpListingsVisibility();
            console.log('Initialization listings status: ' + this.hidden);
        }

        toggleMpListingsVisibility() {
            this.listings.forEach(listing => listing.toggleVisibility());
            console.log('Listings hidden status: ' + this.hidden)

        }

        createControlButtons() {
            const controlButton = document.createElement('button');
            const lockSelectionButton = document.createElement('button');

            this.controlButton = controlButton;

            controlButton.innerText = `${this.hidden ? 'Show' : 'Hide'} ${this.listings.length} mp listings`;

            lockSelectionButton.innerText = '🔒'
            lockSelectionButton.title = 'Lock current mp listings state'; /// idk i think lock button is a hell yeah

            Object.assign(controlButton.style,{
                color: 'black',
                'line-height': '1em',
                padding: '2px 10px'
            });

            Object.assign(lockSelectionButton.style,{
                'background-color': 'transparent',
                border: 'none',
                'line-height': '1em',
            });



            controlButton.addEventListener('click', () => {
                this.toggleMpListingsVisibility();
                this.updateButtonState(controlButton);
            });

            lockSelectionButton.addEventListener('click', () => this.lockSelection())
            document.querySelectorAll('.panel-heading')[1].querySelector('.panel-extras').append(lockSelectionButton, controlButton);


        }
        updateButtonState(button) {
            this.hidden = !this.hidden; // i have no damn clue why it only works if placed here, i mean i do but i dont

            const text = `${this.hidden ? 'Show' : 'Hide'} ${this.listings.length} mp listings`;
            button.innerText = text;
        }

        lockSelection() {
            GM_setValue('hideMP', this.hidden);
            iziToast.info({
                message: `Locked the <b style='color: green'>${this.hidden ? 'hide' : 'show'} mp listings</b> status. Enjoy!`,
                escapeHTML: false,
                timeout: 2000
            });
        }
    }
/////////// I heard using classes is a good practice so here we are. Maybe in the future I'll add new features and afaik it's much easier to do with classes
    class Listing{
        listingData;
        element;
        isMarketplace = false;

        constructor(listing) {
            this.listingData = listing.querySelector('.item').dataset;
            this.element = listing;

            this.isMarketplace = this.listingData.listing_price === '';

            this.highlightMPListing();
        }

        toggleVisibility() {
            const isVisible = this.element.style.display !== 'none';

            isVisible ?
                this.element.style.display = 'none'
              : this.element.style.display = 'block';
        }

        highlightMPListing() {
            // I've decided to highlight mp crosslists, but if you dont want that, change the HIGHLIGHT in the beggining to false

            HIGHLIGHT && this.isMarketplace && (this.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)')
        }
    }
///////// Wait for fancy notifications to load and then initialize ListingsManager
  iziToastCDN.onload = () => {
    new ListingsManager();
}


})();

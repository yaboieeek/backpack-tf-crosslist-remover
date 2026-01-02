// ==UserScript==
// @name         NextTF+
// @namespace    eeek
// @version      0.1.0
// @description  bugfixes and apparently new features
// @author       eeek
// @match        https://next.backpack.tf/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=backpack.tf
// @grant        none
// ==/UserScript==


class EventsBus {
    constructor() {
        this.handlers = {};
    }

    emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(callback => callback(data));
        }
    }

    on(event, callback) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(callback);
    }
}

class SessionStorageController {
    static setItem(itemName, pageNumber) {
        const hash = hashItemName(itemName);
        const key = `${hash}`;
        sessionStorage.setItem(key, JSON.stringify({currentPage: pageNumber}));
        return hash;
    }

    static getItem(itemName) {
        const key = `${hashItemName(itemName)}`;
        console.log(`Looking for ${key}...`);
        return JSON.parse(sessionStorage.getItem(key))?.currentPage;
    }
}


class LocationController {
    constructor(events) {
        this.events = events;
    }

    setupObserver() {
        const originalNavigate = window.$nuxt.$router.push;
        const self = this;

        window.$nuxt.$router.push = function(location) {
            originalNavigate.call(this, location);
            return self.events.emit('url_change', location);
        };

        return this
    }
}


class App {
    init() {
        const events = new EventsBus();
        const locationController = new LocationController(events).setupObserver();
        if (window.location.toString().match(/snapshots\/[^\/]+$/)) this.initializeSnapshots();

        events.on('url_change', (data) => {
            if (!data?.path) return;
            if (data.path.includes('snapshots')) this.initializeSnapshots(data);
            console.log(`Redirected to ${data.path}`);
        })

        window.addEventListener('popstate', (e) => {
            if (window.location.toString().match(/snapshots\/[^\/]+$/)) this.initializeSnapshots();
        })

    }
    initializeSnapshots(data = null) {
        const checkPaginator = () => {
            const paginator = document.querySelector('.p-paginator')?.__vue__;

            if (!paginator) {
                console.log('Can\'t find the paginator, waiting 500 ms');
                setTimeout(checkPaginator, 500);
                return;
            }

            const itemName = this.getItemName(data);
            console.log(`Initializing item: ${itemName}`);

            const savedData = SessionStorageController.getItem(itemName);
            console.log(savedData);
            if (savedData !== undefined && savedData !== 0) {
                console.log(`Restoring page #${savedData} for ${itemName}`);

                paginator.changePage(savedData);
                window.changePage = (page) => paginator.changePage(page);
                if (savedData !== paginator.page) {
                    setTimeout(checkPaginator, 500);
                    return;
                }

            } else {
                console.log(`No saved data for ${itemName}...`);
                const initialPage = 0;
                SessionStorageController.setItem(itemName, initialPage);
            }

            this.setupSnapshotsPageController(itemName, paginator);
        };

        checkPaginator();
    }

    setupSnapshotsPageController(itemName, paginator) {
        paginator.$on('page', (data) => {
            console.log('Viewing snapshots page #' + (+data.page + 1));
            SessionStorageController.setItem(itemName, data.page);
        })

    }

    getItemName(data = null) {
        if (!data) {
            const pathname = window.location.pathname;
            const rawItemName = pathname.replace('/classifieds/snapshots/', '');
            return decodeURIComponent(rawItemName);
        } else {
            return data.params?.id || data.path?.replace('/classifieds/snapshots/', '');
        }
    }
}

new App().init();

function hashItemName(str) { // saves some space
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}





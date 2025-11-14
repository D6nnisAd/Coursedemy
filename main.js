document.addEventListener('DOMContentLoaded', () => {
    
    // --- CURRENCY CONVERSION ---
    const getGeoAndConvert = async () => {
        // Base prices in NGN
        const BASE_PRICE_NGN = 30000;
        const ACTUAL_VALUE_NGN = 200000;

        // Elements to update
        const elements = {
            priceNote: document.getElementById('price-note'),
            actualValueHero: document.getElementById('actual-value-hero'),
            todaysFeeHero: document.getElementById('todays-fee-hero'),
            actualValuePricing: document.getElementById('actual-value-pricing'),
            accessFeePricing: document.getElementById('access-fee-pricing'),
        };

        const updateDomPrices = (price, actualValue, currency, locale) => {
            try {
                const formatOptions = {
                    style: 'currency',
                    currency: currency,
                    maximumFractionDigits: 0,
                };
                
                const formattedPrice = new Intl.NumberFormat(locale, formatOptions).format(price);
                const formattedActualValue = new Intl.NumberFormat(locale, formatOptions).format(actualValue);

                if (elements.priceNote) elements.priceNote.innerText = formattedPrice;
                if (elements.actualValueHero) elements.actualValueHero.innerText = formattedActualValue;
                if (elements.todaysFeeHero) elements.todaysFeeHero.innerText = formattedPrice;
                if (elements.actualValuePricing) elements.actualValuePricing.innerText = formattedActualValue;
                if (elements.accessFeePricing) elements.accessFeePricing.innerText = formattedPrice;
            } catch(e) {
                console.error(`Could not format currency ${currency}`, e);
            }
        };

        try {
            const geoResponse = await fetch('https://ip-api.com/json/?fields=status,countryCode,currency');
            if (!geoResponse.ok) {
                console.warn('Geolocation API failed. Prices will remain in NGN.');
                return;
            }
            
            const geoData = await geoResponse.json();
            // If geo lookup is successful and currency is not NGN, then attempt to convert.
            if (geoData.status === 'success' && geoData.currency && geoData.currency !== 'NGN') {
                const userCurrency = geoData.currency;
                const userLocale = `en-${geoData.countryCode}`;

                const ratesResponse = await fetch('https://open.er-api.com/v6/latest/NGN');
                if (!ratesResponse.ok) {
                    console.error('Failed to fetch exchange rates. Prices will remain in NGN.');
                    return;
                }

                const ratesData = await ratesResponse.json();
                const rates = ratesData.rates;
                const conversionRate = rates[userCurrency];
                
                if (conversionRate) {
                    const convertedPrice = BASE_PRICE_NGN * conversionRate;
                    const convertedActualValue = ACTUAL_VALUE_NGN * conversionRate;
                    updateDomPrices(convertedPrice, convertedActualValue, userCurrency, userLocale);
                } else {
                    console.warn(`Currency '${userCurrency}' not found in rates. Prices will remain in NGN.`);
                }
            }
        } catch (error) {
            console.error('Error during currency conversion process:', error);
        }
    };

    getGeoAndConvert();

    // --- THEME TOGGLE ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const applyTheme = (theme) => {
        body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        const icon = themeToggle.querySelector('i');
        if (theme === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    };

    themeToggle.addEventListener('click', () => {
        const newTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Load initial theme based on saved preference or system setting
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersLight) {
        applyTheme('light');
    } else {
        applyTheme('dark'); // Default to dark
    }
});
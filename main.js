document.addEventListener('DOMContentLoaded', () => {
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
                maximumFractionDigits: 0, // No decimals for cleaner display
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

    const getGeoAndConvert = async () => {
        let userCurrency = 'USD'; // Default to USD
        let userLocale = 'en-US';

        try {
            const geoResponse = await fetch('https://ip-api.com/json/?fields=status,countryCode,currency');
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData.status === 'success' && geoData.currency) {
                    userCurrency = geoData.currency;
                    userLocale = `en-${geoData.countryCode}`; // Simple locale generation
                }
            }
        } catch (error) {
            console.warn('Geolocation API failed. Defaulting to USD.', error);
        }

        try {
            const ratesResponse = await fetch('https://open.er-api.com/v6/latest/NGN');
            if (!ratesResponse.ok) {
                console.error('Failed to fetch exchange rates. Prices will remain in NGN.');
                return;
            }

            const ratesData = await ratesResponse.json();
            const rates = ratesData.rates;

            let finalCurrency = userCurrency;
            let finalLocale = userLocale;
            let conversionRate = rates[userCurrency];

            // If user's currency is not in the rates list, fallback to USD
            if (!conversionRate) {
                console.warn(`Currency '${userCurrency}' not found in rates. Falling back to USD.`);
                finalCurrency = 'USD';
                finalLocale = 'en-US';
                conversionRate = rates['USD'];
            }
            
            // If even USD is not available, we can't do much.
            if (!conversionRate) {
                 console.error('USD conversion rate not available. Prices will remain in NGN.');
                 return;
            }

            const convertedPrice = BASE_PRICE_NGN * conversionRate;
            const convertedActualValue = ACTUAL_VALUE_NGN * conversionRate;

            updateDomPrices(convertedPrice, convertedActualValue, finalCurrency, finalLocale);

        } catch (error) {
            console.error('Error during currency conversion process:', error);
            // Final fallback: leave prices in NGN if anything goes wrong.
        }
    };

    getGeoAndConvert();
});
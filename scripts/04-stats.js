(() => {
    const GOATCOUNTER_CODE = 'cosmicshin';

    const LIVE_SITES = ['cosmicshin.netlify.app'];
    if (!LIVE_SITES.includes(location.hostname)) return;

    const counter = document.createElement('script');
    counter.async = true;
    counter.src = 'https://gc.zgo.at/count.js';
    counter.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    document.body.append(counter);
})();

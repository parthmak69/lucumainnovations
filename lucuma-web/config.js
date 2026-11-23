(function () {
    const isProduction =
        window.location.hostname === 'docs.lucumainnovations.com';

    const configFile = isProduction
        ? '/config.production.js'
        : '/config.development.js';

    document.write(
        '<script src="' + configFile + '"></' + 'script>'
    );
})();
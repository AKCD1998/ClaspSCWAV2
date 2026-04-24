(function () {
  if (window.google && window.google.script && window.google.script.run) return;

  function createRunner() {
    let successHandler = null;
    let failureHandler = null;

    const runner = {
      withSuccessHandler(handler) {
        successHandler = handler;
        return proxy;
      },
      withFailureHandler(handler) {
        failureHandler = handler;
        return proxy;
      }
    };

    const proxy = new Proxy(runner, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return function () {
          const name = String(prop);
          console.warn(`[local mock] google.script.run.${name}()`);

          setTimeout(() => {
            try {
              if (name === 'getReport1011Html') {
                successHandler && successHandler('<!doctype html><html><body><h1>Local mock: report1011</h1></body></html>');
              } else if (name === 'getRx1011Html') {
                successHandler && successHandler('<!doctype html><html><body><h1>Local mock: rx1011</h1></body></html>');
              } else if (name === 'generateReport') {
                successHandler && successHandler({ url: 'about:blank' });
              } else {
                successHandler && successHandler(null);
              }
            } catch (err) {
              failureHandler && failureHandler(err);
            }
          }, 0);

          return proxy;
        };
      }
    });

    return proxy;
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = createRunner();
})();

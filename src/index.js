import lampix from '@lampix/core';
import lampixDOM from '@lampix/dom';

(() => {
  const watchers = {}; // watchers list grouped by page
  const config = {
    // app config, default values
    depthClassifierParams: {
      frames_until_stable: 7
    },
    turretsMaxHeight: {
      Tazer: 30,
      Laser: 40,
      Missile: 60,
      Mortar: 90
    }
  };
  let observer = null; // Mutation Observer on HTML pages nodes
  let info = {}; // Lampix info

  // shortcuts
  const $$ = document.querySelectorAll.bind(document);
  const $ = document.querySelector.bind(document);

  // update watchers on page change
  const addPageObserver = () => {
    const options = {
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: true
    };

    const callback = mutations => {
      mutations.forEach(mutation => {
        const id = mutation.target.getAttribute('id').replace('pages-', '');
        const style = mutation.target.getAttribute('style');

        if (style.indexOf('block') > 0) {
          updateWatchers(id);
        }
      });
    };

    observer = new MutationObserver(callback);

    $('#pages').childNodes.forEach(node => {
      if (node.nodeType === 1) {
        observer.observe(node, options);
      }
    });
  };

  // generate watcher id
  const generateWatcherId = element => {
    let id = JSON.stringify(element.outerHTML);

    if (element.textContent) {
      id = element.textContent;
    } else if (element.getAttribute('id')) {
      id = element.getAttribute('id');
    }

    return id.toLocaleLowerCase();
  };

  // draw watcher surface area overlay
  const addOverlay = rect => {
    const node = document.createElement('div');

    node.style.position = 'absolute';
    node.style.top = `${rect.top}px`;
    node.style.left = `${rect.left}px`;
    node.style.height = `${rect.height}px`;
    node.style.width = `${rect.width}px`;
    node.style.border = '1px solid red';
    node.style['z-index'] = 2;

    document.body.append(node);

    return node;
  };

  // add Neural Network Classifier (fingers)
  const addNNCWatcher = (node, page, yDirection = 'bottom') => {
    const id = generateWatcherId(node);
    const callback = ([recognizedObject]) => {
      console.log(`NeuralNetworkClassifier: classTag=${recognizedObject.classTag} page=${page} id=${id}`);

      // simulate click event
      if (Number(recognizedObject.classTag) === 1) {
        node.click();
      }
    };

    // set watcher surface area to at least 40x40 px
    const rect = node.getBoundingClientRect().toJSON();
    const rectHeight = rect.height;
    rect.height = Number(rect.height) < 40 ? 40 : rect.height;
    rect.width = Number(rect.width) < 40 ? 40 : rect.width;
    rect.top = yDirection === 'top' ? rect.top - rect.height + rectHeight : rect.top;

    lampix.watchers
      .add({
        name: 'NeuralNetworkClassifier',
        shape: lampix.helpers.rectangle(rect.left, rect.top, rect.width, rect.height),
        params: { neural_network_name: 'fingers' },
        onClassification: callback
      })
      .then(registeredWatchers => {
        watchers[page].push({
          id,
          page,
          overlay: addOverlay(rect),
          watcher: registeredWatchers[0]
        });
      });
  };

  // add Depth Classifier
  const addDCWatcher = (node, page) => {
    const id = generateWatcherId(node);
    const callback = ([recognizedObject]) => {
      console.log(`DepthClassifier: objectHeight=${recognizedObject.objectHeight}`);

      // simulate turret build click event
      if (recognizedObject.centerPoint && (info.isSimulator || recognizedObject.objectHeight)) {
        // set default object height to Laser when running in simulator
        const objectHeight = recognizedObject.objectHeight
          ? Number(recognizedObject.objectHeight)
          : config.turretsMaxHeight.Tazer +
            parseInt((config.turretsMaxHeight.Laser - config.turretsMaxHeight.Tazer) / 2, 10);
        const { turretsMaxHeight } = config;
        let turretName;

        if (objectHeight < turretsMaxHeight.Tazer) turretName = 'Tazer';
        if (objectHeight >= turretsMaxHeight.Tazer && objectHeight < turretsMaxHeight.Laser) turretName = 'Laser';
        else if (objectHeight >= turretsMaxHeight.Laser && objectHeight < turretsMaxHeight.Missile) {
          turretName = 'Missile';
        } else if (objectHeight >= turretsMaxHeight.Missile && objectHeight < turretsMaxHeight.Mortar) {
          turretName = 'Mortar';
        }

        if (turretName) {
          console.log(`Build turret: ${turretName} objectHeight=${objectHeight}`);

          // select turret
          const turretNode = $(`#control-turrets a[data-name="${turretName}"]`);
          turretNode.click();

          // build turret
          const options = {
            clientX: parseInt(recognizedObject.centerPoint.posX, 10),
            clientY: parseInt(recognizedObject.centerPoint.posY, 10),
            bubbles: true,
            cancelable: true,
            view: window
          };
          node.dispatchEvent(new MouseEvent('mousemove', options));
          node.dispatchEvent(new MouseEvent('click', options));
          $('#control').click();
        } else {
          console.log(`Build turret: objectHeight=${objectHeight} !!! Incompatible turret height !!!`);
        }
      }
    };

    const rect = node.getBoundingClientRect();

    lampix.watchers
      .add({
        name: 'DepthClassifier',
        shape: lampix.helpers.rectangle(rect.left, rect.top, rect.width, rect.height),
        params: { frames_until_stable: config.depthClassifierParams.frames_until_stable },
        onClassification: callback
      })
      .then(registeredWatchers => {
        watchers[page].push({
          id,
          page,
          overlay: addOverlay(rect),
          watcher: registeredWatchers[0]
        });
      });
  };

  // update watchers state when changing page
  const updateWatchers = page => {
    let currentPage = page;

    // return to overlay page from scores when game over
    if (page === 'canvas' && window.game.lives <= 0) {
      currentPage = 'overlay';
    }

    // enable watchers only for the current page
    Object.keys(watchers).forEach(pageName => {
      if (pageName === 'global') return;

      watchers[pageName].forEach(watcher => {
        if (currentPage === pageName) {
          watcher.watcher.resume();
          watcher.overlay.style.display = 'block';
        } else {
          watcher.watcher.pause();
          watcher.overlay.style.display = 'none';
        }
      });
    });

    // init current page watchers
    if (watchers[page] === undefined) {
      watchers[page] = [];
    } else {
      return;
    }

    switch (currentPage) {
      case 'start':
        $$('#pages-start-maps a').forEach(node => {
          addNNCWatcher(node, currentPage);
        });
        break;

      case 'canvas':
        $$('#control-right a').forEach(node => {
          addNNCWatcher(node, currentPage);
        });

        addDCWatcher($('#pages-canvas'), currentPage);
        break;

      case 'scores':
        addNNCWatcher($('#pages-scores-back'), currentPage);
        break;

      case 'overlay':
        $$('#control-score a:not([id])').forEach(node => {
          addNNCWatcher(node, currentPage, 'top');
        });
        break;

      default:
        break;
    }
  };

  // remove all watchers
  const removeWatchers = async () => {
    const watchersFlat = Object.values(watchers).reduce((watchersAcc, group) => {
      // eslint-disable-next-line
      const watchersGroupFlat = group.reduce((watchersGroupAcc, watcher) => {
        return watchersGroupAcc.concat(watcher.watcher);
      }, []);

      return watchersAcc.concat(watchersGroupFlat);
    }, []);

    await lampix.watchers.remove(...watchersFlat);
  };

  const init = async () => {
    // get lampix info
    await lampix.getLampixInfo().then(data => {
      info = data;
    });

    // get app config
    await lampix.getAppConfig().then(data => {
      Object.assign(config, data);
    });

    // add close app button
    watchers.global = [];
    await lampixDOM.buttons
      .generate(600, 50, lampix.exit, {
        label: 'Close',
        labelPosition: 'right',
        scaleFactor: 1.3,
        animationDuration: 500
      })
      .then(registeredWatcher => {
        watchers.global.push({
          watcher: registeredWatcher
        });
      });

    // remove watchers on reset/play again (the legay app will reload the page)
    await $$('.control-reset').forEach(node => {
      node.addEventListener('click', async e => {
        e.preventDefault();
        await removeWatchers();
        window.location = e.target.href;
      });
    });

    // update watchers on page change
    addPageObserver();

    // add watchers on start page
    updateWatchers('start');
  };

  init();
})();

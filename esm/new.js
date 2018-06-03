import _helpers from './helpers';

/**
 * -----------------------------------------------------------------------------
 *  ____  _           _          _    _
 * |  _ \(_) ___ ___ | |__   ___| |  (_)___
 * | |_) | |/ __/ _ \| '_ \ / _ \ |  | / __|
 * |  __/| | (_| (_) | |_) |  __/ |_ | \__ \
 * |_|   |_|\___\___/|_.__/ \___|_(_)| |___/
 * Picobel.js                       _/ |
 * tomhazledine.com/audio          |__/
 *
 * =============================================================================
 *
 * Replace any native <audio> instances with standard elements (spans, buttons &
 * divs) that we can style however we like.
 *
 * Functionality powered by Web Audio API.
 * -----------------------------------------------------------------------------
 */

function Picobel(rawOptions = {}) {
    /**
     * -------------------------------------------------------------------------
     * SETUP
     *
     * Parse our options, and set starting state.
     * -------------------------------------------------------------------------
     */

    // Define our default options.
    const defaultOptions = {
        theme: 'default',
        components: {
            theme: 'default',
            playPause: true,
            progress: true,
            volume: true,
            download: false,
            mute: true,
            duration: true,
            timer: true
        }
    };
    // Set `options` from arguments, usind `defaultOptions` as fallback.
    const options = Object.assign(defaultOptions, rawOptions);

    // Declare a `state` variable that will hold the active state.
    let state = {
        theme: options.theme,
        components: options.components,
        audioNodes: []
    };

    /**
     * -------------------------------------------------------------------------
     * MAIN METHODS
     *
     * The functions we will use to generate Picobel's core functionality.
     * -------------------------------------------------------------------------
     */

    // Return a `components` object that matches the provided themename.
    const _setComponentsByTheme = (themename = 'default', rawComponents = {}) => {
        const defaultComponents = {
            theme: themename,
            playPause: true,
            progress: true,
            volume: true,
            download: false,
            mute: true,
            duration: true,
            timer: true
        };
        const activeComponents = Object.assign(defaultComponents, rawComponents);
        return activeComponents;
    };

    // Return an array of all the <audio> elements found on the page.
    const _findAudio = () => {
        // Get all the <audio> occurrences in the page.
        let audioElements = document.getElementsByTagName('audio');
        // Save our audioElements as an array (so we can manipulate the DOM but
        // still access our items).
        let items = [].slice.call(audioElements);
        return items;
    };

    const _prepareClasses = (index, classes, theme) => {
        const classesString = `customAudioPlayer loading player_${index} ${classes}`;
        const classesArray = classesString.trim().split(' ');
        classesArray.push(theme);
        return classesArray;
    };

    const _generateMarkup = (nodes = [], components = defaultOptions.components) => {
        const markupArray = nodes.map((node, key) => {
            // Create a container for our new player
            const newPlayer = document.createElement('div');

            // Set the relevant classes on the new player element
            const classes = _prepareClasses(key, node.className, components.theme);
            newPlayer.classList.add(...classes);

            // Set song index attribute
            newPlayer.setAttribute('data-song-index', key);

            // Create a loading indicator
            let loading = document.createElement('div');
            loading.className = 'loader';
            newPlayer.appendChild(loading);

            // TODO: Add "waiting" indicator here?

            // -----------------
            // PLAY/PAUSE BUTTON
            // -----------------
            if (components.playPause) {
                // Create a play/pause button
                let button = document.createElement('button');
                button.className = 'playerTrigger';
                let buttonText = document.createElement('span');
                buttonText.className = 'buttonText';
                buttonText.innerHTML = 'play';
                button.appendChild(buttonText);
                // Add the button to the player
                newPlayer.appendChild(button);
            }

            // ---------
            // META DATA
            // ---------
            // Create a wrapper for our player's metadata
            let meta = document.createElement('div');
            meta.className = 'metaWrapper';

            // Create elements to display file metadata
            let meta_title = document.createElement('span');
            meta_title.className = 'titleDisplay';
            meta_title.innerHTML = 'File ' + (key + 1);
            meta.appendChild(meta_title);

            let meta_artist = document.createElement('span');
            meta_artist.className = 'artistDisplay';
            meta.appendChild(meta_artist);

            // Add the metadata to the player
            newPlayer.appendChild(meta);

            // -----------------------------------
            // TIMINGS (PROGRESS, DURATION, TIMER)
            // -----------------------------------
            if (components.progress || components.duration || components.timer) {
                let timings = document.createElement('div');
                timings.className = 'timingsWrapper';

                if (components.timer) {
                    let timer = document.createElement('span');
                    timer.className = 'songPlayTimer';
                    timer.innerHTML = '0:00';
                    timings.appendChild(timer);
                }

                if (components.progress) {
                    let progress = _helpers.buildSlider('progress', 0, 100, 0);
                    timings.appendChild(progress);
                }

                if (components.duration) {
                    let duration = document.createElement('span');
                    duration.className = 'songDuration';
                    duration.innerHTML = '-:--';
                    timings.appendChild(duration);
                }

                // Add the timings to the player
                newPlayer.appendChild(timings);
            }

            // ----------------
            // VOLUME INDICATOR
            // ----------------
            if (components.volume || components.mute) {
                // Volume Indicator
                let volume = document.createElement('div');
                volume.className = 'songVolume';

                if (components.mute) {
                    let mute = document.createElement('button');
                    mute.className = 'songMuteButton';
                    mute.innerHTML = 'Mute';
                    volume.appendChild(mute);
                }

                if (components.volume) {
                    let volume_label_wrapper = document.createElement('div');
                    volume_label_wrapper.className = 'songVolumeLabelWrapper';
                    let volume_label = document.createElement('span');
                    volume_label.className = 'songVolumeLabel';
                    volume_label.innerHTML = 'Volume';
                    volume_label_wrapper.appendChild(volume_label);
                    let volume_value = document.createElement('span');
                    volume_value.className = 'songVolumeValue';
                    volume_value.innerHTML = '10';
                    volume_label_wrapper.appendChild(volume_value);
                    volume.appendChild(volume_label_wrapper);

                    let volume_slider = _helpers.buildSlider('volume', 0, 1, 1, 0.1);
                    volume.appendChild(volume_slider);
                }
                newPlayer.appendChild(volume);
            }

            return newPlayer;
        });

        return markupArray;
    };

    const _replaceNodes = (audioElements, newMarkup) => {
        audioElements.map((element, key) => {
            element.parentNode.replaceChild(newMarkup[key], element);
        });
    };

    /**
     * -------------------------------------------------------------------------
     * RUN THE CODE
     *
     * This is where the methods are called. Reading these lines should give you
     * a step-by-step overview of what Picobel does.
     * -------------------------------------------------------------------------
     */

    // Set `components` based on theme (but overridden by explicit `options`).
    state.components = _setComponentsByTheme(state.theme, rawOptions.components);

    // Get audio elements from page, and save their details to state.
    state.audioNodes = _findAudio();

    // Build markup for each element, based on `components`
    const markup = _generateMarkup(state.audioNodes, state.components);

    // Replace audio elements in DOM with new markup
    _replaceNodes(state.audioNodes, markup);

    // Setup event listeners

    // Provide methods for external use?

    // --- //

    /**
     * -------------------------------------------------------------------------
     * API
     *
     * Make these methods public - useful for testing.
     * -------------------------------------------------------------------------
     */

    return {
        state,
        setComponentsByTheme: _setComponentsByTheme,
        findAudio: _findAudio,
        generateMarkup: _generateMarkup,
        prepareClasses: _prepareClasses
    };
}

export default Picobel;

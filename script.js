document.addEventListener('DOMContentLoaded', () => {
    // Find all video containers on the page
    document.querySelectorAll('.video-container').forEach(videoContainer => {
        // Find elements specific to this video container
        const video = videoContainer.querySelector('.video');
        const controls = videoContainer.querySelector('.video-controls');
        const playPauseBtn = videoContainer.querySelector('.play-pause-btn');
        const rewindBtn = videoContainer.querySelector('.rewind-btn');
        const fastForwardBtn = videoContainer.querySelector('.fast-forward-btn');
        const fullscreenBtn = videoContainer.querySelector('.fullscreen-btn');
        const playIcon = videoContainer.querySelector('.play-icon');
        const pauseIcon = videoContainer.querySelector('.pause-icon');
        const fullscreenEnterIcon = videoContainer.querySelector('.fullscreen-enter-icon');
        const fullscreenExitIcon = videoContainer.querySelector('.fullscreen-exit-icon');
        const volumeBtn = videoContainer.querySelector('.volume-btn');
        const volumeHighIcon = videoContainer.querySelector('.volume-high-icon');
        const volumeMutedIcon = videoContainer.querySelector('.volume-muted-icon');
        const volumeSlider = videoContainer.querySelector('.volume-slider');
        const timelineContainer = videoContainer.querySelector('.timeline-container');
        const progressBar = videoContainer.querySelector('.progress-bar');
        const loader = videoContainer.querySelector('.loading-spinner');
        const playPauseOverlay = videoContainer.querySelector('.play-pause-overlay');
        const overlayPlayIcon = videoContainer.querySelector('.overlay-play-icon');
        const overlayPauseIcon = videoContainer.querySelector('.overlay-pause-icon');
        let isSeeking = false;
        let controlsTimeout;
        let lastTap = 0;
        let loadingTimeout;

        // --- Play/Pause ---
        function togglePlay() {
            if (video.paused || video.ended) {
                video.play();
            } else {
                video.pause();
                showOverlayIcon('pause');
            }
        }

        // On desktop, a single click on the video toggles play.
        // On mobile, this is handled by the double-tap logic below.
        if (!('ontouchstart' in window)) {
            video.addEventListener('click', togglePlay);
        }

        playPauseBtn.addEventListener('click', togglePlay);

        videoContainer.addEventListener('click', () => {
            if ('ontouchstart' in window) showControls();
        });

        video.addEventListener('play', () => {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            showOverlayIcon('play');
            loader.style.display = 'none';
        });

        video.addEventListener('pause', () => {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            showOverlayIcon('pause');
            loader.style.display = 'none';
        });

        // --- Rewind & Fast Forward ---
        rewindBtn.addEventListener('click', () => video.currentTime -= 10);
        fastForwardBtn.addEventListener('click', () => video.currentTime += 10);

        // --- Fullscreen ---
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                videoContainer.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            fullscreenEnterIcon.style.display = isFullscreen ? 'none' : 'block';
            fullscreenExitIcon.style.display = isFullscreen ? 'block' : 'none';
        });

        // --- Volume Controls ---
        volumeBtn.addEventListener('click', () => video.muted = !video.muted);

        volumeSlider.addEventListener('input', (e) => {
            video.volume = e.target.value;
            video.muted = e.target.value === 0;
        });

        video.addEventListener('volumechange', () => {
            volumeSlider.value = video.volume;
            const isMuted = video.muted || video.volume === 0;
            volumeHighIcon.style.display = isMuted ? 'none' : 'block';
            volumeMutedIcon.style.display = isMuted ? 'block' : 'none';
        });

        // --- Timeline / Progress Bar ---
        video.addEventListener('timeupdate', () => {
            const percent = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${percent}%`;
        });

        function seek(e) {
            const timelineWidth = timelineContainer.clientWidth;
            // For touch events, we need to calculate the position relative to the timeline container
            const rect = timelineContainer.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            let offsetX = clientX - rect.left;

            // Clamp the value between 0 and the timeline width
            offsetX = Math.max(0, Math.min(offsetX, timelineWidth));

            video.currentTime = (offsetX / timelineWidth) * video.duration;
        }

        // --- Timeline Dragging for Mouse and Touch ---
        function startSeeking(e) {
            isSeeking = true;
            seek(e.type.includes('touch') ? e.touches[0] : e);
        }

        function whileSeeking(e) {
            if (isSeeking) {
                // Prevent page scroll on mobile while seeking
                e.preventDefault();
                seek(e.type.includes('touch') ? e.touches[0] : e);
            }
        }

        function stopSeeking() {
            isSeeking = false;
        }

        timelineContainer.addEventListener('mousedown', startSeeking);
        document.addEventListener('mousemove', whileSeeking);
        document.addEventListener('mouseup', stopSeeking);

        timelineContainer.addEventListener('touchstart', startSeeking);
        document.addEventListener('touchmove', whileSeeking, { passive: false });
        document.addEventListener('touchend', stopSeeking);

        // --- Show/Hide Controls ---
        function showControls() {
            clearTimeout(controlsTimeout);
            controls.style.opacity = '1';
            hideControlsAfterDelay();
        }

        function hideControlsAfterDelay() {
            if (video.paused) return; // Don't hide if paused
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(() => {
                controls.style.opacity = '0';
            }, 3000); // Hide after 3 seconds
        }

        videoContainer.addEventListener('mousemove', showControls);
        videoContainer.addEventListener('mouseleave', () => { if (!video.paused) controls.style.opacity = '0'; });
        video.addEventListener('pause', showControls);
        video.addEventListener('play', hideControlsAfterDelay);

        // Double-tap to play/pause on touch devices
        videoContainer.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                // It's a double tap
                e.preventDefault(); // Prevent the single-click handler from firing
                togglePlay();
            }
            lastTap = currentTime;
        });


        controls.addEventListener('click', (e) => e.stopPropagation());

        // --- Loading Spinner Events ---
        video.addEventListener('waiting', () => {
            // Only show the loader if buffering takes more than 2 seconds
            clearTimeout(loadingTimeout);
            loadingTimeout = setTimeout(() => {
                loader.style.display = 'block';
            }, 2000);
        });
        video.addEventListener('playing', () => {
            // Hide loader and clear timer when playback resumes
            clearTimeout(loadingTimeout);
            loader.style.display = 'none';
        });

        // --- Play/Pause Overlay Icon Logic ---
        function showOverlayIcon(type) {
            overlayPlayIcon.style.display = (type === 'play') ? 'block' : 'none';
            overlayPauseIcon.style.display = (type === 'pause') ? 'block' : 'none';
            playPauseOverlay.style.opacity = '1';

            // Fade out after a short delay
            clearTimeout(playPauseOverlay.fadeTimeout);
            playPauseOverlay.fadeTimeout = setTimeout(() => {
                playPauseOverlay.style.opacity = '0';
            }, 700); // Icon visible for 0.7 seconds
        }
        // Hide overlay initially
        playPauseOverlay.style.opacity = '0';

    });
});
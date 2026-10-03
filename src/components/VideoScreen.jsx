import React, { useState, useEffect, useRef, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/video_screen.scss';
const CHECK_SKIP_BUTTON_EVENTS = ["mousemove", "touchstart", "touchmove", "click", "keydown"];

const VideoScreen = (props) => {
  const { escapp, appSettings, Utils, I18n } = useContext(GlobalContext);
  const [showVideo, setShowVideo] = useState(false);
  const [hidePlayButton, setHidePlayButton] = useState(appSettings.autoplay);
  const [hideSkipButton, setHideSkipButton] = useState(false);
  const solutionSentRef = useRef(false);
  const videoRef = useRef(null);
  const videoInitCalledRef = useRef(false);
  const autoplayTimerRef = useRef(null);
  const showSkipButtonTimerRef = useRef(null);

  useEffect(() => {
    const delay = 0; //This can be changed for testing autoplay
    const timer = setTimeout(() => {
      setShowVideo(appSettings.hasVideo);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;

    function onLoadedMetadata(ev) {
      if (videoInitCalledRef.current === true) return;
      videoInitCalledRef.current = true;
      videoInit(ev);
    }

    if (video.readyState >= 1) {
      onLoadedMetadata({ target: video });
    } else {
      video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      CHECK_SKIP_BUTTON_EVENTS.forEach(eventName => {
        video.removeEventListener(eventName, checkShowSkipButton);
      });
      videoInitCalledRef.current = false;
    };
  }, [showVideo]);

  useEffect(() => {
    return () => {
      clearTimeout(showSkipButtonTimerRef.current);
      clearTimeout(autoplayTimerRef.current);
    };
  }, []);

  useEffect(() => {
    handleResize();
  }, [props.appWidth, props.appHeight]);

  function handleResize() {
    if((props.appHeight === 0)||(props.appWidth === 0)){
      return;
    }
    resizeVideo();
  }

  function resizeVideo() {
    //Resizing done by CSS.
  }

  function videoInit(ev) {
    const video = ev.target;
    if (!video) return;

    resizeVideo();

    if (appSettings.allowSkipVideo === true) {
      CHECK_SKIP_BUTTON_EVENTS.forEach(eventName => {
        video.addEventListener(eventName, checkShowSkipButton, { passive: true });
      });
    }

    if (appSettings.autoscroll) {
      scrollToVideo();
    }

    if (appSettings.autoplay) {
      tryAutoplay();
    }
  }

  async function tryAutoplay() {
    const video = videoRef.current;
    if ((!video)||(appSettings.autoplay!==true)) return;

    try {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise;
      } else {
        //Fallback
        autoplayTimerRef.current = setTimeout(() => {
          const videoPlaying = (!video.paused && !video.ended);
          if (!videoPlaying) {
            setHidePlayButton(false);
          }
        }, 1000);
      }
    } catch (error) {
      // Autoplay was blocked
      setHidePlayButton(false);
    }
  }

  function scrollToVideo() {
    const video = videoRef.current;
    if ((!video)||(appSettings.autoscroll!==true)) return;

    let scrollTarget = video;
    try {
      // If running inside a same-origin iframe, scroll to the iframe
      if (window.self !== window.top && window.frameElement && typeof window.frameElement.scrollIntoView === "function") {
        scrollTarget = window.frameElement;
      }
    } catch (error) {
      // Cross-origin iframe, parent frame is not accessible, scroll only within the current document.
    }

    try {
      scrollTarget.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } catch (error){
      // Unable to scroll
    }
  }

  function checkShowSkipButton() {
    if (appSettings.allowSkipVideo !== true) return;
    const video = videoRef.current;
    if (!video) return;

    if ((!video.ended)&&(video.style.pointerEvents !== "none")) {
      setHideSkipButton(false);
    }

    clearTimeout(showSkipButtonTimerRef.current);
    showSkipButtonTimerRef.current = setTimeout(() => {
      setHideSkipButton(true);
    }, 2500);
  }

  function handlePlay() {
    setHidePlayButton(true);
    checkShowSkipButton();
  }

  function handlePause() {
    checkShowSkipButton();
  }

  function handleEnded() {
    setHideSkipButton(true);
    sendSolution();
  }

  function onClickPlayVideo() {
    const video = videoRef.current;
    if (!video) return;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        Utils.log("Unable to play video:", error);
      });
    }
  }

  function onClickSkipVideo(){
    const videoDOM = videoRef.current;
    if (!videoDOM) return;
    videoDOM.pause();
    videoDOM.style.pointerEvents = "none";
    videoDOM.style.filter = "brightness(0)";
    videoDOM.currentTime = videoDOM.duration;
    setHidePlayButton(true);
    setHideSkipButton(true);
    sendSolution();
  }

  function sendSolution(){
    if(solutionSentRef.current === false){
      solutionSentRef.current = true;
      props.submitPuzzleSolution();
    }
  }

  // const showVideo = appSettings.hasVideo; //showVideo is changed through useEffect
  const showControls = appSettings.enableControls;
  const showPlayButton = appSettings.showPlayButton && hidePlayButton===false;
  const showSkipButton = appSettings.allowSkipVideo && hideSkipButton === false;

  return (
    <div id="video_screen" className={"screen_content"}>
      {showVideo && (
        <div id="videoWrapper">
          <video
            ref={videoRef}
            id="video"
            src={appSettings.videoURL}
            controls={showControls}
            autoPlay={false}
            playsInline
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            {...(appSettings.hasPoster
            ? { poster: appSettings.posterURL }
            : {})}
          />
          {showPlayButton && (
            <img
            src="images/play_button.png"
            id="playButton"
            className="play_button"
            alt="Play"
            onClick={onClickPlayVideo}
            />
          )}
          {showSkipButton && (
            <button id="skipVideo" onClick={onClickSkipVideo}>
              {appSettings.skipVideoText}
            </button>
          )}
        </div>
      )}
    </div>);
};

export default VideoScreen;
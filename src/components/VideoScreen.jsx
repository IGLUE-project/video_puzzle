import React, { useState, useEffect, useRef, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/video_screen.scss';

const VideoScreen = (props) => {
  const { escapp, appSettings, Utils, I18n } = useContext(GlobalContext);
  const [hidePlayButton, setHidePlayButton] = useState(false);
  const [hideSkipButton, setHideSkipButton] = useState(false);
  const solutionSentRef = useRef(false);
  const videoRef = useRef(null);
  const videoInitCalledRef = useRef(false);
  const showSkipButtonTimerRef = useRef(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
    };
  }, []);

  useEffect(() => () => clearTimeout(showSkipButtonTimerRef.current), []);

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
    if(video === null) return;

    if(appSettings.allowSkipVideo === true){
      ["mousemove", "touchstart", "touchmove", "click", "keydown"].forEach(ev =>
        video.addEventListener(ev, checkShowSkipButton, { passive: true })
      );
    }

    resizeVideo();
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

  function onClickPlayVideo(){
    const video = videoRef.current;
    if(video !== null){
      video.play();
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

  const showVideo = appSettings.hasVideo;
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
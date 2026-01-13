import React, { useState, useEffect, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/video_screen.scss';

const VideoScreen = (props) => {
  const { escapp, appSettings, Utils, I18n } = useContext(GlobalContext);
  const [hidePlayButton, setHidePlayButton] = useState(false);
  const [hideSkipButton, setHideSkipButton] = useState(false);
  let solutionSent = false;

  useEffect(() => {
    handleResize();
  }, [props.appWidth, props.appHeight]);

  function handleResize(){
    if((props.appHeight === 0)||(props.appWidth === 0)){
      return;
    }
    resizeVideoFrame();
  }

  function resizeVideoFrame() {
    const video = document.getElementById("video");
    const frame = document.getElementById("videoFrame");
    const wrapper = document.getElementById("videoWrapper");
    const header = document.getElementById("videoHeader");
    if((video === null)||(frame === null)||(wrapper === null)){
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const ratio = vw / vh;
    const availableWidth = wrapper.clientWidth;
    const availableHeight = wrapper.clientHeight;

    let headerPx;
    if(appSettings.showHeader){
      const HEADER_MIN_PX = 25;
      const HEADER_MAX_PX = 50;
      const HEADER_FRAC_IDEAL = 0.1;
      headerPx = availableHeight * HEADER_FRAC_IDEAL;
      headerPx = Math.max(HEADER_MIN_PX, Math.min(headerPx, HEADER_MAX_PX));
    } else {
      headerPx = 0;
    }

    const headerFrac = headerPx / availableHeight;
    const videoFrac = 1 - headerFrac;

    // First option: Height limitation
    let Fh1 = availableHeight;
    let videoH1 = Fh1 * videoFrac;
    let videoW1 = videoH1 * ratio;
    let Fw1 = videoW1;

    // Second option: Width limitation
    let Fw2 = availableWidth;
    let videoW2 = Fw2;
    let videoH2 = videoW2 / ratio;
    let Fh2 = videoH2 / videoFrac;

    // Choose better option
    if (Fw1 <= availableWidth) {
      frame.style.height = `${Fh1}px`;
      frame.style.width = `${Fw1}px`;
    } else {
      frame.style.width = `${Fw2}px`;
      frame.style.height = `${Math.min(Fh2, availableHeight)}px`;
    }

    if(header !== null){
      header.style.height = `${headerPx}px`;
    }
  }

  function handlePlay() {
    let playButtonDOM = document.getElementById("playButton");
    if(playButtonDOM !== null) {
      playButtonDOM.style.display = "none";
    }
  }

  function handleEnded() {
    setHideSkipButton(true);
    sendSolution();
  }

  function onClickPlayVideo(){
    document.getElementById("video").play();
  }

  function onClickSkipVideo(){
    let videoDOM = document.getElementById("video");
    videoDOM.style.pointerEvents = "none";
    videoDOM.style.filter = "brightness(0)";
    videoDOM.currentTime = videoDOM.duration;
    videoDOM.pause();
    setHidePlayButton(true);
    setHideSkipButton(true);
    sendSolution();
  }

  function sendSolution(){
    if(solutionSent === false){
      solutionSent = true;
      props.submitPuzzleSolution();
    }
  }

  const showVideo = appSettings.hasVideo;
  const showVideoHeader = appSettings.showHeader;
  const showControls = appSettings.enableControls;
  const autoPlayVideo = false;
  const showPlayButton = appSettings.showPlayButton && hidePlayButton===false;
  const showSkipButton = showVideoHeader && hideSkipButton === false;

  return (
    <div id="video_screen" className={"screen_content"}>
      {showVideo && (
        <div id="videoWrapper">
          <div id="videoFrame">
            {showVideoHeader && (
              <div id="videoHeader">
                {showSkipButton && (
                  <button id="skipVideo" onClick={onClickSkipVideo}>
                    {appSettings.skipVideoText}
                  </button>
                )}
              </div>
            )}
            <video
              id="video"
              src={appSettings.videoURL}
              controls={showControls}
              autoPlay={autoPlayVideo}
              playsInline
              onLoadedMetadata={resizeVideoFrame}
              onPlay={handlePlay}
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
          </div>
        </div>
      )}
    </div>);
};

export default VideoScreen;
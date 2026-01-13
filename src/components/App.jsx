import React from 'react';
import {useState, useEffect, useRef, useContext } from 'react';
import { GlobalContext } from "./GlobalContext";
import './../assets/scss/app.scss';

import { DEFAULT_APP_SETTINGS, ESCAPP_CLIENT_SETTINGS, VIDEO_SCREEN, SKIN_SETTINGS } from "../constants/constants.jsx";
import VideoScreen from './VideoScreen.jsx';

export default function App() {
  const { escapp, setEscapp, appSettings, setAppSettings, Storage, setStorage, Utils, I18n } = useContext(GlobalContext);
  const hasExecutedEscappValidation = useRef(false);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState(VIDEO_SCREEN);
  const prevScreen = useRef(screen);
  const [appWidth, setAppWidth] = useState(0);
  const [appHeight, setAppHeight] = useState(0);
  
  useEffect(() => {
    //Init Escapp client
    if(escapp !== null){
      return;
    }
    //Create the Escapp client instance.
    let _escapp = new ESCAPP(ESCAPP_CLIENT_SETTINGS);
    setEscapp(_escapp);
    Utils.log("Escapp client initiated with settings:", _escapp.getSettings());

    //Use the storage feature provided by Escapp client.
    setStorage(_escapp.getStorage());

    //Get app settings provided by the Escapp server.
    let _appSettings = processAppSettings(_escapp.getAppSettings());
    setAppSettings(_appSettings);
    Utils.log("App settings:", _appSettings);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  function processAppSettings(_appSettings){
    if(typeof _appSettings !== "object"){
      _appSettings = {};
    }
    if((typeof _appSettings.skin === "undefined")&&(typeof DEFAULT_APP_SETTINGS.skin === "string")){
      _appSettings.skin = DEFAULT_APP_SETTINGS.skin;
    }

    let skinSettings = SKIN_SETTINGS[_appSettings.skin] || {};
    let DEFAULT_APP_SETTINGS_SKIN = Utils.deepMerge(DEFAULT_APP_SETTINGS, skinSettings);
 
     // Merge _appSettings with DEFAULT_APP_SETTINGS_SKIN to obtain final app settings
    _appSettings = Utils.deepMerge(DEFAULT_APP_SETTINGS_SKIN, _appSettings);
    
    //Init internacionalization module
    I18n.init(_appSettings);

    if(typeof _appSettings.skipVideoText !== "string"){
      _appSettings.skipVideoText = I18n.getTrans("i.skip_video");
    }

    if (typeof _appSettings.backgroundImg === "string" && _appSettings.backgroundImg.trim() !== "" && _appSettings.backgroundImg !== "NONE") {
      _appSettings.backgroundImageProp = `url("${_appSettings.backgroundImg}")`;
      _appSettings.backgroundRepeat = "no-repeat";
      _appSettings.backgroundSize = "100% 100%";
    }

    //Booleans
    _appSettings.enableControls = ((_appSettings.enableControls==="TRUE")||(_appSettings.enableControls===true));
    _appSettings.showPlayButton = ((_appSettings.enableControls === false)||((_appSettings.showPlayButton==="TRUE")||(_appSettings.showPlayButton===true)));
    _appSettings.allowSkipVideo = ((_appSettings.allowSkipVideo==="TRUE")||(_appSettings.allowSkipVideo===true));
    _appSettings.showHeader = (_appSettings.allowSkipVideo===true);

    let puzzleSolution = _appSettings.videoURL;
    //Change HTTP protocol to HTTPs in URLs if necessary
    _appSettings = Utils.checkUrlProtocols(_appSettings);
    _appSettings.puzzleSolution = puzzleSolution;

    _appSettings.hasVideo = (typeof _appSettings.videoURL === "string")&&(_appSettings.videoURL.trim()!=="");
    _appSettings.hasPoster = (_appSettings.hasVideo)&&(typeof _appSettings.posterURL === "string")&&(_appSettings.posterURL.trim()!=="");

    //Preload resources (if necessary)
    //Utils.preloadImages([_appSettings.backgroundMessage]);
    //Utils.preloadAudios([_appSettings.soundBeep,_appSettings.soundNok,_appSettings.soundOk]); //Preload done through HTML audio tags
    //Utils.preloadVideos(["videos/some_video.mp4"]);

    return _appSettings;
  }

  useEffect(() => {
    if (!hasExecutedEscappValidation.current && escapp !== null && appSettings !== null && Storage !== null) {
      hasExecutedEscappValidation.current = true;

      // //Register callbacks in Escapp client and validate user.
      // escapp.registerCallback("onNewErStateCallback", function(erState){
      //   try {
      //     Utils.log("New escape room state received from ESCAPP", erState);
      //     restoreAppState(erState);
      //   } catch (e){
      //     Utils.log("Error in onNewErStateCallback", e);
      //   }
      // });

      // escapp.registerCallback("onErRestartCallback", function(erState){
      //   try {
      //     Utils.log("Escape Room has been restarted.", erState);
      //     if(typeof Storage !== "undefined"){
      //       Storage.removeSetting("state");
      //     }
      //   } catch (e){
      //     Utils.log("Error in onErRestartCallback", e);
      //   }
      // });

      //Validate user. To be valid, a user must be authenticated and a participant of the escape room.
      escapp.validate((success, erState) => {
        try {
          Utils.log("ESCAPP validation", success, erState);
          if(success){
            //restoreAppState(erState);
            setLoading(false);
          }
        } catch (e){
          Utils.log("Error in validate callback", e);
        }
      });
    }
  }, [escapp, appSettings, Storage]);

  useEffect(() => {
    if(loading === false){
      handleResize();
    }
  }, [loading]);

  useEffect(() => {
    if (screen !== prevScreen.current) {
      Utils.log("Screen has changed from", prevScreen.current, "to", screen);
      prevScreen.current = screen;
      //saveAppState();
    }
  }, [screen]);

  function handleResize(){
    setAppWidth(window.innerWidth);
    setAppHeight(window.innerHeight);
  }

  // function restoreAppState(erState){
  //   Utils.log("Restore application state based on escape room state:", erState);
  //   if (escapp.getAllPuzzlesSolved() && (escapp.getSolvedPuzzles().length > 0)){
  //     //Puzzle already solved
  //   } else {
  //     //Puzzle not solved. Restore app state based on local storage.
  //     //restoreAppStateFromLocalStorage();
  //   }
  // }

  // function restoreAppStateFromLocalStorage(){
  //   if(typeof Storage !== "undefined"){
  //     let stateToRestore = Storage.getSetting("state");
  //     if(stateToRestore){
  //       Utils.log("Restore app state", stateToRestore);
  //       setScreen(stateToRestore.screen);
  //     }
  //   }
  // }

  // function saveAppState(){
  //   if(typeof Storage !== "undefined"){
  //     let currentAppState = {screen: screen};
  //     Utils.log("Save app state in local storage", currentAppState);
  //     Storage.saveSetting("state",currentAppState);
  //   }
  // }

  function submitPuzzleSolution(){
    let solution = appSettings.puzzleSolution;
    if((typeof solution !== "string")||(solution.trim()==="")){
      return;
    }
    if (escapp.getAllPuzzlesSolved()){
      return;
    }
    Utils.log("Submit puzzle solution", solution);
    escapp.submitNextPuzzle(solution, {}, (success, erState) => {
      Utils.log("Solution submitted to Escapp", solution, success, erState);
    });
  }

  const renderScreens = (screens) => {
    if (loading === true) {
      return null;
    } else {
      return (
        <>
          {screens.map(({ id, content }) => renderScreen(id, content))}
        </>
      );
    }
  };

  const renderScreen = (screenId, screenContent) => (
    <div key={screenId} className={`screen_wrapper ${screen === screenId ? 'active' : ''}`} >
      {screenContent}
    </div>
  );

  let screens = [
    {
      id: VIDEO_SCREEN,
      content: <VideoScreen appHeight={appHeight} appWidth={appWidth} submitPuzzleSolution={submitPuzzleSolution} />
    }
  ];

  let globalWrapperStyle = {};
  if(appSettings !== null && typeof appSettings.backgroundImageProp === "string"){
    globalWrapperStyle = {
      backgroundImage: appSettings.backgroundImageProp,
      backgroundRepeat: appSettings.backgroundRepeat,
      backgroundSize: appSettings.backgroundSize,
    }
  }

  return (
    <div id="global_wrapper" 
      className={`${(appSettings !== null && typeof appSettings.skin === "string") ? appSettings.skin.toLowerCase() : ''}`}
      style={globalWrapperStyle}
    >
      {renderScreens(screens)}
    </div>
  )
}
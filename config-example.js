//Copy this file to config.js and specify your own settings

export let ESCAPP_APP_SETTINGS = {
  //Settings that can be specified by the authors
  videoURL: "", //Specify the URL of the HTML5 video to be played
  //posterURL: "", //Specify the URL of the video poster
  //backgroundImg: "NONE", //backgroundImg can be "NONE" or a URL.
  enableControls: "TRUE", //Specify if video controls will be displayed
  showPlayButton: "FALSE", //Specify whether a play button will be displayed
  allowSkipVideo: "TRUE", //Specify whether the player can progress in the escape room without watching the video
  //skipVideoText: "Skip this video »", //Specify a custom text for the skip video button

  //Settings that will be automatically specified by the Escapp server
  locale: "es",

  escappClientSettings: {
    endpoint: "https://escapp.es/api/escapeRooms/id",
    linkedPuzzleIds: [1],
    rtc: false,
  },
};
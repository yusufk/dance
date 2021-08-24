/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

var mediaRecorder;
var recordedBlobs;
var state = 'intro';
var audioContext;
var audioStreamDestination;
var speakerDestination;
var musicPreference = document.querySelector('#songPreference');
var music = musicPreference.options[0].value;
var audio;
var audioSource;
const codecPreferences = document.querySelector('#codecPreferences');
const songName = document.querySelector('#song_name');
const gumVideo = document.querySelector('video#gum');
const errorMsgElement = songName; 
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
const recordIcon = document.querySelector('#recordIcon');
const videoSidebar = document.querySelector('#videoSidebar');
const footerStyle = document.getElementById("videoFooter").style;
const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
const videoDescription = document.querySelector('#videoFooter__description');
const constraints = {
  audio: {
  
  },
  video: {
    aspectRatio: 9/16,
    height: {
      min: 720
    },
    facingMode: 'user'
  }
};

recordButton.addEventListener('click', () => {
  if (state == 'intro'){
    recordIcon.style.color = 'red';
    init(constraints);
    songName.textContent = `Select a track on the right, then click above to start recording...`;
    videoDescription.textContent = "Ready..."
  }
  else if (state == 'ready') { 
    recordedVideo.pause();
    recordedVideo.hidden = true;
    gumVideo.hidden = false;
    recordIcon.textContent = 'stop_circle';
    songName.textContent = musicPreference.options[musicPreference.selectedIndex].text;
    videoDescription.textContent = "Recording..."
    codecPreferences.disabled = true;
    state = 'recording';
    startRecording();
  }
  else if (state == 'recording'){
    stopRecording();
    state = 'done';
    recordIcon.textContent = 'download';
    recordIcon.style.color = 'white';
    songName.textContent = "Click the download button to save your video...";
    videoDescription.textContent = "Stopped..."
  }
  else if (state == 'done'){
    videoSidebar.hidden = false;
    downloadRecording();
    songName.textContent = "Share your video with the world!!!";
  };
});

function playRecording() {
  videoSidebar.hidden = false;
  gumVideo.hidden = true;
  recordedVideo.hidden = false;
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
  const superBuffer = new Blob(recordedBlobs, {type: mimeType});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
}

const musicPreferenceButton = document.querySelector('#videoFooter__record');
musicPreferenceButton.addEventListener('click', () => {
  if (musicPreference.hidden) {musicPreference.hidden = false;}
  else {musicPreference.hidden = true;};
});

const shareButton = document.querySelector('#share__button');
shareButton.addEventListener('click', () => {
  try {
    shareRecording();
    console.log("Shared succesfully");
  } catch(err) {
    console.log('Error: ' + err);
  }
});

musicPreference.addEventListener('change', function (ev) {
  console.log('Changed', musicPreference.options[musicPreference.selectedIndex].text);
  songName.textContent = musicPreference.options[musicPreference.selectedIndex].text;
  music = musicPreference.options[musicPreference.selectedIndex].value;
  if (audio !== undefined){audio.src = music;};
  musicPreference.hidden = true;
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function getSupportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
  ];
  return possibleTypes.filter(mimeType => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

function startRecording() {
  recordedBlobs = [];
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
  //const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value;
  const options = {mimeType};
  audio.src = musicPreference.options[musicPreference.selectedIndex].value;
  audioSource.connect(audioStreamDestination);
  audioSource.connect(speakerDestination);
  let combined = new MediaStream();
  combined.addTrack(audioStreamDestination.stream.getAudioTracks()[0]);
  combined.addTrack(window.stream.getVideoTracks()[0]);
  try {
    mediaRecorder = new MediaRecorder(combined, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
    playRecording();
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  audio.play();
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  audio.pause();
  audio.currentTime = 0;
}

function downloadRecording() {
    const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
    const extension = mimeType.split('/')[1];
    const blob = new Blob(recordedBlobs, {type: mimeType});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'ayoba.'+extension;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

function shareRecording() {
  const mimeType = codecPreferences.options[codecPreferences.selectedIndex].value.split(';', 1)[0];
  const extension = mimeType.split('/')[1];
  const blob = new Blob(recordedBlobs, {type: mimeType});
  const file = new File([blob], 'ayoba.'+ extension, { type: mimeType });
  window.navigator.share({title: 'ayoba life', text: 'Checkout my ayoba video!',files: [file] });
}

function initContext() {
  audioContext = new AudioContext(window.AudioContext = window.AudioContext || window.webkitAudioContext);
  audioStreamDestination = audioContext.createMediaStreamDestination();
  speakerDestination = audioContext.destination;
  audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.src = music;
  audioSource = audioContext.createMediaElementSource(audio);
}

function handleSuccess(stream) {
  initContext();
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  gumVideo.srcObject = stream;

  getSupportedMimeTypes().forEach(mimeType => {
    const option = document.createElement('option');
    option.value = mimeType;
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;
  state = 'ready';
  recordIcon.textContent = 'circle';
  recordedVideo.hidden = true;
  gumVideo.hidden = false;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

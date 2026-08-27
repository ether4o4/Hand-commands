import {GestureEngine} from './gesture-engine.js';
import {FilesetResolver,HandLandmarker} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';

const video=document.querySelector('#camera'),canvas=document.querySelector('#overlay'),ctx=canvas.getContext('2d');
const state=document.querySelector('#state'),cursor=document.querySelector('#cursor'),log=document.querySelector('#log'),start=document.querySelector('#start');
const BONES=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const MODEL='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
let stream,landmarker,running=false;

function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
addEventListener('resize',resize);resize();
function logEvent(e){const line=`${new Date(e.at).toLocaleTimeString()}  ${e.type}`;const rows=(log.textContent?log.textContent.split('\n'):[]);rows.unshift(line);log.textContent=rows.slice(0,7).join('\n');}
function draw(hands){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.lineWidth=2;ctx.strokeStyle='rgba(97,220,255,.85)';ctx.fillStyle='#fff';for(const lm of hands){for(const [a,b] of BONES){ctx.beginPath();ctx.moveTo(lm[a].x*canvas.width,lm[a].y*canvas.height);ctx.lineTo(lm[b].x*canvas.width,lm[b].y*canvas.height);ctx.stroke();}for(const p of lm){ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,3,0,Math.PI*2);ctx.fill();}}}
function showCursor(x,y){cursor.style.display='block';cursor.style.left=`${(1-x)*innerWidth}px`;cursor.style.top=`${y*innerHeight}px`;}
function describe(e){const names={cursor_move:'POINTING',left_click:'LEFT CLICK',right_click:'RIGHT CLICK',drag_start:'GRAB',drag_end:'RELEASE',home:'HOME',back:'BACK',scroll:'SCROLL'};state.textContent=names[e.type]||e.type.toUpperCase();logEvent(e);if(e.type==='cursor_move')showCursor(e.x,e.y);}
async function startCamera(){stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=stream;await video.play();}
async function setup(){
  state.textContent='LOADING TRACKER';
  const fileset=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
  landmarker=await HandLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.55});
  await startCamera();
  start.remove();running=true;state.textContent='READY';
  const engine=new GestureEngine({onEvent:describe});
  const loop=(now)=>{if(!running)return;const result=landmarker.detectForVideo(video,now);const hands=result.landmarks||[];draw(hands);engine.update(hands[0],now);if(!hands.length){state.textContent='SHOW YOUR HAND';cursor.style.display='none';}requestAnimationFrame(loop);};
  requestAnimationFrame(loop);
}
document.querySelector('#startBtn').addEventListener('click',()=>setup().catch(e=>{console.error(e);state.textContent='ERROR';alert(`Could not start camera/tracker.\n\n${e.message}`);}));

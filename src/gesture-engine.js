const WRIST=0, THUMB_TIP=4, INDEX_TIP=8, INDEX_PIP=6, MIDDLE_TIP=12, MIDDLE_PIP=10, RING_TIP=16, RING_PIP=14, PINKY_TIP=20, PINKY_PIP=18;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const span=(lm)=>Math.max(dist(lm[WRIST],lm[9]),0.0001);
const extended=(lm,tip,pip)=>dist(lm[tip],lm[WRIST])>dist(lm[pip],lm[WRIST])*1.12;

export const isPoint=(lm)=>extended(lm,INDEX_TIP,INDEX_PIP)&&!extended(lm,MIDDLE_TIP,MIDDLE_PIP)&&!extended(lm,RING_TIP,RING_PIP)&&!extended(lm,PINKY_TIP,PINKY_PIP);
export const isOpen=(lm)=>extended(lm,INDEX_TIP,INDEX_PIP)&&extended(lm,MIDDLE_TIP,MIDDLE_PIP)&&extended(lm,RING_TIP,RING_PIP)&&extended(lm,PINKY_TIP,PINKY_PIP);
export const isFist=(lm)=>!extended(lm,INDEX_TIP,INDEX_PIP)&&!extended(lm,MIDDLE_TIP,MIDDLE_PIP)&&!extended(lm,RING_TIP,RING_PIP)&&!extended(lm,PINKY_TIP,PINKY_PIP);
export const pinchStrength=(lm)=>dist(lm[THUMB_TIP],lm[INDEX_TIP])/span(lm);
export const isPinch=(lm)=>pinchStrength(lm)<0.38;
export const pointer=(lm)=>({x:lm[INDEX_TIP].x,y:lm[INDEX_TIP].y});

export class GestureEngine {
  constructor({onEvent=()=>{}}={}) {
    this.onEvent=onEvent; this.last=performance.now(); this.lastPoint=null;
    this.mode='idle'; this.candidate=null; this.candidateAt=0; this.clickCount=0; this.lastClickAt=0;
    this.hold=''; this.holdAt=0; this.drag=false;
  }
  emit(type,data={}) { this.onEvent({type,at:Date.now(),...data}); }
  update(lm,now=performance.now()) {
    if(!lm){ this.mode='idle'; this.lastPoint=null; this.hold=''; if(this.drag){this.emit('drag_end');this.drag=false;} return; }
    const p=pointer(lm); const pinch=isPinch(lm), point=isPoint(lm), open=isOpen(lm), fist=isFist(lm);
    if(point || pinch) this.moveCursor(p,now);
    if(pinch){ if(!this.drag){this.drag=true;this.emit('drag_start',{x:p.x,y:p.y});} else this.emit('drag_move',{x:p.x,y:p.y}); }
    else if(this.drag){this.drag=false;this.emit('drag_end',{x:p.x,y:p.y});}
    if(point && !pinch) this.handleTapKnock(lm,now);
    else if(open) this.handleHold('home',now);
    else if(fist) this.handleHold('back',now);
    else { this.hold=''; }
    if(this.lastPoint && !pinch){
      const dy=p.y-this.lastPoint.y;
      if(Math.abs(dy)>0.018 && (point||open)) this.emit('scroll',{delta:-dy});
    }
    this.lastPoint=p; this.last=now;
  }
  moveCursor(p,now){
    if(!this.cursor){this.cursor=p;this.emit('cursor_move',p);return;}
    const a=.32; this.cursor={x:this.cursor.x+(p.x-this.cursor.x)*a,y:this.cursor.y+(p.y-this.cursor.y)*a}; this.emit('cursor_move',this.cursor);
  }
  handleTapKnock(lm,now){
    const index=lm[INDEX_TIP], pip=lm[INDEX_PIP];
    const flex=dist(index,lm[WRIST])<dist(pip,lm[WRIST])*1.08;
    if(flex && this.candidate!=='knock'){
      this.candidate='knock';
      if(now-this.lastClickAt<360){this.clickCount=2;this.emit('right_click');this.clickCount=0;}
      else {this.clickCount=1;this.lastClickAt=now;setTimeout(()=>{if(this.clickCount===1){this.emit('left_click');this.clickCount=0;}},360);}
    }
    if(!flex) this.candidate=null;
  }
  handleHold(action,now){
    if(this.hold!==action){this.hold=action;this.holdAt=now;return;}
    if(now-this.holdAt>700){this.emit(action);this.hold='fired:'+action;}
  }
}

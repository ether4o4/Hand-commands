const WRIST=0, THUMB_TIP=4, INDEX_TIP=8, INDEX_PIP=6, MIDDLE_TIP=12, MIDDLE_PIP=10, RING_TIP=16, RING_PIP=14, PINKY_TIP=20, PINKY_PIP=18;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const extended=(lm,tip,pip)=>dist(lm[tip],lm[WRIST])>dist(lm[pip],lm[WRIST])*1.12;
export const isPoint=(lm)=>extended(lm,INDEX_TIP,INDEX_PIP)&&!extended(lm,MIDDLE_TIP,MIDDLE_PIP)&&!extended(lm,RING_TIP,RING_PIP)&&!extended(lm,PINKY_TIP,PINKY_PIP);
export const isOpen=(lm)=>extended(lm,INDEX_TIP,INDEX_PIP)&&extended(lm,MIDDLE_TIP,MIDDLE_PIP)&&extended(lm,RING_TIP,RING_PIP)&&extended(lm,PINKY_TIP,PINKY_PIP);
export const isFist=(lm)=>!extended(lm,INDEX_TIP,INDEX_PIP)&&!extended(lm,MIDDLE_TIP,MIDDLE_PIP)&&!extended(lm,RING_TIP,RING_PIP)&&!extended(lm,PINKY_TIP,PINKY_PIP);
export const pinchStrength=(lm)=>dist(lm[THUMB_TIP],lm[INDEX_TIP])/Math.max(dist(lm[WRIST],lm[9]),0.0001);
export const isPinch=(lm)=>pinchStrength(lm)<0.38;
export const pointer=(lm)=>({x:lm[INDEX_TIP].x,y:lm[INDEX_TIP].y});

export class GestureEngine {
  constructor({onEvent=()=>{}}={}) {
    this.onEvent=onEvent; this.lastPoint=null; this.cursor=null; this.wasPoint=false;
    this.knockArmed=true; this.clickCount=0; this.lastClickAt=0; this.hold=''; this.holdAt=0; this.drag=false;
    this.aimStartedAt=0; this.aimAnchor=null; this.aimLocked=false;
    this.pointDwellMs=700; this.pointStableRadius=0.035;
  }
  emit(type,data={}){this.onEvent({type,at:Date.now(),...data});}
  update(lm,now=performance.now()){
    if(!lm){this.lastPoint=null;this.wasPoint=false;this.hold='';this.knockArmed=true;this.resetAim();if(this.drag){this.drag=false;this.emit('drag_end');}return;}
    const p=pointer(lm), pinch=isPinch(lm), point=isPoint(lm), open=isOpen(lm), fist=isFist(lm);
    if(point||pinch)this.moveCursor(p);
    if(pinch){this.resetAim();if(!this.drag){this.drag=true;this.emit('drag_start',p);}else this.emit('drag_move',p);}
    else if(this.drag){this.drag=false;this.emit('drag_end',p);}

    // Pointing is an aim state. A stable point for 700 ms selects the target.
    if(point&&!pinch)this.updateAim(p,now);else this.resetAim();

    const flex=dist(lm[INDEX_TIP],lm[WRIST])<dist(lm[INDEX_PIP],lm[WRIST])*1.08;
    if(this.wasPoint&&flex&&this.knockArmed&&!pinch){
      this.knockArmed=false;
      if(now-this.lastClickAt<360){this.emit('right_click');this.clickCount=0;}
      else{this.clickCount=1;this.lastClickAt=now;setTimeout(()=>{if(this.clickCount===1){this.emit('left_click');this.clickCount=0;}},360);}
    }
    if(!flex)this.knockArmed=true;
    if(open)this.handleHold('home',now);else if(fist)this.handleHold('back',now);else if(!point)this.hold='';
    if(this.lastPoint&&!pinch){const dy=p.y-this.lastPoint.y;if(Math.abs(dy)>.018&&(point||open))this.emit('scroll',{delta:-dy});}
    this.lastPoint=p;this.wasPoint=point;
  }
  updateAim(p,now){
    if(!this.aimAnchor){this.aimAnchor={...p};this.aimStartedAt=now;this.aimLocked=false;this.emit('aim_start',p);return;}
    if(dist(p,this.aimAnchor)>this.pointStableRadius){this.aimAnchor={...p};this.aimStartedAt=now;this.aimLocked=false;this.emit('aim_move',p);return;}
    const elapsed=now-this.aimStartedAt;
    if(!this.aimLocked&&elapsed>=this.pointDwellMs){this.aimLocked=true;this.emit('point_select',{x:p.x,y:p.y,dwell_ms:elapsed});}
    else if(!this.aimLocked)this.emit('aim_progress',{x:p.x,y:p.y,progress:Math.min(1,elapsed/this.pointDwellMs)});
  }
  resetAim(){if(this.aimStartedAt||this.aimLocked)this.emit('aim_cancel');this.aimStartedAt=0;this.aimAnchor=null;this.aimLocked=false;}
  moveCursor(p){if(!this.cursor)this.cursor={...p};else{const a=.32;this.cursor={x:this.cursor.x+(p.x-this.cursor.x)*a,y:this.cursor.y+(p.y-this.cursor.y)*a};}this.emit('cursor_move',this.cursor);}
  handleHold(action,now){if(this.hold!==action){this.hold=action;this.holdAt=now;return;}if(now-this.holdAt>700){this.emit(action);this.hold='fired:'+action;}}
}

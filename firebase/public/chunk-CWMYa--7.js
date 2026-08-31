import {E as Ej,q,g,x as xm$1,S as So$1,N as Nv$1,a as xv$1,R as Rs$1,A as Al$1,w as ww$1,O as Ol$1,W as Ws$1,U as UC,l as ll$1,b as xl,V as VC,Y as Ys$1,c as qg$1,t as tw$1,D as Dj,d as Ov$1,m as mh$1,I as It,r as rE,L as La$1,e as m,v,f as g$1,h as I,i as b,j as Os$1,k as O$1,n as k,o as m$1,p as D,s as xI,u as rm$1,P as Pg,y as kI,C as Ct,z as ta$1,F as Fl$1,B as jl$1,G as Yg$1,Z as ZC,H as Pl$1,J as Rw$1,K as ge,M as re,Q as Fr$1,T as ft,X as dr$1,_ as Z,$ as kv$1,a0 as E$1,a1 as f,a2 as S$1,a3 as h,a4 as R,a5 as C,a6 as we,a7 as kg$1,a8 as Y,a9 as v$1,aa as Gs$1,ab as qr$1,ac as Fe,ad as Mn,ae as xg$1,af as Qg$1,ag as pe$1,ah as $s$1,ai as Tn$1,aj as Aw$1,ak as TC,al as JC,am as bo$1,an as XC,ao as To$1,ap as Ug$1,aq as Hg$1,ar as Nn,as as Fi,at as wj,au as nw$1,av as zt,aw as HC,ax as D$1,ay as X,az as ro$1,aA as vr$1,aB as wn$1,aC as me,aD as Rn,aE as Jy$1,aF as J,aG as ee,aH as nl$1,aI as ea$1,aJ as Vg$1,aK as $g$1,aL as zg$1,aM as w$1,aN as Ij,aO as IS$1,aP as Gg$1,aQ as Hr$1,aR as x,aS as Gt,aT as Dy$1,aU as Tw$1,aV as Qf$1,aW as Kf$1,aX as Zs$1,aY as x$1,aZ as oo$1,a_ as lH,a$ as Sj,b0 as Sn$1,b1 as A,b2 as mr$1,b3 as K,b4 as py$1,b5 as ie,b6 as yy$1,b7 as gy$1,b8 as BC,b9 as hy$1,ba as z,bb as Ve,bc as wt,bd as sc$1,be as nE,bf as jg$1,bg as xw$1,bh as om$1}from'./main-ZJM5QBW2.js';import {S,M,b as b$1,E,j,w,N,B}from'./chunk-CuJ0AuVa.js';var Og={sm:"w-1",md:"w-2",lg:"w-3"},Ca=class i{size=Ct("md");hideOnMobile=Ct(false,{transform:ta$1});hostClasses=It(()=>["shrink-0",this.hideOnMobile()?"hidden sm:inline-block":"inline-block",Og[this.size()]].join(" "));static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-spacer"]],hostAttrs:["aria-hidden","true"],hostVars:2,hostBindings:function(t,n){t&2&&Fl$1(n.hostClasses());},inputs:{size:[1,"size"],hideOnMobile:[1,"hideOnMobile"]},decls:0,vars:0,template:function(t,n){},encapsulation:2})};var go=class{_attachedHost=null;attach(e){return this._attachedHost=e,e.attach(this)}detach(){let e=this._attachedHost;e!=null&&(this._attachedHost=null,e.detach());}get isAttached(){return this._attachedHost!=null}setAttachedHost(e){this._attachedHost=e;}},ds=class extends go{component;viewContainerRef;injector;projectableNodes;bindings;directives;constructor(e,t,n,r,s,o){super(),this.component=e,this.viewContainerRef=t,this.injector=n,this.projectableNodes=r,this.bindings=s||null,this.directives=o||null;}},Ar=class extends go{templateRef;viewContainerRef;context;injector;constructor(e,t,n,r){super(),this.templateRef=e,this.viewContainerRef=t,this.context=n,this.injector=r;}get origin(){return this.templateRef.elementRef}attach(e,t=this.context){return this.context=t,super.attach(e)}detach(){return this.context=void 0,super.detach()}},Au=class extends go{element;constructor(e){super(),this.element=e instanceof zt?e.nativeElement:e;}},hs=class{_attachedPortal=null;_disposeFn=null;_isDisposed=false;hasAttached(){return !!this._attachedPortal}attach(e){if(e instanceof ds)return this._attachedPortal=e,this.attachComponentPortal(e);if(e instanceof Ar)return this._attachedPortal=e,this.attachTemplatePortal(e);if(this.attachDomPortal&&e instanceof Au)return this._attachedPortal=e,this.attachDomPortal(e)}attachDomPortal=null;detach(){this._attachedPortal&&(this._attachedPortal.setAttachedHost(null),this._attachedPortal=null),this._invokeDisposeFn();}dispose(){this.hasAttached()&&this.detach(),this._invokeDisposeFn(),this._isDisposed=true;}setDisposeFn(e){this._disposeFn=e;}_invokeDisposeFn(){this._disposeFn&&(this._disposeFn(),this._disposeFn=null);}},Ea=class extends hs{outletElement;_appRef;_defaultInjector;constructor(e,t,n){super(),this.outletElement=e,this._appRef=t,this._defaultInjector=n;}attachComponentPortal(e){let t;if(e.viewContainerRef){let n=e.injector||e.viewContainerRef.injector,r=n.get(Sn$1,null,{optional:true})||void 0;t=e.viewContainerRef.createComponent(e.component,{index:e.viewContainerRef.length,injector:n,ngModuleRef:r,projectableNodes:e.projectableNodes||void 0,bindings:e.bindings||void 0,directives:e.directives||void 0}),this.setDisposeFn(()=>t.destroy());}else {let n=this._appRef,r=e.injector||this._defaultInjector||ge.NULL,s=r.get(J,n.injector);t=Sj(e.component,{elementInjector:r,environmentInjector:s,projectableNodes:e.projectableNodes||void 0,bindings:e.bindings||void 0,directives:e.directives||void 0}),n.attachView(t.hostView),this.setDisposeFn(()=>{n.viewCount>0&&n.detachView(t.hostView),t.destroy();});}return this.outletElement.appendChild(this._getComponentRootNode(t)),this._attachedPortal=e,t}attachTemplatePortal(e){let t=e.viewContainerRef,n=t.createEmbeddedView(e.templateRef,e.context,{injector:e.injector});return n.rootNodes.forEach(r=>this.outletElement.appendChild(r)),n.detectChanges(),this.setDisposeFn(()=>{let r=t.indexOf(n);r!==-1&&t.remove(r);}),this._attachedPortal=e,n}attachDomPortal=e=>{let t=e.element;t.parentNode;let n=this.outletElement.ownerDocument.createComment("dom-portal");t.parentNode.insertBefore(n,t),this.outletElement.appendChild(t),this._attachedPortal=e,super.setDisposeFn(()=>{n.parentNode&&n.parentNode.replaceChild(t,n);});};dispose(){super.dispose(),this.outletElement.remove();}_getComponentRootNode(e){return e.hostView.rootNodes[0]}};var Ru=(()=>{class i extends hs{_moduleRef=g(Sn$1,{optional:true});_document=g(X);_viewContainerRef=g(Gt);_isInitialized=false;_attachedRef=null;get portal(){return this._attachedPortal}set portal(t){this.hasAttached()&&!t&&!this._isInitialized||(this.hasAttached()&&super.detach(),t&&super.attach(t),this._attachedPortal=t||null);}attached=new pe$1;get attachedRef(){return this._attachedRef}ngOnInit(){this._isInitialized=true;}ngOnDestroy(){super.dispose(),this._attachedRef=this._attachedPortal=null;}attachComponentPortal(t){t.setAttachedHost(this);let n=t.viewContainerRef!=null?t.viewContainerRef:this._viewContainerRef,r=n.createComponent(t.component,{index:n.length,injector:t.injector||n.injector,projectableNodes:t.projectableNodes||void 0,ngModuleRef:this._moduleRef||void 0,bindings:t.bindings||void 0,directives:t.directives||void 0});return n!==this._viewContainerRef&&this._getRootNode().appendChild(r.hostView.rootNodes[0]),super.setDisposeFn(()=>r.destroy()),this._attachedPortal=t,this._attachedRef=r,this.attached.emit(r),r}attachTemplatePortal(t){t.setAttachedHost(this);let n=this._viewContainerRef.createEmbeddedView(t.templateRef,t.context,{injector:t.injector});return super.setDisposeFn(()=>this._viewContainerRef.clear()),this._attachedPortal=t,this._attachedRef=n,this.attached.emit(n),n}attachDomPortal=t=>{let n=t.element;n.parentNode;let r=this._document.createComment("dom-portal");t.setAttachedHost(this),n.parentNode.insertBefore(r,n),this._getRootNode().appendChild(n),this._attachedPortal=t,super.setDisposeFn(()=>{r.parentNode&&r.parentNode.replaceChild(n,r);});};_getRootNode(){let t=this._viewContainerRef.element.nativeElement;return t.nodeType===t.ELEMENT_NODE?t:t.parentNode}static \u0275fac=(()=>{let t;return function(r){return (t||(t=Os$1(i)))(r||i)}})();static \u0275dir=Mn({type:i,selectors:[["","cdkPortalOutlet",""]],inputs:{portal:[0,"cdkPortalOutlet","portal"]},outputs:{attached:"attached"},exportAs:["cdkPortalOutlet"],features:[xg$1]})}return i})(),Iu=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({})}return i})();function vp(i){return i.buttons===0||i.detail===0}function yp(i){let e=i.touches&&i.touches[0]||i.changedTouches&&i.changedTouches[0];return !!e&&e.identifier===-1&&(e.radiusX==null||e.radiusX===1)&&(e.radiusY==null||e.radiusY===1)}var Du;function kg(){if(Du==null){let i=typeof document<"u"?document.head:null;Du=!!(i&&(i.createShadowRoot||i.attachShadow));}return Du}function bp(i){if(kg()){let e=i.getRootNode?i.getRootNode():null;if(typeof ShadowRoot<"u"&&ShadowRoot&&e instanceof ShadowRoot)return e}return null}function ps(){let i=typeof document<"u"&&document?document.activeElement:null;for(;i&&i.shadowRoot;){let e=i.shadowRoot.activeElement;if(e===i)break;i=e;}return i}function Mi(i){if(i.composedPath)try{return i.composedPath()[0]}catch{}return i.target}var Pu;try{Pu=typeof Intl<"u"&&Intl.v8BreakIterator;}catch{Pu=false;}var In=(()=>{class i{_platformId=g(oo$1);isBrowser=this._platformId?lH(this._platformId):typeof document=="object"&&!!document;EDGE=this.isBrowser&&/(edge)/i.test(navigator.userAgent);TRIDENT=this.isBrowser&&/(msie|trident)/i.test(navigator.userAgent);BLINK=this.isBrowser&&!!(window.chrome||Pu)&&typeof CSS<"u"&&!this.EDGE&&!this.TRIDENT;WEBKIT=this.isBrowser&&/AppleWebKit/i.test(navigator.userAgent)&&!this.BLINK&&!this.EDGE&&!this.TRIDENT;IOS=this.isBrowser&&/iPad|iPhone|iPod/.test(navigator.userAgent)&&!("MSStream"in window);FIREFOX=this.isBrowser&&/(firefox|minefield)/i.test(navigator.userAgent);ANDROID=this.isBrowser&&/android/i.test(navigator.userAgent)&&!this.TRIDENT;SAFARI=this.isBrowser&&/safari/i.test(navigator.userAgent)&&this.WEBKIT;static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var _o;function Ug(){if(_o==null&&typeof window<"u")try{window.addEventListener("test",null,Object.defineProperty({},"passive",{get:()=>_o=!0}));}finally{_o=_o||false;}return _o}function xp(i){return Ug()?i:!!i.capture}function fs(i){return i instanceof zt?i.nativeElement:i}var Bg=new D("cdk-input-modality-detector-options"),Vg={ignoreKeys:[18,17,224,91,16]},Mp=650,Nu={passive:true,capture:true},zg=(()=>{class i{_platform=g(In);_listenerCleanups;modalityDetected;modalityChanged;get mostRecentModality(){return this._modality.value}_mostRecentTarget=null;_modality=new ie(null);_options;_lastTouchMs=0;_onKeydown=t=>{this._options?.ignoreKeys?.some(n=>n===t.keyCode)||(this._modality.next("keyboard"),this._mostRecentTarget=Mi(t));};_onMousedown=t=>{Date.now()-this._lastTouchMs<Mp||(this._modality.next(vp(t)?"keyboard":"mouse"),this._mostRecentTarget=Mi(t));};_onTouchstart=t=>{if(yp(t)){this._modality.next("keyboard");return}this._lastTouchMs=Date.now(),this._modality.next("touch"),this._mostRecentTarget=Mi(t);};constructor(){let t=g(me),n=g(X),r=g(Bg,{optional:true});if(this._options=m$1(m$1({},Vg),r),this.modalityDetected=this._modality.pipe(yy$1(1)),this.modalityChanged=this.modalityDetected.pipe(gy$1()),this._platform.isBrowser){let s=g(wn$1).createRenderer(null,null);this._listenerCleanups=t.runOutsideAngular(()=>[s.listen(n,"keydown",this._onKeydown,Nu),s.listen(n,"mousedown",this._onMousedown,Nu),s.listen(n,"touchstart",this._onTouchstart,Nu)]);}}ngOnDestroy(){this._modality.complete(),this._listenerCleanups?.forEach(t=>t());}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),Aa=(function(i){return i[i.IMMEDIATE=0]="IMMEDIATE",i[i.EVENTUAL=1]="EVENTUAL",i})(Aa||{}),Hg=new D("cdk-focus-monitor-default-options"),Ta=xp({passive:true,capture:true}),Sp=(()=>{class i{_ngZone=g(me);_platform=g(In);_inputModalityDetector=g(zg);_origin=null;_lastFocusOrigin=null;_windowFocused=false;_windowFocusTimeoutId;_originTimeoutId;_originFromTouchInteraction=false;_elementInfo=new Map;_monitoredElementCount=0;_rootNodeFocusListenerCount=new Map;_detectionMode;_windowFocusListener=()=>{this._windowFocused=true,this._windowFocusTimeoutId=setTimeout(()=>this._windowFocused=false);};_document=g(X);_stopInputModalityDetector=new re;constructor(){let t=g(Hg,{optional:true});this._detectionMode=t?.detectionMode||Aa.IMMEDIATE;}_rootNodeFocusAndBlurListener=t=>{let n=Mi(t);for(let r=n;r;r=r.parentElement)t.type==="focus"?this._onFocus(t,r):this._onBlur(t,r);};monitor(t,n=false){let r=fs(t);if(!this._platform.isBrowser||r.nodeType!==1)return A();let s=bp(r)||this._document,o=this._elementInfo.get(r);if(o)return n&&(o.checkChildren=true),o.subject;let a={checkChildren:n,subject:new re,rootNode:s};return this._elementInfo.set(r,a),this._registerGlobalListeners(a),a.subject}stopMonitoring(t){let n=fs(t),r=this._elementInfo.get(n);r&&(r.subject.complete(),this._setClasses(n),this._elementInfo.delete(n),this._removeGlobalListeners(r));}focusVia(t,n,r){let s=fs(t),o=this._document.activeElement;s===o?this._getClosestElementsInfo(s).forEach(([a,l])=>this._originChanged(a,n,l)):(this._setOrigin(n),typeof s.focus=="function"&&s.focus(r));}ngOnDestroy(){this._elementInfo.forEach((t,n)=>this.stopMonitoring(n));}_getWindow(){return this._document.defaultView||window}_getFocusOrigin(t){return this._origin?this._originFromTouchInteraction?this._shouldBeAttributedToTouch(t)?"touch":"program":this._origin:this._windowFocused&&this._lastFocusOrigin?this._lastFocusOrigin:t&&this._isLastInteractionFromInputLabel(t)?"mouse":"program"}_shouldBeAttributedToTouch(t){return this._detectionMode===Aa.EVENTUAL||!!t?.contains(this._inputModalityDetector._mostRecentTarget)}_setClasses(t,n){t.classList.toggle("cdk-focused",!!n),t.classList.toggle("cdk-touch-focused",n==="touch"),t.classList.toggle("cdk-keyboard-focused",n==="keyboard"),t.classList.toggle("cdk-mouse-focused",n==="mouse"),t.classList.toggle("cdk-program-focused",n==="program");}_setOrigin(t,n=false){this._ngZone.runOutsideAngular(()=>{if(this._origin=t,this._originFromTouchInteraction=t==="touch"&&n,this._detectionMode===Aa.IMMEDIATE){clearTimeout(this._originTimeoutId);let r=this._originFromTouchInteraction?Mp:1;this._originTimeoutId=setTimeout(()=>this._origin=null,r);}});}_onFocus(t,n){let r=this._elementInfo.get(n),s=Mi(t);!r||!r.checkChildren&&n!==s||this._originChanged(n,this._getFocusOrigin(s),r);}_onBlur(t,n){let r=this._elementInfo.get(n);!r||r.checkChildren&&t.relatedTarget instanceof Node&&n.contains(t.relatedTarget)||(this._setClasses(n),this._emitOrigin(r,null));}_emitOrigin(t,n){t.subject.observers.length&&this._ngZone.run(()=>t.subject.next(n));}_registerGlobalListeners(t){if(!this._platform.isBrowser)return;let n=t.rootNode,r=this._rootNodeFocusListenerCount.get(n)||0;r||this._ngZone.runOutsideAngular(()=>{n.addEventListener("focus",this._rootNodeFocusAndBlurListener,Ta),n.addEventListener("blur",this._rootNodeFocusAndBlurListener,Ta);}),this._rootNodeFocusListenerCount.set(n,r+1),++this._monitoredElementCount===1&&(this._ngZone.runOutsideAngular(()=>{this._getWindow().addEventListener("focus",this._windowFocusListener);}),this._inputModalityDetector.modalityDetected.pipe(Hr$1(this._stopInputModalityDetector)).subscribe(s=>{this._setOrigin(s,true);}));}_removeGlobalListeners(t){let n=t.rootNode;if(this._rootNodeFocusListenerCount.has(n)){let r=this._rootNodeFocusListenerCount.get(n);r>1?this._rootNodeFocusListenerCount.set(n,r-1):(n.removeEventListener("focus",this._rootNodeFocusAndBlurListener,Ta),n.removeEventListener("blur",this._rootNodeFocusAndBlurListener,Ta),this._rootNodeFocusListenerCount.delete(n));}--this._monitoredElementCount||(this._getWindow().removeEventListener("focus",this._windowFocusListener),this._stopInputModalityDetector.next(),clearTimeout(this._windowFocusTimeoutId),clearTimeout(this._originTimeoutId));}_originChanged(t,n,r){this._setClasses(t,n),this._emitOrigin(r,n),this._lastFocusOrigin=n;}_getClosestElementsInfo(t){let n=[];return this._elementInfo.forEach((r,s)=>{(s===t||r.checkChildren&&s.contains(t))&&n.push([s,r]);}),n}_isLastInteractionFromInputLabel(t){let{_mostRecentTarget:n,mostRecentModality:r}=this._inputModalityDetector;if(r!=="mouse"||!n||n===t||t.nodeName!=="INPUT"&&t.nodeName!=="TEXTAREA"||t.disabled)return  false;let s=t.labels;if(s){for(let o=0;o<s.length;o++)if(s[o].contains(n))return  true}return  false}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var Ra=new WeakMap,vo=(()=>{class i{_appRef;_injector=g(ge);_environmentInjector=g(J);load(t){let n=this._appRef=this._appRef||this._injector.get(vr$1),r=Ra.get(n);r||(r={loaders:new Set,refs:[]},Ra.set(n,r),n.onDestroy(()=>{Ra.get(n)?.refs.forEach(s=>s.destroy()),Ra.delete(n);})),r.loaders.has(t)||(r.loaders.add(t),r.refs.push(Sj(t,{environmentInjector:this._environmentInjector})));}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var wp=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275cmp=So$1({type:i,selectors:[["ng-component"]],exportAs:["cdkVisuallyHidden"],decls:0,vars:0,template:function(n,r){},styles:[`.cdk-visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
  outline: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  left: 0;
}
[dir=rtl] .cdk-visually-hidden {
  left: auto;
  right: 0;
}
`],encapsulation:2})}return i})();function Fu(i){return Array.isArray(i)?i:[i]}var Ou=(()=>{class i{_platform=g(In);isDisabled(t){return t.hasAttribute("disabled")}isVisible(t){return Wg(t)&&getComputedStyle(t).visibility==="visible"}isTabbable(t){if(!this._platform.isBrowser)return  false;let n=Gg(Jg(t));if(n&&(Cp(n)===-1||!this.isVisible(n)))return  false;let r=t.nodeName.toLowerCase(),s=Cp(t);return t.hasAttribute("contenteditable")?s!==-1:r==="iframe"||r==="object"||this._platform.WEBKIT&&this._platform.IOS&&!Zg(t)?false:r==="audio"?t.hasAttribute("controls")?s!==-1:false:r==="video"?s===-1?false:s!==null?true:this._platform.FIREFOX||t.hasAttribute("controls"):t.tabIndex>=0}isFocusable(t,n){return Kg(t)&&!this.isDisabled(t)&&(n?.ignoreVisibility||this.isVisible(t))}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();function Gg(i){try{return i.frameElement}catch{return null}}function Wg(i){return !!(i.offsetWidth||i.offsetHeight||typeof i.getClientRects=="function"&&i.getClientRects().length)}function Xg(i){let e=i.nodeName.toLowerCase();return e==="input"||e==="select"||e==="button"||e==="textarea"}function qg(i){return $g(i)&&i.type=="hidden"}function Yg(i){return jg(i)&&i.hasAttribute("href")}function $g(i){return i.nodeName.toLowerCase()=="input"}function jg(i){return i.nodeName.toLowerCase()=="a"}function Ep(i){if(!i.hasAttribute("tabindex")||i.tabIndex===void 0)return  false;let e=i.getAttribute("tabindex");return !!(e&&!isNaN(parseInt(e,10)))}function Cp(i){if(!Ep(i))return null;let e=parseInt(i.getAttribute("tabindex")||"",10);return isNaN(e)?-1:e}function Zg(i){let e=i.nodeName.toLowerCase(),t=e==="input"&&i.type;return t==="text"||t==="password"||e==="select"||e==="textarea"}function Kg(i){return qg(i)?false:Xg(i)||Yg(i)||i.hasAttribute("contenteditable")||Ep(i)}function Jg(i){return i.ownerDocument&&i.ownerDocument.defaultView||window}var Lu=class{_element;_checker;_ngZone;_document;_injector;_startAnchor=null;_endAnchor=null;_hasAttached=false;startAnchorListener=()=>this.focusLastTabbableElement();endAnchorListener=()=>this.focusFirstTabbableElement();get enabled(){return this._enabled}set enabled(e){this._enabled=e,this._startAnchor&&this._endAnchor&&(this._toggleAnchorTabIndex(e,this._startAnchor),this._toggleAnchorTabIndex(e,this._endAnchor));}_enabled=true;constructor(e,t,n,r,s=false,o){this._element=e,this._checker=t,this._ngZone=n,this._document=r,this._injector=o,s||this.attachAnchors();}destroy(){let e=this._startAnchor,t=this._endAnchor;e&&(e.removeEventListener("focus",this.startAnchorListener),e.remove()),t&&(t.removeEventListener("focus",this.endAnchorListener),t.remove()),this._startAnchor=this._endAnchor=null,this._hasAttached=false;}attachAnchors(){return this._hasAttached?true:(this._ngZone.runOutsideAngular(()=>{this._startAnchor||(this._startAnchor=this._createAnchor(),this._startAnchor.addEventListener("focus",this.startAnchorListener)),this._endAnchor||(this._endAnchor=this._createAnchor(),this._endAnchor.addEventListener("focus",this.endAnchorListener));}),this._element.parentNode&&(this._element.parentNode.insertBefore(this._startAnchor,this._element),this._element.parentNode.insertBefore(this._endAnchor,this._element.nextSibling),this._hasAttached=true),this._hasAttached)}focusInitialElementWhenReady(e){return new Promise(t=>{this._executeOnStable(()=>t(this.focusInitialElement(e)));})}focusFirstTabbableElementWhenReady(e){return new Promise(t=>{this._executeOnStable(()=>t(this.focusFirstTabbableElement(e)));})}focusLastTabbableElementWhenReady(e){return new Promise(t=>{this._executeOnStable(()=>t(this.focusLastTabbableElement(e)));})}_getRegionBoundary(e){let t=this._element.querySelectorAll(`[cdk-focus-region-${e}], [cdkFocusRegion${e}], [cdk-focus-${e}]`);return e=="start"?t.length?t[0]:this._getFirstTabbableElement(this._element):t.length?t[t.length-1]:this._getLastTabbableElement(this._element)}focusInitialElement(e){let t=this._element.querySelector("[cdk-focus-initial], [cdkFocusInitial]");if(t){if(!this._checker.isFocusable(t)){let n=this._getFirstTabbableElement(t);return n?.focus(e),!!n}return t.focus(e),true}return this.focusFirstTabbableElement(e)}focusFirstTabbableElement(e){let t=this._getRegionBoundary("start");return t&&t.focus(e),!!t}focusLastTabbableElement(e){let t=this._getRegionBoundary("end");return t&&t.focus(e),!!t}hasAttached(){return this._hasAttached}_getFirstTabbableElement(e){if(this._checker.isFocusable(e)&&this._checker.isTabbable(e))return e;let t=e.children;for(let n=0;n<t.length;n++){let r=t[n].nodeType===this._document.ELEMENT_NODE?this._getFirstTabbableElement(t[n]):null;if(r)return r}return null}_getLastTabbableElement(e){if(this._checker.isFocusable(e)&&this._checker.isTabbable(e))return e;let t=e.children;for(let n=t.length-1;n>=0;n--){let r=t[n].nodeType===this._document.ELEMENT_NODE?this._getLastTabbableElement(t[n]):null;if(r)return r}return null}_createAnchor(){let e=this._document.createElement("div");return this._toggleAnchorTabIndex(this._enabled,e),e.classList.add("cdk-visually-hidden"),e.classList.add("cdk-focus-trap-anchor"),e.setAttribute("aria-hidden","true"),e}_toggleAnchorTabIndex(e,t){e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex");}toggleAnchors(e){this._startAnchor&&this._endAnchor&&(this._toggleAnchorTabIndex(e,this._startAnchor),this._toggleAnchorTabIndex(e,this._endAnchor));}_executeOnStable(e){nl$1(e,{injector:this._injector});}},Ia=(()=>{class i{_checker=g(Ou);_ngZone=g(me);_document=g(X);_injector=g(ge);constructor(){g(vo).load(wp);}create(t,n=false){return new Lu(t,this._checker,this._ngZone,this._document,n,this._injector)}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),ku=(()=>{class i{_elementRef=g(zt);_focusTrapFactory=g(Ia);focusTrap=void 0;_previouslyFocusedElement=null;get enabled(){return this.focusTrap?.enabled||false}set enabled(t){this.focusTrap&&(this.focusTrap.enabled=t);}autoCapture=false;constructor(){g(In).isBrowser&&(this.focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement,true));}ngOnDestroy(){this.focusTrap?.destroy(),this._previouslyFocusedElement&&(this._previouslyFocusedElement.focus(),this._previouslyFocusedElement=null);}ngAfterContentInit(){this.focusTrap?.attachAnchors(),this.autoCapture&&this._captureFocus();}ngDoCheck(){this.focusTrap&&!this.focusTrap.hasAttached()&&this.focusTrap.attachAnchors();}ngOnChanges(t){let n=t.autoCapture;n&&!n.firstChange&&this.autoCapture&&this.focusTrap?.hasAttached()&&this._captureFocus();}_captureFocus(){this._previouslyFocusedElement=ps(),this.focusTrap?.focusInitialElementWhenReady();}static \u0275fac=function(n){return new(n||i)};static \u0275dir=Mn({type:i,selectors:[["","cdkTrapFocus",""]],inputs:{enabled:[2,"cdkTrapFocus","enabled",ta$1],autoCapture:[2,"cdkTrapFocusAutoCapture","autoCapture",ta$1]},exportAs:["cdkTrapFocus"],features:[Tn$1]})}return i})();function Uu(){return typeof __karma__<"u"&&!!__karma__||typeof jasmine<"u"&&!!jasmine||typeof jest<"u"&&!!jest||typeof Mocha<"u"&&!!Mocha}function qt(i){return i==null?"":typeof i=="string"?i:`${i}px`}var Qg=new D("cdk-dir-doc",{providedIn:"root",factory:()=>g(X)}),e_=/^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;function t_(i){let e=i?.toLowerCase()||"";return e==="auto"&&typeof navigator<"u"&&navigator?.language?e_.test(navigator.language)?"rtl":"ltr":e==="rtl"?"rtl":"ltr"}var ms=(()=>{class i{get value(){return this.valueSignal()}valueSignal=q("ltr");change=new pe$1;constructor(){let t=g(Qg,{optional:true});if(t){let n=t.body?t.body.dir:null,r=t.documentElement?t.documentElement.dir:null;this.valueSignal.set(t_(n||r||"ltr"));}}ngOnDestroy(){this.change.complete();}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var Rr;function Tp(){if(Rr==null){if(typeof document!="object"||!document||typeof Element!="function"||!Element)return Rr=false,Rr;if(document.documentElement?.style&&"scrollBehavior"in document.documentElement.style)Rr=true;else {let i=Element.prototype.scrollTo;i?Rr=!/\{\s*\[native code\]\s*\}/.test(i.toString()):Rr=false;}}return Rr}var yo=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({})}return i})();var n_=20,Bu=(()=>{class i{_ngZone=g(me);_platform=g(In);_renderer=g(wn$1).createRenderer(null,null);_cleanupGlobalListener;_scrolled=new re;_scrolledCount=0;scrollContainers=new Map;register(t){this.scrollContainers.has(t)||this.scrollContainers.set(t,t.elementScrolled().subscribe(()=>this._scrolled.next(t)));}deregister(t){let n=this.scrollContainers.get(t);n&&(n.unsubscribe(),this.scrollContainers.delete(t));}scrolled(t=n_){return this._platform.isBrowser?new x(n=>{this._cleanupGlobalListener||(this._cleanupGlobalListener=this._ngZone.runOutsideAngular(()=>this._renderer.listen("document","scroll",()=>this._scrolled.next())));let r=t>0?this._scrolled.pipe(py$1(t)).subscribe(n):this._scrolled.subscribe(n);return this._scrolledCount++,()=>{r.unsubscribe(),this._scrolledCount--,this._scrolledCount||(this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0);}}):A()}ngOnDestroy(){this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0,this.scrollContainers.forEach((t,n)=>this.deregister(n)),this._scrolled.complete();}ancestorScrolled(t,n){let r=this.getAncestorScrollContainers(t);return this.scrolled(n).pipe(Ve(s=>!s||r.indexOf(s)>-1))}getAncestorScrollContainers(t){let n=[];return this.scrollContainers.forEach((r,s)=>{this._targetContainsElement(s,t)&&n.push(s);}),n}_targetContainsElement(t,n){let r=fs(n),s=t.getElementRef().nativeElement;do if(r==s)return  true;while(r=r.parentElement);return  false}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var i_=20,bo=(()=>{class i{_platform=g(In);_listeners;_viewportSize=null;_change=new re;_document=g(X);constructor(){let t=g(me),n=g(wn$1).createRenderer(null,null);t.runOutsideAngular(()=>{if(this._platform.isBrowser){let r=s=>this._change.next(s);this._listeners=[n.listen("window","resize",r),n.listen("window","orientationchange",r)];}this.change().subscribe(()=>this._viewportSize=null);});}ngOnDestroy(){this._listeners?.forEach(t=>t()),this._change.complete();}getViewportSize(){this._viewportSize||this._updateViewportSize();let t={width:this._viewportSize.width,height:this._viewportSize.height};return this._platform.isBrowser||(this._viewportSize=null),t}getViewportRect(){let t=this.getViewportScrollPosition(),{width:n,height:r}=this.getViewportSize();return {top:t.top,left:t.left,bottom:t.top+r,right:t.left+n,height:r,width:n}}getViewportScrollPosition(){if(!this._platform.isBrowser)return {top:0,left:0};let t=this._document,n=this._getWindow(),r=t.documentElement,s=r.getBoundingClientRect(),o=-s.top||t.body?.scrollTop||n.scrollY||r.scrollTop||0,a=-s.left||t.body?.scrollLeft||n.scrollX||r.scrollLeft||0;return {top:o,left:a}}change(t=i_){return t>0?this._change.pipe(py$1(t)):this._change}_getWindow(){return this._document.defaultView||window}_updateViewportSize(){let t=this._getWindow();this._viewportSize=this._platform.isBrowser?{width:t.innerWidth,height:t.innerHeight}:{width:0,height:0};}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var Ap=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({})}return i})(),Vu=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({imports:[yo,Ap,yo,Ap]})}return i})();var Rp=new Map,gs=class i{_appId=g(ro$1);static _infix=`a${Math.floor(Math.random()*1e5).toString()}`;getId(e,t=false){this._appId!=="ng"&&(e+=this._appId);let n=Rp.get(e);return n===void 0?n=0:n++,Rp.set(e,n),`${e}${t?i._infix+"-":""}${n}`}static \u0275fac=function(t){return new(t||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})};function Da(i,...e){return e.length?e.some(t=>i[t]):i.altKey||i.shiftKey||i.ctrlKey||i.metaKey}var Ip=Tp();function Ua(i){return new Pa(i.get(bo),i.get(X))}var Pa=class{_viewportRuler;_previousHTMLStyles={top:"",left:""};_previousScrollPosition;_isEnabled=false;_document;constructor(e,t){this._viewportRuler=e,this._document=t;}attach(){}enable(){if(this._canBeEnabled()){let e=this._document.documentElement;this._previousScrollPosition=this._viewportRuler.getViewportScrollPosition(),this._previousHTMLStyles.left=e.style.left||"",this._previousHTMLStyles.top=e.style.top||"",e.style.left=qt(-this._previousScrollPosition.left),e.style.top=qt(-this._previousScrollPosition.top),e.classList.add("cdk-global-scrollblock"),this._isEnabled=true;}}disable(){if(this._isEnabled){let e=this._document.documentElement,t=this._document.body,n=e.style,r=t.style,s=n.scrollBehavior||"",o=r.scrollBehavior||"";this._isEnabled=false,n.left=this._previousHTMLStyles.left,n.top=this._previousHTMLStyles.top,e.classList.remove("cdk-global-scrollblock"),Ip&&(n.scrollBehavior=r.scrollBehavior="auto"),window.scroll(this._previousScrollPosition.left,this._previousScrollPosition.top),Ip&&(n.scrollBehavior=s,r.scrollBehavior=o);}}_canBeEnabled(){if(this._document.documentElement.classList.contains("cdk-global-scrollblock")||this._isEnabled)return  false;let t=this._document.documentElement,n=this._viewportRuler.getViewportSize();return t.scrollHeight>n.height||t.scrollWidth>n.width}};function kp(i,e){return new Na(i.get(Bu),i.get(me),i.get(bo),e)}var Na=class{_scrollDispatcher;_ngZone;_viewportRuler;_config;_scrollSubscription=null;_overlayRef;_initialScrollPosition;constructor(e,t,n,r){this._scrollDispatcher=e,this._ngZone=t,this._viewportRuler=n,this._config=r;}attach(e){this._overlayRef,this._overlayRef=e;}enable(){if(this._scrollSubscription)return;let e=this._scrollDispatcher.scrolled(0).pipe(Ve(t=>!t||!this._overlayRef.overlayElement.contains(t.getElementRef().nativeElement)));this._config&&this._config.threshold&&this._config.threshold>1?(this._initialScrollPosition=this._viewportRuler.getViewportScrollPosition().top,this._scrollSubscription=e.subscribe(()=>{let t=this._viewportRuler.getViewportScrollPosition().top;Math.abs(t-this._initialScrollPosition)>this._config.threshold?this._detach():this._overlayRef.updatePosition();})):this._scrollSubscription=e.subscribe(this._detach);}disable(){this._scrollSubscription&&(this._scrollSubscription.unsubscribe(),this._scrollSubscription=null);}detach(){this.disable(),this._overlayRef=null;}_detach=()=>{this.disable(),this._overlayRef.hasAttached()&&this._ngZone.run(()=>this._overlayRef.detach());}};var xo=class{enable(){}disable(){}attach(){}};function zu(i,e){return e.some(t=>{let n=i.bottom<t.top,r=i.top>t.bottom,s=i.right<t.left,o=i.left>t.right;return n||r||s||o})}function Dp(i,e){return e.some(t=>{let n=i.top<t.top,r=i.bottom>t.bottom,s=i.left<t.left,o=i.right>t.right;return n||r||s||o})}function Gu(i,e){return new Fa(i.get(Bu),i.get(bo),i.get(me),e)}var Fa=class{_scrollDispatcher;_viewportRuler;_ngZone;_config;_scrollSubscription=null;_overlayRef;constructor(e,t,n,r){this._scrollDispatcher=e,this._viewportRuler=t,this._ngZone=n,this._config=r;}attach(e){this._overlayRef,this._overlayRef=e;}enable(){if(!this._scrollSubscription){let e=this._config?this._config.scrollThrottle:0;this._scrollSubscription=this._scrollDispatcher.scrolled(e).subscribe(()=>{if(this._overlayRef.updatePosition(),this._config&&this._config.autoClose){let t=this._overlayRef.overlayElement.getBoundingClientRect(),{width:n,height:r}=this._viewportRuler.getViewportSize();zu(t,[{width:n,height:r,bottom:r,right:n,top:0,left:0}])&&(this.disable(),this._ngZone.run(()=>this._overlayRef.detach()));}});}}disable(){this._scrollSubscription&&(this._scrollSubscription.unsubscribe(),this._scrollSubscription=null);}detach(){this.disable(),this._overlayRef=null;}},Up=(()=>{class i{_injector=g(ge);noop=()=>new xo;close=t=>kp(this._injector,t);block=()=>Ua(this._injector);reposition=t=>Gu(this._injector,t);static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),Dr=class{positionStrategy;scrollStrategy=new xo;panelClass="";hasBackdrop=false;backdropClass="cdk-overlay-dark-backdrop";disableAnimations;width;height;minWidth;minHeight;maxWidth;maxHeight;direction;disposeOnNavigation=false;usePopover;eventPredicate;constructor(e){if(e){let t=Object.keys(e);for(let n of t)e[n]!==void 0&&(this[n]=e[n]);}}};var La=class{connectionPair;scrollableViewProperties;constructor(e,t){this.connectionPair=e,this.scrollableViewProperties=t;}};var Bp=(()=>{class i{_attachedOverlays=[];_document=g(X);_isAttached=false;ngOnDestroy(){this.detach();}add(t){this.remove(t),this._attachedOverlays.push(t);}remove(t){let n=this._attachedOverlays.indexOf(t);n>-1&&this._attachedOverlays.splice(n,1),this._attachedOverlays.length===0&&this.detach();}canReceiveEvent(t,n,r){return r.observers.length<1?false:t.eventPredicate?t.eventPredicate(n):true}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),Vp=(()=>{class i extends Bp{_ngZone=g(me);_renderer=g(wn$1).createRenderer(null,null);_cleanupKeydown;add(t){super.add(t),this._isAttached||(this._ngZone.runOutsideAngular(()=>{this._cleanupKeydown=this._renderer.listen("body","keydown",this._keydownListener);}),this._isAttached=true);}detach(){this._isAttached&&(this._cleanupKeydown?.(),this._isAttached=false);}_keydownListener=t=>{let n=this._attachedOverlays;for(let r=n.length-1;r>-1;r--){let s=n[r];if(this.canReceiveEvent(s,t,s._keydownEvents)){this._ngZone.run(()=>s._keydownEvents.next(t));break}}};static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),zp=(()=>{class i extends Bp{_platform=g(In);_ngZone=g(me);_renderer=g(wn$1).createRenderer(null,null);_cursorOriginalValue;_cursorStyleIsSet=false;_pointerDownEventTarget=null;_cleanups;add(t){if(super.add(t),!this._isAttached){let n=this._document.body,r={capture:true},s=this._renderer;this._cleanups=this._ngZone.runOutsideAngular(()=>[s.listen(n,"pointerdown",this._pointerDownListener,r),s.listen(n,"click",this._clickListener,r),s.listen(n,"auxclick",this._clickListener,r),s.listen(n,"contextmenu",this._clickListener,r)]),this._platform.IOS&&!this._cursorStyleIsSet&&(this._cursorOriginalValue=n.style.cursor,n.style.cursor="pointer",this._cursorStyleIsSet=true),this._isAttached=true;}}detach(){this._isAttached&&(this._cleanups?.forEach(t=>t()),this._cleanups=void 0,this._platform.IOS&&this._cursorStyleIsSet&&(this._document.body.style.cursor=this._cursorOriginalValue,this._cursorStyleIsSet=false),this._isAttached=false);}_pointerDownListener=t=>{this._pointerDownEventTarget=Mi(t);};_clickListener=t=>{let n=Mi(t),r=t.type==="click"&&this._pointerDownEventTarget?this._pointerDownEventTarget:n;this._pointerDownEventTarget=null;let s=this._attachedOverlays.slice();for(let o=s.length-1;o>-1;o--){let a=s[o],l=a._outsidePointerEvents;if(!(!a.hasAttached()||!this.canReceiveEvent(a,t,l))){if(Pp(a.overlayElement,n)||Pp(a.overlayElement,r))break;this._ngZone?this._ngZone.run(()=>l.next(t)):l.next(t);}}};static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();function Pp(i,e){let t=typeof ShadowRoot<"u"&&ShadowRoot,n=e;for(;n;){if(n===i)return  true;n=t&&n instanceof ShadowRoot?n.host:n.parentNode;}return  false}var Hp=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275cmp=So$1({type:i,selectors:[["ng-component"]],hostAttrs:["cdk-overlay-style-loader",""],decls:0,vars:0,template:function(n,r){},styles:[`.cdk-overlay-container, .cdk-global-overlay-wrapper {
  pointer-events: none;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}

.cdk-overlay-container {
  position: fixed;
}
@layer cdk-overlay {
  .cdk-overlay-container {
    z-index: 1000;
  }
}
.cdk-overlay-container:empty {
  display: none;
}

.cdk-global-overlay-wrapper {
  display: flex;
  position: absolute;
}
@layer cdk-overlay {
  .cdk-global-overlay-wrapper {
    z-index: 1000;
  }
}

.cdk-overlay-pane {
  position: absolute;
  pointer-events: auto;
  box-sizing: border-box;
  display: flex;
  max-width: 100%;
  max-height: 100%;
}
@layer cdk-overlay {
  .cdk-overlay-pane {
    z-index: 1000;
  }
}

.cdk-overlay-backdrop {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  opacity: 0;
  touch-action: manipulation;
}
@layer cdk-overlay {
  .cdk-overlay-backdrop {
    z-index: 1000;
    transition: opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
  }
}
@media (prefers-reduced-motion) {
  .cdk-overlay-backdrop {
    transition-duration: 1ms;
  }
}

.cdk-overlay-backdrop-showing {
  opacity: 1;
}
@media (forced-colors: active) {
  .cdk-overlay-backdrop-showing {
    opacity: 0.6;
  }
}

@layer cdk-overlay {
  .cdk-overlay-dark-backdrop {
    background: rgba(0, 0, 0, 0.32);
  }
}

.cdk-overlay-transparent-backdrop {
  transition: visibility 1ms linear, opacity 1ms linear;
  visibility: hidden;
  opacity: 1;
}
.cdk-overlay-transparent-backdrop.cdk-overlay-backdrop-showing, .cdk-high-contrast-active .cdk-overlay-transparent-backdrop {
  opacity: 0;
  visibility: visible;
}

.cdk-overlay-backdrop-noop-animation {
  transition: none;
}

.cdk-overlay-connected-position-bounding-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 1px;
  min-height: 1px;
}
@layer cdk-overlay {
  .cdk-overlay-connected-position-bounding-box {
    z-index: 1000;
  }
}

.cdk-global-scrollblock {
  position: fixed;
  width: 100%;
  overflow-y: scroll;
}

.cdk-overlay-popover {
  background: none;
  border: none;
  padding: 0;
  outline: 0;
  overflow: visible;
  position: fixed;
  pointer-events: none;
  white-space: normal;
  color: inherit;
  text-decoration: none;
  width: 100%;
  height: 100%;
  inset: auto;
  top: 0;
  left: 0;
}
.cdk-overlay-popover::backdrop {
  display: none;
}
.cdk-overlay-popover .cdk-overlay-backdrop {
  position: fixed;
  z-index: auto;
}
`],encapsulation:2})}return i})(),Ba=(()=>{class i{_platform=g(In);_containerElement;_document=g(X);_styleLoader=g(vo);ngOnDestroy(){this._containerElement?.remove();}getContainerElement(){return this._loadStyles(),this._containerElement||this._createContainer(),this._containerElement}_createContainer(){let t="cdk-overlay-container";if(this._platform.isBrowser||Uu()){let r=this._document.querySelectorAll(`.${t}[platform="server"], .${t}[platform="test"]`);for(let s=0;s<r.length;s++)r[s].remove();}let n=this._document.createElement("div");n.classList.add(t),Uu()?n.setAttribute("platform","test"):this._platform.isBrowser||n.setAttribute("platform","server"),this._document.body.appendChild(n),this._containerElement=n;}_loadStyles(){this._styleLoader.load(Hp);}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),Hu=class{_renderer;_ngZone;element;_cleanupClick;_cleanupTransitionEnd;_fallbackTimeout;constructor(e,t,n,r){this._renderer=t,this._ngZone=n,this.element=e.createElement("div"),this.element.classList.add("cdk-overlay-backdrop"),this._cleanupClick=t.listen(this.element,"click",r);}detach(){this._ngZone.runOutsideAngular(()=>{let e=this.element;clearTimeout(this._fallbackTimeout),this._cleanupTransitionEnd?.(),this._cleanupTransitionEnd=this._renderer.listen(e,"transitionend",this.dispose),this._fallbackTimeout=setTimeout(this.dispose,500),e.style.pointerEvents="none",e.classList.remove("cdk-overlay-backdrop-showing");});}dispose=()=>{clearTimeout(this._fallbackTimeout),this._cleanupClick?.(),this._cleanupTransitionEnd?.(),this._cleanupClick=this._cleanupTransitionEnd=this._fallbackTimeout=void 0,this.element.remove();}};function Wu(i){return i&&i.nodeType===1}var _s=class{_portalOutlet;_host;_pane;_config;_ngZone;_keyboardDispatcher;_document;_location;_outsideClickDispatcher;_animationsDisabled;_injector;_renderer;_backdropClick=new re;_attachments=new re;_detachments=new re;_positionStrategy;_scrollStrategy;_locationChanges=ee.EMPTY;_backdropRef=null;_detachContentMutationObserver;_detachContentAfterRenderRef;_disposed=false;_previousHostParent;_keydownEvents=new re;_outsidePointerEvents=new re;_afterNextRenderRef;constructor(e,t,n,r,s,o,a,l,c,u=false,d,p){this._portalOutlet=e,this._host=t,this._pane=n,this._config=r,this._ngZone=s,this._keyboardDispatcher=o,this._document=a,this._location=l,this._outsideClickDispatcher=c,this._animationsDisabled=u,this._injector=d,this._renderer=p,r.scrollStrategy&&(this._scrollStrategy=r.scrollStrategy,this._scrollStrategy.attach(this)),this._positionStrategy=r.positionStrategy;}get overlayElement(){return this._pane}get backdropElement(){return this._backdropRef?.element||null}get hostElement(){return this._host}get eventPredicate(){return this._config?.eventPredicate||null}attach(e){if(this._disposed)return null;this._attachHost();let t=this._portalOutlet.attach(e);return this._positionStrategy?.attach(this),this._updateStackingOrder(),this._updateElementSize(),this._updateElementDirection(),this._scrollStrategy&&this._scrollStrategy.enable(),this._afterNextRenderRef?.destroy(),this._afterNextRenderRef=nl$1(()=>{this.hasAttached()&&this.updatePosition();},{injector:this._injector}),this._togglePointerEvents(true),this._config.hasBackdrop&&this._attachBackdrop(),this._config.panelClass&&this._toggleClasses(this._pane,this._config.panelClass,true),this._attachments.next(),this._completeDetachContent(),this._keyboardDispatcher.add(this),this._config.disposeOnNavigation&&(this._locationChanges=this._location.subscribe(()=>this.dispose())),this._outsideClickDispatcher.add(this),typeof t?.onDestroy=="function"&&t.onDestroy(()=>{this.hasAttached()&&this._ngZone.runOutsideAngular(()=>Promise.resolve().then(()=>this.detach()));}),t}detach(){if(!this.hasAttached())return;this.detachBackdrop(),this._togglePointerEvents(false),this._positionStrategy&&this._positionStrategy.detach&&this._positionStrategy.detach(),this._scrollStrategy&&this._scrollStrategy.disable();let e=this._portalOutlet.detach();return this._detachments.next(),this._completeDetachContent(),this._keyboardDispatcher.remove(this),this._detachContentWhenEmpty(),this._locationChanges.unsubscribe(),this._outsideClickDispatcher.remove(this),e}dispose(){if(this._disposed)return;let e=this.hasAttached();this._positionStrategy&&this._positionStrategy.dispose(),this._disposeScrollStrategy(),this._backdropRef?.dispose(),this._locationChanges.unsubscribe(),this._keyboardDispatcher.remove(this),this._portalOutlet.dispose(),this._attachments.complete(),this._backdropClick.complete(),this._keydownEvents.complete(),this._outsidePointerEvents.complete(),this._outsideClickDispatcher.remove(this),this._host?.remove(),this._afterNextRenderRef?.destroy(),this._previousHostParent=this._pane=this._host=this._backdropRef=null,e&&this._detachments.next(),this._detachments.complete(),this._completeDetachContent(),this._disposed=true;}hasAttached(){return this._portalOutlet.hasAttached()}backdropClick(){return this._backdropClick}attachments(){return this._attachments}detachments(){return this._detachments}keydownEvents(){return this._keydownEvents}outsidePointerEvents(){return this._outsidePointerEvents}getConfig(){return this._config}updatePosition(){this._positionStrategy&&this._positionStrategy.apply();}updatePositionStrategy(e){e!==this._positionStrategy&&(this._positionStrategy&&this._positionStrategy.dispose(),this._positionStrategy=e,this.hasAttached()&&(e.attach(this),this.updatePosition()));}updateSize(e){this._config=m$1(m$1({},this._config),e),this._updateElementSize();}setDirection(e){this._config=k(m$1({},this._config),{direction:e}),this._updateElementDirection();}addPanelClass(e){this._pane&&this._toggleClasses(this._pane,e,true);}removePanelClass(e){this._pane&&this._toggleClasses(this._pane,e,false);}getDirection(){let e=this._config.direction;return e?typeof e=="string"?e:e.value:"ltr"}updateScrollStrategy(e){e!==this._scrollStrategy&&(this._disposeScrollStrategy(),this._scrollStrategy=e,this.hasAttached()&&(e.attach(this),e.enable()));}_updateElementDirection(){this._host.setAttribute("dir",this.getDirection());}_updateElementSize(){if(!this._pane)return;let e=this._pane.style;e.width=qt(this._config.width),e.height=qt(this._config.height),e.minWidth=qt(this._config.minWidth),e.minHeight=qt(this._config.minHeight),e.maxWidth=qt(this._config.maxWidth),e.maxHeight=qt(this._config.maxHeight);}_togglePointerEvents(e){this._pane.style.pointerEvents=e?"":"none";}_attachHost(){if(!this._host.parentElement){let e=this._config.usePopover?this._positionStrategy?.getPopoverInsertionPoint?.():null;Wu(e)?e.after(this._host):e?.type==="parent"?e.element.appendChild(this._host):this._previousHostParent?.appendChild(this._host);}if(this._config.usePopover)try{this._host.showPopover();}catch{}}_attachBackdrop(){let e="cdk-overlay-backdrop-showing";this._backdropRef?.dispose(),this._backdropRef=new Hu(this._document,this._renderer,this._ngZone,t=>{this._backdropClick.next(t);}),this._animationsDisabled&&this._backdropRef.element.classList.add("cdk-overlay-backdrop-noop-animation"),this._config.backdropClass&&this._toggleClasses(this._backdropRef.element,this._config.backdropClass,true),this._config.usePopover?this._host.prepend(this._backdropRef.element):this._host.parentElement.insertBefore(this._backdropRef.element,this._host),!this._animationsDisabled&&typeof requestAnimationFrame<"u"?this._ngZone.runOutsideAngular(()=>{requestAnimationFrame(()=>this._backdropRef?.element.classList.add(e));}):this._backdropRef.element.classList.add(e);}_updateStackingOrder(){!this._config.usePopover&&this._host.nextSibling&&this._host.parentNode.appendChild(this._host);}detachBackdrop(){this._animationsDisabled?(this._backdropRef?.dispose(),this._backdropRef=null):this._backdropRef?.detach();}_toggleClasses(e,t,n){let r=Fu(t||[]).filter(s=>!!s);r.length&&(n?e.classList.add(...r):e.classList.remove(...r));}_detachContentWhenEmpty(){let e=false;try{this._detachContentAfterRenderRef=nl$1(()=>{e=!0,this._detachContent();},{injector:this._injector});}catch(t){if(e)throw t;this._detachContent();}globalThis.MutationObserver&&this._pane&&(this._detachContentMutationObserver||=new globalThis.MutationObserver(()=>{this._detachContent();}),this._detachContentMutationObserver.observe(this._pane,{childList:true}));}_detachContent(){(!this._pane||!this._host||this._pane.children.length===0)&&(this._pane&&this._config.panelClass&&this._toggleClasses(this._pane,this._config.panelClass,false),this._host&&this._host.parentElement&&(this._previousHostParent=this._host.parentElement,this._host.remove()),this._completeDetachContent());}_completeDetachContent(){this._detachContentAfterRenderRef?.destroy(),this._detachContentAfterRenderRef=void 0,this._detachContentMutationObserver?.disconnect();}_disposeScrollStrategy(){let e=this._scrollStrategy;e?.disable(),e?.detach?.();}},Np="cdk-overlay-connected-position-bounding-box",s_=/([A-Za-z%]+)$/;function Xu(i,e){return new Oa(e,i.get(bo),i.get(X),i.get(In),i.get(Ba))}var Oa=class{_viewportRuler;_document;_platform;_overlayContainer;_overlayRef;_isInitialRender=false;_lastBoundingBoxSize={width:0,height:0};_isPushed=false;_canPush=true;_growAfterOpen=false;_hasFlexibleDimensions=true;_positionLocked=false;_originRect;_overlayRect;_viewportRect;_containerRect;_viewportMargin=0;_scrollables=[];_preferredPositions=[];_origin;_pane;_isDisposed=false;_boundingBox=null;_lastPosition=null;_lastScrollVisibility=null;_positionChanges=new re;_resizeSubscription=ee.EMPTY;_offsetX=0;_offsetY=0;_transformOriginSelector;_appliedPanelClasses=[];_previousPushAmount=null;_popoverLocation="global";positionChanges=this._positionChanges;get positions(){return this._preferredPositions}constructor(e,t,n,r,s){this._viewportRuler=t,this._document=n,this._platform=r,this._overlayContainer=s,this.setOrigin(e);}attach(e){this._overlayRef&&this._overlayRef,this._validatePositions(),e.hostElement.classList.add(Np),this._overlayRef=e,this._boundingBox=e.hostElement,this._pane=e.overlayElement,this._isDisposed=false,this._isInitialRender=true,this._lastPosition=null,this._resizeSubscription.unsubscribe(),this._resizeSubscription=this._viewportRuler.change().subscribe(()=>{this._isInitialRender=true,this.apply();});}apply(){if(this._isDisposed||!this._platform.isBrowser)return;if(!this._isInitialRender&&this._positionLocked&&this._lastPosition){this.reapplyLastPosition();return}this._clearPanelClasses(),this._resetOverlayElementStyles(),this._resetBoundingBoxStyles(),this._viewportRect=this._getNarrowedViewportRect(),this._originRect=this._getOriginRect(),this._overlayRect=this._pane.getBoundingClientRect(),this._containerRect=this._getContainerRect();let e=this._originRect,t=this._overlayRect,n=this._viewportRect,r=this._containerRect,s=[],o;for(let a of this._preferredPositions){let l=this._getOriginPoint(e,r,a),c=this._getOverlayPoint(l,t,a),u=this._getOverlayFit(c,t,n,a);if(u.isCompletelyWithinViewport){this._isPushed=false,this._applyPosition(a,l);return}if(this._canFitWithFlexibleDimensions(u,c,n)){s.push({position:a,origin:l,overlayRect:t,boundingBoxRect:this._calculateBoundingBoxRect(l,a)});continue}(!o||o.overlayFit.visibleArea<u.visibleArea)&&(o={overlayFit:u,overlayPoint:c,originPoint:l,position:a,overlayRect:t});}if(s.length){let a=null,l=-1;for(let c of s){let u=c.boundingBoxRect.width*c.boundingBoxRect.height*(c.position.weight||1);u>l&&(l=u,a=c);}this._isPushed=false,this._applyPosition(a.position,a.origin);return}if(this._canPush){this._isPushed=true,this._applyPosition(o.position,o.originPoint);return}this._applyPosition(o.position,o.originPoint);}detach(){this._clearPanelClasses(),this._lastPosition=null,this._previousPushAmount=null,this._resizeSubscription.unsubscribe();}dispose(){this._isDisposed||(this._boundingBox&&Ir(this._boundingBox.style,{top:"",left:"",right:"",bottom:"",height:"",width:"",alignItems:"",justifyContent:""}),this._pane&&this._resetOverlayElementStyles(),this._overlayRef&&this._overlayRef.hostElement.classList.remove(Np),this.detach(),this._positionChanges.complete(),this._overlayRef=this._boundingBox=null,this._isDisposed=true);}reapplyLastPosition(){if(this._isDisposed||!this._platform.isBrowser)return;let e=this._lastPosition;e?(this._originRect=this._getOriginRect(),this._overlayRect=this._pane.getBoundingClientRect(),this._viewportRect=this._getNarrowedViewportRect(),this._containerRect=this._getContainerRect(),this._applyPosition(e,this._getOriginPoint(this._originRect,this._containerRect,e))):this.apply();}withScrollableContainers(e){return this._scrollables=e,this}withPositions(e){return this._preferredPositions=e,e.indexOf(this._lastPosition)===-1&&(this._lastPosition=null),this._validatePositions(),this}withViewportMargin(e){return this._viewportMargin=e,this}withFlexibleDimensions(e=true){return this._hasFlexibleDimensions=e,this}withGrowAfterOpen(e=true){return this._growAfterOpen=e,this}withPush(e=true){return this._canPush=e,this}withLockedPosition(e=true){return this._positionLocked=e,this}setOrigin(e){return this._origin=e,this}withDefaultOffsetX(e){return this._offsetX=e,this}withDefaultOffsetY(e){return this._offsetY=e,this}withTransformOriginOn(e){return this._transformOriginSelector=e,this}withPopoverLocation(e){return this._popoverLocation=e,this}getPopoverInsertionPoint(){return this._popoverLocation==="global"?null:this._popoverLocation!=="inline"?this._popoverLocation:this._origin instanceof zt?this._origin.nativeElement:Wu(this._origin)?this._origin:null}_getOriginPoint(e,t,n){let r;if(n.originX=="center")r=e.left+e.width/2;else {let o=this._isRtl()?e.right:e.left,a=this._isRtl()?e.left:e.right;r=n.originX=="start"?o:a;}t.left<0&&(r-=t.left);let s;return n.originY=="center"?s=e.top+e.height/2:s=n.originY=="top"?e.top:e.bottom,t.top<0&&(s-=t.top),{x:r,y:s}}_getOverlayPoint(e,t,n){let r;n.overlayX=="center"?r=-t.width/2:n.overlayX==="start"?r=this._isRtl()?-t.width:0:r=this._isRtl()?0:-t.width;let s;return n.overlayY=="center"?s=-t.height/2:s=n.overlayY=="top"?0:-t.height,{x:e.x+r,y:e.y+s}}_getOverlayFit(e,t,n,r){let s=Lp(t),{x:o,y:a}=e,l=this._getOffset(r,"x"),c=this._getOffset(r,"y");l&&(o+=l),c&&(a+=c);let u=0-o,d=o+s.width-n.width,p=0-a,f=a+s.height-n.height,_=this._subtractOverflows(s.width,u,d),y=this._subtractOverflows(s.height,p,f),m=_*y;return {visibleArea:m,isCompletelyWithinViewport:s.width*s.height===m,fitsInViewportVertically:y===s.height,fitsInViewportHorizontally:_==s.width}}_canFitWithFlexibleDimensions(e,t,n){if(this._hasFlexibleDimensions){let r=n.bottom-t.y,s=n.right-t.x,o=Fp(this._overlayRef.getConfig().minHeight),a=Fp(this._overlayRef.getConfig().minWidth),l=e.fitsInViewportVertically||o!=null&&o<=r,c=e.fitsInViewportHorizontally||a!=null&&a<=s;return l&&c}return  false}_pushOverlayOnScreen(e,t,n){if(this._previousPushAmount&&this._positionLocked)return {x:e.x+this._previousPushAmount.x,y:e.y+this._previousPushAmount.y};let r=Lp(t),s=this._viewportRect,o=Math.max(e.x+r.width-s.width,0),a=Math.max(e.y+r.height-s.height,0),l=Math.max(s.top-n.top-e.y,0),c=Math.max(s.left-n.left-e.x,0),u=0,d=0;return r.width<=s.width?u=c||-o:u=e.x<this._getViewportMarginStart()?s.left-n.left-e.x:0,r.height<=s.height?d=l||-a:d=e.y<this._getViewportMarginTop()?s.top-n.top-e.y:0,this._previousPushAmount={x:u,y:d},{x:e.x+u,y:e.y+d}}_applyPosition(e,t){if(this._setTransformOrigin(e),this._setOverlayElementStyles(t,e),this._setBoundingBoxStyles(t,e),e.panelClass&&this._addPanelClasses(e.panelClass),this._positionChanges.observers.length){let n=this._getScrollVisibility();if(e!==this._lastPosition||!this._lastScrollVisibility||!o_(this._lastScrollVisibility,n)){let r=new La(e,n);this._positionChanges.next(r);}this._lastScrollVisibility=n;}this._lastPosition=e,this._isInitialRender=false;}_setTransformOrigin(e){if(!this._transformOriginSelector)return;let t=this._boundingBox.querySelectorAll(this._transformOriginSelector),n,r=e.overlayY;e.overlayX==="center"?n="center":this._isRtl()?n=e.overlayX==="start"?"right":"left":n=e.overlayX==="start"?"left":"right";for(let s=0;s<t.length;s++)t[s].style.transformOrigin=`${n} ${r}`;}_calculateBoundingBoxRect(e,t){let n=this._viewportRect,r=this._isRtl(),s,o,a;if(t.overlayY==="top")o=e.y,s=n.height-o+this._getViewportMarginBottom();else if(t.overlayY==="bottom")a=n.height-e.y+this._getViewportMarginTop()+this._getViewportMarginBottom(),s=n.height-a+this._getViewportMarginTop();else {let f=Math.min(n.bottom-e.y+n.top,e.y),_=this._lastBoundingBoxSize.height;s=f*2,o=e.y-f,s>_&&!this._isInitialRender&&!this._growAfterOpen&&(o=e.y-_/2);}let l=t.overlayX==="start"&&!r||t.overlayX==="end"&&r,c=t.overlayX==="end"&&!r||t.overlayX==="start"&&r,u,d,p;if(c)p=n.width-e.x+this._getViewportMarginStart()+this._getViewportMarginEnd(),u=e.x-this._getViewportMarginStart();else if(l)d=e.x,u=n.right-e.x-this._getViewportMarginEnd();else {let f=Math.min(n.right-e.x+n.left,e.x),_=this._lastBoundingBoxSize.width;u=f*2,d=e.x-f,u>_&&!this._isInitialRender&&!this._growAfterOpen&&(d=e.x-_/2);}return {top:o,left:d,bottom:a,right:p,width:u,height:s}}_setBoundingBoxStyles(e,t){let n=this._calculateBoundingBoxRect(e,t);!this._isInitialRender&&!this._growAfterOpen&&(n.height=Math.min(n.height,this._lastBoundingBoxSize.height),n.width=Math.min(n.width,this._lastBoundingBoxSize.width));let r={};if(this._hasExactPosition())r.top=r.left="0",r.bottom=r.right="auto",r.maxHeight=r.maxWidth="",r.width=r.height="100%";else {let s=this._overlayRef.getConfig().maxHeight,o=this._overlayRef.getConfig().maxWidth;r.width=qt(n.width),r.height=qt(n.height),r.top=qt(n.top)||"auto",r.bottom=qt(n.bottom)||"auto",r.left=qt(n.left)||"auto",r.right=qt(n.right)||"auto",t.overlayX==="center"?r.alignItems="center":r.alignItems=t.overlayX==="end"?"flex-end":"flex-start",t.overlayY==="center"?r.justifyContent="center":r.justifyContent=t.overlayY==="bottom"?"flex-end":"flex-start",s&&(r.maxHeight=qt(s)),o&&(r.maxWidth=qt(o));}this._lastBoundingBoxSize=n,Ir(this._boundingBox.style,r);}_resetBoundingBoxStyles(){Ir(this._boundingBox.style,{top:"0",left:"0",right:"0",bottom:"0",height:"",width:"",alignItems:"",justifyContent:""});}_resetOverlayElementStyles(){Ir(this._pane.style,{top:"",left:"",bottom:"",right:"",position:"",transform:""});}_setOverlayElementStyles(e,t){let n={},r=this._hasExactPosition(),s=this._hasFlexibleDimensions,o=this._overlayRef.getConfig();if(r){let u=this._viewportRuler.getViewportScrollPosition();Ir(n,this._getExactOverlayY(t,e,u)),Ir(n,this._getExactOverlayX(t,e,u));}else n.position="static";let a="",l=this._getOffset(t,"x"),c=this._getOffset(t,"y");l&&(a+=`translateX(${l}px) `),c&&(a+=`translateY(${c}px)`),n.transform=a.trim(),o.maxHeight&&(r?n.maxHeight=qt(o.maxHeight):s&&(n.maxHeight="")),o.maxWidth&&(r?n.maxWidth=qt(o.maxWidth):s&&(n.maxWidth="")),Ir(this._pane.style,n);}_getExactOverlayY(e,t,n){let r={top:"",bottom:""},s=this._getOverlayPoint(t,this._overlayRect,e);if(this._isPushed&&(s=this._pushOverlayOnScreen(s,this._overlayRect,n)),e.overlayY==="bottom"){let o=this._document.documentElement.clientHeight;r.bottom=`${o-(s.y+this._overlayRect.height)}px`;}else r.top=qt(s.y);return r}_getExactOverlayX(e,t,n){let r={left:"",right:""},s=this._getOverlayPoint(t,this._overlayRect,e);this._isPushed&&(s=this._pushOverlayOnScreen(s,this._overlayRect,n));let o;if(this._isRtl()?o=e.overlayX==="end"?"left":"right":o=e.overlayX==="end"?"right":"left",o==="right"){let a=this._document.documentElement.clientWidth;r.right=`${a-(s.x+this._overlayRect.width)}px`;}else r.left=qt(s.x);return r}_getScrollVisibility(){let e=this._getOriginRect(),t=this._pane.getBoundingClientRect(),n=this._scrollables.map(r=>r.getElementRef().nativeElement.getBoundingClientRect());return {isOriginClipped:Dp(e,n),isOriginOutsideView:zu(e,n),isOverlayClipped:Dp(t,n),isOverlayOutsideView:zu(t,n)}}_subtractOverflows(e,...t){return t.reduce((n,r)=>n-Math.max(r,0),e)}_getNarrowedViewportRect(){let e=this._document.documentElement.clientWidth,t=this._document.documentElement.clientHeight,n=this._viewportRuler.getViewportScrollPosition();return {top:n.top+this._getViewportMarginTop(),left:n.left+this._getViewportMarginStart(),right:n.left+e-this._getViewportMarginEnd(),bottom:n.top+t-this._getViewportMarginBottom(),width:e-this._getViewportMarginStart()-this._getViewportMarginEnd(),height:t-this._getViewportMarginTop()-this._getViewportMarginBottom()}}_isRtl(){return this._overlayRef.getDirection()==="rtl"}_hasExactPosition(){return !this._hasFlexibleDimensions||this._isPushed}_getOffset(e,t){return t==="x"?e.offsetX==null?this._offsetX:e.offsetX:e.offsetY==null?this._offsetY:e.offsetY}_validatePositions(){}_addPanelClasses(e){this._pane&&Fu(e).forEach(t=>{t!==""&&this._appliedPanelClasses.indexOf(t)===-1&&(this._appliedPanelClasses.push(t),this._pane.classList.add(t));});}_clearPanelClasses(){this._pane&&(this._appliedPanelClasses.forEach(e=>{this._pane.classList.remove(e);}),this._appliedPanelClasses=[]);}_getViewportMarginStart(){return typeof this._viewportMargin=="number"?this._viewportMargin:this._viewportMargin?.start??0}_getViewportMarginEnd(){return typeof this._viewportMargin=="number"?this._viewportMargin:this._viewportMargin?.end??0}_getViewportMarginTop(){return typeof this._viewportMargin=="number"?this._viewportMargin:this._viewportMargin?.top??0}_getViewportMarginBottom(){return typeof this._viewportMargin=="number"?this._viewportMargin:this._viewportMargin?.bottom??0}_getOriginRect(){let e=this._origin;if(e instanceof zt)return e.nativeElement.getBoundingClientRect();if(e instanceof Element)return e.getBoundingClientRect();let t=e.width||0,n=e.height||0;return {top:e.y,bottom:e.y+n,left:e.x,right:e.x+t,height:n,width:t}}_getContainerRect(){let e=this._overlayRef.getConfig().usePopover&&this._popoverLocation!=="global",t=this._overlayContainer.getContainerElement();e&&(t.style.display="block");let n=t.getBoundingClientRect();return e&&(t.style.display=""),n}};function Ir(i,e){for(let t in e)e.hasOwnProperty(t)&&(i[t]=e[t]);return i}function Fp(i){if(typeof i!="number"&&i!=null){let[e,t]=i.split(s_);return !t||t==="px"?parseFloat(e):null}return i||null}function Lp(i){return {top:Math.floor(i.top),right:Math.floor(i.right),bottom:Math.floor(i.bottom),left:Math.floor(i.left),width:Math.floor(i.width),height:Math.floor(i.height)}}function o_(i,e){return i===e?true:i.isOriginClipped===e.isOriginClipped&&i.isOriginOutsideView===e.isOriginOutsideView&&i.isOverlayClipped===e.isOverlayClipped&&i.isOverlayOutsideView===e.isOverlayOutsideView}var Op="cdk-global-overlay-wrapper";function Va(i){return new ka}var ka=class{_overlayRef;_cssPosition="static";_topOffset="";_bottomOffset="";_alignItems="";_xPosition="";_xOffset="";_width="";_height="";_isDisposed=false;attach(e){let t=e.getConfig();this._overlayRef=e,this._width&&!t.width&&e.updateSize({width:this._width}),this._height&&!t.height&&e.updateSize({height:this._height}),e.hostElement.classList.add(Op),this._isDisposed=false;}top(e=""){return this._bottomOffset="",this._topOffset=e,this._alignItems="flex-start",this}left(e=""){return this._xOffset=e,this._xPosition="left",this}bottom(e=""){return this._topOffset="",this._bottomOffset=e,this._alignItems="flex-end",this}right(e=""){return this._xOffset=e,this._xPosition="right",this}start(e=""){return this._xOffset=e,this._xPosition="start",this}end(e=""){return this._xOffset=e,this._xPosition="end",this}width(e=""){return this._overlayRef?this._overlayRef.updateSize({width:e}):this._width=e,this}height(e=""){return this._overlayRef?this._overlayRef.updateSize({height:e}):this._height=e,this}centerHorizontally(e=""){return this.left(e),this._xPosition="center",this}centerVertically(e=""){return this.top(e),this._alignItems="center",this}apply(){if(!this._overlayRef||!this._overlayRef.hasAttached())return;let e=this._overlayRef.overlayElement.style,t=this._overlayRef.hostElement.style,n=this._overlayRef.getConfig(),{width:r,height:s,maxWidth:o,maxHeight:a}=n,l=(r==="100%"||r==="100vw")&&(!o||o==="100%"||o==="100vw"),c=(s==="100%"||s==="100vh")&&(!a||a==="100%"||a==="100vh"),u=this._xPosition,d=this._xOffset,p=this._overlayRef.getConfig().direction==="rtl",f="",_="",y="";l?y="flex-start":u==="center"?(y="center",p?_=d:f=d):p?u==="left"||u==="end"?(y="flex-end",f=d):(u==="right"||u==="start")&&(y="flex-start",_=d):u==="left"||u==="start"?(y="flex-start",f=d):(u==="right"||u==="end")&&(y="flex-end",_=d),e.position=this._cssPosition,e.marginLeft=l?"0":f,e.marginTop=c?"0":this._topOffset,e.marginBottom=this._bottomOffset,e.marginRight=l?"0":_,t.justifyContent=y,t.alignItems=c?"flex-start":this._alignItems;}dispose(){if(this._isDisposed||!this._overlayRef)return;let e=this._overlayRef.overlayElement.style,t=this._overlayRef.hostElement,n=t.style;t.classList.remove(Op),n.justifyContent=n.alignItems=e.marginTop=e.marginBottom=e.marginLeft=e.marginRight=e.position="",this._overlayRef=null,this._isDisposed=true;}},Gp=(()=>{class i{_injector=g(ge);global(){return Va()}flexibleConnectedTo(t){return Xu(this._injector,t)}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),qu=new D("OVERLAY_DEFAULT_CONFIG");function Mo(i,e){i.get(vo).load(Hp);let t=i.get(Ba),n=i.get(X),r=i.get(gs),s=i.get(vr$1),o=i.get(ms),a=i.get($s$1,null,{optional:true})||i.get(wn$1).createRenderer(null,null),l=new Dr(e),c=i.get(qu,null,{optional:true})?.usePopover??true;l.direction=l.direction||o.value,!n.body||!("showPopover"in n.body)?l.usePopover=false:l.usePopover=e?.usePopover??c;let u=n.createElement("div"),d=n.createElement("div");u.id=r.getId("cdk-overlay-"),u.classList.add("cdk-overlay-pane"),d.appendChild(u),l.usePopover&&(d.setAttribute("popover","manual"),d.classList.add("cdk-overlay-popover"));let p=l.usePopover?l.positionStrategy?.getPopoverInsertionPoint?.():null;return Wu(p)?p.after(d):p?.type==="parent"?p.element.appendChild(d):t.getContainerElement().appendChild(d),new _s(new Ea(u,s,i),d,u,l,i.get(me),i.get(Vp),n,i.get(Rn),i.get(zp),e?.disableAnimations??i.get(Jy$1,null,{optional:true})==="NoopAnimations",i.get(J),a)}var Wp=(()=>{class i{scrollStrategies=g(Up);_positionBuilder=g(Gp);_injector=g(ge);create(t){return Mo(this._injector,t)}position(){return this._positionBuilder}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})(),a_=[{originX:"start",originY:"bottom",overlayX:"start",overlayY:"top"},{originX:"start",originY:"top",overlayX:"start",overlayY:"bottom"},{originX:"end",originY:"top",overlayX:"end",overlayY:"bottom"},{originX:"end",originY:"bottom",overlayX:"end",overlayY:"top"}],l_=new D("cdk-connected-overlay-scroll-strategy",{providedIn:"root",factory:()=>{let i=g(ge);return ()=>Gu(i)}}),Pr=(()=>{class i{elementRef=g(zt);static \u0275fac=function(n){return new(n||i)};static \u0275dir=Mn({type:i,selectors:[["","cdk-overlay-origin",""],["","overlay-origin",""],["","cdkOverlayOrigin",""]],exportAs:["cdkOverlayOrigin"]})}return i})(),Xp=new D("cdk-connected-overlay-default-config"),Nr=(()=>{class i{_dir=g(ms,{optional:true});_injector=g(ge);_overlayRef;_templatePortal;_backdropSubscription=ee.EMPTY;_attachSubscription=ee.EMPTY;_detachSubscription=ee.EMPTY;_positionSubscription=ee.EMPTY;_offsetX;_offsetY;_position;_scrollStrategyFactory=g(l_);_ngZone=g(me);origin;positions;positionStrategy;get offsetX(){return this._offsetX}set offsetX(t){this._offsetX=t,this._position&&this._updatePositionStrategy(this._position);}get offsetY(){return this._offsetY}set offsetY(t){this._offsetY=t,this._position&&this._updatePositionStrategy(this._position);}width;height;minWidth;minHeight;backdropClass;panelClass;viewportMargin=0;scrollStrategy;open=false;disableClose=false;transformOriginSelector;hasBackdrop=false;lockPosition=false;flexibleDimensions=false;growAfterOpen=false;push=false;disposeOnNavigation=false;usePopover;matchWidth=false;set _config(t){typeof t!="string"&&this._assignConfig(t);}backdropClick=new pe$1;positionChange=new pe$1;attach=new pe$1;detach=new pe$1;overlayKeydown=new pe$1;overlayOutsideClick=new pe$1;constructor(){let t=g(dr$1),n=g(Gt),r=g(Xp,{optional:true}),s=g(qu,{optional:true});this.usePopover=s?.usePopover===false?null:"global",this._templatePortal=new Ar(t,n),this.scrollStrategy=this._scrollStrategyFactory(),r&&this._assignConfig(r);}get overlayRef(){return this._overlayRef}get dir(){return this._dir?this._dir.value:"ltr"}ngOnDestroy(){this._attachSubscription.unsubscribe(),this._detachSubscription.unsubscribe(),this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this._overlayRef?.dispose();}ngOnChanges(t){this._position&&(this._updatePositionStrategy(this._position),this._overlayRef?.updateSize({width:this._getWidth(),minWidth:this.minWidth,height:this.height,minHeight:this.minHeight}),t.origin&&this.open&&this._position.apply()),t.open&&(this.open?this.attachOverlay():this.detachOverlay());}_createOverlay(){(!this.positions||!this.positions.length)&&(this.positions=a_);let t=this._overlayRef=Mo(this._injector,this._buildConfig());this._attachSubscription=t.attachments().subscribe(()=>this.attach.emit()),this._detachSubscription=t.detachments().subscribe(()=>this.detach.emit()),t.keydownEvents().subscribe(n=>{this.overlayKeydown.next(n),n.keyCode===27&&!this.disableClose&&!Da(n)&&(n.preventDefault(),this.detachOverlay());}),this._overlayRef.outsidePointerEvents().subscribe(n=>{let r=this._getOriginElement(),s=Mi(n);(!r||r!==s&&!r.contains(s))&&this.overlayOutsideClick.next(n);});}_buildConfig(){let t=this._position=this.positionStrategy||this._createPositionStrategy(),n=new Dr({direction:this._dir||"ltr",positionStrategy:t,scrollStrategy:this.scrollStrategy,hasBackdrop:this.hasBackdrop,disposeOnNavigation:this.disposeOnNavigation,usePopover:!!this.usePopover});return (this.height||this.height===0)&&(n.height=this.height),(this.minWidth||this.minWidth===0)&&(n.minWidth=this.minWidth),(this.minHeight||this.minHeight===0)&&(n.minHeight=this.minHeight),this.backdropClass&&(n.backdropClass=this.backdropClass),this.panelClass&&(n.panelClass=this.panelClass),n}_updatePositionStrategy(t){let n=this.positions.map(r=>({originX:r.originX,originY:r.originY,overlayX:r.overlayX,overlayY:r.overlayY,offsetX:r.offsetX||this.offsetX,offsetY:r.offsetY||this.offsetY,panelClass:r.panelClass||void 0}));return t.setOrigin(this._getOrigin()).withPositions(n).withFlexibleDimensions(this.flexibleDimensions).withPush(this.push).withGrowAfterOpen(this.growAfterOpen).withViewportMargin(this.viewportMargin).withLockedPosition(this.lockPosition).withTransformOriginOn(this.transformOriginSelector).withPopoverLocation(this.usePopover===null?"global":this.usePopover)}_createPositionStrategy(){let t=Xu(this._injector,this._getOrigin());return this._updatePositionStrategy(t),t}_getOrigin(){return this.origin instanceof Pr?this.origin.elementRef:this.origin}_getOriginElement(){return this.origin instanceof Pr?this.origin.elementRef.nativeElement:this.origin instanceof zt?this.origin.nativeElement:typeof Element<"u"&&this.origin instanceof Element?this.origin:null}_getWidth(){return this.width?this.width:this.matchWidth?this._getOriginElement()?.getBoundingClientRect?.().width:void 0}attachOverlay(){this._overlayRef||this._createOverlay();let t=this._overlayRef;t.getConfig().hasBackdrop=this.hasBackdrop,t.updateSize({width:this._getWidth()}),t.hasAttached()||t.attach(this._templatePortal),this.hasBackdrop?this._backdropSubscription=t.backdropClick().subscribe(n=>this.backdropClick.emit(n)):this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this.positionChange.observers.length>0&&(this._positionSubscription=this._position.positionChanges.pipe(Dy$1(()=>this.positionChange.observers.length>0)).subscribe(n=>{this._ngZone.run(()=>this.positionChange.emit(n)),this.positionChange.observers.length===0&&this._positionSubscription.unsubscribe();})),this.open=true;}detachOverlay(){this._overlayRef?.detach(),this._backdropSubscription.unsubscribe(),this._positionSubscription.unsubscribe(),this.open=false;}_assignConfig(t){this.origin=t.origin??this.origin,this.positions=t.positions??this.positions,this.positionStrategy=t.positionStrategy??this.positionStrategy,this.offsetX=t.offsetX??this.offsetX,this.offsetY=t.offsetY??this.offsetY,this.width=t.width??this.width,this.height=t.height??this.height,this.minWidth=t.minWidth??this.minWidth,this.minHeight=t.minHeight??this.minHeight,this.backdropClass=t.backdropClass??this.backdropClass,this.panelClass=t.panelClass??this.panelClass,this.viewportMargin=t.viewportMargin??this.viewportMargin,this.scrollStrategy=t.scrollStrategy??this.scrollStrategy,this.disableClose=t.disableClose??this.disableClose,this.transformOriginSelector=t.transformOriginSelector??this.transformOriginSelector,this.hasBackdrop=t.hasBackdrop??this.hasBackdrop,this.lockPosition=t.lockPosition??this.lockPosition,this.flexibleDimensions=t.flexibleDimensions??this.flexibleDimensions,this.growAfterOpen=t.growAfterOpen??this.growAfterOpen,this.push=t.push??this.push,this.disposeOnNavigation=t.disposeOnNavigation??this.disposeOnNavigation,this.usePopover=t.usePopover??this.usePopover,this.matchWidth=t.matchWidth??this.matchWidth;}static \u0275fac=function(n){return new(n||i)};static \u0275dir=Mn({type:i,selectors:[["","cdk-connected-overlay",""],["","connected-overlay",""],["","cdkConnectedOverlay",""]],inputs:{origin:[0,"cdkConnectedOverlayOrigin","origin"],positions:[0,"cdkConnectedOverlayPositions","positions"],positionStrategy:[0,"cdkConnectedOverlayPositionStrategy","positionStrategy"],offsetX:[0,"cdkConnectedOverlayOffsetX","offsetX"],offsetY:[0,"cdkConnectedOverlayOffsetY","offsetY"],width:[0,"cdkConnectedOverlayWidth","width"],height:[0,"cdkConnectedOverlayHeight","height"],minWidth:[0,"cdkConnectedOverlayMinWidth","minWidth"],minHeight:[0,"cdkConnectedOverlayMinHeight","minHeight"],backdropClass:[0,"cdkConnectedOverlayBackdropClass","backdropClass"],panelClass:[0,"cdkConnectedOverlayPanelClass","panelClass"],viewportMargin:[0,"cdkConnectedOverlayViewportMargin","viewportMargin"],scrollStrategy:[0,"cdkConnectedOverlayScrollStrategy","scrollStrategy"],open:[0,"cdkConnectedOverlayOpen","open"],disableClose:[0,"cdkConnectedOverlayDisableClose","disableClose"],transformOriginSelector:[0,"cdkConnectedOverlayTransformOriginOn","transformOriginSelector"],hasBackdrop:[2,"cdkConnectedOverlayHasBackdrop","hasBackdrop",ta$1],lockPosition:[2,"cdkConnectedOverlayLockPosition","lockPosition",ta$1],flexibleDimensions:[2,"cdkConnectedOverlayFlexibleDimensions","flexibleDimensions",ta$1],growAfterOpen:[2,"cdkConnectedOverlayGrowAfterOpen","growAfterOpen",ta$1],push:[2,"cdkConnectedOverlayPush","push",ta$1],disposeOnNavigation:[2,"cdkConnectedOverlayDisposeOnNavigation","disposeOnNavigation",ta$1],usePopover:[0,"cdkConnectedOverlayUsePopover","usePopover"],matchWidth:[2,"cdkConnectedOverlayMatchWidth","matchWidth",ta$1],_config:[0,"cdkConnectedOverlay","_config"]},outputs:{backdropClick:"backdropClick",positionChange:"positionChange",attach:"attach",detach:"detach",overlayKeydown:"overlayKeydown",overlayOutsideClick:"overlayOutsideClick"},exportAs:["cdkConnectedOverlay"],features:[Tn$1]})}return i})(),Ji=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({providers:[Wp],imports:[yo,Iu,Vu,Vu]})}return i})();function u_(i,e){}var vs=class{viewContainerRef;injector;id;role="dialog";panelClass="";hasBackdrop=true;backdropClass="";disableClose=false;closePredicate;width="";height="";minWidth;minHeight;maxWidth;maxHeight;positionStrategy;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=false;autoFocus="first-tabbable";restoreFocus=true;scrollStrategy;closeOnNavigation=true;closeOnDestroy=true;closeOnOverlayDetachments=true;disableAnimations=false;providers;container;templateContext;bindings};var d_=(()=>{class i extends hs{_elementRef=g(zt);_focusTrapFactory=g(Ia);_config;_interactivityChecker=g(Ou);_ngZone=g(me);_focusMonitor=g(Sp);_renderer=g($s$1);_changeDetectorRef=g(ea$1);_injector=g(ge);_platform=g(In);_document=g(X);_portalOutlet;_focusTrapped=new re;_focusTrap=null;_elementFocusedBeforeDialogWasOpened=null;_closeInteractionType=null;_ariaLabelledByQueue=[];_isDestroyed=false;constructor(){super(),this._config=g(vs,{optional:true})||new vs,this._config.ariaLabelledBy&&this._ariaLabelledByQueue.push(this._config.ariaLabelledBy);}_addAriaLabelledBy(t){this._ariaLabelledByQueue.push(t),this._changeDetectorRef.markForCheck();}_removeAriaLabelledBy(t){let n=this._ariaLabelledByQueue.indexOf(t);n>-1&&(this._ariaLabelledByQueue.splice(n,1),this._changeDetectorRef.markForCheck());}_contentAttached(){this._initializeFocusTrap(),this._captureInitialFocus();}_captureInitialFocus(){this._trapFocus();}ngOnDestroy(){this._focusTrapped.complete(),this._isDestroyed=true,this._restoreFocus();}attachComponentPortal(t){this._portalOutlet.hasAttached();let n=this._portalOutlet.attachComponentPortal(t);return this._contentAttached(),n}attachTemplatePortal(t){this._portalOutlet.hasAttached();let n=this._portalOutlet.attachTemplatePortal(t);return this._contentAttached(),n}attachDomPortal=t=>{this._portalOutlet.hasAttached();let n=this._portalOutlet.attachDomPortal(t);return this._contentAttached(),n};_recaptureFocus(){this._containsFocus()||this._trapFocus();}_forceFocus(t,n){this._interactivityChecker.isFocusable(t)||(t.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let r=()=>{s(),o(),t.removeAttribute("tabindex");},s=this._renderer.listen(t,"blur",r),o=this._renderer.listen(t,"mousedown",r);})),t.focus(n);}_focusByCssSelector(t,n){let r=this._elementRef.nativeElement.querySelector(t);r&&this._forceFocus(r,n);}_trapFocus(t){this._isDestroyed||nl$1(()=>{let n=this._elementRef.nativeElement;switch(this._config.autoFocus){case  false:case "dialog":this._containsFocus()||n.focus(t);break;case  true:case "first-tabbable":this._focusTrap?.focusInitialElement(t)||this._focusDialogContainer(t);break;case "first-heading":this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]',t);break;default:this._focusByCssSelector(this._config.autoFocus,t);break}this._focusTrapped.next();},{injector:this._injector});}_restoreFocus(){let t=this._config.restoreFocus,n=null;if(typeof t=="string"?n=this._document.querySelector(t):typeof t=="boolean"?n=t?this._elementFocusedBeforeDialogWasOpened:null:t&&(n=t),this._config.restoreFocus&&n&&typeof n.focus=="function"){let r=ps(),s=this._elementRef.nativeElement;(!r||r===this._document.body||r===s||s.contains(r))&&(this._focusMonitor?(this._focusMonitor.focusVia(n,this._closeInteractionType),this._closeInteractionType=null):n.focus());}this._focusTrap&&this._focusTrap.destroy();}_focusDialogContainer(t){this._elementRef.nativeElement.focus?.(t);}_containsFocus(){let t=this._elementRef.nativeElement,n=ps();return t===n||t.contains(n)}_initializeFocusTrap(){this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._document&&(this._elementFocusedBeforeDialogWasOpened=ps()));}static \u0275fac=function(n){return new(n||i)};static \u0275cmp=So$1({type:i,selectors:[["cdk-dialog-container"]],viewQuery:function(n,r){if(n&1&&Vg$1(Ru,7),n&2){let s;$g$1(s=zg$1())&&(r._portalOutlet=s.first);}},hostAttrs:["tabindex","-1",1,"cdk-dialog-container"],hostVars:6,hostBindings:function(n,r){n&2&&Nn("id",r._config.id||null)("role",r._config.role)("aria-modal",r._config.ariaModal)("aria-labelledby",r._config.ariaLabel?null:r._ariaLabelledByQueue[0])("aria-label",r._config.ariaLabel)("aria-describedby",r._config.ariaDescribedBy||null);},features:[xg$1],decls:1,vars:0,consts:[["cdkPortalOutlet",""]],template:function(n,r){n&1&&kg$1(0,u_,0,0,"ng-template",0);},dependencies:[Ru],styles:[`.cdk-dialog-container {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  max-height: inherit;
}
`],encapsulation:2,changeDetection:1})}return i})(),Si=class{overlayRef;config;componentInstance=null;componentRef=null;containerInstance;disableClose;closed=new re;backdropClick;keydownEvents;outsidePointerEvents;id;_detachSubscription;constructor(e,t){this.overlayRef=e,this.config=t,this.disableClose=t.disableClose,this.backdropClick=e.backdropClick(),this.keydownEvents=e.keydownEvents(),this.outsidePointerEvents=e.outsidePointerEvents(),this.id=t.id,this.keydownEvents.subscribe(n=>{n.keyCode===27&&!this.disableClose&&!Da(n)&&(n.preventDefault(),this.close(void 0,{focusOrigin:"keyboard"}));}),this.backdropClick.subscribe(()=>{!this.disableClose&&this._canClose()?this.close(void 0,{focusOrigin:"mouse"}):this.containerInstance._recaptureFocus?.();}),this._detachSubscription=e.detachments().subscribe(()=>{t.closeOnOverlayDetachments!==false&&this.close();});}close(e,t){if(this._canClose(e)){let n=this.closed;this.containerInstance._closeInteractionType=t?.focusOrigin||"program",this._detachSubscription.unsubscribe(),this.overlayRef.dispose(),n.next(e),n.complete(),this.componentInstance=this.containerInstance=null;}}updatePosition(){return this.overlayRef.updatePosition(),this}updateSize(e="",t=""){return this.overlayRef.updateSize({width:e,height:t}),this}addPanelClass(e){return this.overlayRef.addPanelClass(e),this}removePanelClass(e){return this.overlayRef.removePanelClass(e),this}_canClose(e){let t=this.config;return !!this.containerInstance&&(!t.closePredicate||t.closePredicate(e,t,this.componentInstance))}},h_=new D("DialogScrollStrategy",{providedIn:"root",factory:()=>{let i=g(ge);return ()=>Ua(i)}}),ys=new D("DialogData"),p_=new D("DefaultDialogConfig");function f_(i){let e=q(i),t=new pe$1;return {valueSignal:e,get value(){return e()},change:t,ngOnDestroy(){t.complete();}}}var qp=(()=>{class i{_injector=g(ge);_defaultOptions=g(p_,{optional:true});_parentDialog=g(i,{optional:true,skipSelf:true});_overlayContainer=g(Ba);_idGenerator=g(gs);_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new re;_afterOpenedAtThisLevel=new re;_ariaHiddenElements=new Map;_scrollStrategy=g(h_);get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}afterAllClosed=Fr$1(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(sc$1(void 0)));open(t,n){let r=this._defaultOptions||new vs;n=m$1(m$1({},r),n),n.id=n.id||this._idGenerator.getId("cdk-dialog-"),n.id&&this.getDialogById(n.id);let s=this._getOverlayConfig(n),o=Mo(this._injector,s),a=new Si(o,n),l=this._attachContainer(o,a,n);if(a.containerInstance=l,!this.openDialogs.length){let c=this._overlayContainer.getContainerElement();l._focusTrapped?l._focusTrapped.pipe(ft(1)).subscribe(()=>{this._hideNonDialogContentFromAssistiveTechnology(c);}):this._hideNonDialogContentFromAssistiveTechnology(c);}return this._attachDialogContent(t,a,l,n),this.openDialogs.push(a),a.closed.subscribe(()=>this._removeOpenDialog(a,true)),this.afterOpened.next(a),a}closeAll(){Yu(this.openDialogs,t=>t.close());}getDialogById(t){return this.openDialogs.find(n=>n.id===t)}ngOnDestroy(){Yu(this._openDialogsAtThisLevel,t=>{t.config.closeOnDestroy===false&&this._removeOpenDialog(t,false);}),Yu(this._openDialogsAtThisLevel,t=>t.close()),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete(),this._openDialogsAtThisLevel=[];}_getOverlayConfig(t){let n=new Dr({positionStrategy:t.positionStrategy||Va().centerHorizontally().centerVertically(),scrollStrategy:t.scrollStrategy||this._scrollStrategy(),panelClass:t.panelClass,hasBackdrop:t.hasBackdrop,direction:t.direction,minWidth:t.minWidth,minHeight:t.minHeight,maxWidth:t.maxWidth,maxHeight:t.maxHeight,width:t.width,height:t.height,disposeOnNavigation:t.closeOnNavigation,disableAnimations:t.disableAnimations});return t.backdropClass&&(n.backdropClass=t.backdropClass),n}_attachContainer(t,n,r){let s=r.injector||r.viewContainerRef?.injector,o=[{provide:vs,useValue:r},{provide:Si,useValue:n},{provide:_s,useValue:t}],a;r.container?typeof r.container=="function"?a=r.container:(a=r.container.type,o.push(...r.container.providers(r))):a=d_;let l=new ds(a,r.viewContainerRef,ge.create({parent:s||this._injector,providers:o}));return t.attach(l).instance}_attachDialogContent(t,n,r,s){if(t instanceof dr$1){let o=this._createInjector(s,n,r,void 0),a={$implicit:s.data,dialogRef:n};s.templateContext&&(a=m$1(m$1({},a),typeof s.templateContext=="function"?s.templateContext():s.templateContext)),r.attachTemplatePortal(new Ar(t,null,a,o));}else {let o=this._createInjector(s,n,r,this._injector),a=r.attachComponentPortal(new ds(t,s.viewContainerRef,o,null,s.bindings));n.componentRef=a,n.componentInstance=a.instance;}}_createInjector(t,n,r,s){let o=t.injector||t.viewContainerRef?.injector,a=[{provide:ys,useValue:t.data},{provide:Si,useValue:n}];return t.providers&&(typeof t.providers=="function"?a.push(...t.providers(n,t,r)):a.push(...t.providers)),t.direction&&(!o||!o.get(ms,null,{optional:true}))&&a.push({provide:ms,useValue:f_(t.direction)}),ge.create({parent:o||s,providers:a})}_removeOpenDialog(t,n){let r=this.openDialogs.indexOf(t);r>-1&&(this.openDialogs.splice(r,1),this.openDialogs.length||(this._ariaHiddenElements.forEach((s,o)=>{s?o.setAttribute("aria-hidden",s):o.removeAttribute("aria-hidden");}),this._ariaHiddenElements.clear(),n&&this._getAfterAllClosed().next()));}_hideNonDialogContentFromAssistiveTechnology(t){if(t.parentElement){let n=t.parentElement.children;for(let r=n.length-1;r>-1;r--){let s=n[r];s!==t&&s.nodeName!=="SCRIPT"&&s.nodeName!=="STYLE"&&!s.hasAttribute("aria-live")&&!s.hasAttribute("popover")&&(this._ariaHiddenElements.set(s,s.getAttribute("aria-hidden")),s.setAttribute("aria-hidden","true"));}}}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();function Yu(i,e){let t=i.length;for(;t--;)e(i[t]);}var za=class i{cdkDialog=g(qp);open(e,t={}){let n=["migo-dialog__panel",...[t.panelClass??[]].flat()],r=["migo-dialog__backdrop",...[t.backdropClass??[]].flat()];return this.cdkDialog.open(e,k(m$1({},t),{panelClass:n,backdropClass:r}))}static \u0275fac=function(t){return new(t||i)};static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var Ha=class i extends La$1{supplies=g(m);recipes=g(v);categories=g(g$1);flavors=g(I);recipeCapacities=g(b);log=g(xm$1).scoped("recipe-book/list");async execute(){this.log.debug("leyendo el cat\xE1logo");let[e,t,n,r,s]=await Promise.all([this.supplies.all(),this.categories.all(),this.recipes.all(),this.flavors.all(),this.recipeCapacities.all()]);return t.sort((o,a)=>o.name.localeCompare(a.name,"es")),this.log.debug("cat\xE1logo le\xEDdo",{supplies:e.length,categories:t.length,recipes:n.length,flavors:r.length,recipeCapacities:s.length}),{supplies:e,categories:t,recipes:n,flavors:r,recipeCapacities:s}}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var mf=0,Ad=1,gf=2;var Rd=1,zs=2,Ti=3,zi=0,Dn=1,ri=2,Wi=0,Br=1,Id=2,Dd=3,Pd=4,_f=5,ar=100,vf=101,yf=102,bf=103,xf=104,Mf=200,Sf=201,wf=202,Cf=203,ll=204,cl=205,Ef=206,Tf=207,Af=208,Rf=209,If=210,Df=211,Pf=212,Nf=213,Ff=214,Rl=0,Il=1,Dl=2,Vr=3,Pl=4,Nl=5,Fl=6,Ll=7,Nd=0,Lf=1,Of=2,Xi=0,kf=1,Uf=2,Bf=3,Hs=4,Vf=5,zf=6,Hf=7;var vd=300,Yr=301,$r=302,Ol=303,kl=304,qo=306,ul=1e3,or=1001,dl=1002,ni=1003,Gf=1004;var Yo=1005;var Wn=1006,Ul=1007;var fr=1008;var gi=1009,Fd=1010,Ld=1011,Gs=1012,Bl=1013,mr=1014,Ai=1015,Ws=1016,Vl=1017,zl=1018,Xs=1020,Od=35902,kd=35899,Ud=1021,Bd=1022,si=1023,Ns=1026,qs=1027,Vd=1028,Hl=1029,zd=1030,Gl=1031;var Wl=1033,$o=33776,jo=33777,Zo=33778,Ko=33779,Xl=35840,ql=35841,Yl=35842,$l=35843,jl=36196,Zl=37492,Kl=37496,Jl=37808,Ql=37809,ec=37810,tc=37811,nc=37812,ic=37813,rc=37814,sc=37815,oc=37816,ac=37817,lc=37818,cc=37819,uc=37820,dc=37821,hc=36492,pc=36494,fc=36495,mc=36283,gc=36284,_c=36285,vc=36286;var Wf=3200,Xf=3201;var Hd=0,qf=1,qi="",rn="srgb",zr="srgb-linear",Ro="linear",vt="srgb";var Ur=7680;var Md=519,Yf=512,$f=513,jf=514,Gd=515,Zf=516,Kf=517,Jf=518,Qf=519,Sd=35044;var Wd="300 es",pi=2e3,Io=2001;var Hi=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t);}hasEventListener(e,t){let n=this._listeners;return n===void 0?false:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1);}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let r=n.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null;}}},Sn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var $u=Math.PI/180,pl=180/Math.PI;function Jo(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return (Sn[i&255]+Sn[i>>8&255]+Sn[i>>16&255]+Sn[i>>24&255]+"-"+Sn[e&255]+Sn[e>>8&255]+"-"+Sn[e>>16&15|64]+Sn[e>>24&255]+"-"+Sn[t&63|128]+Sn[t>>8&255]+"-"+Sn[t>>16&255]+Sn[t>>24&255]+Sn[n&255]+Sn[n>>8&255]+Sn[n>>16&255]+Sn[n>>24&255]).toLowerCase()}function at(i,e,t){return Math.max(e,Math.min(t,i))}function m_(i,e){return (i%e+e)%e}function ju(i,e,t){return (1-t)*i+t*e}function So(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Un(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var lt=class i{constructor(e=0,t=0){i.prototype.isVector2=true,this.x=e,this.y=t;}get width(){return this.x}set width(e){this.x=e;}get height(){return this.y}set height(e){this.y=e;}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(at(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(at(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*n-o*r+e.x,this.y=s*r+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y;}},Gi=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=true,this._x=e,this._y=t,this._z=n,this._w=r;}static slerpFlat(e,t,n,r,s,o,a){let l=n[r+0],c=n[r+1],u=n[r+2],d=n[r+3],p=s[o+0],f=s[o+1],_=s[o+2],y=s[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d;return}if(a===1){e[t+0]=p,e[t+1]=f,e[t+2]=_,e[t+3]=y;return}if(d!==y||l!==p||c!==f||u!==_){let m=1-a,h=l*p+c*f+u*_+d*y,E=h>=0?1:-1,w=1-h*h;if(w>Number.EPSILON){let A=Math.sqrt(w),T=Math.atan2(A,h*E);m=Math.sin(m*T)/A,a=Math.sin(a*T)/A;}let M=a*E;if(l=l*m+p*M,c=c*m+f*M,u=u*m+_*M,d=d*m+y*M,m===1-a){let A=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=A,c*=A,u*=A,d*=A;}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d;}static multiplyQuaternionsFlat(e,t,n,r,s,o){let a=n[r],l=n[r+1],c=n[r+2],u=n[r+3],d=s[o],p=s[o+1],f=s[o+2],_=s[o+3];return e[t]=a*_+u*d+l*f-c*p,e[t+1]=l*_+u*p+c*d-a*f,e[t+2]=c*_+u*f+a*p-l*d,e[t+3]=u*_-a*d-l*p-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback();}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback();}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback();}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback();}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=true){let n=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(r/2),d=a(s/2),p=l(n/2),f=l(r/2),_=l(s/2);switch(o){case "XYZ":this._x=p*u*d+c*f*_,this._y=c*f*d-p*u*_,this._z=c*u*_+p*f*d,this._w=c*u*d-p*f*_;break;case "YXZ":this._x=p*u*d+c*f*_,this._y=c*f*d-p*u*_,this._z=c*u*_-p*f*d,this._w=c*u*d+p*f*_;break;case "ZXY":this._x=p*u*d-c*f*_,this._y=c*f*d+p*u*_,this._z=c*u*_+p*f*d,this._w=c*u*d-p*f*_;break;case "ZYX":this._x=p*u*d-c*f*_,this._y=c*f*d+p*u*_,this._z=c*u*_-p*f*d,this._w=c*u*d+p*f*_;break;case "YZX":this._x=p*u*d+c*f*_,this._y=c*f*d+p*u*_,this._z=c*u*_-p*f*d,this._w=c*u*d-p*f*_;break;case "XZY":this._x=p*u*d-c*f*_,this._y=c*f*d-p*u*_,this._z=c*u*_+p*f*d,this._w=c*u*d+p*f*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o);}return t===true&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],s=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],d=t[10],p=n+a+d;if(p>0){let f=.5/Math.sqrt(p+1);this._w=.25/f,this._x=(u-l)*f,this._y=(s-c)*f,this._z=(o-r)*f;}else if(n>a&&n>d){let f=2*Math.sqrt(1+n-a-d);this._w=(u-l)/f,this._x=.25*f,this._y=(r+o)/f,this._z=(s+c)/f;}else if(a>d){let f=2*Math.sqrt(1+a-n-d);this._w=(s-c)/f,this._x=(r+o)/f,this._y=.25*f,this._z=(l+u)/f;}else {let f=2*Math.sqrt(1+d-n-a);this._w=(o-r)/f,this._x=(s+c)/f,this._y=(l+u)/f,this._z=.25*f;}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(at(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,s=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+o*a+r*c-s*l,this._y=r*u+o*l+s*a-n*c,this._z=s*u+o*c+n*l-r*a,this._w=o*u-n*a-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,r=this._y,s=this._z,o=this._w,a=o*e._w+n*e._x+r*e._y+s*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=r,this._z=s,this;let l=1-a*a;if(l<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*r+t*this._y,this._z=f*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,a),d=Math.sin((1-t)*u)/c,p=Math.sin(t*u)/c;return this._w=o*d+this._w*p,this._x=n*d+this._x*p,this._y=r*d+this._y*p,this._z=s*d+this._z*p,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w;}},O=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=true,this.x=e,this.y=t,this.z=n;}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Yp.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Yp.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,s=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*r-a*n),u=2*(a*t-s*r),d=2*(s*n-o*t);return this.x=t+l*c+o*d-a*u,this.y=n+l*u+a*c-s*d,this.z=r+l*d+s*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this.z=at(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this.z=at(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(at(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,s=e.z,o=t.x,a=t.y,l=t.z;return this.x=r*l-s*a,this.y=s*o-n*l,this.z=n*a-r*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Zu.copy(this).projectOnVector(e),this.sub(Zu)}reflect(e){return this.sub(Zu.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(at(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z;}},Zu=new O,Yp=new Gi,je=class i{constructor(e,t,n,r,s,o,a,l,c){i.prototype.isMatrix3=true,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,o,a,l,c);}set(e,t,n,r,s,o,a,l,c){let u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,s=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],d=n[7],p=n[2],f=n[5],_=n[8],y=r[0],m=r[3],h=r[6],E=r[1],w=r[4],M=r[7],A=r[2],T=r[5],D=r[8];return s[0]=o*y+a*E+l*A,s[3]=o*m+a*w+l*T,s[6]=o*h+a*M+l*D,s[1]=c*y+u*E+d*A,s[4]=c*m+u*w+d*T,s[7]=c*h+u*M+d*D,s[2]=p*y+f*E+_*A,s[5]=p*m+f*w+_*T,s[8]=p*h+f*M+_*D,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-n*s*u+n*a*l+r*s*c-r*o*l}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=u*o-a*c,p=a*l-u*s,f=c*s-o*l,_=t*d+n*p+r*f;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/_;return e[0]=d*y,e[1]=(r*c-u*n)*y,e[2]=(a*n-r*o)*y,e[3]=p*y,e[4]=(u*t-r*l)*y,e[5]=(r*s-a*t)*y,e[6]=f*y,e[7]=(n*l-c*t)*y,e[8]=(o*t-n*s)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,o,a){let l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-r*c,r*l,-r*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Ku.makeScale(e,t)),this}rotate(e){return this.premultiply(Ku.makeRotation(-e)),this}translate(e,t){return this.premultiply(Ku.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return  false;return  true}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ku=new je;function Xd(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return  true;return  false}function Do(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function em(){let i=Do("canvas");return i.style.display="block",i}var $p={};function Fs(i){i in $p||($p[i]=true,console.warn(i));}function tm(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n();}}setTimeout(s,t);})}var jp=new je().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Zp=new je().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,.0415551,.0556301,-0.203977,1.0569715);function g_(){let i={enabled:true,workingColorSpace:zr,spaces:{},convert:function(r,s,o){return this.enabled===false||s===o||!s||!o||(this.spaces[s].transfer===vt&&(r.r=Vi(r.r),r.g=Vi(r.g),r.b=Vi(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===vt&&(r.r=Ps(r.r),r.g=Ps(r.g),r.b=Ps(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===qi?Ro:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r);},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Fs("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Fs("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[zr]:{primaries:e,whitePoint:n,transfer:Ro,toXYZ:jp,fromXYZ:Zp,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:rn},outputColorSpaceConfig:{drawingBufferColorSpace:rn}},[rn]:{primaries:e,whitePoint:n,transfer:vt,toXYZ:jp,fromXYZ:Zp,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:rn}}}),i}var dt=g_();function Vi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ps(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var bs,fl=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else {bs===void 0&&(bs=Do("canvas")),bs.width=e.width,bs.height=e.height;let r=bs.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=bs;}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Do("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=Vi(s[o]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Vi(t[n]/255)*255):t[n]=Vi(t[n]);return {data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},__=0,Ls=class{constructor(e=null){this.isSource=true,Object.defineProperty(this,"id",{value:__++}),this.uuid=Jo(),this.data=e,this.dataReady=true,this.version=0;}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===true&&this.version++;}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(Ju(r[o].image)):s.push(Ju(r[o]));}else s=Ju(r);n.url=s;}return t||(e.images[this.uuid]=n),n}};function Ju(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?fl.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var v_=0,Qu=new O,Yi=(()=>{class i extends Hi{constructor(t=i.DEFAULT_IMAGE,n=i.DEFAULT_MAPPING,r=or,s=or,o=Wn,a=fr,l=si,c=gi,u=i.DEFAULT_ANISOTROPY,d=qi){super(),this.isTexture=true,Object.defineProperty(this,"id",{value:v_++}),this.uuid=Jo(),this.name="",this.source=new Ls(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=s,this.magFilter=o,this.minFilter=a,this.anisotropy=u,this.format=l,this.internalFormat=null,this.type=c,this.offset=new lt(0,0),this.repeat=new lt(1,1),this.center=new lt(0,0),this.rotation=0,this.matrixAutoUpdate=true,this.matrix=new je,this.generateMipmaps=true,this.premultiplyAlpha=false,this.flipY=true,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=false,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0;}get width(){return this.source.getSize(Qu).x}get height(){return this.source.getSize(Qu).y}get depth(){return this.source.getSize(Qu).z}get image(){return this.source.data}set image(t=null){this.source.data=t;}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y);}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n});}clearUpdateRanges(){this.updateRanges.length=0;}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=true,this}setValues(t){for(let n in t){let r=t[n];if(r===void 0){console.warn(`THREE.Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){console.warn(`THREE.Texture.setValues(): property '${n}' does not exist.`);continue}s&&r&&s.isVector2&&r.isVector2||s&&r&&s.isVector3&&r.isVector3||s&&r&&s.isMatrix3&&r.isMatrix3?s.copy(r):this[n]=r;}}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let r={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(r.userData=this.userData),n||(t.textures[this.uuid]=r),r}dispose(){this.dispatchEvent({type:"dispose"});}transformUv(t){if(this.mapping!==vd)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ul:t.x=t.x-Math.floor(t.x);break;case or:t.x=t.x<0?0:1;break;case dl:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ul:t.y=t.y-Math.floor(t.y);break;case or:t.y=t.y<0?0:1;break;case dl:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===true&&(this.version++,this.source.needsUpdate=true);}set needsPMREMUpdate(t){t===true&&this.pmremVersion++;}}return i.DEFAULT_IMAGE=null,i.DEFAULT_MAPPING=vd,i.DEFAULT_ANISOTROPY=1,i})(),Ut=class i{constructor(e=0,t=0,n=0,r=1){i.prototype.isVector4=true,this.x=e,this.y=t,this.z=n,this.w=r;}get width(){return this.z}set width(e){this.z=e;}get height(){return this.w}set height(e){this.w=e;}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*n+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*n+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*n+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s,l=e.elements,c=l[0],u=l[4],d=l[8],p=l[1],f=l[5],_=l[9],y=l[2],m=l[6],h=l[10];if(Math.abs(u-p)<.01&&Math.abs(d-y)<.01&&Math.abs(_-m)<.01){if(Math.abs(u+p)<.1&&Math.abs(d+y)<.1&&Math.abs(_+m)<.1&&Math.abs(c+f+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(c+1)/2,M=(f+1)/2,A=(h+1)/2,T=(u+p)/4,D=(d+y)/4,L=(_+m)/4;return w>M&&w>A?w<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(w),r=T/n,s=D/n):M>A?M<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),n=T/r,s=L/r):A<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(A),n=D/s,r=L/s),this.set(n,r,s,t),this}let E=Math.sqrt((m-_)*(m-_)+(d-y)*(d-y)+(p-u)*(p-u));return Math.abs(E)<.001&&(E=1),this.x=(m-_)/E,this.y=(d-y)/E,this.z=(p-u)/E,this.w=Math.acos((c+f+h-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this.z=at(this.z,e.z,t.z),this.w=at(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this.z=at(this.z,e,t),this.w=at(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(at(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w;}},ml=class extends Hi{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:false,internalFormat:null,minFilter:Wn,depthBuffer:true,stencilBuffer:false,resolveDepthBuffer:true,resolveStencilBuffer:true,depthTexture:null,samples:0,count:1,depth:1,multiview:false},n),this.isRenderTarget=true,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Ut(0,0,e,t),this.scissorTest=false,this.viewport=new Ut(0,0,e,t);let r={width:e,height:t,depth:n.depth},s=new Yi(r);this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=true,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview;}_setTextureOptions(e={}){let t={minFilter:Wn,generateMipmaps:false,flipY:false,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t);}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e;}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e;}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isArrayTexture=this.textures[r].image.depth>1;this.dispose();}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t);}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=true,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new Ls(r);}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"});}},Ci=class extends ml{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=true;}},Po=class extends Yi{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=true,this.image={data:e,width:t,height:n,depth:r},this.magFilter=ni,this.minFilter=ni,this.wrapR=or,this.generateMipmaps=false,this.flipY=false,this.unpackAlignment=1,this.layerUpdates=new Set;}addLayerUpdate(e){this.layerUpdates.add(e);}clearLayerUpdates(){this.layerUpdates.clear();}};var gl=class extends Yi{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=true,this.image={data:e,width:t,height:n,depth:r},this.magFilter=ni,this.minFilter=ni,this.wrapR=or,this.generateMipmaps=false,this.flipY=false,this.unpackAlignment=1;}};var lr=class{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=true,this.min=e,this.max=t;}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ui.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ui.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=ui.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=false){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=false){e.updateWorldMatrix(false,false);let n=e.geometry;if(n!==void 0){let s=n.getAttribute("position");if(t===true&&s!==void 0&&e.isInstancedMesh!==true)for(let o=0,a=s.count;o<a;o++)e.isMesh===true?e.getVertexPosition(o,ui):ui.fromBufferAttribute(s,o),ui.applyMatrix4(e.matrixWorld),this.expandByPoint(ui);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ga.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ga.copy(n.boundingBox)),Ga.applyMatrix4(e.matrixWorld),this.union(Ga);}let r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ui),ui.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return  false;this.getCenter(wo),Wa.subVectors(this.max,wo),xs.subVectors(e.a,wo),Ms.subVectors(e.b,wo),Ss.subVectors(e.c,wo),Qi.subVectors(Ms,xs),er.subVectors(Ss,Ms),Fr.subVectors(xs,Ss);let t=[0,-Qi.z,Qi.y,0,-er.z,er.y,0,-Fr.z,Fr.y,Qi.z,0,-Qi.x,er.z,0,-er.x,Fr.z,0,-Fr.x,-Qi.y,Qi.x,0,-er.y,er.x,0,-Fr.y,Fr.x,0];return !ed(t,xs,Ms,Ss,Wa)||(t=[1,0,0,0,1,0,0,0,1],!ed(t,xs,Ms,Ss,Wa))?false:(Xa.crossVectors(Qi,er),t=[Xa.x,Xa.y,Xa.z],ed(t,xs,Ms,Ss,Wa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ui).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ui).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Li[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Li[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Li[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Li[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Li[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Li[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Li[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Li[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Li),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return {min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Li=[new O,new O,new O,new O,new O,new O,new O,new O],ui=new O,Ga=new lr,xs=new O,Ms=new O,Ss=new O,Qi=new O,er=new O,Fr=new O,wo=new O,Wa=new O,Xa=new O,Lr=new O;function ed(i,e,t,n,r){for(let s=0,o=i.length-3;s<=o;s+=3){Lr.fromArray(i,s);let a=r.x*Math.abs(Lr.x)+r.y*Math.abs(Lr.y)+r.z*Math.abs(Lr.z),l=e.dot(Lr),c=t.dot(Lr),u=n.dot(Lr);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return  false}return  true}var y_=new lr,Co=new O,td=new O,Os=class{constructor(e=new O,t=-1){this.isSphere=true,this.center=e,this.radius=t;}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):y_.setFromPoints(e).getCenter(n);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Co.subVectors(e,this.center);let t=Co.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(Co,r/n),this.radius+=r;}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===true?this.radius=Math.max(this.radius,e.radius):(td.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Co.copy(e.center).add(td)),this.expandByPoint(Co.copy(e.center).sub(td))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return {radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Oi=new O,nd=new O,qa=new O,tr=new O,id=new O,Ya=new O,rd=new O,No=class{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t;}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Oi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Oi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Oi.copy(this.origin).addScaledVector(this.direction,t),Oi.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){nd.copy(e).add(t).multiplyScalar(.5),qa.copy(t).sub(e).normalize(),tr.copy(this.origin).sub(nd);let s=e.distanceTo(t)*.5,o=-this.direction.dot(qa),a=tr.dot(this.direction),l=-tr.dot(qa),c=tr.lengthSq(),u=Math.abs(1-o*o),d,p,f,_;if(u>0)if(d=o*l-a,p=o*a-l,_=s*u,d>=0)if(p>=-_)if(p<=_){let y=1/u;d*=y,p*=y,f=d*(d+o*p+2*a)+p*(o*d+p+2*l)+c;}else p=s,d=Math.max(0,-(o*p+a)),f=-d*d+p*(p+2*l)+c;else p=-s,d=Math.max(0,-(o*p+a)),f=-d*d+p*(p+2*l)+c;else p<=-_?(d=Math.max(0,-(-o*s+a)),p=d>0?-s:Math.min(Math.max(-s,-l),s),f=-d*d+p*(p+2*l)+c):p<=_?(d=0,p=Math.min(Math.max(-s,-l),s),f=p*(p+2*l)+c):(d=Math.max(0,-(o*s+a)),p=d>0?s:Math.min(Math.max(-s,-l),s),f=-d*d+p*(p+2*l)+c);else p=o>0?-s:s,d=Math.max(0,-(o*p+a)),f=-d*d+p*(p+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(nd).addScaledVector(qa,p),f}intersectSphere(e,t){Oi.subVectors(e.center,this.origin);let n=Oi.dot(this.direction),r=Oi.dot(Oi)-n*n,s=e.radius*e.radius;if(r>s)return null;let o=Math.sqrt(s-r),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?false:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,o,a,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,p=this.origin;return c>=0?(n=(e.min.x-p.x)*c,r=(e.max.x-p.x)*c):(n=(e.max.x-p.x)*c,r=(e.min.x-p.x)*c),u>=0?(s=(e.min.y-p.y)*u,o=(e.max.y-p.y)*u):(s=(e.max.y-p.y)*u,o=(e.min.y-p.y)*u),n>o||s>r||((s>n||isNaN(n))&&(n=s),(o<r||isNaN(r))&&(r=o),d>=0?(a=(e.min.z-p.z)*d,l=(e.max.z-p.z)*d):(a=(e.max.z-p.z)*d,l=(e.min.z-p.z)*d),n>l||a>r)||((a>n||n!==n)&&(n=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Oi)!==null}intersectTriangle(e,t,n,r,s){id.subVectors(t,e),Ya.subVectors(n,e),rd.crossVectors(id,Ya);let o=this.direction.dot(rd),a;if(o>0){if(r)return null;a=1;}else if(o<0)a=-1,o=-o;else return null;tr.subVectors(this.origin,e);let l=a*this.direction.dot(Ya.crossVectors(tr,Ya));if(l<0)return null;let c=a*this.direction.dot(id.cross(tr));if(c<0||l+c>o)return null;let u=-a*tr.dot(rd);return u<0?null:this.at(u/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Wt=class i{constructor(e,t,n,r,s,o,a,l,c,u,d,p,f,_,y,m){i.prototype.isMatrix4=true,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,o,a,l,c,u,d,p,f,_,y,m);}set(e,t,n,r,s,o,a,l,c,u,d,p,f,_,y,m){let h=this.elements;return h[0]=e,h[4]=t,h[8]=n,h[12]=r,h[1]=s,h[5]=o,h[9]=a,h[13]=l,h[2]=c,h[6]=u,h[10]=d,h[14]=p,h[3]=f,h[7]=_,h[11]=y,h[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,r=1/ws.setFromMatrixColumn(e,0).length(),s=1/ws.setFromMatrixColumn(e,1).length(),o=1/ws.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,s=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){let p=o*u,f=o*d,_=a*u,y=a*d;t[0]=l*u,t[4]=-l*d,t[8]=c,t[1]=f+_*c,t[5]=p-y*c,t[9]=-a*l,t[2]=y-p*c,t[6]=_+f*c,t[10]=o*l;}else if(e.order==="YXZ"){let p=l*u,f=l*d,_=c*u,y=c*d;t[0]=p+y*a,t[4]=_*a-f,t[8]=o*c,t[1]=o*d,t[5]=o*u,t[9]=-a,t[2]=f*a-_,t[6]=y+p*a,t[10]=o*l;}else if(e.order==="ZXY"){let p=l*u,f=l*d,_=c*u,y=c*d;t[0]=p-y*a,t[4]=-o*d,t[8]=_+f*a,t[1]=f+_*a,t[5]=o*u,t[9]=y-p*a,t[2]=-o*c,t[6]=a,t[10]=o*l;}else if(e.order==="ZYX"){let p=o*u,f=o*d,_=a*u,y=a*d;t[0]=l*u,t[4]=_*c-f,t[8]=p*c+y,t[1]=l*d,t[5]=y*c+p,t[9]=f*c-_,t[2]=-c,t[6]=a*l,t[10]=o*l;}else if(e.order==="YZX"){let p=o*l,f=o*c,_=a*l,y=a*c;t[0]=l*u,t[4]=y-p*d,t[8]=_*d+f,t[1]=d,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=f*d+_,t[10]=p-y*d;}else if(e.order==="XZY"){let p=o*l,f=o*c,_=a*l,y=a*c;t[0]=l*u,t[4]=-d,t[8]=c*u,t[1]=p*d+y,t[5]=o*u,t[9]=f*d-_,t[2]=_*d-f,t[6]=a*u,t[10]=y*d+p;}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(b_,e,x_)}lookAt(e,t,n){let r=this.elements;return zn.subVectors(e,t),zn.lengthSq()===0&&(zn.z=1),zn.normalize(),nr.crossVectors(n,zn),nr.lengthSq()===0&&(Math.abs(n.z)===1?zn.x+=1e-4:zn.z+=1e-4,zn.normalize(),nr.crossVectors(n,zn)),nr.normalize(),$a.crossVectors(zn,nr),r[0]=nr.x,r[4]=$a.x,r[8]=zn.x,r[1]=nr.y,r[5]=$a.y,r[9]=zn.y,r[2]=nr.z,r[6]=$a.z,r[10]=zn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,s=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],d=n[5],p=n[9],f=n[13],_=n[2],y=n[6],m=n[10],h=n[14],E=n[3],w=n[7],M=n[11],A=n[15],T=r[0],D=r[4],L=r[8],x=r[12],b=r[1],I=r[5],U=r[9],X=r[13],$=r[2],J=r[6],j=r[10],le=r[14],q=r[3],fe=r[7],ye=r[11],Fe=r[15];return s[0]=o*T+a*b+l*$+c*q,s[4]=o*D+a*I+l*J+c*fe,s[8]=o*L+a*U+l*j+c*ye,s[12]=o*x+a*X+l*le+c*Fe,s[1]=u*T+d*b+p*$+f*q,s[5]=u*D+d*I+p*J+f*fe,s[9]=u*L+d*U+p*j+f*ye,s[13]=u*x+d*X+p*le+f*Fe,s[2]=_*T+y*b+m*$+h*q,s[6]=_*D+y*I+m*J+h*fe,s[10]=_*L+y*U+m*j+h*ye,s[14]=_*x+y*X+m*le+h*Fe,s[3]=E*T+w*b+M*$+A*q,s[7]=E*D+w*I+M*J+A*fe,s[11]=E*L+w*U+M*j+A*ye,s[15]=E*x+w*X+M*le+A*Fe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],d=e[6],p=e[10],f=e[14],_=e[3],y=e[7],m=e[11],h=e[15];return _*(+s*l*d-r*c*d-s*a*p+n*c*p+r*a*f-n*l*f)+y*(+t*l*f-t*c*p+s*o*p-r*o*f+r*c*u-s*l*u)+m*(+t*c*d-t*a*f-s*o*d+n*o*f+s*a*u-n*c*u)+h*(-r*a*u-t*l*d+t*a*p+r*o*d-n*o*p+n*l*u)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],d=e[9],p=e[10],f=e[11],_=e[12],y=e[13],m=e[14],h=e[15],E=d*m*c-y*p*c+y*l*f-a*m*f-d*l*h+a*p*h,w=_*p*c-u*m*c-_*l*f+o*m*f+u*l*h-o*p*h,M=u*y*c-_*d*c+_*a*f-o*y*f-u*a*h+o*d*h,A=_*d*l-u*y*l-_*a*p+o*y*p+u*a*m-o*d*m,T=t*E+n*w+r*M+s*A;if(T===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let D=1/T;return e[0]=E*D,e[1]=(y*p*s-d*m*s-y*r*f+n*m*f+d*r*h-n*p*h)*D,e[2]=(a*m*s-y*l*s+y*r*c-n*m*c-a*r*h+n*l*h)*D,e[3]=(d*l*s-a*p*s-d*r*c+n*p*c+a*r*f-n*l*f)*D,e[4]=w*D,e[5]=(u*m*s-_*p*s+_*r*f-t*m*f-u*r*h+t*p*h)*D,e[6]=(_*l*s-o*m*s-_*r*c+t*m*c+o*r*h-t*l*h)*D,e[7]=(o*p*s-u*l*s+u*r*c-t*p*c-o*r*f+t*l*f)*D,e[8]=M*D,e[9]=(_*d*s-u*y*s-_*n*f+t*y*f+u*n*h-t*d*h)*D,e[10]=(o*y*s-_*a*s+_*n*c-t*y*c-o*n*h+t*a*h)*D,e[11]=(u*a*s-o*d*s-u*n*c+t*d*c+o*n*f-t*a*f)*D,e[12]=A*D,e[13]=(u*y*r-_*d*r+_*n*p-t*y*p-u*n*m+t*d*m)*D,e[14]=(_*a*r-o*y*r-_*n*l+t*y*l+o*n*m-t*a*m)*D,e[15]=(o*d*r-u*a*r+u*n*l-t*d*l-o*n*p+t*a*p)*D,this}scale(e){let t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),s=1-n,o=e.x,a=e.y,l=e.z,c=s*o,u=s*a;return this.set(c*o+n,c*a-r*l,c*l+r*a,0,c*a+r*l,u*a+n,u*l-r*o,0,c*l-r*a,u*l+r*o,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,o){return this.set(1,n,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,s=t._x,o=t._y,a=t._z,l=t._w,c=s+s,u=o+o,d=a+a,p=s*c,f=s*u,_=s*d,y=o*u,m=o*d,h=a*d,E=l*c,w=l*u,M=l*d,A=n.x,T=n.y,D=n.z;return r[0]=(1-(y+h))*A,r[1]=(f+M)*A,r[2]=(_-w)*A,r[3]=0,r[4]=(f-M)*T,r[5]=(1-(p+h))*T,r[6]=(m+E)*T,r[7]=0,r[8]=(_+w)*D,r[9]=(m-E)*D,r[10]=(1-(p+y))*D,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements,s=ws.set(r[0],r[1],r[2]).length(),o=ws.set(r[4],r[5],r[6]).length(),a=ws.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],di.copy(this);let c=1/s,u=1/o,d=1/a;return di.elements[0]*=c,di.elements[1]*=c,di.elements[2]*=c,di.elements[4]*=u,di.elements[5]*=u,di.elements[6]*=u,di.elements[8]*=d,di.elements[9]*=d,di.elements[10]*=d,t.setFromRotationMatrix(di),n.x=s,n.y=o,n.z=a,this}makePerspective(e,t,n,r,s,o,a=pi,l=false){let c=this.elements,u=2*s/(t-e),d=2*s/(n-r),p=(t+e)/(t-e),f=(n+r)/(n-r),_,y;if(l)_=s/(o-s),y=o*s/(o-s);else if(a===pi)_=-(o+s)/(o-s),y=-2*o*s/(o-s);else if(a===Io)_=-o/(o-s),y=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=p,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,s,o,a=pi,l=false){let c=this.elements,u=2/(t-e),d=2/(n-r),p=-(t+e)/(t-e),f=-(n+r)/(n-r),_,y;if(l)_=1/(o-s),y=o/(o-s);else if(a===pi)_=-2/(o-s),y=-(o+s)/(o-s);else if(a===Io)_=-1/(o-s),y=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=p,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=_,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return  false;return  true}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},ws=new O,di=new Wt,b_=new O(0,0,0),x_=new O(1,1,1),nr=new O,$a=new O,zn=new O,Kp=new Wt,Jp=new Gi,cr=(()=>{class i{constructor(t=0,n=0,r=0,s=i.DEFAULT_ORDER){this.isEuler=true,this._x=t,this._y=n,this._z=r,this._order=s;}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback();}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback();}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback();}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback();}set(t,n,r,s=this._order){return this._x=t,this._y=n,this._z=r,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,r=true){let s=t.elements,o=s[0],a=s[4],l=s[8],c=s[1],u=s[5],d=s[9],p=s[2],f=s[6],_=s[10];switch(n){case "XYZ":this._y=Math.asin(at(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,_),this._z=Math.atan2(-a,o)):(this._x=Math.atan2(f,u),this._z=0);break;case "YXZ":this._x=Math.asin(-at(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(l,_),this._z=Math.atan2(c,u)):(this._y=Math.atan2(-p,o),this._z=0);break;case "ZXY":this._x=Math.asin(at(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-p,_),this._z=Math.atan2(-a,u)):(this._y=0,this._z=Math.atan2(c,o));break;case "ZYX":this._y=Math.asin(-at(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(f,_),this._z=Math.atan2(c,o)):(this._x=0,this._z=Math.atan2(-a,u));break;case "YZX":this._z=Math.asin(at(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,u),this._y=Math.atan2(-p,o)):(this._x=0,this._y=Math.atan2(l,_));break;case "XZY":this._z=Math.asin(-at(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,u),this._y=Math.atan2(l,o)):(this._x=Math.atan2(-d,_),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+n);}return this._order=n,r===true&&this._onChangeCallback(),this}setFromQuaternion(t,n,r){return Kp.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Kp,n,r)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return Jp.setFromEuler(this),this.setFromQuaternion(Jp,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order;}}return i.DEFAULT_ORDER="XYZ",i})(),ks=class{constructor(){this.mask=1;}set(e){this.mask=(1<<e|0)>>>0;}enable(e){this.mask|=1<<e|0;}enableAll(){this.mask=-1;}toggle(e){this.mask^=1<<e|0;}disable(e){this.mask&=~(1<<e|0);}disableAll(){this.mask=0;}test(e){return (this.mask&e.mask)!==0}isEnabled(e){return (this.mask&(1<<e|0))!==0}},M_=0,Qp=new O,Cs=new Gi,ki=new Wt,ja=new O,Eo=new O,S_=new O,w_=new Gi,ef=new O(1,0,0),tf=new O(0,1,0),nf=new O(0,0,1),rf={type:"added"},C_={type:"removed"},Es={type:"childadded",child:null},sd={type:"childremoved",child:null},fi=(()=>{class i extends Hi{constructor(){super(),this.isObject3D=true,Object.defineProperty(this,"id",{value:M_++}),this.uuid=Jo(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new O,n=new cr,r=new Gi,s=new O(1,1,1);function o(){r.setFromEuler(n,false);}function a(){n.setFromQuaternion(r,void 0,false);}n._onChange(o),r._onChange(a),Object.defineProperties(this,{position:{configurable:true,enumerable:true,value:t},rotation:{configurable:true,enumerable:true,value:n},quaternion:{configurable:true,enumerable:true,value:r},scale:{configurable:true,enumerable:true,value:s},modelViewMatrix:{value:new Wt},normalMatrix:{value:new je}}),this.matrix=new Wt,this.matrixWorld=new Wt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=false,this.layers=new ks,this.visible=true,this.castShadow=false,this.receiveShadow=false,this.frustumCulled=true,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={};}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale);}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n);}setRotationFromEuler(t){this.quaternion.setFromEuler(t,true);}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t);}setRotationFromQuaternion(t){this.quaternion.copy(t);}rotateOnAxis(t,n){return Cs.setFromAxisAngle(t,n),this.quaternion.multiply(Cs),this}rotateOnWorldAxis(t,n){return Cs.setFromAxisAngle(t,n),this.quaternion.premultiply(Cs),this}rotateX(t){return this.rotateOnAxis(ef,t)}rotateY(t){return this.rotateOnAxis(tf,t)}rotateZ(t){return this.rotateOnAxis(nf,t)}translateOnAxis(t,n){return Qp.copy(t).applyQuaternion(this.quaternion),this.position.add(Qp.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(ef,t)}translateY(t){return this.translateOnAxis(tf,t)}translateZ(t){return this.translateOnAxis(nf,t)}localToWorld(t){return this.updateWorldMatrix(true,false),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(true,false),t.applyMatrix4(ki.copy(this.matrixWorld).invert())}lookAt(t,n,r){t.isVector3?ja.copy(t):ja.set(t,n,r);let s=this.parent;this.updateWorldMatrix(true,false),Eo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ki.lookAt(Eo,ja,this.up):ki.lookAt(ja,Eo,this.up),this.quaternion.setFromRotationMatrix(ki),s&&(ki.extractRotation(s.matrixWorld),Cs.setFromRotationMatrix(ki),this.quaternion.premultiply(Cs.invert()));}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(rf),Es.child=t,this.dispatchEvent(Es),Es.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let r=0;r<arguments.length;r++)this.remove(arguments[r]);return this}let n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(C_),sd.child=t,this.dispatchEvent(sd),sd.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(true,false),ki.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(true,false),ki.multiply(t.parent.matrixWorld)),t.applyMatrix4(ki),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(false,true),t.dispatchEvent(rf),Es.child=t,this.dispatchEvent(Es),Es.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let r=0,s=this.children.length;r<s;r++){let a=this.children[r].getObjectByProperty(t,n);if(a!==void 0)return a}}getObjectsByProperty(t,n,r=[]){this[t]===n&&r.push(this);let s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].getObjectsByProperty(t,n,r);return r}getWorldPosition(t){return this.updateWorldMatrix(true,false),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(true,false),this.matrixWorld.decompose(Eo,t,S_),t}getWorldScale(t){return this.updateWorldMatrix(true,false),this.matrixWorld.decompose(Eo,w_,t),t}getWorldDirection(t){this.updateWorldMatrix(true,false);let n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}traverse(t){t(this);let n=this.children;for(let r=0,s=n.length;r<s;r++)n[r].traverse(t);}traverseVisible(t){if(this.visible===false)return;t(this);let n=this.children;for(let r=0,s=n.length;r<s;r++)n[r].traverseVisible(t);}traverseAncestors(t){let n=this.parent;n!==null&&(t(n),n.traverseAncestors(t));}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=true;}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===true&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=false,t=true);let n=this.children;for(let r=0,s=n.length;r<s;r++)n[r].updateMatrixWorld(t);}updateWorldMatrix(t,n){let r=this.parent;if(t===true&&r!==null&&r.updateWorldMatrix(true,false),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===true&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),n===true){let s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].updateWorldMatrix(false,true);}}toJSON(t){let n=t===void 0||typeof t=="string",r={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},r.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===true&&(s.castShadow=true),this.receiveShadow===true&&(s.receiveShadow=true),this.visible===false&&(s.visible=false),this.frustumCulled===false&&(s.frustumCulled=false),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===false&&(s.matrixAutoUpdate=false),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(l=>k(m$1({},l),{boundingBox:l.boundingBox?l.boundingBox.toJSON():void 0,boundingSphere:l.boundingSphere?l.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(l=>m$1({},l)),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function o(l,c){return l[c.uuid]===void 0&&(l[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==true&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=o(t.geometries,this.geometry);let l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){let c=l.shapes;if(Array.isArray(c))for(let u=0,d=c.length;u<d;u++){let p=c[u];o(t.shapes,p);}else o(t.shapes,c);}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let l=[];for(let c=0,u=this.material.length;c<u;c++)l.push(o(t.materials,this.material[c]));s.material=l;}else s.material=o(t.materials,this.material);if(this.children.length>0){s.children=[];for(let l=0;l<this.children.length;l++)s.children.push(this.children[l].toJSON(t).object);}if(this.animations.length>0){s.animations=[];for(let l=0;l<this.animations.length;l++){let c=this.animations[l];s.animations.push(o(t.animations,c));}}if(n){let l=a(t.geometries),c=a(t.materials),u=a(t.textures),d=a(t.images),p=a(t.shapes),f=a(t.skeletons),_=a(t.animations),y=a(t.nodes);l.length>0&&(r.geometries=l),c.length>0&&(r.materials=c),u.length>0&&(r.textures=u),d.length>0&&(r.images=d),p.length>0&&(r.shapes=p),f.length>0&&(r.skeletons=f),_.length>0&&(r.animations=_),y.length>0&&(r.nodes=y);}return r.object=s,r;function a(l){let c=[];for(let u in l){let d=l[u];delete d.metadata,c.push(d);}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=true){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===true)for(let r=0;r<t.children.length;r++){let s=t.children[r];this.add(s.clone());}return this}}return i.DEFAULT_UP=new O(0,1,0),i.DEFAULT_MATRIX_AUTO_UPDATE=true,i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=true,i})(),hi=new O,Ui=new O,od=new O,Bi=new O,Ts=new O,As=new O,sf=new O,ad=new O,ld=new O,cd=new O,ud=new Ut,dd=new Ut,hd=new Ut,sr=class i{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n;}static getNormal(e,t,n,r){r.subVectors(n,t),hi.subVectors(e,t),r.cross(hi);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){hi.subVectors(r,t),Ui.subVectors(n,t),od.subVectors(e,t);let o=hi.dot(hi),a=hi.dot(Ui),l=hi.dot(od),c=Ui.dot(Ui),u=Ui.dot(od),d=o*c-a*a;if(d===0)return s.set(0,0,0),null;let p=1/d,f=(c*l-a*u)*p,_=(o*u-a*l)*p;return s.set(1-f-_,_,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Bi)===null?false:Bi.x>=0&&Bi.y>=0&&Bi.x+Bi.y<=1}static getInterpolation(e,t,n,r,s,o,a,l){return this.getBarycoord(e,t,n,r,Bi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Bi.x),l.addScaledVector(o,Bi.y),l.addScaledVector(a,Bi.z),l)}static getInterpolatedAttribute(e,t,n,r,s,o){return ud.setScalar(0),dd.setScalar(0),hd.setScalar(0),ud.fromBufferAttribute(e,t),dd.fromBufferAttribute(e,n),hd.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(ud,s.x),o.addScaledVector(dd,s.y),o.addScaledVector(hd,s.z),o}static isFrontFacing(e,t,n,r){return hi.subVectors(n,t),Ui.subVectors(e,t),hi.cross(Ui).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return hi.subVectors(this.c,this.b),Ui.subVectors(this.a,this.b),hi.cross(Ui).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return i.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,s=this.c,o,a;Ts.subVectors(r,n),As.subVectors(s,n),ad.subVectors(e,n);let l=Ts.dot(ad),c=As.dot(ad);if(l<=0&&c<=0)return t.copy(n);ld.subVectors(e,r);let u=Ts.dot(ld),d=As.dot(ld);if(u>=0&&d<=u)return t.copy(r);let p=l*d-u*c;if(p<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(n).addScaledVector(Ts,o);cd.subVectors(e,s);let f=Ts.dot(cd),_=As.dot(cd);if(_>=0&&f<=_)return t.copy(s);let y=f*c-l*_;if(y<=0&&c>=0&&_<=0)return a=c/(c-_),t.copy(n).addScaledVector(As,a);let m=u*_-f*d;if(m<=0&&d-u>=0&&f-_>=0)return sf.subVectors(s,r),a=(d-u)/(d-u+(f-_)),t.copy(r).addScaledVector(sf,a);let h=1/(m+y+p);return o=y*h,a=p*h,t.copy(n).addScaledVector(Ts,o).addScaledVector(As,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},nm={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ir={h:0,s:0,l:0},Za={h:0,s:0,l:0};function pd(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var et=class{constructor(e,t,n){return this.isColor=true,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r);}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=rn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,dt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=dt.workingColorSpace){return this.r=e,this.g=t,this.b=n,dt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=dt.workingColorSpace){if(e=m_(e,1),t=at(t,0,1),n=at(n,0,1),t===0)this.r=this.g=this.b=n;else {let s=n<=.5?n*(1+t):n+t-n*t,o=2*n-s;this.r=pd(o,s,e+1/3),this.g=pd(o,s,e),this.b=pd(o,s,e-1/3);}return dt.colorSpaceToWorking(this,r),this}setStyle(e,t=rn){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.");}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,o=r[1],a=r[2];switch(o){case "rgb":case "rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case "hsl":case "hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e);}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e);}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=rn){let n=nm[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Vi(e.r),this.g=Vi(e.g),this.b=Vi(e.b),this}copyLinearToSRGB(e){return this.r=Ps(e.r),this.g=Ps(e.g),this.b=Ps(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=rn){return dt.workingToColorSpace(wn.copy(this),e),Math.round(at(wn.r*255,0,255))*65536+Math.round(at(wn.g*255,0,255))*256+Math.round(at(wn.b*255,0,255))}getHexString(e=rn){return ("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=dt.workingColorSpace){dt.workingToColorSpace(wn.copy(this),t);let n=wn.r,r=wn.g,s=wn.b,o=Math.max(n,r,s),a=Math.min(n,r,s),l,c,u=(a+o)/2;if(a===o)l=0,c=0;else {let d=o-a;switch(c=u<=.5?d/(o+a):d/(2-o-a),o){case n:l=(r-s)/d+(r<s?6:0);break;case r:l=(s-n)/d+2;break;case s:l=(n-r)/d+4;break}l/=6;}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=dt.workingColorSpace){return dt.workingToColorSpace(wn.copy(this),t),e.r=wn.r,e.g=wn.g,e.b=wn.b,e}getStyle(e=rn){dt.workingToColorSpace(wn.copy(this),e);let t=wn.r,n=wn.g,r=wn.b;return e!==rn?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(ir),this.setHSL(ir.h+e,ir.s+t,ir.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ir),e.getHSL(Za);let n=ju(ir.h,Za.h,t),r=ju(ir.s,Za.s,t),s=ju(ir.l,Za.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b;}},wn=new et;et.NAMES=nm;var E_=0,ur=class extends Hi{constructor(){super(),this.isMaterial=true,Object.defineProperty(this,"id",{value:E_++}),this.uuid=Jo(),this.name="",this.type="Material",this.blending=Br,this.side=zi,this.vertexColors=false,this.opacity=1,this.transparent=false,this.alphaHash=false,this.blendSrc=ll,this.blendDst=cl,this.blendEquation=ar,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new et(0,0,0),this.blendAlpha=0,this.depthFunc=Vr,this.depthTest=true,this.depthWrite=true,this.stencilWriteMask=255,this.stencilFunc=Md,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ur,this.stencilZFail=Ur,this.stencilZPass=Ur,this.stencilWrite=false,this.clippingPlanes=null,this.clipIntersection=false,this.clipShadows=false,this.shadowSide=null,this.colorWrite=true,this.precision=null,this.polygonOffset=false,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=false,this.alphaToCoverage=false,this.premultipliedAlpha=false,this.forceSinglePass=false,this.allowOverride=true,this.visible=true,this.toneMapped=true,this.userData={},this.version=0,this._alphaTest=0;}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e;}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n;}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Br&&(n.blending=this.blending),this.side!==zi&&(n.side=this.side),this.vertexColors===true&&(n.vertexColors=true),this.opacity<1&&(n.opacity=this.opacity),this.transparent===true&&(n.transparent=true),this.blendSrc!==ll&&(n.blendSrc=this.blendSrc),this.blendDst!==cl&&(n.blendDst=this.blendDst),this.blendEquation!==ar&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Vr&&(n.depthFunc=this.depthFunc),this.depthTest===false&&(n.depthTest=this.depthTest),this.depthWrite===false&&(n.depthWrite=this.depthWrite),this.colorWrite===false&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Md&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ur&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ur&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ur&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===true&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===true&&(n.polygonOffset=true),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===true&&(n.dithering=true),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===true&&(n.alphaHash=true),this.alphaToCoverage===true&&(n.alphaToCoverage=true),this.premultipliedAlpha===true&&(n.premultipliedAlpha=true),this.forceSinglePass===true&&(n.forceSinglePass=true),this.wireframe===true&&(n.wireframe=true),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===true&&(n.flatShading=true),this.visible===false&&(n.visible=false),this.toneMapped===false&&(n.toneMapped=false),this.fog===false&&(n.fog=false),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){let o=[];for(let a in s){let l=s[a];delete l.metadata,o.push(l);}return o}if(t){let s=r(e.textures),o=r(e.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o);}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone();}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"});}set needsUpdate(e){e===true&&this.version++;}},Fo=class extends ur{constructor(e){super(),this.isMeshBasicMaterial=true,this.type="MeshBasicMaterial",this.color=new et(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new cr,this.combine=Nd,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=false,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=true,this.setValues(e);}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Kt=new O,Ka=new lt,T_=0,Gn=class{constructor(e,t,n=false){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=true,Object.defineProperty(this,"id",{value:T_++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Sd,this.updateRanges=[],this.gpuType=Ai,this.version=0;}onUploadCallback(){}set needsUpdate(e){e===true&&this.version++;}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t});}clearUpdateRanges(){this.updateRanges.length=0;}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ka.fromBufferAttribute(this,t),Ka.applyMatrix3(e),this.setXY(t,Ka.x,Ka.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.applyMatrix3(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.applyMatrix4(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.applyNormalMatrix(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Kt.fromBufferAttribute(this,t),Kt.transformDirection(e),this.setXYZ(t,Kt.x,Kt.y,Kt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=So(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Un(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=So(t,this.array)),t}setX(e,t){return this.normalized&&(t=Un(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=So(t,this.array)),t}setY(e,t){return this.normalized&&(t=Un(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=So(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Un(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=So(t,this.array)),t}setW(e,t){return this.normalized&&(t=Un(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Un(t,this.array),n=Un(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Un(t,this.array),n=Un(n,this.array),r=Un(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=Un(t,this.array),n=Un(n,this.array),r=Un(r,this.array),s=Un(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Sd&&(e.usage=this.usage),e}};var Lo=class extends Gn{constructor(e,t,n){super(new Uint16Array(e),t,n);}};var Oo=class extends Gn{constructor(e,t,n){super(new Uint32Array(e),t,n);}};var En=class extends Gn{constructor(e,t,n){super(new Float32Array(e),t,n);}},A_=0,ti=new Wt,fd=new fi,Rs=new O,Hn=new lr,To=new lr,un=new O,Ei=class i extends Hi{constructor(){super(),this.isBufferGeometry=true,Object.defineProperty(this,"id",{value:A_++}),this.uuid=Jo(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=false,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={};}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Xd(e)?Oo:Lo)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n});}clearGroups(){this.groups=[];}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t;}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=true);let n=this.attributes.normal;if(n!==void 0){let s=new je().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=true;}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=true),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return ti.makeRotationFromQuaternion(e),this.applyMatrix4(ti),this}rotateX(e){return ti.makeRotationX(e),this.applyMatrix4(ti),this}rotateY(e){return ti.makeRotationY(e),this.applyMatrix4(ti),this}rotateZ(e){return ti.makeRotationZ(e),this.applyMatrix4(ti),this}translate(e,t,n){return ti.makeTranslation(e,t,n),this.applyMatrix4(ti),this}scale(e,t,n){return ti.makeScale(e,t,n),this.applyMatrix4(ti),this}lookAt(e){return fd.lookAt(e),fd.updateMatrix(),this.applyMatrix4(fd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Rs).negate(),this.translate(Rs.x,Rs.y,Rs.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let r=0,s=e.length;r<s;r++){let o=e[r];n.push(o.x,o.y,o.z||0);}this.setAttribute("position",new En(n,3));}else {let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0);}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=true;}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new lr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){let s=t[n];Hn.setFromBufferAttribute(s),this.morphTargetsRelative?(un.addVectors(this.boundingBox.min,Hn.min),this.boundingBox.expandByPoint(un),un.addVectors(this.boundingBox.max,Hn.max),this.boundingBox.expandByPoint(un)):(this.boundingBox.expandByPoint(Hn.min),this.boundingBox.expandByPoint(Hn.max));}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this);}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Os);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){let n=this.boundingSphere.center;if(Hn.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){let a=t[s];To.setFromBufferAttribute(a),this.morphTargetsRelative?(un.addVectors(Hn.min,To.min),Hn.expandByPoint(un),un.addVectors(Hn.max,To.max),Hn.expandByPoint(un)):(Hn.expandByPoint(To.min),Hn.expandByPoint(To.max));}Hn.getCenter(n);let r=0;for(let s=0,o=e.count;s<o;s++)un.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(un));if(t)for(let s=0,o=t.length;s<o;s++){let a=t[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)un.fromBufferAttribute(a,c),l&&(Rs.fromBufferAttribute(e,c),un.add(Rs)),r=Math.max(r,n.distanceToSquared(un));}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this);}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===false&&this.setAttribute("tangent",new Gn(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let L=0;L<n.count;L++)a[L]=new O,l[L]=new O;let c=new O,u=new O,d=new O,p=new lt,f=new lt,_=new lt,y=new O,m=new O;function h(L,x,b){c.fromBufferAttribute(n,L),u.fromBufferAttribute(n,x),d.fromBufferAttribute(n,b),p.fromBufferAttribute(s,L),f.fromBufferAttribute(s,x),_.fromBufferAttribute(s,b),u.sub(c),d.sub(c),f.sub(p),_.sub(p);let I=1/(f.x*_.y-_.x*f.y);isFinite(I)&&(y.copy(u).multiplyScalar(_.y).addScaledVector(d,-f.y).multiplyScalar(I),m.copy(d).multiplyScalar(f.x).addScaledVector(u,-_.x).multiplyScalar(I),a[L].add(y),a[x].add(y),a[b].add(y),l[L].add(m),l[x].add(m),l[b].add(m));}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let L=0,x=E.length;L<x;++L){let b=E[L],I=b.start,U=b.count;for(let X=I,$=I+U;X<$;X+=3)h(e.getX(X+0),e.getX(X+1),e.getX(X+2));}let w=new O,M=new O,A=new O,T=new O;function D(L){A.fromBufferAttribute(r,L),T.copy(A);let x=a[L];w.copy(x),w.sub(A.multiplyScalar(A.dot(x))).normalize(),M.crossVectors(T,x);let I=M.dot(l[L])<0?-1:1;o.setXYZW(L,w.x,w.y,w.z,I);}for(let L=0,x=E.length;L<x;++L){let b=E[L],I=b.start,U=b.count;for(let X=I,$=I+U;X<$;X+=3)D(e.getX(X+0)),D(e.getX(X+1)),D(e.getX(X+2));}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Gn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let p=0,f=n.count;p<f;p++)n.setXYZ(p,0,0,0);let r=new O,s=new O,o=new O,a=new O,l=new O,c=new O,u=new O,d=new O;if(e)for(let p=0,f=e.count;p<f;p+=3){let _=e.getX(p+0),y=e.getX(p+1),m=e.getX(p+2);r.fromBufferAttribute(t,_),s.fromBufferAttribute(t,y),o.fromBufferAttribute(t,m),u.subVectors(o,s),d.subVectors(r,s),u.cross(d),a.fromBufferAttribute(n,_),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(_,a.x,a.y,a.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z);}else for(let p=0,f=t.count;p<f;p+=3)r.fromBufferAttribute(t,p+0),s.fromBufferAttribute(t,p+1),o.fromBufferAttribute(t,p+2),u.subVectors(o,s),d.subVectors(r,s),u.cross(d),n.setXYZ(p+0,u.x,u.y,u.z),n.setXYZ(p+1,u.x,u.y,u.z),n.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=true;}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)un.fromBufferAttribute(e,t),un.normalize(),e.setXYZ(t,un.x,un.y,un.z);}toNonIndexed(){function e(a,l){let c=a.array,u=a.itemSize,d=a.normalized,p=new c.constructor(l.length*u),f=0,_=0;for(let y=0,m=l.length;y<m;y++){a.isInterleavedBufferAttribute?f=l[y]*a.data.stride+a.offset:f=l[y]*u;for(let h=0;h<u;h++)p[_++]=c[f++];}return new Gn(p,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,r=this.attributes;for(let a in r){let l=r[a],c=e(l,n);t.setAttribute(a,c);}let s=this.morphAttributes;for(let a in s){let l=[],c=s[a];for(let u=0,d=c.length;u<d;u++){let p=c[u],f=e(p,n);l.push(f);}t.morphAttributes[a]=l;}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex);}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data);}let r={},s=false;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,p=c.length;d<p;d++){let f=c[d];u.push(f.toJSON(e.data));}u.length>0&&(r[l]=u,s=true);}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let c in r){let u=r[c];this.setAttribute(c,u.clone(t));}let s=e.morphAttributes;for(let c in s){let u=[],d=s[c];for(let p=0,f=d.length;p<f;p++)u.push(d[p].clone(t));this.morphAttributes[c]=u;}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,u=o.length;c<u;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex);}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"});}},of=new Wt,Or=new No,Ja=new Os,af=new O,Qa=new O,el=new O,tl=new O,md=new O,nl=new O,lf=new O,il=new O,gt=class extends fi{constructor(e=new Ei,t=new Fo){super(),this.isMesh=true,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets();}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s;}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(s&&a){nl.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let u=a[l],d=s[l];u!==0&&(md.fromBufferAttribute(d,e),o?nl.addScaledVector(md,u):nl.addScaledVector(md.sub(t),u));}t.add(nl);}return t}raycast(e,t){let n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ja.copy(n.boundingSphere),Ja.applyMatrix4(s),Or.copy(e.ray).recast(e.near),!(Ja.containsPoint(Or.origin)===false&&(Or.intersectSphere(Ja,af)===null||Or.origin.distanceToSquared(af)>(e.far-e.near)**2))&&(of.copy(s).invert(),Or.copy(e.ray).applyMatrix4(of),!(n.boundingBox!==null&&Or.intersectsBox(n.boundingBox)===false)&&this._computeIntersections(e,t,Or)));}_computeIntersections(e,t,n){let r,s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,d=s.attributes.normal,p=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let _=0,y=p.length;_<y;_++){let m=p[_],h=o[m.materialIndex],E=Math.max(m.start,f.start),w=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let M=E,A=w;M<A;M+=3){let T=a.getX(M),D=a.getX(M+1),L=a.getX(M+2);r=rl(this,h,e,n,c,u,d,T,D,L),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,t.push(r));}}else {let _=Math.max(0,f.start),y=Math.min(a.count,f.start+f.count);for(let m=_,h=y;m<h;m+=3){let E=a.getX(m),w=a.getX(m+1),M=a.getX(m+2);r=rl(this,o,e,n,c,u,d,E,w,M),r&&(r.faceIndex=Math.floor(m/3),t.push(r));}}else if(l!==void 0)if(Array.isArray(o))for(let _=0,y=p.length;_<y;_++){let m=p[_],h=o[m.materialIndex],E=Math.max(m.start,f.start),w=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let M=E,A=w;M<A;M+=3){let T=M,D=M+1,L=M+2;r=rl(this,h,e,n,c,u,d,T,D,L),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,t.push(r));}}else {let _=Math.max(0,f.start),y=Math.min(l.count,f.start+f.count);for(let m=_,h=y;m<h;m+=3){let E=m,w=m+1,M=m+2;r=rl(this,o,e,n,c,u,d,E,w,M),r&&(r.faceIndex=Math.floor(m/3),t.push(r));}}}};function R_(i,e,t,n,r,s,o,a){let l;if(e.side===Dn?l=n.intersectTriangle(o,s,r,true,a):l=n.intersectTriangle(r,s,o,e.side===zi,a),l===null)return null;il.copy(a),il.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(il);return c<t.near||c>t.far?null:{distance:c,point:il.clone(),object:i}}function rl(i,e,t,n,r,s,o,a,l,c){i.getVertexPosition(a,Qa),i.getVertexPosition(l,el),i.getVertexPosition(c,tl);let u=R_(i,e,t,n,Qa,el,tl,lf);if(u){let d=new O;sr.getBarycoord(lf,Qa,el,tl,d),r&&(u.uv=sr.getInterpolatedAttribute(r,a,l,c,d,new lt)),s&&(u.uv1=sr.getInterpolatedAttribute(s,a,l,c,d,new lt)),o&&(u.normal=sr.getInterpolatedAttribute(o,a,l,c,d,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let p={a,b:l,c,normal:new O,materialIndex:0};sr.getNormal(Qa,el,tl,p.normal),u.face=p,u.barycoord=d;}return u}var ii=class i extends Ei{constructor(e=1,t=1,n=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:o};let a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);let l=[],c=[],u=[],d=[],p=0,f=0;_("z","y","x",-1,-1,n,t,e,o,s,0),_("z","y","x",1,-1,n,t,-e,o,s,1),_("x","z","y",1,1,e,n,t,r,o,2),_("x","z","y",1,-1,e,n,-t,r,o,3),_("x","y","z",1,-1,e,t,n,r,s,4),_("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new En(c,3)),this.setAttribute("normal",new En(u,3)),this.setAttribute("uv",new En(d,2));function _(y,m,h,E,w,M,A,T,D,L,x){let b=M/D,I=A/L,U=M/2,X=A/2,$=T/2,J=D+1,j=L+1,le=0,q=0,fe=new O;for(let ye=0;ye<j;ye++){let Fe=ye*I-X;for(let it=0;it<J;it++){let xt=it*b-U;fe[y]=xt*E,fe[m]=Fe*w,fe[h]=$,c.push(fe.x,fe.y,fe.z),fe[y]=0,fe[m]=0,fe[h]=T>0?1:-1,u.push(fe.x,fe.y,fe.z),d.push(it/D),d.push(1-ye/L),le+=1;}}for(let ye=0;ye<L;ye++)for(let Fe=0;Fe<D;Fe++){let it=p+Fe+J*ye,xt=p+Fe+J*(ye+1),Tt=p+(Fe+1)+J*(ye+1),ft=p+(Fe+1)+J*ye;l.push(it,xt,ft),l.push(xt,Tt,ft),q+=6;}a.addGroup(f,q,x),f+=q,p+=le;}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function jr(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r;}}return e}function Tn(i){let e={};for(let t=0;t<i.length;t++){let n=jr(i[t]);for(let r in n)e[r]=n[r];}return e}function I_(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function qd(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===true?e.texture.colorSpace:dt.workingColorSpace}var im={clone:jr,merge:Tn},D_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,P_=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,mi=class extends ur{constructor(e){super(),this.isShaderMaterial=true,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=D_,this.fragmentShader=P_,this.linewidth=1,this.wireframe=false,this.wireframeLinewidth=1,this.fog=false,this.lights=false,this.clipping=false,this.forceSinglePass=true,this.extensions={clipCullDistance:false,multiDraw:false},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=false,this.glslVersion=null,e!==void 0&&this.setValues(e);}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=jr(e.uniforms),this.uniformsGroups=I_(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o};}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let r in this.extensions)this.extensions[r]===true&&(n[r]=true);return Object.keys(n).length>0&&(t.extensions=n),t}},ko=class extends fi{constructor(){super(),this.isCamera=true,this.type="Camera",this.matrixWorldInverse=new Wt,this.projectionMatrix=new Wt,this.projectionMatrixInverse=new Wt,this.coordinateSystem=pi,this._reversedDepth=false;}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert();}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert();}clone(){return new this.constructor().copy(this)}},rr=new O,cf=new lt,uf=new lt,dn=class extends ko{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=true,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix();}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=pl*2*Math.atan(t),this.updateProjectionMatrix();}getFocalLength(){let e=Math.tan($u*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return pl*2*Math.atan(Math.tan($u*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){rr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(rr.x,rr.y).multiplyScalar(-e/rr.z),rr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(rr.x,rr.y).multiplyScalar(-e/rr.z);}getViewSize(e,t){return this.getViewBounds(e,cf,uf),t.subVectors(uf,cf)}setViewOffset(e,t,n,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:true,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=true,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix();}clearViewOffset(){this.view!==null&&(this.view.enabled=false),this.updateProjectionMatrix();}updateProjectionMatrix(){let e=this.near,t=e*Math.tan($u*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-0.5*r,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,t-=o.offsetY*n/c,r*=o.width/l,n*=o.height/c;}let a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert();}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Is=-90,Ds=1,_l=class extends fi{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new dn(Is,Ds,e,t);r.layers=this.layers,this.add(r);let s=new dn(Is,Ds,e,t);s.layers=this.layers,this.add(s);let o=new dn(Is,Ds,e,t);o.layers=this.layers,this.add(o);let a=new dn(Is,Ds,e,t);a.layers=this.layers,this.add(a);let l=new dn(Is,Ds,e,t);l.layers=this.layers,this.add(l);let c=new dn(Is,Ds,e,t);c.layers=this.layers,this.add(c);}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,s,o,a,l]=t;for(let c of t)this.remove(c);if(e===pi)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Io)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld();}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,o,a,l,c,u]=this.children,d=e.getRenderTarget(),p=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=false;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=false,e.setRenderTarget(n,0,r),e.render(t,s),e.setRenderTarget(n,1,r),e.render(t,o),e.setRenderTarget(n,2,r),e.render(t,a),e.setRenderTarget(n,3,r),e.render(t,l),e.setRenderTarget(n,4,r),e.render(t,c),n.texture.generateMipmaps=y,e.setRenderTarget(n,5,r),e.render(t,u),e.setRenderTarget(d,p,f),e.xr.enabled=_,n.texture.needsPMREMUpdate=true;}},Uo=class extends Yi{constructor(e=[],t=Yr,n,r,s,o,a,l,c,u){super(e,t,n,r,s,o,a,l,c,u),this.isCubeTexture=true,this.flipY=false;}get images(){return this.image}set images(e){this.image=e;}},vl=class extends Ci{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=true;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Uo(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=true;}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new ii(5,5,5),s=new mi({name:"CubemapFromEquirect",uniforms:jr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Dn,blending:Wi});s.uniforms.tEquirect.value=t;let o=new gt(r,s),a=t.minFilter;return t.minFilter===fr&&(t.minFilter=Wn),new _l(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=true,n=true,r=true){let s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,r);e.setRenderTarget(s);}},Cn=class extends fi{constructor(){super(),this.isGroup=true,this.type="Group";}},N_={type:"move"},Us=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null;}getHandSpace(){return this._hand===null&&(this._hand=new Cn,this._hand.matrixAutoUpdate=false,this._hand.visible=false,this._hand.joints={},this._hand.inputState={pinching:false}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Cn,this._targetRay.matrixAutoUpdate=false,this._targetRay.visible=false,this._targetRay.hasLinearVelocity=false,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=false,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Cn,this._grip.matrixAutoUpdate=false,this._grip.visible=false,this._grip.hasLinearVelocity=false,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=false,this._grip.angularVelocity=new O),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n);}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=false),this._grip!==null&&(this._grip.visible=false),this._hand!==null&&(this._hand.visible=false),this}update(e,t,n){let r=null,s=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=true;for(let y of e.hand.values()){let m=t.getJointPose(y,n),h=this._getHandJoint(c,y);m!==null&&(h.matrix.fromArray(m.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=true,h.jointRadius=m.radius),h.visible=m!==null;}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],p=u.position.distanceTo(d.position),f=.02,_=.005;c.inputState.pinching&&p>f+_?(c.inputState.pinching=false,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&p<=f-_&&(c.inputState.pinching=true,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}));}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=true,s.linearVelocity?(l.hasLinearVelocity=true,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=false,s.angularVelocity?(l.hasAngularVelocity=true,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=false));a!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=true,r.linearVelocity?(a.hasLinearVelocity=true,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=false,r.angularVelocity?(a.hasAngularVelocity=true,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=false,this.dispatchEvent(N_)));}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Cn;n.matrixAutoUpdate=false,n.visible=false,e.joints[t.jointName]=n,e.add(n);}return e.joints[t.jointName]}};var Hr=class extends fi{constructor(){super(),this.isScene=true,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new cr,this.environmentIntensity=1,this.environmentRotation=new cr,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}));}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var gd=new O,F_=new O,L_=new je,wi=class{constructor(e=new O(1,0,0),t=0){this.isPlane=true,this.normal=e,this.constant=t;}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=gd.subVectors(n,t).cross(F_.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(gd),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||L_.getNormalMatrix(e),r=this.coplanarPoint(gd).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},kr=new Os,O_=new lt(.5,.5),sl=new O,Bs=class{constructor(e=new wi,t=new wi,n=new wi,r=new wi,s=new wi,o=new wi){this.planes=[e,t,n,r,s,o];}set(e,t,n,r,s,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=pi,n=false){let r=this.planes,s=e.elements,o=s[0],a=s[1],l=s[2],c=s[3],u=s[4],d=s[5],p=s[6],f=s[7],_=s[8],y=s[9],m=s[10],h=s[11],E=s[12],w=s[13],M=s[14],A=s[15];if(r[0].setComponents(c-o,f-u,h-_,A-E).normalize(),r[1].setComponents(c+o,f+u,h+_,A+E).normalize(),r[2].setComponents(c+a,f+d,h+y,A+w).normalize(),r[3].setComponents(c-a,f-d,h-y,A-w).normalize(),n)r[4].setComponents(l,p,m,M).normalize(),r[5].setComponents(c-l,f-p,h-m,A-M).normalize();else if(r[4].setComponents(c-l,f-p,h-m,A-M).normalize(),t===pi)r[5].setComponents(c+l,f+p,h+m,A+M).normalize();else if(t===Io)r[5].setComponents(l,p,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),kr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else {let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),kr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld);}return this.intersectsSphere(kr)}intersectsSprite(e){kr.center.set(0,0,0);let t=O_.distanceTo(e.center);return kr.radius=.7071067811865476+t,kr.applyMatrix4(e.matrixWorld),this.intersectsSphere(kr)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return  false;return  true}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(sl.x=r.normal.x>0?e.max.x:e.min.x,sl.y=r.normal.y>0?e.max.y:e.min.y,sl.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(sl)<0)return  false}return  true}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return  false;return  true}clone(){return new this.constructor().copy(this)}};var Bo=class extends Yi{constructor(e,t,n,r,s,o,a,l,c){super(e,t,n,r,s,o,a,l,c),this.isCanvasTexture=true,this.needsUpdate=true;}},Vo=class extends Yi{constructor(e,t,n=mr,r,s,o,a=ni,l=ni,c,u=Ns,d=1){if(u!==Ns&&u!==qs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let p={width:e,height:t,depth:d};super(p,r,s,o,a,l,u,n,c),this.isDepthTexture=true,this.flipY=false,this.generateMipmaps=false,this.compareFunction=null;}copy(e){return super.copy(e),this.source=new Ls(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},zo=class extends Yi{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=true;}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var dr=class i extends Ei{constructor(e=1,t=1,n=1,r=32,s=1,o=false,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:l};let c=this;r=Math.floor(r),s=Math.floor(s);let u=[],d=[],p=[],f=[],_=0,y=[],m=n/2,h=0;E(),o===false&&(e>0&&w(true),t>0&&w(false)),this.setIndex(u),this.setAttribute("position",new En(d,3)),this.setAttribute("normal",new En(p,3)),this.setAttribute("uv",new En(f,2));function E(){let M=new O,A=new O,T=0,D=(t-e)/n;for(let L=0;L<=s;L++){let x=[],b=L/s,I=b*(t-e)+e;for(let U=0;U<=r;U++){let X=U/r,$=X*l+a,J=Math.sin($),j=Math.cos($);A.x=I*J,A.y=-b*n+m,A.z=I*j,d.push(A.x,A.y,A.z),M.set(J,D,j).normalize(),p.push(M.x,M.y,M.z),f.push(X,1-b),x.push(_++);}y.push(x);}for(let L=0;L<r;L++)for(let x=0;x<s;x++){let b=y[x][L],I=y[x+1][L],U=y[x+1][L+1],X=y[x][L+1];(e>0||x!==0)&&(u.push(b,I,X),T+=3),(t>0||x!==s-1)&&(u.push(I,U,X),T+=3);}c.addGroup(h,T,0),h+=T;}function w(M){let A=_,T=new lt,D=new O,L=0,x=M===true?e:t,b=M===true?1:-1;for(let U=1;U<=r;U++)d.push(0,m*b,0),p.push(0,b,0),f.push(.5,.5),_++;let I=_;for(let U=0;U<=r;U++){let $=U/r*l+a,J=Math.cos($),j=Math.sin($);D.x=x*j,D.y=m*b,D.z=x*J,d.push(D.x,D.y,D.z),p.push(0,b,0),T.x=J*.5+.5,T.y=j*.5*b+.5,f.push(T.x,T.y),_++;}for(let U=0;U<r;U++){let X=A+U,$=I+U;M===true?u.push($,$+1,X):u.push($+1,$,X),L+=3;}c.addGroup(h,L,M===true?1:2),h+=L;}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Xn=class i extends Ei{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let s=e/2,o=t/2,a=Math.floor(n),l=Math.floor(r),c=a+1,u=l+1,d=e/a,p=t/l,f=[],_=[],y=[],m=[];for(let h=0;h<u;h++){let E=h*p-o;for(let w=0;w<c;w++){let M=w*d-s;_.push(M,-E,0),y.push(0,0,1),m.push(w/a),m.push(1-h/l);}}for(let h=0;h<l;h++)for(let E=0;E<a;E++){let w=E+c*h,M=E+c*(h+1),A=E+1+c*(h+1),T=E+1+c*h;f.push(w,M,T),f.push(M,A,T);}this.setIndex(f),this.setAttribute("position",new En(_,3)),this.setAttribute("normal",new En(y,3)),this.setAttribute("uv",new En(m,2));}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var Vs=class i extends Ei{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,u=[],d=new O,p=new O,f=[],_=[],y=[],m=[];for(let h=0;h<=n;h++){let E=[],w=h/n,M=0;h===0&&o===0?M=.5/t:h===n&&l===Math.PI&&(M=-0.5/t);for(let A=0;A<=t;A++){let T=A/t;d.x=-e*Math.cos(r+T*s)*Math.sin(o+w*a),d.y=e*Math.cos(o+w*a),d.z=e*Math.sin(r+T*s)*Math.sin(o+w*a),_.push(d.x,d.y,d.z),p.copy(d).normalize(),y.push(p.x,p.y,p.z),m.push(T+M,1-w),E.push(c++);}u.push(E);}for(let h=0;h<n;h++)for(let E=0;E<t;E++){let w=u[h][E+1],M=u[h][E],A=u[h+1][E],T=u[h+1][E+1];(h!==0||o>0)&&f.push(w,M,T),(h!==n-1||l<Math.PI)&&f.push(M,A,T);}this.setIndex(f),this.setAttribute("position",new En(_,3)),this.setAttribute("normal",new En(y,3)),this.setAttribute("uv",new En(m,2));}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var qn=class extends ur{constructor(e){super(),this.isMeshStandardMaterial=true,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new et(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new et(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Hd,this.normalScale=new lt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new cr,this.envMapIntensity=1,this.wireframe=false,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=false,this.fog=true,this.setValues(e);}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var yl=class extends ur{constructor(e){super(),this.isMeshDepthMaterial=true,this.type="MeshDepthMaterial",this.depthPacking=Wf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=false,this.wireframeLinewidth=1,this.setValues(e);}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},bl=class extends ur{constructor(e){super(),this.isMeshDistanceMaterial=true,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e);}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Go=class extends fi{constructor(e,t=1){super(),this.isLight=true,this.type="Light",this.color=new et(e),this.intensity=t;}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Wr=class extends Go{constructor(e,t,n){super(e,n),this.isHemisphereLight=true,this.type="HemisphereLight",this.position.copy(fi.DEFAULT_UP),this.updateMatrix(),this.groundColor=new et(t);}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},_d=new Wt,df=new O,hf=new O,wd=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new lt(512,512),this.mapType=gi,this.map=null,this.mapPass=null,this.matrix=new Wt,this.autoUpdate=true,this.needsUpdate=false,this._frustum=new Bs,this._frameExtents=new lt(1,1),this._viewportCount=1,this._viewports=[new Ut(0,0,1,1)];}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;df.setFromMatrixPosition(e.matrixWorld),t.position.copy(df),hf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(hf),t.updateMatrixWorld(),_d.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(_d,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(_d);}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose();}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(false).object,delete e.camera.matrix,e}};var Wo=class extends ko{constructor(e=-1,t=1,n=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=true,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix();}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,o){this.view===null&&(this.view={enabled:true,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=true,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix();}clearViewOffset(){this.view!==null&&(this.view.enabled=false),this.updateProjectionMatrix();}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=n-e,o=n+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height;}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert();}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Cd=class extends wd{constructor(){super(new Wo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=true;}},Xr=class extends Go{constructor(e,t){super(e,t),this.isDirectionalLight=true,this.type="DirectionalLight",this.position.copy(fi.DEFAULT_UP),this.updateMatrix(),this.target=new fi,this.shadow=new Cd;}dispose(){this.shadow.dispose();}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Al=class extends dn{constructor(e=[]){super(),this.isArrayCamera=true,this.isMultiViewCamera=false,this.cameras=e;}},qr=class{constructor(e=true){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=false;}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=true;}stop(){this.getElapsedTime(),this.running=false,this.autoStart=false;}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e;}return e}};var Yd="\\[\\]\\.:\\/",$d="[^"+Yd+"]",B_="[^"+Yd.replace("\\.","")+"]";/((?:WC+[\/:])*)/.source.replace("WC",$d);/(WCOD+)?/.source.replace("WCOD",B_);/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",$d);/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",$d);var pf=new Wt,Xo=class{constructor(e,t,n=0,r=1/0){this.ray=new No(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new ks,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}};}set(e,t){this.ray.set(e,t);}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type);}setFromXRController(e){return pf.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(pf),this}intersectObject(e,t=true,n=[]){return Td(e,this,n,t),n.sort(ff),n}intersectObjects(e,t=true,n=[]){for(let r=0,s=e.length;r<s;r++)Td(e[r],this,n,t);return n.sort(ff),n}};function ff(i,e){return i.distance-e.distance}function Td(i,e,t,n){let r=true;if(i.layers.test(e.layers)&&i.raycast(e,t)===false&&(r=false),r===true&&n===true){let s=i.children;for(let o=0,a=s.length;o<a;o++)Td(s[o],e,t,true);}}function jd(i,e,t,n){let r=q_(n);switch(t){case Ud:return i*e;case Vd:return i*e/r.components*r.byteLength;case Hl:return i*e/r.components*r.byteLength;case zd:return i*e*2/r.components*r.byteLength;case Gl:return i*e*2/r.components*r.byteLength;case Bd:return i*e*3/r.components*r.byteLength;case si:return i*e*4/r.components*r.byteLength;case Wl:return i*e*4/r.components*r.byteLength;case $o:case jo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Zo:case Ko:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ql:case $l:return Math.max(i,16)*Math.max(e,8)/4;case Xl:case Yl:return Math.max(i,8)*Math.max(e,8)/2;case jl:case Zl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Kl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Jl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ql:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case ec:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case tc:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case nc:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case ic:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case rc:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case sc:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case oc:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case ac:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case lc:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case cc:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case uc:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case dc:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case hc:case pc:case fc:return Math.ceil(i/4)*Math.ceil(e/4)*16;case mc:case gc:return Math.ceil(i/4)*Math.ceil(e/4)*8;case _c:case vc:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function q_(i){switch(i){case gi:case Fd:return {byteLength:1,components:1};case Gs:case Ld:case Ws:return {byteLength:2,components:1};case Vl:case zl:return {byteLength:2,components:4};case mr:case Bl:case Ai:return {byteLength:4,components:1};case Od:case kd:return {byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="180");function Tm(){let i=null,e=false,t=null,n=null;function r(s,o){t(s,o),n=i.requestAnimationFrame(r);}return {start:function(){e!==true&&t!==null&&(n=i.requestAnimationFrame(r),e=true);},stop:function(){i.cancelAnimationFrame(n),e=false;},setAnimationLoop:function(s){t=s;},setContext:function(s){i=s;}}}function $_(i){let e=new WeakMap;function t(a,l){let c=a.array,u=a.usage,d=c.byteLength,p=i.createBuffer();i.bindBuffer(l,p),i.bufferData(l,c,u),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return {buffer:p,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,l,c){let u=l.array,d=l.updateRanges;if(i.bindBuffer(c,a),d.length===0)i.bufferSubData(c,0,u);else {d.sort((f,_)=>f.start-_.start);let p=0;for(let f=1;f<d.length;f++){let _=d[p],y=d[f];y.start<=_.start+_.count+1?_.count=Math.max(_.count,y.start+y.count-_.start):(++p,d[p]=y);}d.length=p+1;for(let f=0,_=d.length;f<_;f++){let y=d[f];i.bufferSubData(c,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count);}l.clearUpdateRanges();}l.onUploadCallback();}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(i.deleteBuffer(l.buffer),e.delete(a));}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version;}}return {get:r,remove:s,update:o}}var j_=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Z_=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,K_=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,J_=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Q_=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ev=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,tv=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,nv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,iv=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,rv=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,sv=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ov=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,av=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,lv=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,cv=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,uv=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,dv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,pv=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,fv=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,mv=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,gv=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,_v=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,vv=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,yv=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,bv=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,xv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Mv=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Sv=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,wv=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Cv="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ev=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Tv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Av=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Rv=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Iv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Dv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Pv=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Nv=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Fv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Lv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ov=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,kv=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Uv=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bv=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Vv=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,zv=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Hv=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Gv=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Wv=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xv=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,qv=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Yv=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,$v=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,jv=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Zv=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Kv=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Jv=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qv=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ey=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ty=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ny=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,iy=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ry=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sy=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,oy=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,ay=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ly=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,cy=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,uy=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,dy=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hy=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,py=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,fy=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,my=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gy=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,_y=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,vy=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,yy=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,by=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xy=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,My=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Sy=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,wy=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Cy=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Ey=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ty=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ay=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ry=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Iy=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Dy=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Py=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Ny=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Fy=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ly=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Oy=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ky=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Uy=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,By=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Vy=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,zy=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Hy=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Gy=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Wy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Xy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,qy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Yy=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,$y=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,jy=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ky=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Qy=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,e0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,t0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,n0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,i0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,r0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,s0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,o0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,a0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,l0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,c0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,u0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,d0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,h0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,p0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,f0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,m0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,g0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,y0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,b0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,x0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,M0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,S0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,w0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,C0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,E0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,T0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Qe={alphahash_fragment:j_,alphahash_pars_fragment:Z_,alphamap_fragment:K_,alphamap_pars_fragment:J_,alphatest_fragment:Q_,alphatest_pars_fragment:ev,aomap_fragment:tv,aomap_pars_fragment:nv,batching_pars_vertex:iv,batching_vertex:rv,begin_vertex:sv,beginnormal_vertex:ov,bsdfs:av,iridescence_fragment:lv,bumpmap_pars_fragment:cv,clipping_planes_fragment:uv,clipping_planes_pars_fragment:dv,clipping_planes_pars_vertex:hv,clipping_planes_vertex:pv,color_fragment:fv,color_pars_fragment:mv,color_pars_vertex:gv,color_vertex:_v,common:vv,cube_uv_reflection_fragment:yv,defaultnormal_vertex:bv,displacementmap_pars_vertex:xv,displacementmap_vertex:Mv,emissivemap_fragment:Sv,emissivemap_pars_fragment:wv,colorspace_fragment:Cv,colorspace_pars_fragment:Ev,envmap_fragment:Tv,envmap_common_pars_fragment:Av,envmap_pars_fragment:Rv,envmap_pars_vertex:Iv,envmap_physical_pars_fragment:zv,envmap_vertex:Dv,fog_vertex:Pv,fog_pars_vertex:Nv,fog_fragment:Fv,fog_pars_fragment:Lv,gradientmap_pars_fragment:Ov,lightmap_pars_fragment:kv,lights_lambert_fragment:Uv,lights_lambert_pars_fragment:Bv,lights_pars_begin:Vv,lights_toon_fragment:Hv,lights_toon_pars_fragment:Gv,lights_phong_fragment:Wv,lights_phong_pars_fragment:Xv,lights_physical_fragment:qv,lights_physical_pars_fragment:Yv,lights_fragment_begin:$v,lights_fragment_maps:jv,lights_fragment_end:Zv,logdepthbuf_fragment:Kv,logdepthbuf_pars_fragment:Jv,logdepthbuf_pars_vertex:Qv,logdepthbuf_vertex:ey,map_fragment:ty,map_pars_fragment:ny,map_particle_fragment:iy,map_particle_pars_fragment:ry,metalnessmap_fragment:sy,metalnessmap_pars_fragment:oy,morphinstance_vertex:ay,morphcolor_vertex:ly,morphnormal_vertex:cy,morphtarget_pars_vertex:uy,morphtarget_vertex:dy,normal_fragment_begin:hy,normal_fragment_maps:py,normal_pars_fragment:fy,normal_pars_vertex:my,normal_vertex:gy,normalmap_pars_fragment:_y,clearcoat_normal_fragment_begin:vy,clearcoat_normal_fragment_maps:yy,clearcoat_pars_fragment:by,iridescence_pars_fragment:xy,opaque_fragment:My,packing:Sy,premultiplied_alpha_fragment:wy,project_vertex:Cy,dithering_fragment:Ey,dithering_pars_fragment:Ty,roughnessmap_fragment:Ay,roughnessmap_pars_fragment:Ry,shadowmap_pars_fragment:Iy,shadowmap_pars_vertex:Dy,shadowmap_vertex:Py,shadowmask_pars_fragment:Ny,skinbase_vertex:Fy,skinning_pars_vertex:Ly,skinning_vertex:Oy,skinnormal_vertex:ky,specularmap_fragment:Uy,specularmap_pars_fragment:By,tonemapping_fragment:Vy,tonemapping_pars_fragment:zy,transmission_fragment:Hy,transmission_pars_fragment:Gy,uv_pars_fragment:Wy,uv_pars_vertex:Xy,uv_vertex:qy,worldpos_vertex:Yy,background_vert:$y,background_frag:jy,backgroundCube_vert:Zy,backgroundCube_frag:Ky,cube_vert:Jy,cube_frag:Qy,depth_vert:e0,depth_frag:t0,distanceRGBA_vert:n0,distanceRGBA_frag:i0,equirect_vert:r0,equirect_frag:s0,linedashed_vert:o0,linedashed_frag:a0,meshbasic_vert:l0,meshbasic_frag:c0,meshlambert_vert:u0,meshlambert_frag:d0,meshmatcap_vert:h0,meshmatcap_frag:p0,meshnormal_vert:f0,meshnormal_frag:m0,meshphong_vert:g0,meshphong_frag:_0,meshphysical_vert:v0,meshphysical_frag:y0,meshtoon_vert:b0,meshtoon_frag:x0,points_vert:M0,points_frag:S0,shadow_vert:w0,shadow_frag:C0,sprite_vert:E0,sprite_frag:T0},pe={common:{diffuse:{value:new et(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new je}},envmap:{envMap:{value:null},envMapRotation:{value:new je},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new je}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new je}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new je},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new je},normalScale:{value:new lt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new je},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new je}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new je}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new je}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new et(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new et(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0},uvTransform:{value:new je}},sprite:{diffuse:{value:new et(16777215)},opacity:{value:1},center:{value:new lt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new je},alphaMap:{value:null},alphaMapTransform:{value:new je},alphaTest:{value:0}}},Ri={basic:{uniforms:Tn([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.fog]),vertexShader:Qe.meshbasic_vert,fragmentShader:Qe.meshbasic_frag},lambert:{uniforms:Tn([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new et(0)}}]),vertexShader:Qe.meshlambert_vert,fragmentShader:Qe.meshlambert_frag},phong:{uniforms:Tn([pe.common,pe.specularmap,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,pe.lights,{emissive:{value:new et(0)},specular:{value:new et(1118481)},shininess:{value:30}}]),vertexShader:Qe.meshphong_vert,fragmentShader:Qe.meshphong_frag},standard:{uniforms:Tn([pe.common,pe.envmap,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.roughnessmap,pe.metalnessmap,pe.fog,pe.lights,{emissive:{value:new et(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag},toon:{uniforms:Tn([pe.common,pe.aomap,pe.lightmap,pe.emissivemap,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.gradientmap,pe.fog,pe.lights,{emissive:{value:new et(0)}}]),vertexShader:Qe.meshtoon_vert,fragmentShader:Qe.meshtoon_frag},matcap:{uniforms:Tn([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,pe.fog,{matcap:{value:null}}]),vertexShader:Qe.meshmatcap_vert,fragmentShader:Qe.meshmatcap_frag},points:{uniforms:Tn([pe.points,pe.fog]),vertexShader:Qe.points_vert,fragmentShader:Qe.points_frag},dashed:{uniforms:Tn([pe.common,pe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qe.linedashed_vert,fragmentShader:Qe.linedashed_frag},depth:{uniforms:Tn([pe.common,pe.displacementmap]),vertexShader:Qe.depth_vert,fragmentShader:Qe.depth_frag},normal:{uniforms:Tn([pe.common,pe.bumpmap,pe.normalmap,pe.displacementmap,{opacity:{value:1}}]),vertexShader:Qe.meshnormal_vert,fragmentShader:Qe.meshnormal_frag},sprite:{uniforms:Tn([pe.sprite,pe.fog]),vertexShader:Qe.sprite_vert,fragmentShader:Qe.sprite_frag},background:{uniforms:{uvTransform:{value:new je},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qe.background_vert,fragmentShader:Qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new je}},vertexShader:Qe.backgroundCube_vert,fragmentShader:Qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qe.cube_vert,fragmentShader:Qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qe.equirect_vert,fragmentShader:Qe.equirect_frag},distanceRGBA:{uniforms:Tn([pe.common,pe.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qe.distanceRGBA_vert,fragmentShader:Qe.distanceRGBA_frag},shadow:{uniforms:Tn([pe.lights,pe.fog,{color:{value:new et(0)},opacity:{value:1}}]),vertexShader:Qe.shadow_vert,fragmentShader:Qe.shadow_frag}};Ri.physical={uniforms:Tn([Ri.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new je},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new je},clearcoatNormalScale:{value:new lt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new je},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new je},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new je},sheen:{value:0},sheenColor:{value:new et(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new je},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new je},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new je},transmissionSamplerSize:{value:new lt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new je},attenuationDistance:{value:0},attenuationColor:{value:new et(0)},specularColor:{value:new et(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new je},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new je},anisotropyVector:{value:new lt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new je}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag};var yc={r:0,b:0,g:0},Zr=new cr,A0=new Wt;function R0(i,e,t,n,r,s,o){let a=new et(0),l=s===true?0:1,c,u,d=null,p=0,f=null;function _(w){let M=w.isScene===true?w.background:null;return M&&M.isTexture&&(M=(w.backgroundBlurriness>0?t:e).get(M)),M}function y(w){let M=false,A=_(w);A===null?h(a,l):A&&A.isColor&&(h(A,1),M=true);let T=i.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,o):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||M)&&(n.buffers.depth.setTest(true),n.buffers.depth.setMask(true),n.buffers.color.setMask(true),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil));}function m(w,M){let A=_(M);A&&(A.isCubeTexture||A.mapping===qo)?(u===void 0&&(u=new gt(new ii(1,1,1),new mi({name:"BackgroundCubeMaterial",uniforms:jr(Ri.backgroundCube.uniforms),vertexShader:Ri.backgroundCube.vertexShader,fragmentShader:Ri.backgroundCube.fragmentShader,side:Dn,depthTest:false,depthWrite:false,fog:false,allowOverride:false})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(T,D,L){this.matrixWorld.copyPosition(L.matrixWorld);},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),Zr.copy(M.backgroundRotation),Zr.x*=-1,Zr.y*=-1,Zr.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===false&&(Zr.y*=-1,Zr.z*=-1),u.material.uniforms.envMap.value=A,u.material.uniforms.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===false?-1:1,u.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(A0.makeRotationFromEuler(Zr)),u.material.toneMapped=dt.getTransfer(A.colorSpace)!==vt,(d!==A||p!==A.version||f!==i.toneMapping)&&(u.material.needsUpdate=true,d=A,p=A.version,f=i.toneMapping),u.layers.enableAll(),w.unshift(u,u.geometry,u.material,0,0,null)):A&&A.isTexture&&(c===void 0&&(c=new gt(new Xn(2,2),new mi({name:"BackgroundMaterial",uniforms:jr(Ri.background.uniforms),vertexShader:Ri.background.vertexShader,fragmentShader:Ri.background.fragmentShader,side:zi,depthTest:false,depthWrite:false,fog:false,allowOverride:false})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=A,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=dt.getTransfer(A.colorSpace)!==vt,A.matrixAutoUpdate===true&&A.updateMatrix(),c.material.uniforms.uvTransform.value.copy(A.matrix),(d!==A||p!==A.version||f!==i.toneMapping)&&(c.material.needsUpdate=true,d=A,p=A.version,f=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null));}function h(w,M){w.getRGB(yc,qd(i)),n.buffers.color.setClear(yc.r,yc.g,yc.b,M,o);}function E(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0);}return {getClearColor:function(){return a},setClearColor:function(w,M=1){a.set(w),l=M,h(a,l);},getClearAlpha:function(){return l},setClearAlpha:function(w){l=w,h(a,l);},render:y,addToRenderList:m,dispose:E}}function I0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=p(null),s=r,o=false;function a(b,I,U,X,$){let J=false,j=d(X,U,I);s!==j&&(s=j,c(s.object)),J=f(b,X,U,$),J&&_(b,X,U,$),$!==null&&e.update($,i.ELEMENT_ARRAY_BUFFER),(J||o)&&(o=false,M(b,I,U,X),$!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get($).buffer));}function l(){return i.createVertexArray()}function c(b){return i.bindVertexArray(b)}function u(b){return i.deleteVertexArray(b)}function d(b,I,U){let X=U.wireframe===true,$=n[b.id];$===void 0&&($={},n[b.id]=$);let J=$[I.id];J===void 0&&(J={},$[I.id]=J);let j=J[X];return j===void 0&&(j=p(l()),J[X]=j),j}function p(b){let I=[],U=[],X=[];for(let $=0;$<t;$++)I[$]=0,U[$]=0,X[$]=0;return {geometry:null,program:null,wireframe:false,newAttributes:I,enabledAttributes:U,attributeDivisors:X,object:b,attributes:{},index:null}}function f(b,I,U,X){let $=s.attributes,J=I.attributes,j=0,le=U.getAttributes();for(let q in le)if(le[q].location>=0){let ye=$[q],Fe=J[q];if(Fe===void 0&&(q==="instanceMatrix"&&b.instanceMatrix&&(Fe=b.instanceMatrix),q==="instanceColor"&&b.instanceColor&&(Fe=b.instanceColor)),ye===void 0||ye.attribute!==Fe||Fe&&ye.data!==Fe.data)return  true;j++;}return s.attributesNum!==j||s.index!==X}function _(b,I,U,X){let $={},J=I.attributes,j=0,le=U.getAttributes();for(let q in le)if(le[q].location>=0){let ye=J[q];ye===void 0&&(q==="instanceMatrix"&&b.instanceMatrix&&(ye=b.instanceMatrix),q==="instanceColor"&&b.instanceColor&&(ye=b.instanceColor));let Fe={};Fe.attribute=ye,ye&&ye.data&&(Fe.data=ye.data),$[q]=Fe,j++;}s.attributes=$,s.attributesNum=j,s.index=X;}function y(){let b=s.newAttributes;for(let I=0,U=b.length;I<U;I++)b[I]=0;}function m(b){h(b,0);}function h(b,I){let U=s.newAttributes,X=s.enabledAttributes,$=s.attributeDivisors;U[b]=1,X[b]===0&&(i.enableVertexAttribArray(b),X[b]=1),$[b]!==I&&(i.vertexAttribDivisor(b,I),$[b]=I);}function E(){let b=s.newAttributes,I=s.enabledAttributes;for(let U=0,X=I.length;U<X;U++)I[U]!==b[U]&&(i.disableVertexAttribArray(U),I[U]=0);}function w(b,I,U,X,$,J,j){j===true?i.vertexAttribIPointer(b,I,U,$,J):i.vertexAttribPointer(b,I,U,X,$,J);}function M(b,I,U,X){y();let $=X.attributes,J=U.getAttributes(),j=I.defaultAttributeValues;for(let le in J){let q=J[le];if(q.location>=0){let fe=$[le];if(fe===void 0&&(le==="instanceMatrix"&&b.instanceMatrix&&(fe=b.instanceMatrix),le==="instanceColor"&&b.instanceColor&&(fe=b.instanceColor)),fe!==void 0){let ye=fe.normalized,Fe=fe.itemSize,it=e.get(fe);if(it===void 0)continue;let xt=it.buffer,Tt=it.type,ft=it.bytesPerElement,Q=Tt===i.INT||Tt===i.UNSIGNED_INT||fe.gpuType===Bl;if(fe.isInterleavedBufferAttribute){let ie=fe.data,Me=ie.stride,Ge=fe.offset;if(ie.isInstancedInterleavedBuffer){for(let Ne=0;Ne<q.locationSize;Ne++)h(q.location+Ne,ie.meshPerAttribute);b.isInstancedMesh!==true&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ie.meshPerAttribute*ie.count);}else for(let Ne=0;Ne<q.locationSize;Ne++)m(q.location+Ne);i.bindBuffer(i.ARRAY_BUFFER,xt);for(let Ne=0;Ne<q.locationSize;Ne++)w(q.location+Ne,Fe/q.locationSize,Tt,ye,Me*ft,(Ge+Fe/q.locationSize*Ne)*ft,Q);}else {if(fe.isInstancedBufferAttribute){for(let ie=0;ie<q.locationSize;ie++)h(q.location+ie,fe.meshPerAttribute);b.isInstancedMesh!==true&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=fe.meshPerAttribute*fe.count);}else for(let ie=0;ie<q.locationSize;ie++)m(q.location+ie);i.bindBuffer(i.ARRAY_BUFFER,xt);for(let ie=0;ie<q.locationSize;ie++)w(q.location+ie,Fe/q.locationSize,Tt,ye,Fe*ft,Fe/q.locationSize*ie*ft,Q);}}else if(j!==void 0){let ye=j[le];if(ye!==void 0)switch(ye.length){case 2:i.vertexAttrib2fv(q.location,ye);break;case 3:i.vertexAttrib3fv(q.location,ye);break;case 4:i.vertexAttrib4fv(q.location,ye);break;default:i.vertexAttrib1fv(q.location,ye);}}}}E();}function A(){L();for(let b in n){let I=n[b];for(let U in I){let X=I[U];for(let $ in X)u(X[$].object),delete X[$];delete I[U];}delete n[b];}}function T(b){if(n[b.id]===void 0)return;let I=n[b.id];for(let U in I){let X=I[U];for(let $ in X)u(X[$].object),delete X[$];delete I[U];}delete n[b.id];}function D(b){for(let I in n){let U=n[I];if(U[b.id]===void 0)continue;let X=U[b.id];for(let $ in X)u(X[$].object),delete X[$];delete U[b.id];}}function L(){x(),o=true,s!==r&&(s=r,c(s.object));}function x(){r.geometry=null,r.program=null,r.wireframe=false;}return {setup:a,reset:L,resetDefaultState:x,dispose:A,releaseStatesOfGeometry:T,releaseStatesOfProgram:D,initAttributes:y,enableAttribute:m,disableUnusedAttributes:E}}function D0(i,e,t){let n;function r(c){n=c;}function s(c,u){i.drawArrays(n,c,u),t.update(u,n,1);}function o(c,u,d){d!==0&&(i.drawArraysInstanced(n,c,u,d),t.update(u,n,d));}function a(c,u,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,d);let f=0;for(let _=0;_<d;_++)f+=u[_];t.update(f,n,1);}function l(c,u,d,p){if(d===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let _=0;_<c.length;_++)o(c[_],u[_],p[_]);else {f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,p,0,d);let _=0;for(let y=0;y<d;y++)_+=u[y]*p[y];t.update(_,n,1);}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l;}function P0(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===true){let D=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(D.MAX_TEXTURE_MAX_ANISOTROPY_EXT);}else r=0;return r}function o(D){return !(D!==si&&n.convert(D)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(D){let L=D===Ws&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return !(D!==gi&&n.convert(D)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&D!==Ai&&!L)}function l(D){if(D==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return "highp";D="mediump";}return D==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=t.logarithmicDepthBuffer===true,p=t.reversedDepthBuffer===true&&e.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),h=i.getParameter(i.MAX_VERTEX_ATTRIBS),E=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),A=_>0,T=i.getParameter(i.MAX_SAMPLES);return {isWebGL2:true,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:p,maxTextures:f,maxVertexTextures:_,maxTextureSize:y,maxCubemapSize:m,maxAttributes:h,maxVertexUniforms:E,maxVaryings:w,maxFragmentUniforms:M,vertexTextures:A,maxSamples:T}}function N0(i){let e=this,t=null,n=0,r=false,s=false,o=new wi,a=new je,l={value:null,needsUpdate:false};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,p){let f=d.length!==0||p||n!==0||r;return r=p,n=d.length,f},this.beginShadows=function(){s=true,u(null);},this.endShadows=function(){s=false;},this.setGlobalState=function(d,p){t=u(d,p,0);},this.setState=function(d,p,f){let _=d.clippingPlanes,y=d.clipIntersection,m=d.clipShadows,h=i.get(d);if(!r||_===null||_.length===0||s&&!m)s?u(null):c();else {let E=s?0:n,w=E*4,M=h.clippingState||null;l.value=M,M=u(_,p,w,f);for(let A=0;A!==w;++A)M[A]=t[A];h.clippingState=M,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=E;}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0;}function u(d,p,f,_){let y=d!==null?d.length:0,m=null;if(y!==0){if(m=l.value,_!==true||m===null){let h=f+y*4,E=p.matrixWorldInverse;a.getNormalMatrix(E),(m===null||m.length<h)&&(m=new Float32Array(h));for(let w=0,M=f;w!==y;++w,M+=4)o.copy(d[w]).applyMatrix4(E,a),o.normal.toArray(m,M),m[M+3]=o.constant;}l.value=m,l.needsUpdate=true;}return e.numPlanes=y,e.numIntersection=0,m}}function F0(i){let e=new WeakMap;function t(o,a){return a===Ol?o.mapping=Yr:a===kl&&(o.mapping=$r),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ol||a===kl)if(e.has(o)){let l=e.get(o).texture;return t(l,o.mapping)}else {let l=o.image;if(l&&l.height>0){let c=new vl(l.height);return c.fromEquirectangularTexture(i,o),e.set(o,c),o.addEventListener("dispose",r),t(c.texture,o.mapping)}else return null}}return o}function r(o){let a=o.target;a.removeEventListener("dispose",r);let l=e.get(a);l!==void 0&&(e.delete(a),l.dispose());}function s(){e=new WeakMap;}return {get:n,dispose:s}}var $s=4,rm=[.125,.215,.35,.446,.526,.582],Qr=20,Zd=new Wo,sm=new et,Kd=null,Jd=0,Qd=0,eh=false,Jr=(1+Math.sqrt(5))/2,Ys=1/Jr,om=[new O(-Jr,Ys,0),new O(Jr,Ys,0),new O(-Ys,0,Jr),new O(Ys,0,Jr),new O(0,Jr,-Ys),new O(0,Jr,Ys),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)],L0=new O,Mc=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial);}fromScene(e,t=0,n=.1,r=100,s={}){let{size:o=256,position:a=L0}=s;Kd=this._renderer.getRenderTarget(),Jd=this._renderer.getActiveCubeFace(),Qd=this._renderer.getActiveMipmapLevel(),eh=this._renderer.xr.enabled,this._renderer.xr.enabled=false,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=true,this._sceneToCubeUV(e,n,r,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=cm(),this._compileMaterial(this._cubemapMaterial));}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=lm(),this._compileMaterial(this._equirectMaterial));}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose();}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax);}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose();}_cleanup(e){this._renderer.setRenderTarget(Kd,Jd,Qd),this._renderer.xr.enabled=eh,e.scissorTest=false,bc(e,0,0,e.width,e.height);}_fromTexture(e,t){e.mapping===Yr||e.mapping===$r?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Kd=this._renderer.getRenderTarget(),Jd=this._renderer.getActiveCubeFace(),Qd=this._renderer.getActiveMipmapLevel(),eh=this._renderer.xr.enabled,this._renderer.xr.enabled=false;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Wn,minFilter:Wn,generateMipmaps:false,type:Ws,format:si,colorSpace:zr,depthBuffer:false},r=am(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=am(e,t,n);let{_lodMax:s}=this;(({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=O0(s))),this._blurMaterial=k0(s,e,t);}return r}_compileMaterial(e){let t=new gt(this._lodPlanes[0],e);this._renderer.compile(t,Zd);}_sceneToCubeUV(e,t,n,r,s){let l=new dn(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,p=d.autoClear,f=d.toneMapping;d.getClearColor(sm),d.toneMapping=Xi,d.autoClear=false,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null));let y=new Fo({name:"PMREM.Background",side:Dn,depthWrite:false,depthTest:false}),m=new gt(new ii,y),h=false,E=e.background;E?E.isColor&&(y.color.copy(E),e.background=null,h=true):(y.color.copy(sm),h=true);for(let w=0;w<6;w++){let M=w%3;M===0?(l.up.set(0,c[w],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+u[w],s.y,s.z)):M===1?(l.up.set(0,0,c[w]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+u[w],s.z)):(l.up.set(0,c[w],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+u[w]));let A=this._cubeSize;bc(r,M*A,w>2?A:0,A,A),d.setRenderTarget(r),h&&d.render(m,l),d.render(e,l);}m.geometry.dispose(),m.material.dispose(),d.toneMapping=f,d.autoClear=p,e.background=E;}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===Yr||e.mapping===$r;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=cm()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===false?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=lm());let s=r?this._cubemapMaterial:this._equirectMaterial,o=new gt(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=e;let l=this._cubeSize;bc(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,Zd);}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=false;let r=this._lodPlanes.length;for(let s=1;s<r;s++){let o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=om[(r-s-1)%om.length];this._blur(e,s-1,s,o,a);}t.autoClear=n;}_blur(e,t,n,r,s){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,r,"latitudinal",s),this._halfBlur(o,e,n,n,r,"longitudinal",s);}_halfBlur(e,t,n,r,s,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,d=new gt(this._lodPlanes[r],c),p=c.uniforms,f=this._sizeLods[n]-1,_=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*Qr-1),y=s/_,m=isFinite(s)?1+Math.floor(u*y):Qr;m>Qr&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Qr}`);let h=[],E=0;for(let D=0;D<Qr;++D){let L=D/y,x=Math.exp(-L*L/2);h.push(x),D===0?E+=x:D<m&&(E+=2*x);}for(let D=0;D<h.length;D++)h[D]=h[D]/E;p.envMap.value=e.texture,p.samples.value=m,p.weights.value=h,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);let{_lodMax:w}=this;p.dTheta.value=_,p.mipInt.value=w-n;let M=this._sizeLods[r],A=3*M*(r>w-$s?r-w+$s:0),T=4*(this._cubeSize-M);bc(t,A,T,3*M,2*M),l.setRenderTarget(t),l.render(d,Zd);}};function O0(i){let e=[],t=[],n=[],r=i,s=i-$s+1+rm.length;for(let o=0;o<s;o++){let a=Math.pow(2,r);t.push(a);let l=1/a;o>i-$s?l=rm[o-i+$s-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),u=-c,d=1+c,p=[u,u,d,u,d,d,u,u,d,d,u,d],f=6,_=6,y=3,m=2,h=1,E=new Float32Array(y*_*f),w=new Float32Array(m*_*f),M=new Float32Array(h*_*f);for(let T=0;T<f;T++){let D=T%3*2/3-1,L=T>2?0:-1,x=[D,L,0,D+2/3,L,0,D+2/3,L+1,0,D,L,0,D+2/3,L+1,0,D,L+1,0];E.set(x,y*_*T),w.set(p,m*_*T);let b=[T,T,T,T,T,T];M.set(b,h*_*T);}let A=new Ei;A.setAttribute("position",new Gn(E,y)),A.setAttribute("uv",new Gn(w,m)),A.setAttribute("faceIndex",new Gn(M,h)),e.push(A),r>$s&&r--;}return {lodPlanes:e,sizeLods:t,sigmas:n}}function am(i,e,t){let n=new Ci(i,e,t);return n.texture.mapping=qo,n.texture.name="PMREM.cubeUv",n.scissorTest=true,n}function bc(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r);}function k0(i,e,t){let n=new Float32Array(Qr),r=new O(0,1,0);return new mi({name:"SphericalGaussianBlur",defines:{n:Qr,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:false},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:uh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Wi,depthTest:false,depthWrite:false})}function lm(){return new mi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:uh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Wi,depthTest:false,depthWrite:false})}function cm(){return new mi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:uh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Wi,depthTest:false,depthWrite:false})}function uh(){return `

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function U0(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===Ol||l===kl,u=l===Yr||l===$r;if(c||u){let d=e.get(a),p=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==p)return t===null&&(t=new Mc(i)),d=c?t.fromEquirectangular(a,d):t.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),d.texture;if(d!==void 0)return d.texture;{let f=a.image;return c&&f&&f.height>0||u&&f&&r(f)?(t===null&&(t=new Mc(i)),d=c?t.fromEquirectangular(a):t.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,e.set(a,d),a.addEventListener("dispose",s),d.texture):null}}}return a}function r(a){let l=0,c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function s(a){let l=a.target;l.removeEventListener("dispose",s);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose());}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null);}return {get:n,dispose:o}}function B0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case "WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case "EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case "WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case "WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n);}return e[n]=r,r}return {has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent");},get:function(n){let r=t(n);return r===null&&Fs("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function V0(i,e,t,n){let r={},s=new WeakMap;function o(d){let p=d.target;p.index!==null&&e.remove(p.index);for(let _ in p.attributes)e.remove(p.attributes[_]);p.removeEventListener("dispose",o),delete r[p.id];let f=s.get(p);f&&(e.remove(f),s.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===true&&delete p._maxInstanceCount,t.memory.geometries--;}function a(d,p){return r[p.id]===true||(p.addEventListener("dispose",o),r[p.id]=true,t.memory.geometries++),p}function l(d){let p=d.attributes;for(let f in p)e.update(p[f],i.ARRAY_BUFFER);}function c(d){let p=[],f=d.index,_=d.attributes.position,y=0;if(f!==null){let E=f.array;y=f.version;for(let w=0,M=E.length;w<M;w+=3){let A=E[w+0],T=E[w+1],D=E[w+2];p.push(A,T,T,D,D,A);}}else if(_!==void 0){let E=_.array;y=_.version;for(let w=0,M=E.length/3-1;w<M;w+=3){let A=w+0,T=w+1,D=w+2;p.push(A,T,T,D,D,A);}}else return;let m=new(Xd(p)?Oo:Lo)(p,1);m.version=y;let h=s.get(d);h&&e.remove(h),s.set(d,m);}function u(d){let p=s.get(d);if(p){let f=d.index;f!==null&&p.version<f.version&&c(d);}else c(d);return s.get(d)}return {get:a,update:l,getWireframeAttribute:u}}function z0(i,e,t){let n;function r(p){n=p;}let s,o;function a(p){s=p.type,o=p.bytesPerElement;}function l(p,f){i.drawElements(n,f,s,p*o),t.update(f,n,1);}function c(p,f,_){_!==0&&(i.drawElementsInstanced(n,f,s,p*o,_),t.update(f,n,_));}function u(p,f,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,p,0,_);let m=0;for(let h=0;h<_;h++)m+=f[h];t.update(m,n,1);}function d(p,f,_,y){if(_===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let h=0;h<p.length;h++)c(p[h]/o,f[h],y[h]);else {m.multiDrawElementsInstancedWEBGL(n,f,0,s,p,0,y,0,_);let h=0;for(let E=0;E<_;E++)h+=f[E]*y[E];t.update(h,n,1);}}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=d;}function H0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(s/3);break;case i.LINES:t.lines+=a*(s/2);break;case i.LINE_STRIP:t.lines+=a*(s-1);break;case i.LINE_LOOP:t.lines+=a*s;break;case i.POINTS:t.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0;}return {memory:e,render:t,programs:null,autoReset:true,reset:r,update:n}}function G0(i,e,t){let n=new WeakMap,r=new Ut;function s(o,a,l){let c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=u!==void 0?u.length:0,p=n.get(a);if(p===void 0||p.count!==d){let x=function(){D.dispose(),n.delete(a),a.removeEventListener("dispose",x);};p!==void 0&&p.texture.dispose();let f=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],h=a.morphAttributes.normal||[],E=a.morphAttributes.color||[],w=0;f===true&&(w=1),_===true&&(w=2),y===true&&(w=3);let M=a.attributes.position.count*w,A=1;M>e.maxTextureSize&&(A=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let T=new Float32Array(M*A*4*d),D=new Po(T,M,A,d);D.type=Ai,D.needsUpdate=true;let L=w*4;for(let b=0;b<d;b++){let I=m[b],U=h[b],X=E[b],$=M*A*4*b;for(let J=0;J<I.count;J++){let j=J*L;f===true&&(r.fromBufferAttribute(I,J),T[$+j+0]=r.x,T[$+j+1]=r.y,T[$+j+2]=r.z,T[$+j+3]=0),_===true&&(r.fromBufferAttribute(U,J),T[$+j+4]=r.x,T[$+j+5]=r.y,T[$+j+6]=r.z,T[$+j+7]=0),y===true&&(r.fromBufferAttribute(X,J),T[$+j+8]=r.x,T[$+j+9]=r.y,T[$+j+10]=r.z,T[$+j+11]=X.itemSize===4?r.w:1);}}p={count:d,texture:D,size:new lt(M,A)},n.set(a,p),a.addEventListener("dispose",x);}if(o.isInstancedMesh===true&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else {let f=0;for(let y=0;y<c.length;y++)f+=c[y];let _=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",c);}l.getUniforms().setValue(i,"morphTargetsTexture",p.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",p.size);}return {update:s}}function W0(i,e,t,n){let r=new WeakMap;function s(l){let c=n.render.frame,u=l.geometry,d=e.get(l,u);if(r.get(d)!==c&&(e.update(d),r.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===false&&l.addEventListener("dispose",a),r.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){let p=l.skeleton;r.get(p)!==c&&(p.update(),r.set(p,c));}return d}function o(){r=new WeakMap;}function a(l){let c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor);}return {update:s,dispose:o}}var Am=new Yi,um=new Vo(1,1),Rm=new Po,Im=new gl,Dm=new Uo,dm=[],hm=[],pm=new Float32Array(16),fm=new Float32Array(9),mm=new Float32Array(4);function Ks(i,e,t){let n=i[0];if(n<=0||n>0)return i;let r=e*t,s=dm[r];if(s===void 0&&(s=new Float32Array(r),dm[r]=s),e!==0){n.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(s,a);}return s}function sn(i,e){if(i.length!==e.length)return  false;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return  false;return  true}function on(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t];}function Sc(i,e){let t=hm[e];t===void 0&&(t=new Int32Array(e),hm[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function X0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e);}function q0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else {if(sn(t,e))return;i.uniform2fv(this.addr,e),on(t,e);}}function Y0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else {if(sn(t,e))return;i.uniform3fv(this.addr,e),on(t,e);}}function $0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else {if(sn(t,e))return;i.uniform4fv(this.addr,e),on(t,e);}}function j0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(sn(t,e))return;i.uniformMatrix2fv(this.addr,false,e),on(t,e);}else {if(sn(t,n))return;mm.set(n),i.uniformMatrix2fv(this.addr,false,mm),on(t,n);}}function Z0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(sn(t,e))return;i.uniformMatrix3fv(this.addr,false,e),on(t,e);}else {if(sn(t,n))return;fm.set(n),i.uniformMatrix3fv(this.addr,false,fm),on(t,n);}}function K0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(sn(t,e))return;i.uniformMatrix4fv(this.addr,false,e),on(t,e);}else {if(sn(t,n))return;pm.set(n),i.uniformMatrix4fv(this.addr,false,pm),on(t,n);}}function J0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e);}function Q0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else {if(sn(t,e))return;i.uniform2iv(this.addr,e),on(t,e);}}function eb(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else {if(sn(t,e))return;i.uniform3iv(this.addr,e),on(t,e);}}function tb(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else {if(sn(t,e))return;i.uniform4iv(this.addr,e),on(t,e);}}function nb(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e);}function ib(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else {if(sn(t,e))return;i.uniform2uiv(this.addr,e),on(t,e);}}function rb(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else {if(sn(t,e))return;i.uniform3uiv(this.addr,e),on(t,e);}}function sb(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else {if(sn(t,e))return;i.uniform4uiv(this.addr,e),on(t,e);}}function ob(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(um.compareFunction=Gd,s=um):s=Am,t.setTexture2D(e||s,r);}function ab(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Im,r);}function lb(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Dm,r);}function cb(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||Rm,r);}function ub(i){switch(i){case 5126:return X0;case 35664:return q0;case 35665:return Y0;case 35666:return $0;case 35674:return j0;case 35675:return Z0;case 35676:return K0;case 5124:case 35670:return J0;case 35667:case 35671:return Q0;case 35668:case 35672:return eb;case 35669:case 35673:return tb;case 5125:return nb;case 36294:return ib;case 36295:return rb;case 36296:return sb;case 35678:case 36198:case 36298:case 36306:case 35682:return ob;case 35679:case 36299:case 36307:return ab;case 35680:case 36300:case 36308:case 36293:return lb;case 36289:case 36303:case 36311:case 36292:return cb}}function db(i,e){i.uniform1fv(this.addr,e);}function hb(i,e){let t=Ks(e,this.size,2);i.uniform2fv(this.addr,t);}function pb(i,e){let t=Ks(e,this.size,3);i.uniform3fv(this.addr,t);}function fb(i,e){let t=Ks(e,this.size,4);i.uniform4fv(this.addr,t);}function mb(i,e){let t=Ks(e,this.size,4);i.uniformMatrix2fv(this.addr,false,t);}function gb(i,e){let t=Ks(e,this.size,9);i.uniformMatrix3fv(this.addr,false,t);}function _b(i,e){let t=Ks(e,this.size,16);i.uniformMatrix4fv(this.addr,false,t);}function vb(i,e){i.uniform1iv(this.addr,e);}function yb(i,e){i.uniform2iv(this.addr,e);}function bb(i,e){i.uniform3iv(this.addr,e);}function xb(i,e){i.uniform4iv(this.addr,e);}function Mb(i,e){i.uniform1uiv(this.addr,e);}function Sb(i,e){i.uniform2uiv(this.addr,e);}function wb(i,e){i.uniform3uiv(this.addr,e);}function Cb(i,e){i.uniform4uiv(this.addr,e);}function Eb(i,e,t){let n=this.cache,r=e.length,s=Sc(t,r);sn(n,s)||(i.uniform1iv(this.addr,s),on(n,s));for(let o=0;o!==r;++o)t.setTexture2D(e[o]||Am,s[o]);}function Tb(i,e,t){let n=this.cache,r=e.length,s=Sc(t,r);sn(n,s)||(i.uniform1iv(this.addr,s),on(n,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||Im,s[o]);}function Ab(i,e,t){let n=this.cache,r=e.length,s=Sc(t,r);sn(n,s)||(i.uniform1iv(this.addr,s),on(n,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||Dm,s[o]);}function Rb(i,e,t){let n=this.cache,r=e.length,s=Sc(t,r);sn(n,s)||(i.uniform1iv(this.addr,s),on(n,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||Rm,s[o]);}function Ib(i){switch(i){case 5126:return db;case 35664:return hb;case 35665:return pb;case 35666:return fb;case 35674:return mb;case 35675:return gb;case 35676:return _b;case 5124:case 35670:return vb;case 35667:case 35671:return yb;case 35668:case 35672:return bb;case 35669:case 35673:return xb;case 5125:return Mb;case 36294:return Sb;case 36295:return wb;case 36296:return Cb;case 35678:case 36198:case 36298:case 36306:case 35682:return Eb;case 35679:case 36299:case 36307:return Tb;case 35680:case 36300:case 36308:case 36293:return Ab;case 36289:case 36303:case 36311:case 36292:return Rb}}var nh=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=ub(t.type);}},ih=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ib(t.type);}},rh=class{constructor(e){this.id=e,this.seq=[],this.map={};}setValue(e,t,n){let r=this.seq;for(let s=0,o=r.length;s!==o;++s){let a=r[s];a.setValue(e,t[a.id],n);}}},th=/(\w+)(\])?(\[|\.)?/g;function gm(i,e){i.seq.push(e),i.map[e.id]=e;}function Db(i,e,t){let n=i.name,r=n.length;for(th.lastIndex=0;;){let s=th.exec(n),o=th.lastIndex,a=s[1],l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){gm(t,c===void 0?new nh(a,i,e):new ih(a,i,e));break}else {let d=t.map[a];d===void 0&&(d=new rh(a),gm(t,d)),t=d;}}}var js=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let s=e.getActiveUniform(t,r),o=e.getUniformLocation(t,s.name);Db(s,o,this);}}setValue(e,t,n,r){let s=this.map[t];s!==void 0&&s.setValue(e,n,r);}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r);}static upload(e,t,n,r){for(let s=0,o=t.length;s!==o;++s){let a=t[s],l=n[a.id];l.needsUpdate!==false&&a.setValue(e,l.value,r);}}static seqWithValue(e,t){let n=[];for(let r=0,s=e.length;r!==s;++r){let o=e[r];o.id in t&&n.push(o);}return n}};function _m(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Pb=37297,Nb=0;function Fb(i,e){let t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`);}return n.join(`
`)}var vm=new je;function Lb(i){dt._getMatrix(vm,dt.workingColorSpace,i);let e=`mat3( ${vm.elements.map(t=>t.toFixed(4))} )`;switch(dt.getTransfer(i)){case Ro:return [e,"LinearTransferOETF"];case vt:return [e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function ym(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=(i.getShaderInfoLog(e)||"").trim();if(n&&s==="")return "";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+Fb(i.getShaderSource(e),a)}else return s}function Ob(i,e){let t=Lb(e);return [`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function kb(i,e){let t;switch(e){case kf:t="Linear";break;case Uf:t="Reinhard";break;case Bf:t="Cineon";break;case Hs:t="ACESFilmic";break;case zf:t="AgX";break;case Hf:t="Neutral";break;case Vf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear";}return "vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var xc=new O;function Ub(){dt.getLuminanceCoefficients(xc);let i=xc.x.toFixed(4),e=xc.y.toFixed(4),t=xc.z.toFixed(4);return ["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Bb(i){return [i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Qo).join(`
`)}function Vb(i){let e=[];for(let t in i){let n=i[t];n!==false&&e.push("#define "+t+" "+n);}return e.join(`
`)}function zb(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){let s=i.getActiveAttrib(e,r),o=s.name,a=1;s.type===i.FLOAT_MAT2&&(a=2),s.type===i.FLOAT_MAT3&&(a=3),s.type===i.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:i.getAttribLocation(e,o),locationSize:a};}return t}function Qo(i){return i!==""}function bm(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function xm(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Hb=/^[ \t]*#include +<([\w\d./]+)>/gm;function sh(i){return i.replace(Hb,Wb)}var Gb=new Map;function Wb(i,e){let t=Qe[e];if(t===void 0){let n=Gb.get(e);if(n!==void 0)t=Qe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return sh(t)}var Xb=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Mm(i){return i.replace(Xb,qb)}function qb(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Sm(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Yb(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Rd?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===zs?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Ti&&(e="SHADOWMAP_TYPE_VSM"),e}function $b(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Yr:case $r:e="ENVMAP_TYPE_CUBE";break;case qo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function jb(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===$r&&(e="ENVMAP_MODE_REFRACTION"),e}function Zb(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Nd:e="ENVMAP_BLENDING_MULTIPLY";break;case Lf:e="ENVMAP_BLENDING_MIX";break;case Of:e="ENVMAP_BLENDING_ADD";break}return e}function Kb(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return {texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function Jb(i,e,t,n){let r=i.getContext(),s=t.defines,o=t.vertexShader,a=t.fragmentShader,l=Yb(t),c=$b(t),u=jb(t),d=Zb(t),p=Kb(t),f=Bb(t),_=Vb(s),y=r.createProgram(),m,h,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Qo).join(`
`),m.length>0&&(m+=`
`),h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Qo).join(`
`),h.length>0&&(h+=`
`)):(m=[Sm(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===false?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===false?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Qo).join(`
`),h=[Sm(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===false?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Xi?"#define TONE_MAPPING":"",t.toneMapping!==Xi?Qe.tonemapping_pars_fragment:"",t.toneMapping!==Xi?kb("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Qe.colorspace_pars_fragment,Ob("linearToOutputTexel",t.outputColorSpace),Ub(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Qo).join(`
`)),o=sh(o),o=bm(o,t),o=xm(o,t),a=sh(a),a=bm(a,t),a=xm(a,t),o=Mm(o),a=Mm(a),t.isRawShaderMaterial!==true&&(E=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,h=["#define varying in",t.glslVersion===Wd?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Wd?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);let w=E+m+o,M=E+h+a,A=_m(r,r.VERTEX_SHADER,w),T=_m(r,r.FRAGMENT_SHADER,M);r.attachShader(y,A),r.attachShader(y,T),t.index0AttributeName!==void 0?r.bindAttribLocation(y,0,t.index0AttributeName):t.morphTargets===true&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function D(I){if(i.debug.checkShaderErrors){let U=r.getProgramInfoLog(y)||"",X=r.getShaderInfoLog(A)||"",$=r.getShaderInfoLog(T)||"",J=U.trim(),j=X.trim(),le=$.trim(),q=true,fe=true;if(r.getProgramParameter(y,r.LINK_STATUS)===false)if(q=false,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,y,A,T);else {let ye=ym(r,A,"vertex"),Fe=ym(r,T,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+J+`
`+ye+`
`+Fe);}else J!==""?console.warn("THREE.WebGLProgram: Program Info Log:",J):(j===""||le==="")&&(fe=false);fe&&(I.diagnostics={runnable:q,programLog:J,vertexShader:{log:j,prefix:m},fragmentShader:{log:le,prefix:h}});}r.deleteShader(A),r.deleteShader(T),L=new js(r,y),x=zb(r,y);}let L;this.getUniforms=function(){return L===void 0&&D(this),L};let x;this.getAttributes=function(){return x===void 0&&D(this),x};let b=t.rendererExtensionParallelShaderCompile===false;return this.isReady=function(){return b===false&&(b=r.getProgramParameter(y,Pb)),b},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0;},this.type=t.shaderType,this.name=t.shaderName,this.id=Nb++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=A,this.fragmentShader=T,this}var Qb=0,oh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map;}update(e){let t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(r)===false&&(o.add(r),r.usedTimes++),o.has(s)===false&&(o.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear();}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new ah(e),t.set(e,n)),n}},ah=class{constructor(e){this.id=Qb++,this.code=e,this.usedTimes=0;}};function ex(i,e,t,n,r,s,o){let a=new ks,l=new oh,c=new Set,u=[],d=r.logarithmicDepthBuffer,p=r.vertexTextures,f=r.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(x){return c.add(x),x===0?"uv":`uv${x}`}function m(x,b,I,U,X){let $=U.fog,J=X.geometry,j=x.isMeshStandardMaterial?U.environment:null,le=(x.isMeshStandardMaterial?t:e).get(x.envMap||j),q=le&&le.mapping===qo?le.image.height:null,fe=_[x.type];x.precision!==null&&(f=r.getMaxPrecision(x.precision),f!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",f,"instead."));let ye=J.morphAttributes.position||J.morphAttributes.normal||J.morphAttributes.color,Fe=ye!==void 0?ye.length:0,it=0;J.morphAttributes.position!==void 0&&(it=1),J.morphAttributes.normal!==void 0&&(it=2),J.morphAttributes.color!==void 0&&(it=3);let xt,Tt,ft,Q;if(fe){let mt=Ri[fe];xt=mt.vertexShader,Tt=mt.fragmentShader;}else xt=x.vertexShader,Tt=x.fragmentShader,l.update(x),ft=l.getVertexShaderID(x),Q=l.getFragmentShaderID(x);let ie=i.getRenderTarget(),Me=i.state.buffers.depth.getReversed(),Ge=X.isInstancedMesh===true,Ne=X.isBatchedMesh===true,ct=!!x.map,vn=!!x.matcap,C=!!le,At=!!x.aoMap,$e=!!x.lightMap,ze=!!x.bumpMap,Te=!!x.normalMap,Rt=!!x.displacementMap,Ae=!!x.emissiveMap,Je=!!x.metalnessMap,an=!!x.roughnessMap,Xt=x.anisotropy>0,S=x.clearcoat>0,g=x.dispersion>0,k=x.iridescence>0,Z=x.sheen>0,te=x.transmission>0,Y=Xt&&!!x.anisotropyMap,Pe=S&&!!x.clearcoatMap,ue=S&&!!x.clearcoatNormalMap,Re=S&&!!x.clearcoatRoughnessMap,Ie=k&&!!x.iridescenceMap,oe=k&&!!x.iridescenceThicknessMap,ve=Z&&!!x.sheenColorMap,Ve=Z&&!!x.sheenRoughnessMap,De=!!x.specularMap,me=!!x.specularColorMap,Ze=!!x.specularIntensityMap,R=te&&!!x.transmissionMap,ae=te&&!!x.thicknessMap,de=!!x.gradientMap,xe=!!x.alphaMap,re=x.alphaTest>0,ee=!!x.alphaHash,Ee=!!x.extensions,qe=Xi;x.toneMapped&&(ie===null||ie.isXRRenderTarget===true)&&(qe=i.toneMapping);let Mt={shaderID:fe,shaderType:x.type,shaderName:x.name,vertexShader:xt,fragmentShader:Tt,defines:x.defines,customVertexShaderID:ft,customFragmentShaderID:Q,isRawShaderMaterial:x.isRawShaderMaterial===true,glslVersion:x.glslVersion,precision:f,batching:Ne,batchingColor:Ne&&X._colorsTexture!==null,instancing:Ge,instancingColor:Ge&&X.instanceColor!==null,instancingMorph:Ge&&X.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:ie===null?i.outputColorSpace:ie.isXRRenderTarget===true?ie.texture.colorSpace:zr,alphaToCoverage:!!x.alphaToCoverage,map:ct,matcap:vn,envMap:C,envMapMode:C&&le.mapping,envMapCubeUVHeight:q,aoMap:At,lightMap:$e,bumpMap:ze,normalMap:Te,displacementMap:p&&Rt,emissiveMap:Ae,normalMapObjectSpace:Te&&x.normalMapType===qf,normalMapTangentSpace:Te&&x.normalMapType===Hd,metalnessMap:Je,roughnessMap:an,anisotropy:Xt,anisotropyMap:Y,clearcoat:S,clearcoatMap:Pe,clearcoatNormalMap:ue,clearcoatRoughnessMap:Re,dispersion:g,iridescence:k,iridescenceMap:Ie,iridescenceThicknessMap:oe,sheen:Z,sheenColorMap:ve,sheenRoughnessMap:Ve,specularMap:De,specularColorMap:me,specularIntensityMap:Ze,transmission:te,transmissionMap:R,thicknessMap:ae,gradientMap:de,opaque:x.transparent===false&&x.blending===Br&&x.alphaToCoverage===false,alphaMap:xe,alphaTest:re,alphaHash:ee,combine:x.combine,mapUv:ct&&y(x.map.channel),aoMapUv:At&&y(x.aoMap.channel),lightMapUv:$e&&y(x.lightMap.channel),bumpMapUv:ze&&y(x.bumpMap.channel),normalMapUv:Te&&y(x.normalMap.channel),displacementMapUv:Rt&&y(x.displacementMap.channel),emissiveMapUv:Ae&&y(x.emissiveMap.channel),metalnessMapUv:Je&&y(x.metalnessMap.channel),roughnessMapUv:an&&y(x.roughnessMap.channel),anisotropyMapUv:Y&&y(x.anisotropyMap.channel),clearcoatMapUv:Pe&&y(x.clearcoatMap.channel),clearcoatNormalMapUv:ue&&y(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Re&&y(x.clearcoatRoughnessMap.channel),iridescenceMapUv:Ie&&y(x.iridescenceMap.channel),iridescenceThicknessMapUv:oe&&y(x.iridescenceThicknessMap.channel),sheenColorMapUv:ve&&y(x.sheenColorMap.channel),sheenRoughnessMapUv:Ve&&y(x.sheenRoughnessMap.channel),specularMapUv:De&&y(x.specularMap.channel),specularColorMapUv:me&&y(x.specularColorMap.channel),specularIntensityMapUv:Ze&&y(x.specularIntensityMap.channel),transmissionMapUv:R&&y(x.transmissionMap.channel),thicknessMapUv:ae&&y(x.thicknessMap.channel),alphaMapUv:xe&&y(x.alphaMap.channel),vertexTangents:!!J.attributes.tangent&&(Te||Xt),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===true&&!!J.attributes.color&&J.attributes.color.itemSize===4,pointsUvs:X.isPoints===true&&!!J.attributes.uv&&(ct||xe),fog:!!$,useFog:x.fog===true,fogExp2:!!$&&$.isFogExp2,flatShading:x.flatShading===true&&x.wireframe===false,sizeAttenuation:x.sizeAttenuation===true,logarithmicDepthBuffer:d,reversedDepthBuffer:Me,skinning:X.isSkinnedMesh===true,morphTargets:J.morphAttributes.position!==void 0,morphNormals:J.morphAttributes.normal!==void 0,morphColors:J.morphAttributes.color!==void 0,morphTargetsCount:Fe,morphTextureStride:it,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:qe,decodeVideoTexture:ct&&x.map.isVideoTexture===true&&dt.getTransfer(x.map.colorSpace)===vt,decodeVideoTextureEmissive:Ae&&x.emissiveMap.isVideoTexture===true&&dt.getTransfer(x.emissiveMap.colorSpace)===vt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===ri,flipSided:x.side===Dn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Ee&&x.extensions.clipCullDistance===true&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ee&&x.extensions.multiDraw===true||Ne)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Mt.vertexUv1s=c.has(1),Mt.vertexUv2s=c.has(2),Mt.vertexUv3s=c.has(3),c.clear(),Mt}function h(x){let b=[];if(x.shaderID?b.push(x.shaderID):(b.push(x.customVertexShaderID),b.push(x.customFragmentShaderID)),x.defines!==void 0)for(let I in x.defines)b.push(I),b.push(x.defines[I]);return x.isRawShaderMaterial===false&&(E(b,x),w(b,x),b.push(i.outputColorSpace)),b.push(x.customProgramCacheKey),b.join()}function E(x,b){x.push(b.precision),x.push(b.outputColorSpace),x.push(b.envMapMode),x.push(b.envMapCubeUVHeight),x.push(b.mapUv),x.push(b.alphaMapUv),x.push(b.lightMapUv),x.push(b.aoMapUv),x.push(b.bumpMapUv),x.push(b.normalMapUv),x.push(b.displacementMapUv),x.push(b.emissiveMapUv),x.push(b.metalnessMapUv),x.push(b.roughnessMapUv),x.push(b.anisotropyMapUv),x.push(b.clearcoatMapUv),x.push(b.clearcoatNormalMapUv),x.push(b.clearcoatRoughnessMapUv),x.push(b.iridescenceMapUv),x.push(b.iridescenceThicknessMapUv),x.push(b.sheenColorMapUv),x.push(b.sheenRoughnessMapUv),x.push(b.specularMapUv),x.push(b.specularColorMapUv),x.push(b.specularIntensityMapUv),x.push(b.transmissionMapUv),x.push(b.thicknessMapUv),x.push(b.combine),x.push(b.fogExp2),x.push(b.sizeAttenuation),x.push(b.morphTargetsCount),x.push(b.morphAttributeCount),x.push(b.numDirLights),x.push(b.numPointLights),x.push(b.numSpotLights),x.push(b.numSpotLightMaps),x.push(b.numHemiLights),x.push(b.numRectAreaLights),x.push(b.numDirLightShadows),x.push(b.numPointLightShadows),x.push(b.numSpotLightShadows),x.push(b.numSpotLightShadowsWithMaps),x.push(b.numLightProbes),x.push(b.shadowMapType),x.push(b.toneMapping),x.push(b.numClippingPlanes),x.push(b.numClipIntersection),x.push(b.depthPacking);}function w(x,b){a.disableAll(),b.supportsVertexTextures&&a.enable(0),b.instancing&&a.enable(1),b.instancingColor&&a.enable(2),b.instancingMorph&&a.enable(3),b.matcap&&a.enable(4),b.envMap&&a.enable(5),b.normalMapObjectSpace&&a.enable(6),b.normalMapTangentSpace&&a.enable(7),b.clearcoat&&a.enable(8),b.iridescence&&a.enable(9),b.alphaTest&&a.enable(10),b.vertexColors&&a.enable(11),b.vertexAlphas&&a.enable(12),b.vertexUv1s&&a.enable(13),b.vertexUv2s&&a.enable(14),b.vertexUv3s&&a.enable(15),b.vertexTangents&&a.enable(16),b.anisotropy&&a.enable(17),b.alphaHash&&a.enable(18),b.batching&&a.enable(19),b.dispersion&&a.enable(20),b.batchingColor&&a.enable(21),b.gradientMap&&a.enable(22),x.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),x.push(a.mask);}function M(x){let b=_[x.type],I;if(b){let U=Ri[b];I=im.clone(U.uniforms);}else I=x.uniforms;return I}function A(x,b){let I;for(let U=0,X=u.length;U<X;U++){let $=u[U];if($.cacheKey===b){I=$,++I.usedTimes;break}}return I===void 0&&(I=new Jb(i,b,x,s),u.push(I)),I}function T(x){if(--x.usedTimes===0){let b=u.indexOf(x);u[b]=u[u.length-1],u.pop(),x.destroy();}}function D(x){l.remove(x);}function L(){l.dispose();}return {getParameters:m,getProgramCacheKey:h,getUniforms:M,acquireProgram:A,releaseProgram:T,releaseShaderCache:D,programs:u,dispose:L}}function tx(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o);}function r(o,a,l){i.get(o)[a]=l;}function s(){i=new WeakMap;}return {has:e,get:t,remove:n,update:r,dispose:s}}function nx(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function wm(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Cm(){let i=[],e=0,t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0;}function o(d,p,f,_,y,m){let h=i[e];return h===void 0?(h={id:d.id,object:d,geometry:p,material:f,groupOrder:_,renderOrder:d.renderOrder,z:y,group:m},i[e]=h):(h.id=d.id,h.object=d,h.geometry=p,h.material=f,h.groupOrder=_,h.renderOrder=d.renderOrder,h.z=y,h.group=m),e++,h}function a(d,p,f,_,y,m){let h=o(d,p,f,_,y,m);f.transmission>0?n.push(h):f.transparent===true?r.push(h):t.push(h);}function l(d,p,f,_,y,m){let h=o(d,p,f,_,y,m);f.transmission>0?n.unshift(h):f.transparent===true?r.unshift(h):t.unshift(h);}function c(d,p){t.length>1&&t.sort(d||nx),n.length>1&&n.sort(p||wm),r.length>1&&r.sort(p||wm);}function u(){for(let d=e,p=i.length;d<p;d++){let f=i[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null;}}return {opaque:t,transmissive:n,transparent:r,init:s,push:a,unshift:l,finish:u,sort:c}}function ix(){let i=new WeakMap;function e(n,r){let s=i.get(n),o;return s===void 0?(o=new Cm,i.set(n,[o])):r>=s.length?(o=new Cm,s.push(o)):o=s[r],o}function t(){i=new WeakMap;}return {get:e,dispose:t}}function rx(){let i={};return {get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case "DirectionalLight":t={direction:new O,color:new et};break;case "SpotLight":t={position:new O,direction:new O,color:new et,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case "PointLight":t={position:new O,color:new et,distance:0,decay:0};break;case "HemisphereLight":t={direction:new O,skyColor:new et,groundColor:new et};break;case "RectAreaLight":t={color:new et,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function sx(){let i={};return {get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case "DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt};break;case "SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt};break;case "PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new lt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var ox=0;function ax(i,e){return (e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function lx(i){let e=new rx,t=sx(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);let r=new O,s=new Wt,o=new Wt;function a(c){let u=0,d=0,p=0;for(let x=0;x<9;x++)n.probe[x].set(0,0,0);let f=0,_=0,y=0,m=0,h=0,E=0,w=0,M=0,A=0,T=0,D=0;c.sort(ax);for(let x=0,b=c.length;x<b;x++){let I=c[x],U=I.color,X=I.intensity,$=I.distance,J=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)u+=U.r*X,d+=U.g*X,p+=U.b*X;else if(I.isLightProbe){for(let j=0;j<9;j++)n.probe[j].addScaledVector(I.sh.coefficients[j],X);D++;}else if(I.isDirectionalLight){let j=e.get(I);if(j.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let le=I.shadow,q=t.get(I);q.shadowIntensity=le.intensity,q.shadowBias=le.bias,q.shadowNormalBias=le.normalBias,q.shadowRadius=le.radius,q.shadowMapSize=le.mapSize,n.directionalShadow[f]=q,n.directionalShadowMap[f]=J,n.directionalShadowMatrix[f]=I.shadow.matrix,E++;}n.directional[f]=j,f++;}else if(I.isSpotLight){let j=e.get(I);j.position.setFromMatrixPosition(I.matrixWorld),j.color.copy(U).multiplyScalar(X),j.distance=$,j.coneCos=Math.cos(I.angle),j.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),j.decay=I.decay,n.spot[y]=j;let le=I.shadow;if(I.map&&(n.spotLightMap[A]=I.map,A++,le.updateMatrices(I),I.castShadow&&T++),n.spotLightMatrix[y]=le.matrix,I.castShadow){let q=t.get(I);q.shadowIntensity=le.intensity,q.shadowBias=le.bias,q.shadowNormalBias=le.normalBias,q.shadowRadius=le.radius,q.shadowMapSize=le.mapSize,n.spotShadow[y]=q,n.spotShadowMap[y]=J,M++;}y++;}else if(I.isRectAreaLight){let j=e.get(I);j.color.copy(U).multiplyScalar(X),j.halfWidth.set(I.width*.5,0,0),j.halfHeight.set(0,I.height*.5,0),n.rectArea[m]=j,m++;}else if(I.isPointLight){let j=e.get(I);if(j.color.copy(I.color).multiplyScalar(I.intensity),j.distance=I.distance,j.decay=I.decay,I.castShadow){let le=I.shadow,q=t.get(I);q.shadowIntensity=le.intensity,q.shadowBias=le.bias,q.shadowNormalBias=le.normalBias,q.shadowRadius=le.radius,q.shadowMapSize=le.mapSize,q.shadowCameraNear=le.camera.near,q.shadowCameraFar=le.camera.far,n.pointShadow[_]=q,n.pointShadowMap[_]=J,n.pointShadowMatrix[_]=I.shadow.matrix,w++;}n.point[_]=j,_++;}else if(I.isHemisphereLight){let j=e.get(I);j.skyColor.copy(I.color).multiplyScalar(X),j.groundColor.copy(I.groundColor).multiplyScalar(X),n.hemi[h]=j,h++;}}m>0&&(i.has("OES_texture_float_linear")===true?(n.rectAreaLTC1=pe.LTC_FLOAT_1,n.rectAreaLTC2=pe.LTC_FLOAT_2):(n.rectAreaLTC1=pe.LTC_HALF_1,n.rectAreaLTC2=pe.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=d,n.ambient[2]=p;let L=n.hash;(L.directionalLength!==f||L.pointLength!==_||L.spotLength!==y||L.rectAreaLength!==m||L.hemiLength!==h||L.numDirectionalShadows!==E||L.numPointShadows!==w||L.numSpotShadows!==M||L.numSpotMaps!==A||L.numLightProbes!==D)&&(n.directional.length=f,n.spot.length=y,n.rectArea.length=m,n.point.length=_,n.hemi.length=h,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=M,n.spotShadowMap.length=M,n.directionalShadowMatrix.length=E,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=M+A-T,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=D,L.directionalLength=f,L.pointLength=_,L.spotLength=y,L.rectAreaLength=m,L.hemiLength=h,L.numDirectionalShadows=E,L.numPointShadows=w,L.numSpotShadows=M,L.numSpotMaps=A,L.numLightProbes=D,n.version=ox++);}function l(c,u){let d=0,p=0,f=0,_=0,y=0,m=u.matrixWorldInverse;for(let h=0,E=c.length;h<E;h++){let w=c[h];if(w.isDirectionalLight){let M=n.directional[d];M.direction.setFromMatrixPosition(w.matrixWorld),r.setFromMatrixPosition(w.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),d++;}else if(w.isSpotLight){let M=n.spot[f];M.position.setFromMatrixPosition(w.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(w.matrixWorld),r.setFromMatrixPosition(w.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),f++;}else if(w.isRectAreaLight){let M=n.rectArea[_];M.position.setFromMatrixPosition(w.matrixWorld),M.position.applyMatrix4(m),o.identity(),s.copy(w.matrixWorld),s.premultiply(m),o.extractRotation(s),M.halfWidth.set(w.width*.5,0,0),M.halfHeight.set(0,w.height*.5,0),M.halfWidth.applyMatrix4(o),M.halfHeight.applyMatrix4(o),_++;}else if(w.isPointLight){let M=n.point[p];M.position.setFromMatrixPosition(w.matrixWorld),M.position.applyMatrix4(m),p++;}else if(w.isHemisphereLight){let M=n.hemi[y];M.direction.setFromMatrixPosition(w.matrixWorld),M.direction.transformDirection(m),y++;}}}return {setup:a,setupView:l,state:n}}function Em(i){let e=new lx(i),t=[],n=[];function r(u){c.camera=u,t.length=0,n.length=0;}function s(u){t.push(u);}function o(u){n.push(u);}function a(){e.setup(t);}function l(u){e.setupView(t,u);}let c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return {init:r,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function cx(i){let e=new WeakMap;function t(r,s=0){let o=e.get(r),a;return o===void 0?(a=new Em(i),e.set(r,[a])):s>=o.length?(a=new Em(i),o.push(a)):a=o[s],a}function n(){e=new WeakMap;}return {get:t,dispose:n}}var ux=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,dx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function hx(i,e,t){let n=new Bs,r=new lt,s=new lt,o=new Ut,a=new yl({depthPacking:Xf}),l=new bl,c={},u=t.maxTextureSize,d={[zi]:Dn,[Dn]:zi,[ri]:ri},p=new mi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new lt},radius:{value:4}},vertexShader:ux,fragmentShader:dx}),f=p.clone();f.defines.HORIZONTAL_PASS=1;let _=new Ei;_.setAttribute("position",new Gn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new gt(_,p),m=this;this.enabled=false,this.autoUpdate=true,this.needsUpdate=false,this.type=Rd;let h=this.type;this.render=function(T,D,L){if(m.enabled===false||m.autoUpdate===false&&m.needsUpdate===false||T.length===0)return;let x=i.getRenderTarget(),b=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),U=i.state;U.setBlending(Wi),U.buffers.depth.getReversed()===true?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(true),U.setScissorTest(false);let X=h!==Ti&&this.type===Ti,$=h===Ti&&this.type!==Ti;for(let J=0,j=T.length;J<j;J++){let le=T[J],q=le.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",le,"has no shadow.");continue}if(q.autoUpdate===false&&q.needsUpdate===false)continue;r.copy(q.mapSize);let fe=q.getFrameExtents();if(r.multiply(fe),s.copy(q.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/fe.x),r.x=s.x*fe.x,q.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/fe.y),r.y=s.y*fe.y,q.mapSize.y=s.y)),q.map===null||X===true||$===true){let Fe=this.type!==Ti?{minFilter:ni,magFilter:ni}:{};q.map!==null&&q.map.dispose(),q.map=new Ci(r.x,r.y,Fe),q.map.texture.name=le.name+".shadowMap",q.camera.updateProjectionMatrix();}i.setRenderTarget(q.map),i.clear();let ye=q.getViewportCount();for(let Fe=0;Fe<ye;Fe++){let it=q.getViewport(Fe);o.set(s.x*it.x,s.y*it.y,s.x*it.z,s.y*it.w),U.viewport(o),q.updateMatrices(le,Fe),n=q.getFrustum(),M(D,L,q.camera,le,this.type);}q.isPointLightShadow!==true&&this.type===Ti&&E(q,L),q.needsUpdate=false;}h=this.type,m.needsUpdate=false,i.setRenderTarget(x,b,I);};function E(T,D){let L=e.update(y);p.defines.VSM_SAMPLES!==T.blurSamples&&(p.defines.VSM_SAMPLES=T.blurSamples,f.defines.VSM_SAMPLES=T.blurSamples,p.needsUpdate=true,f.needsUpdate=true),T.mapPass===null&&(T.mapPass=new Ci(r.x,r.y)),p.uniforms.shadow_pass.value=T.map.texture,p.uniforms.resolution.value=T.mapSize,p.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(D,null,L,p,y,null),f.uniforms.shadow_pass.value=T.mapPass.texture,f.uniforms.resolution.value=T.mapSize,f.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(D,null,L,f,y,null);}function w(T,D,L,x){let b=null,I=L.isPointLight===true?T.customDistanceMaterial:T.customDepthMaterial;if(I!==void 0)b=I;else if(b=L.isPointLight===true?l:a,i.localClippingEnabled&&D.clipShadows===true&&Array.isArray(D.clippingPlanes)&&D.clippingPlanes.length!==0||D.displacementMap&&D.displacementScale!==0||D.alphaMap&&D.alphaTest>0||D.map&&D.alphaTest>0||D.alphaToCoverage===true){let U=b.uuid,X=D.uuid,$=c[U];$===void 0&&($={},c[U]=$);let J=$[X];J===void 0&&(J=b.clone(),$[X]=J,D.addEventListener("dispose",A)),b=J;}if(b.visible=D.visible,b.wireframe=D.wireframe,x===Ti?b.side=D.shadowSide!==null?D.shadowSide:D.side:b.side=D.shadowSide!==null?D.shadowSide:d[D.side],b.alphaMap=D.alphaMap,b.alphaTest=D.alphaToCoverage===true?.5:D.alphaTest,b.map=D.map,b.clipShadows=D.clipShadows,b.clippingPlanes=D.clippingPlanes,b.clipIntersection=D.clipIntersection,b.displacementMap=D.displacementMap,b.displacementScale=D.displacementScale,b.displacementBias=D.displacementBias,b.wireframeLinewidth=D.wireframeLinewidth,b.linewidth=D.linewidth,L.isPointLight===true&&b.isMeshDistanceMaterial===true){let U=i.properties.get(b);U.light=L;}return b}function M(T,D,L,x,b){if(T.visible===false)return;if(T.layers.test(D.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&b===Ti)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,T.matrixWorld);let X=e.update(T),$=T.material;if(Array.isArray($)){let J=X.groups;for(let j=0,le=J.length;j<le;j++){let q=J[j],fe=$[q.materialIndex];if(fe&&fe.visible){let ye=w(T,fe,x,b);T.onBeforeShadow(i,T,D,L,X,ye,q),i.renderBufferDirect(L,null,X,ye,T,q),T.onAfterShadow(i,T,D,L,X,ye,q);}}}else if($.visible){let J=w(T,$,x,b);T.onBeforeShadow(i,T,D,L,X,J,null),i.renderBufferDirect(L,null,X,J,T,null),T.onAfterShadow(i,T,D,L,X,J,null);}}let U=T.children;for(let X=0,$=U.length;X<$;X++)M(U[X],D,L,x,b);}function A(T){T.target.removeEventListener("dispose",A);for(let L in c){let x=c[L],b=T.target.uuid;b in x&&(x[b].dispose(),delete x[b]);}}}var px={[Rl]:Il,[Dl]:Fl,[Pl]:Ll,[Vr]:Nl,[Il]:Rl,[Fl]:Dl,[Ll]:Pl,[Nl]:Vr};function fx(i,e){function t(){let R=false,ae=new Ut,de=null,xe=new Ut(0,0,0,0);return {setMask:function(re){de!==re&&!R&&(i.colorMask(re,re,re,re),de=re);},setLocked:function(re){R=re;},setClear:function(re,ee,Ee,qe,Mt){Mt===true&&(re*=qe,ee*=qe,Ee*=qe),ae.set(re,ee,Ee,qe),xe.equals(ae)===false&&(i.clearColor(re,ee,Ee,qe),xe.copy(ae));},reset:function(){R=false,de=null,xe.set(-1,0,0,0);}}}function n(){let R=false,ae=false,de=null,xe=null,re=null;return {setReversed:function(ee){if(ae!==ee){let Ee=e.get("EXT_clip_control");ee?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),ae=ee;let qe=re;re=null,this.setClear(qe);}},getReversed:function(){return ae},setTest:function(ee){ee?ie(i.DEPTH_TEST):Me(i.DEPTH_TEST);},setMask:function(ee){de!==ee&&!R&&(i.depthMask(ee),de=ee);},setFunc:function(ee){if(ae&&(ee=px[ee]),xe!==ee){switch(ee){case Rl:i.depthFunc(i.NEVER);break;case Il:i.depthFunc(i.ALWAYS);break;case Dl:i.depthFunc(i.LESS);break;case Vr:i.depthFunc(i.LEQUAL);break;case Pl:i.depthFunc(i.EQUAL);break;case Nl:i.depthFunc(i.GEQUAL);break;case Fl:i.depthFunc(i.GREATER);break;case Ll:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL);}xe=ee;}},setLocked:function(ee){R=ee;},setClear:function(ee){re!==ee&&(ae&&(ee=1-ee),i.clearDepth(ee),re=ee);},reset:function(){R=false,de=null,xe=null,re=null,ae=false;}}}function r(){let R=false,ae=null,de=null,xe=null,re=null,ee=null,Ee=null,qe=null,Mt=null;return {setTest:function(mt){R||(mt?ie(i.STENCIL_TEST):Me(i.STENCIL_TEST));},setMask:function(mt){ae!==mt&&!R&&(i.stencilMask(mt),ae=mt);},setFunc:function(mt,Di,_i){(de!==mt||xe!==Di||re!==_i)&&(i.stencilFunc(mt,Di,_i),de=mt,xe=Di,re=_i);},setOp:function(mt,Di,_i){(ee!==mt||Ee!==Di||qe!==_i)&&(i.stencilOp(mt,Di,_i),ee=mt,Ee=Di,qe=_i);},setLocked:function(mt){R=mt;},setClear:function(mt){Mt!==mt&&(i.clearStencil(mt),Mt=mt);},reset:function(){R=false,ae=null,de=null,xe=null,re=null,ee=null,Ee=null,qe=null,Mt=null;}}}let s=new t,o=new n,a=new r,l=new WeakMap,c=new WeakMap,u={},d={},p=new WeakMap,f=[],_=null,y=false,m=null,h=null,E=null,w=null,M=null,A=null,T=null,D=new et(0,0,0),L=0,x=false,b=null,I=null,U=null,X=null,$=null,J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),j=false,le=0,q=i.getParameter(i.VERSION);q.indexOf("WebGL")!==-1?(le=parseFloat(/^WebGL (\d)/.exec(q)[1]),j=le>=1):q.indexOf("OpenGL ES")!==-1&&(le=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),j=le>=2);let fe=null,ye={},Fe=i.getParameter(i.SCISSOR_BOX),it=i.getParameter(i.VIEWPORT),xt=new Ut().fromArray(Fe),Tt=new Ut().fromArray(it);function ft(R,ae,de,xe){let re=new Uint8Array(4),ee=i.createTexture();i.bindTexture(R,ee),i.texParameteri(R,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(R,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ee=0;Ee<de;Ee++)R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY?i.texImage3D(ae,0,i.RGBA,1,1,xe,0,i.RGBA,i.UNSIGNED_BYTE,re):i.texImage2D(ae+Ee,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,re);return ee}let Q={};Q[i.TEXTURE_2D]=ft(i.TEXTURE_2D,i.TEXTURE_2D,1),Q[i.TEXTURE_CUBE_MAP]=ft(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q[i.TEXTURE_2D_ARRAY]=ft(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Q[i.TEXTURE_3D]=ft(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ie(i.DEPTH_TEST),o.setFunc(Vr),ze(false),Te(Ad),ie(i.CULL_FACE),At(Wi);function ie(R){u[R]!==true&&(i.enable(R),u[R]=true);}function Me(R){u[R]!==false&&(i.disable(R),u[R]=false);}function Ge(R,ae){return d[R]!==ae?(i.bindFramebuffer(R,ae),d[R]=ae,R===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=ae),R===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=ae),true):false}function Ne(R,ae){let de=f,xe=false;if(R){de=p.get(ae),de===void 0&&(de=[],p.set(ae,de));let re=R.textures;if(de.length!==re.length||de[0]!==i.COLOR_ATTACHMENT0){for(let ee=0,Ee=re.length;ee<Ee;ee++)de[ee]=i.COLOR_ATTACHMENT0+ee;de.length=re.length,xe=true;}}else de[0]!==i.BACK&&(de[0]=i.BACK,xe=true);xe&&i.drawBuffers(de);}function ct(R){return _!==R?(i.useProgram(R),_=R,true):false}let vn={[ar]:i.FUNC_ADD,[vf]:i.FUNC_SUBTRACT,[yf]:i.FUNC_REVERSE_SUBTRACT};vn[bf]=i.MIN,vn[xf]=i.MAX;let C={[Mf]:i.ZERO,[Sf]:i.ONE,[wf]:i.SRC_COLOR,[ll]:i.SRC_ALPHA,[If]:i.SRC_ALPHA_SATURATE,[Af]:i.DST_COLOR,[Ef]:i.DST_ALPHA,[Cf]:i.ONE_MINUS_SRC_COLOR,[cl]:i.ONE_MINUS_SRC_ALPHA,[Rf]:i.ONE_MINUS_DST_COLOR,[Tf]:i.ONE_MINUS_DST_ALPHA,[Df]:i.CONSTANT_COLOR,[Pf]:i.ONE_MINUS_CONSTANT_COLOR,[Nf]:i.CONSTANT_ALPHA,[Ff]:i.ONE_MINUS_CONSTANT_ALPHA};function At(R,ae,de,xe,re,ee,Ee,qe,Mt,mt){if(R===Wi){y===true&&(Me(i.BLEND),y=false);return}if(y===false&&(ie(i.BLEND),y=true),R!==_f){if(R!==m||mt!==x){if((h!==ar||M!==ar)&&(i.blendEquation(i.FUNC_ADD),h=ar,M=ar),mt)switch(R){case Br:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Id:i.blendFunc(i.ONE,i.ONE);break;case Dd:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Pd:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}else switch(R){case Br:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Id:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Dd:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Pd:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}E=null,w=null,A=null,T=null,D.set(0,0,0),L=0,m=R,x=mt;}return}re=re||ae,ee=ee||de,Ee=Ee||xe,(ae!==h||re!==M)&&(i.blendEquationSeparate(vn[ae],vn[re]),h=ae,M=re),(de!==E||xe!==w||ee!==A||Ee!==T)&&(i.blendFuncSeparate(C[de],C[xe],C[ee],C[Ee]),E=de,w=xe,A=ee,T=Ee),(qe.equals(D)===false||Mt!==L)&&(i.blendColor(qe.r,qe.g,qe.b,Mt),D.copy(qe),L=Mt),m=R,x=false;}function $e(R,ae){R.side===ri?Me(i.CULL_FACE):ie(i.CULL_FACE);let de=R.side===Dn;ae&&(de=!de),ze(de),R.blending===Br&&R.transparent===false?At(Wi):At(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),o.setFunc(R.depthFunc),o.setTest(R.depthTest),o.setMask(R.depthWrite),s.setMask(R.colorWrite);let xe=R.stencilWrite;a.setTest(xe),xe&&(a.setMask(R.stencilWriteMask),a.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),a.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),Ae(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===true?ie(i.SAMPLE_ALPHA_TO_COVERAGE):Me(i.SAMPLE_ALPHA_TO_COVERAGE);}function ze(R){b!==R&&(R?i.frontFace(i.CW):i.frontFace(i.CCW),b=R);}function Te(R){R!==mf?(ie(i.CULL_FACE),R!==I&&(R===Ad?i.cullFace(i.BACK):R===gf?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Me(i.CULL_FACE),I=R;}function Rt(R){R!==U&&(j&&i.lineWidth(R),U=R);}function Ae(R,ae,de){R?(ie(i.POLYGON_OFFSET_FILL),(X!==ae||$!==de)&&(i.polygonOffset(ae,de),X=ae,$=de)):Me(i.POLYGON_OFFSET_FILL);}function Je(R){R?ie(i.SCISSOR_TEST):Me(i.SCISSOR_TEST);}function an(R){R===void 0&&(R=i.TEXTURE0+J-1),fe!==R&&(i.activeTexture(R),fe=R);}function Xt(R,ae,de){de===void 0&&(fe===null?de=i.TEXTURE0+J-1:de=fe);let xe=ye[de];xe===void 0&&(xe={type:void 0,texture:void 0},ye[de]=xe),(xe.type!==R||xe.texture!==ae)&&(fe!==de&&(i.activeTexture(de),fe=de),i.bindTexture(R,ae||Q[R]),xe.type=R,xe.texture=ae);}function S(){let R=ye[fe];R!==void 0&&R.type!==void 0&&(i.bindTexture(R.type,null),R.type=void 0,R.texture=void 0);}function g(){try{i.compressedTexImage2D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function k(){try{i.compressedTexImage3D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function Z(){try{i.texSubImage2D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function te(){try{i.texSubImage3D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function Y(){try{i.compressedTexSubImage2D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function Pe(){try{i.compressedTexSubImage3D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function ue(){try{i.texStorage2D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function Re(){try{i.texStorage3D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function Ie(){try{i.texImage2D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function oe(){try{i.texImage3D(...arguments);}catch(R){console.error("THREE.WebGLState:",R);}}function ve(R){xt.equals(R)===false&&(i.scissor(R.x,R.y,R.z,R.w),xt.copy(R));}function Ve(R){Tt.equals(R)===false&&(i.viewport(R.x,R.y,R.z,R.w),Tt.copy(R));}function De(R,ae){let de=c.get(ae);de===void 0&&(de=new WeakMap,c.set(ae,de));let xe=de.get(R);xe===void 0&&(xe=i.getUniformBlockIndex(ae,R.name),de.set(R,xe));}function me(R,ae){let xe=c.get(ae).get(R);l.get(ae)!==xe&&(i.uniformBlockBinding(ae,xe,R.__bindingPointIndex),l.set(ae,xe));}function Ze(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(true,true,true,true),i.clearColor(0,0,0,0),i.depthMask(true),i.depthFunc(i.LESS),o.setReversed(false),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},fe=null,ye={},d={},p=new WeakMap,f=[],_=null,y=false,m=null,h=null,E=null,w=null,M=null,A=null,T=null,D=new et(0,0,0),L=0,x=false,b=null,I=null,U=null,X=null,$=null,xt.set(0,0,i.canvas.width,i.canvas.height),Tt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),o.reset(),a.reset();}return {buffers:{color:s,depth:o,stencil:a},enable:ie,disable:Me,bindFramebuffer:Ge,drawBuffers:Ne,useProgram:ct,setBlending:At,setMaterial:$e,setFlipSided:ze,setCullFace:Te,setLineWidth:Rt,setPolygonOffset:Ae,setScissorTest:Je,activeTexture:an,bindTexture:Xt,unbindTexture:S,compressedTexImage2D:g,compressedTexImage3D:k,texImage2D:Ie,texImage3D:oe,updateUBOMapping:De,uniformBlockBinding:me,texStorage2D:ue,texStorage3D:Re,texSubImage2D:Z,texSubImage3D:te,compressedTexSubImage2D:Y,compressedTexSubImage3D:Pe,scissor:ve,viewport:Ve,reset:Ze}}function mx(i,e,t,n,r,s,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?false:/OculusBrowser/g.test(navigator.userAgent),c=new lt,u=new WeakMap,d,p=new WeakMap,f=false;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null;}catch{}function _(S,g){return f?new OffscreenCanvas(S,g):Do("canvas")}function y(S,g,k){let Z=1,te=Xt(S);if((te.width>k||te.height>k)&&(Z=k/Math.max(te.width,te.height)),Z<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let Y=Math.floor(Z*te.width),Pe=Math.floor(Z*te.height);d===void 0&&(d=_(Y,Pe));let ue=g?_(Y,Pe):d;return ue.width=Y,ue.height=Pe,ue.getContext("2d").drawImage(S,0,0,Y,Pe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+te.width+"x"+te.height+") to ("+Y+"x"+Pe+")."),ue}else return "data"in S&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+te.width+"x"+te.height+")."),S;return S}function m(S){return S.generateMipmaps}function h(S){i.generateMipmap(S);}function E(S){return S.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?i.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(S,g,k,Z,te=false){if(S!==null){if(i[S]!==void 0)return i[S];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'");}let Y=g;if(g===i.RED&&(k===i.FLOAT&&(Y=i.R32F),k===i.HALF_FLOAT&&(Y=i.R16F),k===i.UNSIGNED_BYTE&&(Y=i.R8)),g===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.R8UI),k===i.UNSIGNED_SHORT&&(Y=i.R16UI),k===i.UNSIGNED_INT&&(Y=i.R32UI),k===i.BYTE&&(Y=i.R8I),k===i.SHORT&&(Y=i.R16I),k===i.INT&&(Y=i.R32I)),g===i.RG&&(k===i.FLOAT&&(Y=i.RG32F),k===i.HALF_FLOAT&&(Y=i.RG16F),k===i.UNSIGNED_BYTE&&(Y=i.RG8)),g===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RG8UI),k===i.UNSIGNED_SHORT&&(Y=i.RG16UI),k===i.UNSIGNED_INT&&(Y=i.RG32UI),k===i.BYTE&&(Y=i.RG8I),k===i.SHORT&&(Y=i.RG16I),k===i.INT&&(Y=i.RG32I)),g===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),k===i.UNSIGNED_INT&&(Y=i.RGB32UI),k===i.BYTE&&(Y=i.RGB8I),k===i.SHORT&&(Y=i.RGB16I),k===i.INT&&(Y=i.RGB32I)),g===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),k===i.UNSIGNED_INT&&(Y=i.RGBA32UI),k===i.BYTE&&(Y=i.RGBA8I),k===i.SHORT&&(Y=i.RGBA16I),k===i.INT&&(Y=i.RGBA32I)),g===i.RGB&&(k===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),g===i.RGBA){let Pe=te?Ro:dt.getTransfer(Z);k===i.FLOAT&&(Y=i.RGBA32F),k===i.HALF_FLOAT&&(Y=i.RGBA16F),k===i.UNSIGNED_BYTE&&(Y=Pe===vt?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1);}return (Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function M(S,g){let k;return S?g===null||g===mr||g===Xs?k=i.DEPTH24_STENCIL8:g===Ai?k=i.DEPTH32F_STENCIL8:g===Gs&&(k=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===mr||g===Xs?k=i.DEPTH_COMPONENT24:g===Ai?k=i.DEPTH_COMPONENT32F:g===Gs&&(k=i.DEPTH_COMPONENT16),k}function A(S,g){return m(S)===true||S.isFramebufferTexture&&S.minFilter!==ni&&S.minFilter!==Wn?Math.log2(Math.max(g.width,g.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?g.mipmaps.length:1}function T(S){let g=S.target;g.removeEventListener("dispose",T),L(g),g.isVideoTexture&&u.delete(g);}function D(S){let g=S.target;g.removeEventListener("dispose",D),b(g);}function L(S){let g=n.get(S);if(g.__webglInit===void 0)return;let k=S.source,Z=p.get(k);if(Z){let te=Z[g.__cacheKey];te.usedTimes--,te.usedTimes===0&&x(S),Object.keys(Z).length===0&&p.delete(k);}n.remove(S);}function x(S){let g=n.get(S);i.deleteTexture(g.__webglTexture);let k=S.source,Z=p.get(k);delete Z[g.__cacheKey],o.memory.textures--;}function b(S){let g=n.get(S);if(S.depthTexture&&(S.depthTexture.dispose(),n.remove(S.depthTexture)),S.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(g.__webglFramebuffer[Z]))for(let te=0;te<g.__webglFramebuffer[Z].length;te++)i.deleteFramebuffer(g.__webglFramebuffer[Z][te]);else i.deleteFramebuffer(g.__webglFramebuffer[Z]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[Z]);}else {if(Array.isArray(g.__webglFramebuffer))for(let Z=0;Z<g.__webglFramebuffer.length;Z++)i.deleteFramebuffer(g.__webglFramebuffer[Z]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let Z=0;Z<g.__webglColorRenderbuffer.length;Z++)g.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[Z]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer);}let k=S.textures;for(let Z=0,te=k.length;Z<te;Z++){let Y=n.get(k[Z]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),o.memory.textures--),n.remove(k[Z]);}n.remove(S);}let I=0;function U(){I=0;}function X(){let S=I;return S>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+S+" texture units while this GPU supports only "+r.maxTextures),I+=1,S}function $(S){let g=[];return g.push(S.wrapS),g.push(S.wrapT),g.push(S.wrapR||0),g.push(S.magFilter),g.push(S.minFilter),g.push(S.anisotropy),g.push(S.internalFormat),g.push(S.format),g.push(S.type),g.push(S.generateMipmaps),g.push(S.premultiplyAlpha),g.push(S.flipY),g.push(S.unpackAlignment),g.push(S.colorSpace),g.join()}function J(S,g){let k=n.get(S);if(S.isVideoTexture&&Je(S),S.isRenderTargetTexture===false&&S.isExternalTexture!==true&&S.version>0&&k.__version!==S.version){let Z=S.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===false)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else {Q(k,S,g);return}}else S.isExternalTexture&&(k.__webglTexture=S.sourceTexture?S.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+g);}function j(S,g){let k=n.get(S);if(S.isRenderTargetTexture===false&&S.version>0&&k.__version!==S.version){Q(k,S,g);return}t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+g);}function le(S,g){let k=n.get(S);if(S.isRenderTargetTexture===false&&S.version>0&&k.__version!==S.version){Q(k,S,g);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+g);}function q(S,g){let k=n.get(S);if(S.version>0&&k.__version!==S.version){ie(k,S,g);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+g);}let fe={[ul]:i.REPEAT,[or]:i.CLAMP_TO_EDGE,[dl]:i.MIRRORED_REPEAT},ye={[ni]:i.NEAREST,[Gf]:i.NEAREST_MIPMAP_NEAREST,[Yo]:i.NEAREST_MIPMAP_LINEAR,[Wn]:i.LINEAR,[Ul]:i.LINEAR_MIPMAP_NEAREST,[fr]:i.LINEAR_MIPMAP_LINEAR},Fe={[Yf]:i.NEVER,[Qf]:i.ALWAYS,[$f]:i.LESS,[Gd]:i.LEQUAL,[jf]:i.EQUAL,[Jf]:i.GEQUAL,[Zf]:i.GREATER,[Kf]:i.NOTEQUAL};function it(S,g){if(g.type===Ai&&e.has("OES_texture_float_linear")===false&&(g.magFilter===Wn||g.magFilter===Ul||g.magFilter===Yo||g.magFilter===fr||g.minFilter===Wn||g.minFilter===Ul||g.minFilter===Yo||g.minFilter===fr)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(S,i.TEXTURE_WRAP_S,fe[g.wrapS]),i.texParameteri(S,i.TEXTURE_WRAP_T,fe[g.wrapT]),(S===i.TEXTURE_3D||S===i.TEXTURE_2D_ARRAY)&&i.texParameteri(S,i.TEXTURE_WRAP_R,fe[g.wrapR]),i.texParameteri(S,i.TEXTURE_MAG_FILTER,ye[g.magFilter]),i.texParameteri(S,i.TEXTURE_MIN_FILTER,ye[g.minFilter]),g.compareFunction&&(i.texParameteri(S,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(S,i.TEXTURE_COMPARE_FUNC,Fe[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===true){if(g.magFilter===ni||g.minFilter!==Yo&&g.minFilter!==fr||g.type===Ai&&e.has("OES_texture_float_linear")===false)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){let k=e.get("EXT_texture_filter_anisotropic");i.texParameterf(S,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy;}}}function xt(S,g){let k=false;S.__webglInit===void 0&&(S.__webglInit=true,g.addEventListener("dispose",T));let Z=g.source,te=p.get(Z);te===void 0&&(te={},p.set(Z,te));let Y=$(g);if(Y!==S.__cacheKey){te[Y]===void 0&&(te[Y]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,k=true),te[Y].usedTimes++;let Pe=te[S.__cacheKey];Pe!==void 0&&(te[S.__cacheKey].usedTimes--,Pe.usedTimes===0&&x(g)),S.__cacheKey=Y,S.__webglTexture=te[Y].texture;}return k}function Tt(S,g,k){return Math.floor(Math.floor(S/k)/g)}function ft(S,g,k,Z){let Y=S.updateRanges;if(Y.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,k,Z,g.data);else {Y.sort((oe,ve)=>oe.start-ve.start);let Pe=0;for(let oe=1;oe<Y.length;oe++){let ve=Y[Pe],Ve=Y[oe],De=ve.start+ve.count,me=Tt(Ve.start,g.width,4),Ze=Tt(ve.start,g.width,4);Ve.start<=De+1&&me===Ze&&Tt(Ve.start+Ve.count-1,g.width,4)===me?ve.count=Math.max(ve.count,Ve.start+Ve.count-ve.start):(++Pe,Y[Pe]=Ve);}Y.length=Pe+1;let ue=i.getParameter(i.UNPACK_ROW_LENGTH),Re=i.getParameter(i.UNPACK_SKIP_PIXELS),Ie=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let oe=0,ve=Y.length;oe<ve;oe++){let Ve=Y[oe],De=Math.floor(Ve.start/4),me=Math.ceil(Ve.count/4),Ze=De%g.width,R=Math.floor(De/g.width),ae=me,de=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,Ze),i.pixelStorei(i.UNPACK_SKIP_ROWS,R),t.texSubImage2D(i.TEXTURE_2D,0,Ze,R,ae,de,k,Z,g.data);}S.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,ue),i.pixelStorei(i.UNPACK_SKIP_PIXELS,Re),i.pixelStorei(i.UNPACK_SKIP_ROWS,Ie);}}function Q(S,g,k){let Z=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(Z=i.TEXTURE_3D);let te=xt(S,g),Y=g.source;t.bindTexture(Z,S.__webglTexture,i.TEXTURE0+k);let Pe=n.get(Y);if(Y.version!==Pe.__version||te===true){t.activeTexture(i.TEXTURE0+k);let ue=dt.getPrimaries(dt.workingColorSpace),Re=g.colorSpace===qi?null:dt.getPrimaries(g.colorSpace),Ie=g.colorSpace===qi||ue===Re?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ie);let oe=y(g.image,false,r.maxTextureSize);oe=an(g,oe);let ve=s.convert(g.format,g.colorSpace),Ve=s.convert(g.type),De=w(g.internalFormat,ve,Ve,g.colorSpace,g.isVideoTexture);it(Z,g);let me,Ze=g.mipmaps,R=g.isVideoTexture!==true,ae=Pe.__version===void 0||te===true,de=Y.dataReady,xe=A(g,oe);if(g.isDepthTexture)De=M(g.format===qs,g.type),ae&&(R?t.texStorage2D(i.TEXTURE_2D,1,De,oe.width,oe.height):t.texImage2D(i.TEXTURE_2D,0,De,oe.width,oe.height,0,ve,Ve,null));else if(g.isDataTexture)if(Ze.length>0){R&&ae&&t.texStorage2D(i.TEXTURE_2D,xe,De,Ze[0].width,Ze[0].height);for(let re=0,ee=Ze.length;re<ee;re++)me=Ze[re],R?de&&t.texSubImage2D(i.TEXTURE_2D,re,0,0,me.width,me.height,ve,Ve,me.data):t.texImage2D(i.TEXTURE_2D,re,De,me.width,me.height,0,ve,Ve,me.data);g.generateMipmaps=false;}else R?(ae&&t.texStorage2D(i.TEXTURE_2D,xe,De,oe.width,oe.height),de&&ft(g,oe,ve,Ve)):t.texImage2D(i.TEXTURE_2D,0,De,oe.width,oe.height,0,ve,Ve,oe.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){R&&ae&&t.texStorage3D(i.TEXTURE_2D_ARRAY,xe,De,Ze[0].width,Ze[0].height,oe.depth);for(let re=0,ee=Ze.length;re<ee;re++)if(me=Ze[re],g.format!==si)if(ve!==null)if(R){if(de)if(g.layerUpdates.size>0){let Ee=jd(me.width,me.height,g.format,g.type);for(let qe of g.layerUpdates){let Mt=me.data.subarray(qe*Ee/me.data.BYTES_PER_ELEMENT,(qe+1)*Ee/me.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,re,0,0,qe,me.width,me.height,1,ve,Mt);}g.clearLayerUpdates();}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,re,0,0,0,me.width,me.height,oe.depth,ve,me.data);}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,re,De,me.width,me.height,oe.depth,0,me.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else R?de&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,re,0,0,0,me.width,me.height,oe.depth,ve,Ve,me.data):t.texImage3D(i.TEXTURE_2D_ARRAY,re,De,me.width,me.height,oe.depth,0,ve,Ve,me.data);}else {R&&ae&&t.texStorage2D(i.TEXTURE_2D,xe,De,Ze[0].width,Ze[0].height);for(let re=0,ee=Ze.length;re<ee;re++)me=Ze[re],g.format!==si?ve!==null?R?de&&t.compressedTexSubImage2D(i.TEXTURE_2D,re,0,0,me.width,me.height,ve,me.data):t.compressedTexImage2D(i.TEXTURE_2D,re,De,me.width,me.height,0,me.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):R?de&&t.texSubImage2D(i.TEXTURE_2D,re,0,0,me.width,me.height,ve,Ve,me.data):t.texImage2D(i.TEXTURE_2D,re,De,me.width,me.height,0,ve,Ve,me.data);}else if(g.isDataArrayTexture)if(R){if(ae&&t.texStorage3D(i.TEXTURE_2D_ARRAY,xe,De,oe.width,oe.height,oe.depth),de)if(g.layerUpdates.size>0){let re=jd(oe.width,oe.height,g.format,g.type);for(let ee of g.layerUpdates){let Ee=oe.data.subarray(ee*re/oe.data.BYTES_PER_ELEMENT,(ee+1)*re/oe.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,ee,oe.width,oe.height,1,ve,Ve,Ee);}g.clearLayerUpdates();}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,oe.width,oe.height,oe.depth,ve,Ve,oe.data);}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,De,oe.width,oe.height,oe.depth,0,ve,Ve,oe.data);else if(g.isData3DTexture)R?(ae&&t.texStorage3D(i.TEXTURE_3D,xe,De,oe.width,oe.height,oe.depth),de&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,oe.width,oe.height,oe.depth,ve,Ve,oe.data)):t.texImage3D(i.TEXTURE_3D,0,De,oe.width,oe.height,oe.depth,0,ve,Ve,oe.data);else if(g.isFramebufferTexture){if(ae)if(R)t.texStorage2D(i.TEXTURE_2D,xe,De,oe.width,oe.height);else {let re=oe.width,ee=oe.height;for(let Ee=0;Ee<xe;Ee++)t.texImage2D(i.TEXTURE_2D,Ee,De,re,ee,0,ve,Ve,null),re>>=1,ee>>=1;}}else if(Ze.length>0){if(R&&ae){let re=Xt(Ze[0]);t.texStorage2D(i.TEXTURE_2D,xe,De,re.width,re.height);}for(let re=0,ee=Ze.length;re<ee;re++)me=Ze[re],R?de&&t.texSubImage2D(i.TEXTURE_2D,re,0,0,ve,Ve,me):t.texImage2D(i.TEXTURE_2D,re,De,ve,Ve,me);g.generateMipmaps=false;}else if(R){if(ae){let re=Xt(oe);t.texStorage2D(i.TEXTURE_2D,xe,De,re.width,re.height);}de&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ve,Ve,oe);}else t.texImage2D(i.TEXTURE_2D,0,De,ve,Ve,oe);m(g)&&h(Z),Pe.__version=Y.version,g.onUpdate&&g.onUpdate(g);}S.__version=g.version;}function ie(S,g,k){if(g.image.length!==6)return;let Z=xt(S,g),te=g.source;t.bindTexture(i.TEXTURE_CUBE_MAP,S.__webglTexture,i.TEXTURE0+k);let Y=n.get(te);if(te.version!==Y.__version||Z===true){t.activeTexture(i.TEXTURE0+k);let Pe=dt.getPrimaries(dt.workingColorSpace),ue=g.colorSpace===qi?null:dt.getPrimaries(g.colorSpace),Re=g.colorSpace===qi||Pe===ue?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Re);let Ie=g.isCompressedTexture||g.image[0].isCompressedTexture,oe=g.image[0]&&g.image[0].isDataTexture,ve=[];for(let ee=0;ee<6;ee++)!Ie&&!oe?ve[ee]=y(g.image[ee],true,r.maxCubemapSize):ve[ee]=oe?g.image[ee].image:g.image[ee],ve[ee]=an(g,ve[ee]);let Ve=ve[0],De=s.convert(g.format,g.colorSpace),me=s.convert(g.type),Ze=w(g.internalFormat,De,me,g.colorSpace),R=g.isVideoTexture!==true,ae=Y.__version===void 0||Z===true,de=te.dataReady,xe=A(g,Ve);it(i.TEXTURE_CUBE_MAP,g);let re;if(Ie){R&&ae&&t.texStorage2D(i.TEXTURE_CUBE_MAP,xe,Ze,Ve.width,Ve.height);for(let ee=0;ee<6;ee++){re=ve[ee].mipmaps;for(let Ee=0;Ee<re.length;Ee++){let qe=re[Ee];g.format!==si?De!==null?R?de&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee,0,0,qe.width,qe.height,De,qe.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee,Ze,qe.width,qe.height,0,qe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):R?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee,0,0,qe.width,qe.height,De,me,qe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee,Ze,qe.width,qe.height,0,De,me,qe.data);}}}else {if(re=g.mipmaps,R&&ae){re.length>0&&xe++;let ee=Xt(ve[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,xe,Ze,ee.width,ee.height);}for(let ee=0;ee<6;ee++)if(oe){R?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,ve[ee].width,ve[ee].height,De,me,ve[ee].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Ze,ve[ee].width,ve[ee].height,0,De,me,ve[ee].data);for(let Ee=0;Ee<re.length;Ee++){let Mt=re[Ee].image[ee].image;R?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee+1,0,0,Mt.width,Mt.height,De,me,Mt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee+1,Ze,Mt.width,Mt.height,0,De,me,Mt.data);}}else {R?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,De,me,ve[ee]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Ze,De,me,ve[ee]);for(let Ee=0;Ee<re.length;Ee++){let qe=re[Ee];R?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee+1,0,0,De,me,qe.image[ee]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Ee+1,Ze,De,me,qe.image[ee]);}}}m(g)&&h(i.TEXTURE_CUBE_MAP),Y.__version=te.version,g.onUpdate&&g.onUpdate(g);}S.__version=g.version;}function Me(S,g,k,Z,te,Y){let Pe=s.convert(k.format,k.colorSpace),ue=s.convert(k.type),Re=w(k.internalFormat,Pe,ue,k.colorSpace),Ie=n.get(g),oe=n.get(k);if(oe.__renderTarget=g,!Ie.__hasExternalTextures){let ve=Math.max(1,g.width>>Y),Ve=Math.max(1,g.height>>Y);te===i.TEXTURE_3D||te===i.TEXTURE_2D_ARRAY?t.texImage3D(te,Y,Re,ve,Ve,g.depth,0,Pe,ue,null):t.texImage2D(te,Y,Re,ve,Ve,0,Pe,ue,null);}t.bindFramebuffer(i.FRAMEBUFFER,S),Ae(g)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,te,oe.__webglTexture,0,Rt(g)):(te===i.TEXTURE_2D||te>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&te<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,te,oe.__webglTexture,Y),t.bindFramebuffer(i.FRAMEBUFFER,null);}function Ge(S,g,k){if(i.bindRenderbuffer(i.RENDERBUFFER,S),g.depthBuffer){let Z=g.depthTexture,te=Z&&Z.isDepthTexture?Z.type:null,Y=M(g.stencilBuffer,te),Pe=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ue=Rt(g);Ae(g)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ue,Y,g.width,g.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,ue,Y,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,Y,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Pe,i.RENDERBUFFER,S);}else {let Z=g.textures;for(let te=0;te<Z.length;te++){let Y=Z[te],Pe=s.convert(Y.format,Y.colorSpace),ue=s.convert(Y.type),Re=w(Y.internalFormat,Pe,ue,Y.colorSpace),Ie=Rt(g);k&&Ae(g)===false?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ie,Re,g.width,g.height):Ae(g)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ie,Re,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,Re,g.width,g.height);}}i.bindRenderbuffer(i.RENDERBUFFER,null);}function Ne(S,g){if(g&&g.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,S),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Z=n.get(g.depthTexture);Z.__renderTarget=g,(!Z.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=true),J(g.depthTexture,0);let te=Z.__webglTexture,Y=Rt(g);if(g.depthTexture.format===Ns)Ae(g)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,te,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,te,0);else if(g.depthTexture.format===qs)Ae(g)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,te,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,te,0);else throw new Error("Unknown depthTexture format")}function ct(S){let g=n.get(S),k=S.isWebGLCubeRenderTarget===true;if(g.__boundDepthTexture!==S.depthTexture){let Z=S.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),Z){let te=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,Z.removeEventListener("dispose",te);};Z.addEventListener("dispose",te),g.__depthDisposeCallback=te;}g.__boundDepthTexture=Z;}if(S.depthTexture&&!g.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");let Z=S.texture.mipmaps;Z&&Z.length>0?Ne(g.__webglFramebuffer[0],S):Ne(g.__webglFramebuffer,S);}else if(k){g.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[Z]),g.__webglDepthbuffer[Z]===void 0)g.__webglDepthbuffer[Z]=i.createRenderbuffer(),Ge(g.__webglDepthbuffer[Z],S,false);else {let te=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=g.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,te,i.RENDERBUFFER,Y);}}else {let Z=S.texture.mipmaps;if(Z&&Z.length>0?t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),Ge(g.__webglDepthbuffer,S,false);else {let te=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,te,i.RENDERBUFFER,Y);}}t.bindFramebuffer(i.FRAMEBUFFER,null);}function vn(S,g,k){let Z=n.get(S);g!==void 0&&Me(Z.__webglFramebuffer,S,S.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&ct(S);}function C(S){let g=S.texture,k=n.get(S),Z=n.get(g);S.addEventListener("dispose",D);let te=S.textures,Y=S.isWebGLCubeRenderTarget===true,Pe=te.length>1;if(Pe||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=g.version,o.memory.textures++),Y){k.__webglFramebuffer=[];for(let ue=0;ue<6;ue++)if(g.mipmaps&&g.mipmaps.length>0){k.__webglFramebuffer[ue]=[];for(let Re=0;Re<g.mipmaps.length;Re++)k.__webglFramebuffer[ue][Re]=i.createFramebuffer();}else k.__webglFramebuffer[ue]=i.createFramebuffer();}else {if(g.mipmaps&&g.mipmaps.length>0){k.__webglFramebuffer=[];for(let ue=0;ue<g.mipmaps.length;ue++)k.__webglFramebuffer[ue]=i.createFramebuffer();}else k.__webglFramebuffer=i.createFramebuffer();if(Pe)for(let ue=0,Re=te.length;ue<Re;ue++){let Ie=n.get(te[ue]);Ie.__webglTexture===void 0&&(Ie.__webglTexture=i.createTexture(),o.memory.textures++);}if(S.samples>0&&Ae(S)===false){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let ue=0;ue<te.length;ue++){let Re=te[ue];k.__webglColorRenderbuffer[ue]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[ue]);let Ie=s.convert(Re.format,Re.colorSpace),oe=s.convert(Re.type),ve=w(Re.internalFormat,Ie,oe,Re.colorSpace,S.isXRRenderTarget===true),Ve=Rt(S);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ve,ve,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.RENDERBUFFER,k.__webglColorRenderbuffer[ue]);}i.bindRenderbuffer(i.RENDERBUFFER,null),S.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),Ge(k.__webglDepthRenderbuffer,S,true)),t.bindFramebuffer(i.FRAMEBUFFER,null);}}if(Y){t.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),it(i.TEXTURE_CUBE_MAP,g);for(let ue=0;ue<6;ue++)if(g.mipmaps&&g.mipmaps.length>0)for(let Re=0;Re<g.mipmaps.length;Re++)Me(k.__webglFramebuffer[ue][Re],S,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Re);else Me(k.__webglFramebuffer[ue],S,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0);m(g)&&h(i.TEXTURE_CUBE_MAP),t.unbindTexture();}else if(Pe){for(let ue=0,Re=te.length;ue<Re;ue++){let Ie=te[ue],oe=n.get(Ie),ve=i.TEXTURE_2D;(S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(ve=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ve,oe.__webglTexture),it(ve,Ie),Me(k.__webglFramebuffer,S,Ie,i.COLOR_ATTACHMENT0+ue,ve,0),m(Ie)&&h(ve);}t.unbindTexture();}else {let ue=i.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(ue=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ue,Z.__webglTexture),it(ue,g),g.mipmaps&&g.mipmaps.length>0)for(let Re=0;Re<g.mipmaps.length;Re++)Me(k.__webglFramebuffer[Re],S,g,i.COLOR_ATTACHMENT0,ue,Re);else Me(k.__webglFramebuffer,S,g,i.COLOR_ATTACHMENT0,ue,0);m(g)&&h(ue),t.unbindTexture();}S.depthBuffer&&ct(S);}function At(S){let g=S.textures;for(let k=0,Z=g.length;k<Z;k++){let te=g[k];if(m(te)){let Y=E(S),Pe=n.get(te).__webglTexture;t.bindTexture(Y,Pe),h(Y),t.unbindTexture();}}}let $e=[],ze=[];function Te(S){if(S.samples>0){if(Ae(S)===false){let g=S.textures,k=S.width,Z=S.height,te=i.COLOR_BUFFER_BIT,Y=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Pe=n.get(S),ue=g.length>1;if(ue)for(let Ie=0;Ie<g.length;Ie++)t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ie,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ie,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer);let Re=S.texture.mipmaps;Re&&Re.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer);for(let Ie=0;Ie<g.length;Ie++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(te|=i.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(te|=i.STENCIL_BUFFER_BIT)),ue){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Pe.__webglColorRenderbuffer[Ie]);let oe=n.get(g[Ie]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,oe,0);}i.blitFramebuffer(0,0,k,Z,0,0,k,Z,te,i.NEAREST),l===true&&($e.length=0,ze.length=0,$e.push(i.COLOR_ATTACHMENT0+Ie),S.depthBuffer&&S.resolveDepthBuffer===false&&($e.push(Y),ze.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,ze)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,$e));}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ue)for(let Ie=0;Ie<g.length;Ie++){t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ie,i.RENDERBUFFER,Pe.__webglColorRenderbuffer[Ie]);let oe=n.get(g[Ie]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Pe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ie,i.TEXTURE_2D,oe,0);}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer);}else if(S.depthBuffer&&S.resolveDepthBuffer===false&&l){let g=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g]);}}}function Rt(S){return Math.min(r.maxSamples,S.samples)}function Ae(S){let g=n.get(S);return S.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===true&&g.__useRenderToTexture!==false}function Je(S){let g=o.render.frame;u.get(S)!==g&&(u.set(S,g),S.update());}function an(S,g){let k=S.colorSpace,Z=S.format,te=S.type;return S.isCompressedTexture===true||S.isVideoTexture===true||k!==zr&&k!==qi&&(dt.getTransfer(k)===vt?(Z!==si||te!==gi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),g}function Xt(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(c.width=S.naturalWidth||S.width,c.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(c.width=S.displayWidth,c.height=S.displayHeight):(c.width=S.width,c.height=S.height),c}this.allocateTextureUnit=X,this.resetTextureUnits=U,this.setTexture2D=J,this.setTexture2DArray=j,this.setTexture3D=le,this.setTextureCube=q,this.rebindTextures=vn,this.setupRenderTarget=C,this.updateRenderTargetMipmap=At,this.updateMultisampleRenderTarget=Te,this.setupDepthRenderbuffer=ct,this.setupFrameBufferTexture=Me,this.useMultisampledRTT=Ae;}function gx(i,e){function t(n,r=qi){let s,o=dt.getTransfer(r);if(n===gi)return i.UNSIGNED_BYTE;if(n===Vl)return i.UNSIGNED_SHORT_4_4_4_4;if(n===zl)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Od)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===kd)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Fd)return i.BYTE;if(n===Ld)return i.SHORT;if(n===Gs)return i.UNSIGNED_SHORT;if(n===Bl)return i.INT;if(n===mr)return i.UNSIGNED_INT;if(n===Ai)return i.FLOAT;if(n===Ws)return i.HALF_FLOAT;if(n===Ud)return i.ALPHA;if(n===Bd)return i.RGB;if(n===si)return i.RGBA;if(n===Ns)return i.DEPTH_COMPONENT;if(n===qs)return i.DEPTH_STENCIL;if(n===Vd)return i.RED;if(n===Hl)return i.RED_INTEGER;if(n===zd)return i.RG;if(n===Gl)return i.RG_INTEGER;if(n===Wl)return i.RGBA_INTEGER;if(n===$o||n===jo||n===Zo||n===Ko)if(o===vt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===$o)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===jo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Zo)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ko)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===$o)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===jo)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Zo)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ko)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Xl||n===ql||n===Yl||n===$l)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Xl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ql)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Yl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===$l)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===jl||n===Zl||n===Kl)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===jl||n===Zl)return o===vt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Kl)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Jl||n===Ql||n===ec||n===tc||n===nc||n===ic||n===rc||n===sc||n===oc||n===ac||n===lc||n===cc||n===uc||n===dc)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Jl)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ql)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ec)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===tc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===nc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ic)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===rc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===sc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===oc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ac)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===lc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===cc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===uc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===dc)return o===vt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===hc||n===pc||n===fc)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===hc)return o===vt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===pc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===fc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===mc||n===gc||n===_c||n===vc)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===mc)return s.COMPRESSED_RED_RGTC1_EXT;if(n===gc)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===_c)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===vc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Xs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return {convert:t}}var _x=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,vx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,lh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0;}init(e,t){if(this.texture===null){let n=new zo(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n;}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new mi({vertexShader:_x,fragmentShader:vx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new gt(new Xn(20,20),n);}return this.mesh}reset(){this.texture=null,this.mesh=null;}getDepthTexture(){return this.texture}},ch=class extends Hi{constructor(e,t){super();let n=this,r=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,d=null,p=null,f=null,_=null,y=typeof XRWebGLBinding<"u",m=new lh,h={},E=t.getContextAttributes(),w=null,M=null,A=[],T=[],D=new lt,L=null,x=new dn;x.viewport=new Ut;let b=new dn;b.viewport=new Ut;let I=[x,b],U=new Al,X=null,$=null;this.cameraAutoUpdate=true,this.enabled=false,this.isPresenting=false,this.getController=function(Q){let ie=A[Q];return ie===void 0&&(ie=new Us,A[Q]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function(Q){let ie=A[Q];return ie===void 0&&(ie=new Us,A[Q]=ie),ie.getGripSpace()},this.getHand=function(Q){let ie=A[Q];return ie===void 0&&(ie=new Us,A[Q]=ie),ie.getHandSpace()};function J(Q){let ie=T.indexOf(Q.inputSource);if(ie===-1)return;let Me=A[ie];Me!==void 0&&(Me.update(Q.inputSource,Q.frame,c||o),Me.dispatchEvent({type:Q.type,data:Q.inputSource}));}function j(){r.removeEventListener("select",J),r.removeEventListener("selectstart",J),r.removeEventListener("selectend",J),r.removeEventListener("squeeze",J),r.removeEventListener("squeezestart",J),r.removeEventListener("squeezeend",J),r.removeEventListener("end",j),r.removeEventListener("inputsourceschange",le);for(let Q=0;Q<A.length;Q++){let ie=T[Q];ie!==null&&(T[Q]=null,A[Q].disconnect(ie));}X=null,$=null,m.reset();for(let Q in h)delete h[Q];e.setRenderTarget(w),f=null,p=null,d=null,r=null,M=null,ft.stop(),n.isPresenting=false,e.setPixelRatio(L),e.setSize(D.width,D.height,false),n.dispatchEvent({type:"sessionend"});}this.setFramebufferScaleFactor=function(Q){s=Q,n.isPresenting===true&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.");},this.setReferenceSpaceType=function(Q){a=Q,n.isPresenting===true&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.");},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(Q){c=Q;},this.getBaseLayer=function(){return p!==null?p:f},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(Q){if(r=Q,r!==null){if(w=e.getRenderTarget(),r.addEventListener("select",J),r.addEventListener("selectstart",J),r.addEventListener("selectend",J),r.addEventListener("squeeze",J),r.addEventListener("squeezestart",J),r.addEventListener("squeezeend",J),r.addEventListener("end",j),r.addEventListener("inputsourceschange",le),E.xrCompatible!==true&&await t.makeXRCompatible(),L=e.getPixelRatio(),e.getSize(D),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let Me=null,Ge=null,Ne=null;E.depth&&(Ne=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Me=E.stencil?qs:Ns,Ge=E.stencil?Xs:mr);let ct={colorFormat:t.RGBA8,depthFormat:Ne,scaleFactor:s};d=this.getBinding(),p=d.createProjectionLayer(ct),r.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,false),M=new Ci(p.textureWidth,p.textureHeight,{format:si,type:gi,depthTexture:new Vo(p.textureWidth,p.textureHeight,Ge,void 0,void 0,void 0,void 0,void 0,void 0,Me),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===false,resolveStencilBuffer:p.ignoreDepthValues===false});}else {let Me={antialias:E.antialias,alpha:true,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,Me),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,false),M=new Ci(f.framebufferWidth,f.framebufferHeight,{format:si,type:gi,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:f.ignoreDepthValues===false,resolveStencilBuffer:f.ignoreDepthValues===false});}M.isXRRenderTarget=true,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),ft.setContext(r),ft.start(),n.isPresenting=true,n.dispatchEvent({type:"sessionstart"});}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function le(Q){for(let ie=0;ie<Q.removed.length;ie++){let Me=Q.removed[ie],Ge=T.indexOf(Me);Ge>=0&&(T[Ge]=null,A[Ge].disconnect(Me));}for(let ie=0;ie<Q.added.length;ie++){let Me=Q.added[ie],Ge=T.indexOf(Me);if(Ge===-1){for(let ct=0;ct<A.length;ct++)if(ct>=T.length){T.push(Me),Ge=ct;break}else if(T[ct]===null){T[ct]=Me,Ge=ct;break}if(Ge===-1)break}let Ne=A[Ge];Ne&&Ne.connect(Me);}}let q=new O,fe=new O;function ye(Q,ie,Me){q.setFromMatrixPosition(ie.matrixWorld),fe.setFromMatrixPosition(Me.matrixWorld);let Ge=q.distanceTo(fe),Ne=ie.projectionMatrix.elements,ct=Me.projectionMatrix.elements,vn=Ne[14]/(Ne[10]-1),C=Ne[14]/(Ne[10]+1),At=(Ne[9]+1)/Ne[5],$e=(Ne[9]-1)/Ne[5],ze=(Ne[8]-1)/Ne[0],Te=(ct[8]+1)/ct[0],Rt=vn*ze,Ae=vn*Te,Je=Ge/(-ze+Te),an=Je*-ze;if(ie.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(an),Q.translateZ(Je),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),Ne[10]===-1)Q.projectionMatrix.copy(ie.projectionMatrix),Q.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else {let Xt=vn+Je,S=C+Je,g=Rt-an,k=Ae+(Ge-an),Z=At*C/S*Xt,te=$e*C/S*Xt;Q.projectionMatrix.makePerspective(g,k,Z,te,Xt,S),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert();}}function Fe(Q,ie){ie===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(ie.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert();}this.updateCamera=function(Q){if(r===null)return;let ie=Q.near,Me=Q.far;m.texture!==null&&(m.depthNear>0&&(ie=m.depthNear),m.depthFar>0&&(Me=m.depthFar)),U.near=b.near=x.near=ie,U.far=b.far=x.far=Me,(X!==U.near||$!==U.far)&&(r.updateRenderState({depthNear:U.near,depthFar:U.far}),X=U.near,$=U.far),U.layers.mask=Q.layers.mask|6,x.layers.mask=U.layers.mask&3,b.layers.mask=U.layers.mask&5;let Ge=Q.parent,Ne=U.cameras;Fe(U,Ge);for(let ct=0;ct<Ne.length;ct++)Fe(Ne[ct],Ge);Ne.length===2?ye(U,x,b):U.projectionMatrix.copy(x.projectionMatrix),it(Q,U,Ge);};function it(Q,ie,Me){Me===null?Q.matrix.copy(ie.matrixWorld):(Q.matrix.copy(Me.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(ie.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(true),Q.projectionMatrix.copy(ie.projectionMatrix),Q.projectionMatrixInverse.copy(ie.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=pl*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1);}this.getCamera=function(){return U},this.getFoveation=function(){if(!(p===null&&f===null))return l},this.setFoveation=function(Q){l=Q,p!==null&&(p.fixedFoveation=Q),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Q);},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(U)},this.getCameraTexture=function(Q){return h[Q]};let xt=null;function Tt(Q,ie){if(u=ie.getViewerPose(c||o),_=ie,u!==null){let Me=u.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let Ge=false;Me.length!==U.cameras.length&&(U.cameras.length=0,Ge=true);for(let C=0;C<Me.length;C++){let At=Me[C],$e=null;if(f!==null)$e=f.getViewport(At);else {let Te=d.getViewSubImage(p,At);$e=Te.viewport,C===0&&(e.setRenderTargetTextures(M,Te.colorTexture,Te.depthStencilTexture),e.setRenderTarget(M));}let ze=I[C];ze===void 0&&(ze=new dn,ze.layers.enable(C),ze.viewport=new Ut,I[C]=ze),ze.matrix.fromArray(At.transform.matrix),ze.matrix.decompose(ze.position,ze.quaternion,ze.scale),ze.projectionMatrix.fromArray(At.projectionMatrix),ze.projectionMatrixInverse.copy(ze.projectionMatrix).invert(),ze.viewport.set($e.x,$e.y,$e.width,$e.height),C===0&&(U.matrix.copy(ze.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Ge===true&&U.cameras.push(ze);}let Ne=r.enabledFeatures;if(Ne&&Ne.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&y){d=n.getBinding();let C=d.getDepthInformation(Me[0]);C&&C.isValid&&C.texture&&m.init(C,r.renderState);}if(Ne&&Ne.includes("camera-access")&&y){e.state.unbindTexture(),d=n.getBinding();for(let C=0;C<Me.length;C++){let At=Me[C].camera;if(At){let $e=h[At];$e||($e=new zo,h[At]=$e);let ze=d.getCameraImage(At);$e.sourceTexture=ze;}}}}for(let Me=0;Me<A.length;Me++){let Ge=T[Me],Ne=A[Me];Ge!==null&&Ne!==void 0&&Ne.update(Ge,ie,c||o);}xt&&xt(Q,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),_=null;}let ft=new Tm;ft.setAnimationLoop(Tt),this.setAnimationLoop=function(Q){xt=Q;},this.dispose=function(){};}},Kr=new cr,yx=new Wt;function bx(i,e){function t(m,h){m.matrixAutoUpdate===true&&m.updateMatrix(),h.value.copy(m.matrix);}function n(m,h){h.color.getRGB(m.fogColor.value,qd(i)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density);}function r(m,h,E,w,M){h.isMeshBasicMaterial||h.isMeshLambertMaterial?s(m,h):h.isMeshToonMaterial?(s(m,h),d(m,h)):h.isMeshPhongMaterial?(s(m,h),u(m,h)):h.isMeshStandardMaterial?(s(m,h),p(m,h),h.isMeshPhysicalMaterial&&f(m,h,M)):h.isMeshMatcapMaterial?(s(m,h),_(m,h)):h.isMeshDepthMaterial?s(m,h):h.isMeshDistanceMaterial?(s(m,h),y(m,h)):h.isMeshNormalMaterial?s(m,h):h.isLineBasicMaterial?(o(m,h),h.isLineDashedMaterial&&a(m,h)):h.isPointsMaterial?l(m,h,E,w):h.isSpriteMaterial?c(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=false);}function s(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.bumpMap&&(m.bumpMap.value=h.bumpMap,t(h.bumpMap,m.bumpMapTransform),m.bumpScale.value=h.bumpScale,h.side===Dn&&(m.bumpScale.value*=-1)),h.normalMap&&(m.normalMap.value=h.normalMap,t(h.normalMap,m.normalMapTransform),m.normalScale.value.copy(h.normalScale),h.side===Dn&&m.normalScale.value.negate()),h.displacementMap&&(m.displacementMap.value=h.displacementMap,t(h.displacementMap,m.displacementMapTransform),m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,m.emissiveMapTransform)),h.specularMap&&(m.specularMap.value=h.specularMap,t(h.specularMap,m.specularMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);let E=e.get(h),w=E.envMap,M=E.envMapRotation;w&&(m.envMap.value=w,Kr.copy(M),Kr.x*=-1,Kr.y*=-1,Kr.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===false&&(Kr.y*=-1,Kr.z*=-1),m.envMapRotation.value.setFromMatrix4(yx.makeRotationFromEuler(Kr)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===false?-1:1,m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap&&(m.lightMap.value=h.lightMap,m.lightMapIntensity.value=h.lightMapIntensity,t(h.lightMap,m.lightMapTransform)),h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,m.aoMapTransform));}function o(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform));}function a(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale;}function l(m,h,E,w){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*E,m.scale.value=w*.5,h.map&&(m.map.value=h.map,t(h.map,m.uvTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);}function c(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);}function u(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4);}function d(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap);}function p(m,h){m.metalness.value=h.metalness,h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,m.metalnessMapTransform)),m.roughness.value=h.roughness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,m.roughnessMapTransform)),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity);}function f(m,h,E){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,m.sheenColorMapTransform)),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,m.sheenRoughnessMapTransform))),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,m.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(m.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Dn&&m.clearcoatNormalScale.value.negate())),h.dispersion>0&&(m.dispersion.value=h.dispersion),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,m.iridescenceMapTransform)),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=E.texture,m.transmissionSamplerSize.value.set(E.width,E.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,m.transmissionMapTransform)),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(m.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(m.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,m.specularColorMapTransform)),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,m.specularIntensityMapTransform));}function _(m,h){h.matcap&&(m.matcap.value=h.matcap);}function y(m,h){let E=e.get(h).light;m.referencePosition.value.setFromMatrixPosition(E.matrixWorld),m.nearDistance.value=E.shadow.camera.near,m.farDistance.value=E.shadow.camera.far;}return {refreshFogUniforms:n,refreshMaterialUniforms:r}}function xx(i,e,t,n){let r={},s={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(E,w){let M=w.program;n.uniformBlockBinding(E,M);}function c(E,w){let M=r[E.id];M===void 0&&(_(E),M=u(E),r[E.id]=M,E.addEventListener("dispose",m));let A=w.program;n.updateUBOMapping(E,A);let T=e.render.frame;s[E.id]!==T&&(p(E),s[E.id]=T);}function u(E){let w=d();E.__bindingPointIndex=w;let M=i.createBuffer(),A=E.__size,T=E.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,A,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,M),M}function d(){for(let E=0;E<a;E++)if(o.indexOf(E)===-1)return o.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(E){let w=r[E.id],M=E.uniforms,A=E.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let T=0,D=M.length;T<D;T++){let L=Array.isArray(M[T])?M[T]:[M[T]];for(let x=0,b=L.length;x<b;x++){let I=L[x];if(f(I,T,x,A)===true){let U=I.__offset,X=Array.isArray(I.value)?I.value:[I.value],$=0;for(let J=0;J<X.length;J++){let j=X[J],le=y(j);typeof j=="number"||typeof j=="boolean"?(I.__data[0]=j,i.bufferSubData(i.UNIFORM_BUFFER,U+$,I.__data)):j.isMatrix3?(I.__data[0]=j.elements[0],I.__data[1]=j.elements[1],I.__data[2]=j.elements[2],I.__data[3]=0,I.__data[4]=j.elements[3],I.__data[5]=j.elements[4],I.__data[6]=j.elements[5],I.__data[7]=0,I.__data[8]=j.elements[6],I.__data[9]=j.elements[7],I.__data[10]=j.elements[8],I.__data[11]=0):(j.toArray(I.__data,$),$+=le.storage/Float32Array.BYTES_PER_ELEMENT);}i.bufferSubData(i.UNIFORM_BUFFER,U,I.__data);}}}i.bindBuffer(i.UNIFORM_BUFFER,null);}function f(E,w,M,A){let T=E.value,D=w+"_"+M;if(A[D]===void 0)return typeof T=="number"||typeof T=="boolean"?A[D]=T:A[D]=T.clone(),true;{let L=A[D];if(typeof T=="number"||typeof T=="boolean"){if(L!==T)return A[D]=T,true}else if(L.equals(T)===false)return L.copy(T),true}return  false}function _(E){let w=E.uniforms,M=0,A=16;for(let D=0,L=w.length;D<L;D++){let x=Array.isArray(w[D])?w[D]:[w[D]];for(let b=0,I=x.length;b<I;b++){let U=x[b],X=Array.isArray(U.value)?U.value:[U.value];for(let $=0,J=X.length;$<J;$++){let j=X[$],le=y(j),q=M%A,fe=q%le.boundary,ye=q+fe;M+=fe,ye!==0&&A-ye<le.storage&&(M+=A-ye),U.__data=new Float32Array(le.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=M,M+=le.storage;}}}let T=M%A;return T>0&&(M+=A-T),E.__size=M,E.__cache={},this}function y(E){let w={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(w.boundary=4,w.storage=4):E.isVector2?(w.boundary=8,w.storage=8):E.isVector3||E.isColor?(w.boundary=16,w.storage=12):E.isVector4?(w.boundary=16,w.storage=16):E.isMatrix3?(w.boundary=48,w.storage=48):E.isMatrix4?(w.boundary=64,w.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),w}function m(E){let w=E.target;w.removeEventListener("dispose",m);let M=o.indexOf(w.__bindingPointIndex);o.splice(M,1),i.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id];}function h(){for(let E in r)i.deleteBuffer(r[E]);o=[],r={},s={};}return {bind:l,update:c,dispose:h}}var Zs=class{constructor(e={}){let{canvas:t=em(),context:n=null,depth:r=true,stencil:s=false,alpha:o=false,antialias:a=false,premultipliedAlpha:l=true,preserveDrawingBuffer:c=false,powerPreference:u="default",failIfMajorPerformanceCaveat:d=false,reversedDepthBuffer:p=false}=e;this.isWebGLRenderer=true;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha;}else f=o;let _=new Uint32Array(4),y=new Int32Array(4),m=null,h=null,E=[],w=[];this.domElement=t,this.debug={checkShaderErrors:true,onShaderError:null},this.autoClear=true,this.autoClearColor=true,this.autoClearDepth=true,this.autoClearStencil=true,this.sortObjects=true,this.clippingPlanes=[],this.localClippingEnabled=false,this.toneMapping=Xi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let M=this,A=false;this._outputColorSpace=rn;let T=0,D=0,L=null,x=-1,b=null,I=new Ut,U=new Ut,X=null,$=new et(0),J=0,j=t.width,le=t.height,q=1,fe=null,ye=null,Fe=new Ut(0,0,j,le),it=new Ut(0,0,j,le),xt=false,Tt=new Bs,ft=false,Q=false,ie=new Wt,Me=new O,Ge=new Ut,Ne={background:null,fog:null,environment:null,overrideMaterial:null,isScene:true},ct=false;function vn(){return L===null?q:1}let C=n;function At(v,P){return t.getContext(v,P)}try{let v={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"180"}`),t.addEventListener("webglcontextlost",de,!1),t.addEventListener("webglcontextrestored",xe,!1),t.addEventListener("webglcontextcreationerror",re,!1),C===null){let P="webgl2";if(C=At(P,v),C===null)throw At(P)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw console.error("THREE.WebGLRenderer: "+v.message),v}let $e,ze,Te,Rt,Ae,Je,an,Xt,S,g,k,Z,te,Y,Pe,ue,Re,Ie,oe,ve,Ve,De,me,Ze;function R(){$e=new B0(C),$e.init(),De=new gx(C,$e),ze=new P0(C,$e,e,De),Te=new fx(C,$e),ze.reversedDepthBuffer&&p&&Te.buffers.depth.setReversed(true),Rt=new H0(C),Ae=new tx,Je=new mx(C,$e,Te,Ae,ze,De,Rt),an=new F0(M),Xt=new U0(M),S=new $_(C),me=new I0(C,S),g=new V0(C,S,Rt,me),k=new W0(C,g,S,Rt),oe=new G0(C,ze,Je),ue=new N0(Ae),Z=new ex(M,an,Xt,$e,ze,me,ue),te=new bx(M,Ae),Y=new ix,Pe=new cx($e),Ie=new R0(M,an,Xt,Te,k,f,l),Re=new hx(M,k,ze),Ze=new xx(C,Rt,ze,Te),ve=new D0(C,$e,Rt),Ve=new z0(C,$e,Rt),Rt.programs=Z.programs,M.capabilities=ze,M.extensions=$e,M.properties=Ae,M.renderLists=Y,M.shadowMap=Re,M.state=Te,M.info=Rt;}R();let ae=new ch(M,C);this.xr=ae,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){let v=$e.get("WEBGL_lose_context");v&&v.loseContext();},this.forceContextRestore=function(){let v=$e.get("WEBGL_lose_context");v&&v.restoreContext();},this.getPixelRatio=function(){return q},this.setPixelRatio=function(v){v!==void 0&&(q=v,this.setSize(j,le,false));},this.getSize=function(v){return v.set(j,le)},this.setSize=function(v,P,z=true){if(ae.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}j=v,le=P,t.width=Math.floor(v*q),t.height=Math.floor(P*q),z===true&&(t.style.width=v+"px",t.style.height=P+"px"),this.setViewport(0,0,v,P);},this.getDrawingBufferSize=function(v){return v.set(j*q,le*q).floor()},this.setDrawingBufferSize=function(v,P,z){j=v,le=P,q=z,t.width=Math.floor(v*z),t.height=Math.floor(P*z),this.setViewport(0,0,v,P);},this.getCurrentViewport=function(v){return v.copy(I)},this.getViewport=function(v){return v.copy(Fe)},this.setViewport=function(v,P,z,G){v.isVector4?Fe.set(v.x,v.y,v.z,v.w):Fe.set(v,P,z,G),Te.viewport(I.copy(Fe).multiplyScalar(q).round());},this.getScissor=function(v){return v.copy(it)},this.setScissor=function(v,P,z,G){v.isVector4?it.set(v.x,v.y,v.z,v.w):it.set(v,P,z,G),Te.scissor(U.copy(it).multiplyScalar(q).round());},this.getScissorTest=function(){return xt},this.setScissorTest=function(v){Te.setScissorTest(xt=v);},this.setOpaqueSort=function(v){fe=v;},this.setTransparentSort=function(v){ye=v;},this.getClearColor=function(v){return v.copy(Ie.getClearColor())},this.setClearColor=function(){Ie.setClearColor(...arguments);},this.getClearAlpha=function(){return Ie.getClearAlpha()},this.setClearAlpha=function(){Ie.setClearAlpha(...arguments);},this.clear=function(v=true,P=true,z=true){let G=0;if(v){let F=false;if(L!==null){let se=L.texture.format;F=se===Wl||se===Gl||se===Hl;}if(F){let se=L.texture.type,_e=se===gi||se===mr||se===Gs||se===Xs||se===Vl||se===zl,Se=Ie.getClearColor(),be=Ie.getClearAlpha(),ke=Se.r,He=Se.g,Le=Se.b;_e?(_[0]=ke,_[1]=He,_[2]=Le,_[3]=be,C.clearBufferuiv(C.COLOR,0,_)):(y[0]=ke,y[1]=He,y[2]=Le,y[3]=be,C.clearBufferiv(C.COLOR,0,y));}else G|=C.COLOR_BUFFER_BIT;}P&&(G|=C.DEPTH_BUFFER_BIT),z&&(G|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),C.clear(G);},this.clearColor=function(){this.clear(true,false,false);},this.clearDepth=function(){this.clear(false,true,false);},this.clearStencil=function(){this.clear(false,false,true);},this.dispose=function(){t.removeEventListener("webglcontextlost",de,false),t.removeEventListener("webglcontextrestored",xe,false),t.removeEventListener("webglcontextcreationerror",re,false),Ie.dispose(),Y.dispose(),Pe.dispose(),Ae.dispose(),an.dispose(),Xt.dispose(),k.dispose(),me.dispose(),Ze.dispose(),Z.dispose(),ae.dispose(),ae.removeEventListener("sessionstart",_i),ae.removeEventListener("sessionend",Fh),Cr.stop();};function de(v){v.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),A=true;}function xe(){console.log("THREE.WebGLRenderer: Context Restored."),A=false;let v=Rt.autoReset,P=Re.enabled,z=Re.autoUpdate,G=Re.needsUpdate,F=Re.type;R(),Rt.autoReset=v,Re.enabled=P,Re.autoUpdate=z,Re.needsUpdate=G,Re.type=F;}function re(v){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage);}function ee(v){let P=v.target;P.removeEventListener("dispose",ee),Ee(P);}function Ee(v){qe(v),Ae.remove(v);}function qe(v){let P=Ae.get(v).programs;P!==void 0&&(P.forEach(function(z){Z.releaseProgram(z);}),v.isShaderMaterial&&Z.releaseShaderCache(v));}this.renderBufferDirect=function(v,P,z,G,F,se){P===null&&(P=Ne);let _e=F.isMesh&&F.matrixWorld.determinant()<0,Se=Ig(v,P,z,G,F);Te.setMaterial(G,_e);let be=z.index,ke=1;if(G.wireframe===true){if(be=g.getWireframeAttribute(z),be===void 0)return;ke=2;}let He=z.drawRange,Le=z.attributes.position,rt=He.start*ke,yt=(He.start+He.count)*ke;se!==null&&(rt=Math.max(rt,se.start*ke),yt=Math.min(yt,(se.start+se.count)*ke)),be!==null?(rt=Math.max(rt,0),yt=Math.min(yt,be.count)):Le!=null&&(rt=Math.max(rt,0),yt=Math.min(yt,Le.count));let Bt=yt-rt;if(Bt<0||Bt===1/0)return;me.setup(F,G,Se,z,be);let Ct,bt=ve;if(be!==null&&(Ct=S.get(be),bt=Ve,bt.setIndex(Ct)),F.isMesh)G.wireframe===true?(Te.setLineWidth(G.wireframeLinewidth*vn()),bt.setMode(C.LINES)):bt.setMode(C.TRIANGLES);else if(F.isLine){let Oe=G.linewidth;Oe===void 0&&(Oe=1),Te.setLineWidth(Oe*vn()),F.isLineSegments?bt.setMode(C.LINES):F.isLineLoop?bt.setMode(C.LINE_LOOP):bt.setMode(C.LINE_STRIP);}else F.isPoints?bt.setMode(C.POINTS):F.isSprite&&bt.setMode(C.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)Fs("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),bt.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if($e.get("WEBGL_multi_draw"))bt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else {let Oe=F._multiDrawStarts,Pt=F._multiDrawCounts,ht=F._multiDrawCount,Bn=be?S.get(be).bytesPerElement:1,is=Ae.get(G).currentProgram.getUniforms();for(let Vn=0;Vn<ht;Vn++)is.setValue(C,"_gl_DrawID",Vn),bt.render(Oe[Vn]/Bn,Pt[Vn]);}else if(F.isInstancedMesh)bt.renderInstances(rt,Bt,F.count);else if(z.isInstancedBufferGeometry){let Oe=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,Pt=Math.min(z.instanceCount,Oe);bt.renderInstances(rt,Bt,Pt);}else bt.render(rt,Bt);};function Mt(v,P,z){v.transparent===true&&v.side===ri&&v.forceSinglePass===false?(v.side=Dn,v.needsUpdate=true,ca(v,P,z),v.side=zi,v.needsUpdate=true,ca(v,P,z),v.side=ri):ca(v,P,z);}this.compile=function(v,P,z=null){z===null&&(z=v),h=Pe.get(z),h.init(P),w.push(h),z.traverseVisible(function(F){F.isLight&&F.layers.test(P.layers)&&(h.pushLight(F),F.castShadow&&h.pushShadow(F));}),v!==z&&v.traverseVisible(function(F){F.isLight&&F.layers.test(P.layers)&&(h.pushLight(F),F.castShadow&&h.pushShadow(F));}),h.setupLights();let G=new Set;return v.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let se=F.material;if(se)if(Array.isArray(se))for(let _e=0;_e<se.length;_e++){let Se=se[_e];Mt(Se,z,F),G.add(Se);}else Mt(se,z,F),G.add(se);}),h=w.pop(),G},this.compileAsync=function(v,P,z=null){let G=this.compile(v,P,z);return new Promise(F=>{function se(){if(G.forEach(function(_e){Ae.get(_e).currentProgram.isReady()&&G.delete(_e);}),G.size===0){F(v);return}setTimeout(se,10);}$e.get("KHR_parallel_shader_compile")!==null?se():setTimeout(se,10);})};let mt=null;function Di(v){mt&&mt(v);}function _i(){Cr.stop();}function Fh(){Cr.start();}let Cr=new Tm;Cr.setAnimationLoop(Di),typeof self<"u"&&Cr.setContext(self),this.setAnimationLoop=function(v){mt=v,ae.setAnimationLoop(v),v===null?Cr.stop():Cr.start();},ae.addEventListener("sessionstart",_i),ae.addEventListener("sessionend",Fh),this.render=function(v,P){if(P!==void 0&&P.isCamera!==true){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===true)return;if(v.matrixWorldAutoUpdate===true&&v.updateMatrixWorld(),P.parent===null&&P.matrixWorldAutoUpdate===true&&P.updateMatrixWorld(),ae.enabled===true&&ae.isPresenting===true&&(ae.cameraAutoUpdate===true&&ae.updateCamera(P),P=ae.getCamera()),v.isScene===true&&v.onBeforeRender(M,v,P,L),h=Pe.get(v,w.length),h.init(P),w.push(h),ie.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse),Tt.setFromProjectionMatrix(ie,pi,P.reversedDepth),Q=this.localClippingEnabled,ft=ue.init(this.clippingPlanes,Q),m=Y.get(v,E.length),m.init(),E.push(m),ae.enabled===true&&ae.isPresenting===true){let se=M.xr.getDepthSensingMesh();se!==null&&pu(se,P,-1/0,M.sortObjects);}pu(v,P,0,M.sortObjects),m.finish(),M.sortObjects===true&&m.sort(fe,ye),ct=ae.enabled===false||ae.isPresenting===false||ae.hasDepthSensing()===false,ct&&Ie.addToRenderList(m,v),this.info.render.frame++,ft===true&&ue.beginShadows();let z=h.state.shadowsArray;Re.render(z,v,P),ft===true&&ue.endShadows(),this.info.autoReset===true&&this.info.reset();let G=m.opaque,F=m.transmissive;if(h.setupLights(),P.isArrayCamera){let se=P.cameras;if(F.length>0)for(let _e=0,Se=se.length;_e<Se;_e++){let be=se[_e];Oh(G,F,v,be);}ct&&Ie.render(v);for(let _e=0,Se=se.length;_e<Se;_e++){let be=se[_e];Lh(m,v,be,be.viewport);}}else F.length>0&&Oh(G,F,v,P),ct&&Ie.render(v),Lh(m,v,P);L!==null&&D===0&&(Je.updateMultisampleRenderTarget(L),Je.updateRenderTargetMipmap(L)),v.isScene===true&&v.onAfterRender(M,v,P),me.resetDefaultState(),x=-1,b=null,w.pop(),w.length>0?(h=w[w.length-1],ft===true&&ue.setGlobalState(M.clippingPlanes,h.state.camera)):h=null,E.pop(),E.length>0?m=E[E.length-1]:m=null;};function pu(v,P,z,G){if(v.visible===false)return;if(v.layers.test(P.layers)){if(v.isGroup)z=v.renderOrder;else if(v.isLOD)v.autoUpdate===true&&v.update(P);else if(v.isLight)h.pushLight(v),v.castShadow&&h.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||Tt.intersectsSprite(v)){G&&Ge.setFromMatrixPosition(v.matrixWorld).applyMatrix4(ie);let _e=k.update(v),Se=v.material;Se.visible&&m.push(v,_e,Se,z,Ge.z,null);}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||Tt.intersectsObject(v))){let _e=k.update(v),Se=v.material;if(G&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Ge.copy(v.boundingSphere.center)):(_e.boundingSphere===null&&_e.computeBoundingSphere(),Ge.copy(_e.boundingSphere.center)),Ge.applyMatrix4(v.matrixWorld).applyMatrix4(ie)),Array.isArray(Se)){let be=_e.groups;for(let ke=0,He=be.length;ke<He;ke++){let Le=be[ke],rt=Se[Le.materialIndex];rt&&rt.visible&&m.push(v,_e,rt,z,Ge.z,Le);}}else Se.visible&&m.push(v,_e,Se,z,Ge.z,null);}}let se=v.children;for(let _e=0,Se=se.length;_e<Se;_e++)pu(se[_e],P,z,G);}function Lh(v,P,z,G){let F=v.opaque,se=v.transmissive,_e=v.transparent;h.setupLightsView(z),ft===true&&ue.setGlobalState(M.clippingPlanes,z),G&&Te.viewport(I.copy(G)),F.length>0&&la(F,P,z),se.length>0&&la(se,P,z),_e.length>0&&la(_e,P,z),Te.buffers.depth.setTest(true),Te.buffers.depth.setMask(true),Te.buffers.color.setMask(true),Te.setPolygonOffset(false);}function Oh(v,P,z,G){if((z.isScene===true?z.overrideMaterial:null)!==null)return;h.state.transmissionRenderTarget[G.id]===void 0&&(h.state.transmissionRenderTarget[G.id]=new Ci(1,1,{generateMipmaps:true,type:$e.has("EXT_color_buffer_half_float")||$e.has("EXT_color_buffer_float")?Ws:gi,minFilter:fr,samples:4,stencilBuffer:s,resolveDepthBuffer:false,resolveStencilBuffer:false,colorSpace:dt.workingColorSpace}));let se=h.state.transmissionRenderTarget[G.id],_e=G.viewport||I;se.setSize(_e.z*M.transmissionResolutionScale,_e.w*M.transmissionResolutionScale);let Se=M.getRenderTarget(),be=M.getActiveCubeFace(),ke=M.getActiveMipmapLevel();M.setRenderTarget(se),M.getClearColor($),J=M.getClearAlpha(),J<1&&M.setClearColor(16777215,.5),M.clear(),ct&&Ie.render(z);let He=M.toneMapping;M.toneMapping=Xi;let Le=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),h.setupLightsView(G),ft===true&&ue.setGlobalState(M.clippingPlanes,G),la(v,z,G),Je.updateMultisampleRenderTarget(se),Je.updateRenderTargetMipmap(se),$e.has("WEBGL_multisampled_render_to_texture")===false){let rt=false;for(let yt=0,Bt=P.length;yt<Bt;yt++){let Ct=P[yt],bt=Ct.object,Oe=Ct.geometry,Pt=Ct.material,ht=Ct.group;if(Pt.side===ri&&bt.layers.test(G.layers)){let Bn=Pt.side;Pt.side=Dn,Pt.needsUpdate=true,kh(bt,z,G,Oe,Pt,ht),Pt.side=Bn,Pt.needsUpdate=true,rt=true;}}rt===true&&(Je.updateMultisampleRenderTarget(se),Je.updateRenderTargetMipmap(se));}M.setRenderTarget(Se,be,ke),M.setClearColor($,J),Le!==void 0&&(G.viewport=Le),M.toneMapping=He;}function la(v,P,z){let G=P.isScene===true?P.overrideMaterial:null;for(let F=0,se=v.length;F<se;F++){let _e=v[F],Se=_e.object,be=_e.geometry,ke=_e.group,He=_e.material;He.allowOverride===true&&G!==null&&(He=G),Se.layers.test(z.layers)&&kh(Se,P,z,be,He,ke);}}function kh(v,P,z,G,F,se){v.onBeforeRender(M,P,z,G,F,se),v.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),F.onBeforeRender(M,P,z,G,v,se),F.transparent===true&&F.side===ri&&F.forceSinglePass===false?(F.side=Dn,F.needsUpdate=true,M.renderBufferDirect(z,P,G,F,v,se),F.side=zi,F.needsUpdate=true,M.renderBufferDirect(z,P,G,F,v,se),F.side=ri):M.renderBufferDirect(z,P,G,F,v,se),v.onAfterRender(M,P,z,G,F,se);}function ca(v,P,z){P.isScene!==true&&(P=Ne);let G=Ae.get(v),F=h.state.lights,se=h.state.shadowsArray,_e=F.state.version,Se=Z.getParameters(v,F.state,se,P,z),be=Z.getProgramCacheKey(Se),ke=G.programs;G.environment=v.isMeshStandardMaterial?P.environment:null,G.fog=P.fog,G.envMap=(v.isMeshStandardMaterial?Xt:an).get(v.envMap||G.environment),G.envMapRotation=G.environment!==null&&v.envMap===null?P.environmentRotation:v.envMapRotation,ke===void 0&&(v.addEventListener("dispose",ee),ke=new Map,G.programs=ke);let He=ke.get(be);if(He!==void 0){if(G.currentProgram===He&&G.lightsStateVersion===_e)return Bh(v,Se),He}else Se.uniforms=Z.getUniforms(v),v.onBeforeCompile(Se,M),He=Z.acquireProgram(Se,be),ke.set(be,He),G.uniforms=Se.uniforms;let Le=G.uniforms;return (!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===true)&&(Le.clippingPlanes=ue.uniform),Bh(v,Se),G.needsLights=Pg(v),G.lightsStateVersion=_e,G.needsLights&&(Le.ambientLightColor.value=F.state.ambient,Le.lightProbe.value=F.state.probe,Le.directionalLights.value=F.state.directional,Le.directionalLightShadows.value=F.state.directionalShadow,Le.spotLights.value=F.state.spot,Le.spotLightShadows.value=F.state.spotShadow,Le.rectAreaLights.value=F.state.rectArea,Le.ltc_1.value=F.state.rectAreaLTC1,Le.ltc_2.value=F.state.rectAreaLTC2,Le.pointLights.value=F.state.point,Le.pointLightShadows.value=F.state.pointShadow,Le.hemisphereLights.value=F.state.hemi,Le.directionalShadowMap.value=F.state.directionalShadowMap,Le.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Le.spotShadowMap.value=F.state.spotShadowMap,Le.spotLightMatrix.value=F.state.spotLightMatrix,Le.spotLightMap.value=F.state.spotLightMap,Le.pointShadowMap.value=F.state.pointShadowMap,Le.pointShadowMatrix.value=F.state.pointShadowMatrix),G.currentProgram=He,G.uniformsList=null,He}function Uh(v){if(v.uniformsList===null){let P=v.currentProgram.getUniforms();v.uniformsList=js.seqWithValue(P.seq,v.uniforms);}return v.uniformsList}function Bh(v,P){let z=Ae.get(v);z.outputColorSpace=P.outputColorSpace,z.batching=P.batching,z.batchingColor=P.batchingColor,z.instancing=P.instancing,z.instancingColor=P.instancingColor,z.instancingMorph=P.instancingMorph,z.skinning=P.skinning,z.morphTargets=P.morphTargets,z.morphNormals=P.morphNormals,z.morphColors=P.morphColors,z.morphTargetsCount=P.morphTargetsCount,z.numClippingPlanes=P.numClippingPlanes,z.numIntersection=P.numClipIntersection,z.vertexAlphas=P.vertexAlphas,z.vertexTangents=P.vertexTangents,z.toneMapping=P.toneMapping;}function Ig(v,P,z,G,F){P.isScene!==true&&(P=Ne),Je.resetTextureUnits();let se=P.fog,_e=G.isMeshStandardMaterial?P.environment:null,Se=L===null?M.outputColorSpace:L.isXRRenderTarget===true?L.texture.colorSpace:zr,be=(G.isMeshStandardMaterial?Xt:an).get(G.envMap||_e),ke=G.vertexColors===true&&!!z.attributes.color&&z.attributes.color.itemSize===4,He=!!z.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Le=!!z.morphAttributes.position,rt=!!z.morphAttributes.normal,yt=!!z.morphAttributes.color,Bt=Xi;G.toneMapped&&(L===null||L.isXRRenderTarget===true)&&(Bt=M.toneMapping);let Ct=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,bt=Ct!==void 0?Ct.length:0,Oe=Ae.get(G),Pt=h.state.lights;if(ft===true&&(Q===true||v!==b)){let An=v===b&&G.id===x;ue.setState(G,v,An);}let ht=false;G.version===Oe.__version?(Oe.needsLights&&Oe.lightsStateVersion!==Pt.state.version||Oe.outputColorSpace!==Se||F.isBatchedMesh&&Oe.batching===false||!F.isBatchedMesh&&Oe.batching===true||F.isBatchedMesh&&Oe.batchingColor===true&&F.colorTexture===null||F.isBatchedMesh&&Oe.batchingColor===false&&F.colorTexture!==null||F.isInstancedMesh&&Oe.instancing===false||!F.isInstancedMesh&&Oe.instancing===true||F.isSkinnedMesh&&Oe.skinning===false||!F.isSkinnedMesh&&Oe.skinning===true||F.isInstancedMesh&&Oe.instancingColor===true&&F.instanceColor===null||F.isInstancedMesh&&Oe.instancingColor===false&&F.instanceColor!==null||F.isInstancedMesh&&Oe.instancingMorph===true&&F.morphTexture===null||F.isInstancedMesh&&Oe.instancingMorph===false&&F.morphTexture!==null||Oe.envMap!==be||G.fog===true&&Oe.fog!==se||Oe.numClippingPlanes!==void 0&&(Oe.numClippingPlanes!==ue.numPlanes||Oe.numIntersection!==ue.numIntersection)||Oe.vertexAlphas!==ke||Oe.vertexTangents!==He||Oe.morphTargets!==Le||Oe.morphNormals!==rt||Oe.morphColors!==yt||Oe.toneMapping!==Bt||Oe.morphTargetsCount!==bt)&&(ht=true):(ht=true,Oe.__version=G.version);let Bn=Oe.currentProgram;ht===true&&(Bn=ca(G,P,F));let is=false,Vn=false,ho=false,Nt=Bn.getUniforms(),jn=Oe.uniforms;if(Te.useProgram(Bn.program)&&(is=true,Vn=true,ho=true),G.id!==x&&(x=G.id,Vn=true),is||b!==v){Te.buffers.depth.getReversed()&&v.reversedDepth!==true&&(v._reversedDepth=true,v.updateProjectionMatrix()),Nt.setValue(C,"projectionMatrix",v.projectionMatrix),Nt.setValue(C,"viewMatrix",v.matrixWorldInverse);let Nn=Nt.map.cameraPosition;Nn!==void 0&&Nn.setValue(C,Me.setFromMatrixPosition(v.matrixWorld)),ze.logarithmicDepthBuffer&&Nt.setValue(C,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Nt.setValue(C,"isOrthographic",v.isOrthographicCamera===true),b!==v&&(b=v,Vn=true,ho=true);}if(F.isSkinnedMesh){Nt.setOptional(C,F,"bindMatrix"),Nt.setOptional(C,F,"bindMatrixInverse");let An=F.skeleton;An&&(An.boneTexture===null&&An.computeBoneTexture(),Nt.setValue(C,"boneTexture",An.boneTexture,Je));}F.isBatchedMesh&&(Nt.setOptional(C,F,"batchingTexture"),Nt.setValue(C,"batchingTexture",F._matricesTexture,Je),Nt.setOptional(C,F,"batchingIdTexture"),Nt.setValue(C,"batchingIdTexture",F._indirectTexture,Je),Nt.setOptional(C,F,"batchingColorTexture"),F._colorsTexture!==null&&Nt.setValue(C,"batchingColorTexture",F._colorsTexture,Je));let Zn=z.morphAttributes;if((Zn.position!==void 0||Zn.normal!==void 0||Zn.color!==void 0)&&oe.update(F,z,Bn),(Vn||Oe.receiveShadow!==F.receiveShadow)&&(Oe.receiveShadow=F.receiveShadow,Nt.setValue(C,"receiveShadow",F.receiveShadow)),G.isMeshGouraudMaterial&&G.envMap!==null&&(jn.envMap.value=be,jn.flipEnvMap.value=be.isCubeTexture&&be.isRenderTargetTexture===false?-1:1),G.isMeshStandardMaterial&&G.envMap===null&&P.environment!==null&&(jn.envMapIntensity.value=P.environmentIntensity),Vn&&(Nt.setValue(C,"toneMappingExposure",M.toneMappingExposure),Oe.needsLights&&Dg(jn,ho),se&&G.fog===true&&te.refreshFogUniforms(jn,se),te.refreshMaterialUniforms(jn,G,q,le,h.state.transmissionRenderTarget[v.id]),js.upload(C,Uh(Oe),jn,Je)),G.isShaderMaterial&&G.uniformsNeedUpdate===true&&(js.upload(C,Uh(Oe),jn,Je),G.uniformsNeedUpdate=false),G.isSpriteMaterial&&Nt.setValue(C,"center",F.center),Nt.setValue(C,"modelViewMatrix",F.modelViewMatrix),Nt.setValue(C,"normalMatrix",F.normalMatrix),Nt.setValue(C,"modelMatrix",F.matrixWorld),G.isShaderMaterial||G.isRawShaderMaterial){let An=G.uniformsGroups;for(let Nn=0,fu=An.length;Nn<fu;Nn++){let Er=An[Nn];Ze.update(Er,Bn),Ze.bind(Er,Bn);}}return Bn}function Dg(v,P){v.ambientLightColor.needsUpdate=P,v.lightProbe.needsUpdate=P,v.directionalLights.needsUpdate=P,v.directionalLightShadows.needsUpdate=P,v.pointLights.needsUpdate=P,v.pointLightShadows.needsUpdate=P,v.spotLights.needsUpdate=P,v.spotLightShadows.needsUpdate=P,v.rectAreaLights.needsUpdate=P,v.hemisphereLights.needsUpdate=P;}function Pg(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===true}this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return D},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(v,P,z){let G=Ae.get(v);G.__autoAllocateDepthBuffer=v.resolveDepthBuffer===false,G.__autoAllocateDepthBuffer===false&&(G.__useRenderToTexture=false),Ae.get(v.texture).__webglTexture=P,Ae.get(v.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:z,G.__hasExternalTextures=true;},this.setRenderTargetFramebuffer=function(v,P){let z=Ae.get(v);z.__webglFramebuffer=P,z.__useDefaultFramebuffer=P===void 0;};let Ng=C.createFramebuffer();this.setRenderTarget=function(v,P=0,z=0){L=v,T=P,D=z;let G=true,F=null,se=false,_e=false;if(v){let be=Ae.get(v);if(be.__useDefaultFramebuffer!==void 0)Te.bindFramebuffer(C.FRAMEBUFFER,null),G=false;else if(be.__webglFramebuffer===void 0)Je.setupRenderTarget(v);else if(be.__hasExternalTextures)Je.rebindTextures(v,Ae.get(v.texture).__webglTexture,Ae.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let Le=v.depthTexture;if(be.__boundDepthTexture!==Le){if(Le!==null&&Ae.has(Le)&&(v.width!==Le.image.width||v.height!==Le.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Je.setupDepthRenderbuffer(v);}}let ke=v.texture;(ke.isData3DTexture||ke.isDataArrayTexture||ke.isCompressedArrayTexture)&&(_e=true);let He=Ae.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(He[P])?F=He[P][z]:F=He[P],se=true):v.samples>0&&Je.useMultisampledRTT(v)===false?F=Ae.get(v).__webglMultisampledFramebuffer:Array.isArray(He)?F=He[z]:F=He,I.copy(v.viewport),U.copy(v.scissor),X=v.scissorTest;}else I.copy(Fe).multiplyScalar(q).floor(),U.copy(it).multiplyScalar(q).floor(),X=xt;if(z!==0&&(F=Ng),Te.bindFramebuffer(C.FRAMEBUFFER,F)&&G&&Te.drawBuffers(v,F),Te.viewport(I),Te.scissor(U),Te.setScissorTest(X),se){let be=Ae.get(v.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+P,be.__webglTexture,z);}else if(_e){let be=P;for(let ke=0;ke<v.textures.length;ke++){let He=Ae.get(v.textures[ke]);C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0+ke,He.__webglTexture,z,be);}}else if(v!==null&&z!==0){let be=Ae.get(v.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,be.__webglTexture,z);}x=-1;},this.readRenderTargetPixels=function(v,P,z,G,F,se,_e,Se=0){if(!(v&&v.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let be=Ae.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&_e!==void 0&&(be=be[_e]),be){Te.bindFramebuffer(C.FRAMEBUFFER,be);try{let ke=v.textures[Se],He=ke.format,Le=ke.type;if(!ze.textureFormatReadable(He)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!ze.textureTypeReadable(Le)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}P>=0&&P<=v.width-G&&z>=0&&z<=v.height-F&&(v.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+Se),C.readPixels(P,z,G,F,De.convert(He),De.convert(Le),se));}finally{let ke=L!==null?Ae.get(L).__webglFramebuffer:null;Te.bindFramebuffer(C.FRAMEBUFFER,ke);}}},this.readRenderTargetPixelsAsync=async function(v,P,z,G,F,se,_e,Se=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let be=Ae.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&_e!==void 0&&(be=be[_e]),be)if(P>=0&&P<=v.width-G&&z>=0&&z<=v.height-F){Te.bindFramebuffer(C.FRAMEBUFFER,be);let ke=v.textures[Se],He=ke.format,Le=ke.type;if(!ze.textureFormatReadable(He))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ze.textureTypeReadable(Le))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let rt=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,rt),C.bufferData(C.PIXEL_PACK_BUFFER,se.byteLength,C.STREAM_READ),v.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+Se),C.readPixels(P,z,G,F,De.convert(He),De.convert(Le),0);let yt=L!==null?Ae.get(L).__webglFramebuffer:null;Te.bindFramebuffer(C.FRAMEBUFFER,yt);let Bt=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);return C.flush(),await tm(C,Bt,4),C.bindBuffer(C.PIXEL_PACK_BUFFER,rt),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,se),C.deleteBuffer(rt),C.deleteSync(Bt),se}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,P=null,z=0){let G=Math.pow(2,-z),F=Math.floor(v.image.width*G),se=Math.floor(v.image.height*G),_e=P!==null?P.x:0,Se=P!==null?P.y:0;Je.setTexture2D(v,0),C.copyTexSubImage2D(C.TEXTURE_2D,z,0,0,_e,Se,F,se),Te.unbindTexture();};let Fg=C.createFramebuffer(),Lg=C.createFramebuffer();this.copyTextureToTexture=function(v,P,z=null,G=null,F=0,se=null){se===null&&(F!==0?(Fs("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),se=F,F=0):se=0);let _e,Se,be,ke,He,Le,rt,yt,Bt,Ct=v.isCompressedTexture?v.mipmaps[se]:v.image;if(z!==null)_e=z.max.x-z.min.x,Se=z.max.y-z.min.y,be=z.isBox3?z.max.z-z.min.z:1,ke=z.min.x,He=z.min.y,Le=z.isBox3?z.min.z:0;else {let Zn=Math.pow(2,-F);_e=Math.floor(Ct.width*Zn),Se=Math.floor(Ct.height*Zn),v.isDataArrayTexture?be=Ct.depth:v.isData3DTexture?be=Math.floor(Ct.depth*Zn):be=1,ke=0,He=0,Le=0;}G!==null?(rt=G.x,yt=G.y,Bt=G.z):(rt=0,yt=0,Bt=0);let bt=De.convert(P.format),Oe=De.convert(P.type),Pt;P.isData3DTexture?(Je.setTexture3D(P,0),Pt=C.TEXTURE_3D):P.isDataArrayTexture||P.isCompressedArrayTexture?(Je.setTexture2DArray(P,0),Pt=C.TEXTURE_2D_ARRAY):(Je.setTexture2D(P,0),Pt=C.TEXTURE_2D),C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,P.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,P.unpackAlignment);let ht=C.getParameter(C.UNPACK_ROW_LENGTH),Bn=C.getParameter(C.UNPACK_IMAGE_HEIGHT),is=C.getParameter(C.UNPACK_SKIP_PIXELS),Vn=C.getParameter(C.UNPACK_SKIP_ROWS),ho=C.getParameter(C.UNPACK_SKIP_IMAGES);C.pixelStorei(C.UNPACK_ROW_LENGTH,Ct.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,Ct.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,ke),C.pixelStorei(C.UNPACK_SKIP_ROWS,He),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Le);let Nt=v.isDataArrayTexture||v.isData3DTexture,jn=P.isDataArrayTexture||P.isData3DTexture;if(v.isDepthTexture){let Zn=Ae.get(v),An=Ae.get(P),Nn=Ae.get(Zn.__renderTarget),fu=Ae.get(An.__renderTarget);Te.bindFramebuffer(C.READ_FRAMEBUFFER,Nn.__webglFramebuffer),Te.bindFramebuffer(C.DRAW_FRAMEBUFFER,fu.__webglFramebuffer);for(let Er=0;Er<be;Er++)Nt&&(C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,Ae.get(v).__webglTexture,F,Le+Er),C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,Ae.get(P).__webglTexture,se,Bt+Er)),C.blitFramebuffer(ke,He,_e,Se,rt,yt,_e,Se,C.DEPTH_BUFFER_BIT,C.NEAREST);Te.bindFramebuffer(C.READ_FRAMEBUFFER,null),Te.bindFramebuffer(C.DRAW_FRAMEBUFFER,null);}else if(F!==0||v.isRenderTargetTexture||Ae.has(v)){let Zn=Ae.get(v),An=Ae.get(P);Te.bindFramebuffer(C.READ_FRAMEBUFFER,Fg),Te.bindFramebuffer(C.DRAW_FRAMEBUFFER,Lg);for(let Nn=0;Nn<be;Nn++)Nt?C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,Zn.__webglTexture,F,Le+Nn):C.framebufferTexture2D(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,Zn.__webglTexture,F),jn?C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,An.__webglTexture,se,Bt+Nn):C.framebufferTexture2D(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,An.__webglTexture,se),F!==0?C.blitFramebuffer(ke,He,_e,Se,rt,yt,_e,Se,C.COLOR_BUFFER_BIT,C.NEAREST):jn?C.copyTexSubImage3D(Pt,se,rt,yt,Bt+Nn,ke,He,_e,Se):C.copyTexSubImage2D(Pt,se,rt,yt,ke,He,_e,Se);Te.bindFramebuffer(C.READ_FRAMEBUFFER,null),Te.bindFramebuffer(C.DRAW_FRAMEBUFFER,null);}else jn?v.isDataTexture||v.isData3DTexture?C.texSubImage3D(Pt,se,rt,yt,Bt,_e,Se,be,bt,Oe,Ct.data):P.isCompressedArrayTexture?C.compressedTexSubImage3D(Pt,se,rt,yt,Bt,_e,Se,be,bt,Ct.data):C.texSubImage3D(Pt,se,rt,yt,Bt,_e,Se,be,bt,Oe,Ct):v.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,se,rt,yt,_e,Se,bt,Oe,Ct.data):v.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,se,rt,yt,Ct.width,Ct.height,bt,Ct.data):C.texSubImage2D(C.TEXTURE_2D,se,rt,yt,_e,Se,bt,Oe,Ct);C.pixelStorei(C.UNPACK_ROW_LENGTH,ht),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,Bn),C.pixelStorei(C.UNPACK_SKIP_PIXELS,is),C.pixelStorei(C.UNPACK_SKIP_ROWS,Vn),C.pixelStorei(C.UNPACK_SKIP_IMAGES,ho),se===0&&P.generateMipmaps&&C.generateMipmap(Pt),Te.unbindTexture();},this.initRenderTarget=function(v){Ae.get(v).__webglFramebuffer===void 0&&Je.setupRenderTarget(v);},this.initTexture=function(v){v.isCubeTexture?Je.setTextureCube(v,0):v.isData3DTexture?Je.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?Je.setTexture2DArray(v,0):Je.setTexture2D(v,0),Te.unbindTexture();},this.resetState=function(){T=0,D=0,L=null,Te.reset(),me.reset();},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}));}get coordinateSystem(){return pi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=dt._getDrawingBufferColorSpace(e),t.unpackColorSpace=dt._getUnpackColorSpace();}};function Pm(i,e){let t=new qn({side:ri,roughness:.95,metalness:0}),n={uProgress:{value:0},uCurl:{value:e?0:1},uPageWidth:{value:i},uMapBack:{value:null}};t.onBeforeCompile=s=>{s.uniforms.uProgress=n.uProgress,s.uniforms.uCurl=n.uCurl,s.uniforms.uPageWidth=n.uPageWidth,s.uniforms.uMapBack=n.uMapBack,s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
       uniform float uProgress;
       uniform float uCurl;
       uniform float uPageWidth;
       const float PI_ = 3.14159265359;`),s.vertexShader=s.vertexShader.replace("#include <beginnormal_vertex>",`float _a0 = uProgress * PI_;
       float _bend = uCurl * sin(uProgress * PI_);
       float _u = clamp(position.x, 0.0, uPageWidth);
       float _ang = _a0;
       if (_bend > 0.001) { _ang = _a0 + (_u * _bend / uPageWidth); }
       vec3 objectNormal = vec3(-sin(_ang), 0.0, cos(_ang));`),s.vertexShader=s.vertexShader.replace("#include <begin_vertex>",`vec3 transformed;
       transformed.y = position.y;
       if (_bend > 0.001) {
         float _R = uPageWidth / _bend;
         transformed.x = _R * (sin(_ang) - sin(_a0));
         transformed.z = _R * (cos(_a0) - cos(_ang));
       } else {
         transformed.x = _u * cos(_a0);
         transformed.z = _u * sin(_a0);
       }`),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
       uniform sampler2D uMapBack;`),s.fragmentShader=s.fragmentShader.replace("#include <map_fragment>",`#ifdef USE_MAP
         vec4 _texel = gl_FrontFacing
           ? texture2D( map, vMapUv )
           : texture2D( uMapBack, vec2(1.0 - vMapUv.x, vMapUv.y) );
         diffuseColor *= _texel;
       #endif`);};let r=false;return {material:t,setFront(s){t.map=s,r||(t.needsUpdate=true,r=true);},setBack(s){n.uMapBack.value=s;},setProgress(s){n.uProgress.value=s;},setCurl(s){n.uCurl.value=s;},dispose(){t.dispose();}}}var dh={cover:9063218,coverEdge:7289639,pageBlock:15984591},hn=1,gr=1.4,Nm=.04,wc=.05,Mx=.012;function Fm(){return new qn({roughness:.95,metalness:0})}function hh(i){return new qn({color:i,roughness:.9,metalness:0})}function Lm(i){let e=new Cn,t=new Cn;e.add(t);let n=hn*2+Nm*2,r=gr+Nm*2,s=new gt(new ii(n,r,wc),hh(dh.cover));s.position.set(0,0,-wc/2-.02),s.castShadow=true,s.receiveShadow=true,t.add(s);let o=new gt(new ii(.06,r,wc+.02),hh(dh.coverEdge));o.position.set(0,0,-wc/2-.02),t.add(o);let a=h=>{let E=new gt(new ii(hn,gr,.03),hh(dh.pageBlock));return E.position.set(h*hn/2,0,-0.018),E.receiveShadow=true,E};t.add(a(-1),a(1));let l=Fm(),c=Fm(),u=new Xn(hn,gr);u.translate(-hn/2,0,0);let d=new gt(u,l);d.position.z=0,d.receiveShadow=true,e.add(d);let p=new Xn(hn,gr);p.translate(hn/2,0,0);let f=new gt(p,c);f.position.z=0,f.receiveShadow=true,e.add(f);let _=new Xn(hn,gr,40,1);_.translate(hn/2,0,0);let y=Pm(hn,i),m=new gt(_,y.material);return m.position.z=Mx,m.visible=false,m.castShadow=true,e.add(m),{root:e,frame:t,leftPage:d,rightPage:f,leftMaterial:l,rightMaterial:c,leaf:m,leafCurl:y,dispose(){e.traverse(h=>{let E=h;E.geometry?.dispose();let w=E.material;Array.isArray(w)?w.forEach(M=>M.dispose()):w?.dispose();}),y.dispose();}}}var _n=1024,oi=1536,pn={paper:"#fffbf4",paperEdge:"#f2e7d3",ruled:"#ece0cb",accent:"#e8a33d",accentSoft:"#f4d9a8",heading:"#4a3526",body:"#5a4632"},ea="#9a886f",$i='Georgia, "Times New Roman", serif',Ec='system-ui, -apple-system, "Segoe UI", sans-serif';function ph(i){let e=document.createElement("canvas");e.width=_n,e.height=oi;let t=e.getContext("2d");if(t)switch(Sx(t),i.overlay?"blank":i.kind){case "cover":wx(t,i);break;case "section":Cx(t,i);break;case "index":case "recipe":Ex(t,i);break;}let n=new Bo(e);return n.colorSpace=rn,n.generateMipmaps=false,n.minFilter=Wn,n.needsUpdate=true,n}function Sx(i){i.fillStyle=pn.paper,i.fillRect(0,0,_n,oi);let e=i.createLinearGradient(0,0,_n*.18,0);e.addColorStop(0,pn.paperEdge),e.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=e,i.fillRect(0,0,_n*.18,oi);}function wx(i,e){let t=_n/2;Js(i,_n*.2,oi*.32,_n*.6,pn.accent,6),i.textAlign="center",i.fillStyle=pn.heading,i.font=`bold 96px ${$i}`,Cc(i,e.title??"",t,oi*.46,_n*.78,110,"center"),e.subtitle&&(i.fillStyle=ea,i.font=`italic 44px ${$i}`,i.fillText(e.subtitle,t,oi*.6)),Js(i,_n*.2,oi*.68,_n*.6,pn.accent,6),i.textAlign="left";}function Cx(i,e){let t=_n/2;i.textAlign="center",i.fillStyle=pn.accent,i.font=`bold 64px ${Ec}`,i.fillText((e.subtitle??"").toUpperCase(),t,oi*.42),i.fillStyle=pn.heading,i.font=`bold 88px ${$i}`,Cc(i,e.title??"",t,oi*.52,_n*.78,100,"center"),Js(i,_n*.32,oi*.6,_n*.36,pn.accentSoft,4),i.textAlign="left";}function Ex(i,e){let t=_n*.12,n=_n*.08,r=_n-n,s=oi*.14;i.fillStyle=pn.heading,i.font=`bold 64px ${$i}`,s=Cc(i,e.title??"",t,s,r-t,72,"left"),e.subtitle&&(s+=60,i.fillStyle=ea,i.font=`italic 38px ${$i}`,s=Cc(i,e.subtitle,t,s,r-t,48,"left")),e.chips?.length&&(s+=56,s=Tx(i,e.chips,t,s,r)),s+=36,Js(i,t,s,r-t,pn.accent,4),s+=48,e.columns?.length&&Ax(i,e.columns,e.rows??[],t,s,r),e.footer&&(i.fillStyle=ea,i.font=`italic 34px ${$i}`,i.textAlign="right",i.fillText(e.footer,r,oi*.93),i.textAlign="left");}function Tx(i,e,t,n,r){i.font=`34px ${Ec}`;let s=22,o=56,a=16,l=t,c=n;for(let u of e){let d=i.measureText(u).width+s*2;l+d>r&&(l=t,c+=o+a),Dx(i,l,c,d,o,28),i.fillStyle=pn.accentSoft,i.fill(),i.fillStyle=pn.heading,i.textBaseline="middle",i.fillText(u,l+s,c+o/2+2),i.textBaseline="alphabetic",l+=d+a;}return c+o}function Ax(i,e,t,n,r,s){let a=s-n,l=Rx(e.length,n,s),c=e.length>2?l[1]-n-a*.2:s-n-24;i.fillStyle=ea,i.font=`bold 30px ${Ec}`,i.fillText(e[0]?.toUpperCase()??"",n,r),i.textAlign="right";for(let u=1;u<e.length;u++)i.fillText(e[u].toUpperCase(),l[u],r);i.textAlign="left",r+=20,Js(i,n,r,s-n,pn.ruled,2),r+=64*.55;for(let u of t){i.fillStyle=pn.body,i.font=`40px ${$i}`,i.fillText(Px(i,u.cells[0]??"",c),n,r),i.textAlign="right";for(let d=1;d<e.length;d++){let p=d===e.length-1,f=u.cells[d]??"",_=p?/^S\/\s*(.+)$/.exec(f):null;_?Ix(i,_[1],l[d],r):(i.fillStyle=p?pn.heading:pn.body,i.font=`${p?"bold ":""}40px ${$i}`,i.fillText(f,l[d],r));}i.textAlign="left",r+=64*.4,Js(i,n,r,s-n,pn.ruled,1),r+=64*.6;}return r}function Rx(i,e,t){let n=t-e;if(i<=2)return [e,t];if(i===3)return [e,e+n*.74,t];let r=[e];for(let s=1;s<i;s++)r.push(e+n*s/(i-1));return r}function Ix(i,e,t,n){i.fillStyle=pn.heading,i.font=`bold 40px ${$i}`,i.fillText(e,t,n);let r=i.measureText(e).width;i.fillStyle=ea,i.font=`300 28px ${Ec}`,i.fillText("S/",t-r-12,n);}function Js(i,e,t,n,r,s){i.fillStyle=r,i.fillRect(e,t,n,s);}function Dx(i,e,t,n,r,s){let o=Math.min(s,r/2,n/2);i.beginPath(),i.moveTo(e+o,t),i.arcTo(e+n,t,e+n,t+r,o),i.arcTo(e+n,t+r,e,t+r,o),i.arcTo(e,t+r,e,t,o),i.arcTo(e,t,e+n,t,o),i.closePath();}function Cc(i,e,t,n,r,s,o){let a=e.split(/\s+/),l="",c=n,u=i.textAlign;i.textAlign=o;for(let d of a){let p=l?`${l} ${d}`:d;i.measureText(p).width>r&&l?(i.fillText(l,t,c),l=d,c+=s):l=p;}return l&&i.fillText(l,t,c),i.textAlign=u,c}function Px(i,e,t){if(i.measureText(e).width<=t)return e;let n=e;for(;n.length>1&&i.measureText(`${n}\u2026`).width>t;)n=n.slice(0,-1);return `${n}\u2026`}function Nx(i){return 1-Math.pow(1-i,3)}var Tc=class{constructor(e,t){this.onProgress=e;this.reducedMotion=t;}onProgress;reducedMotion;tween=null;get animating(){return this.tween!==null}hurry(){this.tween&&this.tween.duration-this.tween.elapsed>.16&&(this.tween.duration=this.tween.elapsed+.16);}cancel(){this.tween?.resolve(),this.tween=null;}start(e,t,n=.9){return this.tween?.resolve(),this.tween=null,this.onProgress(e),this.reducedMotion?(this.onProgress(t),Promise.resolve()):new Promise(r=>{this.tween={from:e,to:t,duration:n,elapsed:0,resolve:r};})}update(e){let t=this.tween;if(!t)return;t.elapsed+=e;let n=Nx(Math.min(t.elapsed/t.duration,1));this.onProgress(t.from+(t.to-t.from)*n),t.elapsed>=t.duration&&(this.onProgress(t.to),this.tween=null,t.resolve());}};var Om=32,Fx=.18,Lx=0,Ox=1,kx=700,Ac=.5,Rc=.24,Ic=class{constructor(e,t,n){this.canvas=e;this.reducedMotion=t;this.log=n;let{clientWidth:r,clientHeight:s}=e;this.aspect=s>0?r/s:1,this.widthPx=r,this.log.debug("creando el motor",{w:r,h:s,reducedMotion:t}),this.renderer=new Zs({canvas:e,antialias:true}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setSize(r,s,false),this.renderer.shadowMap.enabled=true,this.renderer.shadowMap.type=zs,this.renderer.outputColorSpace=rn,this.renderer.toneMapping=Hs,this.renderer.toneMappingExposure=1.05,this.scene.background=new et(15721423);let o=new Wr(16774111,15260100,1.15);this.scene.add(o);let a=new Xr(16771010,1.35);a.position.set(2.5,4,3),a.castShadow=true,a.shadow.mapSize.set(1024,1024),a.shadow.camera.near=.5,a.shadow.camera.far=12,a.shadow.bias=-5e-4,this.scene.add(a),this.book=Lm(t),this.scene.add(this.book.root),this.camera=new dn(Om,this.aspect,.1,50),this.turn=new Tc(l=>this.book.leafCurl.setProgress(l),t),this.mode=this.computeMode(),this.book.root.position.x=this.mode==="single"?-hn/2:0,this.frameCamera(),this.requestRender();}canvas;reducedMotion;log;renderer;scene=new Hr;camera;clock=new qr;book;turn;faces=[];lastContentFace=0;textures=new Map;blankTexture=null;leafIndex=0;faceIndex=0;mode="spread";spreadHandler=null;frameId=0;disposed=false;aspect=1;widthPx=1;queue=[];draining=false;setPages(e){let t=[...e];this.lastContentFace=Math.max(0,t.length-1),t.length%2!==0&&t.push({kind:"blank"}),this.clearTextures(),this.queue.length=0,this.faces=t,this.leafIndex=0,this.faceIndex=0,this.mode=this.computeMode(),this.book.root.position.x=this.mode==="single"?-hn/2:0,this.book.frame.visible=this.mode!=="single",this.book.leftPage.visible=this.mode!=="single",this.book.leaf.visible=false,this.book.leafCurl.setProgress(0),this.frameCamera(),this.renderCurrent(),this.emitSpread(),this.requestRender(),this.log.debug("p\xE1ginas cargadas",{caras:t.length,hojas:this.totalLeaves,modo:this.mode});}onSpreadChange(e){this.spreadHandler=e;}get spread(){let e=this.totalLeaves;return this.mode==="single"?{leafIndex:this.leafFromFace(this.faceIndex),totalLeaves:e,canPrev:this.faceIndex>0,canNext:this.faceIndex<this.lastContentFace,left:null,right:this.faceAt(this.faceIndex),single:true}:{leafIndex:this.leafIndex,totalLeaves:e,canPrev:this.leafIndex>0,canNext:this.leafIndex<e,left:this.faceAt(2*this.leafIndex-1),right:this.faceAt(2*this.leafIndex),single:false}}get currentFaceIndex(){return this.mode==="single"?this.faceIndex:2*this.leafIndex}getPageRect(e){if(this.mode==="single"&&e==="left")return null;let t=this.renderer.domElement.getBoundingClientRect();if(t.width===0||t.height===0)return null;let n=e==="left"?this.book.leftPage:this.book.rightPage;this.camera.updateMatrixWorld(),n.updateWorldMatrix(true,false);let[r,s]=e==="left"?[-hn,0]:[0,hn],o=gr/2,a=1/0,l=1/0,c=-1/0,u=-1/0;for(let[d,p]of [[r,-o],[s,-o],[r,o],[s,o]]){let f=new O(d,p,0).applyMatrix4(n.matrixWorld).project(this.camera),_=t.left+(f.x+1)/2*t.width,y=t.top+(1-f.y)/2*t.height;a=Math.min(a,_),c=Math.max(c,_),l=Math.min(l,y),u=Math.max(u,y);}return {x:a,y:l,width:c-a,height:u-l}}next(){this.enqueue(1);}prev(){this.enqueue(-1);}enqueue(e){this.queue.push(e),this.turn.hurry(),this.draining||this.drain().catch(t=>{this.draining=false,this.log.error("el drenado de volteos ha fallado",t,{pendientes:this.queue.length});});}async drain(){for(this.draining=true,this.ensureLoop();this.queue.length>0;){let e=this.queue.shift(),t=this.queue.length>0;this.mode==="single"?await(e===1?this.turnForwardSingle(t):this.turnBackwardSingle(t)):await(e===1?this.turnForward(t):this.turnBackward(t));}this.draining=false;}async turnForward(e){if(this.leafIndex>=this.totalLeaves)return;let t=this.leafIndex;this.book.leafCurl.setFront(this.textureAt(2*t)),this.book.leafCurl.setBack(this.textureAt(2*t+1)),this.setMap(this.book.rightMaterial,this.textureAt(2*t+2)),this.book.leaf.visible=true,await this.turn.start(0,1,e?Rc:Ac),!(this.disposed||this.mode!=="spread")&&(this.setMap(this.book.leftMaterial,this.textureAt(2*t+1)),this.book.leaf.visible=false,this.leafIndex=t+1,this.emitSpread(),this.requestRender());}async turnBackward(e){if(this.leafIndex<=0)return;let t=this.leafIndex;this.book.leafCurl.setFront(this.textureAt(2*t-2)),this.book.leafCurl.setBack(this.textureAt(2*t-1)),this.setMap(this.book.leftMaterial,this.textureAt(2*t-3)),this.book.leaf.visible=true,await this.turn.start(1,0,e?Rc:Ac),!(this.disposed||this.mode!=="spread")&&(this.setMap(this.book.rightMaterial,this.textureAt(2*t-2)),this.book.leaf.visible=false,this.leafIndex=t-1,this.emitSpread(),this.requestRender());}async turnForwardSingle(e){if(this.faceIndex>=this.lastContentFace)return;let t=this.faceIndex;this.setMap(this.book.rightMaterial,this.textureAt(t+1)),this.book.leafCurl.setFront(this.textureAt(t)),this.book.leafCurl.setBack(this.textureAt(t)),this.book.leaf.visible=true,await this.turn.start(0,1,e?Rc:Ac),!(this.disposed||this.mode!=="single")&&(this.book.leaf.visible=false,this.faceIndex=t+1,this.emitSpread(),this.requestRender());}async turnBackwardSingle(e){if(this.faceIndex<=0)return;let t=this.faceIndex;this.book.leafCurl.setFront(this.textureAt(t-1)),this.book.leafCurl.setBack(this.textureAt(t-1)),this.setMap(this.book.rightMaterial,this.textureAt(t)),this.book.leaf.visible=true,await this.turn.start(1,0,e?Rc:Ac),!(this.disposed||this.mode!=="single")&&(this.setMap(this.book.rightMaterial,this.textureAt(t-1)),this.book.leaf.visible=false,this.faceIndex=t-1,this.emitSpread(),this.requestRender());}goToLeaf(e){this.queue.length=0;let t=Math.max(0,Math.min(e,this.totalLeaves));t===this.leafIndex||this.turn.animating||(this.book.leaf.visible=false,this.leafIndex=t,this.renderSpread(),this.emitSpread(),this.requestRender());}jumpToFace(e){if(!this.turn.animating)if(this.mode==="single"){this.queue.length=0;let t=Math.max(0,Math.min(e,this.lastContentFace));if(t===this.faceIndex)return;this.book.leaf.visible=false,this.faceIndex=t,this.renderCurrent(),this.emitSpread(),this.requestRender();}else this.goToLeaf(this.leafFromFace(e));}home(){this.mode==="single"?this.jumpToFace(0):this.goToLeaf(0);}end(){this.mode==="single"?this.jumpToFace(this.lastContentFace):this.goToLeaf(this.totalLeaves);}resize(e,t){if(this.disposed||e===0||t===0)return;this.aspect=e/t,this.widthPx=e,this.renderer.setSize(e,t,false),this.camera.aspect=this.aspect;let n=this.computeMode();n!==this.mode?this.applyMode(n):this.frameCamera(),this.requestRender();}dispose(){this.disposed=true,this.frameId&&(cancelAnimationFrame(this.frameId),this.frameId=0),this.turn.cancel(),this.clearTextures(),this.blankTexture?.dispose(),this.book.dispose(),this.renderer.dispose(),this.log.debug("motor liberado");}get totalLeaves(){return this.faces.length/2}computeMode(){return this.aspect<Ox||this.widthPx<kx?"single":"spread"}leafFromFace(e){let t=e%2===0?e/2:(e+1)/2;return Math.max(0,Math.min(t,this.totalLeaves))}applyMode(e){e!==this.mode&&(this.queue.length=0,this.turn.animating&&this.turn.cancel(),e==="single"?(this.faceIndex=Math.max(0,Math.min(2*this.leafIndex,this.lastContentFace)),this.book.root.position.x=-hn/2):(this.leafIndex=this.leafFromFace(this.faceIndex),this.book.root.position.x=0),this.mode=e,this.book.frame.visible=e!=="single",this.book.leftPage.visible=e!=="single",this.book.leaf.visible=false,this.book.leafCurl.setProgress(0),this.renderCurrent(),this.frameCamera(),this.emitSpread(),this.requestRender());}faceAt(e){return e>=0&&e<this.faces.length?this.faces[e]:null}renderCurrent(){this.mode==="single"?this.setMap(this.book.rightMaterial,this.textureAt(this.faceIndex)):this.renderSpread();}renderSpread(){this.setMap(this.book.leftMaterial,this.textureAt(2*this.leafIndex-1)),this.setMap(this.book.rightMaterial,this.textureAt(2*this.leafIndex));}textureAt(e){let t=this.faceAt(e);if(!t)return this.blankTexture??=ph({kind:"blank"}),this.blankTexture;let n=this.textures.get(e);return n||(n=ph(t),this.textures.set(e,n)),n}setMap(e,t){let n=e.map!==null;e.map=t,n||(e.needsUpdate=true);}emitSpread(){this.spreadHandler?.(this.spread);}clearTextures(){this.textures.forEach(e=>e.dispose()),this.textures.clear(),this.book.leftMaterial.map=null,this.book.rightMaterial.map=null;}frameCamera(){let e=this.mode==="single",t=e?Lx:Fx,n=(e?hn/2:hn)+t,r=gr/2+t,s=0,o=Om*Math.PI/180,a=r/Math.tan(o/2),l=2*Math.atan(Math.tan(o/2)*this.aspect),c=n/Math.tan(l/2),u=Math.max(a,c)*(e?1:1.06);this.camera.position.set(s,.18,u),this.camera.lookAt(s,0,0),this.camera.updateProjectionMatrix();}requestRender(){this.disposed||this.renderer.render(this.scene,this.camera);}ensureLoop(){this.disposed||this.frameId||!this.draining||(this.clock.getDelta(),this.frameId=requestAnimationFrame(this.loop));}loop=()=>{if(this.disposed){this.frameId=0;return}let e=this.clock.getDelta();this.turn.update(e),this.renderer.render(this.scene,this.camera),this.frameId=this.draining||this.turn.animating?requestAnimationFrame(this.loop):0;}};var Gm=(()=>{class i{_renderer;_elementRef;onChange=t=>{};onTouched=()=>{};constructor(t,n){this._renderer=t,this._elementRef=n;}setProperty(t,n){this._renderer.setProperty(this._elementRef.nativeElement,t,n);}registerOnTouched(t){this.onTouched=t;}registerOnChange(t){this.onChange=t;}setDisabledState(t){this.setProperty("disabled",t);}static \u0275fac=function(n){return new(n||i)(Fe($s$1),Fe(zt))};static \u0275dir=Mn({type:i})}return i})(),Ux=(()=>{class i extends Gm{static \u0275fac=(()=>{let t;return function(r){return (t||(t=Os$1(i)))(r||i)}})();static \u0275dir=Mn({type:i,features:[xg$1]})}return i})(),$n=new D("");var Bx={provide:$n,useExisting:Fi(()=>Wm),multi:true};function Vx(){let i=wt()?wt().getUserAgent():"";return /android (\d+)/.test(i.toLowerCase())}var zx=new D(""),Wm=(()=>{class i extends Gm{_compositionMode;_composing=false;constructor(t,n,r){super(t,n),this._compositionMode=r,this._compositionMode==null&&(this._compositionMode=!Vx());}writeValue(t){let n=t??"";this.setProperty("value",n);}_handleInput(t){(!this._compositionMode||this._compositionMode&&!this._composing)&&this.onChange(t);}_compositionStart(){this._composing=true;}_compositionEnd(t){this._composing=false,this._compositionMode&&this.onChange(t);}static \u0275fac=function(n){return new(n||i)(Fe($s$1),Fe(zt),Fe(zx,8))};static \u0275dir=Mn({type:i,selectors:[["input","formControlName","",3,"type","checkbox",3,"ngNoCva",""],["textarea","formControlName","",3,"ngNoCva",""],["input","formControl","",3,"type","checkbox",3,"ngNoCva",""],["textarea","formControl","",3,"ngNoCva",""],["input","ngModel","",3,"type","checkbox",3,"ngNoCva",""],["textarea","ngModel","",3,"ngNoCva",""],["","ngDefaultControl",""]],hostBindings:function(n,r){n&1&&Ys$1("input",function(o){return r._handleInput(o.target.value)})("blur",function(){return r.onTouched()})("compositionstart",function(){return r._compositionStart()})("compositionend",function(o){return r._compositionEnd(o.target.value)});},standalone:false,features:[Aw$1([Bx]),xg$1]})}return i})();function bh(i){return i==null||xh(i)===0}function xh(i){return i==null?null:Array.isArray(i)||typeof i=="string"?i.length:i instanceof Set?i.size:null}var zc=new D(""),Mh=new D(""),Hx=/^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,fh=class{static min(e){return Gx(e)}static max(e){return Wx(e)}static required(e){return Xm(e)}static requiredTrue(e){return Xx(e)}static email(e){return qx(e)}static minLength(e){return Yx(e)}static maxLength(e){return $x(e)}static pattern(e){return jx(e)}static nullValidator(e){return Pc()}static compose(e){return Km(e)}static composeAsync(e){return Qm(e)}};function Gx(i){return e=>{if(e.value==null||i==null)return null;let t=parseFloat(e.value);return !isNaN(t)&&t<i?{min:{min:i,actual:e.value}}:null}}function Wx(i){return e=>{if(e.value==null||i==null)return null;let t=parseFloat(e.value);return !isNaN(t)&&t>i?{max:{max:i,actual:e.value}}:null}}function Xm(i){return bh(i.value)?{required:true}:null}function Xx(i){return i.value===true?null:{required:true}}function qx(i){return bh(i.value)||Hx.test(i.value)?null:{email:true}}function Yx(i){return e=>{let t=e.value?.length??xh(e.value);return t===null||t===0?null:t<i?{minlength:{requiredLength:i,actualLength:t}}:null}}function $x(i){return e=>{let t=e.value?.length??xh(e.value);return t!==null&&t>i?{maxlength:{requiredLength:i,actualLength:t}}:null}}function jx(i){if(!i)return Pc;let e,t;return typeof i=="string"?(t="",i.charAt(0)!=="^"&&(t+="^"),t+=i,i.charAt(i.length-1)!=="$"&&(t+="$"),e=new RegExp(t)):(t=i.toString(),e=i),n=>{if(bh(n.value))return null;let r=n.value;return e.test(r)?null:{pattern:{requiredPattern:t,actualValue:r}}}}function Pc(i){return null}function qm(i){return i!=null}function Ym(i){return mr$1(i)?K(i):i}function $m(i){let e={};return i.forEach(t=>{e=t!=null?m$1(m$1({},e),t):e;}),Object.keys(e).length===0?null:e}function jm(i,e){return e.map(t=>t(i))}function Zx(i){return !i.validate}function Zm(i){return i.map(e=>Zx(e)?e:t=>e.validate(t))}function Km(i){if(!i)return null;let e=i.filter(qm);return e.length==0?null:function(t){return $m(jm(t,e))}}function Jm(i){return i!=null?Km(Zm(i)):null}function Qm(i){if(!i)return null;let e=i.filter(qm);return e.length==0?null:function(t){let n=jm(t,e).map(Ym);return hy$1(n).pipe(z($m))}}function eg(i){return i!=null?Qm(Zm(i)):null}function km(i,e){return i===null?[e]:Array.isArray(i)?[...i,e]:[i,e]}function tg(i){return i._rawValidators}function ng(i){return i._rawAsyncValidators}function mh(i){return i?Array.isArray(i)?i:[i]:[]}function Nc(i,e){return Array.isArray(i)?i.includes(e):i===e}function Um(i,e){let t=mh(e);return mh(i).forEach(r=>{Nc(t,r)||t.push(r);}),t}function Bm(i,e){return mh(e).filter(t=>!Nc(i,t))}var Fc=class{get value(){return this.control?this.control.value:null}get valid(){return this.control?this.control.valid:null}get invalid(){return this.control?this.control.invalid:null}get pending(){return this.control?this.control.pending:null}get disabled(){return this.control?this.control.disabled:null}get enabled(){return this.control?this.control.enabled:null}get errors(){return this.control?this.control.errors:null}get pristine(){return this.control?this.control.pristine:null}get dirty(){return this.control?this.control.dirty:null}get touched(){return this.control?this.control.touched:null}get status(){return this.control?this.control.status:null}get untouched(){return this.control?this.control.untouched:null}get statusChanges(){return this.control?this.control.statusChanges:null}get valueChanges(){return this.control?this.control.valueChanges:null}get path(){return null}_composedValidatorFn;_composedAsyncValidatorFn;_rawValidators=[];_rawAsyncValidators=[];_setValidators(e){this._rawValidators=e||[],this._composedValidatorFn=Jm(this._rawValidators);}_setAsyncValidators(e){this._rawAsyncValidators=e||[],this._composedAsyncValidatorFn=eg(this._rawAsyncValidators);}get validator(){return this._composedValidatorFn||null}get asyncValidator(){return this._composedAsyncValidatorFn||null}_onDestroyCallbacks=[];_registerOnDestroy(e){this._onDestroyCallbacks.push(e);}_invokeOnDestroyCallbacks(){this._onDestroyCallbacks.forEach(e=>e()),this._onDestroyCallbacks=[];}reset(e=void 0){this.control?.reset(e);}hasError(e,t){return this.control?this.control.hasError(e,t):false}getError(e,t){return this.control?this.control.getError(e,t):null}},no=class extends Fc{name;get formDirective(){return null}get path(){return null}};var ta="VALID",Dc="INVALID",Qs="PENDING",na="DISABLED",_r=class{},Lc=class extends _r{value;source;constructor(e,t){super(),this.value=e,this.source=t;}},ia=class extends _r{pristine;source;constructor(e,t){super(),this.pristine=e,this.source=t;}},ra=class extends _r{touched;source;constructor(e,t){super(),this.touched=e,this.source=t;}},eo=class extends _r{status;source;constructor(e,t){super(),this.status=e,this.source=t;}},gh=class extends _r{source;constructor(e){super(),this.source=e;}},es=class extends _r{source;constructor(e){super(),this.source=e;}};function Sh(i){return (Hc(i)?i.validators:i)||null}function Kx(i){return Array.isArray(i)?Jm(i):i||null}function wh(i,e){return (Hc(e)?e.asyncValidators:i)||null}function Jx(i){return Array.isArray(i)?eg(i):i||null}function Hc(i){return i!=null&&!Array.isArray(i)&&typeof i=="object"}function ig(i,e,t){let n=i.controls;if(!(e?Object.keys(n):n).length)throw new v$1(1e3,"");if(!sg(n,t))throw new v$1(1001,"")}function rg(i,e,t){i._forEachChild((n,r)=>{if(t[r]===void 0)throw new v$1(-1002,"")});}var io=class{_pendingDirty=false;_hasOwnPendingAsyncValidator=null;_pendingTouched=false;_onCollectionChange=()=>{};_updateOn;_hasRequired=q(false);_parent=null;_asyncValidationSubscription;_composedValidatorFn;_composedAsyncValidatorFn;_rawValidators;_rawAsyncValidators;value;constructor(e,t){this._assignValidators(e),this._assignAsyncValidators(t);}get validator(){return this._composedValidatorFn}set validator(e){this._rawValidators=this._composedValidatorFn=e,this._updateHasRequiredValidator();}get asyncValidator(){return this._composedAsyncValidatorFn}set asyncValidator(e){this._rawAsyncValidators=this._composedAsyncValidatorFn=e;}get parent(){return this._parent}get status(){return Y(this.statusReactive)}set status(e){Y(()=>this.statusReactive.set(e));}_status=It(()=>this.statusReactive());statusReactive=q(void 0);get valid(){return this.status===ta}get invalid(){return this.status===Dc}get pending(){return this.status===Qs}get disabled(){return this.status===na}get enabled(){return this.status!==na}errors;get pristine(){return Y(this.pristineReactive)}set pristine(e){Y(()=>this.pristineReactive.set(e));}_pristine=It(()=>this.pristineReactive());pristineReactive=q(true);get dirty(){return !this.pristine}get touched(){return Y(this.touchedReactive)}set touched(e){Y(()=>this.touchedReactive.set(e));}_touched=It(()=>this.touchedReactive());touchedReactive=q(false);get untouched(){return !this.touched}_events=new re;events=this._events.asObservable();valueChanges;statusChanges;get updateOn(){return this._updateOn?this._updateOn:this.parent?this.parent.updateOn:"change"}setValidators(e){this._assignValidators(e);}setAsyncValidators(e){this._assignAsyncValidators(e);}addValidators(e){this.setValidators(Um(e,this._rawValidators));}addAsyncValidators(e){this.setAsyncValidators(Um(e,this._rawAsyncValidators));}removeValidators(e){this.setValidators(Bm(e,this._rawValidators));}removeAsyncValidators(e){this.setAsyncValidators(Bm(e,this._rawAsyncValidators));}hasValidator(e){return Nc(this._rawValidators,e)}hasAsyncValidator(e){return Nc(this._rawAsyncValidators,e)}clearValidators(){this.validator=null;}clearAsyncValidators(){this.asyncValidator=null;}markAsTouched(e={}){let t=this.touched===false;this.touched=true;let n=e.sourceControl??this;e.onlySelf||this._parent?.markAsTouched(k(m$1({},e),{sourceControl:n})),t&&e.emitEvent!==false&&this._events.next(new ra(true,n));}markAllAsDirty(e={}){this.markAsDirty({onlySelf:true,emitEvent:e.emitEvent,sourceControl:this}),this._forEachChild(t=>t.markAllAsDirty(e));}markAllAsTouched(e={}){this.markAsTouched({onlySelf:true,emitEvent:e.emitEvent,sourceControl:this}),this._forEachChild(t=>t.markAllAsTouched(e));}markAsUntouched(e={}){let t=this.touched===true;this.touched=false,this._pendingTouched=false;let n=e.sourceControl??this;this._forEachChild(r=>{r.markAsUntouched({onlySelf:true,emitEvent:e.emitEvent,sourceControl:n});}),e.onlySelf||this._parent?._updateTouched(e,n),t&&e.emitEvent!==false&&this._events.next(new ra(false,n));}markAsDirty(e={}){let t=this.pristine===true;this.pristine=false;let n=e.sourceControl??this;e.onlySelf||this._parent?.markAsDirty(k(m$1({},e),{sourceControl:n})),t&&e.emitEvent!==false&&this._events.next(new ia(false,n));}markAsPristine(e={}){let t=this.pristine===false;this.pristine=true,this._pendingDirty=false;let n=e.sourceControl??this;this._forEachChild(r=>{r.markAsPristine({onlySelf:true,emitEvent:e.emitEvent});}),e.onlySelf||this._parent?._updatePristine(e,n),t&&e.emitEvent!==false&&this._events.next(new ia(true,n));}markAsPending(e={}){this.status=Qs;let t=e.sourceControl??this;e.emitEvent!==false&&(this._events.next(new eo(this.status,t)),this.statusChanges.emit(this.status)),e.onlySelf||this._parent?.markAsPending(k(m$1({},e),{sourceControl:t}));}disable(e={}){let t=this._parentMarkedDirty(e.onlySelf);this.status=na,this.errors=null,this._forEachChild(r=>{r.disable(k(m$1({},e),{onlySelf:true}));}),this._updateValue();let n=e.sourceControl??this;e.emitEvent!==false&&(this._events.next(new Lc(this.value,n)),this._events.next(new eo(this.status,n)),this.valueChanges.emit(this.value),this.statusChanges.emit(this.status)),this._updateAncestors(k(m$1({},e),{skipPristineCheck:t}),this),this._onDisabledChange.forEach(r=>r(true));}enable(e={}){let t=this._parentMarkedDirty(e.onlySelf);this.status=ta,this._forEachChild(n=>{n.enable(k(m$1({},e),{onlySelf:true}));}),this.updateValueAndValidity({onlySelf:true,emitEvent:e.emitEvent}),this._updateAncestors(k(m$1({},e),{skipPristineCheck:t}),this),this._onDisabledChange.forEach(n=>n(false));}_updateAncestors(e,t){e.onlySelf||(this._parent?.updateValueAndValidity(e),e.skipPristineCheck||this._parent?._updatePristine({},t),this._parent?._updateTouched({},t));}setParent(e){this._parent=e;}getRawValue(){return this.value}updateValueAndValidity(e={}){if(this._setInitialStatus(),this._updateValue(),this.enabled){let n=this._cancelExistingSubscription();this.errors=this._runValidator(),this.status=this._calculateStatus(),(this.status===ta||this.status===Qs)&&this._runAsyncValidator(n,e.emitEvent);}let t=e.sourceControl??this;e.emitEvent!==false&&(this._events.next(new Lc(this.value,t)),this._events.next(new eo(this.status,t)),this.valueChanges.emit(this.value),this.statusChanges.emit(this.status)),e.onlySelf||this._parent?.updateValueAndValidity(k(m$1({},e),{sourceControl:t}));}_updateTreeValidity(e={emitEvent:true}){this._forEachChild(t=>t._updateTreeValidity(e)),this.updateValueAndValidity({onlySelf:true,emitEvent:e.emitEvent});}_setInitialStatus(){this.status=this._allControlsDisabled()?na:ta;}_runValidator(){return this.validator?this.validator(this):null}_runAsyncValidator(e,t){if(this.asyncValidator){this.status=Qs,this._hasOwnPendingAsyncValidator={emitEvent:t!==false,shouldHaveEmitted:e!==false};let n=Ym(this.asyncValidator(this));this._asyncValidationSubscription=n.subscribe(r=>{this._hasOwnPendingAsyncValidator=null,this.setErrors(r,{emitEvent:t,shouldHaveEmitted:e});});}}_cancelExistingSubscription(){if(this._asyncValidationSubscription){this._asyncValidationSubscription.unsubscribe();let e=(this._hasOwnPendingAsyncValidator?.emitEvent||this._hasOwnPendingAsyncValidator?.shouldHaveEmitted)??false;return this._hasOwnPendingAsyncValidator=null,e}return  false}setErrors(e,t={}){this.errors=e,this._updateControlsErrors(t.emitEvent!==false,this,t.shouldHaveEmitted);}get(e){let t=e;return t==null||(Array.isArray(t)||(t=t.split(".")),t.length===0)?null:t.reduce((n,r)=>n&&n._find(r),this)}getError(e,t){let n=t?this.get(t):this;return n?.errors?n.errors[e]:null}hasError(e,t){return !!this.getError(e,t)}get root(){let e=this;for(;e._parent;)e=e._parent;return e}_updateControlsErrors(e,t,n){this.status=this._calculateStatus(),e&&this.statusChanges.emit(this.status),(e||n)&&this._events.next(new eo(this.status,t)),this._parent&&this._parent._updateControlsErrors(e,t,n);}_initObservables(){this.valueChanges=new pe$1,this.statusChanges=new pe$1;}_calculateStatus(){return this._allControlsDisabled()?na:this.errors?Dc:this._hasOwnPendingAsyncValidator||this._anyControlsHaveStatus(Qs)?Qs:this._anyControlsHaveStatus(Dc)?Dc:ta}_anyControlsHaveStatus(e){return this._anyControls(t=>t.status===e)}_anyControlsDirty(){return this._anyControls(e=>e.dirty)}_anyControlsTouched(){return this._anyControls(e=>e.touched)}_updatePristine(e,t){let n=!this._anyControlsDirty(),r=this.pristine!==n;this.pristine=n,e.onlySelf||this._parent?._updatePristine(e,t),r&&this._events.next(new ia(this.pristine,t));}_updateTouched(e={},t){this.touched=this._anyControlsTouched(),this._events.next(new ra(this.touched,t)),e.onlySelf||this._parent?._updateTouched(e,t);}_onDisabledChange=[];_registerOnCollectionChange(e){this._onCollectionChange=e;}_setUpdateStrategy(e){Hc(e)&&e.updateOn!=null&&(this._updateOn=e.updateOn);}_parentMarkedDirty(e){return !e&&!!this._parent?.dirty&&!this._parent._anyControlsDirty()}_find(e){return null}_assignValidators(e){this._rawValidators=Array.isArray(e)?e.slice():e,this._composedValidatorFn=Kx(this._rawValidators),this._updateHasRequiredValidator();}_assignAsyncValidators(e){this._rawAsyncValidators=Array.isArray(e)?e.slice():e,this._composedAsyncValidatorFn=Jx(this._rawAsyncValidators);}_updateHasRequiredValidator(){Y(()=>this._hasRequired.set(this.hasValidator(fh.required)));}};function sg(i,e){return Object.hasOwn(i,e)}function Qx(i){return i.tagName==="INPUT"||i.tagName==="SELECT"||i.tagName==="TEXTAREA"}function eM(i,e,t,n){switch(t){case "name":i.setAttribute(e,t,n);break;case "disabled":case "readonly":case "required":n?i.setAttribute(e,t,""):i.removeAttribute(e,t);break;case "max":case "min":case "minLength":case "maxLength":n!==void 0?i.setAttribute(e,t,n.toString()):i.removeAttribute(e,t);break}}var _h=class{kind;context;control;message;constructor({kind:e,context:t,control:n}){this.kind=e,this.context=t,this.control=n;}};var tM=(()=>{class i{_validator=Pc;_onChange;_enabled;ngOnChanges(t){if(this.inputName in t){let n=this.normalizeInput(t[this.inputName].currentValue);this._enabled=this.enabled(n),this._validator=this._enabled?this.createValidator(n):Pc,this._onChange?.();}}validate(t){return this._validator(t)}registerOnValidatorChange(t){this._onChange=t;}enabled(t){return t!=null}static \u0275fac=function(n){return new(n||i)};static \u0275dir=Mn({type:i,features:[Tn$1]})}return i})();var nM={provide:zc,useExisting:Fi(()=>og),multi:true};var og=(()=>{class i extends tM{required;inputName="required";normalizeInput=ta$1;createValidator=t=>Xm;enabled(t){return t}static \u0275fac=(()=>{let t;return function(r){return (t||(t=Os$1(i)))(r||i)}})();static \u0275dir=Mn({type:i,selectors:[["","required","","formControlName","",3,"type","checkbox"],["","required","","formControl","",3,"type","checkbox"],["","required","","ngModel","",3,"type","checkbox"]],hostVars:1,hostBindings:function(n,r){n&2&&Nn("required",r._enabled?"":null);},inputs:{required:"required"},standalone:false,features:[Aw$1([nM]),xg$1]})}return i})();var iM=new D(""),Ch=new D("",{factory:()=>Eh}),Eh="always";function rM(i,e){return [...e.path,i]}function ag(i,e,t=Eh){Th(i,e),e.valueAccessor.writeValue(i.value),(i.disabled||t==="always")&&e.valueAccessor.setDisabledState?.(i.disabled),oM(i,e),lM(i,e),aM(i,e),sM(i,e);}function Oc(i,e,t=true){let n=()=>{};e?.valueAccessor?.registerOnChange(n),e?.valueAccessor?.registerOnTouched(n),Uc(i,e),i&&(e._invokeOnDestroyCallbacks(),i._registerOnCollectionChange(()=>{}));}function kc(i,e){i.forEach(t=>{t.registerOnValidatorChange&&t.registerOnValidatorChange(e);});}function sM(i,e){if(e.valueAccessor.setDisabledState){let t=n=>{e.valueAccessor.setDisabledState(n);};i.registerOnDisabledChange(t),e._registerOnDestroy(()=>{i._unregisterOnDisabledChange(t);});}}function Th(i,e){let t=tg(i);e.validator!==null?i.setValidators(km(t,e.validator)):typeof t=="function"&&i.setValidators([t]);let n=ng(i);e.asyncValidator!==null?i.setAsyncValidators(km(n,e.asyncValidator)):typeof n=="function"&&i.setAsyncValidators([n]);let r=()=>i.updateValueAndValidity();kc(e._rawValidators,r),kc(e._rawAsyncValidators,r);}function Uc(i,e){let t=false;if(i!==null){if(e.validator!==null){let r=tg(i);if(Array.isArray(r)&&r.length>0){let s=r.filter(o=>o!==e.validator);s.length!==r.length&&(t=true,i.setValidators(s));}}if(e.asyncValidator!==null){let r=ng(i);if(Array.isArray(r)&&r.length>0){let s=r.filter(o=>o!==e.asyncValidator);s.length!==r.length&&(t=true,i.setAsyncValidators(s));}}}let n=()=>{};return kc(e._rawValidators,n),kc(e._rawAsyncValidators,n),t}function oM(i,e){e.valueAccessor.registerOnChange(t=>{i._pendingValue=t,i._pendingChange=true,i._pendingDirty=true,i.updateOn==="change"&&lg(i,e);});}function aM(i,e){e.valueAccessor.registerOnTouched(()=>{i._pendingTouched=true,i.updateOn==="blur"&&i._pendingChange&&lg(i,e),i.updateOn!=="submit"&&i.markAsTouched();});}function lg(i,e){i._pendingDirty&&i.markAsDirty(),i.setValue(i._pendingValue,{emitModelToViewChange:false}),e.viewToModelUpdate(i._pendingValue),i._pendingChange=false;}function lM(i,e){let t=(n,r)=>{e.valueAccessor.writeValue(n),r&&e.viewToModelUpdate(n);};i.registerOnChange(t),e._registerOnDestroy(()=>{i._unregisterOnChange(t);});}function cM(i,e){Th(i,e);}function uM(i,e){return Uc(i,e)}function cg(i,e){if(!i.hasOwnProperty("model"))return  false;let t=i.model;return t.isFirstChange()?true:!Object.is(e,t.currentValue)}function dM(i){return Object.getPrototypeOf(i.constructor)===Ux}function hM(i,e){i._syncPendingControls(),e.forEach(t=>{let n=t.control;n.updateOn==="submit"&&n._pendingChange&&(t.viewToModelUpdate(n._pendingValue),n._pendingChange=false);});}function pM(i,e){if(!e)return null;let t,n,r;return e.forEach(s=>{s.constructor===Wm?t=s:dM(s)?n=s:r=s;}),r||n||t||null}function fM(i,e){let t=i.indexOf(e);t>-1&&i.splice(t,1);}var ug={provide:iM,useFactory:()=>{let i=g(vr,{self:true});return {setParseErrors:e=>{i.setParseErrorSource(e);},set onReset(e){i.onReset=e;}}}},vr=class extends Fc{_parent=null;name=null;valueAccessor=null;isCustomControlBased=false;userOnReset;resetSubscription;set onReset(e){this.userOnReset=e,this.resetSubscription?.unsubscribe(),this.resetSubscription=void 0,this.control&&(this.resetSubscription=this.control.events.subscribe(t=>{t instanceof es&&this.control&&this.userOnReset?.(this.control.value);}),this.subscription?.add(this.resetSubscription));}isNativeFormElement=false;rawValueAccessors;_selectedValueAccessor=null;get selectedValueAccessor(){return this._selectedValueAccessor??=pM(this,this.rawValueAccessors)}parseErrorsValidator=null;renderer;injector;requiredValidatorViaDi;subscription;customControlBindings=null;constructor(e,t,n){super(),this.injector=e,this.renderer=t,this.rawValueAccessors=n,this.injector?.get(we)?.onDestroy(()=>{this.removeParseErrorsValidator(this.control),this.subscription?.unsubscribe();});}setupCustomControl(){this.subscription?.unsubscribe();let e=this.injector?.get(ea$1);if(!this.control||!e)return;let t=e.markForCheck.bind(e);this.subscription=new ee,this.subscription.add(this.control.valueChanges.subscribe(t)),this.subscription.add(this.control.statusChanges.subscribe(t)),this.resetSubscription?.unsubscribe(),this.resetSubscription=void 0,this.userOnReset&&(this.resetSubscription=this.control.events.subscribe(n=>{n instanceof es&&this.control&&this.userOnReset?.(this.control.value);}),this.subscription.add(this.resetSubscription)),this.parseErrorsValidator&&this.control.addValidators(this.parseErrorsValidator);}ngControlCreate(e){!e.nativeElement.hasAttribute?.("ngNoCva")&&(this.rawValueAccessors&&this.rawValueAccessors.length>0||this.valueAccessor!==null)||!e.customControl||(this.isCustomControlBased=true,e.listenToCustomControlModel(r=>{this.control?.setValue(r,{emitModelToViewChange:false}),this.control?.markAsDirty(),this.viewToModelUpdate(r);}),e.listenToCustomControlOutput("touch",()=>{this.control?.markAsTouched();}),this.customControlBindings={},this.isNativeFormElement=Qx(e.nativeElement),this.requiredValidatorViaDi=this._rawValidators.find(r=>r instanceof og));}ngControlUpdate(e,t){if(!this.isCustomControlBased)return;let n=this.control,r=this.customControlBindings;Object.is(r.value,n.value)||(r.value=n.value,e.setCustomControlModelInput(n.value)),this.bindControlProperty(e,r,"touched",n.touched),this.bindControlProperty(e,r,"dirty",n.dirty),this.bindControlProperty(e,r,"valid",n.valid),this.bindControlProperty(e,r,"invalid",n.invalid),this.bindControlProperty(e,r,"pending",n.pending),this.bindControlProperty(e,r,"disabled",n.disabled),this.shouldBindRequired&&this.bindControlProperty(e,r,"required",this.isRequired);let s=n.errors;if(r.errors!==s){r.errors=s;let o=this._convertErrors(s);e.setInputOnDirectives("errors",o);}}get isRequired(){return (this.requiredValidatorViaDi?._enabled||this.control?._hasRequired())??false}get shouldBindRequired(){return  true}bindControlProperty(e,t,n,r){if(t[n]===r)return;t[n]=r;let s=e.setInputOnDirectives(n,r);this.isNativeFormElement&&!s&&(n==="disabled"||n==="required")&&this.renderer&&eM(this.renderer,e.nativeElement,n,r);}_convertErrors(e){if(e===null)return [];let t=this.control;return Object.entries(e).map(([n,r])=>new _h({context:r,kind:n,control:t}))}setParseErrorSource(e){if(e===void 0)return;let t=null,n=It(()=>{let r=e();return r.length===0?null:r.reduce((s,o)=>(s[o.kind]=o,s),{})});this.parseErrorsValidator=(()=>t).bind(this),mh$1(()=>{t=n(),this.control?.updateValueAndValidity({emitEvent:false});},{injector:this.injector});}removeParseErrorsValidator(e){this.parseErrorsValidator&&(e?.removeValidators(this.parseErrorsValidator),e?.updateValueAndValidity({emitEvent:false}));}},Bc=class{_cd;constructor(e){this._cd=e;}get isTouched(){return this._cd?.control?._touched?.(),!!this._cd?.control?.touched}get isUntouched(){return !!this._cd?.control?.untouched}get isPristine(){return this._cd?.control?._pristine?.(),!!this._cd?.control?.pristine}get isDirty(){return !!this._cd?.control?.dirty}get isValid(){return this._cd?.control?._status?.(),!!this._cd?.control?.valid}get isInvalid(){return !!this._cd?.control?.invalid}get isPending(){return !!this._cd?.control?.pending}get isSubmitted(){return this._cd?._submitted?.(),!!this._cd?.submitted}};var yr=(()=>{class i extends Bc{constructor(t){super(t);}static \u0275fac=function(n){return new(n||i)(Fe(vr,2))};static \u0275dir=Mn({type:i,selectors:[["","formControlName",""],["","ngModel",""],["","formControl",""]],hostVars:14,hostBindings:function(n,r){n&2&&Qg$1("ng-untouched",r.isUntouched)("ng-touched",r.isTouched)("ng-pristine",r.isPristine)("ng-dirty",r.isDirty)("ng-valid",r.isValid)("ng-invalid",r.isInvalid)("ng-pending",r.isPending);},standalone:false,features:[xg$1]})}return i})(),ro=(()=>{class i extends Bc{constructor(t){super(t);}static \u0275fac=function(n){return new(n||i)(Fe(no,10))};static \u0275dir=Mn({type:i,selectors:[["","formGroupName",""],["","formArrayName",""],["","ngModelGroup",""],["","formGroup",""],["","formArray",""],["form",3,"ngNoForm",""],["","ngForm",""]],hostVars:16,hostBindings:function(n,r){n&2&&Qg$1("ng-untouched",r.isUntouched)("ng-touched",r.isTouched)("ng-pristine",r.isPristine)("ng-dirty",r.isDirty)("ng-valid",r.isValid)("ng-invalid",r.isInvalid)("ng-pending",r.isPending)("ng-submitted",r.isSubmitted);},standalone:false,features:[xg$1]})}return i})(),Vc=class extends io{constructor(e,t,n){super(Sh(t),wh(n,t)),this.controls=e,this._initObservables(),this._setUpdateStrategy(t),this._setUpControls(),this.updateValueAndValidity({onlySelf:true,emitEvent:!!this.asyncValidator});}controls;registerControl(e,t){let n=this._find(e);return n||(this.controls[e]=t,t.setParent(this),t._registerOnCollectionChange(this._onCollectionChange),t)}addControl(e,t,n={}){this.registerControl(e,t),this.updateValueAndValidity({emitEvent:n.emitEvent}),this._onCollectionChange();}removeControl(e,t={}){let n=this._find(e);n&&n._registerOnCollectionChange(()=>{}),delete this.controls[e],this.updateValueAndValidity({emitEvent:t.emitEvent}),this._onCollectionChange();}setControl(e,t,n={}){let r=this._find(e);r&&r._registerOnCollectionChange(()=>{}),delete this.controls[e],t&&this.registerControl(e,t),this.updateValueAndValidity({emitEvent:n.emitEvent}),this._onCollectionChange();}contains(e){return this._find(e)?.enabled===true}setValue(e,t={}){Y(()=>{rg(this,true,e),Object.keys(e).forEach(n=>{ig(this,true,n),this.controls[n].setValue(e[n],{onlySelf:true,emitEvent:t.emitEvent});}),this.updateValueAndValidity(t);});}patchValue(e,t={}){e!=null&&(Object.keys(e).forEach(n=>{let r=this._find(n);r&&r.patchValue(e[n],{onlySelf:true,emitEvent:t.emitEvent});}),this.updateValueAndValidity(t));}reset(e={},t={}){this._forEachChild((n,r)=>{n.reset(e?e[r]:null,k(m$1({},t),{onlySelf:true}));}),this._updatePristine(t,this),this._updateTouched(t,this),this.updateValueAndValidity(t),t?.emitEvent!==false&&this._events.next(new es(this));}getRawValue(){return this._reduceChildren({},(e,t,n)=>(e[n]=t.getRawValue(),e))}_syncPendingControls(){let e=this._reduceChildren(false,(t,n)=>n._syncPendingControls()?true:t);return e&&this.updateValueAndValidity({onlySelf:true}),e}_forEachChild(e){Object.keys(this.controls).forEach(t=>{let n=this.controls[t];n&&e(n,t);});}_setUpControls(){this._forEachChild(e=>{e.setParent(this),e._registerOnCollectionChange(this._onCollectionChange);});}_updateValue(){this.value=this._reduceValue();}_anyControls(e){for(let[t,n]of Object.entries(this.controls))if(this.contains(t)&&e(n))return  true;return  false}_reduceValue(){let e={};return this._reduceChildren(e,(t,n,r)=>((n.enabled||this.disabled)&&(t[r]=n.value),t))}_reduceChildren(e,t){let n=e;return this._forEachChild((r,s)=>{n=t(n,r,s);}),n}_allControlsDisabled(){for(let e of Object.keys(this.controls))if(this.controls[e].enabled)return  false;return Object.keys(this.controls).length>0||this.disabled}_find(e){return sg(this.controls,e)?this.controls[e]:null}};var vh=class extends Vc{};function Vm(i,e){let t=i.indexOf(e);t>-1&&i.splice(t,1);}function zm(i){return typeof i=="object"&&i!==null&&Object.keys(i).length===2&&"value"in i&&"disabled"in i}var to=class extends io{defaultValue=null;_onChange=[];_pendingValue;_pendingChange=false;constructor(e=null,t,n){super(Sh(t),wh(n,t)),this._applyFormState(e),this._setUpdateStrategy(t),this._initObservables(),this.updateValueAndValidity({onlySelf:true,emitEvent:!!this.asyncValidator}),Hc(t)&&(t.nonNullable||t.initialValueIsDefault)&&(zm(e)?this.defaultValue=e.value:this.defaultValue=e);}setValue(e,t={}){Y(()=>{this.value=this._pendingValue=e,this._onChange.length&&t.emitModelToViewChange!==false&&this._onChange.forEach(n=>n(this.value,t.emitViewToModelChange!==false)),this.updateValueAndValidity(t);});}patchValue(e,t={}){this.setValue(e,t);}reset(e=this.defaultValue,t={}){this._applyFormState(e),this.markAsPristine(t),this.markAsUntouched(t),this.setValue(this.value,t),t.overwriteDefaultValue&&(this.defaultValue=this.value),this._pendingChange=false,t?.emitEvent!==false&&this._events.next(new es(this));}_updateValue(){}_anyControls(e){return  false}_allControlsDisabled(){return this.disabled}registerOnChange(e){this._onChange.push(e);}_unregisterOnChange(e){Vm(this._onChange,e);}registerOnDisabledChange(e){this._onDisabledChange.push(e);}_unregisterOnDisabledChange(e){Vm(this._onDisabledChange,e);}_forEachChild(e){}_syncPendingControls(){return this.updateOn==="submit"&&(this._pendingDirty&&this.markAsDirty(),this._pendingTouched&&this.markAsTouched(),this._pendingChange)?(this.setValue(this._pendingValue,{onlySelf:true,emitModelToViewChange:false}),true):false}_applyFormState(e){zm(e)?(this.value=this._pendingValue=e.value,e.disabled?this.disable({onlySelf:true,emitEvent:false}):this.enable({onlySelf:true,emitEvent:false})):this.value=this._pendingValue=e;}};var mM=i=>i instanceof to;var dg=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275dir=Mn({type:i,selectors:[["form",3,"ngNoForm","",3,"ngNativeValidate",""]],hostAttrs:["novalidate",""],standalone:false})}return i})();var yh=class extends io{constructor(e,t,n){super(Sh(t),wh(n,t)),this.controls=e,this._initObservables(),this._setUpdateStrategy(t),this._setUpControls(),this.updateValueAndValidity({onlySelf:true,emitEvent:!!this.asyncValidator});}controls;at(e){return this.controls[this._adjustIndex(e)]}push(e,t={}){Array.isArray(e)?e.forEach(n=>{this.controls.push(n),this._registerControl(n);}):(this.controls.push(e),this._registerControl(e)),this.updateValueAndValidity({emitEvent:t.emitEvent}),this._onCollectionChange();}insert(e,t,n={}){this.controls.splice(e,0,t),this._registerControl(t),this.updateValueAndValidity({emitEvent:n.emitEvent});}removeAt(e,t={}){let n=this._adjustIndex(e);n<0&&(n=0),this.controls[n]&&this.controls[n]._registerOnCollectionChange(()=>{}),this.controls.splice(n,1),this.updateValueAndValidity({emitEvent:t.emitEvent});}setControl(e,t,n={}){let r=this._adjustIndex(e);r<0&&(r=0),this.controls[r]&&this.controls[r]._registerOnCollectionChange(()=>{}),this.controls.splice(r,1),t&&(this.controls.splice(r,0,t),this._registerControl(t)),this.updateValueAndValidity({emitEvent:n.emitEvent}),this._onCollectionChange();}get length(){return this.controls.length}setValue(e,t={}){Y(()=>{rg(this,false,e),e.forEach((n,r)=>{ig(this,false,r),this.at(r).setValue(n,{onlySelf:true,emitEvent:t.emitEvent});}),this.updateValueAndValidity(t);});}patchValue(e,t={}){e!=null&&(e.forEach((n,r)=>{this.at(r)&&this.at(r).patchValue(n,{onlySelf:true,emitEvent:t.emitEvent});}),this.updateValueAndValidity(t));}reset(e=[],t={}){this._forEachChild((n,r)=>{n.reset(e[r],k(m$1({},t),{onlySelf:true}));}),this._updatePristine(t,this),this._updateTouched(t,this),this.updateValueAndValidity(t),t?.emitEvent!==false&&this._events.next(new es(this));}getRawValue(){return this.controls.map(e=>e.getRawValue())}clear(e={}){this.controls.length<1||(this._forEachChild(t=>t._registerOnCollectionChange(()=>{})),this.controls.splice(0),this.updateValueAndValidity({emitEvent:e.emitEvent}));}_adjustIndex(e){return e<0?e+this.length:e}_syncPendingControls(){let e=this.controls.reduce((t,n)=>n._syncPendingControls()?true:t,false);return e&&this.updateValueAndValidity({onlySelf:true}),e}_forEachChild(e){this.controls.forEach((t,n)=>{e(t,n);});}_updateValue(){this.value=this.controls.filter(e=>e.enabled||this.disabled).map(e=>e.value);}_anyControls(e){return this.controls.some(t=>t.enabled&&e(t))}_setUpControls(){this._forEachChild(e=>this._registerControl(e));}_allControlsDisabled(){for(let e of this.controls)if(e.enabled)return  false;return this.controls.length>0||this.disabled}_registerControl(e){e.setParent(this),e._registerOnCollectionChange(this._onCollectionChange);}_find(e){return this.at(e)??null}};var gM=(()=>{class i extends no{callSetDisabledState;get submitted(){return Y(this._submittedReactive)}set submitted(t){this._submittedReactive.set(t);}_submitted=It(()=>this._submittedReactive());_submittedReactive=q(false);_oldForm;_onCollectionChange=()=>this._updateDomValue();directives=[];constructor(t,n,r){super(),this.callSetDisabledState=r,this._setValidators(t),this._setAsyncValidators(n);}ngOnChanges(t){this.onChanges(t);}ngOnDestroy(){this.onDestroy();}onChanges(t){this._checkFormPresent(),t.hasOwnProperty("form")&&(this._updateValidators(),this._updateDomValue(),this._updateRegistrations(),this._oldForm=this.form);}onDestroy(){this.form&&(Uc(this.form,this),this.form._onCollectionChange===this._onCollectionChange&&this.form._registerOnCollectionChange(()=>{}));}get formDirective(){return this}get path(){return []}addControl(t){let n=this.form.get(t.path);return t._setupWithForm(n,this.callSetDisabledState),n.updateValueAndValidity({emitEvent:false}),this.directives.push(t),n}getControl(t){return this.form.get(t.path)}removeControl(t){Oc(t.control||null,t,false),fM(this.directives,t);}addFormGroup(t){this._setUpFormContainer(t);}removeFormGroup(t){this._cleanUpFormContainer(t);}getFormGroup(t){return this.form.get(t.path)}getFormArray(t){return this.form.get(t.path)}addFormArray(t){this._setUpFormContainer(t);}removeFormArray(t){this._cleanUpFormContainer(t);}updateModel(t,n){this.form.get(t.path).setValue(n);}onReset(){this.resetForm();}resetForm(t=void 0,n={}){this.form.reset(t,n),this._submittedReactive.set(false);}onSubmit(t){return this.submitted=true,hM(this.form,this.directives),this.ngSubmit.emit(t),this.form._events.next(new gh(this.control)),t?.target?.method==="dialog"}_updateDomValue(){this.directives.forEach(t=>{let n=t.control,r=this.form.get(t.path);n!==r&&(Oc(n||null,t),mM(r)&&t._setupWithForm(r,this.callSetDisabledState));}),this.form._updateTreeValidity({emitEvent:false});}_setUpFormContainer(t){let n=this.form.get(t.path);cM(n,t),n.updateValueAndValidity({emitEvent:false});}_cleanUpFormContainer(t){let n=this.form?.get(t.path);n&&uM(n,t)&&n.updateValueAndValidity({emitEvent:false});}_updateRegistrations(){this.form._registerOnCollectionChange(this._onCollectionChange),this._oldForm?._registerOnCollectionChange(()=>{});}_updateValidators(){Th(this.form,this),this._oldForm&&Uc(this._oldForm,this);}_checkFormPresent(){this.form;}static \u0275fac=function(n){return new(n||i)(Fe(zc,10),Fe(Mh,10),Fe(Ch,8))};static \u0275dir=Mn({type:i,features:[xg$1,Tn$1]})}return i})();var Ah=new D(""),_M={provide:vr,useExisting:Fi(()=>Rh)},Rh=(()=>{class i extends vr{_ngModelWarningConfig;callSetDisabledState;viewModel;form;set isDisabled(t){}model;update=new pe$1;static _ngModelWarningSentOnce=false;_ngModelWarningSent=false;constructor(t,n,r,s,o,a,l){super(l,a,r),this._ngModelWarningConfig=s,this.callSetDisabledState=o,this._setValidators(t),this._setAsyncValidators(n);}ngOnChanges(t){if(this._isControlChanged(t)){let n=t.form.previousValue;n&&(Oc(n,this,false),this.removeParseErrorsValidator(n)),this.isCustomControlBased?this.setupCustomControl():(this.valueAccessor??=this.selectedValueAccessor,ag(this.form,this,this.callSetDisabledState)),this.form.updateValueAndValidity({emitEvent:false});}cg(t,this.viewModel)&&(this.form.setValue(this.model),this.viewModel=this.model);}ngOnDestroy(){this.form&&Oc(this.form,this,false);}get path(){return []}get control(){return this.form}viewToModelUpdate(t){this.viewModel=t,this.update.emit(t);}_isControlChanged(t){return t.hasOwnProperty("form")}\u0275ngControlCreate(t){super.ngControlCreate(t);}\u0275ngControlUpdate(t){super.ngControlUpdate(t,true);}static \u0275fac=function(n){return new(n||i)(Fe(zc,10),Fe(Mh,10),Fe($n,10),Fe(Ah,8),Fe(Ch,8),Fe($s$1,8),Fe(ge,8))};static \u0275dir=Mn({type:i,selectors:[["","formControl",""]],inputs:{form:[0,"formControl","form"],isDisabled:[0,"disabled","isDisabled"],model:[0,"ngModel","model"]},outputs:{update:"ngModelChange"},exportAs:["ngForm"],standalone:false,features:[Aw$1([_M,ug]),xg$1,Tn$1,TC(null)]})}return i})();var vM={provide:vr,useExisting:Fi(()=>ts)},ts=(()=>{class i extends vr{_ngModelWarningConfig;_added=false;viewModel;control;name=null;set isDisabled(t){}model;update=new pe$1;static _ngModelWarningSentOnce=false;_ngModelWarningSent=false;constructor(t,n,r,s,o,a,l){super(l,a,s),this._ngModelWarningConfig=o,this._parent=t,this._setValidators(n),this._setAsyncValidators(r);}_setupWithForm(t,n){this.control=t,this.isCustomControlBased?this.setupCustomControl():(this.valueAccessor??=this.selectedValueAccessor,ag(t,this,n));}ngOnChanges(t){this._added||this._setUpControl(),cg(t,this.viewModel)&&(this.viewModel=this.model,this.formDirective.updateModel(this,this.model));}ngOnDestroy(){this.formDirective?.removeControl(this);}viewToModelUpdate(t){this.viewModel=t,this.update.emit(t);}get path(){return rM(this.name==null?this.name:this.name.toString(),this._parent)}get formDirective(){return this._parent?this._parent.formDirective:null}_setUpControl(){this.control=this.formDirective.addControl(this),this._added=true;}\u0275ngControlCreate(t){super.ngControlCreate(t);}\u0275ngControlUpdate(t){this.isCustomControlBased&&(this._added||this._setUpControl(),super.ngControlUpdate(t,true));}static \u0275fac=function(n){return new(n||i)(Fe(no,13),Fe(zc,10),Fe(Mh,10),Fe($n,10),Fe(Ah,8),Fe($s$1,8),Fe(ge,8))};static \u0275dir=Mn({type:i,selectors:[["","formControlName",""]],inputs:{name:[0,"formControlName","name"],isDisabled:[0,"disabled","isDisabled"],model:[0,"ngModel","model"]},outputs:{update:"ngModelChange"},standalone:false,features:[Aw$1([vM,ug]),xg$1,Tn$1,TC(null)]})}return i})();var yM={provide:no,useExisting:Fi(()=>ns)},ns=(()=>{class i extends gM{form=null;ngSubmit=new pe$1;get control(){return this.form}static \u0275fac=(()=>{let t;return function(r){return (t||(t=Os$1(i)))(r||i)}})();static \u0275dir=Mn({type:i,selectors:[["","formGroup",""]],hostBindings:function(n,r){n&1&&Ys$1("submit",function(o){return r.onSubmit(o)})("reset",function(){return r.onReset()});},inputs:{form:[0,"formGroup","form"]},outputs:{ngSubmit:"ngSubmit"},exportAs:["ngForm"],standalone:false,features:[Aw$1([yM]),xg$1]})}return i})();var bM=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({})}return i})();function Hm(i){return !!i&&(i.asyncValidators!==void 0||i.validators!==void 0||i.updateOn!==void 0)}var so=(()=>{class i{useNonNullable=false;get nonNullable(){let t=new i;return t.useNonNullable=true,t}group(t,n=null){let r=this._reduceControls(t),s={};return Hm(n)?s=n:n!==null&&(s.validators=n.validator,s.asyncValidators=n.asyncValidator),new Vc(r,s)}record(t,n=null){let r=this._reduceControls(t);return new vh(r,n)}control(t,n,r){let s={};return this.useNonNullable?(Hm(n)?s=n:(s.validators=n,s.asyncValidators=r),new to(t,k(m$1({},s),{nonNullable:true}))):new to(t,n,r)}array(t,n,r){let s=t.map(o=>this._createControl(o));return new yh(s,n,r)}_reduceControls(t){let n={};return Object.keys(t).forEach(r=>{n[r]=this._createControl(t[r]);}),n}_createControl(t){if(t instanceof to)return t;if(t instanceof io)return t;if(Array.isArray(t)){let n=t[0],r=t.length>1?t[1]:null,s=t.length>2?t[2]:null;return this.control(n,r,s)}else return this.control(t)}static \u0275fac=function(n){return new(n||i)};static \u0275prov=Z({token:i,factory:i.\u0275fac})}return i})();var br=(()=>{class i{static withConfig(t){return {ngModule:i,providers:[{provide:Ah,useValue:t.warnOnNgModelWithFormControl??"always"},{provide:Ch,useValue:t.callSetDisabledState??Eh}]}}static \u0275fac=function(n){return new(n||i)};static \u0275mod=Gs$1({type:i});static \u0275inj=qr$1({imports:[bM]})}return i})();function Wc(i){i||(i=g(we));let e=new x(t=>{if(i.destroyed){t.next();return}return i.onDestroy(t.next.bind(t))});return t=>t.pipe(Hr$1(e))}function xr(i,e){let n=!e?.manualCleanup?e?.injector?.get(we)??g(we):null,r=xM(e?.equal),s;e?.requireSync?s=q({kind:0},{equal:r}):s=q({kind:1,value:e?.initialValue},{equal:r});let o,a=i.subscribe({next:l=>s.set({kind:1,value:l}),error:l=>{s.set({kind:2,error:l}),o?.();},complete:()=>{o?.();}});if(e?.requireSync&&s().kind===0)throw new v$1(601,false);return o=n?.onDestroy(a.unsubscribe.bind(a)),It(()=>{let l=s();switch(l.kind){case 1:return l.value;case 2:throw l.error;case 0:throw new v$1(601,false)}},{equal:e?.equal})}function xM(i=Object.is){return (e,t)=>e.kind===1&&t.kind===1&&i(e.value,t.value)}var MM=["*"];function SM(i,e){i&1&&(bo$1(0,"span",5),ww$1(1,"*"),To$1());}function wM(i,e){if(i&1&&(bo$1(0,"label",0),ww$1(1),Al$1(2,SM,2,0,"span",5),To$1()),i&2){let t=Pl$1();Nn("for",t.controlId),ll$1(),jl$1(" ",t.label()," "),ll$1(),xl(t.required()?2:-1);}}function CM(i,e){if(i&1&&(bo$1(0,"p",2),ww$1(1),To$1()),i&2){let t=Pl$1();Hg$1("id",t.errorId),ll$1(),jl$1(" ",t.error()," ");}}function EM(i,e){if(i&1&&(bo$1(0,"p",3),ww$1(1),To$1()),i&2){let t=Pl$1();Hg$1("id",t.hintId),ll$1(),rm$1(t.hint());}}function TM(i,e){i&1&&Zs$1(0,"p",4);}var AM=0,fn=class i{label=Ct("");hint=Ct("");error=Ct("");required=Ct(false,{transform:ta$1});reserveMessage=Ct(false,{transform:ta$1});controlId=`migo-field-${AM++}`;hintId=`${this.controlId}-hint`;errorId=`${this.controlId}-error`;invalid=It(()=>this.error().length>0);describedBy=It(()=>this.error()?this.errorId:this.hint()?this.hintId:null);static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-form-field"]],hostAttrs:[1,"flex","flex-col","gap-2"],inputs:{label:[1,"label"],hint:[1,"hint"],error:[1,"error"],required:[1,"required"],reserveMessage:[1,"reserveMessage"]},ngContentSelectors:MM,decls:6,vars:2,consts:[[1,"font-body","text-sm","font-semibold","text-body"],[1,"flex","flex-col"],["role","alert",1,"m-0","text-caption","leading-snug","text-error","font-medium",3,"id"],[1,"m-0","text-caption","leading-snug","text-muted",3,"id"],["aria-hidden","true",1,"m-0","min-h-5"],["aria-hidden","true",1,"ms-1","text-accent"]],template:function(t,n){t&1&&(JC(),Al$1(0,wM,3,3,"label",0),bo$1(1,"div",1),XC(2),To$1(),Al$1(3,CM,2,2,"p",2)(4,EM,2,2,"p",3)(5,TM,1,0,"p",4)),t&2&&(xl(n.label()?0:-1),ll$1(3),xl(n.error()?3:n.hint()?4:n.reserveMessage()?5:-1));},encapsulation:2})};var RM=0,hg="w-full min-h-11 box-border px-4 rounded-md bg-surface-card border font-body text-base text-body transition duration-base ease-out placeholder:text-placeholder hover:border-border-strong focus:outline-none disabled:bg-surface-sunken disabled:text-muted disabled:cursor-not-allowed motion-reduce:transition-none",Xc=class i{field=g(fn,{optional:true});type=Ct("text");placeholder=Ct("");ariaLabel=Ct("");invalid=Ct(false,{transform:ta$1});disabled=Ct(false,{transform:ta$1});fallbackId=`migo-input-${RM++}`;value=q("");disabledByForm=q(false);controlId=It(()=>this.field?.controlId??this.fallbackId);describedBy=It(()=>this.field?.describedBy()??null);isInvalid=It(()=>(this.field?.invalid()??false)||this.invalid());isDisabled=It(()=>this.disabledByForm()||this.disabled());controlClasses=It(()=>this.isInvalid()?`${hg} border-error focus:border-error focus:shadow-focus-error`:`${hg} border-border-subtle focus:border-brand focus:shadow-focus`);onChange=()=>{};onTouched=()=>{};onInput(e){let t=e.target.value;this.value.set(t),this.onChange(t);}onBlur(){this.onTouched();}writeValue(e){this.value.set(e??"");}registerOnChange(e){this.onChange=e;}registerOnTouched(e){this.onTouched=e;}setDisabledState(e){this.disabledByForm.set(e);}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-input"]],hostAttrs:[1,"block"],inputs:{type:[1,"type"],placeholder:[1,"placeholder"],ariaLabel:[1,"ariaLabel"],invalid:[1,"invalid"],disabled:[1,"disabled"]},features:[Aw$1([{provide:$n,useExisting:Fi(()=>i),multi:true}])],decls:1,vars:10,consts:[[3,"input","blur","id","type","value","placeholder","disabled"]],template:function(t,n){t&1&&(bo$1(0,"input",0),Ug$1("input",function(s){return n.onInput(s)})("blur",function(){return n.onBlur()}),To$1()),t&2&&(Fl$1(n.controlClasses()),Hg$1("id",n.controlId())("type",n.type())("value",n.value())("placeholder",n.placeholder())("disabled",n.isDisabled()),Nn("aria-label",n.field?null:n.ariaLabel()||null)("aria-invalid",n.isInvalid()?true:null)("aria-describedby",n.describedBy()));},encapsulation:2})};var IM=["box"],DM=["input"],PM=["extraInput"],NM=(i,e)=>e.key,FM=(i,e)=>e.label,LM=(i,e)=>e.id;function OM(i,e){if(i&1){let t=ZC();Rs$1(0,"span",4),ww$1(1),Rs$1(2,"button",7),Ys$1("click",function(r){let s=Qf$1(t).$implicit;return Pl$1().removeChip(s.key),Kf$1(r.stopPropagation())}),Ws$1(3,"migo-icon",8),Ol$1()();}if(i&2){let t=e.$implicit;ll$1(),jl$1(" ",t.display," "),ll$1(),Nn("aria-label","Quitar "+t.display);}}function kM(i,e){i&1&&(Rs$1(0,"div",9),ww$1(1," Ya elegiste todas las opciones disponibles. "),Ol$1());}function UM(i,e){if(i&1&&(Rs$1(0,"span"),ww$1(1),Ol$1()),i&2){let t=e.$implicit;ll$1(),om$1("",t.label," = ",t.extra);}}function BM(i,e){if(i&1&&(Rs$1(0,"li",17),UC(1,UM,2,2,"span",null,FM),Ol$1()),i&2){let t=Pl$1();ll$1(),VC(t);}}function VM(i,e){i&1&&Al$1(0,BM,3,0,"li",17),i&2&&xl(e.length?0:-1);}function zM(i,e){if(i&1){let t=ZC();Rs$1(0,"li",12),ww$1(1),Ol$1(),Al$1(2,VM,1,1),Rs$1(3,"li",13)(4,"input",14,2),Ys$1("keydown.enter",function(){Qf$1(t);let r=nw$1(5),s=Pl$1(3);return Kf$1(s.confirmExtra(r.value))})("keydown.escape",function(){Qf$1(t);let r=Pl$1(3);return Kf$1(r.cancelCreate())}),Ol$1(),Rs$1(6,"button",15),Ys$1("click",function(){Qf$1(t);let r=nw$1(5),s=Pl$1(3);return Kf$1(s.confirmExtra(r.value))}),Ws$1(7,"migo-icon",16),Ol$1()();}if(i&2){let t,n=e,r=Pl$1(3);ll$1(),jl$1(" ",r.extraFieldLabel(n.typeKey)," "),ll$1(),xl((t=r.extraFieldReference(n.typeKey))?2:-1,t),ll$1(2),Pg("placeholder",r.extraFieldPlaceholder(n.typeKey));}}function HM(i,e){if(i&1&&(Rs$1(0,"li",12),ww$1(1),Ol$1()),i&2){let t=Pl$1(4);ll$1(),jl$1(" \xBFA qu\xE9 grupo a\xF1adir \xAB",t.creating(),"\xBB? ");}}function GM(i,e){if(i&1&&(Rs$1(0,"span",22),ww$1(1),Ol$1(),Rs$1(2,"span",21),ww$1(3),Ol$1()),i&2){let t=Pl$1().$implicit;ll$1(),rm$1(t.typeLabel),ll$1(2),rm$1(t.display);}}function WM(i,e){if(i&1&&(Ws$1(0,"migo-icon",23),Rs$1(1,"span",21),ww$1(2),Ol$1()),i&2){let t=Pl$1().$implicit;ll$1(2),jl$1("A\xF1adir \xAB",t.value,"\xBB\u2026");}}function XM(i,e){if(i&1&&(Rs$1(0,"span",21),ww$1(1),Ol$1()),i&2){let t=Pl$1().$implicit;ll$1(),rm$1(t.typeLabel);}}function qM(i,e){if(i&1){let t=ZC();Rs$1(0,"li",20),Ys$1("mousedown",function(r){return r.preventDefault()})("click",function(){let r=Qf$1(t).$implicit,s=Pl$1(4);return Kf$1(s.pick(r))}),Al$1(1,GM,4,2)(2,WM,3,1)(3,XM,2,1,"span",21),Ol$1();}if(i&2){let t,n=e.$implicit,r=e.$index,s=Pl$1(4);Qg$1("bg-surface-sunken",r===s.activeIndex()),Pg("id",n.id),Nn("aria-selected",r===s.activeIndex()),ll$1(),xl((t=n.kind)==="value"?1:t==="create"?2:t==="group"?3:-1);}}function YM(i,e){i&1&&(Rs$1(0,"li",19),ww$1(1,"Sin coincidencias"),Ol$1());}function $M(i,e){if(i&1&&(Al$1(0,HM,2,1,"li",12),UC(1,qM,4,5,"li",18,LM,false,YM,2,0,"li",19)),i&2){let t=Pl$1(3);xl(t.creating()!==null?0:-1),ll$1(),VC(t.options());}}function jM(i,e){if(i&1&&(Rs$1(0,"li",11),ww$1(1),Ol$1()),i&2){let t=Pl$1(3);ll$1(),jl$1(" ",t.createError()," ");}}function ZM(i,e){if(i&1&&(Rs$1(0,"ul",10),Al$1(1,zM,8,3)(2,$M,4,2),Al$1(3,jM,2,1,"li",11),Ol$1()),i&2){let t,n=Pl$1(2);Pg("id",n.listboxId),ll$1(),xl((t=n.awaitingExtra())?1:2,t),ll$1(2),xl(n.createError()?3:-1);}}function KM(i,e){if(i&1&&Al$1(0,kM,2,0,"div",9)(1,ZM,4,3,"ul",10),i&2){let t=Pl$1();xl(t.allPickedHint()?0:1);}}var JM=0,QM=[{originX:"start",originY:"bottom",overlayX:"start",overlayY:"top",offsetY:4},{originX:"start",originY:"top",overlayX:"start",overlayY:"bottom",offsetY:-4}],pg="flex flex-wrap items-center gap-1.5 w-full min-h-11 box-border px-3 py-1.5 rounded-md bg-surface-card border cursor-text transition duration-base ease-out hover:border-border-strong motion-reduce:transition-none",eS=2200,tS=120;function nS(i){return /^-?\d+(\.\d+)?$/.test(i.trim())}function iS(i){let e=i.trim(),t=e.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);if(t){let r=Number(t[2]);return r!==0?Number(t[1])/r:null}let n=Number(e);return Number.isFinite(n)?n:null}var qc=class i{field=g(fn,{optional:true});types=Ct([]);value=Ct({});placeholder=Ct("");ariaLabel=Ct("");valueChange=Dj();created=Dj();positions=QM;box=Ej.required("box");inputEl=Ej.required("input");extraInputEl=Ej("extraInput");fieldId=`migo-select-tag-${JM++}`;listboxId=`${this.fieldId}-listbox`;selected=q({});extras=q({});query=q("");open=q(false);activeIndex=q(0);boxWidth=q(0);creating=q(null);awaitingExtra=q(null);createError=q("");allPickedHint=q(false);hintTimeoutId=null;blurTimeoutId=null;overlayOpen=It(()=>this.open()||this.allPickedHint());listboxRendered=It(()=>this.overlayOpen()&&!this.allPickedHint());controlId=It(()=>this.field?.controlId??this.fieldId);describedBy=It(()=>this.field?.describedBy()??null);isInvalid=It(()=>this.field?.invalid()??false);boxClasses=It(()=>this.isInvalid()?`${pg} border-error focus-within:shadow-focus-error`:`${pg} border-border-subtle focus-within:border-brand focus-within:shadow-focus`);chips=It(()=>Object.entries(this.selected()).map(([e,t])=>({key:e,value:t,display:this.displayFor(e,t)})));pending=It(()=>this.types().filter(e=>this.selected()[e.key]===void 0));inputPlaceholder=It(()=>{if(this.chips().length)return "";if(this.placeholder())return this.placeholder();let e=this.pending()[0];return e?`A\xF1ade ${e.label.toLowerCase()}\u2026`:""});options=It(()=>{if(this.awaitingExtra())return [];let e=this.creating();if(e!==null)return this.pending().filter(r=>r.allowCreate).map(r=>({kind:"group",id:`${this.fieldId}-group-${r.key}`,typeKey:r.key,typeLabel:r.label,value:e,display:r.label}));let t=this.query().trim().toLowerCase(),n=[];for(let r of this.pending())for(let s of this.valuesFor(r.key,r.values))(!t||s.toLowerCase().includes(t))&&n.push({kind:"value",id:`${this.fieldId}-${r.key}-${s}`,typeKey:r.key,typeLabel:r.label,value:s,display:s});return t&&this.pending().some(r=>r.allowCreate)&&n.push({kind:"create",id:`${this.fieldId}-create`,value:this.query().trim(),display:this.query().trim()}),n});activeId=It(()=>this.options()[this.activeIndex()]?.id??null);constructor(){mh$1(()=>this.selected.set(m$1({},this.value()))),wj(()=>{this.awaitingExtra()&&this.extraInputEl()?.nativeElement.focus();});}focusInput(){this.boxWidth.set(this.box().nativeElement.offsetWidth),this.tryOpen(),this.inputEl().nativeElement.focus();}onFocus(){this.boxWidth.set(this.box().nativeElement.offsetWidth),this.tryOpen();}onInput(e){this.query.set(e.target.value),this.creating.set(null),this.awaitingExtra.set(null),this.createError.set(""),this.activeIndex.set(0),this.tryOpen();}onBlur(){this.blurTimeoutId!==null&&clearTimeout(this.blurTimeoutId),this.blurTimeoutId=setTimeout(()=>{this.blurTimeoutId=null,this.hasFocusWithin()||this.close();},tS);}hasFocusWithin(){let e=document.activeElement;return e?this.box().nativeElement.contains(e)?true:this.extraInputEl()?.nativeElement===e:false}tryOpen(){if(this.pending().length===0){this.showAllPickedHint();return}this.open.set(true);}showAllPickedHint(){this.open.set(false),this.allPickedHint.set(true),this.hintTimeoutId!==null&&clearTimeout(this.hintTimeoutId),this.hintTimeoutId=setTimeout(()=>this.allPickedHint.set(false),eS);}dismissHint(){this.hintTimeoutId!==null&&(clearTimeout(this.hintTimeoutId),this.hintTimeoutId=null),this.allPickedHint.set(false);}ngOnDestroy(){this.hintTimeoutId!==null&&clearTimeout(this.hintTimeoutId),this.blurTimeoutId!==null&&clearTimeout(this.blurTimeoutId);}onKeydown(e){switch(e.key){case "ArrowDown":e.preventDefault(),this.move(1);break;case "ArrowUp":e.preventDefault(),this.move(-1);break;case "Enter":{let t=this.options()[this.activeIndex()];this.open()&&t&&(e.preventDefault(),e.stopPropagation(),this.pick(t));break}case "Escape":this.creating()!==null?(e.stopPropagation(),this.cancelCreate()):this.allPickedHint()?(e.stopPropagation(),this.dismissHint()):this.open()&&(e.stopPropagation(),this.close());break;case "Backspace":if(!this.query()&&this.creating()===null){let t=Object.keys(this.selected());t.length&&this.removeChip(t[t.length-1]);}break}}pick(e){switch(e.kind){case "value":this.commit(e.typeKey,e.value);break;case "create":this.creating.set(e.value),this.createError.set(""),this.activeIndex.set(0),this.inputEl().nativeElement.focus();break;case "group":{let t=this.types().find(r=>r.key===e.typeKey),n=t?.validate?.(e.value)??null;if(n){this.createError.set(n);return}if(t?.extraField&&!nS(e.value)){this.creating.set(null),this.createError.set(""),this.awaitingExtra.set({typeKey:e.typeKey,value:e.value});return}this.addExtra(e.typeKey,e.value),this.commit(e.typeKey,e.value),this.created.emit(m$1({typeKey:e.typeKey,value:e.value},t?.extraField?{extra:Number(e.value)}:{}));break}}}confirmExtra(e){let t=this.awaitingExtra();if(!t)return;let n=iS(e);if(n===null||n<=0){this.createError.set("Ingresa un n\xFAmero (o fracci\xF3n, p.ej. 1/8) mayor que 0.");return}this.addExtra(t.typeKey,t.value),this.commit(t.typeKey,t.value),this.created.emit({typeKey:t.typeKey,value:t.value,extra:n});}extraFieldLabel(e){return this.types().find(t=>t.key===e)?.extraField?.label??""}extraFieldPlaceholder(e){return this.types().find(t=>t.key===e)?.extraField?.placeholder??""}extraFieldReference(e){return this.types().find(t=>t.key===e)?.extraField?.reference??[]}removeChip(e){this.selected.update(t=>{let n=m$1({},t);return delete n[e],n}),this.emit();}close(){this.open.set(false),this.dismissHint(),this.cancelCreate();}cancelCreate(){this.creating.set(null),this.awaitingExtra.set(null),this.createError.set(""),this.activeIndex.set(0);}commit(e,t){this.selected.update(n=>k(m$1({},n),{[e]:t})),this.emit(),this.query.set(""),this.cancelCreate(),this.pending().length===0&&this.showAllPickedHint(),this.inputEl().nativeElement.focus();}addExtra(e,t){this.valuesFor(e,this.typeValues(e)).some(n=>n.toLowerCase()===t.toLowerCase())||this.extras.update(n=>k(m$1({},n),{[e]:[...n[e]??[],t]}));}move(e){if(this.creating()===null&&this.pending().length===0){this.showAllPickedHint();return}this.open.set(true);let t=this.options().length;t>0&&this.activeIndex.set((this.activeIndex()+e+t)%t);}valuesFor(e,t){let n=new Map;for(let r of [...t,...this.extras()[e]??[]]){let s=r.trim().toLowerCase();s&&!n.has(s)&&n.set(s,r);}return [...n.values()]}typeValues(e){return this.types().find(t=>t.key===e)?.values??[]}labelFor(e){return this.types().find(t=>t.key===e)?.label??e}displayFor(e,t){return `${this.labelFor(e)}: ${t}`}emit(){this.valueChange.emit(m$1({},this.selected()));}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-select-tag"]],viewQuery:function(t,n){t&1&&qg$1(n.box,IM,5)(n.inputEl,DM,5)(n.extraInputEl,PM,5),t&2&&tw$1(3);},hostAttrs:[1,"block"],inputs:{types:[1,"types"],value:[1,"value"],placeholder:[1,"placeholder"],ariaLabel:[1,"ariaLabel"]},outputs:{valueChange:"valueChange",created:"created"},decls:8,vars:14,consts:[["box","","origin","cdkOverlayOrigin"],["input",""],["extraInput",""],["cdkOverlayOrigin","",3,"click"],[1,"inline-flex","items-center","gap-1","min-h-7","ps-3","pe-1","rounded-full","bg-brand","text-on-brand","text-sm"],["type","text","role","combobox","autocomplete","off","aria-autocomplete","list",1,"flex-1","min-w-24","field-sizing-content","bg-transparent","border-0","p-0","min-h-9","font-body","text-base","text-body","placeholder:text-placeholder","focus:outline-none",3,"focus","input","keydown","blur","id","value","placeholder"],["cdkConnectedOverlay","",3,"overlayOutsideClick","detach","cdkConnectedOverlayOrigin","cdkConnectedOverlayOpen","cdkConnectedOverlayWidth","cdkConnectedOverlayPositions"],["type","button",1,"inline-flex","items-center","justify-center","size-5","rounded-full","hover:bg-brand-hover","focus-visible:outline-none","focus-visible:shadow-focus",3,"click"],["name","mat:close","size","xs"],["role","status",1,"mt-1","rounded-md","border","border-border-subtle","bg-surface-card","px-3","py-2","text-sm","text-muted","shadow-lg"],["role","listbox",1,"mt-0","p-1","list-none","max-h-72","overflow-y-auto","bg-surface-card","border","border-border-subtle","rounded-md","shadow-lg",3,"id"],["role","alert",1,"px-3","py-2","text-caption","font-medium","text-error"],[1,"px-3","pt-2","pb-1","text-caption","text-muted"],[1,"flex","items-center","gap-2","px-3","py-2"],["type","text","inputmode","text","autocomplete","off",1,"min-h-11","min-w-0","flex-1","rounded-md","border","border-border-subtle","bg-surface-card","px-3","py-2","font-body","text-base","text-body","focus:outline-none","focus:border-brand","focus:shadow-focus",3,"keydown.enter","keydown.escape","placeholder"],["migo-button","","size","sm","type","button","aria-label","Confirmar",3,"click"],["icon-leading","","name","mat:check","size","sm"],[1,"flex","flex-wrap","gap-x-3","gap-y-1","px-3","pb-1","text-xs","text-muted"],["role","option",1,"flex","items-center","gap-2","px-3","py-2","rounded-sm","text-sm","text-body","cursor-pointer",3,"bg-surface-sunken","id"],[1,"px-3","py-2","text-sm","text-muted"],["role","option",1,"flex","items-center","gap-2","px-3","py-2","rounded-sm","text-sm","text-body","cursor-pointer",3,"mousedown","click","id"],[1,"flex-1"],[1,"shrink-0","text-caption","text-muted"],["name","mat:add","size","sm","color","muted"]],template:function(t,n){if(t&1&&(Rs$1(0,"div",3,0),Ys$1("click",function(){return n.focusInput()}),UC(3,OM,4,2,"span",4,NM),Rs$1(5,"input",5,1),Ys$1("focus",function(){return n.onFocus()})("input",function(s){return n.onInput(s)})("keydown",function(s){return n.onKeydown(s)})("blur",function(){return n.onBlur()}),Ol$1()(),kg$1(7,KM,2,1,"ng-template",6),Ys$1("overlayOutsideClick",function(){return n.close()})("detach",function(){return n.close()})),t&2){let r=nw$1(2);Fl$1(n.boxClasses()),ll$1(3),VC(n.chips()),ll$1(2),Pg("id",n.controlId())("value",n.query())("placeholder",n.inputPlaceholder()),Nn("aria-label",n.field?null:n.ariaLabel()||null)("aria-expanded",n.open())("aria-controls",n.listboxRendered()?n.listboxId:null)("aria-describedby",n.describedBy())("aria-activedescendant",n.activeId()),ll$1(2),Pg("cdkConnectedOverlayOrigin",r)("cdkConnectedOverlayOpen",n.overlayOpen())("cdkConnectedOverlayWidth",n.boxWidth())("cdkConnectedOverlayPositions",n.positions);}},dependencies:[Ji,Nr,Pr,xv$1,S],encapsulation:2})};var Yc=class i extends La$1{recipes=g(v);log=g(xm$1).scoped("recipe-book/delete-recipe");async execute({id:e}){this.log.debug("borrar receta \u25B6",{id:e}),await this.recipes.delete(new E$1(e)),this.log.debug("borrar receta \u2714",{id:e});}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var $c=class i extends La$1{recipes=g(v);bus=g(kv$1);log=g(xm$1).scoped("recipe-book/save-recipe");async execute({id:e,categoryId:t,name:n,ingredients:r,flavorId:s,portionsCapacityId:o,moldCapacityId:a}){this.log.debug("ejecutando",{sobreId:e??null,categoryId:t,ingredientes:r.length,conSabor:s!=null,conCapacidades:o!=null||a!=null});let l=e?new E$1(e):this.recipes.nextIdentity();this.log.debug(e?"sobre la identidad recibida":"identidad nueva acu\xF1ada",{id:l.value});let c=f.create(l,new E$1(t),n,r.map(u=>S$1.of(new E$1(u.supplyId),h.of(u.quantity,u.unit))),s?new E$1(s):null,o?new E$1(o):null,a?new E$1(a):null);return await this.recipes.save(c),await this.bus.publish(c.pullEvents()),this.log.debug("hecho",{id:l.value}),{id:l.value}}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var jc=class i extends La$1{flavors=g(I);capacities=g(b);bus=g(kv$1);log=g(xm$1).scoped("recipe-book/save-property");async execute({kind:e,id:t,label:n,factor:r}){return this.log.debug("ejecutando",{kind:e,sobreId:t??null,conFactor:r!==void 0}),e==="flavor"?this.saveFlavor(t,n):this.saveCapacity(e,t,n,r)}async saveFlavor(e,t){let n=e?await this.flavors.byId(new E$1(e)):this.byLabel(await this.flavors.all(),t);this.log.debug(n?"sabor existente, se reutiliza":"sabor nuevo",{id:n?.id.value??null});let r=R.create(n?.id??(e?new E$1(e):this.flavors.nextIdentity()),t);return await this.flavors.save(r),await this.bus.publish(r.pullEvents()),this.log.debug("sabor guardado",{id:r.id.value}),{id:r.id.value}}async saveCapacity(e,t,n,r){let s=t?await this.capacities.byId(new E$1(t)):this.byLabel(await this.capacities.byGroup(e),n);this.log.debug(s?"capacidad existente, se reutiliza":"capacidad nueva",{group:e,id:s?.id.value??null,factorHeredado:r===void 0&&s!==null});let o=C.create(s?.id??(t?new E$1(t):this.capacities.nextIdentity()),e,n,r??s?.factor??1);return await this.capacities.save(o),await this.bus.publish(o.pullEvents()),this.log.debug("capacidad guardada",{id:o.id.value,group:e,factor:o.factor}),{id:o.id.value}}byLabel(e,t){let n=t.trim().toLowerCase();return e.find(r=>r.label.toLowerCase()===n)??null}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var rS=["control"];function sS(i,e){if(i&1&&(bo$1(0,"span",3),ww$1(1),To$1()),i&2){let t=Pl$1();ll$1(),rm$1(t.unit());}}var oS=0,fg="flex items-center gap-1 w-full min-h-11 box-border px-4 rounded-md bg-surface-card border font-body text-base text-body cursor-text transition duration-base ease-out hover:border-border-strong has-[:disabled]:bg-surface-sunken has-[:disabled]:text-muted has-[:disabled]:cursor-not-allowed motion-reduce:transition-none",Mr=class i{field=g(fn,{optional:true});unit=Ct("");placeholder=Ct("");ariaLabel=Ct("");invalid=Ct(false,{transform:ta$1});disabled=Ct(false,{transform:ta$1});unitToken=Dj();seamless=Ct(false,{transform:ta$1});paper=Ct(false,{transform:ta$1});control=Ej.required("control");fallbackId=`migo-unit-input-${oS++}`;value=q("");disabledByForm=q(false);controlId=It(()=>this.field?.controlId??this.fallbackId);describedBy=It(()=>this.field?.describedBy()??null);isInvalid=It(()=>(this.field?.invalid()??false)||this.invalid());isDisabled=It(()=>this.disabledByForm()||this.disabled());boxClasses=It(()=>{if(this.paper()){let e="flex items-center gap-1 w-full min-h-11 box-border px-3 bg-transparent font-body text-base cursor-text transition duration-base ease-out border-b border-border-subtle focus-within:bg-surface-warm motion-reduce:transition-none";return this.isInvalid()?`${e} text-error`:`${e} text-body`}if(this.seamless()){let e="flex items-center gap-1 w-full min-h-11 box-border px-3 bg-transparent font-body text-base cursor-text transition duration-base ease-out focus-within:bg-surface-sunken motion-reduce:transition-none";return this.isInvalid()?`${e} text-error`:`${e} text-body`}return this.isInvalid()?`${fg} border-error focus-within:border-error focus-within:shadow-focus-error`:`${fg} border-border-subtle focus-within:border-brand focus-within:shadow-focus`});onChange=()=>{};onTouched=()=>{};focusFromBox(e){e.target!==this.control().nativeElement&&(e.preventDefault(),this.control().nativeElement.focus());}onKeydown(e){if(e.key.length!==1||!/[a-zA-Z]/.test(e.key))return;e.preventDefault();let t=e.key.toLowerCase();(t==="k"||t==="g"||t==="u")&&this.unitToken.emit(t);}onInput(e){let t=e.target,n=aS(t.value);n!==t.value&&(t.value=n),this.value.set(n),this.onChange(n);}onBlur(){this.onTouched();}writeValue(e){this.value.set(e??"");}registerOnChange(e){this.onChange=e;}registerOnTouched(e){this.onTouched=e;}setDisabledState(e){this.disabledByForm.set(e);}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-unit-input"]],viewQuery:function(t,n){t&1&&qg$1(n.control,rS,5),t&2&&tw$1();},hostAttrs:[1,"block"],inputs:{unit:[1,"unit"],placeholder:[1,"placeholder"],ariaLabel:[1,"ariaLabel"],invalid:[1,"invalid"],disabled:[1,"disabled"],seamless:[1,"seamless"],paper:[1,"paper"]},outputs:{unitToken:"unitToken"},features:[Aw$1([{provide:$n,useExisting:Fi(()=>i),multi:true}])],decls:4,vars:10,consts:[["control",""],[3,"mousedown"],["type","text","inputmode","decimal",1,"field-sizing-content","min-w-6","max-w-full","bg-transparent","border-0","p-0","font-body","text-base","text-body","placeholder:text-placeholder","focus:outline-none","disabled:cursor-not-allowed",3,"keydown","input","blur","id","value","placeholder","disabled"],["aria-hidden","true",1,"shrink-0","text-base","text-muted","select-none"]],template:function(t,n){t&1&&(bo$1(0,"span",1),Ug$1("mousedown",function(s){return n.focusFromBox(s)}),bo$1(1,"input",2,0),Ug$1("keydown",function(s){return n.onKeydown(s)})("input",function(s){return n.onInput(s)})("blur",function(){return n.onBlur()}),To$1(),Al$1(3,sS,2,1,"span",3),To$1()),t&2&&(Fl$1(n.boxClasses()),ll$1(),Hg$1("id",n.controlId())("value",n.value())("placeholder",n.placeholder())("disabled",n.isDisabled()),Nn("aria-label",n.field?null:n.ariaLabel()||null)("aria-invalid",n.isInvalid()?true:null)("aria-describedby",n.describedBy()),ll$1(2),xl(n.unit()&&n.value()?3:-1));},encapsulation:2})};function aS(i){let e=i.replace(/[^\d.,]/g,""),t=e.search(/[.,]/);if(t===-1)return e;let n=e.slice(0,t+1),r=e.slice(t+1).replace(/[.,]/g,"");return n+r}var lS=["wrapper"],cS=["control"],uS=["ghost"];function dS(i,e){if(i&1&&(Rs$1(0,"span",7,2)(2,"span",8),ww$1(3),Ol$1(),Rs$1(4,"span",9),ww$1(5),Ol$1()()),i&2){let t=Pl$1();Fl$1(t.ghostClasses()),ll$1(3),rm$1(t.value()),ll$1(2),rm$1(t.ghostSuffix());}}function hS(i,e){if(i&1){let t=ZC();Rs$1(0,"li",12),Ys$1("mousedown",function(r){return r.preventDefault()})("click",function(){let r=Qf$1(t).$implicit,s=Pl$1(2);return Kf$1(s.pick(r))}),Rs$1(1,"span",13),ww$1(2),Ol$1()();}if(i&2){let t=e.$implicit,n=e.$index,r=Pl$1(2);Qg$1("bg-surface-sunken",n===r.activeIndex()),Pg("id",r.optionId(n)),Nn("aria-selected",n===r.activeIndex()),ll$1(2),rm$1(t);}}function pS(i,e){if(i&1&&(Rs$1(0,"ul",10),UC(1,hS,3,5,"li",11,BC),Ol$1()),i&2){let t=Pl$1();Pg("id",t.listboxId),ll$1(),VC(t.dropdownOptions());}}var fS=0,mS=[{originX:"start",originY:"bottom",overlayX:"start",overlayY:"top",offsetY:4},{originX:"start",originY:"top",overlayX:"start",overlayY:"bottom",offsetY:-4}],Dh="w-full min-h-11 box-border bg-transparent font-body text-base transition duration-base ease-out placeholder:text-placeholder focus:outline-none disabled:bg-surface-sunken disabled:text-muted disabled:cursor-not-allowed motion-reduce:transition-none",Zc=class i{field=g(fn,{optional:true});suggestions=Ct([]);placeholder=Ct("");ariaLabel=Ct("");invalid=Ct(false,{transform:ta$1});disabled=Ct(false,{transform:ta$1});seamless=Ct(false,{transform:ta$1});paper=Ct(false,{transform:ta$1});selected=Dj();positions=mS;wrapper=Ej.required("wrapper");control=Ej.required("control");ghost=Ej("ghost");fallbackId=`migo-combobox-${fS++}`;listboxId=`${this.fallbackId}-listbox`;value=q("");open=q(false);activeIndex=q(0);overlayWidth=q(0);disabledByForm=q(false);controlId=It(()=>this.field?.controlId??this.fallbackId);describedBy=It(()=>this.field?.describedBy()??null);isInvalid=It(()=>(this.field?.invalid()??false)||this.invalid());isDisabled=It(()=>this.disabledByForm()||this.disabled());matches=It(()=>{let e=this.value().trim();if(!e)return [];let t=e.toLowerCase();return this.suggestions().filter(n=>{let r=n.toLowerCase();return r.includes(t)&&r!==t})});isGhostMode=It(()=>{let e=this.matches();return e.length===1&&e[0].toLowerCase().startsWith(this.value().trim().toLowerCase())});ghostSuffix=It(()=>this.isGhostMode()?this.matches()[0].slice(this.value().length):"");dropdownOptions=It(()=>this.isGhostMode()?[]:this.matches());showDropdown=It(()=>this.open()&&this.dropdownOptions().length>0);onChange=()=>{};onTouched=()=>{};constructor(){wj(()=>{this.value(),this.syncGhost();});}optionId(e){return `${this.fallbackId}-option-${e}`}onInput(e){let t=e.target.value;this.value.set(t),this.onChange(t),this.activeIndex.set(0),this.open.set(true);}onFocus(){this.overlayWidth.set(this.wrapper().nativeElement.offsetWidth),this.open.set(true);}onBlur(){this.open.set(false),this.onTouched();}onKeydown(e){if(this.dropdownOptions().length>0&&(e.key==="ArrowDown"||e.key==="ArrowUp")){e.preventDefault(),e.stopPropagation(),this.open.set(true),this.move(e.key==="ArrowDown"?1:-1);return}if(this.showDropdown())switch(e.key){case "Enter":e.preventDefault(),e.stopPropagation(),this.pick(this.dropdownOptions()[this.activeIndex()]);return;case "Tab":e.shiftKey||(e.preventDefault(),e.stopPropagation(),this.pick(this.dropdownOptions()[this.activeIndex()]));return;case "Escape":e.stopPropagation(),this.close();return;default:return}if(!this.isGhostMode())return;let n=this.matches()[0],r=this.control().nativeElement,s=r.selectionStart===r.value.length&&r.selectionEnd===r.value.length,o=e.key==="Enter"||e.key==="Tab"&&!e.shiftKey,a=e.key==="ArrowRight"&&s;!o&&!a||(e.preventDefault(),e.stopPropagation(),this.commit(n,o));}pick(e){this.commit(e,true);}close(){this.open.set(false);}move(e){let t=this.dropdownOptions().length;t>0&&this.activeIndex.set((this.activeIndex()+e+t)%t);}commit(e,t){this.value.set(e),this.onChange(e),this.open.set(false),this.activeIndex.set(0);let n=this.control().nativeElement;n.value=e,n.setSelectionRange(e.length,e.length),t&&this.selected.emit(e);}syncGhost(){let e=this.ghost()?.nativeElement;e&&(e.scrollLeft=this.control().nativeElement.scrollLeft);}controlClasses=It(()=>{if(this.paper()){let t=`${Dh} px-3 border-x-0 border-t-0 border-b border-border-subtle rounded-none focus:bg-surface-warm`;return this.isInvalid()?`${t} text-error`:`${t} text-body`}if(this.seamless()){let t=`${Dh} px-3 border-0 rounded-none focus:bg-surface-sunken`;return this.isInvalid()?`${t} text-error`:`${t} text-body`}let e=`${Dh} px-4 border rounded-md text-body hover:border-border-strong`;return this.isInvalid()?`${e} border-error focus:border-error focus:shadow-focus-error`:`${e} border-border-subtle focus:border-brand focus:shadow-focus`});ghostClasses=It(()=>{let e=this.seamless()||this.paper()?"px-3":"px-4",t=this.paper()?"border-x-0 border-t-0 border-b border-transparent":this.seamless()?"":"border border-transparent";return `absolute inset-0 flex items-center ${e} ${t} box-border font-body text-base whitespace-pre overflow-hidden pointer-events-none`});writeValue(e){this.value.set(e??"");}registerOnChange(e){this.onChange=e;}registerOnTouched(e){this.onTouched=e;}setDisabledState(e){this.disabledByForm.set(e);}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-combobox"]],viewQuery:function(t,n){t&1&&qg$1(n.wrapper,lS,5)(n.control,cS,5)(n.ghost,uS,5),t&2&&tw$1(3);},hostAttrs:[1,"block"],inputs:{suggestions:[1,"suggestions"],placeholder:[1,"placeholder"],ariaLabel:[1,"ariaLabel"],invalid:[1,"invalid"],disabled:[1,"disabled"],seamless:[1,"seamless"],paper:[1,"paper"]},outputs:{selected:"selected"},features:[Aw$1([{provide:$n,useExisting:Fi(()=>i),multi:true}])],decls:7,vars:18,consts:[["wrapper","","origin","cdkOverlayOrigin"],["control",""],["ghost",""],["cdkOverlayOrigin","",1,"relative","block"],["type","text","role","combobox","autocomplete","off","aria-autocomplete","both",3,"keydown","input","focus","scroll","blur","id","value","placeholder","disabled"],["aria-hidden","true",3,"class"],["cdkConnectedOverlay","",3,"overlayOutsideClick","detach","cdkConnectedOverlayOrigin","cdkConnectedOverlayOpen","cdkConnectedOverlayWidth","cdkConnectedOverlayPositions"],["aria-hidden","true"],[1,"invisible"],[1,"text-placeholder"],["role","listbox",1,"mt-0","p-1","list-none","max-h-72","overflow-y-auto","bg-surface-card","border","border-border-subtle","rounded-md","shadow-lg",3,"id"],["role","option",1,"flex","items-center","gap-2","px-3","py-2","min-h-11","rounded-sm","text-sm","text-body","cursor-pointer",3,"bg-surface-sunken","id"],["role","option",1,"flex","items-center","gap-2","px-3","py-2","min-h-11","rounded-sm","text-sm","text-body","cursor-pointer",3,"mousedown","click","id"],[1,"flex-1"]],template:function(t,n){if(t&1&&(Rs$1(0,"span",3,0)(3,"input",4,1),Ys$1("keydown",function(s){return n.onKeydown(s)})("input",function(s){return n.onInput(s)})("focus",function(){return n.onFocus()})("scroll",function(){return n.syncGhost()})("blur",function(){return n.onBlur()}),Ol$1(),Al$1(5,dS,6,4,"span",5),Ol$1(),kg$1(6,pS,3,1,"ng-template",6),Ys$1("overlayOutsideClick",function(){return n.close()})("detach",function(){return n.close()})),t&2){let r=nw$1(2);ll$1(3),Fl$1(Tw$1("relative ",n.controlClasses())),Pg("id",n.controlId())("value",n.value())("placeholder",n.placeholder())("disabled",n.isDisabled()),Nn("aria-label",n.field?null:n.ariaLabel()||null)("aria-invalid",n.isInvalid()?true:null)("aria-describedby",n.describedBy())("aria-expanded",n.showDropdown())("aria-controls",n.showDropdown()?n.listboxId:null)("aria-activedescendant",n.showDropdown()?n.optionId(n.activeIndex()):null),ll$1(2),xl(n.ghostSuffix()?5:-1),ll$1(),Pg("cdkConnectedOverlayOrigin",r)("cdkConnectedOverlayOpen",n.showDropdown())("cdkConnectedOverlayWidth",n.overlayWidth())("cdkConnectedOverlayPositions",n.positions);}},dependencies:[Ji,Nr,Pr],encapsulation:2})};var gS=(i,e,t,n)=>({$implicit:i,rowIndex:e,col:t,colIndex:n}),gg=(i,e)=>e.name;function _S(i,e){if(i&1&&(Rs$1(0,"th",3),ww$1(1),Ol$1()),i&2){let t=e.$implicit,n=e.$index,r=e.$count,s=Pl$1();Fl$1(s.headClasses(t,n===r-1)),ll$1(),jl$1(" ",t.name," ");}}function vS(i,e){if(i&1&&(Rs$1(0,"td",5),jg$1(1,6),Ol$1()),i&2){let t=e.$implicit,n=e.$index,r=e.$count,s=Pl$1(),o=s.$implicit,a=s.$index,l=s.$count,c=Pl$1(),u=Pl$1();Fl$1(u.cellClasses(t,n===r-1,a===l-1)),Nn("data-row",a)("data-col",n),ll$1(),Pg("ngTemplateOutlet",c)("ngTemplateOutletContext",xw$1(6,gS,o,a,t,n));}}function yS(i,e){if(i&1&&(Rs$1(0,"tr",1),UC(1,vS,2,11,"td",4,gg),Ol$1()),i&2){let t=Pl$1(2);ll$1(),VC(t.columns());}}function bS(i,e){if(i&1&&(Rs$1(0,"tbody"),UC(1,yS,3,0,"tr",1,HC),Ol$1()),i&2){let t=Pl$1();ll$1(),VC(t.rows());}}var xS={0:"w-0 min-w-0 max-w-0",24:"w-6 min-w-6 max-w-6",32:"w-8 min-w-8 max-w-8",40:"w-10 min-w-10 max-w-10",44:"w-11 min-w-11 max-w-11",48:"w-12 min-w-12 max-w-12",56:"w-14 min-w-14 max-w-14",64:"w-16 min-w-16 max-w-16",80:"w-20 min-w-20 max-w-20",96:"w-24 min-w-24 max-w-24",112:"w-28 min-w-28 max-w-28",128:"w-32 min-w-32 max-w-32",144:"w-36 min-w-36 max-w-36",160:"w-40 min-w-40 max-w-40",192:"w-48 min-w-48 max-w-48",224:"w-56 min-w-56 max-w-56",256:"w-64 min-w-64 max-w-64"},MS={25:"w-1/4",33:"w-1/3",40:"w-2/5",50:"w-1/2",60:"w-3/5",66:"w-2/3",75:"w-3/4",80:"w-4/5"},SS={96:"max-w-24",128:"max-w-32",160:"max-w-40",224:"max-w-56",320:"max-w-80",384:"max-w-96"},wS={25:"max-w-1/4",33:"max-w-1/3",40:"max-w-2/5",50:"max-w-1/2",60:"max-w-3/5",66:"max-w-2/3",75:"max-w-3/4",80:"max-w-4/5"},CS={start:"text-start",center:"text-center",end:"text-end"},Sr=class i{host=g(zt);columns=Ct([]);rows=Ct([]);ariaLabel=Ct("");bleed=Ct(false,{transform:ta$1});maxWidth=Ct(null);cell=Ij(dr$1);removeRow=Dj();remove(e){this.removeRow.emit(e);}hostClasses=It(()=>{let e=["block overflow-x-auto"],t=this.maxWidth();return this.bleed()&&(e.push("-mx-4"),t===null&&e.push("sm:mx-0")),t==="reading"?e.push("max-w-reading sm:mx-auto"):t==="page"&&e.push("max-w-page sm:mx-auto"),e.join(" ")});tableClasses=It(()=>`w-full table-auto border-separate border-spacing-0 border border-border-subtle overflow-hidden ${this.bleed()?"rounded-none sm:rounded-md":"rounded-md"}`);headClasses(e,t){let n=t?"":"border-r";return `${this.colWidth(e)} ${this.colMax(e)} ${this.colAlign(e)} bg-surface-sunken px-3 py-2 border-b ${n} border-border-subtle font-body text-caption font-semibold text-muted`}cellClasses(e,t,n){let r=t?"":"border-r",s=n?"":"border-b";return `${this.colWidth(e)} ${this.colMax(e)} ${this.colAlign(e)} ${s} ${r} border-border-subtle align-middle [&_input]:min-w-0`}colWidth(e){let t=e.size;return t===void 0?"":t==="fit"?"w-px whitespace-nowrap":typeof t=="number"?Kc(xS,t):Kc(MS,mg(t))}colMax(e){let t=e.max;return t===void 0?"":typeof t=="number"?Kc(SS,t):Kc(wS,mg(t))}colAlign(e){return CS[e.align??"start"]}onKeydown(e){let t=document.activeElement,n=t?.closest('[role="gridcell"]')??null;if(!n||!this.host.nativeElement.contains(n)||n.dataset.row===void 0)return;let r=Number(n.dataset.row),s=Number(n.dataset.col),o=null;switch(e.key){case "Enter":if(t?.tagName==="BUTTON")return;o={r:r+1,c:0};break;case "ArrowDown":o={r:r+1,c:s};break;case "ArrowUp":o={r:r-1,c:s};break;case "ArrowRight":ES(t)&&(o={r,c:s+1});break;case "ArrowLeft":TS(t)&&(o={r,c:s-1});break;default:return}o&&this.focusCell(o.r,o.c)&&e.preventDefault();}focusCell(e,t){if(e<0||t<0)return  false;let r=this.host.nativeElement.querySelector(`[role="gridcell"][data-row="${e}"][data-col="${t}"]`)?.querySelector("input, textarea, select, button, [tabindex]");if(!r)return  false;if(r.focus(),r instanceof HTMLInputElement){let s=r.value.length;r.setSelectionRange(s,s);}return  true}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-table"]],contentQueries:function(t,n,r){t&1&&Gg$1(r,n.cell,dr$1,5),t&2&&tw$1();},hostVars:2,hostBindings:function(t,n){t&1&&Ys$1("keydown",function(s){return n.onKeydown(s)}),t&2&&Fl$1(n.hostClasses());},inputs:{columns:[1,"columns"],rows:[1,"rows"],ariaLabel:[1,"ariaLabel"],bleed:[1,"bleed"],maxWidth:[1,"maxWidth"]},outputs:{removeRow:"removeRow"},decls:6,vars:4,consts:[["role","grid"],["role","row"],["role","columnheader","scope","col",3,"class"],["role","columnheader","scope","col"],["role","gridcell",3,"class"],["role","gridcell"],[3,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(t,n){if(t&1&&(Rs$1(0,"table",0)(1,"thead")(2,"tr",1),UC(3,_S,2,3,"th",2,gg),Ol$1()(),Al$1(5,bS,3,0,"tbody"),Ol$1()),t&2){let r;Fl$1(n.tableClasses()),Nn("aria-label",n.ariaLabel()||null),ll$1(3),VC(n.columns()),ll$1(2),xl((r=n.cell())?5:-1,r);}},dependencies:[IS$1],encapsulation:2})};function mg(i){return Number(i.slice(0,-1))}function Kc(i,e){let t=Object.keys(i).map(Number),n=t[0];for(let r of t)Math.abs(r-e)<Math.abs(n-e)&&(n=r);return i[n]}function ES(i){return i instanceof HTMLInputElement?i.selectionStart===i.value.length:true}function TS(i){return i instanceof HTMLInputElement?i.selectionEnd===0:true}var AS=10,ji=class i{constructor(e,t,n,r){this.raw=e;this.quantity=t;this.unit=n;this.baseUnit=r;}raw;quantity;unit;baseUnit;get isValid(){return this.quantity!==null}static parse(e,t){let n=(e??"").trim();if(t==="count"){let d=RS(n),p=d!==null&&d>0?h.of(d,"u"):null;return new i(e,p,"u","u")}let{amount:r,token:s}=IS(n),o,a;s==="u"&&t==="any"?(o="u",a="u"):s==="k"?(o="kg",a="g"):s==="g"?(o="g",a="g"):r!==null?(o=r<AS?"kg":"g",a="g"):(o="kg",a="g");let l=s===null||s==="k"||s==="g"||s==="u"&&t==="any",c=r!==null&&r>0&&l,u=null;return c&&(u=a==="u"?h.of(r,"u"):h.of(o==="kg"?r*1e3:r,"g")),new i(e,u,o,a)}equals(e){return (this.quantity===null?e.quantity===null:e.quantity!==null&&this.quantity.equals(e.quantity))&&this.unit===e.unit}toString(){return this.quantity?this.quantity.toString():`\u2205 ${this.unit}`}};function RS(i){if(!/^\d*[.,]?\d+$/.test(i))return null;let e=Number(i.replace(",","."));return Number.isFinite(e)?e:null}function IS(i){let e=i.replace(",",".").match(/^(\d*\.?\d+)\s*([a-zA-Z]+)?$/);if(!e)return {amount:null,token:null};let t=Number(e[1]),n=e[2]?.toLowerCase(),r;return n?n.startsWith("k")?r="k":n.startsWith("g")?r="g":n.startsWith("u")?r="u":r="unknown":r=null,{amount:Number.isFinite(t)?t:null,token:r}}var DS=1e3;function sa(i,e="PEN"){return `${x$1(e)} ${i.toFixed(2)}`}function PS(i){return i.unit==="u"?`${Jc(i.value)} u`:i.value>=DS?`${Jc(i.value/1e3)} kg`:`${Jc(i.value)} g`}function _g(i){return `${PS(i.per)} \xB7 ${x$1(i.currency)} ${Jc(i.amount)}`}function vg(i){return `${x$1(i.currency)} ${i.perBaseUnit().toFixed(4)} por ${i.per.unit}`}function Jc(i){return String(Number(i.toFixed(4)))}var oo=class i extends La$1{async execute({lines:e}){let t=0;return {items:e.map(r=>{let s=this.lineCost(r);return s!==null&&(t+=s),{cost:s===null?"":sa(s)}}),total:sa(t)}}lineCost(e){let{purchasePrice:t,quantity:n}=e;return !t||!n||n.value<=0||n.unit!==t.per.unit?null:D$1.of(t.amount,h.of(t.per.value,t.per.unit)).costFor(h.of(n.value,n.unit))}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var ao=class i extends La$1{supplies=g(m);bus=g(kv$1);log=g(xm$1).scoped("recipe-book/save-supply");async execute({id:e,name:t,usage:n,purchasePrice:r}){this.log.debug("ejecutando",{sobreId:e??null,usage:n??null});let s=await this.supplies.byName(t),o=e?await this.supplies.byId(new E$1(e)):s;if(s&&!(o&&s.id.equals(o.id)))throw this.log.debug("nombre ya tomado por otro insumo, se rechaza",{tomadoPor:s.id.value}),new Error("Ya existe un insumo con ese nombre");this.log.debug(o?"insumo existente, se reutiliza su identidad":"insumo nuevo",o?{id:o.id.value,baseUnit:o.baseUnit}:void 0);let a=D$1.of(r.amount,h.of(r.per.value,r.per.unit),r.currency??o?.purchasePrice.currency??"PEN"),l=w$1.create(o?.id??(e?new E$1(e):this.supplies.nextIdentity()),t,o?.baseUnit??r.per.unit,n??o?.usage??"recipe",a);return await this.supplies.save(l),await this.bus.publish(l.pullEvents()),this.log.debug("hecho",{id:l.id.value,baseUnit:l.baseUnit}),{id:l.id.value}}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};var NS=["control"];function FS(i,e){if(i&1&&(bo$1(0,"span",2),ww$1(1),To$1()),i&2){let t=Pl$1();ll$1(),rm$1(t.symbol());}}var LS=0,yg="flex items-center gap-1 w-full min-h-11 box-border px-4 rounded-md bg-surface-card border font-body text-base text-body cursor-text transition duration-base ease-out hover:border-border-strong has-[:disabled]:bg-surface-sunken has-[:disabled]:text-muted has-[:disabled]:cursor-not-allowed motion-reduce:transition-none",lo=class i{field=g(fn,{optional:true});symbol=Ct("S/");placeholder=Ct("0.00");ariaLabel=Ct("");invalid=Ct(false,{transform:ta$1});disabled=Ct(false,{transform:ta$1});seamless=Ct(false,{transform:ta$1});paper=Ct(false,{transform:ta$1});control=Ej.required("control");fallbackId=`migo-currency-input-${LS++}`;value=q("");disabledByForm=q(false);controlId=It(()=>this.field?.controlId??this.fallbackId);describedBy=It(()=>this.field?.describedBy()??null);isInvalid=It(()=>(this.field?.invalid()??false)||this.invalid());isDisabled=It(()=>this.disabledByForm()||this.disabled());boxClasses=It(()=>{if(this.paper()){let e="flex items-center gap-1 w-full min-h-11 box-border px-3 bg-transparent font-body text-base cursor-text transition duration-base ease-out border-b border-border-subtle focus-within:bg-surface-warm motion-reduce:transition-none";return this.isInvalid()?`${e} text-error`:`${e} text-body`}if(this.seamless()){let e="flex items-center gap-1 w-full min-h-11 box-border px-3 bg-transparent font-body text-base cursor-text transition duration-base ease-out focus-within:bg-surface-sunken motion-reduce:transition-none";return this.isInvalid()?`${e} text-error`:`${e} text-body`}return this.isInvalid()?`${yg} border-error focus-within:border-error focus-within:shadow-focus-error`:`${yg} border-border-subtle focus-within:border-brand focus-within:shadow-focus`});onChange=()=>{};onTouched=()=>{};focusFromBox(e){e.target!==this.control().nativeElement&&(e.preventDefault(),this.control().nativeElement.focus());}onKeydown(e){e.key.length===1&&(/[\d.,]/.test(e.key)||e.preventDefault());}onInput(e){let t=e.target,n=OS(t.value);n!==t.value&&(t.value=n),this.value.set(n),this.onChange(n);}onBlur(){this.onTouched();}writeValue(e){this.value.set(e??"");}registerOnChange(e){this.onChange=e;}registerOnTouched(e){this.onTouched=e;}setDisabledState(e){this.disabledByForm.set(e);}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-currency-input"]],viewQuery:function(t,n){t&1&&qg$1(n.control,NS,5),t&2&&tw$1();},hostAttrs:[1,"block"],inputs:{symbol:[1,"symbol"],placeholder:[1,"placeholder"],ariaLabel:[1,"ariaLabel"],invalid:[1,"invalid"],disabled:[1,"disabled"],seamless:[1,"seamless"],paper:[1,"paper"]},features:[Aw$1([{provide:$n,useExisting:Fi(()=>i),multi:true}])],decls:4,vars:10,consts:[["control",""],[3,"mousedown"],["aria-hidden","true",1,"shrink-0","text-base","text-muted","select-none"],["type","text","inputmode","decimal",1,"field-sizing-content","min-w-10","max-w-full","bg-transparent","border-0","p-0","font-body","text-base","text-body","placeholder:text-placeholder","focus:outline-none","disabled:cursor-not-allowed",3,"keydown","input","blur","id","value","placeholder","disabled"]],template:function(t,n){t&1&&(bo$1(0,"span",1),Ug$1("mousedown",function(s){return n.focusFromBox(s)}),Al$1(1,FS,2,1,"span",2),bo$1(2,"input",3,0),Ug$1("keydown",function(s){return n.onKeydown(s)})("input",function(s){return n.onInput(s)})("blur",function(){return n.onBlur()}),To$1()()),t&2&&(Fl$1(n.boxClasses()),ll$1(),xl(n.symbol()?1:-1),ll$1(),Hg$1("id",n.controlId())("value",n.value())("placeholder",n.placeholder())("disabled",n.isDisabled()),Nn("aria-label",n.field?null:n.ariaLabel()||null)("aria-invalid",n.isInvalid()?true:null)("aria-describedby",n.describedBy()));},encapsulation:2})};function OS(i){let e=i.replace(/[^\d.,]/g,""),t=e.search(/[.,]/);if(t===-1)return e;let n=e.slice(0,t+1),r=e.slice(t+1).replace(/[.,]/g,"");return n+r}var Qc=class i extends La$1{async execute({purchasePrice:e,quantity:t}){let n=D$1.of(e.amount,h.of(e.per.value,e.per.unit)),r="";return t&&t.value>0&&t.unit===n.per.unit&&(r=sa(n.costFor(h.of(t.value,t.unit)))),{cost:r,perBaseUnitLabel:vg(n),reference:_g(n)}}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};function kS(i,e){if(i&1&&ww$1(0),i&2){let t=Pl$1();jl$1(" Te cuesta ",t.perBaseUnitLabel()," ");}}var eu=class i{fb=g(so);preview=g(Qc);log=g(xm$1).scoped("ui/price-capture");name=Ct("");initial=Ct(null);kind=Ct("any");confirmed=Dj();cancelled=Dj();form=this.fb.nonNullable.group({presentation:[""],price:[""]});unitToken=q("");perBaseUnitLabel=q("");tick=xr(this.form.valueChanges,{initialValue:null});presentationUnit=It(()=>(this.tick(),ji.parse(this.rawPresentation(),this.kind()).unit));canConfirm=It(()=>(this.tick(),this.purchase()!==null));constructor(){this.form.valueChanges.pipe(Wc(g(we))).subscribe(()=>{this.recompute();});}ngOnInit(){let e=this.initial();if(!e)return;this.unitToken.set(e.per.unit==="u"?"u":e.per.value>=1e3?"k":"g");let t=e.per.unit==="g"&&e.per.value>=1e3?e.per.value/1e3:e.per.value;this.form.setValue({presentation:String(t),price:String(e.amount)});}onEscape(){this.cancelled.emit();}onEnterPrice(e){e.preventDefault(),this.confirmPrice();}setUnit(e){let t=this.kind();t!=="count"&&(t==="mass"&&e==="u"||this.unitToken.set(e));}confirmPrice(){let e=this.purchase();e&&this.confirmed.emit(e);}rawPresentation(){let e=this.form.controls.presentation.value;return this.kind()==="count"?e:e+this.unitToken()}purchase(){let e=ji.parse(this.rawPresentation(),this.kind()),t=Number(this.form.controls.price.value.replace(",","."));return !e.quantity||!Number.isFinite(t)||t<=0?null:{amount:t,per:{value:e.quantity.value,unit:e.baseUnit},currency:"PEN"}}async recompute(){let e=this.purchase();if(!e){this.perBaseUnitLabel.set("");return}try{let{perBaseUnitLabel:t}=await this.preview.execute({purchasePrice:e});this.perBaseUnitLabel.set(t);}catch(t){this.log.error("no se pudo calcular el costo por unidad base",t);}}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-price-capture"]],hostBindings:function(t,n){t&1&&Ys$1("keydown.escape",function(){return n.onEscape()});},inputs:{name:[1,"name"],initial:[1,"initial"],kind:[1,"kind"]},outputs:{confirmed:"confirmed",cancelled:"cancelled"},decls:17,vars:5,consts:[["variant","elevated","elevation","lg",1,"w-80"],["cdkTrapFocus","","cdkTrapFocusAutoCapture","",1,"flex","flex-col","gap-3",3,"ngSubmit","formGroup"],[1,"m-0","text-sm","font-semibold","text-heading"],[1,"flex","items-end","gap-3"],["label","Compras",1,"flex-1"],["formControlName","presentation","placeholder","1","ariaLabel","Presentaci\xF3n de compra",3,"unitToken","unit"],["label","Precio",1,"flex-1"],["formControlName","price","ariaLabel","Precio de la compra",3,"keydown.enter"],["aria-live","polite",1,"m-0","min-h-5","text-caption","text-muted"],["migo-button","","variant","ghost","size","sm","type","button",3,"click"],["migo-button","","size","sm","type","button",3,"click","disabled"]],template:function(t,n){t&1&&(Rs$1(0,"migo-card",0)(1,"migo-card-body")(2,"form",1),Ys$1("ngSubmit",function(){return n.confirmPrice()}),Rs$1(3,"p",2),ww$1(4),Ol$1(),Rs$1(5,"div",3)(6,"migo-form-field",4)(7,"migo-unit-input",5),Ys$1("unitToken",function(s){return n.setUnit(s)}),Ol$1(),xI(),Ol$1(),Rs$1(8,"migo-form-field",6)(9,"migo-currency-input",7),Ys$1("keydown.enter",function(s){return n.onEnterPrice(s)}),Ol$1(),xI(),Ol$1()(),Rs$1(10,"p",8),Al$1(11,kS,1,1),Ol$1()()(),Rs$1(12,"migo-card-footer")(13,"button",9),Ys$1("click",function(){return n.cancelled.emit()}),ww$1(14," Cancelar "),Ol$1(),Rs$1(15,"button",10),Ys$1("click",function(){return n.confirmPrice()}),ww$1(16," Listo "),Ol$1()()()),t&2&&(ll$1(2),Pg("formGroup",n.form),ll$1(2),jl$1('\xBFC\xF3mo compras "',n.name(),'"?'),ll$1(3),Pg("unit",n.presentationUnit()),kI(),ll$1(2),kI(),ll$1(2),xl(n.perBaseUnitLabel()?11:-1),ll$1(4),Pg("disabled",!n.canConfirm()));},dependencies:[br,dg,yr,ro,ns,ts,ku,b$1,N,B,S,fn,lo,Mr],encapsulation:2})};function US(i,e){if(i&1){let t=ZC();Rs$1(0,"migo-combobox",12),Ys$1("selected",function(){Qf$1(t);let r=Pl$1().rowIndex,s=Pl$1();return Kf$1(s.onSupplyPicked(r))}),Ol$1(),xI();}if(i&2){let t=Pl$1().rowIndex,n=Pl$1();Pg("suggestions",n.supplyNames())("invalid",n.lineInvalids()[t]?.name??false),kI();}}function BS(i,e){if(i&1){let t=ZC();Rs$1(0,"migo-unit-input",13),Ys$1("unitToken",function(r){Qf$1(t);let s=Pl$1().rowIndex,o=Pl$1();return Kf$1(o.setLineUnit(s,r))}),Ol$1(),xI();}if(i&2){let t=Pl$1().rowIndex,n=Pl$1();Pg("unit",n.lineUnits()[t])("invalid",n.lineInvalids()[t]?.quantity??false),kI();}}function VS(i,e){if(i&1){let t=ZC();Rs$1(0,"button",16,1),Ys$1("click",function(){Qf$1(t);let r=nw$1(1),s=Pl$1(2).rowIndex,o=Pl$1();return Kf$1(o.openPrice(s,r))}),ww$1(2),Ol$1();}if(i&2){let t=Pl$1(2).rowIndex,n=Pl$1();ll$1(2),jl$1(" ",n.costViews()[t].cost||"\u2014"," ");}}function zS(i,e){if(i&1){let t=ZC();Rs$1(0,"button",17,1),Ys$1("click",function(){Qf$1(t);let r=nw$1(1),s=Pl$1(2).rowIndex,o=Pl$1();return Kf$1(o.openPrice(s,r))}),ww$1(2," \uFF0B precio "),Ol$1();}}function HS(i,e){if(i&1&&Al$1(0,VS,3,1,"button",14)(1,zS,3,0,"button",15),i&2){let t=Pl$1(),n=t.$implicit,r=t.rowIndex,s=Pl$1();xl(s.costViews()[r]?.hasPrice?0:n.controls.name.value.trim()?1:-1);}}function GS(i,e){if(i&1){let t=ZC();Rs$1(0,"button",19),Ys$1("click",function(){Qf$1(t);let r=Pl$1(2).rowIndex;Pl$1();let s=nw$1(4);return Kf$1(s.remove(r))}),Ws$1(1,"migo-icon",20),Ol$1();}}function WS(i,e){if(i&1&&Al$1(0,GS,2,0,"button",18),i&2){let t=Pl$1().rowIndex,n=Pl$1();xl(t<n.lineControls().length-1?0:-1);}}function XS(i,e){if(i&1&&(Rs$1(0,"div",9),Al$1(1,US,1,2,"migo-combobox",10)(2,BS,1,2,"migo-unit-input",11)(3,HS,2,1)(4,WS,1,1),Ol$1()),i&2){let t,n=e.$implicit,r=e.colIndex;Pg("formGroup",n),ll$1(),xl((t=r)===0?1:t===1?2:t===2?3:t===3?4:-1);}}function qS(i,e){if(i&1&&(Rs$1(0,"div",5)(1,"span",3),ww$1(2,"Costo de materiales"),Ol$1(),Rs$1(3,"span",21),ww$1(4),Ol$1()()),i&2){let t=Pl$1();ll$1(4),rm$1(t.materialTotal());}}function YS(i,e){if(i&1&&(Rs$1(0,"p",7),ww$1(1),Ol$1()),i&2){let t=Pl$1();ll$1(),rm$1(t.errorMessage());}}function $S(i,e){if(i&1){let t=ZC();Rs$1(0,"app-price-capture",23),Ys$1("confirmed",function(r){Qf$1(t);let s=Pl$1(2);return Kf$1(s.onPriceConfirmed(r))})("cancelled",function(){Qf$1(t);let r=Pl$1(2);return Kf$1(r.closePrice())}),Ol$1();}if(i&2){let t=Pl$1(2);Pg("name",t.activeName())("initial",t.activePurchase())("kind",t.activeKind());}}function jS(i,e){if(i&1){let t=ZC();kg$1(0,$S,1,3,"ng-template",22),Ys$1("backdropClick",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.closePrice())})("detach",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.closePrice())});}i&2&&Pg("cdkConnectedOverlayOrigin",e)("cdkConnectedOverlayOpen",true)("cdkConnectedOverlayHasBackdrop",true);}var co=class i{fb=g(so);previewCost=g(oo);saveSupply=g(ao);log=g(xm$1).scoped("ui/supply-grid");supplies=Ct([]);initialLines=Ct([]);columns=[{name:"Ingrediente"},{name:"Cantidad",size:"fit",align:"center"},{name:"Costo",size:"fit",align:"center"},{name:"Acciones",size:"fit",align:"center"}];lines=this.fb.array([this.newLine()]);submitted=q(false);errorMessage=q("");costViews=q([]);materialTotal=q("");tableRef=Ej(Sr);activeRow=q(null);activeOrigin=q(null);valueTick=xr(this.lines.valueChanges,{initialValue:null});interaction=q(0);optionsByName=It(()=>new Map(this.supplies().map(e=>[e.name.trim().toLowerCase(),e])));constructor(){this.lines.valueChanges.pipe(Wc(g(we))).subscribe(()=>{this.ensureTrailingRow(),this.recomputeCosts();}),this.recomputeCosts();}ngOnInit(){let e=this.initialLines();if(e.length!==0){this.lines.clear({emitEvent:false});for(let t of e)this.lines.push(this.seededLine(t),{emitEvent:false});this.lines.push(this.newLine());}}lineControls=It(()=>(this.valueTick(),[...this.lines.controls]));supplyNames=It(()=>{this.valueTick();let e=new Map;for(let t of this.supplies())e.set(t.name.toLowerCase(),t.name);for(let t of this.lines.controls){let n=t.controls.name.value.trim();n&&e.set(n.toLowerCase(),n);}return [...e.values()]});lineUnits=It(()=>(this.valueTick(),this.lines.controls.map(e=>this.measureOf(e).unit)));lineInvalids=It(()=>(this.valueTick(),this.submitted(),this.interaction(),this.lines.controls.map(e=>{let t=e.controls.name.value.trim(),n=e.controls.quantity.value.trim(),r=!!t||!!n,s=this.submitted()||e.controls.name.touched||e.controls.quantity.touched;return !r||!s?{name:false,quantity:false}:{name:!t,quantity:!this.measureOf(e).isValid}})));activeName=It(()=>{this.valueTick();let e=this.activeRow();return e===null?"":this.lines.at(e)?.controls.name.value.trim()??""});activePurchase=It(()=>{this.valueTick();let e=this.activeRow();if(e===null)return null;let t=this.lines.at(e);return t?this.purchaseFor(t):null});activeKind=It(()=>{this.valueTick();let e=this.activeRow();if(e===null)return "any";let t=this.lines.at(e);if(!t)return "any";let n=this.measureOf(t);return n.isValid?n.baseUnit==="u"?"count":"mass":"any"});markSubmitted(){this.submitted.set(true),this.lines.markAllAsTouched(),this.interaction.update(e=>e+1);}collect(){this.errorMessage.set(""),this.markSubmitted();let e=this.lines.controls.filter(n=>n.controls.name.value.trim()||n.controls.quantity.value.trim());if(e.length===0)return this.errorMessage.set("Agrega al menos un ingrediente."),null;let t=[];for(let n of e){let r=n.controls.name.value.trim(),s=this.measureOf(n),o=this.purchaseFor(n);if(!r||!s.quantity)return this.errorMessage.set("Revisa los ingredientes marcados."),null;if(!o)return this.errorMessage.set(`Falta el precio de "${r}". T\xF3calo en la columna Costo.`),null;if(s.baseUnit!==o.per.unit)return this.errorMessage.set(`La unidad de "${r}" no coincide con c\xF3mo lo compras.`),null;let a=this.supplyIdOf(n);if(!a)return this.errorMessage.set(`No se pudo guardar el insumo "${r}". Vuelve a fijar su precio.`),null;t.push({supplyId:a,name:r,baseUnit:o.per.unit,quantity:s.quantity.value,purchase:o});}return t}setLineUnit(e,t){this.lines.at(e)?.controls.unit.setValue(t);}onSupplyPicked(e){setTimeout(()=>this.tableRef()?.focusCell(e,1));}removeLine(e){this.lines.length>1&&this.lines.removeAt(e),this.ensureTrailingRow();}openPrice(e,t){this.activeOrigin.set(t),this.activeRow.set(e);}closePrice(){let e=this.activeOrigin();this.activeRow.set(null),this.activeOrigin.set(null),setTimeout(()=>e?.focus());}async onPriceConfirmed(e){let t=this.activeRow(),n=t===null?null:this.lines.at(t);if(t===null||!n)return;n.controls.purchase.setValue(e),this.activeRow.set(null),this.activeOrigin.set(null),setTimeout(()=>this.tableRef()?.focusCell(t+1,0));let r=n.controls.name.value.trim();if(!r){this.log.debug("l\xEDnea sin nombre, no se guarda el insumo");return}this.log.debug("guardar insumo desde la grilla \u25B6",{nuevo:!this.supplyIdOf(n)});try{let{id:s}=await this.saveSupply.execute({id:this.supplyIdOf(n)||void 0,name:r,usage:"recipe",purchasePrice:e});n.controls.supplyId.setValue(s),this.log.debug("guardar insumo desde la grilla \u2714",{id:s});}catch(s){this.log.warn("no se pudo guardar el insumo desde la grilla",s),this.errorMessage.set(s instanceof Error?s.message:"No se pudo guardar el insumo.");}}bumpInteraction(){this.interaction.update(e=>e+1);}supplyIdOf(e){let t=e.controls.supplyId.value;return t||(this.optionsByName().get(e.controls.name.value.trim().toLowerCase())?.id??"")}purchaseFor(e){let t=e.controls.purchase.value;if(t)return t;let n=this.optionsByName().get(e.controls.name.value.trim().toLowerCase());return n?n.purchase:null}kindFor(e){let t=this.purchaseFor(e);return t?t.per.unit==="u"?"count":"mass":"any"}measureOf(e){let t=this.kindFor(e),n=e.controls.quantity.value,r=t==="count"?n:n+e.controls.unit.value;return ji.parse(r,t)}async recomputeCosts(){try{await this.computeCosts();}catch(e){this.log.error("no se pudieron recalcular los costos",e);}}async computeCosts(){let e=this.lines.controls.map(n=>n.controls.name.value.trim()?this.purchaseFor(n):null),t=await this.previewCost.execute({lines:this.lines.controls.map((n,r)=>{let s=this.measureOf(n);return {purchasePrice:e[r],quantity:s.quantity?{value:s.quantity.value,unit:s.baseUnit}:void 0}})});this.costViews.set(t.items.map((n,r)=>({hasPrice:e[r]!==null,cost:n.cost}))),this.materialTotal.set(e.some(n=>n!==null)?t.total:"");}ensureTrailingRow(){let e=this.lines.at(this.lines.length-1);e&&(e.controls.name.value.trim()||e.controls.quantity.value.trim())&&this.lines.push(this.newLine());}newLine(){return this.fb.nonNullable.group({supplyId:[""],name:[""],quantity:[""],unit:[""],purchase:this.fb.nonNullable.control(null)})}seededLine(e){let t=ZS(e.quantity,e.baseUnit);return this.fb.nonNullable.group({supplyId:[e.supplyId],name:[e.name],quantity:[t.value],unit:[t.unit],purchase:this.fb.nonNullable.control(null)})}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-supply-grid"]],viewQuery:function(t,n){t&1&&qg$1(n.tableRef,Sr,5),t&2&&tw$1();},hostBindings:function(t,n){t&1&&Ys$1("focusout",function(){return n.bumpInteraction()});},inputs:{supplies:[1,"supplies"],initialLines:[1,"initialLines"]},decls:11,vars:5,consts:[["table",""],["costCell",""],[1,"flex","flex-col","gap-2"],[1,"font-body","text-sm","font-semibold","text-body"],["ariaLabel","Ingredientes de la receta",3,"removeRow","columns","rows"],[1,"flex","items-center","justify-between","border-border-subtle","pt-2"],[1,"m-0","text-caption","text-muted"],["role","alert",1,"m-0","text-caption","font-medium","text-error"],["cdkConnectedOverlay","","cdkConnectedOverlayBackdropClass","cdk-overlay-transparent-backdrop",3,"cdkConnectedOverlayOrigin","cdkConnectedOverlayOpen","cdkConnectedOverlayHasBackdrop"],[3,"formGroup"],["seamless","","formControlName","name","ariaLabel","Ingrediente",3,"suggestions","invalid"],["seamless","","formControlName","quantity","ariaLabel","Cantidad",3,"unit","invalid"],["seamless","","formControlName","name","ariaLabel","Ingrediente",3,"selected","suggestions","invalid"],["seamless","","formControlName","quantity","ariaLabel","Cantidad",3,"unitToken","unit","invalid"],["type","button","title","Toca para ver o cambiar c\xF3mo compras el insumo",1,"px-3","py-1","text-base","text-body","rounded-sm","hover:underline","focus-visible:shadow-focus","focus-visible:outline-none"],["type","button",1,"px-3","py-1","text-caption","font-medium","text-brand","rounded-sm","focus-visible:shadow-focus","focus-visible:outline-none"],["type","button","title","Toca para ver o cambiar c\xF3mo compras el insumo",1,"px-3","py-1","text-base","text-body","rounded-sm","hover:underline","focus-visible:shadow-focus","focus-visible:outline-none",3,"click"],["type","button",1,"px-3","py-1","text-caption","font-medium","text-brand","rounded-sm","focus-visible:shadow-focus","focus-visible:outline-none",3,"click"],["migo-button","","variant","ghost","size","xs","type","button","aria-label","Quitar fila"],["migo-button","","variant","ghost","size","xs","type","button","aria-label","Quitar fila",3,"click"],["icon-leading","","name","mat:close","size","sm"],[1,"font-body","text-base","font-semibold","text-heading"],["cdkConnectedOverlay","","cdkConnectedOverlayBackdropClass","cdk-overlay-transparent-backdrop",3,"backdropClick","detach","cdkConnectedOverlayOrigin","cdkConnectedOverlayOpen","cdkConnectedOverlayHasBackdrop"],[3,"confirmed","cancelled","name","initial","kind"]],template:function(t,n){if(t&1&&(Rs$1(0,"div",2)(1,"span",3),ww$1(2,"Ingredientes"),Ol$1(),Rs$1(3,"migo-table",4,0),Ys$1("removeRow",function(s){return n.removeLine(s)}),kg$1(5,XS,5,2,"ng-template"),Ol$1(),Al$1(6,qS,5,1,"div",5),Rs$1(7,"p",6),ww$1(8," Toca un costo para ver o cambiar c\xF3mo compras el insumo. "),Ol$1(),Al$1(9,YS,2,1,"p",7),Ol$1(),Al$1(10,jS,1,3,null,8)),t&2){let r;ll$1(3),Pg("columns",n.columns)("rows",n.lineControls()),ll$1(3),xl(n.materialTotal()?6:-1),ll$1(3),xl(n.errorMessage()?9:-1),ll$1(),xl((r=n.activeRow()!==null&&n.activeOrigin())?10:-1,r);}},dependencies:[br,yr,ro,ns,ts,Ji,Nr,Mr,Zc,Sr,S,xv$1,eu],encapsulation:2})};function ZS(i,e){return e==="u"?{value:String(i),unit:"u"}:i>=1e3?{value:String(i/1e3),unit:"k"}:{value:String(i),unit:"g"}}function KS(i,e){i&1&&(Rs$1(0,"p",10),ww$1(1),Ol$1()),i&2&&(ll$1(),rm$1(e));}function JS(i,e){if(i&1){let t=ZC();Rs$1(0,"span",11),ww$1(1),Ol$1(),Rs$1(2,"button",12),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.keepRecipe())}),ww$1(3," Conservar "),Ol$1(),Rs$1(4,"button",13),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.removeRecipe())}),ww$1(5," S\xED, borrar "),Ol$1();}if(i&2){let t=Pl$1();ll$1(),jl$1(" Se borrar\xE1 \xAB",t.data.recipe?.name,"\xBB. "),ll$1(3),Pg("loading",t.deleting());}}function QS(i,e){if(i&1){let t=ZC();Rs$1(0,"button",17),Ys$1("click",function(){Qf$1(t);let r=Pl$1(2);return Kf$1(r.askToDelete())}),Ws$1(1,"migo-icon",18),Rs$1(2,"span"),ww$1(3,"Borrar"),Ol$1()();}}function ew(i,e){if(i&1){let t=ZC();Al$1(0,QS,4,0,"button",14),Rs$1(1,"button",12),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.cancel())}),ww$1(2,"Cancelar"),Ol$1(),Rs$1(3,"button",15),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.save())}),Ws$1(4,"migo-icon",16),Rs$1(5,"span"),ww$1(6,"Guardar"),Ol$1()();}if(i&2){let t=Pl$1();xl(t.data.recipe?0:-1),ll$1(3),Pg("disabled",!t.canSave()||t.saving());}}var tu=class i{ref=g(Si);data=g(ys);saveRecipe=g($c);saveProperty=g(jc);deleteRecipe=g(Yc);log=g(xm$1).scoped("ui/recipe-form");grid=Ej.required(co);name=new to(this.data.recipe?.name??"",{nonNullable:true});nameValue=xr(this.name.valueChanges,{initialValue:this.name.value});propertyTypes=It(()=>{let e=this.data.capacities.filter(n=>n.group==="portions"),t=this.data.capacities.filter(n=>n.group==="mold");return [{key:"flavor",label:"Sabor",values:this.data.flavors.map(n=>n.label),allowCreate:true},{key:"portions",label:"Porciones",values:e.map(n=>n.label),allowCreate:true,extraField:{label:"Factor de escalado (1 = base, 2 = doble)",placeholder:"Ej. 2",reference:e.map(n=>({label:n.label,extra:n.factor}))}},{key:"mold",label:"Molde",values:t.map(n=>n.label),allowCreate:true,extraField:{label:"Factor de escalado (1 = base, 0.5 = mitad)",placeholder:"Ej. 1/8 o 0.2",reference:t.map(n=>({label:n.label,extra:n.factor}))}}]});propertyValue=q(m$1(m$1(m$1({},this.data.recipe?.flavorLabel?{flavor:this.data.recipe.flavorLabel}:{}),this.data.recipe?.portionsLabel?{portions:this.data.recipe.portionsLabel}:{}),this.data.recipe?.moldLabel?{mold:this.data.recipe.moldLabel}:{}));createdPropertyIds=q({});saving=q(false);errorMessage=q("");confirmingDelete=q(false);deleting=q(false);canSave=It(()=>this.nameValue().trim().length>0);supplyOptions=It(()=>this.data.supplies.map(e=>({id:e.id.value,name:e.name,baseUnit:e.baseUnit,purchase:{amount:e.purchasePrice.amount,per:{value:e.purchasePrice.per.value,unit:e.purchasePrice.per.unit},currency:e.purchasePrice.currency}})));initialLines=It(()=>this.data.recipe?.lines??[]);cancel(){this.ref.close();}async onPropertyCreated(e){let t=e.typeKey,n=e.value.trim();this.log.debug("crear caracter\xEDstica \u25B6",{kind:t,conFactor:e.extra!==void 0});try{let{id:r}=await this.saveProperty.execute({kind:t,label:n,factor:e.extra});this.createdPropertyIds.update(s=>k(m$1({},s),{[bg(t,n)]:r})),this.log.debug("crear caracter\xEDstica \u2714",{kind:t,id:r});}catch(r){this.log.warn("no se pudo guardar la caracter\xEDstica",r,{kind:t}),this.errorMessage.set(r instanceof Error?r.message:"No se pudo guardar la caracter\xEDstica.");}}askToDelete(){this.errorMessage.set(""),this.confirmingDelete.set(true);}keepRecipe(){this.confirmingDelete.set(false);}async removeRecipe(){let e=this.data.recipe;if(e){this.log.debug("borrar receta \u25B6",{id:e.id}),this.deleting.set(true),this.errorMessage.set("");try{await this.deleteRecipe.execute({id:e.id}),this.log.debug("borrar receta \u2714",{id:e.id}),this.ref.close({id:e.id,categoryId:this.data.category.id,name:e.name,deleted:!0});}catch(t){this.log.warn("no se pudo borrar la receta",t,{id:e.id}),this.errorMessage.set(t instanceof Error?t.message:"No se pudo borrar la receta."),this.confirmingDelete.set(false);}finally{this.deleting.set(false);}}}async save(){let e=this.name.value.trim();if(!e){this.log.debug("guardar receta: sin nombre, no se guarda");return}let t=this.grid().collect();if(!t){this.log.debug("guardar receta: la grilla rechaz\xF3 las l\xEDneas, no se guarda");return}this.log.debug("guardar receta \u25B6",{editando:this.data.recipe?.id!==void 0,lineas:t.length}),this.saving.set(true),this.errorMessage.set("");try{let{id:n}=await this.saveRecipe.execute({id:this.data.recipe?.id,categoryId:this.data.category.id,name:e,ingredients:t.map(r=>({supplyId:r.supplyId,quantity:r.quantity,unit:r.baseUnit})),flavorId:this.propertyId("flavor"),portionsCapacityId:this.propertyId("portions"),moldCapacityId:this.propertyId("mold")});this.log.debug("guardar receta \u2714",{id:n}),this.ref.close({id:n,categoryId:this.data.category.id,name:e});}catch(n){this.log.warn("no se pudo guardar la receta",n,{editando:!!this.data.recipe?.id}),this.errorMessage.set(n instanceof Error?n.message:"No se pudo guardar la receta.");}finally{this.saving.set(false);}}propertyId(e){let t=this.propertyValue()[e]?.trim()??"";if(!t)return null;let n=this.createdPropertyIds()[bg(e,t)];if(n)return n;let r=t.toLowerCase();return e==="flavor"?this.data.flavors.find(s=>s.label.toLowerCase()===r)?.id.value??null:this.data.capacities.find(s=>s.group===e&&s.label.toLowerCase()===r)?.id.value??null}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-recipe-form"]],viewQuery:function(t,n){t&1&&qg$1(n.grid,co,5),t&2&&tw$1();},hostAttrs:[1,"contents"],decls:20,vars:9,consts:[["fill",""],["card-icon","","name","mat:layers","size","lg","color","brand"],["card-actions","","migo-button","","variant","ghost","type","button","aria-label","Cerrar",3,"click"],["icon-leading","","name","mat:close","size","sm"],[1,"flex","flex-col","gap-4"],["label","Nombre"],["placeholder","Nombre de la receta",3,"formControl"],["label","Caracter\xEDsticas (opcional)"],["placeholder","A\xF1ade sabor, porciones y/o molde\u2026",3,"valueChange","created","types","value"],[3,"supplies","initialLines"],["role","alert",1,"m-0","text-sm","text-error"],[1,"me-auto","font-body","text-sm","text-body"],["migo-button","","variant","ghost","type","button",3,"click"],["migo-button","","variant","danger","type","button",3,"click","loading"],["migo-button","","variant","ghost","type","button",1,"me-auto"],["migo-button","","type","button",3,"click","disabled"],["icon-leading","","name","mat:check","size","sm"],["migo-button","","variant","ghost","type","button",1,"me-auto",3,"click"],["icon-leading","","name","mat:delete","size","sm"]],template:function(t,n){if(t&1&&(Rs$1(0,"migo-card",0)(1,"migo-card-header"),Ws$1(2,"migo-icon",1),Rs$1(3,"migo-card-title"),ww$1(4),Ol$1(),Rs$1(5,"migo-card-subtitle"),ww$1(6),Ol$1(),Rs$1(7,"button",2),Ys$1("click",function(){return n.cancel()}),Ws$1(8,"migo-icon",3),Ol$1()(),Rs$1(9,"migo-card-body")(10,"div",4)(11,"migo-form-field",5),Ws$1(12,"migo-input",6),xI(),Ol$1(),Rs$1(13,"migo-form-field",7)(14,"migo-select-tag",8),Ys$1("valueChange",function(s){return n.propertyValue.set(s)})("created",function(s){return n.onPropertyCreated(s)}),Ol$1()(),Ws$1(15,"app-supply-grid",9),Al$1(16,KS,2,1,"p",10),Ol$1()(),Rs$1(17,"migo-card-footer"),Al$1(18,JS,6,2)(19,ew,7,2),Ol$1()()),t&2){let r;ll$1(4),rm$1(n.data.recipe?n.data.recipe.name:"Nueva receta"),ll$1(2),rm$1(n.data.category.name),ll$1(6),Pg("formControl",n.name),kI(),ll$1(2),Pg("types",n.propertyTypes())("value",n.propertyValue()),ll$1(),Pg("supplies",n.supplyOptions())("initialLines",n.initialLines()),ll$1(),xl((r=n.errorMessage())?16:-1,r),ll$1(2),xl(n.confirmingDelete()?18:19);}},dependencies:[br,yr,Rh,b$1,E,j,w,N,B,S,xv$1,fn,Xc,qc,co],encapsulation:2})};function bg(i,e){return `${i}:${e.toLowerCase()}`}var tw=["control"];function nw(i,e){if(i&1&&(bo$1(0,"span",4)(1,"span",5),ww$1(2),To$1(),bo$1(3,"span",6),ww$1(4),To$1()()),i&2){let t=Pl$1();Fl$1(t.ghostClasses()),ll$1(2),rm$1(t.value()),ll$1(2),rm$1(t.ghostSuffix());}}var iw=0,Ph="w-full min-h-11 box-border bg-transparent font-body text-base transition duration-base ease-out placeholder:text-placeholder focus:outline-none disabled:bg-surface-sunken disabled:text-muted disabled:cursor-not-allowed motion-reduce:transition-none",nu=class i{field=g(fn,{optional:true});suggestions=Ct([]);placeholder=Ct("");ariaLabel=Ct("");invalid=Ct(false,{transform:ta$1});disabled=Ct(false,{transform:ta$1});seamless=Ct(false,{transform:ta$1});paper=Ct(false,{transform:ta$1});control=Ej.required("control");fallbackId=`migo-autocomplete-${iw++}`;value=q("");disabledByForm=q(false);controlId=It(()=>this.field?.controlId??this.fallbackId);describedBy=It(()=>this.field?.describedBy()??null);isInvalid=It(()=>(this.field?.invalid()??false)||this.invalid());isDisabled=It(()=>this.disabledByForm()||this.disabled());controlClasses=It(()=>{if(this.paper()){let t=`${Ph} px-3 border-x-0 border-t-0 border-b border-border-subtle rounded-none focus:bg-surface-warm`;return this.isInvalid()?`${t} text-error`:`${t} text-body`}if(this.seamless()){let t=`${Ph} px-3 border-0 rounded-none focus:bg-surface-sunken`;return this.isInvalid()?`${t} text-error`:`${t} text-body`}let e=`${Ph} px-4 border rounded-md text-body hover:border-border-strong`;return this.isInvalid()?`${e} border-error focus:border-error focus:shadow-focus-error`:`${e} border-border-subtle focus:border-brand focus:shadow-focus`});ghostClasses=It(()=>{let e=this.seamless()||this.paper()?"px-3":"px-4",t=this.paper()?"border-x-0 border-t-0 border-b border-transparent":this.seamless()?"":"border border-transparent";return `absolute inset-0 flex items-center ${e} ${t} box-border font-body text-base whitespace-pre pointer-events-none`});bestMatch=It(()=>{let e=this.value().trim();if(!e)return null;let t=e.toLowerCase();return this.suggestions().find(n=>n.toLowerCase().startsWith(t)&&n.length>e.length)??null});ghostSuffix=It(()=>{let e=this.bestMatch();return e?e.slice(this.value().length):""});onChange=()=>{};onTouched=()=>{};onKeydown(e){let t=this.bestMatch();if(!t)return;let n=this.control().nativeElement,r=n.selectionStart===n.value.length&&n.selectionEnd===n.value.length;(e.key==="Enter"||e.key==="Tab"&&!e.shiftKey||e.key==="ArrowRight"&&r)&&(e.preventDefault(),e.stopPropagation(),this.commit(t));}onInput(e){let t=e.target.value;this.value.set(t),this.onChange(t);}onBlur(){this.onTouched();}commit(e){this.value.set(e),this.onChange(e);let t=this.control().nativeElement;t.value=e,t.setSelectionRange(e.length,e.length);}writeValue(e){this.value.set(e??"");}registerOnChange(e){this.onChange=e;}registerOnTouched(e){this.onTouched=e;}setDisabledState(e){this.disabledByForm.set(e);}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["migo-autocomplete"]],viewQuery:function(t,n){t&1&&qg$1(n.control,tw,5),t&2&&tw$1();},hostAttrs:[1,"block"],inputs:{suggestions:[1,"suggestions"],placeholder:[1,"placeholder"],ariaLabel:[1,"ariaLabel"],invalid:[1,"invalid"],disabled:[1,"disabled"],seamless:[1,"seamless"],paper:[1,"paper"]},features:[Aw$1([{provide:$n,useExisting:Fi(()=>i),multi:true}])],decls:4,vars:11,consts:[["control",""],[1,"relative","block"],["aria-hidden","true",3,"class"],["type","text","autocomplete","off","aria-autocomplete","inline",3,"keydown","input","blur","id","value","placeholder","disabled"],["aria-hidden","true"],[1,"invisible"],[1,"text-placeholder"]],template:function(t,n){t&1&&(bo$1(0,"span",1),Al$1(1,nw,5,4,"span",2),bo$1(2,"input",3,0),Ug$1("keydown",function(s){return n.onKeydown(s)})("input",function(s){return n.onInput(s)})("blur",function(){return n.onBlur()}),To$1()()),t&2&&(ll$1(),xl(n.ghostSuffix()?1:-1),ll$1(),Fl$1(Tw$1("relative ",n.controlClasses())),Hg$1("id",n.controlId())("value",n.value())("placeholder",n.placeholder())("disabled",n.isDisabled()),Nn("aria-label",n.field?null:n.ariaLabel()||null)("aria-invalid",n.isInvalid()?true:null)("aria-describedby",n.describedBy()));},encapsulation:2})};var iu=class i extends La$1{supplies=g(m);recipes=g(v);log=g(xm$1).scoped("recipe-book/delete-supply");async execute({id:e}){let t=new E$1(e);this.log.debug("borrar insumo \u25B6",{id:e});let n=(await this.recipes.all()).filter(r=>r.ingredients.some(s=>s.supplyId.equals(t)));if(n.length>0)throw this.log.debug("borrar insumo \u2718: lo usan recetas",{id:e,recetas:n.length}),new Error(`No se puede borrar: lo usa ${rw(n.map(r=>r.name))}.`);await this.supplies.delete(t),this.log.debug("borrar insumo \u2714",{id:e});}static \u0275fac=(()=>{let e;return function(n){return (e||(e=Os$1(i)))(n||i)}})();static \u0275prov=O$1({token:i,factory:i.\u0275fac,providedIn:"root"})};function rw(i){let e=i.map(r=>`\xAB${r}\xBB`);if(e.length===1)return `la receta ${e[0]}`;let t=e.slice(0,3).join(", "),n=e.length-3;return `${e.length} recetas (${n>0?`${t} y ${n} m\xE1s`:t})`}function sw(i,e){i&1&&Ws$1(0,"migo-icon",10);}function ow(i,e){if(i&1&&(Rs$1(0,"div",6),Ws$1(1,"migo-autocomplete",9),xI(),Al$1(2,sw,1,0,"migo-icon",10),Ol$1()),i&2){let t=Pl$1().$implicit,n=Pl$1();ll$1(),Pg("suggestions",n.supplyNames()),kI(),ll$1(),xl(t.controls.id.value&&n.recentlyAddedId()===t.controls.id.value?2:-1);}}function aw(i,e){if(i&1){let t=ZC();Rs$1(0,"migo-unit-input",11),Ys$1("unitToken",function(r){Qf$1(t);let s=Pl$1().rowIndex,o=Pl$1();return Kf$1(o.setLineUnit(s,r))}),Ol$1(),xI();}if(i&2){let t=Pl$1().rowIndex,n=Pl$1();Pg("unit",n.lineUnits()[t]),kI();}}function lw(i,e){i&1&&(Ws$1(0,"migo-currency-input",8),xI()),i&2&&kI();}function cw(i,e){if(i&1){let t=ZC();Rs$1(0,"button",14),Ys$1("click",function(){Qf$1(t);let r=Pl$1(3).rowIndex;Pl$1();let s=nw$1(4);return Kf$1(s.remove(r))}),ww$1(1," Borrar "),Ol$1();}if(i&2){let t=Pl$1(3).$implicit;Nn("aria-label","Confirmar borrar "+t.controls.name.value);}}function uw(i,e){if(i&1){let t=ZC();Rs$1(0,"button",15),Ys$1("click",function(){Qf$1(t);let r=Pl$1(3).$implicit,s=Pl$1();return Kf$1(s.pendingDeleteId.set(r.controls.id.value))}),Ws$1(1,"migo-icon",16),Ol$1();}if(i&2){let t=Pl$1(3).$implicit;Nn("aria-label","Borrar "+t.controls.name.value);}}function dw(i,e){if(i&1&&Al$1(0,cw,2,1,"button",12)(1,uw,2,1,"button",13),i&2){let t=Pl$1(2).$implicit,n=Pl$1();xl(n.pendingDeleteId()===t.controls.id.value?0:1);}}function hw(i,e){if(i&1&&Al$1(0,dw,2,1),i&2){let t=Pl$1().$implicit;xl(t.controls.id.value?0:-1);}}function pw(i,e){if(i&1){let t=ZC();Rs$1(0,"div",5),Ys$1("keydown.enter",function(r){let s=Qf$1(t).rowIndex,o=Pl$1();return Kf$1(o.onAddRowEnter(r,s))}),Al$1(1,ow,3,2,"div",6)(2,aw,1,1,"migo-unit-input",7)(3,lw,1,0,"migo-currency-input",8)(4,hw,1,1),Ol$1();}if(i&2){let t,n=e.$implicit,r=e.colIndex;Pg("formGroup",n),ll$1(),xl((t=r)===0?1:t===1?2:t===2?3:t===3?4:-1);}}function fw(i,e){if(i&1&&(Rs$1(0,"p",4),ww$1(1),Ol$1()),i&2){let t=Pl$1();ll$1(),rm$1(t.errorMessage());}}var ru=class i{fb=g(so);host=g(zt);saveSupply=g(ao);deleteSupply=g(iu);log=g(xm$1).scoped("ui/supply-list");supplies=Ct([]);changed=Dj();columns=[{name:"Insumo"},{name:"Empaque",size:96},{name:"Precio",size:96},{name:"Acciones",size:"fit"}];lines=this.fb.array([this.newLine()]);errorMessage=q("");pendingDeleteId=q(null);recentlyAddedId=q(null);valueTick=xr(this.lines.valueChanges,{initialValue:null});savedSnapshots=new Map;ngOnInit(){let e=this.supplies();this.lines.clear(),this.lines.push(this.newLine());for(let t of [...e].sort((n,r)=>n.name.localeCompare(r.name,"es")))this.lines.push(this.seededLine(t));}lineControls=It(()=>(this.valueTick(),[...this.lines.controls]));supplyNames=It(()=>{this.valueTick();let e=new Map;for(let t of this.supplies())e.set(t.name.toLowerCase(),t.name);for(let t of this.lines.controls){let n=t.controls.name.value.trim();n&&e.set(n.toLowerCase(),n);}return [...e.values()]});lineUnits=It(()=>(this.valueTick(),this.lines.controls.map(e=>this.measureOf(e).unit)));markRecentlyAdded(e){this.recentlyAddedId.set(e),setTimeout(()=>{this.recentlyAddedId()===e&&this.recentlyAddedId.set(null);},2500);}onAddRowEnter(e,t){let n=this.lines.at(t);!n||n.controls.id.value!==null||(e.preventDefault(),e.stopPropagation(),this.trySaveRow(t).then(()=>setTimeout(()=>this.focusNew())).catch(r=>this.log.error("el guardado del rengl\xF3n ha fallado",r)));}focusNew(){this.host.nativeElement.querySelector('[role="gridcell"][data-col="0"]')?.querySelector("input")?.focus();}setLineUnit(e,t){let n=this.lines.at(e);if(!n)return;let r=this.kindOf(n);r==="mass"&&t==="u"||r==="count"&&t!=="u"||n.controls.unit.setValue(t);}onFocusOut(e){let t=xg(e.target),n=xg(e.relatedTarget);t!==null&&t!==n&&this.trySaveRow(t).catch(r=>this.log.error("el guardado del rengl\xF3n ha fallado",r));}async trySaveRow(e){let t=this.lines.at(e);if(!t)return;let n=t.controls.name.value.trim(),r=this.purchaseFor(t),s=t.controls.id.value;if(s===null){if(!n||!r){this.log.debug("rengl\xF3n nuevo incompleto, todav\xEDa no se guarda",{index:e,conNombre:!!n,conPrecio:!!r});return}this.log.debug("crear insumo \u25B6",{index:e});try{let{id:o}=await this.saveSupply.execute({name:n,usage:"recipe",purchasePrice:r});t.controls.id.setValue(o),t.controls.baseUnit.setValue(r.per.unit),this.snapshot(t),this.errorMessage.set(""),this.markRecentlyAdded(o),this.lines.insert(0,this.newLine()),this.changed.emit(),this.log.debug("crear insumo \u2714",{id:o});}catch(o){this.log.warn("no se pudo crear el insumo",o,{index:e}),this.errorMessage.set(Nh(o));}return}if(!n){this.log.debug("rengl\xF3n existente sin nombre, no se guarda",{id:s}),this.errorMessage.set("El nombre del insumo no puede quedar vac\xEDo.");return}if(!r||this.snapshotKey(t)===this.savedSnapshots.get(s)){this.log.debug(r?"sin cambios, no se guarda":"sin precio, no se guarda",{id:s});return}this.log.debug("actualizar insumo \u25B6",{id:s});try{await this.saveSupply.execute({id:s,name:n,purchasePrice:r}),this.snapshot(t),this.errorMessage.set(""),this.changed.emit(),this.log.debug("actualizar insumo \u2714",{id:s});}catch(o){this.log.warn("no se pudo actualizar el insumo",o,{id:s}),this.errorMessage.set(Nh(o));}}async deleteLine(e){let n=this.lines.at(e)?.controls.id.value;if(n){this.log.debug("borrar insumo \u25B6",{id:n}),this.errorMessage.set("");try{await this.deleteSupply.execute({id:n}),this.lines.removeAt(e),this.savedSnapshots.delete(n),this.pendingDeleteId.set(null),this.log.debug("borrar insumo \u2714",{id:n}),this.changed.emit();}catch(r){this.log.warn("no se pudo borrar el insumo",r,{id:n}),this.errorMessage.set(Nh(r)),this.pendingDeleteId.set(null);}}}kindOf(e){let t=e.controls.baseUnit.value;return t==="u"?"count":t==="g"?"mass":"any"}measureOf(e){let t=this.kindOf(e),n=e.controls.packaging.value,r=t==="count"?n:n+e.controls.unit.value;return ji.parse(r,t)}purchaseFor(e){let t=this.measureOf(e),n=Number(e.controls.price.value.replace(",","."));return !t.quantity||!Number.isFinite(n)||n<=0?null:{amount:n,per:{value:t.quantity.value,unit:t.baseUnit}}}snapshotKey(e){let t=this.purchaseFor(e);return JSON.stringify({name:e.controls.name.value.trim().toLowerCase(),purchase:t})}snapshot(e){let t=e.controls.id.value;t&&this.savedSnapshots.set(t,this.snapshotKey(e));}newLine(){return this.fb.nonNullable.group({id:this.fb.control(null),baseUnit:[""],name:[""],packaging:[""],unit:[""],price:[""]})}seededLine(e){let t=e.purchasePrice.per,n=mw(t.value,t.unit),r=this.fb.nonNullable.group({id:this.fb.control(e.id.value),baseUnit:[e.baseUnit],name:[e.name],packaging:[n.value],unit:[n.unit],price:[String(e.purchasePrice.amount)]});return this.savedSnapshots.set(e.id.value,this.snapshotKey(r)),r}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-supply-list"]],hostBindings:function(t,n){t&1&&Ys$1("focusout",function(s){return n.onFocusOut(s)});},inputs:{supplies:[1,"supplies"]},outputs:{changed:"changed"},decls:7,vars:3,consts:[["table",""],[1,"flex","flex-col","gap-3","rounded-lg","bg-surface-warm","px-4","py-3"],[1,"m-0","text-caption","text-muted"],["bleed","","ariaLabel","Insumos del libro",3,"removeRow","columns","rows"],["role","alert",1,"m-0","text-caption","font-medium","text-error"],[3,"keydown.enter","formGroup"],[1,"flex","items-center","gap-1"],["paper","","formControlName","packaging","ariaLabel","Empaque: cu\xE1nto compras","placeholder","1",3,"unit"],["paper","","formControlName","price","ariaLabel","Precio de compra","placeholder","0.00"],["paper","","formControlName","name","ariaLabel","Nombre del insumo","placeholder","Insumo",1,"flex-1",3,"suggestions"],["name","mat:check","color","success","size","sm","ariaLabel","Insumo agregado",1,"shrink-0","pe-2"],["paper","","formControlName","packaging","ariaLabel","Empaque: cu\xE1nto compras","placeholder","1",3,"unitToken","unit"],["migo-button","","variant","danger","size","xs","type","button"],["migo-button","","variant","ghost","size","xs","type","button"],["migo-button","","variant","danger","size","xs","type","button",3,"click"],["migo-button","","variant","ghost","size","xs","type","button",3,"click"],["icon-leading","","name","mat:delete","size","sm"]],template:function(t,n){t&1&&(Rs$1(0,"div",1)(1,"p",2),ww$1(2," Tus insumos: escribe el nombre, cu\xE1nto compras y a qu\xE9 precio. El primer rengl\xF3n en blanco es para a\xF1adir uno nuevo. "),Ol$1(),Rs$1(3,"migo-table",3,0),Ys$1("removeRow",function(s){return n.deleteLine(s)}),kg$1(5,pw,5,2,"ng-template"),Ol$1(),Al$1(6,fw,2,1,"p",4),Ol$1()),t&2&&(ll$1(3),Pg("columns",n.columns)("rows",n.lineControls()),ll$1(3),xl(n.errorMessage()?6:-1));},dependencies:[br,yr,ro,ns,ts,Sr,nu,Mr,lo,xv$1,S],encapsulation:2})};function mw(i,e){return e==="u"?{value:String(i),unit:"u"}:i>=1e3?{value:String(i/1e3),unit:"k"}:{value:String(i),unit:"g"}}function xg(i){let t=(i instanceof HTMLElement?i.closest('[role="gridcell"]'):null)?.dataset.row;return t===void 0?null:Number(t)}function Nh(i){return i instanceof Error?i.message:"No se pudo guardar el insumo."}var su=class i{ref=g(Si);data=g(ys);changed=q(false);close(){this.ref.close(this.changed());}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-supplies-dialog"]],hostAttrs:[1,"contents"],decls:9,vars:1,consts:[["fill",""],["card-icon","","name","mat:layers","size","lg","color","brand"],["card-actions","","migo-button","","variant","ghost","type","button","aria-label","Cerrar",3,"click"],["icon-leading","","name","mat:close","size","sm"],[3,"changed","supplies"]],template:function(t,n){t&1&&(Rs$1(0,"migo-card",0)(1,"migo-card-header"),Ws$1(2,"migo-icon",1),Rs$1(3,"migo-card-title"),ww$1(4,"Insumos"),Ol$1(),Rs$1(5,"button",2),Ys$1("click",function(){return n.close()}),Ws$1(6,"migo-icon",3),Ol$1()(),Rs$1(7,"migo-card-body")(8,"app-supply-list",4),Ys$1("changed",function(){return n.changed.set(true)}),Ol$1()()()),t&2&&(ll$1(8),Pg("supplies",n.data.supplies));},dependencies:[b$1,E,j,N,S,xv$1,ru],encapsulation:2})};function gw(i){return i>=1e3?`${+(i/1e3).toFixed(2)} kg`:`${i} g`}function ou(i,e){return e==="u"?`${i} u`:gw(i)}function Mg(i){return `S/ ${Number.isInteger(i)?i:i.toFixed(2)}`}var _w=["scrollBody"];function vw(i,e){i&1&&(Rs$1(0,"migo-badge",19),ww$1(1),Ol$1()),i&2&&(ll$1(),jl$1("Sabor: ",e));}function yw(i,e){i&1&&(Rs$1(0,"migo-badge",19),ww$1(1),Ol$1()),i&2&&(ll$1(),jl$1("Porciones: ",e));}function bw(i,e){i&1&&(Rs$1(0,"migo-badge",19),ww$1(1),Ol$1()),i&2&&(ll$1(),jl$1("Molde: ",e));}function xw(i,e){if(i&1&&(Rs$1(0,"div",6),Al$1(1,vw,2,1,"migo-badge",19),Al$1(2,yw,2,1,"migo-badge",19),Al$1(3,bw,2,1,"migo-badge",19),Ol$1()),i&2){let t,n,r,s=Pl$1();ll$1(),xl((t=s.flavorLabel())?1:-1,t),ll$1(),xl((n=s.portionsLabel())?2:-1,n),ll$1(),xl((r=s.moldLabel())?3:-1,r);}}function Mw(i,e){if(i&1&&(Rs$1(0,"li",12)(1,"span",20),ww$1(2),Ol$1(),Rs$1(3,"span",21),ww$1(4),Ol$1(),Rs$1(5,"span",22),ww$1(6),Ol$1()()),i&2){let t=e.$implicit;ll$1(2),rm$1(t.name),ll$1(2),rm$1(t.quantity),ll$1(2),rm$1(t.price);}}function Sw(i,e){i&1&&(Rs$1(0,"div",18),Ws$1(1,"migo-icon",23),Ol$1());}var ww={items:[],total:""},Cw=12,Ew=4,au=class i{recipe=Ct.required();supplies=Ct([]);flavors=Ct([]);capacities=Ct([]);rect=Ct.required();edit=Dj();swipe=Dj();previewCost=g(oo);log=g(xm$1).scoped("ui/recipe-overlay");static SWIPE_THRESHOLD=40;start=null;scrollBody=Ej("scrollBody");hasMore=q(false);scrolled=q(false);headerClasses=It(()=>"mx-6 flex flex-col border-b-2 border-brand transition-all duration-base ease-out motion-reduce:transition-none "+(this.scrolled()?"pt-4 pb-2":"pt-8 pb-4"));titleClasses=It(()=>"m-0 font-display font-bold text-heading wrap-break-word transition-all duration-base ease-out motion-reduce:transition-none "+(this.scrolled()?"text-h4 sm:text-h3":"text-h2 sm:text-h1"));constructor(){mh$1(()=>{let e=this.costRequestLines();this.previewCost.execute({lines:e}).then(t=>this.costResult.set(t)).catch(t=>this.log.error("no se pudo calcular el costo",t));}),mh$1(()=>{this.recipe(),requestAnimationFrame(()=>this.resetScroll());}),mh$1(()=>{this.lines(),requestAnimationFrame(()=>this.syncScrollState());});}onScroll(){this.syncScrollState();}resetScroll(){let e=this.scrollBody()?.nativeElement;e&&(e.scrollTop=0,this.syncScrollState());}syncScrollState(){let e=this.scrollBody()?.nativeElement;if(!e){this.hasMore.set(false),this.scrolled.set(false);return}let t=e.scrollHeight-e.scrollTop-e.clientHeight;this.hasMore.set(t>4),this.scrolled.update(n=>n?e.scrollTop>Ew:e.scrollTop>Cw);}onDown(e){this.start={x:e.clientX,y:e.clientY};}onUp(e){let t=this.start;if(this.start=null,!t)return;let n=e.clientX-t.x,r=e.clientY-t.y;Math.abs(n)>=i.SWIPE_THRESHOLD&&Math.abs(n)>Math.abs(r)&&this.swipe.emit(n<0?"next":"prev");}suppliesById=It(()=>new Map(this.supplies().map(e=>[e.id.value,e])));flavorsById=It(()=>new Map(this.flavors().map(e=>[e.id.value,e])));flavorLabel=It(()=>{let e=this.recipe().flavorId;return e?this.flavorsById().get(e.value)?.label??null:null});capacitiesById=It(()=>new Map(this.capacities().map(e=>[e.id.value,e])));portionsLabel=It(()=>{let e=this.recipe().portionsCapacityId;return e?this.capacitiesById().get(e.value)?.label??null:null});moldLabel=It(()=>{let e=this.recipe().moldCapacityId;return e?this.capacitiesById().get(e.value)?.label??null:null});costRequestLines=It(()=>{let e=this.suppliesById();return this.recipe().ingredients.map(t=>{let n=e.get(t.supplyId.value);return {purchasePrice:n?{amount:n.purchasePrice.amount,per:{value:n.purchasePrice.per.value,unit:n.purchasePrice.per.unit}}:null,quantity:{value:t.quantity.value,unit:t.quantity.unit}}})});costResult=q(ww);total=It(()=>this.costResult().total);lines=It(()=>{let e=this.suppliesById(),t=this.costResult().items;return this.recipe().ingredients.map((n,r)=>({name:e.get(n.supplyId.value)?.name??"\u2014",quantity:ou(n.quantity.value,n.quantity.unit),price:t[r]?.cost||"\u2014"}))});static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-recipe-overlay"]],viewQuery:function(t,n){t&1&&qg$1(n.scrollBody,_w,5),t&2&&tw$1();},hostAttrs:[1,"fixed","z-20","flex","flex-col","overflow-hidden","text-body"],hostVars:8,hostBindings:function(t,n){t&1&&Ys$1("pointerdown",function(s){return n.onDown(s)})("pointerup",function(s){return n.onUp(s)}),t&2&&Yg$1("left",n.rect().x,"px")("top",n.rect().y,"px")("width",n.rect().width,"px")("height",n.rect().height,"px");},inputs:{recipe:[1,"recipe"],supplies:[1,"supplies"],flavors:[1,"flavors"],capacities:[1,"capacities"],rect:[1,"rect"]},outputs:{edit:"edit",swipe:"swipe"},decls:29,vars:9,consts:[["scrollBody",""],[1,"flex","items-start","justify-between","gap-4"],["migo-button","","variant","ghost","size","sm","type","button","aria-label","Editar receta",3,"click"],["icon-leading","","name","mat:edit","size","md"],[1,"relative","min-h-0","flex-1"],["role","group","aria-label","Ingredientes",1,"absolute","inset-0","overflow-y-auto","overscroll-contain","touch-pan-y","scrollbar-hidden","px-6","py-4",3,"scroll"],[1,"flex","flex-wrap","gap-1.5","pb-4"],[1,"flex","items-baseline","gap-3","pb-2","text-sm","font-semibold","uppercase","tracking-wide","text-muted"],[1,"flex-1"],[1,"w-16","shrink-0","text-right","sm:w-20"],[1,"w-14","shrink-0","text-right","sm:w-16"],["aria-label","L\xEDneas de insumo",1,"m-0","p-0","list-none"],[1,"flex","items-start","gap-3","border-b","border-border-line","py-3"],[1,"mt-3","flex","items-baseline","justify-between","gap-3","border-t-2","border-brand","pt-3"],[1,"text-sm","italic","text-muted"],[1,"flex","items-baseline","gap-3"],[1,"font-display","text-sm","uppercase","tracking-wide","text-muted"],[1,"font-display","font-bold","text-heading","text-lead","tabular-nums"],[1,"pointer-events-none","absolute","inset-x-0","bottom-1","flex","justify-center"],["size","xs"],[1,"min-w-0","flex-1","wrap-break-word","font-display","text-heading","text-base","sm:text-lead"],[1,"w-16","shrink-0","whitespace-nowrap","text-right","font-display","font-bold","text-heading","text-base","tabular-nums","sm:w-20","sm:text-lead"],[1,"w-14","shrink-0","whitespace-nowrap","text-right","text-xs","tabular-nums","text-muted","sm:w-16","sm:text-sm"],["name","mat:expand_more","size","md","color","muted"]],template:function(t,n){t&1&&(Rs$1(0,"header")(1,"div",1)(2,"h2"),ww$1(3),Ol$1(),Rs$1(4,"button",2),Ys$1("click",function(){return n.edit.emit()}),Ws$1(5,"migo-icon",3),Ol$1()()(),Rs$1(6,"div",4)(7,"div",5,0),Ys$1("scroll",function(){return n.onScroll()}),Al$1(9,xw,4,3,"div",6),Rs$1(10,"div",7)(11,"span",8),ww$1(12,"Insumo"),Ol$1(),Rs$1(13,"span",9),ww$1(14,"Cant."),Ol$1(),Rs$1(15,"span",10),ww$1(16,"Precio"),Ol$1()(),Rs$1(17,"ul",11),UC(18,Mw,7,3,"li",12,HC),Ol$1(),Rs$1(20,"div",13)(21,"span",14),ww$1(22),Ol$1(),Rs$1(23,"span",15)(24,"span",16),ww$1(25,"Total"),Ol$1(),Rs$1(26,"span",17),ww$1(27),Ol$1()()()(),Al$1(28,Sw,2,0,"div",18),Ol$1()),t&2&&(Fl$1(n.headerClasses()),ll$1(2),Fl$1(n.titleClasses()),ll$1(),rm$1(n.recipe().name),ll$1(6),xl(n.flavorLabel()||n.portionsLabel()||n.moldLabel()?9:-1),ll$1(9),VC(n.lines()),ll$1(4),jl$1("",n.lines().length," insumos"),ll$1(5),rm$1(n.total()),ll$1(),xl(n.hasMore()?28:-1));},dependencies:[S,xv$1,M],encapsulation:2})};var wr="supplies";function Sg(i){let e=[{kind:"cover",title:"Mi libro de recetas",subtitle:"Recetario"}];for(let t of i.categories){e.push({kind:"section",subtitle:"Categor\xEDa",title:t.name,section:t.id.value});let n=i.recipes.filter(r=>r.categoryId.value===t.id.value).sort((r,s)=>r.name.localeCompare(s.name,"es"));if(n.length===0){e.push({kind:"recipe",section:t.id.value,title:t.name,subtitle:"A\xFAn no tienes nada aqu\xED."});continue}for(let r of n)e.push(...Iw(r,t));}return e.push(...Dw(i.supplies)),e}var Tw=10,Aw=14;function Rw(i,e,t){if(i.length===0)return [];let n=[i.slice(0,e)];for(let r=e;r<i.length;r+=t)n.push(i.slice(r,r+t));return n}function Iw(i,e){return [{kind:"recipe",section:e.id.value,title:i.name,overlay:true}]}function Dw(i){let e=[{kind:"section",subtitle:"Secci\xF3n",title:"Insumos",section:wr}];if(i.length===0)return e.push({kind:"recipe",section:wr,title:"Insumos",subtitle:"A\xFAn no tienes insumos."}),e;let n=[...i].sort((o,a)=>o.name.localeCompare(a.name,"es")).map(o=>({cells:[o.name,ou(o.purchasePrice.per.value,o.purchasePrice.per.unit),Mg(o.purchasePrice.amount)]})),r=`${i.length} insumos`,s=Rw(n,Tw,Aw);return s.forEach((o,a)=>{let l=a===s.length-1;e.push({kind:"recipe",section:wr,title:"Insumos",subtitle:a===0?"Lo que compras, con su precio":"continuaci\xF3n",columns:["Insumo","Cantidad","Precio"],rows:o,continued:a>0,footer:l?r:"Contin\xFAa\u2026"});}),e}var Pw=["canvas"],Nw=()=>[],Fw=(i,e)=>e.side,Lw=(i,e)=>e.faceIndex,wg=(i,e)=>e.id.value;function Ow(i,e){if(i&1){let t=ZC();Rs$1(0,"app-recipe-overlay",19),Ys$1("edit",function(){let r=Qf$1(t).$implicit,s=Pl$1(2);return Kf$1(s.openEditForm(r.recipe))})("swipe",function(r){Qf$1(t);let s=Pl$1(2);return Kf$1(s.onOverlaySwipe(r))}),Ol$1();}if(i&2){let t=e.$implicit,n=Pl$1(2);Pg("recipe",t.recipe)("supplies",n.supplyEntities())("flavors",n.flavorEntities())("capacities",n.capacityEntities())("rect",t.rect);}}function kw(i,e){if(i&1){let t=ZC();Rs$1(0,"button",20),Ys$1("click",function(){let r=Qf$1(t),s=Pl$1(2);return Kf$1(s.openNewForm(r))}),Ws$1(1,"migo-icon",21),Ol$1();}if(i&2){let t=Pl$1(2);Nn("aria-label","Nuevo "+t.categoryName());}}function Uw(i,e){if(i&1){let t=ZC();Rs$1(0,"button",22),Ys$1("click",function(){Qf$1(t);let r=Pl$1(2);return Kf$1(r.openSupplies())}),Ws$1(1,"migo-icon",23),Ol$1();}}function Bw(i,e){if(i&1&&(Rs$1(0,"p",29),ww$1(1),Ol$1()),i&2){let t=Pl$1().$implicit;ll$1(),jl$1(" ",t.label," ");}}function Vw(i,e){if(i&1){let t=ZC();Rs$1(0,"button",31),Ys$1("click",function(){Qf$1(t);let r=Pl$1().$implicit,s=Pl$1(3);return Kf$1(s.jump(r.faceIndex))}),ww$1(1),Ol$1();}if(i&2){let t=Pl$1().$implicit;ll$1(),jl$1(" ",t.label," ");}}function zw(i,e){if(i&1&&Al$1(0,Bw,2,1,"p",29)(1,Vw,2,1,"button",30),i&2){let t=e.$implicit;xl(t.section?0:1);}}function Hw(i,e){if(i&1){let t=ZC();Rs$1(0,"nav",18)(1,"div",24)(2,"span",25),ww$1(3,"\xCDndice"),Ol$1(),Rs$1(4,"button",26),Ys$1("click",function(){Qf$1(t);let r=Pl$1(2);return Kf$1(r.toggleIndex())}),Ws$1(5,"migo-icon",27),Ol$1()(),Rs$1(6,"div",28),UC(7,zw,2,1,null,null,Lw),Ol$1()();}if(i&2){let t=Pl$1(2);ll$1(7),VC(t.indexEntries());}}function Gw(i,e){if(i&1){let t=ZC();Rs$1(0,"canvas",2,0),Ys$1("pointerdown",function(r){Qf$1(t);let s=Pl$1();return Kf$1(s.onSwipeStart(r))})("pointerup",function(r){Qf$1(t);let s=Pl$1();return Kf$1(s.onSwipeEnd(r))}),Ol$1(),UC(2,Ow,1,5,"app-recipe-overlay",3,Fw),Rs$1(4,"button",4),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.close())}),Ws$1(5,"migo-icon",5),Ol$1(),Rs$1(6,"p",6),ww$1(7),Ol$1(),Rs$1(8,"nav",7)(9,"button",8),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.prev())}),Ws$1(10,"migo-icon",9),Ol$1(),Rs$1(11,"button",10),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.toggleIndex())}),Ws$1(12,"migo-icon",11)(13,"migo-spacer",12),Rs$1(14,"span",13),ww$1(15,"\xCDndice"),Ol$1()(),Rs$1(16,"button",14),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.next())}),Ws$1(17,"migo-icon",15),Ol$1()(),Al$1(18,kw,2,1,"button",16)(19,Uw,2,0,"button",17),Al$1(20,Hw,9,0,"nav",18);}if(i&2){let t,n=Pl$1();ll$1(2),VC(n.overlays()),ll$1(5),jl$1(" ",n.announce()," "),ll$1(2),Pg("disabled",!n.canPrev()),ll$1(7),Pg("disabled",!n.canNext()),ll$1(2),xl((t=n.currentSection())?18:n.onSupplies()?19:-1,t),ll$1(2),xl(n.indexOpen()?20:-1);}}function Ww(i,e){i&1&&(Rs$1(0,"migo-badge",44),ww$1(1),Ol$1()),i&2&&(ll$1(),jl$1("Sabor: ",e));}function Xw(i,e){i&1&&(Rs$1(0,"migo-badge",44),ww$1(1),Ol$1()),i&2&&(ll$1(),jl$1("Porciones: ",e));}function qw(i,e){i&1&&(Rs$1(0,"migo-badge",44),ww$1(1),Ol$1()),i&2&&(ll$1(),jl$1("Molde: ",e));}function Yw(i,e){if(i&1&&(Rs$1(0,"div",43),Al$1(1,Ww,2,1,"migo-badge",44),Al$1(2,Xw,2,1,"migo-badge",44),Al$1(3,qw,2,1,"migo-badge",44),Ol$1()),i&2){let t,n,r,s=Pl$1().$implicit,o=Pl$1(3);ll$1(),xl((t=o.flavorLabelOf(s))?1:-1,t),ll$1(),xl((n=o.portionsLabelOf(s))?2:-1,n),ll$1(),xl((r=o.moldLabelOf(s))?3:-1,r);}}function $w(i,e){if(i&1){let t=ZC();Rs$1(0,"button",42),Ys$1("click",function(){let r=Qf$1(t).$implicit,s=Pl$1(3);return Kf$1(s.openEditForm(r))}),Rs$1(1,"span"),ww$1(2),Ol$1(),Al$1(3,Yw,4,3,"div",43),Ol$1();}if(i&2){let t=e.$implicit,n=Pl$1(3);ll$1(2),rm$1(t.name),ll$1(),xl(n.flavorLabelOf(t)||n.portionsLabelOf(t)||n.moldLabelOf(t)?3:-1);}}function jw(i,e){i&1&&(Rs$1(0,"p",41),ww$1(1,"A\xFAn no hay recetas aqu\xED."),Ol$1());}function Zw(i,e){if(i&1){let t=ZC();Rs$1(0,"section",35)(1,"div",32)(2,"h2",37),ww$1(3),Ol$1(),Rs$1(4,"button",38),Ys$1("click",function(){let r=Qf$1(t).$implicit,s=Pl$1(2);return Kf$1(s.openNewForm(r.id.value))}),Ws$1(5,"migo-icon",39)(6,"migo-spacer"),ww$1(7,"Nuevo "),Ol$1()(),UC(8,$w,4,2,"button",40,wg,false,jw,2,0,"p",41),Ol$1();}if(i&2){let t=e.$implicit,n=Pl$1(2);ll$1(3),rm$1(t.name),ll$1(5),VC(n.recipesOf(t.id.value));}}function Kw(i,e){if(i&1){let t=ZC();Rs$1(0,"div",1)(1,"div",32)(2,"span",33),ww$1(3,"Mi libro de recetas"),Ol$1(),Rs$1(4,"button",34),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.close())}),Ws$1(5,"migo-icon",5)(6,"migo-spacer"),ww$1(7,"Volver "),Ol$1()(),UC(8,Zw,11,2,"section",35,wg),Rs$1(10,"button",36),Ys$1("click",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.openSupplies())}),Ws$1(11,"migo-icon",11)(12,"migo-spacer"),ww$1(13,"Insumos "),Ol$1()();}if(i&2){let t=Pl$1();ll$1(8),VC(t.catalog()?.categories??Rw$1(0,Nw));}}var lu=class i{closed=Dj();canvasRef=Ej("canvas");listRecipeBook=g(Ha);syncStatus=g(Ov$1);dialog=g(za);log=g(xm$1).scoped("ui/book");seenRevision=this.syncStatus.revision();constructor(){mh$1(()=>{let e=this.syncStatus.revision();e!==this.seenRevision&&(this.seenRevision=e,this.log.debug("la sincronizaci\xF3n trajo datos nuevos, se repinta el libro",{revision:e}),this.load());});}webglSupported=q(tC());indexOpen=q(false);announce=q("");catalog=q(null);spread=q(null);canPrev=It(()=>this.spread()?.canPrev??false);canNext=It(()=>this.spread()?.canNext??false);currentSection=It(()=>{let e=this.spread(),t=e?.right?.section??e?.left?.section??null;return t&&t!==wr?t:null});onSupplies=It(()=>{let e=this.spread();return (e?.right?.section??e?.left?.section)===wr});categoryName=It(()=>{let e=this.currentSection();return this.catalog()?.categories.find(t=>t.id.value===e)?.name??""});leftRecipe=It(()=>this.recipeOfPage(this.spread()?.left));rightRecipe=It(()=>this.recipeOfPage(this.spread()?.right));currentRecipe=It(()=>this.rightRecipe()??this.leftRecipe());recipeOfPage(e){let t=this.catalog();return !t||!e||e.kind!=="recipe"||!e.section||e.section===wr||!e.title?null:t.recipes.find(n=>n.categoryId.value===e.section&&n.name===e.title)??null}suppliesById=It(()=>new Map((this.catalog()?.supplies??[]).map(e=>[e.id.value,e])));supplyEntities=It(()=>this.catalog()?.supplies??[]);flavorsById=It(()=>new Map((this.catalog()?.flavors??[]).map(e=>[e.id.value,e])));flavorEntities=It(()=>this.catalog()?.flavors??[]);flavorLabelOf(e){return e.flavorId?this.flavorsById().get(e.flavorId.value)?.label??null:null}capacitiesById=It(()=>new Map((this.catalog()?.recipeCapacities??[]).map(e=>[e.id.value,e])));capacityEntities=It(()=>this.catalog()?.recipeCapacities??[]);capacityLabelById(e){return e?this.capacitiesById().get(e.value)?.label??null:null}portionsLabelOf(e){return this.capacityLabelById(e.portionsCapacityId)}moldLabelOf(e){return this.capacityLabelById(e.moldCapacityId)}overlays=q([]);_indexEntries=q([]);indexEntries=this._indexEntries.asReadonly();engine=null;dialogOpen=false;reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??false;ngAfterViewInit(){if(!this.webglSupported()){this.log.debug("sin WebGL: el libro se pinta en su ruta accesible DOM"),this.load();return}let e=this.canvasRef()?.nativeElement;if(!e){this.log.debug("todav\xEDa no hay canvas, no se monta el motor");return}try{this.engine=new Ic(e,this.reducedMotion,this.log.scoped("3d/book")),this.engine.onSpreadChange(t=>this.onSpread(t)),this.load();}catch(t){this.log.warn("no se pudo crear el motor 3D: se cae a la ruta accesible",t),this.engine=null,this.webglSupported.set(false),this.load();}}ngOnDestroy(){this.engine?.dispose();}next(){this.overlays.set([]),this.engine?.next();}prev(){this.overlays.set([]),this.engine?.prev();}swipeStart=null;static SWIPE_THRESHOLD=40;onSwipeStart(e){this.swipeStart={x:e.clientX,y:e.clientY},e.target.setPointerCapture?.(e.pointerId);}onSwipeEnd(e){let t=this.swipeStart;if(this.swipeStart=null,!t)return;let n=e.clientX-t.x,r=e.clientY-t.y;if(Math.abs(n)>=i.SWIPE_THRESHOLD&&Math.abs(n)>Math.abs(r)){n<0?this.next():this.prev();return}if(e.pointerType==="mouse"&&Math.hypot(n,r)<i.SWIPE_THRESHOLD){let s=e.currentTarget.getBoundingClientRect();e.clientX>s.left+s.width/2?this.next():this.prev();}}onOverlaySwipe(e){e==="next"?this.next():this.prev();}refreshOverlays(){let e=this.engine;if(!e){this.overlays.set([]);return}let t=[];for(let n of ["left","right"]){let r=n==="left"?this.leftRecipe():this.rightRecipe();if(!r)continue;let s=e.getPageRect(n);s&&t.push({side:n,recipe:r,rect:s});}this.overlays.set(t);}jump(e){this.overlays.set([]),this.engine?.jumpToFace(e),this.indexOpen.set(false);}toggleIndex(){this.indexOpen.update(e=>!e);}close(){this.closed.emit();}recipesOf(e){return (this.catalog()?.recipes??[]).filter(t=>t.categoryId.value===e).sort((t,n)=>t.name.localeCompare(n.name,"es"))}openNewForm(e){let t=this.catalog(),n=t?.categories.find(r=>r.id.value===e);!t||!n||this.openForm({category:{id:n.id.value,name:n.name},supplies:t.supplies,flavors:t.flavors,capacities:t.recipeCapacities});}editCurrent(){let e=this.currentRecipe();e&&this.openEditForm(e);}openEditForm(e){let t=this.catalog(),n=t?.categories.find(r=>r.id.value===e.categoryId.value);!t||!n||this.openForm({category:{id:n.id.value,name:n.name},supplies:t.supplies,flavors:t.flavors,capacities:t.recipeCapacities,recipe:{id:e.id.value,name:e.name,lines:this.prefillLines(e),flavorLabel:this.flavorLabelOf(e),portionsLabel:this.portionsLabelOf(e),moldLabel:this.moldLabelOf(e)}});}openForm(e){if(this.dialogOpen)return;this.dialogOpen=true,this.dialog.open(tu,{ariaLabel:e.recipe?"Editar receta":"Nueva receta",width:"640px",data:e}).closed.subscribe(n=>{this.dialogOpen=false,n&&this.load(n.deleted?{categoryId:n.categoryId}:{categoryId:n.categoryId,recipeName:n.name});});}openSupplies(){let e=this.catalog();if(!e||this.dialogOpen)return;this.dialogOpen=true,this.dialog.open(su,{ariaLabel:"Insumos",width:"640px",data:{supplies:e.supplies}}).closed.subscribe(n=>{this.dialogOpen=false,n&&this.load({supplies:true});});}prefillLines(e){let t=this.suppliesById();return e.ingredients.map(n=>{let r=t.get(n.supplyId.value);return {supplyId:n.supplyId.value,name:r?.name??"\u2014",quantity:n.quantity.value,baseUnit:n.quantity.unit}})}onResize(){let e=this.canvasRef()?.nativeElement;e&&(this.engine?.resize(e.clientWidth,e.clientHeight),this.refreshOverlays());}onKeydown(e){if(!this.dialogOpen)switch(e.key){case "ArrowRight":case "PageDown":e.preventDefault(),this.next();break;case "ArrowLeft":case "PageUp":e.preventDefault(),this.prev();break;case "Home":e.preventDefault(),this.overlays.set([]),this.engine?.home();break;case "End":e.preventDefault(),this.overlays.set([]),this.engine?.end();break;case "Escape":this.indexOpen()?this.indexOpen.set(false):this.close();break;case "e":case "E":this.currentRecipe()&&(e.preventDefault(),this.editCurrent());break}}async load(e){try{let t=await this.listRecipeBook.execute();this.catalog.set(t);let n=Sg(t);this._indexEntries.set(Qw(t,n));let r=e?Jw(n,e):-1,s=r>=0?r:this.engine?.currentFaceIndex??0;this.engine?.setPages(n),s>0&&this.engine?.jumpToFace(s),this.log.debug("libro repintado",{caras:n.length,face:s});}catch(t){this.log.error("no se pudo leer el cat\xE1logo: el libro se queda como estaba",t,{focus:e??null});}}onSpread(e){this.spread.set(e),this.announce.set(eC(e)),this.refreshOverlays();}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-recipe-book-3d"]],viewQuery:function(t,n){t&1&&qg$1(n.canvasRef,Pw,5),t&2&&tw$1();},hostAttrs:[1,"fixed","inset-0","z-40","block","bg-surface-page"],hostBindings:function(t,n){t&1&&Ys$1("resize",function(){return n.onResize()},nE)("keydown",function(s){return n.onKeydown(s)},rE);},outputs:{closed:"closed"},decls:2,vars:1,consts:[["canvas",""],[1,"absolute","inset-0","flex","flex-col","overflow-y-auto","p-4","gap-4"],["aria-hidden","true",1,"block","h-full","w-full","touch-none",3,"pointerdown","pointerup"],[3,"recipe","supplies","flavors","capacities","rect"],["migo-button","","variant","secondary","size","md","aria-label","Volver",1,"absolute","left-4","top-4","shadow-md",3,"click"],["icon-leading","","name","mat:arrow_back","size","sm"],["role","status","aria-live","polite",1,"absolute","h-px","w-px","overflow-hidden","whitespace-nowrap"],["aria-label","P\xE1ginas del libro",1,"absolute","inset-x-0","bottom-0","z-30","flex","items-center","justify-center","gap-2","border-t","border-border-subtle","bg-surface-card","px-4","py-3","shadow-lg","sm:inset-x-auto","sm:left-1/2","sm:bottom-5","sm:w-auto","sm:-translate-x-1/2","sm:gap-3","sm:rounded-full","sm:border","sm:px-3"],["migo-button","","variant","secondary","size","md","aria-label","P\xE1gina anterior",1,"shadow-md",3,"click","disabled"],["icon-leading","","name","mat:chevron_right","size","md",1,"rotate-180"],["migo-button","","variant","secondary","size","md","aria-label","\xCDndice",1,"shadow-md",3,"click"],["icon-leading","","name","mat:layers","size","sm"],["hideOnMobile",""],[1,"hidden","sm:inline"],["migo-button","","variant","secondary","size","md","aria-label","P\xE1gina siguiente",1,"shadow-md",3,"click","disabled"],["icon-leading","","name","mat:chevron_right","size","md"],["migo-button","","variant","primary","size","md",1,"absolute","bottom-3","right-4","z-30","shadow-lg","sm:bottom-24"],["migo-button","","variant","primary","size","md","aria-label","Gestionar insumos",1,"absolute","bottom-3","right-4","z-30","shadow-lg","sm:bottom-24"],["aria-label","\xCDndice de recetas",1,"absolute","inset-y-0","left-0","z-50","flex","w-full","sm:w-80","flex-col","bg-surface-card","border-e","border-border-subtle","shadow-lg"],[3,"edit","swipe","recipe","supplies","flavors","capacities","rect"],["migo-button","","variant","primary","size","md",1,"absolute","bottom-3","right-4","z-30","shadow-lg","sm:bottom-24",3,"click"],["icon-leading","","name","mat:add","size","md"],["migo-button","","variant","primary","size","md","aria-label","Gestionar insumos",1,"absolute","bottom-3","right-4","z-30","shadow-lg","sm:bottom-24",3,"click"],["icon-leading","","name","mat:layers","size","md"],[1,"flex","items-center","justify-between","gap-3","px-4","py-3","border-b","border-border-subtle"],[1,"font-display","text-heading","text-sm"],["migo-button","","variant","ghost","size","sm","type","button","aria-label","Cerrar \xEDndice",3,"click"],["icon-leading","","name","mat:close","size","sm"],[1,"flex-1","overflow-y-auto","p-3"],[1,"m-0","mt-3","mb-1","px-2","font-display","text-heading","text-sm","first:mt-0"],["type","button",1,"block","min-h-11","w-full","rounded-xl","px-4","py-2","text-left","font-body","text-sm","text-body","hover:bg-surface-sunken","focus-visible:shadow-focus","focus-visible:outline-none"],["type","button",1,"block","min-h-11","w-full","rounded-xl","px-4","py-2","text-left","font-body","text-sm","text-body","hover:bg-surface-sunken","focus-visible:shadow-focus","focus-visible:outline-none",3,"click"],[1,"flex","items-center","justify-between","gap-3"],[1,"font-display","text-heading","text-lead"],["migo-button","","variant","secondary","size","md",3,"click"],[1,"flex","flex-col","gap-2"],["migo-button","","variant","primary","size","md",1,"self-start",3,"click"],[1,"m-0","font-display","text-heading","text-base"],["migo-button","","variant","secondary","size","sm",3,"click"],["icon-leading","","name","mat:add","size","sm"],["type","button",1,"flex","min-h-11","w-full","flex-col","items-start","gap-1","rounded-lg","bg-surface-sunken","px-4","py-2","text-left","font-body","text-body","hover:bg-surface-card","focus-visible:shadow-focus","focus-visible:outline-none"],[1,"m-0","text-muted","text-sm"],["type","button",1,"flex","min-h-11","w-full","flex-col","items-start","gap-1","rounded-lg","bg-surface-sunken","px-4","py-2","text-left","font-body","text-body","hover:bg-surface-card","focus-visible:shadow-focus","focus-visible:outline-none",3,"click"],[1,"flex","flex-wrap","gap-1.5"],["size","xs"]],template:function(t,n){t&1&&Al$1(0,Gw,21,5)(1,Kw,14,1,"div",1),t&2&&xl(n.webglSupported()?0:1);},dependencies:[S,xv$1,Ca,M,au],encapsulation:2})};function Jw(i,e){if(e.supplies)return i.findIndex(t=>t.section===wr&&t.kind==="recipe");if(e.recipeName&&e.categoryId){let t=i.findIndex(n=>n.kind==="recipe"&&!n.continued&&n.section===e.categoryId&&n.title===e.recipeName);if(t>=0)return t}return e.categoryId?i.findIndex(t=>t.kind==="section"&&t.section===e.categoryId):-1}function Qw(i,e){let t=new Map(i.categories.map(r=>[r.id.value,new Set(i.recipes.filter(s=>s.categoryId.value===r.id.value).map(s=>s.name))])),n=[];return e.forEach((r,s)=>{let o=r.section;!o||!t.has(o)||r.continued||(r.kind==="section"?n.push({label:r.title??"",faceIndex:s,section:true}):r.kind==="recipe"&&r.title&&t.get(o).has(r.title)&&n.push({label:r.title,faceIndex:s,section:false}));}),n}function eC(i){let e=[];for(let t of [i.left,i.right]){if(!t||t.kind==="blank"||t.kind==="cover")continue;let n=[t.title,t.subtitle,t.chips?.join(", ")].filter(Boolean);t.rows?.length&&n.push(t.rows.map(r=>r.cells.join(" ")).join("; ")),e.push(n.join(". "));}return e.join(". ")||"Portada"}function tC(){try{let i=document.createElement("canvas");return !!(i.getContext("webgl2")??i.getContext("webgl"))}catch{return  false}}var uo=new O(6.5,6,6.5),oa=new O(0,1,0),nC=new O(12,11,12);function iC(i){return 1-Math.pow(1-i,3)}var cu=class{constructor(e,t){this.reducedMotion=t;this.camera=new dn(30,e,.1,100),this.camera.position.copy(uo),this.camera.lookAt(this.look);}reducedMotion;camera;look=oa.clone();tween=null;setAspect(e){this.camera.aspect=e,this.camera.updateProjectionMatrix();}flyIn(){return this.reducedMotion?(this.snap(uo,oa),Promise.resolve()):(this.camera.position.copy(nC),this.animateTo(uo,oa,1.8))}focusStation(e){let t=new O().subVectors(uo,e).normalize().multiplyScalar(3),n=new O().addVectors(e,t).add(new O(0,.8,0));return this.reducedMotion?(this.snap(n,e),Promise.resolve()):this.animateTo(n,e,.7)}resetView(){return this.reducedMotion?(this.snap(uo,oa),Promise.resolve()):this.animateTo(uo,oa,.6)}update(e){if(!this.tween)return;let t=this.tween;t.elapsed+=e;let n=iC(Math.min(t.elapsed/t.duration,1));this.camera.position.lerpVectors(t.fromPos,t.toPos,n),this.look.lerpVectors(t.fromLook,t.toLook,n),this.camera.lookAt(this.look),t.elapsed>=t.duration&&(this.tween=null,t.resolve());}snap(e,t){this.tween=null,this.camera.position.copy(e),this.look.copy(t),this.camera.lookAt(this.look);}animateTo(e,t,n){return this.tween?.resolve(),new Promise(r=>{this.tween={fromPos:this.camera.position.clone(),toPos:e.clone(),fromLook:this.look.clone(),toLook:t.clone(),duration:n,elapsed:0,resolve:r};})}};var rC=15115406,sC=13065539,Cg=16776180;function uu(i){return new qn({color:i,roughness:.85,metalness:0})}function Eg(){let i=new Cn,e=new gt(new dr(.32,.42,.95,12),uu(sC));e.position.y=.48,e.castShadow=true,i.add(e);let t=new gt(new Vs(.28,16,12),uu(rC));t.position.y=1.12,t.castShadow=true,i.add(t);let n=new gt(new dr(.26,.26,.22,12),uu(Cg));n.position.y=1.38,n.castShadow=true,i.add(n);let r=new gt(new Vs(.22,12,10),uu(Cg));return r.position.y=1.56,r.castShadow=true,i.add(r),i}var du=class{constructor(e,t){this.reducedMotion=t;this.group=Eg(),this.group.position.copy(e),this.baseY=e.y;}reducedMotion;group;baseY;elapsed=0;celebrateUntil=0;celebrate(){this.reducedMotion||(this.celebrateUntil=this.elapsed+1.6);}update(e){if(this.elapsed+=e,this.reducedMotion)return;let t=1+Math.sin(this.elapsed*1.6)*.02;if(this.group.scale.set(1,t,1),this.elapsed<this.celebrateUntil){let n=1-(this.celebrateUntil-this.elapsed)/1.6,r=Math.sin(n*Math.PI*2)*.25*(1-n);this.group.position.y=this.baseY+Math.max(0,r),this.group.rotation.y+=e*6;}else this.group.position.y=this.baseY;}};var Pn={floor:15260100,wall:16050906,wallSide:16512233,wood:14074534,woodDark:11047804,boardPaper:16776180,oven:13065539,pantry:10468975,plant:8562767};function aa(i){return new qn({color:i,roughness:.92,metalness:0})}function Ii(i,e,t,n,r,s,o){let a=new gt(new ii(i,e,t),aa(n));return a.position.set(r,s+e/2,o),a.castShadow=true,a.receiveShadow=true,a}function Tg(){let i=new Cn,e=[],t=new Map,n=new gt(new Xn(8,8),aa(Pn.floor));n.rotation.x=-Math.PI/2,n.receiveShadow=true,i.add(n);let r=new gt(new Xn(8,4),aa(Pn.wall));r.position.set(0,2,-4),r.receiveShadow=true,i.add(r);let s=new gt(new Xn(8,4),aa(Pn.wallSide));s.rotation.y=Math.PI/2,s.position.set(-4,2,0),s.receiveShadow=true,i.add(s),i.add(Ii(4,.2,1,Pn.woodDark,0,0,-3.4)),i.add(Ii(4,.7,1,Pn.wood,0,.2,-3.4));let o=Ii(1.2,1.3,1,Pn.oven,-2.6,0,-3.4);o.userData.station="OVEN",i.add(o),e.push(o),t.set("OVEN",new O(-2.6,1,-3));let a=new Cn;for(let y=0;y<3;y++)a.add(Ii(.9,.12,1.6,Pn.pantry,-3.5,1+y*.7,-1.2));let l=Ii(.95,2.3,1.7,Pn.pantry,-3.5,.9,-1.2);l.material=new qn({color:Pn.pantry,transparent:true,opacity:0}),l.userData.station="PANTRY",a.add(l),i.add(a),e.push(l),t.set("PANTRY",new O(-3,1.6,-1.2));let c=new Cn;c.add(Ii(1.4,.85,.9,Pn.wood,1.4,0,1.4));let u=Ii(.62,.04,.82,Pn.oven,1.4,.85,1.4),d=Ii(.56,.07,.76,Pn.boardPaper,1.4,.89,1.4),p=Ii(.62,.04,.82,Pn.oven,1.4,.96,1.4);for(let y of [u,d,p])y.rotation.y=.3,y.userData.station="RECIPE_BOARD",c.add(y),e.push(y);i.add(c),t.set("RECIPE_BOARD",new O(1.4,1,1.4));let f=Ii(.35,.35,.35,Pn.woodDark,2.6,.9,-3.4);i.add(f);let _=new gt(new dr(0,.35,.7,6),aa(Pn.plant));return _.position.set(2.6,1.6,-3.4),_.castShadow=true,i.add(_),{root:i,stationHotspots:e,focusTargets:t}}var hu=class{constructor(e,t,n){this.canvas=e;this.log=n;let{clientWidth:r,clientHeight:s}=e,o=s>0?r/s:1;this.log.debug("creando el motor",{w:r,h:s,reducedMotion:t}),this.renderer=new Zs({canvas:e,antialias:true}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.setSize(r,s,false),this.renderer.shadowMap.enabled=true,this.renderer.shadowMap.type=zs,this.renderer.outputColorSpace=rn,this.renderer.toneMapping=Hs,this.renderer.toneMappingExposure=1.05,this.scene.background=new et(16512233);let a=new Wr(16774111,15260100,1.1);this.scene.add(a);let l=new Xr(16771010,1.5);l.position.set(5,8,4),l.castShadow=true,l.shadow.mapSize.set(1024,1024),l.shadow.camera.near=1,l.shadow.camera.far=30,l.shadow.camera.left=-6,l.shadow.camera.right=6,l.shadow.camera.top=6,l.shadow.camera.bottom=-6,l.shadow.bias=-5e-4,this.scene.add(l);let c=Tg();this.scene.add(c.root),this.stationHotspots=c.stationHotspots,this.focusTargets=c.focusTargets,this.chef=new du(new O(.2,0,1.4),t),this.chef.group.rotation.y=-2.4,this.scene.add(this.chef.group),this.rig=new cu(o,t),this.canvas.addEventListener("pointerdown",this.onPointerDown),this.canvas.addEventListener("pointermove",this.onPointerMove),this.log.debug("motor listo, arranca el loop",{estaciones:this.stationHotspots.length}),this.loop();}canvas;log;renderer;scene=new Hr;rig;chef;raycaster=new Xo;pointer=new lt;clock=new qr;stationHotspots;focusTargets;clickHandler=null;frameId=0;disposed=false;paused=false;onStationClick(e){this.clickHandler=e;}flyIn(){return this.rig.flyIn()}focusStation(e){let t=this.focusTargets.get(e);return t?this.rig.focusStation(t):Promise.resolve()}resetView(){return this.rig.resetView()}celebrate(){this.chef.celebrate();}pause(){this.paused||this.disposed||(this.paused=true,cancelAnimationFrame(this.frameId),this.log.debug("loop en pausa"));}resume(){!this.paused||this.disposed||(this.paused=false,this.clock.getDelta(),this.log.debug("loop reanudado"),this.loop());}resize(e,t){this.disposed||e===0||t===0||(this.renderer.setSize(e,t,false),this.rig.setAspect(e/t));}dispose(){this.disposed=true,cancelAnimationFrame(this.frameId),this.canvas.removeEventListener("pointerdown",this.onPointerDown),this.canvas.removeEventListener("pointermove",this.onPointerMove),this.scene.traverse(e=>{let t=e;t.geometry?.dispose();let n=t.material;Array.isArray(n)?n.forEach(r=>r.dispose()):n?.dispose();}),this.renderer.dispose(),this.log.debug("motor liberado");}loop=()=>{if(this.disposed||this.paused)return;let e=this.clock.getDelta();this.rig.update(e),this.chef.update(e),this.renderer.render(this.scene,this.rig.camera),this.frameId=requestAnimationFrame(this.loop);};onPointerDown=e=>{let t=this.pickStation(e);t&&this.clickHandler&&this.clickHandler(t);};onPointerMove=e=>{this.canvas.style.cursor=this.pickStation(e)?"pointer":"default";};pickStation(e){let t=this.canvas.getBoundingClientRect();return this.pointer.x=(e.clientX-t.left)/t.width*2-1,this.pointer.y=-((e.clientY-t.top)/t.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.rig.camera),this.raycaster.intersectObjects(this.stationHotspots,false)[0]?.object.userData.station??null}};var aC=["canvas"],lC=(i,e)=>e.station;function cC(i,e){if(i&1&&(Rs$1(0,"p",13),ww$1(1),Ol$1()),i&2){let t=Pl$1(2);ll$1(),jl$1(" ",t.coachText," ");}}function uC(i,e){if(i&1&&(Ws$1(0,"canvas",12,0),Al$1(2,cC,2,1,"p",13)),i&2){let t=Pl$1();ll$1(2),xl(t.coachVisible()?2:-1);}}function dC(i,e){i&1&&(Rs$1(0,"div",2)(1,"h1",14),ww$1(2,"Tu cocina"),Ol$1(),Rs$1(3,"p"),ww$1(4,"Tu equipo no puede mostrar la cocina en 3D, pero puedes seguir igual desde abajo."),Ol$1()());}function hC(i,e){i&1&&(Rs$1(0,"span",16),ww$1(1,"\u{1F512}"),Ol$1());}function pC(i,e){if(i&1){let t=ZC();Rs$1(0,"button",15),Ys$1("click",function(){let r=Qf$1(t).$implicit,s=Pl$1();return Kf$1(s.handleStation(r.station))}),ww$1(1),Al$1(2,hC,2,0,"span",16),Ol$1();}if(i&2){let t=e.$implicit,n=Pl$1();Fl$1(n.stationClasses(t.active)),Pg("disabled",!t.active),Nn("aria-disabled",!t.active),ll$1(),jl$1(" ",t.label," "),ll$1(),xl(t.active?-1:2);}}function fC(i,e){if(i&1){let t=ZC();Rs$1(0,"app-recipe-book-3d",17),Ys$1("closed",function(){Qf$1(t);let r=Pl$1();return Kf$1(r.onRecipeBookClosed())}),Ol$1();}}var Ag="inline-flex items-center gap-2 min-h-11 px-4 sm:px-5 rounded-full border font-body text-sm font-semibold cursor-pointer transition duration-base ease-out focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-70",Rg=class i{canvasRef=Ej("canvas");webglSupported=q(true);coachVisible=q(false);bookOpen=q(false);coachText="Bienvenida a tu cocina. Antes de hornear, armemos tu libro de recetas.";stations=[{station:"RECIPE_BOARD",label:"Libro de recetas",active:true},{station:"PANTRY",label:"Despensa",active:false},{station:"OVEN",label:"Horno",active:false}];log=g(xm$1).scoped("ui/home");engine=null;reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??false;constructor(){let e=mC();this.webglSupported.set(e),this.log.debug(e?"hay WebGL: se monta el mundo 3D":"sin WebGL: ruta accesible DOM",{reducedMotion:this.reducedMotion});}ngAfterViewInit(){if(!this.webglSupported())return;let e=this.canvasRef()?.nativeElement;if(!e){this.log.debug("todav\xEDa no hay canvas, no se monta el motor");return}try{this.engine=new hu(e,this.reducedMotion,this.log.scoped("3d/kitchen")),this.engine.onStationClick(t=>this.handleStation(t)),this.engine.flyIn().then(()=>{this.bookOpen()||this.coachVisible.set(!0);}).catch(t=>this.log.error("la entrada de c\xE1mara ha fallado",t));}catch(t){this.log.warn("no se pudo crear el motor 3D: se cae a la ruta accesible",t),this.engine=null,this.webglSupported.set(false);}}ngOnDestroy(){this.engine?.dispose();}handleStation(e){if(e!=="RECIPE_BOARD"){this.log.debug("estaci\xF3n inerte en la Fase 0, no se hace nada",{station:e});return}this.openRecipeBook();}openRecipeBook(){this.bookOpen()||(this.log.debug("abriendo el libro de recetas"),this.coachVisible.set(false),this.engine?.focusStation("RECIPE_BOARD").catch(e=>this.log.error("no se pudo enfocar la estaci\xF3n",e)),this.engine?.pause(),this.bookOpen.set(true));}onRecipeBookClosed(){this.log.debug("libro cerrado, vuelve la cocina"),this.bookOpen.set(false),this.engine?.resume(),this.engine?.resetView().catch(e=>this.log.error("no se pudo volver a la vista general",e)),this.webglSupported()&&this.coachVisible.set(true);}onResize(){let e=this.canvasRef()?.nativeElement;e&&this.engine?.resize(e.clientWidth,e.clientHeight);}stationClasses(e){return e?`${Ag} bg-brand border-brand text-on-brand hover:bg-brand-hover`:`${Ag} bg-surface-warm border-border-strong text-body`}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=So$1({type:i,selectors:[["app-home"]],viewQuery:function(t,n){t&1&&qg$1(n.canvasRef,aC,5),t&2&&tw$1();},hostAttrs:[1,"block","fixed","inset-0","overflow-hidden"],hostBindings:function(t,n){t&1&&Ys$1("resize",function(){return n.onResize()},nE);},decls:17,vars:2,consts:[["canvas",""],[1,"absolute","inset-0"],[1,"flex","flex-col","gap-3","items-center","justify-center","h-full","p-8","text-center","text-body"],[1,"absolute","top-4","inset-x-4","flex","items-start","justify-between","gap-2","pointer-events-none"],[1,"pointer-events-auto","flex","min-w-0","items-center","gap-3","px-4","py-2","bg-surface-card","border","border-border-subtle","rounded-full","shadow-md"],[1,"shrink-0","px-3","py-0.5","rounded-full","bg-brand","text-on-brand","font-bold","text-caption"],[1,"min-w-0","truncate","font-display","text-heading","text-sm"],["routerLink","/cuenta","aria-label","Cuenta",1,"pointer-events-auto","inline-flex","shrink-0","min-h-11","items-center","gap-2","px-4","rounded-full","bg-surface-card","border","border-border-subtle","shadow-md","font-body","text-sm","font-semibold","text-body","cursor-pointer","transition","duration-base","ease-out","hover:bg-surface-sunken","focus-visible:outline-none","focus-visible:shadow-focus","motion-reduce:transition-none"],["name","mat:settings","size","sm"],[1,"hidden","sm:inline"],["aria-label","Estaciones de la cocina",1,"absolute","bottom-5","inset-x-3","mx-auto","flex","w-fit","flex-wrap","justify-center","gap-2","p-2","sm:gap-3","sm:p-3","bg-surface-card","border","border-border-subtle","rounded-2xl","shadow-lg"],["type","button",3,"class","disabled"],["aria-hidden","true",1,"block","w-full","h-full"],["role","status",1,"absolute","top-12","left-4","right-4","mx-auto","my-0","max-w-md","px-5","py-4","bg-surface-card","border","border-border-subtle","rounded-xl","shadow-lg","text-body","text-base","text-center"],[1,"text-h1"],["type","button",3,"click","disabled"],["aria-label","se desbloquea m\xE1s adelante",1,"text-caption"],[3,"closed"]],template:function(t,n){t&1&&(Rs$1(0,"div",1),Al$1(1,uC,3,1)(2,dC,5,0,"div",2),Rs$1(3,"div",3)(4,"header",4)(5,"span",5),ww$1(6," Nivel 0 "),Ol$1(),Rs$1(7,"span",6),ww$1(8," El libro de recetas en blanco "),Ol$1()(),Rs$1(9,"a",7),Ws$1(10,"migo-icon",8),Rs$1(11,"span",9),ww$1(12,"Cuenta"),Ol$1()()(),Rs$1(13,"nav",10),UC(14,pC,3,6,"button",11,lC),Ol$1(),Al$1(16,fC,1,0,"app-recipe-book-3d"),Ol$1()),t&2&&(ll$1(),xl(n.webglSupported()?1:2),ll$1(13),VC(n.stations),ll$1(2),xl(n.bookOpen()?16:-1));},dependencies:[lu,Nv$1,xv$1],encapsulation:2})};function mC(){try{let i=document.createElement("canvas");return !!(i.getContext("webgl2")??i.getContext("webgl"))}catch{return  false}}export{Rg as Home3d};
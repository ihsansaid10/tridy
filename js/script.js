const $=s=>document.querySelector(s),T=THREE;
T.ColorManagement.legacyMode=false;
const ASP={'1:1':1,'4:5':.8,'16:9':16/9,'9:16':9/16};
const P=o=>({stars:0,neb:0,exp:1,bri:1,fog:0,...o});
const PRE={
 daylight:P({n:'☀️ Daylight',top:'#3f8fe0',hor:'#d3e9ff',bot:'#8f9aa6',sun:'#fff4e0',int:2.2,el:55,az:40}),
 sunset:P({n:'🌇 Sunset',top:'#3d3585',hor:'#ff7b57',bot:'#6b2f55',sun:'#ff8f6b',int:1.8,el:7,az:210,fog:.12}),
 golden:P({n:'🌆 Golden Hour',top:'#34588f',hor:'#ffb347',bot:'#5e4126',sun:'#ffb04d',int:2.6,el:13,az:235,fog:.08,exp:1.1}),
 night:P({n:'🌃 Night City',top:'#03060f',hor:'#123a73',bot:'#04060c',sun:'#5c8dff',int:.5,el:35,az:300,stars:.6,fog:.15,exp:1.2}),
 space:P({n:'🌌 Space',top:'#01010a',hor:'#2b1257',bot:'#01010a',sun:'#d0d8ff',int:1.4,el:30,az:120,stars:1,neb:1}),
 overcast:P({n:'☁️ Overcast',top:'#aab3bb',hor:'#d8dce0',bot:'#8f969c',sun:'#ffffff',int:.8,el:70,az:0,fog:.25})
};
const LP={
 cinematic:{s:.4,L:[['spot',[5,6,4],'#ffcf9a',2.6],['point',[-5,3,-4],'#6fa8ff',1.6],['point',[0,2,6],'#ffffff',.4]]},
 softbox:{s:.3,L:[['area',[4,5,4],'#ffffff',7],['area',[-4,4,3],'#fff3e6',5],['area',[0,3,-5],'#ffffff',4]]},
 dramatic:{s:.05,L:[['spot',[3,7,1],'#ffffff',4.5],['point',[-4,1.5,-3],'#ff4d3d',1.4]]},
 neon:{s:.05,L:[['point',[-3,2,2],'#ff2bd6',2.6],['point',[3,2,-2],'#27e6ff',2.6],['spot',[0,6,3],'#6a4cff',2]]}
};
const QS={draft:{e:1280,ss:1,sm:1024,fx:0},high:{e:2048,ss:1.5,sm:2048,fx:1},ultra:{e:3072,ss:2,sm:4096,fx:1}};
let S={bg:'sky',sky:'daylight',studio:'#d9d9d9',gA:'#1d2b53',gB:'#ff8a5c',ground:'shadow',gcol:'#9a9a9a',grid:false,pedestal:false,q:'high',
 cam:{type:'persp',focal:50,aspect:'16:9',locked:false,thirds:true},...(({n,...d})=>d)(PRE.daylight)};

/* ---------- scene ---------- */
const rd=new T.WebGLRenderer({antialias:true,alpha:true});
rd.outputEncoding=T.sRGBEncoding;rd.toneMapping=T.ACESFilmicToneMapping;rd.shadowMap.enabled=true;rd.shadowMap.type=T.PCFSoftShadowMap;
rd.setPixelRatio(Math.min(devicePixelRatio,1.5));rd.setClearColor(0,0);
$('#stage').prepend(rd.domElement);
T.RectAreaLightUniformsLib.init();
const scene=new T.Scene();scene.fog=new T.FogExp2(0,0);
const U={top:{value:new T.Color()},hor:{value:new T.Color()},bot:{value:new T.Color()},bri:{value:1},stars:{value:0},neb:{value:0}};
const sky=new T.Mesh(new T.SphereGeometry(500,32,16),new T.ShaderMaterial({uniforms:U,side:T.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform vec3 top,hor,bot;uniform float bri,stars,neb;varying vec3 vP;
 float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
 void main(){float y=vP.y;vec3 c=y>0.?mix(hor,top,pow(y,.6)):mix(hor,bot,pow(-y,.5));
 if(stars>0.){c+=step(.9975,h(floor(vP*220.)))*stars*step(-.1,y);
  float n=(sin(vP.x*3.+sin(vP.y*4.))*sin(vP.z*3.+vP.y*2.))*.5+.5;c+=neb*n*n*vec3(.35,.1,.5)*.6;}
 gl_FragColor=vec4(pow(c*bri,vec3(1./2.2)),1.);}`}));
sky.renderOrder=-1;sky.frustumCulled=false;scene.add(sky);
const hemi=new T.HemisphereLight(0xffffff,0x444444,.55),sun=new T.DirectionalLight();
Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:80});
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
scene.add(hemi,sun);
const gShadow=new T.ShadowMaterial({opacity:.45}),gSolid=new T.MeshStandardMaterial({roughness:.9}),ground=new T.Mesh(new T.PlaneGeometry(200,200),gShadow);
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const grid=new T.GridHelper(20,20,0x999999,0x555555);grid.position.y=.002;scene.add(grid);
const pedestal=new T.Mesh(new T.CylinderGeometry(1.4,1.5,.3,64),new T.MeshStandardMaterial({color:'#cfcfcf',roughness:.6}));
pedestal.position.y=.15;pedestal.castShadow=pedestal.receiveShadow=true;scene.add(pedestal);

/* ---------- camera ---------- */
const persp=new T.PerspectiveCamera(35,16/9,.1,2000),ortho=new T.OrthographicCamera(-5,5,5,-5,-500,2000);
persp.position.set(5,3.5,6);let cam=persp;
const controls=new T.OrbitControls(cam,rd.domElement);controls.enableDamping=true;controls.target.set(0,.8,0);
const tc=new T.TransformControls(cam,rd.domElement);scene.add(tc);
tc.addEventListener('dragging-changed',e=>controls.enabled=!e.value&&!S.cam.locked);
tc.addEventListener('objectChange',fillUI);
tc.addEventListener('mouseUp',commit);
function switchCam(t){
 const n=t=='ortho'?ortho:persp;if(n===cam)return;
 const tg=controls.target,half=Math.tan(persp.fov*Math.PI/360);let d=cam.position.distanceTo(tg);
 if(n===ortho)ortho.zoom=10/(2*d*half);else d=(10/ortho.zoom)/(2*half);
 n.position.copy(tg).addScaledVector(cam.position.clone().sub(tg).normalize(),d);n.quaternion.copy(cam.quaternion);n.updateProjectionMatrix();
 cam=n;controls.object=n;tc.camera=n;
}
function fit(){
 const r=$('#vp').getBoundingClientRect(),a=ASP[S.cam.aspect];let w=r.width-24,h=r.height-24;
 if(w/h>a)w=h*a;else h=w/a;w=Math.max(40,Math.floor(w));h=Math.max(40,Math.floor(h));
 $('#stage').style.width=w+'px';$('#stage').style.height=h+'px';rd.setSize(w,h);
 persp.aspect=a;ortho.left=-5*a;ortho.right=5*a;persp.updateProjectionMatrix();ortho.updateProjectionMatrix();
}

/* ---------- state / items ---------- */
let items=[],uid=0,sel=null,tool='move',hist=[],hi=-1,ped=false,lastAsp=null;const reg=new Map();
const gp=k=>k.split('.').reduce((o,x)=>o[x],S);
const sp=(k,v)=>{const a=k.split('.'),l=a.pop();a.reduce((o,x)=>o[x],S)[l]=v};
function applyAll(){
 const m=S.bg,tr=m=='transparent';let c={top:S.top,hor:S.hor,bot:S.bot};
 if(m=='studio')c={top:S.studio,hor:S.studio,bot:S.studio};
 if(m=='gradient')c={top:S.gA,hor:'#'+new T.Color(S.gA).lerp(new T.Color(S.gB),.5).getHexString(),bot:S.gB};
 U.top.value.set(c.top);U.hor.value.set(c.hor);U.bot.value.set(c.bot);U.bri.value=S.bri;
 U.stars.value=m=='sky'?S.stars:0;U.neb.value=m=='sky'?S.neb:0;sky.visible=!tr;rd.toneMappingExposure=S.exp;
 scene.fog.color.set(c.hor).multiplyScalar(Math.min(1,S.bri));scene.fog.density=tr?0:S.fog*.08;
 const e=S.el*Math.PI/180,az=S.az*Math.PI/180;
 sun.color.set(S.sun);sun.intensity=S.int;sun.position.set(Math.cos(e)*Math.sin(az),Math.sin(e),Math.cos(e)*Math.cos(az)).multiplyScalar(30);
 hemi.color.set(c.top);hemi.groundColor.set(c.bot);
 ground.visible=S.ground!='off';ground.material=S.ground=='solid'?gSolid:gShadow;gSolid.color.set(S.gcol);
 grid.visible=S.grid;pedestal.visible=S.pedestal;
 if(S.pedestal!=ped){const d=S.pedestal?.3:-.3;items.forEach(t=>t.kind!='light'&&(t.obj.position.y+=d));ped=S.pedestal}
 if(S.cam.type!=(cam===ortho?'ortho':'persp'))switchCam(S.cam.type);
 persp.fov=2*Math.atan((ASP[S.cam.aspect]<1?18:12)/S.cam.focal)*180/Math.PI;persp.updateProjectionMatrix();
 if(lastAsp!=S.cam.aspect){lastAsp=S.cam.aspect;fit()}
 controls.enabled=!S.cam.locked&&!tc.dragging;
 $('#thirds').classList.toggle('on',S.cam.thirds);$('#lock').classList.toggle('on',S.cam.locked);
 $('#hud').textContent=`${cam===ortho?'Orthographic':'Perspective'} · ${S.cam.aspect} · ${Math.round(S.cam.focal)}mm${S.cam.locked?' · camera locked':''}`;
}
function setColor(it,hex){it.color=hex;if(it.kind=='light'){it.obj.color.set(hex);it.obj.children[0].material.color.set(hex)}else it.obj.traverse(m=>{if(!m.isMesh)return;(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{if(!x.color)return;if(it.keep){x.userData.oc=x.userData.oc||x.color.clone();x.color.copy(x.userData.oc).multiply(new T.Color(hex))}else x.color.set(hex)})})}
function add(it){it.id=++uid;it.color=it.color||'#b8b8b8';reg.set(it.id,it);scene.add(it.obj);items.push(it);setColor(it,it.color);select(it);commit()}
function rm(t){scene.remove(t.obj);items=items.filter(x=>x!==t)}
function del(){if(!sel)return;rm(sel);select(null);commit()}
function prep(o,keep){
 const mat=new T.MeshStandardMaterial({color:'#d0d0d0',roughness:.55,metalness:.05,side:T.DoubleSide});
 o.traverse(m=>{if(m.isMesh){if(!keep)m.material=mat;m.castShadow=m.receiveShadow=true;if(!m.geometry.attributes.normal)m.geometry.computeVertexNormals()}});
 const n=items.filter(t=>t.kind=='obj').length;let b=new T.Box3().setFromObject(o);
 o.scale.setScalar(2/(Math.max(...b.getSize(new T.Vector3()).toArray())||1));o.updateMatrixWorld(true);
 b=new T.Box3().setFromObject(o);const c=b.getCenter(new T.Vector3());
 o.position.set(-c.x+n*2.5,-b.min.y+(S.pedestal?.3:0),-c.z);
}
function addFiles(fl){[...fl].forEach(f=>{
 const g=/\.glb$/i.test(f.name);if(!g&&!/\.obj$/i.test(f.name))return;
 const r=new FileReader(),nm=f.name.replace(/\.(obj|glb)$/i,''),bad=()=>alert('Gagal membaca '+f.name);
 r.onload=()=>{try{
  if(g)new T.GLTFLoader().parse(r.result,'',x=>{prep(x.scene,true);add({kind:'obj',keep:true,obj:x.scene,name:nm,color:'#ffffff'})},bad);
  else{const o=new T.OBJLoader().parse(r.result);prep(o);add({kind:'obj',obj:o,name:nm,color:'#d0d0d0'})}
 }catch(e){bad()}};
 g?r.readAsArrayBuffer(f):r.readAsText(f)})}
function addPrim(t){
 const g={cube:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(.5,48,32),cylinder:new T.CylinderGeometry(.5,.5,1,48)}[t];
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color:'#b8b8b8',roughness:.5}));m.castShadow=m.receiveShadow=true;
 m.position.set(0,.5+(S.pedestal?.3:0),0);add({kind:'prim',obj:m,name:t[0].toUpperCase()+t.slice(1)});
}
function addLight(type,pos=[3,4,3],col='#ffffff',int=1.5,s=true){
 let L;
 if(type=='sun')L=new T.DirectionalLight(col,int);
 else if(type=='point')L=new T.PointLight(col,int,0);
 else if(type=='spot')L=new T.SpotLight(col,int,0,.6,.4);
 else L=new T.RectAreaLight(col,int,3,3);
 if(L.shadow){L.castShadow=true;L.shadow.mapSize.set(1024,1024);L.shadow.bias=-.0005;if(type=='sun')Object.assign(L.shadow.camera,{left:-8,right:8,top:8,bottom:-8})}
 L.add(new T.Mesh(new T.SphereGeometry(.12,16,8),new T.MeshBasicMaterial({color:col})));
 L.position.set(...pos);L.lookAt(0,0,0);
 const it={kind:'light',ltype:type,obj:L,name:type[0].toUpperCase()+type.slice(1)+' light',int,color:col};
 if(s)add(it);else{it.id=++uid;reg.set(it.id,it);scene.add(L);items.push(it)}
}
function lightPreset(n){const d=LP[n];items.filter(t=>t.kind=='light').forEach(rm);S.int=d.s;d.L.forEach(l=>addLight(...l,false));select(null);applyAll();fillUI();commit()}
function preset(k){const {n,...d}=PRE[k];Object.assign(S,d,{sky:k,bg:'sky'})}

/* ---------- undo / redo ---------- */
const snap=()=>JSON.stringify({S,i:items.map(t=>{const o=t.obj;return[t.id,o.position.toArray(),[o.rotation.x,o.rotation.y,o.rotation.z],o.scale.toArray(),t.color,t.int]})});
function commit(){const j=snap();if(j==hist[hi])return;hist=hist.slice(0,hi+1);hist.push(j);if(hist.length>80)hist.shift();hi=hist.length-1;btns()}
function restore(j){
 const d=JSON.parse(j),keep=new Set(d.i.map(x=>x[0]));S=d.S;
 items.forEach(t=>{if(!keep.has(t.id))scene.remove(t.obj)});
 items=d.i.map(x=>{const t=reg.get(x[0]),o=t.obj;if(!o.parent)scene.add(o);
  o.position.fromArray(x[1]);o.rotation.set(...x[2]);o.scale.fromArray(x[3]);setColor(t,x[4]);if(x[5]!=null){t.int=x[5];o.intensity=x[5]}return t});
 ped=S.pedestal;if(sel&&!items.includes(sel))sel=null;select(sel);applyAll();fillUI();btns();
}
const undo=()=>{if(hi>0)restore(hist[--hi])},redo=()=>{if(hi<hist.length-1)restore(hist[++hi])};
function btns(){$('#bUndo').disabled=hi<=0;$('#bRedo').disabled=hi>=hist.length-1}

/* ---------- selection / tools ---------- */
function select(it){sel=it;tc.detach();if(it&&tool!='select')tc.attach(it.obj);objPanel();outl()}
function setTool(t){tool=t;tc.setMode({move:'translate',rotate:'rotate',scale:'scale'}[t]||'translate');tc.detach();if(sel&&t!='select')tc.attach(sel.obj);
 document.querySelectorAll('#tools [data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool==t))}
function outl(){
 $('#outl').innerHTML=items.map(t=>`<li data-id="${t.id}" class="${t===sel?'on':''}">${{obj:'▲',prim:'■',light:'💡'}[t.kind]} ${t.name}</li>`).join('')||'<li class="hint">Scene kosong</li>';
 $('#cnt').textContent=items.length+' item';
}
$('#outl').onclick=e=>{const l=e.target.closest('li[data-id]');if(l)select(items.find(t=>t.id==l.dataset.id))};

/* ---------- panels ---------- */
const R=(l,k,a,b,s,d='k')=>`<label class="row"><span>${l}</span><input type="range" data-${d}="${k}" min="${a}" max="${b}" step="${s}"><output></output></label>`;
const C=(l,k)=>`<label class="row"><span>${l}</span><input type="color" data-k="${k}"></label>`;
const K=(l,k)=>`<label class="row"><span>${l}</span><input type="checkbox" data-k="${k}"></label>`;
const D=(l,k,o)=>`<label class="row"><span>${l}</span><select data-k="${k}">${o.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label>`;
const B=(a,t)=>`<button data-a="${a}">${t}</button>`;
const PANELS={
 obj:'',
 cam:D('Type','cam.type',[['persp','Perspective'],['ortho','Orthographic']])+R('Focal length (mm)','cam.focal',12,200,1)+
  D('Aspect ratio','cam.aspect',[['16:9','16:9'],['1:1','1:1'],['4:5','4:5'],['9:16','9:16']])+K('Rule of thirds','cam.thirds')+K('Lock camera (L)','cam.locked')+
  '<p class="hint">Orbit: drag. Pan: Shift+drag atau klik kanan. Zoom: scroll. Frame di viewport = hasil render.</p>',
 world:D('Background','bg',[['sky','Sky'],['studio','Infinite studio'],['gradient','Gradient'],['transparent','Transparent']])+
  D('Sky preset','sky',Object.entries(PRE).map(([k,v])=>[k,v.n]))+R('Sun intensity','int',0,6,.05)+R('Exposure','exp',.2,3,.01)+R('Fog','fog',0,1,.01)+R('BG brightness','bri',0,2,.01)+
  R('Sun elevation','el',1,90,1)+R('Sun azimuth','az',0,360,1)+C('Sun color','sun')+C('Studio color','studio')+C('Gradient top','gA')+C('Gradient bottom','gB'),
 light:`<h5>Add light</h5><div class="g2">${B('light:sun','☀️ Sun')}${B('light:point','💡 Point')}${B('light:spot','🔦 Spot')}${B('light:area','▭ Area')}</div>
  <h5>Presets</h5><div class="g2">${B('lp:cinematic','Cinematic')}${B('lp:softbox','Softbox')}${B('lp:dramatic','Dramatic')}${B('lp:neon','Neon')}</div>
  <p class="hint">Pilih light di outliner untuk atur warna, intensitas, dan posisi. Preset mengganti semua light buatanmu dan menurunkan sun. Sun dan Spot selalu mengarah ke titik tengah.</p>`,
 studio:D('Ground','ground',[['shadow','Shadow catcher'],['solid','Solid floor'],['off','None']])+C('Floor color','gcol')+K('Grid floor','grid')+K('Pedestal','pedestal')+
  `<h5>Primitives</h5><div class="g2">${B('prim:cube','Cube')}${B('prim:sphere','Sphere')}${B('prim:cylinder','Cylinder')}</div>`,
 render:D('Quality','q',[['draft','Draft (1280px)'],['high','High (2048px)'],['ultra','Ultra (3072px)']])+
  '<p class="hint">Preview tetap ringan. Kualitas hanya berlaku saat render: resolusi, supersampling antialiasing, resolusi shadow, dan color grade + vignette (High/Ultra).</p>'+
  `<div class="g2">${B('png','Render PNG')}${B('jpg','Render JPG')}</div>`
};
const TABS=[['obj','🟧','Object'],['cam','🎥','Camera'],['world','🌍','World'],['light','💡','Lights'],['studio','🧱','Studio'],['render','📷','Render']];
$('#props').innerHTML=TABS.map(t=>`<div class="pn" id="p-${t[0]}">${PANELS[t[0]]}</div>`).join('');
$('#tabs').innerHTML=TABS.map(t=>`<button data-t="${t[0]}" title="${t[2]}">${t[1]}</button>`).join('');
$('#tabs').onclick=e=>{const b=e.target.closest('[data-t]');if(b)tab(b.dataset.t)};
function tab(t){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));document.querySelectorAll('.pn').forEach(p=>p.classList.toggle('on',p.id=='p-'+t))}
function objPanel(){
 const p=$('#p-obj');
 if(!sel){p.innerHTML='<p class="hint">Pilih object di outliner atau klik di viewport. Import file .obj atau .glb lewat tombol di atas atau drop ke viewport.</p>';return}
 const l=sel.kind=='light';
 p.innerHTML=`<label class="row"><span>Name</span><input type="text" data-s="name"></label>`+
  ['X','Y','Z'].map((a,i)=>`<label class="row"><span>Location ${a}</span><input type="number" step=".1" data-s="p${i}"></label>`).join('')+
  (l?'':R('Scale','sc',.05,10,.01,'s'))+`<label class="row"><span>Color</span><input type="color" data-s="color"></label>`+
  (l?R('Intensity','int',0,sel.ltype=='area'?20:10,.05,'s'):'')+
  '<button data-a="del" style="width:100%;margin-top:8px">Delete (Del)</button><p class="hint">G pindah, R putar, S scale. Slider Scale = resize seragam.</p>';
 fillUI();
}
function rng(e){if(e.type=='range'){e.style.setProperty('--p',(e.value-e.min)/(e.max-e.min)*100+'%');const o=e.nextElementSibling;if(o)o.textContent=(+e.value).toFixed(2).replace(/\.?0+$/,'')}}
function fillUI(){
 document.querySelectorAll('[data-k]').forEach(e=>{const v=gp(e.dataset.k);if(e.type=='checkbox')e.checked=v;else e.value=v;rng(e)});
 if(sel)document.querySelectorAll('[data-s]').forEach(e=>{
  if(e===document.activeElement&&e.type!='range')return;const k=e.dataset.s,o=sel.obj;
  e.value=k=='name'?sel.name:k=='color'?sel.color:k=='int'?sel.int:k=='sc'?o.scale.x:Math.round(o.position.getComponent(+k[1])*1000)/1000;rng(e)});
}
$('#props').addEventListener('input',e=>{
 const t=e.target,k=t.dataset.k,s=t.dataset.s;
 if(k){sp(k,t.type=='checkbox'?t.checked:t.type=='range'?+t.value:t.value);if(k=='sky')preset(t.value);applyAll();fillUI()}
 else if(s&&sel){const o=sel.obj,v=t.value;
  if(s=='name'){sel.name=v;outl()}else if(s=='color')setColor(sel,v);else if(s=='int'){sel.int=+v;o.intensity=+v}
  else if(s=='sc')o.scale.setScalar(+v);else if(!isNaN(parseFloat(v)))o.position.setComponent(+s[1],parseFloat(v));
  rng(t)}
});
$('#props').addEventListener('change',commit);
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 if(a=='del')del();else if(a=='import')$('#file').click();else if(a=='png'||a=='jpg')exportImg(a);
 else if(a=='undo')undo();else if(a=='redo')redo();
 else if(a.startsWith('prim:'))addPrim(a.slice(5));else if(a.startsWith('light:')){addLight(a.slice(6));tab('obj')}else if(a.startsWith('lp:'))lightPreset(a.slice(3));
});
$('#tools').innerHTML=[['select','⬚','Select (Q)'],['move','✥','Move (G)'],['rotate','⟲','Rotate (R)'],['scale','⤡','Scale (S)']].map(t=>`<button data-tool="${t[0]}" title="${t[2]}">${t[1]}</button>`).join('')+
 '<button id="lock" title="Lock camera (L)" style="margin-top:auto">🔒</button>';
$('#tools').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tool)setTool(b.dataset.tool);else{S.cam.locked=!S.cam.locked;applyAll();fillUI();commit()}};

/* ---------- input ---------- */
$('#file').onchange=e=>{addFiles(e.target.files);e.target.value=''};
$('#vp').ondragover=e=>e.preventDefault();
$('#vp').ondrop=e=>{e.preventDefault();addFiles(e.dataTransfer.files)};
let dn;rd.domElement.addEventListener('pointerdown',e=>dn=[e.clientX,e.clientY]);
rd.domElement.addEventListener('pointerup',e=>{
 if(!dn||e.button||tc.axis||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>4)return;
 const r=rd.domElement.getBoundingClientRect(),rc=new T.Raycaster();
 rc.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
 const h=rc.intersectObjects(items.map(t=>t.obj),true)[0];
 select(h?items.find(t=>{for(let o=h.object;o;o=o.parent)if(o===t.obj)return true}):null);
});
addEventListener('keydown',e=>{
 if(e.target.matches('input[type=text],input[type=number],select'))return;
 const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
 if(c&&k=='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(c&&k=='y'){e.preventDefault();redo()}
 else if(!c){if(k=='q')setTool('select');else if(k=='g')setTool('move');else if(k=='r')setTool('rotate');else if(k=='s')setTool('scale');
  else if(k=='l'){S.cam.locked=!S.cam.locked;applyAll();fillUI();commit()}else if((k=='delete'||k=='x')&&sel)del()}
});
new ResizeObserver(fit).observe($('#vp'));

/* ---------- export ---------- */
function shadows(n){scene.traverse(o=>{if(o.isLight&&o.castShadow){const s=o.isPointLight?Math.min(n,2048):n;o.shadow.mapSize.set(s,s);if(o.shadow.map){o.shadow.map.dispose();o.shadow.map=null}}})}
function exportImg(fmt){
 const Q=QS[S.q],a=ASP[S.cam.aspect],w=a>=1?Q.e:Math.round(Q.e*a),h=a>=1?Math.round(Q.e/a):Q.e;
 const gl=rd.getContext(),cap=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),ss=Math.min(Q.ss,cap/Math.max(w,h));
 const pr=rd.getPixelRatio(),lg=items.filter(t=>t.kind=='light');
 tc.visible=false;lg.forEach(t=>t.obj.children[0].visible=false);shadows(Q.sm);
 rd.setPixelRatio(1);rd.setSize(Math.round(w*ss),Math.round(h*ss),false);rd.render(scene,cam);
 const out=document.createElement('canvas');out.width=w;out.height=h;const x=out.getContext('2d');x.imageSmoothingQuality='high';
 if(fmt=='jpg'){x.fillStyle='#fff';x.fillRect(0,0,w,h)}
 if(Q.fx)x.filter='contrast(1.06) saturate(1.1)';
 x.drawImage(rd.domElement,0,0,w,h);x.filter='none';
 if(Q.fx&&S.bg!='transparent'){const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*.45,w/2,h/2,Math.hypot(w,h)/2);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.32)');x.fillStyle=g;x.fillRect(0,0,w,h)}
 rd.setPixelRatio(pr);fit();shadows(1024);tc.visible=true;lg.forEach(t=>t.obj.children[0].visible=true);
 out.toBlob(b=>{const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=`photobooth-${Date.now()}.${fmt}`;l.click()},fmt=='jpg'?'image/jpeg':'image/png',.95);
}

/* ---------- start ---------- */
setTool('move');tab('obj');fit();applyAll();addPrim('sphere');fillUI();
(function loop(){requestAnimationFrame(loop);controls.update();sky.position.copy(cam.position);rd.render(scene,cam)})();
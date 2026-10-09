// Inline, plain-ES5 script injected into <head> by layout.tsx. Candidates
// often open the site from the Facebook Messenger / Zalo in-app browser,
// and on older phones that webview can fail to run the Next.js bundle: the
// server-rendered page looks fine but every "ỨNG TUYỂN" button is dead.
// This script runs without React (so it works exactly when React doesn't):
//  - if the app hasn't hydrated (window.__jtReady, set in
//    SiteContentProvider) a few seconds after load, a tap on any button
//    shows how to reopen the link in Chrome/Safari instead of doing nothing;
//  - it reports the user agent + any JS errors once to /api/client-report,
//    which forwards to the Lark alert group, so we learn which browsers
//    break instead of guessing.
// Keep it ES5 (var, function, no arrow/template literals): it must parse
// on the very browsers the main bundle can't.
export const IN_APP_BROWSER_GUARD_SCRIPT = `(function(){
var errs=[],start=Date.now(),reported=false,shown=false;
function push(m){if(errs.length<5)errs.push(String(m).slice(0,300));}
window.addEventListener('error',function(e){push(e.message||(e.target&&(e.target.src||e.target.href))||'error');},true);
window.addEventListener('unhandledrejection',function(e){var r=e.reason;push('rejection: '+(r&&r.message?r.message:r));});
function ready(){return !!window.__jtReady;}
function report(reason){
  if(reported)return;reported=true;
  try{var x=new XMLHttpRequest();x.open('POST','/api/client-report');x.setRequestHeader('Content-Type','application/json');
  x.send(JSON.stringify({reason:reason,ua:navigator.userAgent,url:location.href,secs:Math.round((Date.now()-start)/1000),errors:errs}));}catch(_){}
}
function copy(text,btn){
  var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();try{ta.setSelectionRange(0,text.length);}catch(_){}
  var ok=false;try{ok=document.execCommand('copy');}catch(_){}
  document.body.removeChild(ta);btn.innerHTML=ok?'Đã chép link ✓':'Hãy giữ tay vào link ở trên để chép';
}
function showHelp(){
  report('tap_before_ready');
  if(shown)return;shown=true;
  var link=location.origin+'/';
  var o=document.createElement('div');o.setAttribute('data-jt-guard','');
  o.setAttribute('style','position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit');
  o.innerHTML='<div style="background:#fff;border-radius:16px;max-width:360px;width:100%;padding:20px;color:#111;font-size:15px;line-height:1.5">'+
    '<div style="font-weight:800;font-size:17px;margin-bottom:8px">Trình duyệt trong ứng dụng chưa hỗ trợ</div>'+
    '<div>Trình duyệt bên trong Facebook/Zalo trên máy bạn chưa mở được form ứng tuyển. Bạn vui lòng:</div>'+
    '<div style="margin:10px 0">1. Bấm dấu <b>•••</b> ở góc trên màn hình → chọn <b>Mở bằng trình duyệt</b> (Chrome/Safari).</div>'+
    '<div style="margin:10px 0">2. Hoặc chép link dưới đây, dán vào Chrome/Safari:</div>'+
    '<div style="background:#f3f3f3;border-radius:8px;padding:8px 10px;word-break:break-all;user-select:all;-webkit-user-select:all">'+link+'</div>'+
    '<button type="button" data-jt-copy style="margin-top:12px;width:100%;border:0;border-radius:999px;background:#ec4176;color:#fff;font-weight:700;padding:11px">Chép link</button>'+
    '<div style="margin-top:10px;font-size:13px;color:#666;text-align:center">Cần hỗ trợ: hotline <b>1800.0046</b></div>'+
    '<button type="button" data-jt-close style="margin-top:6px;width:100%;border:0;background:none;color:#666;padding:8px">Đóng</button></div>';
  document.body.appendChild(o);
  o.addEventListener('click',function(e){
    var t=e.target;
    if(t.getAttribute&&t.getAttribute('data-jt-copy')!==null){copy(link,t);return;}
    if(t===o||(t.getAttribute&&t.getAttribute('data-jt-close')!==null)){document.body.removeChild(o);shown=false;}
  });
}
document.addEventListener('click',function(e){
  if(ready()||Date.now()-start<4000)return;
  var t=e.target,hit=false;
  while(t&&t!==document){
    if(t.getAttribute&&t.getAttribute('data-jt-guard')!==null)return;
    if(t.tagName==='BUTTON'||(t.getAttribute&&t.getAttribute('role')==='button'))hit=true;
    t=t.parentNode;
  }
  if(hit){e.preventDefault();e.stopPropagation();showHelp();}
},true);
setTimeout(function(){if(!ready())report('not_ready_after_15s');},15000);
})();`;

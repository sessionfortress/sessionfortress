(function(){
 var c = -1;
 var queue = [];
 var loginorigin = '@LOGIN_ORIGIN@';
 var topdomain = '@TOP_DOMAIN@';
 var apaths = @AUTHENTICATED_PATHS@;
 var parser = document.createElement('a');

// Invisible CSF token - breaks back button
// var l = location.href;
// var lr = l.replace(/([?]|[?&]__csrf=)[a-z0-9._-]{80,}$/i,'');
// if(l != lr) history.replaceState({},'',lr); 

 var isrelated = function(x){
  return x.substr(x.length-topdomain.length)==topdomain;
 }

 var checkattr = function(x){
  parser.href = x;
  if(parser.search.match(/\?[a-z0-9._-]{80,}$/i)) return false;
  if(parser.protocol != 'https:') return false;
  if(!isrelated(parser.hostname)) return false;
  if(parser.origin == loginorigin) return false;
  if(!parser.pathname.match(apaths)) return false;
  return parser.href;
 }

 window.addEventListener('message', function(e){
  if(e.origin != loginorigin)
   return;
  var o = JSON.parse(e.data);
  queue[o.id](o.sig);
  delete queue[o.id];
 });

 window.addEventListener('load', function() {
  var w = document.querySelector("#csrf-frame").contentWindow;

  var sigRequest = function(id, met, url) {
   w.postMessage(JSON.stringify({id:id, method: met, url: url}), loginorigin);
  };

  var fixattr = function(tag, attr){
   var v = tag.getAttribute(attr);
   var url = checkattr(v);
   if(!url) return;
   queue[++c] = function(sig){
    tag.setAttribute(attr, v+'?'+sig);
   }
   sigRequest(c, attr == 'action' ? 'POST' : 'GET', url);
  };

  var checkForm = function(f) {
   if(f.__csrfOK) return;
   if(f.method == 'post') return;

   f.addEventListener('submit', function(e) {
    if(this.__signed){ this.__signed = false; return; }
    if(this.method == 'post') return;

    var e = this.elements, qs = '?';
    for(var i = 0; i<e.length; i++) {
     var n = e[i];
     if(n.name == '__csrf') {
      n.parentElement.removeChild(n); continue;
     }
     if (n.name)
      qs += encodeURIComponent(n.name)+'='+encodeURIComponent(n.value)+'&';
    }
    qs = qs.substr(0,qs.length-1);

    var sig = document.createElement('input');
    sig.type = 'hidden';
    sig.name = '__csrf';
    f.appendChild(sig);

    queue[++c] = function(s){
     f.__signed = true;
     sig.value = s;
     f.submit();
    }
    parser.href = f.action;
    var url = parser.origin+parser.pathname+qs;
    sigRequest(c, 'GET', url);

    // Delay until form is signed
    e.preventDefault();
   });

   f.__csrfOK = true;
  };

  var attachAttr = function(tag) {
   ['src','href','action'].forEach(function(x){
    var n = tag.querySelectorAll('* ['+x+']');
    for(var i=0; i<n.length; i++)
    {
     var t = n[i];
     if(t.tagName == 'FORM' && t.method != 'post')
      checkForm(t);
     else
      fixattr(t, x);
    }
   });
  };

  var observer = new MutationObserver(function(mutations) {
   mutations.forEach(function(mutation) {
    if(mutation.type == 'childList')
     attachAttr(mutation.target);
    else
    {
     var t = mutation.target, x = mutation.attributeName;

     if(t.tagName == 'FORM' && x == 'method')
     {
      if(t.method == 'post') attachAttr(t);
      else checkForm(t);
      return;
     }

     if(t.tagName != 'FORM' || t.method == 'post')
      fixattr(t, x);
    }
   });
  });
 
  var config = {
   attributes: true,
   childList: true,
   subtree: true,
   characterData: false,
   attributeFilter: ['src','href','action','method']
  };

  observer.observe(document, config);

  var XHRopen = XMLHttpRequest.prototype.open;
  var XHRsend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
   var sign = checkattr(url), _this=this;
   if(!sign) {
    XHRopen.apply(_this, arguments);
    this.__ready = true;
    return;
   };

   this.__ready = false;
   queue[++c] = function(sig){
    XHRopen.apply(_this, [method, url+'?'+sig, async, user, pass]);
    _this.__ready = true;
   };

   console.log('AJAX sig request for '+sign);
   sigRequest(c, method.toUpperCase(), sign);
  };

  // open is synchronous
  // must wait for signature equest to complete before sending AJAX
  XMLHttpRequest.prototype.send = function(){
   var args = arguments, _this = this;
   (function d(){
    if(_this.__ready)
     XHRsend.apply(_this, args);
    else
     setTimeout(d, 10);
   })();
  }

  // Add GET form handlers
  var fr = document.forms;
  for(var i = 0; i<fr.length; i++)
   checkForm(fr[i]);
 });

})();


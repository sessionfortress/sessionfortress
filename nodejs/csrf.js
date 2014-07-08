(function(){
 var c = -1;
 var queue = [];
 var loginorigin = '@LOGIN_ORIGIN@';
 var topdomain = '@TOP_DOMAIN@';
 var parser = document.createElement('a');

 var isrelated = function(x){
  return x.substr(x.length-topdomain.length)==topdomain;
 }

 var checkattr = function(x){
  parser.href = x;
  if(parser.search.match(/\?[a-z0-9._-]{80,}$/i)) return false;
  if(parser.protocol != 'https:') return false;
  if(!isrelated(parser.hostname)) return false;
  if(parser.origin == loginorigin) return false;
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
  }

  var fixattr = function(tag, attr){
   var v = tag.getAttribute(attr);
   var url = checkattr(v);
   if(!url) return;
   queue[++c] = function(sig){
    tag.setAttribute(attr, v+'?'+sig);
   }
   sigRequest(c, attr == 'action' ? 'POST' : 'GET', url);
  }

 var attachAttr = function(tag) {
  ['src','href','action'].forEach(function(x){
   var n = tag.querySelectorAll('* ['+x+']');
   for(var i=0; i<n.length; i++)
   {
    var t = n[i];
    if(t.tagName == 'FORM' && x == 'action' && t.method != 'post')
    {
     // GET FORM
    }
    else fixattr(t, x);
   }
  });
 }

  var observer = new MutationObserver(function(mutations) {
   mutations.forEach(function(mutation) {
    if(mutation.type == 'childList')
     attachAttr(mutation.target);
    else
    {
//     var t = mutation.target, x = mutation.attributeName;
//     if(t.tagName != 'FORM' || t.method == 'post')
//      fixattr(t, x);
    }
   });
  });
 
  var config = {
   attributes: true,
   childList: true,
   subtree: true,
   characterData: false,
   attributeFilter: ['src','href','action']
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
   }

   this.__ready = false;
   queue[++c] = function(sig){
    XHRopen.apply(_this, [method, url+'?'+sig, async, user, pass]);
    _this.__ready = true;
   }

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
 });

})();


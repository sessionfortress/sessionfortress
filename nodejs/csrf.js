(function(){
 var c = 0;
 var queue = [];

 window.addEventListener('message', function(e){
  if(e.origin != 'https://acsac.ht.vc')
   return;
  var o = JSON.parse(e.data);
  queue[o.id](o.sig);
  delete queue[o.id];
 });

 window.addEventListener('load', function() {
  var w = document.querySelector("#csrf-frame").contentWindow;

  var observer = new MutationObserver(function(mutations) {
   mutations.forEach(function(mutation) {
    console.dir(mutation);
   });    
  });
 
  var config = {
   attributes: true,
   childList: true,
   subtree: true,
   characterData: false,
   attributeFilter: ['src','href']
  };

  observer.observe(document, config);
 });

})(); 

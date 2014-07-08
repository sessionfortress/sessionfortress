//window.addEventListener('load',
(function(){
 var c = document.getElementsByTagName('form');
 var key = "@CSRF_KEY@";
 var timeDrift = @SERVER_TIME@ - new Date().valueOf();

 for(var i = 0; i < c.length; i++)
 {
  var form = c[i];

  if(form.method != "post"
      || form.querySelectorAll("input[type='password']").length < 1)
   continue;

  form.action = '/login';
  var hidden = document.createElement("input");
  hidden.setAttribute("type", "hidden");
  hidden.setAttribute("name", "__csrfKey__");
  hidden.setAttribute("value", key);
  form.appendChild(hidden);
 }

 for(var i = 0; i < document.forms.length; i++)
 {
  document.forms[i].addEventListener('submit',
   function(){
    localStorage.CSRF = key;
    localStorage.created = new Date().valueOf();
    localStorage.drift = timeDrift;
   }
  );
 }
})();
//});

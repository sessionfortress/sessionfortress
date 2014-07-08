<?php

if(isset($_COOKIE['PHPSESSID']))
{
 session_start();
 if(!$_SESSION['time'])
 {
  setCookie('PHPSESSID','',time()-20000);
  session_destroy();
  $login = 0;
 }
 else $login = $_SESSION['time'];
}
else $login = 0;

if(isset($_GET['ajax']))
{
 header('Content-Type: application/json');
 if(!$login) die('{"error":"You must be logged in!"}');
 die('{"error":"", "result":'.time().'}');
}

if(isset($_POST['a']) && $login)
{
 die("<h1>Success!</h1><p>Wire of ".(int)$_POST['a'].' sent</p><a href="/">Back</a>');
}
?><!doctype html>
<html>
<head>
 <title>Test</title>
</head>
<body>
<h1>Hello</h1>
<?php
if(!$login)
{
 echo "Click <a href=login.php>here to login</a>";
}
else
{
 echo '<p>You logged in on '.date('d M Y h:i').'</p>';
?>
<fieldset><legend>POST form (static)</legend>
<form action="index.php" method="post">
Make wire transfer: <input type="text" size="10" name="a" /><br />
<input type="submit" />
</form>
</fieldset>

<fieldset><legend>GET form (dynamic)</legend>
<form action="index.php" method="get">
<p id="gf"></p>
<input type="button" value="Add field" onclick="var a = document.createElement('input');a.type='text';a.name='field'+(1000*Math.random()|0);document.getElementById('gf').appendChild(a);" />
<input type="submit" />
</form>
<pre>Current GET parameters: <?=htmlspecialchars(var_export($_GET,1))?></pre>
</fieldset>

<fieldset><legend>Dynamic DOM mutations</legend>
<p>N.B. The authenticated_paths configuration may affect the rewriting of inserted links</p>
<input type="text" value="/test.php" size="50" id="v" />
<input type="button" value="Insert link" onclick="var x = document.getElementById('v').value;var a = document.createElement('a');a.href=x;a.innerHTML='Test link<br />';document.getElementById('t').appendChild(a);" />
<p id="t">

</p>
</fieldset>

<fieldset><legend>XMLHttpRequest</legend>
<p><input type="text" id="ajp" value="/?ajax" placeholder="Path of AJAX" /></p>
<textarea rows="5" id="ajaxr" placeholder="Result of AJAX"></textarea><br />
<input type="button" value="Run authenticated AJAX" onclick="var x = new XMLHttpRequest();x.open('GET',document.getElementById('ajp').value);x.onload=function(){document.getElementById('ajaxr').value=x.responseText};x.send()" />
</fieldset>
<p>
<a href='login.php?logout'>Logout</a>
</p>
<?php
}
?>
</body>
</html>


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
 die("Success! Wire of ".(int)$_POST['a']);
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

<fieldset><legend>Dynamic DOM mutations</legend>
<input type="text" value="/test" size="50" id="v" />
<input type="button" value="Insert link" onclick="var x = document.getElementById('v').value;var a = document.createElement('a');a.href=x;a.innerHTML='Test link<br />';document.getElementById('t').appendChild(a);" />
<p id="t">

</p>
</fieldset>

<fieldset><legend>XMLHttpRequest</legend>
<textarea rows="5" id="ajaxr"></textarea><br />
<input type="button" value="Run authenticated AJAX" onclick="var x = new XMLHttpRequest();x.open('GET','/?ajax');x.onload=function(){document.getElementById('ajaxr').value=x.responseText};x.send()" />
</fieldset>
<p>
<a href='login.php?logout'>Logout</a>
</p>
<?php
}
?>
</body>
</html>


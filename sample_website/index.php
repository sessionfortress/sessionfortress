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
<form action="index.php" method="post">
Make wire transfer: <input type="text" size="10" name="a" /><br />
<input type="submit" />
</form>
<p>
<a href='login.php?logout'>Logout</a>
</p>
<?php
}
?>
</body>
</html>


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

?><!doctype html>
<html>
<head>
 <title>Test</title>
</head>
<body>
<h1>Hello</h1>
<?php
if($login)
{
 echo 'You logged in on '.date('d M Y h:i');
}
else echo "Click <a href=login.php>here to login</a>";
?>
</body>
</html>


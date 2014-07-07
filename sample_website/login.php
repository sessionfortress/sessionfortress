<?php
session_set_cookie_params(60*60, '/', '.ht.vc');
if(isset($_POST['user'],$_POST['password']))
{
 if($_POST['user'] == 'a' && $_POST['password'] == 'a')
 {
  session_start();
  $_SESSION['time']=time();
  die(header('Location: /'));
 }
}
session_destroy();
setCookie('PHPSESSID','',time()-3600);
?>
<!doctype html>
<html>
<head>
 <title>Test</title>
</head>
<body>
<form method="POST" action="login.php">
 <input type="text" name="user" /><br />
 <input type="password" name="password" /><br />
 <input type="submit" />
</form>
</body>
</html>

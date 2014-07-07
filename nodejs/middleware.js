var https = require('https');
var fs = require('fs');
var crypto = require('crypto');
var url = require("url");
var qs = require('querystring');
var httpProxy = require('http-proxy');
var djcl = require('./djcl.js');
var conf = require('./config.js');

var loginscript = fs.readFileSync('login.js').toString('utf-8');
var injected = fs.readFileSync('csrf.js');
var frame = fs.readFileSync('csrf.html');

/*********** END OF CONFIGURATION ***************/

var DB = {};
var login = url.parse(conf.login_page);

var genkey = function(len){
  return crypto.randomBytes(len || 16).toString('hex');
};

var ct = {};
for(var c in conf.certificates)
{
 var co = conf.certificates[c];
 ct['^'+c.replace(/\./g,"\\.").replace(/\*/g,'[^.]+')+'$']
	= crypto.createCredentials({
                cert: fs.readFileSync(co.cert),
                key: fs.readFileSync(co.key)
        }).context;
}

var tls_options = {
	cert: fs.readFileSync(conf.certificates.__DEFAULT__.cert),
	key: fs.readFileSync(conf.certificates.__DEFAULT__.key),
	SNICallback: function (host) {
		var c = conf.certificates;
		for(var i in ct)
			if(new RegExp(i).test(host)) return ct[i];
        }
};

var srv = https.createServer(tls_options);
var proxy = httpProxy.createProxyServer({target:conf.backend_server});

srv.on('request', function (req, res) {
  req.setEncoding('utf8');

  if(!/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})(:[0-9]{1,5})?$/.test(req.headers['host']))
  {
   res.writeHead(400);
   res.end('Bad request');
   return;
  }

  var host = req.headers['host'];
  var u = url.parse("https://"+host+req.url);

  if(u.hostname == login.hostname && u.pathname == login.pathname)
  {
   res.writeHead(302, "Found", {'location':'https://'+conf.login_domain+':'+conf.local_port+'/login'});
   res.end("Redirecting ...");
   return;
  }

  if(u.hostname == conf.login_domain)
  {
   console.log("Login origin request: "+req.url);
   if(u.pathname == "/csrf-frame") {
    res.writeHead(200, "Found", {"X-Frame-Options": "allow"});
    res.end(frame);
    return;
   }
   if(u.pathname == "/login") {
    var lurl = conf.login_page + (u.query ? u.query : "");
    var ref = url.parse(req.headers['origin'] ? req.headers['origin'] :
               (req.headers['referer'] ? req.headers['referer'] : ""));

    if(req.method == 'POST' && ref.hostname != conf.login_domain)
    {
     res.writeHead(403, "Login CSRF");
     res.end("This login form can only be submitted through https://"+conf.login_domain);
     return;
    }

    var body = '';
    req.on('data', function (c) {
     body += c;
     if(body.length > conf.max_post_size){
      req.connection.destroy();
      body = '';
     }
    });

    req.on('end', function () {
     var fields = qs.parse(body);
     var opt = url.parse(lurl);
     opt.method = req.method == 'POST' ? 'POST' : 'GET';
     if(req.method == 'POST')
      opt.headers = {'Content-Length': Buffer.byteLength(body),
       'Content-Type':'application/x-www-form-urlencoded'}; 

     https.request(opt, function(r){
      r.setEncoding('utf8');
      delete r.headers['content-length'];
      var failed = r.statusCode == 200;
      var key = genkey(), nonce = genkey(6);
      var SID = '';

      if(!failed) {
       r.headers['set-cookie'].forEach(function(x){
        x = x.split(/\s*;\s*/);
        var nv = x[0].split(/\s*=\s*/);
        if(nv[0].match(conf.session_cookie)) {
         SID += nv[1];
        }
       });

       if(SID)
        DB[SID] = {key: fields.__csrfKey__, time: new Date()};
       console.dir(DB);

       var to = url.parse(r.headers['location']);
       delete to.host;
       to.hostname = login.hostname;
       to.protocol = 'https:';
       to.port = conf.local_port;
       to = url.format(to);
       r.headers['location'] = to+'?'+djcl.JWT.create('GET|'+to,DB[SID].key);
      }

      r.headers['x-frame-options'] = 'deny';
      r.headers['strict-transport-security'] = 'max-age=9999999;';
      r.headers['content-security-policy-report-only'] = conf.login_csp.replace('000000000000',nonce);

      res.writeHead(r.statusCode, "OK", r.headers);

      r.on('data', function(c) {
       res.write(c);
      }).on('end', function(){
       res.end(failed ?
        '<script nonce="'+nonce+'">'
        +loginscript.replace("00000000000000000000000000000000",key)
        +"</script>"
       : undefined);
      });
     }).end(req.method == 'POST' ? body : undefined);
    });
    return;
   }

   res.writeHead(404);
   res.end('Not found');
   return;
  }

  // Processing of website requests

  var authenticated = false;
  var cookies = req.headers['cookie'] || '';
  cookies = cookies.split(/\s*;\s*/);
  var filtered = '';
  var SID = '';

  cookies.forEach(function(c){
   var x = c.split(/\s*=\s*/);
   if(x[0].match(conf.session_cookie))
    SID += x[1];
   else
    filtered += c+';';
  });

  if(!conf.authenticated_paths || u.pathname.match(conf.authenticated_paths))
  {
   var m = req.url.match(/\?[a-zA-Z0-9._-]+$/);
   if(m)
   {
    m = m[0].substr(1);
    req.url = req.url.replace('?'+m, '');

    var o = req.method+"|https://"+host+req.url;
    var sig = djcl.JWT.parse(m, SID in DB ? DB[SID].key : '');

    if(SID && SID in DB && sig.valid && sig.claims === o)
    {
     console.log('Correct signature '+m+' for '+o+' with '+DB[SID].key);
     authenticated = true;
    }
    else
    {
     console.log('Bad signature ' + m + ' for ' + o + ' with ' + (SID in DB ? DB[SID].key : '')+' of '+SID);
    }
   }
  }

  if(authenticated)
  {
   res.writeHead(200);
   res.end('Request correctly authenticated');
   return;
  }
  else
  {
   req.headers['cookie'] = filtered;
   proxy.web(req, res);
  }
});

srv.listen(conf.local_port);
